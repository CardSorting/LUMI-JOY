import type {
  EngineProgressEvent,
  EngineProgressStatus,
} from "../../core/contracts/agent.contracts.js";
import type { Component } from "../tui.js";
import { sanitizeProgressText } from "../../core/utilities/progress-sanitizer.js";
import { Text } from "./text.js";

const ACTIVE_FRAMES = ["◐", "◓", "◑", "◒"] as const;

export interface AgentActivityTimelineOptions {
  model: string;
  maxVisibleActivities?: number;
  startedAt?: number;
}

/** A compact, persistent activity audit trail for one agent turn. */
export class AgentActivityTimeline implements Component {
  private readonly model: string;
  private readonly maxVisibleActivities: number;
  private readonly startedAt: number;
  private readonly entries = new Map<string, EngineProgressEvent>();
  private readonly order: string[] = [];
  private readonly text = new Text("", 0, 0);
  private elapsedMs = 0;
  private terminalStatus: "completed" | "failed" | "cancelled" | null = null;

  constructor(options: AgentActivityTimelineOptions) {
    this.model = sanitizeProgressText(options.model, 80);
    this.maxVisibleActivities = Math.max(3, options.maxVisibleActivities ?? 8);
    this.startedAt = options.startedAt ?? Date.now();
  }

  update(event: EngineProgressEvent): void {
    const safeEvent: EngineProgressEvent = {
      ...event,
      message: sanitizeProgressText(event.message, 96),
      ...(event.detail ? { detail: sanitizeProgressText(event.detail, 220) } : {}),
      timestamp: Number.isFinite(event.timestamp) ? event.timestamp : Date.now(),
      elapsedMs: event.elapsedMs === undefined || !Number.isFinite(event.elapsedMs)
        ? undefined
        : Math.max(0, event.elapsedMs),
      sequence: Number.isFinite(event.sequence) ? event.sequence : 0,
    };
    const existing = this.entries.get(safeEvent.activityId);
    if (existing && existing.sequence > safeEvent.sequence) return;
    if (!existing) this.order.push(event.activityId);
    this.entries.set(safeEvent.activityId, safeEvent);
    this.elapsedMs = Math.max(
      this.elapsedMs,
      safeEvent.timestamp - this.startedAt,
      safeEvent.elapsedMs ?? 0
    );
    if (safeEvent.status === "completed" && safeEvent.phase === "completed") {
      this.terminalStatus = "completed";
      this.settleActiveEntries(safeEvent, "completed");
    } else if (safeEvent.status === "failed" && safeEvent.activityId.endsWith(":turn")) {
      this.terminalStatus = "failed";
      this.settleActiveEntries(safeEvent, "failed");
    } else if (safeEvent.status === "cancelled") {
      this.terminalStatus = "cancelled";
      this.settleActiveEntries(safeEvent, "cancelled");
    }
    this.invalidate();
  }

  setElapsed(elapsedMs: number): void {
    if (this.terminalStatus) return;
    this.elapsedMs = Math.max(0, elapsedMs);
    this.invalidate();
  }

  completeIfNeeded(elapsedMs: number): void {
    if (this.terminalStatus) return;
    this.update({
      activityId: "lumi:turn",
      phase: "completed",
      status: "completed",
      message: "Request complete",
      timestamp: this.startedAt + elapsedMs,
      elapsedMs,
      sequence: Number.MAX_SAFE_INTEGER,
      metadata: { source: "lumi" },
    });
  }

  failIfNeeded(message: string, elapsedMs: number): void {
    if (this.terminalStatus) return;
    this.update({
      activityId: "lumi:turn",
      phase: "failed",
      status: "failed",
      message: "Request failed",
      detail: message,
      timestamp: this.startedAt + elapsedMs,
      elapsedMs,
      sequence: Number.MAX_SAFE_INTEGER,
      metadata: { source: "lumi" },
    });
    this.terminalStatus = "failed";
  }

