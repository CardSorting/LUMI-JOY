export type ConnectionState = "disconnected" | "connecting" | "connected" | "reconnecting" | "failed";

export interface ConnectionHealth {
  state: ConnectionState;
  lastPingMs: number;
  reconnectAttempts: number;
}

/**
 * TransportConnectionController.
 * Absorbed from packages/client/src/connection.ts (Pass 34 / ADR-012).
 *
 * Manages client-server transport connection state machine and heartbeat pings.
 */
export class TransportConnectionController {
  private state: ConnectionState = "disconnected";
  private lastPingMs = 0;
  private reconnectAttempts = 0;

  connect(): void {
    this.state = "connecting";
    // Simulate instant atomic handshake
    this.state = "connected";
    this.lastPingMs = Date.now();
    this.reconnectAttempts = 0;
  }

  disconnect(): void {
    this.state = "disconnected";
  }

  ping(): boolean {
    if (this.state !== "connected") return false;
    this.lastPingMs = Date.now();
    return true;
  }

  getHealth(): ConnectionHealth {
    return {
      state: this.state,
      lastPingMs: this.lastPingMs,
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}
