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
}

/**
 * Converts the Codex SDK event stream into a stable, safe activity lifecycle.
 * Item IDs are preserved so UIs can upsert started/updated/completed events.
 */
export class CodexProgressAdapter {
  private readonly cwd: string;
  private readonly model: string;
  private readonly onProgress?: (event: EngineProgressEvent) => void;
  private readonly now: () => number;
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

  constructor(options: CodexProgressAdapterOptions) {
    this.cwd = path.resolve(options.cwd);
    this.model = options.model;
    this.onProgress = options.onProgress;
    this.now = options.now ?? Date.now;
    this.turnStartedAt = this.now();
  }

  start(): void {
    this.emit({
      activityId: "codex:connection",
      phase: "connecting",
      status: "started",
      message: "Starting Codex agent",
      detail: this.model,
      metadata: { source: "codex-sdk" },
    });
  }

  handle(event: ThreadEvent): void {
    switch (event.type) {
      case "thread.started":
        this.emit({
          activityId: "codex:connection",
          phase: "connecting",
          status: "completed",
          message: "Connected to Codex",
          detail: this.model,
          elapsedMs: this.elapsedSinceTurnStart(),
          metadata: { source: "codex-sdk" },
        });
        return;
      case "turn.started":
        this.emit({
          activityId: "codex:turn",
          phase: "thinking",
          status: "started",
          message: "Analyzing the request",
          detail: "Understanding goals and workspace context",
          metadata: { source: "codex-sdk" },
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
    this.finish("cancelled", "cancelled", "Agent turn cancelled", message, { source: "codex-sdk" }, true);
  }

  timeout(message = "The agent exceeded the 10 minute turn limit"): void {
    this.finish("failed", "failed", "Agent turn timed out", message, { source: "codex-sdk" }, true);
  }

  fail(message: string, detail?: string): void {
    this.finish("failed", "failed", message, detail);
  }

  private handleItem(
    lifecycle: "item.started" | "item.updated" | "item.completed",
    item: ThreadItem
  ): void {
    const activityId = `codex:item:${item.id}`;
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
        this.emit({
          activityId,
          phase: "thinking",
          status,
          message: status === "completed" ? "Reasoning step complete" : "Reviewing the approach",
          detail: item.text || "Evaluating the next action",
          elapsedMs,
          metadata: { source: "codex-sdk", itemType: item.type },
        });
        return;
      }
      case "todo_list": {
        const completedSteps = item.items.filter((todo) => todo.completed).length;
        const nextStep = item.items.find((todo) => !todo.completed)?.text;
        const detailParts = [`${completedSteps}/${item.items.length} steps complete`];
        if (nextStep) detailParts.push(`Next: ${nextStep}`);
        this.emit({
          activityId,
          phase: "planning",
          status,
          message: status === "completed" ? "Implementation plan complete" : "Updating the implementation plan",
          detail: detailParts.join(" · "),
          elapsedMs,
          metadata: {
            source: "codex-sdk",
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
        this.emit({
          activityId,
          phase: failed ? "failed" : "tool",
          status,
          message: failed
            ? "Command failed"
            : status === "completed"
              ? "Command completed"
              : "Running workspace command",
          detail: sanitizeProgressText(item.command, MAX_COMMAND_LENGTH),
          elapsedMs,
          metadata: {
            source: "codex-sdk",
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
        this.emit({
          activityId,
          phase: status === "failed" ? "failed" : "writing",
          status,
          message: status === "failed"
            ? "File changes failed"
            : status === "completed"
              ? "Workspace files updated"
              : "Applying file changes",
          detail: changeSummary.join(" · ") || "Workspace update",
          elapsedMs,
          metadata: { source: "codex-sdk", itemType: item.type, files },
        });
        return;
      }
      case "mcp_tool_call": {
        if (!this.countedTools.has(activityId)) {
          this.countedTools.add(activityId);
          this.toolCount += 1;
        }
        const toolName = `${sanitizeProgressText(item.server, 60)}/${sanitizeProgressText(item.tool, 60)}`;
        this.emit({
          activityId,
          phase: status === "failed" ? "failed" : "tool",
          status,
          message: status === "failed"
            ? "Tool call failed"
            : status === "completed"
              ? "Tool call completed"
              : "Running tool",
          detail: toolName,
          elapsedMs,
          metadata: { source: "codex-sdk", itemType: item.type },
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
          metadata: { source: "codex-sdk", itemType: item.type },
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
          metadata: { source: "codex-sdk", itemType: item.type },
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
          metadata: { source: "codex-sdk", itemType: item.type },
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
    this.finish("completed", "completed", "Agent turn complete", detail.join(" · "), {
      source: "codex-sdk",
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens,
    });
  }

  private finish(
    phase: "completed" | "failed" | "cancelled",
    status: "completed" | "failed" | "cancelled",
    message: string,
    detail?: string,
    metadata: EngineProgressMetadata = { source: "codex-sdk" },
    force = false
  ): void {
    if (this.terminal && !force) return;
    this.terminal = true;
    this.emit({
      activityId: "codex:turn",
      phase,
      status,
      message,
      detail,
      elapsedMs: this.elapsedSinceTurnStart(),
      metadata,
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
      sequence: ++this.sequence,
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

  private pluralize(count: number, singular: string, plural = `${singular}s`): string {
    return `${count} ${count === 1 ? singular : plural}`;
  }
}
