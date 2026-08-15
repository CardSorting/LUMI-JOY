import * as path from "node:path";
import type { ThreadEvent, ThreadItem, Usage } from "@openai/codex-sdk";
import type {
  EngineProgressEvent,
  EngineProgressMetadata,
  EngineProgressStatus,
} from "../../../core/contracts/agent.contracts.js";
import { sanitizeProgressText } from "../../../core/utilities/progress-sanitizer.js";

const MAX_MESSAGE_LENGTH = 96;
const MAX_DETAIL_LENGTH = 220;
const MAX_COMMAND_LENGTH = 180;

export interface CodexProgressAdapterOptions {
  cwd: string;
  model: string;
  onProgress?: (event: EngineProgressEvent) => void;
  now?: () => number;
  /** One-based retry attempt number for diagnostics. */
  attempt?: number;
  /** Keeps a retriable provider failure from terminating the overall turn. */
  deferFailure?: boolean;
  /** Shared turn-level sequencer; required when multiple attempts are visible. */
  nextSequence?: () => number;
  /** Stable logical turn identity shared across provider attempts. */
  turnActivityId?: string;
}

/**
 * Converts the Codex SDK event stream into a stable, safe activity lifecycle.
 * Provider item IDs are preserved inside attempt-scoped identities so UIs can
 * upsert lifecycle events without collisions across retries.
 */
export class CodexProgressAdapter {
  private readonly cwd: string;
  private readonly model: string;
  private readonly onProgress?: (event: EngineProgressEvent) => void;
  private readonly now: () => number;
  private readonly attempt: number;
  private readonly deferFailure: boolean;
  private readonly nextSequence?: () => number;
  private readonly turnActivityId: string;
  private readonly turnStartedAt: number;
  private readonly itemStartedAt = new Map<string, number>();
  private readonly lastPayloadByActivity = new Map<string, string>();
  private readonly changedFiles = new Set<string>();
  private readonly countedCommands = new Set<string>();
  private readonly countedTools = new Set<string>();
  private sequence = 0;
  private commandCount = 0;
  private toolCount = 0;
  private terminal = false;
  private reasoningDurationMs = 0;
  private toolDurationMs = 0;
  private peakInactivityMs = 0;
  private heartbeatCount = 0;

  constructor(options: CodexProgressAdapterOptions) {
    this.cwd = path.resolve(options.cwd);
    this.model = options.model;
    this.onProgress = options.onProgress;
    this.now = options.now ?? Date.now;
    this.attempt = Math.max(1, options.attempt ?? 1);
    this.deferFailure = options.deferFailure ?? false;
    this.nextSequence = options.nextSequence;
    this.turnActivityId = options.turnActivityId ?? "codex:turn";
    this.turnStartedAt = this.now();
  }

  start(): void {
    this.emit({
      activityId: `codex:connection:${this.attempt}`,
      phase: "connecting",
      status: this.attempt === 1 ? "started" : "in_progress",
      message: this.attempt === 1 ? "Starting Codex agent" : "Retrying Codex connection",
      detail: this.model,
      metadata: this.activityMetadata(),
    });
  }

  handle(event: ThreadEvent): void {
    if (this.terminal) return;
    switch (event.type) {
      case "thread.started":
        this.emit({
          activityId: `codex:connection:${this.attempt}`,
          phase: "connecting",
          status: "completed",
          message: "Connected to Codex",
          detail: this.model,
          elapsedMs: this.elapsedSinceTurnStart(),
          metadata: this.activityMetadata(),
        });
        return;
      case "turn.started":
        this.emit({
          activityId: this.turnActivityId,
          phase: "thinking",
          status: this.attempt === 1 ? "started" : "in_progress",
          message: this.attempt === 1 ? "Analyzing the request" : "Re-analyzing after failover",
          detail: this.attempt === 1
            ? "Understanding goals and workspace context"
            : `Provider attempt ${this.attempt}`,
          metadata: this.turnMetadata(),
        });
        return;
      case "turn.completed":
        this.completeTurn(event.usage);
        return;
      case "turn.failed":
        this.fail("Agent turn failed", event.error.message);
        return;
      case "error":
        this.fail("Agent connection failed", event.message);
        return;
      case "item.started":
      case "item.updated":
      case "item.completed":
        this.handleItem(event.type, event.item);
        return;
    }
  }

