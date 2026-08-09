export interface DispatcherConfig {
  proxyUrl?: string;
  customHeaders: Record<string, string>;
  timeoutMs: number;
}

/**
 * Pass 95: HTTP Dispatcher Overlay
 * Ingests custom HTTP dispatcher & proxy header management concepts from `packages/coding-agent/src/core/http-dispatcher.ts`.
 * Applies proxy configuration and custom HTTP headers to outbound API requests.
 */
export class HttpDispatcherOverlay {
  private config: DispatcherConfig;

  constructor(proxyUrl?: string, customHeaders: Record<string, string> = {}) {
    this.config = {
      proxyUrl,
      customHeaders: { ...customHeaders },
      timeoutMs: 30000,
    };
  }

  configureDispatcher(proxyUrl?: string, customHeaders: Record<string, string> = {}): DispatcherConfig {
    if (proxyUrl !== undefined) {
      this.config.proxyUrl = proxyUrl;
    }
    this.config.customHeaders = {
      ...this.config.customHeaders,
      ...customHeaders,
    };
    return { ...this.config };
  }

  applyHeaders(headers: Record<string, string> = {}): Record<string, string> {
    return {
      ...headers,
      ...this.config.customHeaders,
    };
  }

  getDispatcherConfig(): DispatcherConfig {
    return {
      ...this.config,
      customHeaders: { ...this.config.customHeaders },
    };
  }
}
