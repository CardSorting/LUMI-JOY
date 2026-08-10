export interface ProxyEndpointConfig {
  baseUrl: string;
  apiKey?: string;
  customHeaders?: Record<string, string>;
  timeoutMs?: number;
}

/**
 * LlmProxyGateway.
 * Absorbed from packages/agent/src/proxy.ts (Pass 28 / ADR-012).
 *
 * Manages custom proxy base URLs, request header injection, and connection timeout guardrails.
 */
export class LlmProxyGateway {
  private config: ProxyEndpointConfig | null = null;

  configureProxy(config: ProxyEndpointConfig | null): void {
    this.config = config;
  }

  getProxyConfig(): ProxyEndpointConfig | null {
    return this.config;
  }

  getEffectiveEndpoint(provider: string, defaultUrl: string): { url: string; headers: Record<string, string>; timeoutMs: number } {
    if (!this.config) {
      return {
        url: defaultUrl,
        headers: {},
        timeoutMs: 30_000,
      };
    }

    const headers: Record<string, string> = { ...(this.config.customHeaders ?? {}) };
    if (this.config.apiKey) {
      headers["Authorization"] = `Bearer ${this.config.apiKey}`;
    }

    return {
      url: this.config.baseUrl,
      headers,
      timeoutMs: this.config.timeoutMs ?? 30_000,
    };
  }
}

