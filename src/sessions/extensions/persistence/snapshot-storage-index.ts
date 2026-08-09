import type { GameStateSnapshot } from "../../../core/contracts/session.contracts.js";

export interface SnapshotMetadata {
  snapshotId: string;
  sessionId: string;
  frameIndex: number;
  createdAt: number;
}

/**
 * SnapshotStorageIndex.
 * Absorbed from packages/server/src/snapshots.ts (Pass 38 / ADR-012).
 *
 * Stores and indexes GameStateSnapshot objects by session ID and frame index.
 */
export class SnapshotStorageIndex {
  private readonly snapshots = new Map<string, GameStateSnapshot>();

  saveSnapshot(snapshot: GameStateSnapshot): void {
    this.snapshots.set(snapshot.snapshotId, snapshot);
  }

  getSnapshot(snapshotId: string): GameStateSnapshot | undefined {
    return this.snapshots.get(snapshotId);
  }

  listSnapshotsForSession(sessionId: string): SnapshotMetadata[] {
    return Array.from(this.snapshots.values())
      .filter((s) => s.snapshotId.includes(sessionId))
      .map((s) => ({
        snapshotId: s.snapshotId,
        sessionId,
        frameIndex: s.frameIndex,
        createdAt: s.timestamp,
      }));
  }
}
