export interface AuthTokenRecord {
  provider: string;
  token: string;
  updatedAt: number;
}

/**
 * Pass 97: Auth Storage Vault
 * Ingests runtime authentication credential storage & OAuth token vault concepts from `packages/coding-agent/src/core/auth-storage.ts`.
 * Manages in-memory provider tokens, API keys, and authorization credentials safely.
 */
export class AuthStorageVault {
  private vault: Map<string, AuthTokenRecord>;

  constructor() {
    this.vault = new Map();
  }

  setToken(provider: string, token: string): AuthTokenRecord {
    const record: AuthTokenRecord = {
      provider: provider.toLowerCase(),
      token,
      updatedAt: Date.now(),
    };
    this.vault.set(provider.toLowerCase(), record);
    return record;
  }

  getToken(provider: string): string | undefined {
    return this.vault.get(provider.toLowerCase())?.token;
  }

  hasToken(provider: string): boolean {
    const record = this.vault.get(provider.toLowerCase());
    return record !== undefined && record.token.trim().length > 0;
  }

  clearToken(provider: string): boolean {
    return this.vault.delete(provider.toLowerCase());
  }

  listProviders(): readonly string[] {
    return Array.from(this.vault.keys());
  }
}
