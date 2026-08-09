export interface ModelResolutionMetrics {
  totalTurns: number;
  totalTokensEstimated: number;
  fallbackTriggeredCount: number;
}

export class ModelResolver {
  private readonly primaryModel: string;
  private readonly fallbackModels: readonly string[];
  private currentActiveModel: string;
  private fallbackCount = 0;
  private totalTurnsExecuted = 0;
  private estimatedTokensConsumed = 0;

  constructor(primaryModel = "gemini-2.5-flash", fallbackModels: readonly string[] = ["gemini-2.0-flash-lite", "claude-3-5-sonnet"]) {
    this.primaryModel = primaryModel;
    this.fallbackModels = fallbackModels;
    this.currentActiveModel = primaryModel;
  }

  getActiveModel(): string {
    return this.currentActiveModel;
  }

  recordTurnExecution(promptLength: number, responseLength: number): void {
    this.totalTurnsExecuted += 1;
    this.estimatedTokensConsumed += Math.ceil((promptLength + responseLength) / 4);
  }

  triggerFallback(reason?: string): string {
    this.fallbackCount += 1;
    const nextIndex = (this.fallbackCount - 1) % this.fallbackModels.length;
    this.currentActiveModel = this.fallbackModels[nextIndex];
    if (reason) {
      console.warn(`[ModelResolver] Fallback triggered to '${this.currentActiveModel}': ${reason}`);
    }
    return this.currentActiveModel;
  }

  resetToPrimary(): void {
    this.currentActiveModel = this.primaryModel;
  }

  getMetrics(): ModelResolutionMetrics {
    return {
      totalTurns: this.totalTurnsExecuted,
      totalTokensEstimated: this.estimatedTokensConsumed,
      fallbackTriggeredCount: this.fallbackCount,
    };
  }
}
