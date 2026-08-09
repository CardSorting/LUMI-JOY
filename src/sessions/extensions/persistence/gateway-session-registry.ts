import type { LumiMonolith } from "../../../index.js";

export interface ActiveSessionInfo {
  sessionId: string;
  cwd: string;
  turnCount: number;
  createdAt: number;
}

/**
 * GatewaySessionRegistry.
 * Absorbed from packages/server/src/sessions.ts (Pass 37 / ADR-012).
 *
 * Manages active LumiMonolith session instances on a server node.
 */
export class GatewaySessionRegistry {
  private readonly activeSessions = new Map<string, LumiMonolith>();

  registerSession(monolith: LumiMonolith): void {
    this.activeSessions.set(monolith.sessionContext.sessionId, monolith);
  }

  getSession(sessionId: string): LumiMonolith | undefined {
    return this.activeSessions.get(sessionId);
  }

  unregisterSession(sessionId: string): boolean {
    return this.activeSessions.delete(sessionId);
  }

  listSessions(): ActiveSessionInfo[] {
    return Array.from(this.activeSessions.values()).map((m) => ({
      sessionId: m.sessionContext.sessionId,
      cwd: m.sessionContext.cwd,
      turnCount: m.sessionContext.turnCount,
      createdAt: m.sessionContext.createdAt,
    }));
  }
}
