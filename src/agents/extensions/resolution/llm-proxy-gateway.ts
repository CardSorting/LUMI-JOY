export interface ProxyEndpointConfig {
  baseUrl: string;
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

  configureProxy(config: ProxyEndpointConfig): void {
    this.config = config;
  }

  getEffectiveEndpoint(provider: string, defaultUrl: string): { url: string; headers: Record<string, string>; timeoutMs: number } {
    if (!this.config) {
      return {
        url: defaultUrl,
        headers: {},
        timeoutMs: 30_000,
      };
    }

    return {
      url: this.config.baseUrl,
      headers: this.config.customHeaders ?? {},
      timeoutMs: this.config.timeoutMs ?? 30_000,
    };
  }
}
