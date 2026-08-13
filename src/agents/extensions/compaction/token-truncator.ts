import type { SessionMessage } from "../../../core/contracts/session.contracts.js";
import {
  estimateMessageTokens,
  estimateMessagesTokens,
  estimateTextTokens,
  truncateTextToTokenBudget,
} from "../../../core/utilities/token-estimator.js";

export interface TokenTruncationOptions {
  preserveRecentTurns?: number;
}

/**
 * TokenTruncator.
 * Absorbed in Pass 59 (ADR-033 / ADR-012).
 *
 * Truncates middle messages in turn history while preserving system prompt and recent turns.
 */
export class TokenTruncator {
  truncateMessages(messages: SessionMessage[], maxCount: number): SessionMessage[] {
    if (maxCount === Number.POSITIVE_INFINITY) return [...messages];
    if (!Number.isFinite(maxCount) || maxCount <= 0) return [];
    maxCount = Math.floor(maxCount);
    if (messages.length <= maxCount) return [...messages];

    const systemMessages = messages.filter((m) => m.role === "system");
    const nonSystemMessages = messages.filter((m) => m.role !== "system");

    const recentKeepCount = Math.max(1, maxCount - systemMessages.length);
    const truncatedRecent = nonSystemMessages.slice(-recentKeepCount);

    return [...systemMessages, ...truncatedRecent];
  }

  estimateMessages(messages: readonly SessionMessage[]): number {
    return estimateMessagesTokens(messages);
  }

  /**
   * Final provider-boundary guard. It keeps policy messages exact, selects
   * complete recent user turns, and only middle-truncates the newest payload
   * when one message cannot fit on its own.
   */
  truncateToTokenBudget(
    messages: readonly SessionMessage[],
    maxTokens: number,
    options: TokenTruncationOptions = {}
  ): SessionMessage[] {
    if (maxTokens === Number.POSITIVE_INFINITY) return [...messages];
    if (!Number.isFinite(maxTokens) || maxTokens <= 0) return [];
    maxTokens = Math.floor(maxTokens);
    if (estimateMessagesTokens(messages) <= maxTokens) return [...messages];

    const systemMessages = messages.filter((message) => message.role === "system");
    const conversation = messages.filter((message) => message.role !== "system");
    const systemTokens = estimateMessagesTokens(systemMessages);
    if (systemTokens >= maxTokens - 8) {
      const newestUser = [...conversation].reverse().find((message) => message.role === "user");
      if (!newestUser) {
        return this.fitPinnedMessages(systemMessages, maxTokens);
      }

      // Impossible inputs still retain both authority and current intent. This
      // path is intentionally exceptional; normal budgeting keeps policy exact.
      const requestReserve = Math.max(8, Math.floor(maxTokens * 0.25));
      const fittedSystem = this.fitPinnedMessages(systemMessages, maxTokens - requestReserve);
      const remainingTokens = maxTokens - estimateMessagesTokens(fittedSystem);
      return [...fittedSystem, ...this.fitNewestTurn([newestUser], remainingTokens)];
    }

    const turns = this.groupTurns(conversation);
    const selected: SessionMessage[][] = [];
    let usedTokens = systemTokens;
    const minimumTurns = Math.max(1, Math.floor(options.preserveRecentTurns ?? 1));

    for (let index = turns.length - 1; index >= 0; index--) {
      const turn = turns[index];
      const turnTokens = estimateMessagesTokens(turn);
      if (usedTokens + turnTokens <= maxTokens) {
        selected.unshift(turn);
        usedTokens += turnTokens;
        continue;
      }

      if (selected.length >= minimumTurns) break;
      const remainingTokens = maxTokens - usedTokens;
      const fitted = this.fitNewestTurn(turn, remainingTokens);
      if (fitted.length > 0) {
        selected.unshift(fitted);
        usedTokens += estimateMessagesTokens(fitted);
      }
      break;
    }

    return [...systemMessages, ...selected.flat()];
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

  private fitNewestTurn(turn: readonly SessionMessage[], maxTokens: number): SessionMessage[] {
    if (maxTokens <= 6 || turn.length === 0) return [];

    // The initiating user request carries more intent than trailing tool noise.
    const anchor = turn.find((message) => message.role === "user") ?? turn[turn.length - 1];
    const contentBudget = Math.max(1, maxTokens - (estimateMessageTokens(anchor) - estimateTextTokens(anchor.content)));
    return [{ ...anchor, content: truncateTextToTokenBudget(anchor.content, contentBudget) }];
  }

  private fitPinnedMessages(messages: readonly SessionMessage[], maxTokens: number): SessionMessage[] {
    const first = messages[0];
    if (!first || maxTokens <= 6) return [];
    const structuralTokens = estimateMessageTokens(first) - estimateTextTokens(first.content);
    const firstFitted = {
      ...first,
      content: truncateTextToTokenBudget(first.content, Math.max(1, maxTokens - structuralTokens)),
    };
    if (messages.length === 1 || estimateMessageTokens(firstFitted) >= maxTokens - 6) {
      return [firstFitted];
    }

    const last = messages[messages.length - 1];
    const remainingTokens = maxTokens - estimateMessageTokens(firstFitted);
    const lastStructuralTokens = estimateMessageTokens(last) - estimateTextTokens(last.content);
    if (remainingTokens <= lastStructuralTokens) return [firstFitted];
    return [firstFitted, {
      ...last,
      content: truncateTextToTokenBudget(last.content, remainingTokens - lastStructuralTokens),
    }];
  }
}
