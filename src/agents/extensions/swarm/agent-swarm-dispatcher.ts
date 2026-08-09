import type { LumiMonolith } from "../../../index.js";
import type { EngineTickResult } from "../../../core/contracts/agent.contracts.js";
import type { GameStateSnapshot } from "../../../core/contracts/session.contracts.js";

export interface SwarmLease {
  lockId: string;
  resourceKey: string;
  ownerId: string;
  expiresAt: number;
  fencingToken: string;
}

export interface SwarmSubagentTaskResult {
  taskId: string;
  childSessionId: string;
  parentSnapshot: GameStateSnapshot;
  tickResult: EngineTickResult;
  completedAt: number;
}

/**
 * AgentSwarmDispatcher & Swarm Mutex Lease Service.
 * Absorbed from packages/codemarie/src/core/swarm (Pass 11 / ADR-012).
 *
 * Spawns isolated subagent sessions via LumiMonolith.forkSession(), manages atomic fencing locks,
 * and synchronizes frame snapshots between parent and child engines.
 */
export class AgentSwarmDispatcher {
  private activeLocks: Map<string, SwarmLease> = new Map();
  private lockCounter = 0;

  /**
   * Acquires a fencing lock for subagent workspace access.
   */
  acquireLock(resourceKey: string, ownerId: string, ttlMs = 60_000): SwarmLease {
    const existing = this.activeLocks.get(resourceKey);
    const now = Date.now();

    if (existing && existing.expiresAt > now) {
      throw new Error(`Swarm Lock Busy: Resource '${resourceKey}' is held by '${existing.ownerId}'`);
    }

    this.lockCounter += 1;
    const lease: SwarmLease = {
      lockId: `lock-${this.lockCounter}-${now}`,
      resourceKey,
      ownerId,
      expiresAt: now + ttlMs,
      fencingToken: `ft-${this.lockCounter}`,
    };

    this.activeLocks.set(resourceKey, lease);
    return lease;
  }

  /**
   * Releases an active fencing lock.
   */
  releaseLock(resourceKey: string, lockId: string): boolean {
    const lease = this.activeLocks.get(resourceKey);
    if (lease && lease.lockId === lockId) {
      this.activeLocks.delete(resourceKey);
      return true;
    }
    return false;
  }

  /**
   * Delegates an isolated sub-task to a child LumiMonolith instance with snapshot sync.
   */
  async delegateSubagentTask(
    taskPrompt: string,
    parentEngine: LumiMonolith,
    subagentId?: string
  ): Promise<SwarmSubagentTaskResult> {
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const childSessionId = subagentId ?? `subagent-${taskId}`;

    // 1. Acquire fencing lease
    const lease = this.acquireLock(`session:${childSessionId}`, taskId);

    try {
      // 2. Create frame-perfect parent snapshot
      const parentSnapshot = parentEngine.createSnapshot();

      // 3. Fork isolated child engine
      const childEngine = parentEngine.forkSession(childSessionId);

      // 4. Execute subagent task tick loop
      const tickResult = await childEngine.tick({ prompt: taskPrompt });

      return {
        taskId,
        childSessionId,
        parentSnapshot,
        tickResult,
        completedAt: Date.now(),
      };
    } finally {
      // 5. Release fencing lease
      this.releaseLock(`session:${childSessionId}`, lease.lockId);
    }
  }
}