  isTerminal(): boolean {
    return this.terminalStatus !== null;
  }

  invalidate(): void {
    this.text.invalidate();
  }

  render(width: number): string[] {
    this.text.setText(this.buildText());
    return this.text.render(width);
  }

  private buildText(): string {
    const elapsed = this.formatElapsed(this.elapsedMs);
    const state = this.terminalStatus === "completed"
      ? `\x1b[1;32mCompleted in ${elapsed}\x1b[0m`
      : this.terminalStatus === "failed"
        ? `\x1b[1;31mFailed after ${elapsed}\x1b[0m`
        : this.terminalStatus === "cancelled"
          ? `\x1b[1;33mCancelled after ${elapsed}\x1b[0m`
          : `\x1b[1;33mWorking ${elapsed}\x1b[0m`;
    const header = `\x1b[1;37mAgent activity\x1b[0m  ·  ${state}  ·  \x1b[36m${this.model}\x1b[0m`;

    const overallId = this.order.find((id) => id.endsWith(":turn"));
    const activityIds = overallId ? this.order.filter((id) => id !== overallId) : this.order;
    const activityBudget = Math.max(0, this.maxVisibleActivities - (overallId ? 1 : 0));
    const visibleIds = [
      ...(overallId ? [overallId] : []),
      ...activityIds.slice(-activityBudget),
    ];
    const hidden = this.order.length - visibleIds.length;
    const rows: string[] = [header];
    if (hidden > 0) rows.push(`\x1b[90m  … ${hidden} earlier ${hidden === 1 ? "activity" : "activities"}\x1b[0m`);
    for (const id of visibleIds) {
      const event = this.entries.get(id);
      if (!event) continue;
      rows.push(this.formatRow(event));
    }
    if (visibleIds.length === 0) {
      rows.push("\x1b[33m  ◐\x1b[0m Starting request");
    }
    return rows.join("\n");
  }

  private formatRow(event: EngineProgressEvent): string {
    const { icon, color } = this.statusStyle(event.status);
    const detail = event.detail ? ` \x1b[90m— ${event.detail}\x1b[0m` : "";
    const duration = event.elapsedMs && event.elapsedMs >= 1000
      ? ` \x1b[90m(${this.formatElapsed(event.elapsedMs)})\x1b[0m`
      : "";
    return `  ${color}${icon}\x1b[0m ${event.message}${detail}${duration}`;
  }

  private settleActiveEntries(
    terminalEvent: EngineProgressEvent,
    status: "completed" | "failed" | "cancelled"
  ): void {
    for (const [id, entry] of this.entries) {
      if (id === terminalEvent.activityId) continue;
      if (entry.status !== "started" && entry.status !== "in_progress") continue;
      this.entries.set(id, {
        ...entry,
        phase: status,
        status,
        message: status === "completed" ? entry.message : `${entry.message} (${status === "cancelled" ? "stopped" : "interrupted"})`,
        timestamp: terminalEvent.timestamp,
        elapsedMs: Math.max(0, terminalEvent.timestamp - entry.timestamp),
        sequence: terminalEvent.sequence,
      });
    }
  }

  private statusStyle(status: EngineProgressStatus): { icon: string; color: string } {
    switch (status) {
      case "completed":
        return { icon: "✓", color: "\x1b[32m" };
      case "failed":
        return { icon: "✗", color: "\x1b[31m" };
      case "cancelled":
        return { icon: "■", color: "\x1b[33m" };
      case "started":
      case "in_progress":
        return {
          icon: ACTIVE_FRAMES[Math.floor(this.elapsedMs / 250) % ACTIVE_FRAMES.length],
          color: "\x1b[33m",
        };
    }
  }

  private formatElapsed(elapsedMs: number): string {
    const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return minutes > 0 ? `${minutes}m ${seconds.toString().padStart(2, "0")}s` : `${seconds}s`;
  }
}
