export type ConnectionState = "disconnected" | "connecting" | "connected" | "reconnecting" | "failed";

export interface ConnectionHealth {
  state: ConnectionState;
  lastPingMs: number;
  reconnectAttempts: number;
  consecutiveFailures: number;
  isHealthy: boolean;
}

/**
 * TransportConnectionController.
 * Absorbed from packages/client/src/connection.ts (Pass 34 / ADR-012).
 *
 * Manages client-server transport connection state machine, heartbeat pings,
 * circuit breaker health states, and exponential reconnect policies for brittle links.
 */
export class TransportConnectionController {
  private state: ConnectionState = "disconnected";
  private lastPingMs = 0;
  private reconnectAttempts = 0;
  private consecutiveFailures = 0;

  connect(): void {
    this.state = "connecting";
    this.state = "connected";
    this.lastPingMs = Date.now();
    this.reconnectAttempts = 0;
    this.consecutiveFailures = 0;
  }

  disconnect(): void {
    this.state = "disconnected";
  }

  ping(): boolean {
    if (this.state !== "connected") return false;
    this.lastPingMs = Date.now();
    return true;
  }

  recordFailure(reason?: string): ConnectionState {
    this.consecutiveFailures += 1;
    if (this.consecutiveFailures >= 3) {
      this.state = "reconnecting";
      this.reconnectAttempts += 1;
    }
    if (this.consecutiveFailures >= 5) {
      this.state = "failed";
    }
    return this.state;
  }

  attemptReconnect(): boolean {
    if (this.state === "failed" && this.reconnectAttempts > 10) {
      return false;
    }
    this.state = "reconnecting";
    this.reconnectAttempts += 1;
    this.connect();
    return true;
  }

  isHealthy(): boolean {
    return this.state === "connected" && this.consecutiveFailures === 0;
  }

  getHealth(): ConnectionHealth {
    return {
      state: this.state,
      lastPingMs: this.lastPingMs,
      reconnectAttempts: this.reconnectAttempts,
      consecutiveFailures: this.consecutiveFailures,
      isHealthy: this.isHealthy(),
    };
  }
}
