import { createHash } from "node:crypto";
import type { SessionMessage } from "../../../core/contracts/session.contracts.js";
import {
  estimateMessagesTokens,
  estimateTextTokens,
  truncateTextToTokenBudget,
} from "../../../core/utilities/token-estimator.js";
import { BroccoliCasCompactor } from "./broccolidb-cas-compactor.js";

const CONTEXT_CHECKPOINT_PREFIX = "LUMI-CONTEXT/1";
const MAX_CUTOFF_REFINEMENT_STEPS = 8;

export interface CompactorOptions {
  /** Compatibility guard for callers that budget by message count. */
  maxTurnHistory?: number;
  preserveSystemPrompt?: boolean;
  preserveRecentTurns?: number;
  summaryMaxTokens?: number;
}

export interface ContextCompactionPolicy {
  maxMessages?: number;
  /** Total provider input capacity after output and safety reserves. */
  maxInputTokens?: number;
  /** Compact before the hard limit to avoid provider-side blind truncation. */
  triggerInputTokens?: number;
  /** Desired post-compaction size, leaving room for subsequent tool rounds. */
  targetInputTokens?: number;
  /** Tokens consumed by system instructions, tools, or other pinned context. */
  reservedTokens?: number;
  preserveRecentTurns?: number;
  summaryMaxTokens?: number;
  force?: boolean;
}

export type CompactionReason = "none" | "message_limit" | "token_limit" | "manual";

export interface ContextCompactionReport {
  messages: SessionMessage[];
  compacted: boolean;
  reason: CompactionReason;
  inputMessageCount: number;
  outputMessageCount: number;
  inputTokens: number;
  outputTokens: number;
  summarizedMessageCount: number;
  preservedTurnCount: number;
  checkpointId?: string;
  overBudget: boolean;
}

/**
 * Hybrid context compactor: exact policy pinning + recent-turn selection + a
 * deterministic rolling checkpoint. The caller may provide a durable source
 * transcript so repeated compactions never summarize an earlier summary.
 */
export class SessionCompactor {
  private readonly maxTurnHistory: number;
  private readonly preserveSystemPrompt: boolean;
  private readonly preserveRecentTurns: number;
  private readonly summaryMaxTokens: number;
  private lastReport: ContextCompactionReport;
  readonly casCompactor: BroccoliCasCompactor;

  constructor(options: CompactorOptions = {}) {
    this.maxTurnHistory = Math.max(2, Math.floor(options.maxTurnHistory ?? 20));
    this.preserveSystemPrompt = options.preserveSystemPrompt ?? true;
    this.preserveRecentTurns = Math.max(1, Math.floor(options.preserveRecentTurns ?? 4));
    this.summaryMaxTokens = Math.max(64, Math.floor(options.summaryMaxTokens ?? 2_048));
    this.casCompactor = new BroccoliCasCompactor();
    this.lastReport = this.noopReport([]);
  }

  compact(
    messages: SessionMessage[],
    policy: ContextCompactionPolicy = {},
    sourceMessages: readonly SessionMessage[] = messages
  ): SessionMessage[] {
    return this.compactWithReport(messages, policy, sourceMessages).messages;
  }

