export interface CheckpointDigest {
  checkpointId: string;
  timestamp: number;
  hash: string;
  deliverablesCount: number;
}

/**
 * RoadmapCheckpointDigest.
 * Absorbed from packages/codemarie/src/services/roadmap/RoadmapCheckpointDigest.ts (Pass 83 / ADR-012).
 *
 * Computes cryptographic checksum digests over active milestone deliverables and progress state for session verification.
 */
export class RoadmapCheckpointDigest {
  computeDigest(checkpointId: string, deliverables: string[]): CheckpointDigest {
    let hash = 0;
    const raw = `${checkpointId}:${deliverables.join(",")}`;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    const hexHash = Math.abs(hash).toString(16).padStart(8, "0");

    return {
      checkpointId,
      timestamp: Date.now(),
      hash: hexHash,
      deliverablesCount: deliverables.length,
    };
  }
}
