export interface ImageModelSpecs {
  modelName: string;
  provider: "openai" | "google" | "recraft" | "custom";
  supportedAspectRatios: string[];
  maxOutputResolution: string;
}

/**
 * ImageModelRegistry.
 * Absorbed from packages/ai/src/image-models.ts (Pass 26 / ADR-012).
 *
 * Maintains specifications and capabilities for AI image generation models.
 */
export class ImageModelRegistry {
  private readonly imageModels: Map<string, ImageModelSpecs> = new Map();

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults(): void {
    this.registerModel({
      modelName: "dall-e-3",
      provider: "openai",
      supportedAspectRatios: ["1:1", "16:9", "9:16"],
      maxOutputResolution: "1024x1024",
    });

    this.registerModel({
      modelName: "imagen-3",
      provider: "google",
      supportedAspectRatios: ["1:1", "16:9", "4:3"],
      maxOutputResolution: "2048x2048",
    });
  }

  registerModel(specs: ImageModelSpecs): void {
    this.imageModels.set(specs.modelName, specs);
  }

  getModelInfo(modelName: string): ImageModelSpecs | undefined {
    return this.imageModels.get(modelName);
  }
}
