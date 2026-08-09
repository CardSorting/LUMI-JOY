export type ReasoningEffortLevel = "low" | "medium" | "high" | "max";

export interface ReasoningEffortConfig {
  level: ReasoningEffortLevel;
  maxThinkingTokens?: number;
}

/**
 * ReasoningEffortController.
 * Absorbed from packages/catalog/src/effort.ts (Pass 31 / ADR-012).
 *
 * Configures reasoning effort levels and calculates thinking budget tokens.
 */
export class ReasoningEffortController {
  private currentLevel: ReasoningEffortLevel = "medium";

  setEffortLevel(level: ReasoningEffortLevel): void {
    this.currentLevel = level;
  }

  getEffortLevel(): ReasoningEffortLevel {
    return this.currentLevel;
  }

  calculateThinkingBudget(maxContextTokens: number): number {
    switch (this.currentLevel) {
      case "low":
        return Math.min(2048, Math.floor(maxContextTokens * 0.05));
      case "medium":
        return Math.min(8192, Math.floor(maxContextTokens * 0.15));
      case "high":
        return Math.min(16384, Math.floor(maxContextTokens * 0.3));
      case "max":
        return Math.min(32768, Math.floor(maxContextTokens * 0.5));
    }
  }
}
