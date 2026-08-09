import type { CodexOAuthManager } from "./codex-oauth-manager.js";
import type { AuthStorageVault } from "./auth-storage-vault.js";

export interface ResolvedAuthHeaders {
  headers: Record<string, string>;
  authType: "codex-oauth" | "api-key" | "none";
}

export const MODERN_GPT56_MODELS = [
  "gpt-5.6-terra",
  "gpt-5.6-luna",
  "gpt-5.6-sol",
  "gpt-5.6-codex",
] as const;

export type ModernGpt56Model = typeof MODERN_GPT56_MODELS[number];

/**
 * Pass 104: Codex Provider Bridge
 * Integrates OpenAI Codex OAuth alongside standard API Key providers in LUMI-NEW model resolution.
 * Detects Codex & modern GPT 5.6 (Terra/Luna/Sol) model requests and injects Bearer OAuth access tokens and ChatGPT-Account-Id headers.
 */
export class CodexProviderBridge {
  private readonly codexOAuthManager: CodexOAuthManager;
  private readonly authVault?: AuthStorageVault;

  constructor(codexOAuthManager: CodexOAuthManager, authVault?: AuthStorageVault) {
    this.codexOAuthManager = codexOAuthManager;
    this.authVault = authVault;
  }

  isCodexProvider(modelName: string): boolean {
    const lower = modelName.toLowerCase();
    return (
      lower.includes("codex") ||
      lower.startsWith("openai-codex") ||
      lower.includes("gpt-5.6") ||
      lower.includes("terra") ||
      lower.includes("luna") ||
      lower.includes("sol") ||
      lower.includes("gpt-5")
    );
  }

  createCodexFetchHeaders(accessToken: string, accountId?: string): Record<string, string> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
    };
    if (accountId && accountId.trim().length > 0) {
      headers["ChatGPT-Account-Id"] = accountId.trim();
    }
    return headers;
  }

  async resolveProviderAuth(modelName: string, fallbackApiKey?: string): Promise<ResolvedAuthHeaders> {
    if (this.isCodexProvider(modelName)) {
      const accessToken = await this.codexOAuthManager.getValidAccessToken();
      if (accessToken) {
        const accountId = this.codexOAuthManager.getChatGPTAccountId();
        return {
          headers: this.createCodexFetchHeaders(accessToken, accountId),
          authType: "codex-oauth",
        };
      }
    }

    // Fall back to API Key resolution from AuthStorageVault or fallbackApiKey
    const providerName = this.isCodexProvider(modelName) ? "openai" : modelName.split("/")[0] || "default";
    const apiKey = fallbackApiKey || (this.authVault ? this.authVault.getToken(providerName) : undefined);

    if (apiKey) {
      return {
        headers: { Authorization: `Bearer ${apiKey}` },
        authType: "api-key",
      };
    }

    return {
      headers: {},
      authType: "none",
    };
  }

  getModernModels(): readonly string[] {
    return MODERN_GPT56_MODELS;
  }
}

