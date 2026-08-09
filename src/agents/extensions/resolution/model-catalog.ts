export interface ModelSpecs {
  modelName: string;
  provider: "anthropic" | "google" | "openai" | "deepseek" | "custom";
  contextWindowTokens: number;
  maxOutputTokens: number;
  inputPricePer1M: number;
  outputPricePer1M: number;
  supportsVision: boolean;
}

/**
 * ModelCatalog & Context Pricing Registry.
 * Absorbed from packages/catalog (Pass 16 / ADR-012).
 *
 * Maintains model spec definitions, context window limits, and turn token cost calculations.
 */
export class ModelCatalog {
  private readonly catalog: Map<string, ModelSpecs> = new Map();

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults(): void {
    this.registerModel({
      modelName: "claude-3-5-sonnet",
      provider: "anthropic",
      contextWindowTokens: 200_000,
      maxOutputTokens: 8_192,
      inputPricePer1M: 3.0,
      outputPricePer1M: 15.0,
      supportsVision: true,
    });

    this.registerModel({
      modelName: "gpt-4o",
      provider: "openai",
      contextWindowTokens: 128_000,
      maxOutputTokens: 4_096,
      inputPricePer1M: 2.5,
      outputPricePer1M: 10.0,
      supportsVision: true,
    });

    this.registerModel({
      modelName: "gemini-1.5-pro",
      provider: "google",
      contextWindowTokens: 2_000_000,
      maxOutputTokens: 8_192,
      inputPricePer1M: 1.25,
      outputPricePer1M: 5.0,
      supportsVision: true,
    });

    this.registerModel({
      modelName: "deepseek-v3",
      provider: "deepseek",
      contextWindowTokens: 64_000,
      maxOutputTokens: 8_192,
      inputPricePer1M: 0.14,
      outputPricePer1M: 0.28,
      supportsVision: false,
    });
  }

  registerModel(specs: ModelSpecs): void {
    this.catalog.set(specs.modelName, specs);
  }

  getModelInfo(modelName: string): ModelSpecs {
    return (
      this.catalog.get(modelName) ?? {
        modelName,
        provider: "custom",
        contextWindowTokens: 128_000,
        maxOutputTokens: 4_096,
        inputPricePer1M: 1.0,
        outputPricePer1M: 3.0,
        supportsVision: false,
      }
    );
  }

  calculateTurnCost(modelName: string, inputTokens: number, outputTokens: number): number {
    const info = this.getModelInfo(modelName);
    const inputCost = (inputTokens / 1_000_000) * info.inputPricePer1M;
    const outputCost = (outputTokens / 1_000_000) * info.outputPricePer1M;
    return Number((inputCost + outputCost).toFixed(6));
  }
}
