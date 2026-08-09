export interface ContextBudgetInfo {
  maxTokens: number;
  reservedOutputTokens: number;
  availableInputTokens: number;
}

/**
 * ContextBudgetCalculator.
 * Absorbed in Pass 58 (ADR-033 / ADR-012).
 *
 * Calculates available context window token budgets dynamically.
 */
export class ContextBudgetCalculator {
  private readonly defaultMaxTokens: number;

  constructor(defaultMaxTokens = 128000) {
    this.defaultMaxTokens = defaultMaxTokens;
  }

  calculateBudget(modelName: string, maxOutputTokens = 4096): ContextBudgetInfo {
    const maxTokens = modelName.includes("claude-3-5") || modelName.includes("gpt-4o")
      ? 200000
      : this.defaultMaxTokens;

    const availableInputTokens = Math.max(0, maxTokens - maxOutputTokens);

    return {
      maxTokens,
      reservedOutputTokens: maxOutputTokens,
      availableInputTokens,
    };
  }
}
