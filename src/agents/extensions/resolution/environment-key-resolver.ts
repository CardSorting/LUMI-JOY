export interface ProviderKeyStatus {
  provider: string;
  envVar: string;
  hasKey: boolean;
  maskedKey?: string;
}

/**
 * EnvironmentKeyResolver.
 * Absorbed from packages/ai/src/env-api-keys.ts (Pass 25 / ADR-012).
 *
 * Inspects system environment variables for AI provider API keys.
 */
export class EnvironmentKeyResolver {
  private readonly providerEnvMap: Record<string, string> = {
    anthropic: "ANTHROPIC_API_KEY",
    openai: "OPENAI_API_KEY",
    google: "GEMINI_API_KEY",
    deepseek: "DEEPSEEK_API_KEY",
  };

  resolveKey(provider: string): string | null {
    const envVar = this.providerEnvMap[provider.toLowerCase()];
    if (!envVar) return null;
    return process.env[envVar] ?? null;
  }

  getProviderStatuses(): ProviderKeyStatus[] {
    return Object.entries(this.providerEnvMap).map(([provider, envVar]) => {
      const key = process.env[envVar];
      const hasKey = typeof key === "string" && key.length > 0;
      const maskedKey = hasKey ? `${key.substring(0, 4)}...${key.slice(-4)}` : undefined;
      return {
        provider,
        envVar,
        hasKey,
        maskedKey,
      };
    });
  }
}
