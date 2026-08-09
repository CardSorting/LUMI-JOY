import * as crypto from "node:crypto";
import type { AuthStorageVault } from "./auth-storage-vault.js";

export interface OpenAiCodexCredentials {
  type: "openai-codex";
  access_token: string;
  refresh_token: string;
  expires: number; // ms since epoch
  email?: string;
  accountId?: string;
}

export interface CodexAuthUrlDetails {
  url: string;
  codeVerifier: string;
  state: string;
}

export const OPENAI_CODEX_OAUTH_CONFIG = {
  authorizationEndpoint: "https://auth.openai.com/oauth/authorize",
  tokenEndpoint: "https://auth.openai.com/oauth/token",
  clientId: "app_EMoamEEZ73f0CkXaXp7hrann",
  redirectUri: "http://localhost:1455/auth/callback",
  scopes: "openid profile email offline_access",
  callbackPort: 1455,
} as const;

interface IdTokenClaims {
  chatgpt_account_id?: string;
  organizations?: Array<{ id: string }>;
  email?: string;
  "https://api.openai.com/auth"?: {
    chatgpt_account_id?: string;
  };
}

function parseJwtClaims(token: string): IdTokenClaims | undefined {
  const parts = token.split(".");
  if (parts.length !== 3) return undefined;
  try {
    const payload = Buffer.from(parts[1], "base64url").toString("utf-8");
    return JSON.parse(payload) as IdTokenClaims;
  } catch {
    return undefined;
  }
}

function extractAccountIdFromToken(token: string): string | undefined {
  const claims = parseJwtClaims(token);
  if (!claims) return undefined;
  return (
    claims.chatgpt_account_id ||
    claims["https://api.openai.com/auth"]?.chatgpt_account_id ||
    claims.organizations?.[0]?.id
  );
}

/**
 * Pass 103: OpenAI Codex OAuth Manager
 * Ingests OpenAI Codex OAuth PKCE flow & credentials lifecycle from `packages/codemarie/src/integrations/openai-codex/oauth.ts`.
 * Handles PKCE verifier generation, authorization URL construction, authorization code exchange, token refresh, and JWT account ID extraction.
 */
export class CodexOAuthManager {
  private credentials: OpenAiCodexCredentials | null = null;
  private readonly authVault?: AuthStorageVault;

  constructor(authVault?: AuthStorageVault) {
    this.authVault = authVault;
  }

  generateAuthUrl(): CodexAuthUrlDetails {
    const codeVerifier = crypto.randomBytes(32).toString("base64url");
    const codeChallenge = crypto.createHash("sha256").update(codeVerifier).digest().toString("base64url");
    const state = crypto.randomBytes(16).toString("hex");

    const params = new URLSearchParams({
      client_id: OPENAI_CODEX_OAUTH_CONFIG.clientId,
      redirect_uri: OPENAI_CODEX_OAUTH_CONFIG.redirectUri,
      scope: OPENAI_CODEX_OAUTH_CONFIG.scopes,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      response_type: "code",
      state,
      codex_cli_simplified_flow: "true",
      originator: "dietcode",
    });

    const url = `${OPENAI_CODEX_OAUTH_CONFIG.authorizationEndpoint}?${params.toString()}`;
    return { url, codeVerifier, state };
  }

  async exchangeCodeForTokens(code: string, codeVerifier: string): Promise<OpenAiCodexCredentials> {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: OPENAI_CODEX_OAUTH_CONFIG.clientId,
      code,
      redirect_uri: OPENAI_CODEX_OAUTH_CONFIG.redirectUri,
      code_verifier: codeVerifier,
    });

    const response = await fetch(OPENAI_CODEX_OAUTH_CONFIG.tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Codex OAuth token exchange failed: ${response.status} - ${errorText}`);
    }

    const data = (await response.json()) as {
      access_token: string;
      refresh_token?: string;
      id_token?: string;
      expires_in: number;
      email?: string;
    };

    if (!data.refresh_token) {
      throw new Error("Codex OAuth token exchange response missing refresh_token");
    }

    const accountId = data.id_token
      ? extractAccountIdFromToken(data.id_token)
      : extractAccountIdFromToken(data.access_token);

    const creds: OpenAiCodexCredentials = {
      type: "openai-codex",
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires: Date.now() + data.expires_in * 1000,
      email: data.email,
      accountId,
    };

    this.saveCredentials(creds);
    return creds;
  }

  async refreshAccessToken(): Promise<OpenAiCodexCredentials> {
    if (!this.credentials || !this.credentials.refresh_token) {
      throw new Error("No refresh token available to refresh Codex OAuth credentials");
    }

    const body = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: OPENAI_CODEX_OAUTH_CONFIG.clientId,
      refresh_token: this.credentials.refresh_token,
    });

    const response = await fetch(OPENAI_CODEX_OAUTH_CONFIG.tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Codex OAuth token refresh failed: ${response.status} - ${errorText}`);
    }

    const data = (await response.json()) as {
      access_token: string;
      refresh_token?: string;
      id_token?: string;
      expires_in: number;
      email?: string;
    };

    const newAccountId = data.id_token
      ? extractAccountIdFromToken(data.id_token)
      : extractAccountIdFromToken(data.access_token);

    const creds: OpenAiCodexCredentials = {
      type: "openai-codex",
      access_token: data.access_token,
      refresh_token: data.refresh_token ?? this.credentials.refresh_token,
      expires: Date.now() + data.expires_in * 1000,
      email: data.email ?? this.credentials.email,
      accountId: newAccountId ?? this.credentials.accountId,
    };

    this.saveCredentials(creds);
    return creds;
  }

  isTokenExpired(): boolean {
    if (!this.credentials) return true;
    const bufferMs = 5 * 60 * 1000; // 5 minute buffer
    return Date.now() >= this.credentials.expires - bufferMs;
  }

  async getValidAccessToken(): Promise<string | null> {
    if (!this.credentials) return null;
    if (this.isTokenExpired()) {
      try {
        await this.refreshAccessToken();
      } catch {
        return null;
      }
    }
    return this.credentials?.access_token ?? null;
  }

  getCredentials(): Readonly<OpenAiCodexCredentials> | null {
    return this.credentials;
  }

  saveCredentials(credentials: OpenAiCodexCredentials): void {
    this.credentials = credentials;
    if (this.authVault) {
      this.authVault.setToken("openai-codex", credentials.access_token);
    }
  }

  getChatGPTAccountId(): string | undefined {
    return this.credentials?.accountId;
  }

  clearCredentials(): void {
    this.credentials = null;
    if (this.authVault) {
      this.authVault.clearToken("openai-codex");
    }
  }
}