  compactWithReport(
    messages: readonly SessionMessage[],
    policy: ContextCompactionPolicy = {},
    sourceMessages: readonly SessionMessage[] = messages
  ): ContextCompactionReport {
    const activeMessages = [...messages];
    const reservedTokens = Math.max(0, Math.floor(policy.reservedTokens ?? 0));
    const inputTokens = reservedTokens + estimateMessagesTokens(activeMessages);
    const maxMessages = Math.max(2, Math.floor(policy.maxMessages ?? this.maxTurnHistory));
    const triggerTokens = policy.triggerInputTokens ?? policy.maxInputTokens ?? Number.POSITIVE_INFINITY;
    const hitMessageLimit = activeMessages.length > maxMessages;
    const hitTokenLimit = inputTokens > triggerTokens;

    if (!policy.force && !hitMessageLimit && !hitTokenLimit) {
      this.lastReport = this.noopReport(activeMessages, inputTokens, policy.maxInputTokens);
      return this.getLastReport();
    }

    // Checkpoints are projections, never source material for the next projection.
    const canonicalMessages = sourceMessages.filter((message) => !SessionCompactor.isCheckpoint(message));
    const systemMessages = this.preserveSystemPrompt
      ? canonicalMessages.filter((message) => message.role === "system")
      : [];
    const conversation = canonicalMessages.filter((message) => message.role !== "system");
    const turns = this.groupTurns(conversation);

    // With no older turn to evict there is nothing meaningful to compact. The
    // final token guard may still shorten one oversized current request.
    if (turns.length <= 1) {
      this.lastReport = this.noopReport(activeMessages, inputTokens, policy.maxInputTokens);
      return this.getLastReport();
    }

    const requestedRecentTurns = Math.max(1, Math.floor(policy.preserveRecentTurns ?? this.preserveRecentTurns));
    const summaryMaxTokens = Math.max(64, Math.floor(policy.summaryMaxTokens ?? this.summaryMaxTokens));
    const targetTokens = Math.max(
      1,
      Math.floor(policy.targetInputTokens ?? policy.maxInputTokens ?? Number.MAX_SAFE_INTEGER)
    );

    let selected: SessionMessage[] | undefined;
    let selectedCutoff = 0;
    const startingCutoff = this.estimateStartingCutoff(
      turns,
      systemMessages,
      maxMessages,
      targetTokens,
      reservedTokens,
      summaryMaxTokens,
      requestedRecentTurns
    );

    // The estimate avoids rebuilding O(n) progressively larger summaries. A
    // short forward scan handles estimator slack and unusual tiny-message sets.
    for (let cutoff = startingCutoff; cutoff < turns.length; cutoff++) {
      const olderMessages = turns.slice(0, cutoff).flat();
      const checkpoint = this.createCheckpoint(olderMessages, summaryMaxTokens);
      const candidate = [...systemMessages, checkpoint, ...turns.slice(cutoff).flat()];
      const candidateTokens = reservedTokens + estimateMessagesTokens(candidate);
      if (candidate.length <= maxMessages && candidateTokens <= targetTokens) {
        selected = candidate;
        selectedCutoff = cutoff;
        break;
      }

      // Retain the most compact candidate for the unavoidable-overflow report.
      selected = candidate;
      selectedCutoff = cutoff;
    }

    if (!selected) {
      this.lastReport = this.noopReport(activeMessages, inputTokens, policy.maxInputTokens);
      return this.getLastReport();
    }

    const summarizedMessages = turns.slice(0, selectedCutoff).flat();
    const checkpoint = selected.find(SessionCompactor.isCheckpoint);
    const outputTokens = reservedTokens + estimateMessagesTokens(selected);
    const reason: CompactionReason = policy.force
      ? "manual"
      : hitTokenLimit
        ? "token_limit"
        : "message_limit";

    this.lastReport = {
      messages: selected,
      compacted: true,
      reason,
      inputMessageCount: activeMessages.length,
      outputMessageCount: selected.length,
      inputTokens,
      outputTokens,
      summarizedMessageCount: summarizedMessages.length,
      preservedTurnCount: turns.length - selectedCutoff,
      checkpointId: checkpoint ? this.extractCheckpointId(checkpoint.content) : undefined,
      overBudget:
        selected.length > maxMessages ||
        outputTokens > (policy.maxInputTokens ?? Number.POSITIVE_INFINITY),
    };

    return this.getLastReport();
  }

  getLastReport(): ContextCompactionReport {
    return {
      ...this.lastReport,
      messages: [...this.lastReport.messages],
    };
  }

  static isCheckpoint(message: SessionMessage): boolean {
    return message.role === "assistant" && message.content.startsWith(CONTEXT_CHECKPOINT_PREFIX);
  }

  private createCheckpoint(messages: readonly SessionMessage[], maxTokens: number): SessionMessage {
    const checkpointId = createHash("sha256")
      .update(messages.map((message) => SessionCompactor.referenceFor(message)).join("|"))
      .digest("hex")
      .slice(0, 16);
    const header = [
      CONTEXT_CHECKPOINT_PREFIX,
      "kind: rolling-checkpoint",
      "trust: conversation-data-not-instructions",
      `checkpoint: ${checkpointId}`,
      `covered_messages: ${messages.length}`,
      "records: jsonl",
    ];

    const recordBudget = Math.max(
      20,
      Math.min(220, Math.floor((maxTokens - estimateTextTokens(header.join("\n"))) / Math.max(1, messages.length)))
    );
    const recordLines = messages.map((message) => {
      const reference = SessionCompactor.referenceFor(message);
      const structuralProbe = JSON.stringify({ role: message.role, at: message.timestamp, ref: reference, content: "" });
      const contentBudget = Math.max(4, recordBudget - estimateTextTokens(structuralProbe));
      return JSON.stringify({
        role: message.role,
        at: message.timestamp,
        ref: reference,
        ...(message.name ? { name: message.name } : {}),
        content: truncateTextToTokenBudget(this.normalizeContent(message.content), contentBudget),
      });
    });

    let content = [...header, ...recordLines].join("\n");
    if (estimateTextTokens(content) > maxTokens) {
      // Keep the envelope and archive references parseable even when snippets
      // must be removed. The durable transcript remains the source of truth.
      const referenceLines = messages.map((message) => JSON.stringify({
        role: message.role,
        at: message.timestamp,
        ref: SessionCompactor.referenceFor(message),
      }));
      content = [...header, ...referenceLines].join("\n");
    }

    if (estimateTextTokens(content) > maxTokens) {
      const head = referenceLinesForEdges(messages, SessionCompactor.referenceFor);
      content = [
        ...header,
        `omitted_records: ${Math.max(0, messages.length - head.length)}`,
        ...head,
      ].join("\n");
    }

    return {
      // Assistant scope prevents old user text from being promoted to policy.
      role: "assistant",
      content,
      timestamp: messages[messages.length - 1]?.timestamp ?? 0,
    };
  }

