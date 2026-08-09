import { AbstractEars } from "../../../core/abstracts/abstract-ears.js";
import type { ToolingEvent, JsonRpcNotification } from "../../../core/contracts/tooling.contracts.js";

/**
 * Protocol Telemetry Ears Subclass.
 * Provides microsecond performance timers and JSON-RPC 2.0 telemetry formatting.
 */
export class ProtocolEars extends AbstractEars {
  protected readonly timers: Map<string, number>;

  constructor() {
    super();
    this.timers = new Map();
  }

  startTimer(label: string): void {
    this.timers.set(label, performance.now());
  }

  endTimer(label: string): number {
    const start = this.timers.get(label);
    if (start === undefined) return 0;
    const duration = performance.now() - start;
    this.timers.delete(label);
    return Math.round(duration * 100) / 100;
  }

  formatJsonRpcEvent(event: ToolingEvent): JsonRpcNotification {
    return {
      jsonrpc: "2.0",
      method: `telemetry/${event.type}`,
      params: {
        event: event.type,
        source: event.source,
        payload: event.payload,
        timestamp: event.timestamp,
        durationMs: event.durationMs,
      },
    };
  }
}

export { ProtocolEars as Ears };
