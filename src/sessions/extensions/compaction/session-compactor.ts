import type { SessionMessage } from "../../../core/contracts/session.contracts.js";
import { BroccoliCasCompactor } from "./broccolidb-cas-compactor.js";

export interface CompactorOptions {
  maxTurnHistory?: number;
  preserveSystemPrompt?: boolean;
}

export class SessionCompactor {
  private readonly maxTurnHistory: number;
  private readonly preserveSystemPrompt: boolean;
  readonly casCompactor: BroccoliCasCompactor;

  constructor(options: CompactorOptions = {}) {
    this.maxTurnHistory = options.maxTurnHistory ?? 20;
    this.preserveSystemPrompt = options.preserveSystemPrompt ?? true;
    this.casCompactor = new BroccoliCasCompactor();
  }

  compact(messages: SessionMessage[]): SessionMessage[] {
    if (messages.length <= this.maxTurnHistory) {
      return messages;
    }

    const result: SessionMessage[] = [];
    const systemPrompts = messages.filter((m) => m.role === "system");
    const nonSystem = messages.filter((m) => m.role !== "system");

    if (this.preserveSystemPrompt && systemPrompts.length > 0) {
      result.push(systemPrompts[systemPrompts.length - 1]);
    }

    const sliceStart = Math.max(0, nonSystem.length - (this.maxTurnHistory - result.length));
    const recentTurnHistory = nonSystem.slice(sliceStart);

    const discardedCount = nonSystem.length - recentTurnHistory.length;
    if (discardedCount > 0) {
      result.push({
        role: "system",
        content: `[SessionCompactor] Compacted ${discardedCount} older messages from turn history to preserve context window.`,
        timestamp: Date.now(),
      });
    }

    result.push(...recentTurnHistory);
    return result;
  }
}