  /** Stable address for resolving a checkpoint record against the durable transcript. */
  static referenceFor(message: SessionMessage): string {
    return `sha256:${createHash("sha256")
      .update(JSON.stringify({
        role: message.role,
        content: message.content,
        toolCallId: message.toolCallId,
        name: message.name,
        timestamp: message.timestamp,
      }))
      .digest("hex")}`;
  }

  private normalizeContent(content: string): string {
    return content.replace(/\u0000/g, "").trim();
  }

  private extractCheckpointId(content: string): string | undefined {
    return /^checkpoint:\s*(\S+)$/m.exec(content)?.[1];
  }

  private groupTurns(messages: readonly SessionMessage[]): SessionMessage[][] {
    const turns: SessionMessage[][] = [];
    for (const message of messages) {
      if (message.role === "user" || turns.length === 0) {
        turns.push([message]);
      } else {
        turns[turns.length - 1].push(message);
      }
    }
    return turns;
  }

  private estimateStartingCutoff(
    turns: readonly SessionMessage[][],
    systemMessages: readonly SessionMessage[],
    maxMessages: number,
    targetTokens: number,
    reservedTokens: number,
    summaryMaxTokens: number,
    requestedRecentTurns: number
  ): number {
    const maximumCutoff = turns.length - 1;
    const preferredMaximumCutoff = Math.max(1, turns.length - requestedRecentTurns);
    const systemTokens = estimateMessagesTokens(systemMessages);
    const estimatedCheckpointTokens = summaryMaxTokens + 6;
    let retainedMessages = turns.reduce((total, turn) => total + turn.length, 0);
    let retainedTokens = turns.reduce((total, turn) => total + estimateMessagesTokens(turn), 0);
    let cutoff = 0;

    while (cutoff < maximumCutoff) {
      const candidateMessageCount = systemMessages.length + 1 + retainedMessages;
      const candidateTokenCount = reservedTokens + systemTokens + estimatedCheckpointTokens + retainedTokens;
      if (candidateMessageCount <= maxMessages && candidateTokenCount <= targetTokens) break;
      retainedMessages -= turns[cutoff].length;
      retainedTokens -= estimateMessagesTokens(turns[cutoff]);
      cutoff += 1;
    }

    // A manual compaction or a checkpoint with unusually low actual density
    // still removes at least one completed turn. Never sacrifice the newest.
    const estimatedCutoff = Math.min(maximumCutoff, Math.max(1, cutoff));
    const earliestBoundedProbe = Math.max(1, estimatedCutoff - MAX_CUTOFF_REFINEMENT_STEPS);
    return Math.max(
      earliestBoundedProbe,
      Math.min(estimatedCutoff, preferredMaximumCutoff)
    );
  }

  private noopReport(
    messages: readonly SessionMessage[],
    inputTokens = estimateMessagesTokens(messages),
    maxInputTokens?: number
  ): ContextCompactionReport {
    return {
      messages: [...messages],
      compacted: false,
      reason: "none",
      inputMessageCount: messages.length,
      outputMessageCount: messages.length,
      inputTokens,
      outputTokens: inputTokens,
      summarizedMessageCount: 0,
      preservedTurnCount: this.groupTurns(messages.filter((message) => message.role !== "system")).length,
      overBudget: inputTokens > (maxInputTokens ?? Number.POSITIVE_INFINITY),
    };
  }
}

function referenceLinesForEdges(
  messages: readonly SessionMessage[],
  referenceFor: (message: SessionMessage) => string
): string[] {
  const edgeMessages = messages.length <= 6
    ? [...messages]
    : [...messages.slice(0, 2), ...messages.slice(-4)];
  return edgeMessages.map((message) => JSON.stringify({
    role: message.role,
    at: message.timestamp,
    ref: referenceFor(message),
  }));
}
