/**
 * [LAYER: TOOLING EXTENSION]
 * Pass 155: Zero-Dependency Broccoli Token Estimator
 *
 * Lifted from /Users/bozoegg/Downloads/codemarie-new/broccolidb (core/agent-context/TokenService.ts).
 * Adaptive character-ratio token estimation heuristics (estimateTokens, roughTokenCountEstimation),
 * token budget overflow checking, and message token calculations. Zero external npm dependencies.
 */

export interface TokenEstimationReport {
  estimatedTokens: number;
  totalLength: number;
  bytesPerToken: number;
  exceedsBudget: boolean;
  budgetLimit: number;
}

export class BroccoliTokenEstimator {
  /**
   * Fast rough token count estimation based on character length ratio.
   */
  public static roughTokenCountEstimation(content: string, bytesPerToken = 4): number {
    return Math.round(content.length / bytesPerToken);
  }

  /**
   * Estimates token usage for an array of structured text contents.
   */
  public estimateMessages(contents: string[]): number {
    let total = 0;
    for (const text of contents) {
      total += BroccoliTokenEstimator.roughTokenCountEstimation(text);
      total += 20; // Structural message metadata overhead
    }
    return total;
  }

  /**
   * Evaluates text token count against a defined context budget limit.
   */
  public evaluateBudget(content: string, budgetLimit = 128_000, bytesPerToken = 4): TokenEstimationReport {
    const estimatedTokens = BroccoliTokenEstimator.roughTokenCountEstimation(content, bytesPerToken);

    return {
      estimatedTokens,
      totalLength: content.length,
      bytesPerToken,
      exceedsBudget: estimatedTokens > budgetLimit,
      budgetLimit,
    };
  }
}
