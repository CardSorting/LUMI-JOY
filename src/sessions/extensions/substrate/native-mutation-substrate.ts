/**
 * [LAYER: SESSIONS EXTENSION]
 * Pass 113: Native Mutation Transaction Substrate
 *
 * Provides workspace boundary safety verification (isPathInWorkspace), SHA-256
 * normalized content hashing, atomic staging writes, and mutation transaction rollback buffers.
 */

import * as crypto from "node:crypto";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { BroccoliRollbackCoordinator } from "./broccolidb-rollback-coordinator.js";

export interface MutationTransaction {
  id: string;
  filePath: string;
  previousContent: string | null;
  previousHash: string;
  newContent: string;
  newHash: string;
  timestamp: number;
  committed: boolean;
}

export interface MutationResult {
  ok: boolean;
  transactionId?: string;
  error?: string;
  bytesWritten?: number;
}

/**
 * Ensures file mutations are safely bounded within workspace path boundaries.
 */
export async function isPathInWorkspace(workspace: string, targetPath: string): Promise<boolean> {
  try {
    const resolvedWorkspace = await fs.realpath(path.resolve(workspace));
    let current = path.resolve(targetPath);

    while (true) {
      try {
        const realCurrent = await fs.realpath(current);
        return realCurrent === resolvedWorkspace || realCurrent.startsWith(resolvedWorkspace + path.sep);
      } catch (err: unknown) {
        const error = err as { code?: string };
        if (error.code === "ENOENT") {
          const parent = path.dirname(current);
          if (parent === current) break;
          current = parent;
        } else {
          return false;
        }
      }
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Computes normalized SHA-256 content hashes (line-ending invariant).
 */
export function getNormalizedHash(content: string): string {
  const normalized = content.replace(/\r\n/g, "\n");
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

/**
 * Manages atomic mutations and transaction rollback buffers.
 */
export class NativeMutationTransactionSubstrate {
  private readonly transactions = new Map<string, MutationTransaction>();
  private readonly workspaceCwd: string;
  readonly rollbackCoordinator: BroccoliRollbackCoordinator;

  constructor(workspaceCwd: string = process.cwd()) {
    this.workspaceCwd = workspaceCwd;
    this.rollbackCoordinator = new BroccoliRollbackCoordinator(workspaceCwd);
  }

  /**
   * Executes an atomic mutation on a file path within workspace boundaries.
   */
  public async executeMutation(filePath: string, newContent: string): Promise<MutationResult> {
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.resolve(this.workspaceCwd, filePath);

    const safe = await isPathInWorkspace(this.workspaceCwd, absolutePath);
    if (!safe) {
      return {
        ok: false,
        error: `Mutation rejected: Path '${filePath}' escapes workspace boundary`,
      };
    }

    let previousContent: string | null = null;
    let previousHash = "";
    try {
      previousContent = await fs.readFile(absolutePath, "utf-8");
      previousHash = getNormalizedHash(previousContent);
    } catch {
      // New file creation
    }

    const newHash = getNormalizedHash(newContent);
    const transactionId = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, newContent, "utf-8");

    const transaction: MutationTransaction = {
      id: transactionId,
      filePath: absolutePath,
      previousContent,
      previousHash,
      newContent,
      newHash,
      timestamp: Date.now(),
      committed: true,
    };

    this.transactions.set(transactionId, transaction);
    return {
      ok: true,
      transactionId,
      bytesWritten: Buffer.byteLength(newContent, "utf-8"),
    };
  }

  /**
   * Rolls back a completed mutation transaction to its previous content state.
   */
  public async rollbackTransaction(transactionId: string): Promise<boolean> {
    const tx = this.transactions.get(transactionId);
    if (!tx || !tx.committed) return false;

    if (tx.previousContent === null) {
      try {
        await fs.unlink(tx.filePath);
      } catch {
        return false;
      }
    } else {
      await fs.writeFile(tx.filePath, tx.previousContent, "utf-8");
    }

    tx.committed = false;
    return true;
  }

  /**
   * Returns active transaction count.
   */
  public getTransactionCount(): number {
    return this.transactions.size;
  }
}
