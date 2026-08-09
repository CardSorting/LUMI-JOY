export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * ToolCallSchemaValidator.
 * Absorbed in Pass 61 (ADR-034 / ADR-012).
 *
 * Validates tool execution parameter schemas before handler dispatch.
 */
export class ToolCallSchemaValidator {
  validate(params: Record<string, unknown>, requiredKeys: string[]): ValidationResult {
    const errors: string[] = [];

    for (const key of requiredKeys) {
      if (!(key in params) || params[key] === undefined || params[key] === null) {
        errors.push(`Missing required parameter: '${key}'`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
