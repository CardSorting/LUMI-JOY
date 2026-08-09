/**
 * ArgumentCoercer.
 * Absorbed in Pass 62 (ADR-034 / ADR-012).
 *
 * Coerces stringified numbers and boolean flags in tool call inputs to native TypeScript primitives.
 */
export class ArgumentCoercer {
  coerce(params: Record<string, unknown>): Record<string, unknown> {
    const coerced: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(params)) {
      if (typeof value === "string") {
        if (value === "true") {
          coerced[key] = true;
        } else if (value === "false") {
          coerced[key] = false;
        } else if (!isNaN(Number(value)) && value.trim() !== "") {
          coerced[key] = Number(value);
        } else {
          coerced[key] = value;
        }
      } else {
        coerced[key] = value;
      }
    }

    return coerced;
  }
}
