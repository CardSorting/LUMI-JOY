import type { SessionMessage } from "../../../core/contracts/session.contracts.js";

/**
 * TokenTruncator.
 * Absorbed in Pass 59 (ADR-033 / ADR-012).
 *
 * Truncates middle messages in turn history while preserving system prompt and recent turns.
 */
export class TokenTruncator {
  truncateMessages(messages: SessionMessage[], maxCount: number): SessionMessage[] {
    if (messages.length <= maxCount) return [...messages];

    const systemMessages = messages.filter((m) => m.role === "system");
    const nonSystemMessages = messages.filter((m) => m.role !== "system");

    const recentKeepCount = Math.max(1, maxCount - systemMessages.length);
    const truncatedRecent = nonSystemMessages.slice(-recentKeepCount);

    return [...systemMessages, ...truncatedRecent];
  }
}
