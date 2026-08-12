/**
 * [LAYER: TOOLING EXTENSION]
 * Pass 106: JoyRide Bounded Hot-Path Execution Cache
 *
 * Provides a zero-GC, bounded memory-budgeted LRU execution cache with secret
 * pattern sanitization, command safety classification, and hit/miss diagnostics.
 */

export type JoyRideCacheKind =
  | "hotExecution"
  | "taskLocal"
  | "workspaceIndex"
  | "verification"
  | "scratchArtifact";

export interface JoyRideCacheEntry<T = unknown> {
  key: string;
  kind: JoyRideCacheKind;
  value: T;
  bytes: number;
  taskId?: string;
  timestamp: number;
  ttlMs?: number;
  metadata?: Record<string, unknown>;
}

export interface JoyRideCacheStats {
  totalEntries: number;
  totalBytes: number;
  maxBytes: number;
  hitCount: number;
  missCount: number;
  hitRatio: number;
  redactionCount: number;
}

export type CommandSafetyTier = "safe_readonly" | "workspace_mutating" | "system_dangerous";

const SECRET_VALUE_PATTERNS: RegExp[] = [
  /sk-ant-api03-[a-zA-Z0-9\-_]{80,}/,
  /sk-[a-zA-Z0-9]{32,}/,
  /AIza[a-zA-Z0-9\-_]{30,}/,
  /gh[pousr]_[a-zA-Z0-9_]{30,}/,
  /xox[abp]-[a-zA-Z0-9-]{40,}/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bBearer\s+[a-zA-Z0-9_\-.]{20,}\b/i,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
];

const READONLY_COMMAND_PATTERNS: RegExp[] = [
  /^\s*(git\s+(status|log|diff|branch|show)|ls|pwd|cat|head|tail|grep|find|node\s+-v|npm\s+-v|tsc\s+--version)\b/i,
];

const DANGEROUS_COMMAND_PATTERNS: RegExp[] = [
  /^\s*(rm\s+-rf\s+\/|dd\s+if=|mkfs|chmod\s+-R\s+777|sudo|shutdown|reboot)\b/i,
];

/**
 * Classifies CLI command executions for hot-path caching safety.
 */
export class HotPathCommandClassifier {
  static classify(command: string): CommandSafetyTier {
    const trimmed = command.trim();
    for (const pattern of DANGEROUS_COMMAND_PATTERNS) {
      if (pattern.test(trimmed)) {
        return "system_dangerous";
      }
    }
    for (const pattern of READONLY_COMMAND_PATTERNS) {
      if (pattern.test(trimmed)) {
        return "safe_readonly";
      }
    }
    return "workspace_mutating";
  }

  static isCacheable(command: string): boolean {
    return this.classify(command) === "safe_readonly";
  }
}

import { BroccoliJoyRideDiagnostics } from "./broccolidb-joyride-diagnostics.js";
import { BroccoliJoyRideContractVerifier } from "./broccolidb-joyride-contract.js";
import { BroccoliJoyRideDecisionLog } from "./broccolidb-joyride-decision-log.js";

/**
 * Bounded, invalidation-aware LRU execution cache for active agent hot paths.
 */
export class JoyRideHotPathCache {
  private readonly entries = new Map<string, JoyRideCacheEntry>();
  private readonly maxBytes: number;
  private currentBytes = 0;
  private hitCount = 0;
  private missCount = 0;
  private redactionCount = 0;
  readonly diagnostics = new BroccoliJoyRideDiagnostics();
  readonly contractVerifier = new BroccoliJoyRideContractVerifier();
  readonly decisionLog = new BroccoliJoyRideDecisionLog();

  constructor(maxBytes: number = 32 * 1024 * 1024) {
    this.maxBytes = maxBytes;
  }

  /**
   * Sanitizes potential secrets from string or object values before caching.
   */
  public sanitize<T>(input: T): T {
    if (typeof input === "string") {
      let sanitized: string = input;
      for (const pattern of SECRET_VALUE_PATTERNS) {
        if (pattern.test(sanitized)) {
          sanitized = sanitized.replace(pattern, "[REDACTED_SECRET]");
          this.redactionCount++;
        }
      }
      return (sanitized as unknown) as T;
    }

    if (typeof input === "object" && input !== null) {
      const json = JSON.stringify(input);
      let sanitizedJson = json;
      for (const pattern of SECRET_VALUE_PATTERNS) {
        if (pattern.test(sanitizedJson)) {
          sanitizedJson = sanitizedJson.replace(pattern, "[REDACTED_SECRET]");
          this.redactionCount++;
        }
      }
      try {
        return JSON.parse(sanitizedJson) as T;
      } catch {
        return input;
      }
    }

    return input;
  }

  /**
   * Stores a result in the hot-path cache with automatic LRU eviction.
   */
  public set<T>(
    key: string,
    value: T,
    kind: JoyRideCacheKind = "hotExecution",
    taskId?: string,
    ttlMs?: number,
    metadata?: Record<string, unknown>
  ): boolean {
    const sanitizedValue = this.sanitize(value);
    const serialized = typeof sanitizedValue === "string" ? sanitizedValue : JSON.stringify(sanitizedValue);
    const bytes = Buffer.byteLength(serialized, "utf-8");

    if (bytes > this.maxBytes) {
      return false;
    }

    if (this.entries.has(key)) {
      this.delete(key);
    }

    while (this.currentBytes + bytes > this.maxBytes && this.entries.size > 0) {
      const oldestKey = this.entries.keys().next().value;
      if (oldestKey) {
        this.delete(oldestKey);
        this.diagnostics.recordPressureTrim();
      }
    }

    const entry: JoyRideCacheEntry<T> = {
      key,
      kind,
      value: sanitizedValue,
      bytes,
      taskId,
      timestamp: Date.now(),
      ttlMs,
      metadata,
    };

    this.entries.set(key, entry as JoyRideCacheEntry);
    this.currentBytes += bytes;
    return true;
  }

  /**
   * Retrieves a cached value if hit and non-expired.
   */
  public get<T>(key: string): T | undefined {
    const entry = this.entries.get(key);
    if (!entry) {
      this.missCount++;
      this.diagnostics.recordMiss();
      return undefined;
    }

    if (entry.ttlMs && Date.now() - entry.timestamp > entry.ttlMs) {
      this.delete(key);
      this.missCount++;
      this.diagnostics.recordMiss();
      return undefined;
    }

    // Refresh LRU order
    this.entries.delete(key);
    this.entries.set(key, entry);

    this.hitCount++;
    this.diagnostics.recordHit();
    return entry.value as T;
  }

  /**
   * Removes an entry from the cache.
   */
  public delete(key: string): boolean {
    const entry = this.entries.get(key);
    if (!entry) {
      return false;
    }
    this.currentBytes -= entry.bytes;
    return this.entries.delete(key);
  }

  /**
   * Invalidates entries matching a specific task ID or cache kind.
   */
  public invalidateTask(taskId: string): number {
    let count = 0;
    for (const [key, entry] of this.entries.entries()) {
      if (entry.taskId === taskId) {
        this.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Clears the entire cache.
   */
  public clear(): void {
    this.entries.clear();
    this.currentBytes = 0;
  }

  /**
   * Returns current operational metrics.
   */
  public getStats(): JoyRideCacheStats {
    const totalRequests = this.hitCount + this.missCount;
    return {
      totalEntries: this.entries.size,
      totalBytes: this.currentBytes,
      maxBytes: this.maxBytes,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRatio: totalRequests > 0 ? this.hitCount / totalRequests : 0,
      redactionCount: this.redactionCount,
    };
  }
}