  cancel(message = "Agent turn cancelled by user"): void {
    this.finish("cancelled", "cancelled", "Agent turn cancelled", message);
  }

  timeout(message = "The agent exceeded the turn limit"): void {
    this.finish("failed", "failed", "Agent turn timed out", message);
  }

  fail(message: string, detail?: string): void {
    const totalElapsed = this.elapsedSinceTurnStart();
    const telemetryDetail = detail
      ? `${detail} (Elapsed: ${this.formatDuration(totalElapsed)}, Peak idle: ${this.formatDuration(this.peakInactivityMs)})`
      : `Turn failed after ${this.formatDuration(totalElapsed)} (Peak idle: ${this.formatDuration(this.peakInactivityMs)})`;

    if (this.deferFailure) {
      this.finishAttempt(message, telemetryDetail);
      return;
    }
    this.finish("failed", "failed", message, telemetryDetail, {
      ...this.turnMetadata(),
      telemetry: {
        elapsedSec: Math.round(totalElapsed / 1000),
        peakInactivityMs: this.peakInactivityMs,
        reasoningTimeMs: this.reasoningDurationMs,
        toolTimeMs: this.toolDurationMs,
        commandsExecuted: this.commandCount,
        filesModified: this.changedFiles.size,
        streamHeartbeatCount: this.heartbeatCount,
      },
    });
  }

  /**
   * Receives periodic watchdog telemetry pulses and emits real-time status
   * updates during quiet or long-running stream operations.
   */
  recordHeartbeat(
    idleMs: number,
    timeoutThresholdMs: number,
    phase: "REASONING" | "TOOL_EXECUTION"
  ): void {
    if (this.terminal) return;
    this.peakInactivityMs = Math.max(this.peakInactivityMs, idleMs);
    this.heartbeatCount += 1;

    const totalElapsedMs = this.elapsedSinceTurnStart();
    const remainingBudgetMs = Math.max(0, timeoutThresholdMs - idleMs);

    // Emit an active status telemetry pulse when operations have been quiet for > 20s
    if (idleMs >= 20_000 && idleMs % 15_000 < 1500) {
      const phaseDesc = phase === "TOOL_EXECUTION" ? "Workspace tool execution" : "Model deliberation";
      this.emit({
        activityId: `codex:telemetry:${this.attempt}`,
        phase: phase === "TOOL_EXECUTION" ? "tool" : "thinking",
        status: "in_progress",
        message: `${phaseDesc} in progress (${this.formatDuration(totalElapsedMs)} elapsed)`,
        detail: `Stream quiet for ${this.formatDuration(idleMs)} · Watchdog budget remaining: ${this.formatDuration(remainingBudgetMs)}`,
        elapsedMs: totalElapsedMs,
        metadata: {
          ...this.turnMetadata(),
          telemetry: {
            elapsedSec: Math.round(totalElapsedMs / 1000),
            peakInactivityMs: this.peakInactivityMs,
            inactivityBudgetRemainingMs: remainingBudgetMs,
            streamHeartbeatCount: this.heartbeatCount,
          },
        },
      });
    }
  }

