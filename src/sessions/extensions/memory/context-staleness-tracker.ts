/**
 * [LAYER: SESSIONS EXTENSION]
 * Pass 109: Context Staleness Tracker & Cognitive Freshness Guard
 *
 * Ensures cognitive freshness by tracking file read content signatures, edit timestamps,
 * and external workspace modifications to detect and flag stale context entries.
 */

import * as fs from "node:fs";
import * as path from "node:path";

export interface ContextReadEntry {
  filePath: string;
  absolutePath: string;
  lastReadTimestamp: number;
  lastEditTimestamp: number;
  signature: string;
  content: string;
  isStale: boolean;
  staleReason?: string;
}

export interface StalenessReport {
  totalTracked: number;
  staleCount: number;
  staleEntries: ContextReadEntry[];
}

/**
 * Tracks read content signatures and modification times to detect stale context.
 */
export class ContextStalenessTracker {
  private readonly contextMap = new Map<string, ContextReadEntry>();
  private readonly cwd: string;

  constructor(cwd: string = process.cwd()) {
    this.cwd = cwd;
  }

  /**
   * Computes a lightweight bitwise signature for content tracking.
   */
  public static calculateSignature(content: string): string {
    let hash = 0;
    const str = content.trim();
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return `sig-${Math.abs(hash).toString(16)}`;
  }

  private getMtime(absolutePath: string): number {
    try {
      const stat = fs.statSync(absolutePath);
      return stat.mtimeMs;
    } catch {
      return 0;
    }
  }

  /**
   * Records a file read into context with its content signature and timestamp.
   */
  public recordRead(filePath: string, content: string): ContextReadEntry {
    const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(this.cwd, filePath);
    const signature = ContextStalenessTracker.calculateSignature(content);
    const mtime = this.getMtime(absolutePath);

    const entry: ContextReadEntry = {
      filePath,
      absolutePath,
      lastReadTimestamp: Date.now(),
      lastEditTimestamp: mtime,
      signature,
      content,
      isStale: false,
    };

    this.contextMap.set(absolutePath, entry);
    return entry;
  }

  /**
   * Records that a file was edited by an agent tool call or process.
   */
  public recordEdit(filePath: string): void {
    const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(this.cwd, filePath);
    const entry = this.contextMap.get(absolutePath);
    if (entry) {
      entry.isStale = true;
      entry.staleReason = "File modified by internal tool execution";
      entry.lastEditTimestamp = Date.now();
    }
  }

  /**
   * Evaluates whether a tracked file is stale due to disk modification or edits.
   */
  public checkStaleness(filePath: string): { isStale: boolean; reason?: string } {
    const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(this.cwd, filePath);
    const entry = this.contextMap.get(absolutePath);

    if (!entry) {
      return { isStale: false };
    }

    if (entry.isStale) {
      return { isStale: true, reason: entry.staleReason };
    }

    const currentMtime = this.getMtime(absolutePath);
    if (currentMtime > entry.lastEditTimestamp) {
      entry.isStale = true;
      entry.staleReason = "File content modified externally on disk";
      return { isStale: true, reason: entry.staleReason };
    }

    return { isStale: false };
  }

  /**
   * Audits all tracked files and returns a complete staleness report.
   */
  public auditAll(): StalenessReport {
    const staleEntries: ContextReadEntry[] = [];
    for (const [absPath] of this.contextMap.keys()) {
      const check = this.checkStaleness(absPath);
      const entry = this.contextMap.get(absPath)!;
      if (check.isStale) {
        staleEntries.push(entry);
      }
    }

    return {
      totalTracked: this.contextMap.size,
      staleCount: staleEntries.length,
      staleEntries,
    };
  }

  /**
   * Clears staleness tracking map.
   */
  public clear(): void {
    this.contextMap.clear();
  }
}

/**
 * Guard preventing stale context prompts from polluting model generation.
 */
export class CognitiveFreshnessGuard {
  static evaluatePromptContext(
    tracker: ContextStalenessTracker,
    filePaths: string[]
  ): { fresh: boolean; warnings: string[] } {
    const warnings: string[] = [];
    for (const fp of filePaths) {
      const check = tracker.checkStaleness(fp);
      if (check.isStale) {
        warnings.push(`File '${fp}' context is stale: ${check.reason}`);
      }
    }
    return {
      fresh: warnings.length === 0,
      warnings,
    };
  }
}
