const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f-\u009f]/g;

/**
 * Produces single-line, bounded UI text while removing common credential forms.
 * Progress text is an observability surface and must be treated like a log sink.
 */
export function sanitizeProgressText(value: string, maxLength: number): string {
  const normalized = value
    .replace(CONTROL_CHARACTERS, " ")
    .replace(/(Authorization\s*:\s*(?:Bearer|Basic)\s+)[^\s,;]+/gi, "$1[redacted]")
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [redacted]")
    .replace(/\bsk-[A-Za-z0-9_-]{8,}\b/gi, "[redacted API key]")
    .replace(/\bAIza[0-9A-Za-z_-]{20,}\b/g, "[redacted Google API key]")
    .replace(/\bgh[pousr]_[A-Za-z0-9_]{20,}\b/gi, "[redacted GitHub token]")
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, "[redacted token]")
    .replace(/([A-Z][A-Z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD)\s*[=:]\s*)(?:"[^"]*"|'[^']*'|[^\s]+)/gi, "$1[redacted]")
    .replace(/(https?:\/\/)[^\s/@:]+:[^\s/@]+@/gi, "$1[redacted]@")
    .replace(/([?&](?:api[-_]?key|access[-_]?token|token|secret|password)=)[^&\s]+/gi, "$1[redacted]")
    .replace(/(--?(?:api[-_]?key|access[-_]?token|token|secret|password)(?:=|\s+))(?:"[^"]*"|'[^']*'|[^\s]+)/gi, "$1[redacted]")
    .replace(/\s+/g, " ")
    .trim();

  const safeMaxLength = Math.max(1, maxLength);
  if (normalized.length <= safeMaxLength) return normalized;
  return `${normalized.slice(0, Math.max(1, safeMaxLength - 1)).trimEnd()}…`;
}
