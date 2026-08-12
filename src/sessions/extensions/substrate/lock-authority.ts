/**
 * [LAYER: SESSIONS EXTENSION]
 * Pass 107: Lock Authority & Broccoli Fencing Substrate
 *
 * Provides a fine-grained, split-brain-resilient file resource locking authority
 * with fencing tokens, claim registry checks, and stale lease recovery.
 */

import { randomUUID } from "node:crypto";
import { BroccoliFencingMutexEngine } from "./broccolidb-fencing-mutex.js";

export type LockFailureReason =
  | "collision"
  | "split_brain"
  | "stale_owner"
  | "duplicate_claim"
  | "owner_mismatch"
  | "fencing_mismatch"
  | "missing_fencing_token"
  | "not_held";

export interface LockClaim {
  resourcePath: string;
  ownerId: string;
  claimId: string;
  fencingToken: string;
  leaseEpoch: number;
  acquiredAt: number;
  ttlMs: number;
}

export type LockAcquireResult =
  | { ok: true; claim: LockClaim }
  | { ok: false; reason: LockFailureReason; error: string };

export type LockReleaseResult =
  | { ok: true }
  | { ok: false; reason: LockFailureReason; error: string };

export interface StaleRecoveryReport {
  recovered: string[];
  errors: string[];
}

/**
 * Validates fencing token invariants to prevent split-brain states across concurrent agent runs.
 */
export class BroccoliFencingSubstrate {
  private static tokenCounter = 0;

  static generateFencingToken(ownerId: string): string {
    this.tokenCounter++;
    return `fn-${ownerId}-${Date.now()}-${this.tokenCounter}`;
  }

  static parseEpoch(fencingToken: string): number {
    const parts = fencingToken.split("-");
    if (parts.length >= 3) {
      const parsed = parseInt(parts[2], 10);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  static verifyTokenInvariants(activeToken: string, candidateToken: string): boolean {
    const activeEpoch = this.parseEpoch(activeToken);
    const candidateEpoch = this.parseEpoch(candidateToken);
    return candidateEpoch >= activeEpoch;
  }
}

/**
 * Core Lock Authority Engine maintaining active file claims and eviction rules.
 */
export class LockAuthorityEngine {
  private readonly claims = new Map<string, LockClaim>();
  private readonly defaultTtlMs: number;
  readonly mutexEngine = new BroccoliFencingMutexEngine();

  constructor(defaultTtlMs: number = 30000) {
    this.defaultTtlMs = defaultTtlMs;
  }

  /**
   * Attempts to acquire an exclusive lock on a file resource path.
   */
  public acquireLock(
    resourcePath: string,
    ownerId: string,
    ttlMs: number = this.defaultTtlMs
  ): LockAcquireResult {
    const now = Date.now();
    const existing = this.claims.get(resourcePath);

    if (existing) {
      // Check if lease is expired
      if (now - existing.acquiredAt > existing.ttlMs) {
        // Expired claim can be cleanly evicted
        this.claims.delete(resourcePath);
      } else if (existing.ownerId === ownerId) {
        // Re-entry / renewal by same owner
        const claim: LockClaim = {
          ...existing,
          acquiredAt: now,
          ttlMs,
        };
        this.claims.set(resourcePath, claim);
        return { ok: true, claim };
      } else {
        return {
          ok: false,
          reason: "collision",
          error: `Resource '${resourcePath}' is locked by owner '${existing.ownerId}'`,
        };
      }
    }

    const fencingToken = BroccoliFencingSubstrate.generateFencingToken(ownerId);
    const claim: LockClaim = {
      resourcePath,
      ownerId,
      claimId: randomUUID(),
      fencingToken,
      leaseEpoch: Date.now(),
      acquiredAt: now,
      ttlMs,
    };

    this.claims.set(resourcePath, claim);
    return { ok: true, claim };
  }

  /**
   * Releases a held lock given proper ownerId or claimId.
   */
  public releaseLock(resourcePath: string, ownerId: string, fencingToken?: string): LockReleaseResult {
    const existing = this.claims.get(resourcePath);
    if (!existing) {
      return { ok: false, reason: "not_held", error: `Lock on '${resourcePath}' is not held` };
    }

    if (existing.ownerId !== ownerId) {
      return {
        ok: false,
        reason: "owner_mismatch",
        error: `Owner '${ownerId}' does not match lock holder '${existing.ownerId}'`,
      };
    }

    if (fencingToken && existing.fencingToken !== fencingToken) {
      return {
        ok: false,
        reason: "fencing_mismatch",
        error: `Fencing token mismatch for '${resourcePath}'`,
      };
    }

    this.claims.delete(resourcePath);
    return { ok: true };
  }

  /**
   * Verifies if a resource is currently locked and valid.
   */
  public isLocked(resourcePath: string): boolean {
    const existing = this.claims.get(resourcePath);
    if (!existing) return false;
    if (Date.now() - existing.acquiredAt > existing.ttlMs) {
      this.claims.delete(resourcePath);
      return false;
    }
    return true;
  }

  /**
   * Evicts any stale lock claims past their TTL window.
   */
  public recoverStaleLocks(): StaleRecoveryReport {
    const report: StaleRecoveryReport = { recovered: [], errors: [] };
    const now = Date.now();

    for (const [path, claim] of this.claims.entries()) {
      if (now - claim.acquiredAt > claim.ttlMs) {
        this.claims.delete(path);
        report.recovered.push(path);
      }
    }

    return report;
  }

  /**
   * Returns current active claim count.
   */
  public getActiveClaimCount(): number {
    this.recoverStaleLocks();
    return this.claims.size;
  }
}
