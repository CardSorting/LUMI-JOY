import type { SessionMessage } from "../../core/contracts/session.contracts.js";

export interface CompactionOptions {
  maxTurnHistory?: number;
  preserveInitialSystem?: boolean;
}

export class SessionCompactor {
  readonly maxTurnHistory: number;
  readonly preserveInitialSystem: boolean;

  constructor(options: CompactionOptions = {}) {
    this.maxTurnHistory = options.maxTurnHistory ?? 20;
    this.preserveInitialSystem = options.preserveInitialSystem ?? true;
  }

  compact(messages: readonly SessionMessage[]): SessionMessage[] {
    if (messages.length <= this.maxTurnHistory) {
      return [...messages];
    }

    const preserved: SessionMessage[] = [];
    let startIdx = 0;

    if (this.preserveInitialSystem && messages.length > 0 && messages[0].role === "system") {
      preserved.push(messages[0]);
      startIdx = 1;
    }

    const remaining = messages.slice(startIdx);
    const overflowCount = remaining.length - (this.maxTurnHistory - preserved.length);

    if (overflowCount <= 0) {
      return [...messages];
    }

    const summaryMessage: SessionMessage = {
      role: "system",
      content: `[System Notice: ${overflowCount} earlier message turns were compacted to maintain context bounds.]`,
      timestamp: Date.now(),
    };

    const recentMessages = remaining.slice(overflowCount);
    return [...preserved, summaryMessage, ...recentMessages];
  }
}
