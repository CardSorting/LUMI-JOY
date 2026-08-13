import type { SessionMessage } from "../contracts/session.contracts.js";

const MESSAGE_OVERHEAD_TOKENS = 6;

/**
 * Conservative, tokenizer-free estimate suitable for admission control.
 *
 * ASCII prose is usually close to four characters per token, punctuation-heavy
 * code is denser, and non-ASCII code points are charged individually. The
 * estimate deliberately rounds up: a context guard should fail closed rather
 * than discover an overflow at the provider boundary.
 */
export function estimateTextTokens(content: string): number {
  if (content.length === 0) return 0;

  let units = 0;
  for (const character of content) {
    const codePoint = character.codePointAt(0) ?? 0;
    if (codePoint > 0x7f) {
      units += 1;
    } else if (/\s/.test(character)) {
      units += 0.2;
    } else if (/[A-Za-z0-9_]/.test(character)) {
      units += 0.25;
    } else {
      units += 0.5;
    }
  }

  return Math.max(1, Math.ceil(units));
}

export function estimateMessageTokens(message: Pick<SessionMessage, "content" | "name" | "toolCallId">): number {
  return (
    MESSAGE_OVERHEAD_TOKENS +
    estimateTextTokens(message.content) +
    estimateTextTokens(message.name ?? "") +
    estimateTextTokens(message.toolCallId ?? "")
  );
}

export function estimateMessagesTokens(messages: readonly SessionMessage[]): number {
  return messages.reduce((total, message) => total + estimateMessageTokens(message), 0);
}

/** Preserve both orientation and outcome when an individual payload must shrink. */
export function truncateTextToTokenBudget(content: string, maxTokens: number): string {
  if (maxTokens === Number.POSITIVE_INFINITY) return content;
  if (!Number.isFinite(maxTokens) || maxTokens <= 0) return "";
  maxTokens = Math.floor(maxTokens);
  if (estimateTextTokens(content) <= maxTokens) return content;

  const marker = "\n… [middle truncated to fit context window] …\n";
  const markerTokens = estimateTextTokens(marker);
  if (maxTokens <= markerTokens + 2) {
    return content.slice(0, Math.max(1, maxTokens));
  }

  let low = 1;
  let high = Math.max(1, content.length - 1);
  let best = marker;
  while (low <= high) {
    const retainedCharacters = Math.floor((low + high) / 2);
    const headCharacters = Math.ceil(retainedCharacters * 0.6);
    const tailCharacters = retainedCharacters - headCharacters;
    const candidate = `${content.slice(0, headCharacters)}${marker}${tailCharacters > 0 ? content.slice(-tailCharacters) : ""}`;
    if (estimateTextTokens(candidate) <= maxTokens) {
      best = candidate;
      low = retainedCharacters + 1;
    } else {
      high = retainedCharacters - 1;
    }
  }

  return best;
}
