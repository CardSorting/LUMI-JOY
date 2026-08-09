import type { AgentConfig } from "../base/agent-config.js";

export interface ModelResolution {
  activeModel: string;
  isFallback: boolean;
  attemptCount: number;
}

export interface ModelUsageMetrics {
  totalTurns: number;
  totalTokensEstimated: number;
  fallbackTriggeredCount: number;
}

export class ModelResolver {
  readonly primaryModel: string;
  readonly fallbackModels: readonly string[];
  private currentModelIndex: number;
  private metrics: ModelUsageMetrics;

  constructor(primaryModel: string, fallbackModels: readonly string[] = ["gemini-1.5-pro", "gemini-1.5-flash"]) {
    this.primaryModel = primaryModel;
    this.fallbackModels = [...fallbackModels];
    this.currentModelIndex = 0;
    this.metrics = {
      totalTurns: 0,
      totalTokensEstimated: 0,
      fallbackTriggeredCount: 0,
    };
  }

  static fromConfig(config: AgentConfig): ModelResolver {
    return new ModelResolver(config.modelName);
  }

  resolveModel(): ModelResolution {
    const isFallback = this.currentModelIndex > 0;
    const activeModel = isFallback
      ? this.fallbackModels[this.currentModelIndex - 1] ?? this.primaryModel
      : this.primaryModel;

    return {
      activeModel,
      isFallback,
      attemptCount: this.currentModelIndex + 1,
    };
  }

  triggerFallback(): ModelResolution {
    if (this.currentModelIndex < this.fallbackModels.length) {
      this.currentModelIndex += 1;
      this.metrics.fallbackTriggeredCount += 1;
    }
    return this.resolveModel();
  }

  resetToPrimary(): void {
    this.currentModelIndex = 0;
  }

  recordUsage(charCount: number): void {
    this.metrics.totalTurns += 1;
    const estimatedTokens = Math.ceil(charCount / 4);
    this.metrics.totalTokensEstimated += estimatedTokens;
  }

  getMetrics(): Readonly<ModelUsageMetrics> {
    return { ...this.metrics };
  }
}
