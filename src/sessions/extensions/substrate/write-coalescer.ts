/**
 * [LAYER: SESSIONS EXTENSION]
 * Pass 115: Write Coalescing Substrate
 *
 * Provides a high-performance in-memory write-behind buffer. Rapid consecutive write requests
 * targeting session storage paths are merged in memory, content-deduplicated via FNV-1a hashing,
 * and debounced to prevent SSD erosion.
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";

export interface PendingWrite {
  dataSupplier: () => string;
  writeFn?: (filePath: string, data: string) => Promise<void>;
  timer: NodeJS.Timeout;
  debounceMs: number;
  lastEnqueued: number;
}

export interface CoalescerStats {
  pendingCount: number;
  deduplicatedCount: number;
  flushedCount: number;
}

/**
 * Computes pure bitwise FNV-1a fast hash for payload deduplication.
 */
export function calculateFastHash(content: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < content.length; i++) {
    hash ^= content.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16);
}

/**
 * High-performance, in-memory write-behind coalescing buffer.
 */
export class WriteCoalescerSubstrate {
  private readonly pendingWrites = new Map<string, PendingWrite>();
  private readonly lastWrittenHashes = new Map<string, string>();
  private deduplicatedCount = 0;
  private flushedCount = 0;

  /**
   * Schedules a debounced write with payload content-hash deduplication.
   */
  public coalesceWrite(
    filePath: string,
    dataSupplier: () => string,
    debounceMs: number = 300,
    maxDelayMs: number = 2000
  ): void {
    const existing = this.pendingWrites.get(filePath);
    const now = Date.now();

    if (existing) {
      clearTimeout(existing.timer);

      // Force flush if maxDelayMs exceeded
      if (now - existing.lastEnqueued >= maxDelayMs) {
        this.flushFileNow(filePath);
        return;
      }
    }

    const timer = setTimeout(() => {
      this.flushFileNow(filePath);
    }, debounceMs);
    timer.unref();

    this.pendingWrites.set(filePath, {
      dataSupplier,
      timer,
      debounceMs,
      lastEnqueued: existing ? existing.lastEnqueued : now,
    });
  }

  /**
   * Immediately flushes pending write for a file path if hash differs from last written state.
   */
  public async flushFileNow(filePath: string): Promise<boolean> {
    const pending = this.pendingWrites.get(filePath);
    if (!pending) return false;

    clearTimeout(pending.timer);
    this.pendingWrites.delete(filePath);

    const payload = pending.dataSupplier();
    const hash = calculateFastHash(payload);

    if (this.lastWrittenHashes.get(filePath) === hash) {
      this.deduplicatedCount++;
      return false; // Skip redundant disk I/O
    }

    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, payload, "utf-8");

    this.lastWrittenHashes.set(filePath, hash);
    this.flushedCount++;
    return true;
  }

  /**
   * Flushes all pending write-behind buffers across all files immediately.
   */
  public async flushAll(): Promise<number> {
    const paths = Array.from(this.pendingWrites.keys());
    let count = 0;
    for (const fp of paths) {
      const wrote = await this.flushFileNow(fp);
      if (wrote) count++;
    }
    return count;
  }

  /**
   * Returns current operational metrics.
   */
  public getStats(): CoalescerStats {
    return {
      pendingCount: this.pendingWrites.size,
      deduplicatedCount: this.deduplicatedCount,
      flushedCount: this.flushedCount,
    };
  }
}