  private handleItem(
    lifecycle: "item.started" | "item.updated" | "item.completed",
    item: ThreadItem
  ): void {
    const activityId = `codex:item:${this.attempt}:${item.id}`;
    const timestamp = this.now();
    if (!this.itemStartedAt.has(activityId)) {
      this.itemStartedAt.set(activityId, timestamp);
    }
    const status = this.resolveItemStatus(lifecycle, item);
    const elapsedMs = timestamp - (this.itemStartedAt.get(activityId) ?? timestamp);

    switch (item.type) {
      case "reasoning": {
        // The SDK exposes this field as a readable reasoning summary, not raw
        // chain-of-thought. Keep it short and sanitized for the activity view.
        const cleanSummary = (item.text || "")
          .replace(/^#+\s+/gm, "")
          .replace(/\*\*/g, "")
          .trim();
        const reasoningDetail = cleanSummary || "Analyzing requirements & formulating next action";
        this.emit({
          activityId,
          phase: "thinking",
          status,
          message: status === "completed" ? "Reasoning complete" : "Analyzing next action",
          detail: reasoningDetail,
          elapsedMs,
          metadata: this.activityMetadata({ itemType: item.type }),
        });
        return;
      }
      case "todo_list": {
        const completedSteps = item.items.filter((todo) => todo.completed).length;
        const nextStep = item.items.find((todo) => !todo.completed)?.text;
        const statusLabel =
          status === "completed"
            ? `Plan completed (${completedSteps}/${item.items.length} steps)`
            : `Executing plan [${completedSteps}/${item.items.length}]`;
        const detailText = nextStep ? `Active step: "${nextStep}"` : `Completed ${completedSteps}/${item.items.length} steps`;
        this.emit({
          activityId,
          phase: "planning",
          status,
          message: statusLabel,
          detail: detailText,
          elapsedMs,
          metadata: {
            ...this.activityMetadata(),
            itemType: item.type,
            completedSteps,
            totalSteps: item.items.length,
          },
        });
        return;
      }
      case "command_execution": {
        if (!this.countedCommands.has(activityId)) {
          this.countedCommands.add(activityId);
          this.commandCount += 1;
        }
        const failed = status === "failed";
        const intent = this.describeCommandIntent(item.command);
        this.emit({
          activityId,
          phase: failed ? "failed" : "tool",
          status,
          message: failed
            ? `${intent} failed`
            : status === "completed"
              ? `${intent} complete`
              : intent,
          detail: sanitizeProgressText(item.command, MAX_COMMAND_LENGTH),
          elapsedMs,
          metadata: {
            ...this.activityMetadata(),
            itemType: item.type,
            ...(item.exit_code === undefined ? {} : { exitCode: item.exit_code }),
          },
        });
        return;
      }
      case "file_change": {
        const files = item.changes.map((change) => this.safePath(change.path));
        if (lifecycle === "item.completed" && item.status === "completed") {
          files.forEach((file) => this.changedFiles.add(file));
        }
        const changeSummary = item.changes
          .slice(0, 3)
          .map((change, index) => `${change.kind} ${files[index]}`);
        if (item.changes.length > 3) {
          changeSummary.push(`+${item.changes.length - 3} more`);
        }
        const firstKind = String(item.changes[0]?.kind ?? "").toLowerCase();
        const actionVerb = firstKind.includes("add") || firstKind.includes("creat")
          ? "Creating"
          : firstKind.includes("del") || firstKind.includes("remov")
            ? "Deleting"
            : "Updating";
        const actionDesc =
          item.changes.length === 1
            ? `${actionVerb} ${files[0]}`
            : `Updating ${item.changes.length} workspace files`;

        this.emit({
          activityId,
          phase: status === "failed" ? "failed" : "writing",
          status,
          message: status === "failed"
            ? "File changes failed"
            : status === "completed"
              ? (item.changes.length === 1 ? `Updated ${files[0]}` : "Workspace files updated")
              : actionDesc,
          detail: changeSummary.join(" · ") || "Workspace update",
          elapsedMs,
          metadata: this.activityMetadata({ itemType: item.type, files }),
        });
        return;
      }
      case "mcp_tool_call": {
        if (!this.countedTools.has(activityId)) {
          this.countedTools.add(activityId);
          this.toolCount += 1;
        }
        const toolAction = this.describeToolAction(item.server, item.tool);
        const toolName = `${sanitizeProgressText(item.server, 60)}/${sanitizeProgressText(item.tool, 60)}`;
        this.emit({
          activityId,
          phase: status === "failed" ? "failed" : "tool",
          status,
          message: status === "failed"
            ? `${toolAction} failed`
            : status === "completed"
              ? `${toolAction} complete`
              : toolAction,
          detail: toolName,
          elapsedMs,
          metadata: this.activityMetadata({ itemType: item.type }),
        });
        return;
      }
      case "web_search":
        this.emit({
          activityId,
          phase: "tool",
          status,
          message: status === "completed" ? "Web search complete" : "Searching the web",
          detail: item.query,
          elapsedMs,
          metadata: this.activityMetadata({ itemType: item.type }),
        });
        return;
      case "agent_message":
        this.emit({
          activityId,
          phase: "responding",
          status,
          message: status === "completed" ? "Response ready" : "Drafting the response",
          detail: status === "completed" ? `${item.text.length.toLocaleString()} characters` : undefined,
          elapsedMs,
          metadata: this.activityMetadata({ itemType: item.type }),
        });
        return;
      case "error":
        this.emit({
          activityId,
          phase: "failed",
          status: "failed",
          message: "Agent reported an error",
          detail: item.message,
          elapsedMs,
          metadata: this.activityMetadata({ itemType: item.type }),
        });
        return;
    }
  }

  private resolveItemStatus(
    lifecycle: "item.started" | "item.updated" | "item.completed",
    item: ThreadItem
  ): EngineProgressStatus {
    if (lifecycle !== "item.completed") {
      return lifecycle === "item.started" ? "started" : "in_progress";
    }
    if (
      (item.type === "command_execution" || item.type === "mcp_tool_call" || item.type === "file_change") &&
      item.status === "failed"
    ) {
      return "failed";
    }
    if (item.type === "error") return "failed";
    return "completed";
  }

  private completeTurn(usage: Usage): void {
    const detail: string[] = [];
    if (this.commandCount > 0) detail.push(this.pluralize(this.commandCount, "command"));
    if (this.toolCount > 0) detail.push(this.pluralize(this.toolCount, "tool call"));
    if (this.changedFiles.size > 0) detail.push(this.pluralize(this.changedFiles.size, "file changed", "files changed"));
    detail.push(`${usage.input_tokens.toLocaleString()} in / ${usage.output_tokens.toLocaleString()} out tokens`);
    detail.push(`Peak gap: ${this.formatDuration(this.peakInactivityMs)}`);

    const turnDuration = this.elapsedSinceTurnStart();
    this.finish("completed", "completed", "Agent turn complete", detail.join(" · "), {
      ...this.turnMetadata(),
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens,
      telemetry: {
        elapsedSec: Math.round(turnDuration / 1000),
        reasoningTimeMs: this.reasoningDurationMs,
        toolTimeMs: this.toolDurationMs,
        commandsExecuted: this.commandCount,
        filesModified: this.changedFiles.size,
        peakInactivityMs: this.peakInactivityMs,
        streamHeartbeatCount: this.heartbeatCount,
      },
    });
  }

  private finish(
    phase: "completed" | "failed" | "cancelled",
    status: "completed" | "failed" | "cancelled",
    message: string,
    detail?: string,
    metadata: EngineProgressMetadata = this.turnMetadata()
  ): void {
    if (this.terminal) return;
    this.terminal = true;
    this.emit({
      activityId: this.turnActivityId,
      phase,
      status,
      message,
      detail,
      elapsedMs: this.elapsedSinceTurnStart(),
      metadata,
    });
  }

  private finishAttempt(message: string, detail?: string): void {
    if (this.terminal) return;
    this.terminal = true;
    this.emit({
      activityId: `codex:attempt:${this.attempt}`,
      phase: "failed",
      status: "failed",
      message,
      detail,
      elapsedMs: this.elapsedSinceTurnStart(),
      metadata: this.activityMetadata(),
    });
  }

  private emit(event: Omit<EngineProgressEvent, "sequence" | "timestamp">): void {
    const message = sanitizeProgressText(event.message, MAX_MESSAGE_LENGTH);
    const detail = event.detail ? sanitizeProgressText(event.detail, MAX_DETAIL_LENGTH) : undefined;
    const fingerprint = `${event.status}\u0000${message}\u0000${detail ?? ""}`;
    if (this.lastPayloadByActivity.get(event.activityId) === fingerprint) return;
    this.lastPayloadByActivity.set(event.activityId, fingerprint);

    const output: EngineProgressEvent = {
      ...event,
      message,
      ...(detail ? { detail } : {}),
      timestamp: this.now(),
      sequence: this.nextSequence?.() ?? ++this.sequence,
    };
    try {
      this.onProgress?.(output);
    } catch {
      // Progress rendering is best-effort and must never interrupt the turn.
    }
  }

  private safePath(value: string): string {
    const absolute = path.resolve(this.cwd, value);
    const relative = path.relative(this.cwd, absolute);
    const safe = relative && !relative.startsWith("..") && !path.isAbsolute(relative)
      ? relative
      : path.basename(absolute);
    return sanitizeProgressText(safe.split(path.sep).join("/"), 140);
  }

  private elapsedSinceTurnStart(): number {
    return Math.max(0, this.now() - this.turnStartedAt);
  }

  private activityMetadata(extra: EngineProgressMetadata = {}): EngineProgressMetadata {
    return { source: "codex-sdk", scope: "activity", attempt: this.attempt, ...extra };
  }

  private turnMetadata(extra: EngineProgressMetadata = {}): EngineProgressMetadata {
    return { source: "codex-sdk", scope: "turn", attempt: this.attempt, ...extra };
  }

  private describeCommandIntent(command: string): string {
    const trimmed = command.trim();
    if (/rg\s+--files/i.test(trimmed)) return "Listing workspace file paths";

    const rgQuery = trimmed.match(/rg\s+(?:-[a-zA-Z]+\s+)*["']([^"']+)["']/i);
    if (rgQuery) return `Searching codebase for '${rgQuery[1]}'`;

    if (/^(?:rg|grep|ripgrep|ag)\b/i.test(trimmed)) return "Searching codebase";
    if (/^(?:find|fd)\b/i.test(trimmed)) return "Locating files in workspace";
    if (/^(?:ls|dir)\b/i.test(trimmed)) return "Inspecting directory contents";
    if (/^tree\b/i.test(trimmed)) return "Viewing workspace directory tree";

    if (/^git\s+diff/i.test(trimmed)) return "Viewing Git code diffs";
    if (/^git\s+status/i.test(trimmed)) return "Checking Git working tree status";
    if (/^git\s+log/i.test(trimmed)) return "Viewing Git commit history";
    if (/^git\s+commit\s+-m\s+["']([^"']+)["']/i.test(trimmed)) {
      const msg = trimmed.match(/^git\s+commit\s+-m\s+["']([^"']+)["']/i)?.[1];
      return msg ? `Committing: "${msg.slice(0, 36)}..."` : "Committing Git changes";
    }
    if (/^git\s+(?:add|commit|push|checkout|branch)/i.test(trimmed)) return "Updating Git repository";

    if (/^(?:tsc|npm run check|npm run typecheck)\b/i.test(trimmed)) return "Checking TypeScript types";
    if (/^(?:npm test|npm run test|vitest|jest|pytest)\b/i.test(trimmed)) return "Running test suite";
    if (/^(?:npm run build|npm run compile|vite build|tsc -b)\b/i.test(trimmed)) return "Building production bundle";
    if (/^(?:npm install|npm i|yarn add|pnpm add|bun add)\b/i.test(trimmed)) return "Installing dependencies";
    if (/^npm run smoke\b/i.test(trimmed)) return "Running runtime smoke checks";
    if (/^npm run benchmark\b/i.test(trimmed)) return "Benchmarking performance SLAs";
    if (/^(?:cat|head|tail|view|read)\b/i.test(trimmed)) return "Reading file contents";
    return "Running workspace command";
  }

  private describeToolAction(_server: string, tool: string): string {
    const t = tool.toLowerCase();
    if (t === "replace_file_content") return "Patching file";
    if (t === "multi_replace_file_content") return "Patching code blocks";
    if (t === "write_to_file") return "Writing file";
    if (t === "view_file") return "Reading file";
    if (t === "grep_search") return "Searching files";
    if (t === "list_dir") return "Listing directory";
    if (t === "run_command") return "Executing shell command";
    if (t === "read_url_content") return "Reading URL content";
    if (t === "generate_image") return "Generating visual asset";
    if (t === "ask_question") return "Requesting user input";
    return `Executing ${tool.replace(/_/g, " ")}`;
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    const seconds = Math.round(ms / 100) / 10;
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const remSecs = Math.round(seconds % 60);
    return `${mins}m ${remSecs}s`;
  }

  private pluralize(count: number, singular: string, plural = `${singular}s`): string {
    return `${count} ${count === 1 ? singular : plural}`;
  }
}
