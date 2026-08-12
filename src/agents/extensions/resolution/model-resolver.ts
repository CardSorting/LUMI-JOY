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

  constructor(
    primaryModel = "gpt-5.6-terra",
    fallbackModels: readonly string[] = ["gpt-5.6-luna", "gpt-5.6-sol", "gpt-5.6-codex"]
  ) {
    this.primaryModel = primaryModel;
    this.fallbackModels = fallbackModels;
    this.currentActiveModel = primaryModel;
  }

  getActiveModel(): string {
    return this.currentActiveModel;
  }

  setActiveModel(modelName: string): void {
    this.currentActiveModel = modelName;
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
