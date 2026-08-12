/**
 * [LAYER: SESSIONS EXTENSION]
 * Pass 118: Zero-Dependency Broccoli Substrate Store
 *
 * Lifted from /Users/bozoegg/Downloads/codemarie-new/broccolidb (repository.ts, workspace.ts).
 * Replaces SQLite/Kysely with pure TypeScript in-memory indexing, entity table mapping,
 * JSON snapshot persistence, and atomic transaction rollback checkpoints. Zero external dependencies.
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";

export interface SubstrateEntity {
  id: string;
  table: string;
  data: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export interface SubstrateQueryFilter {
  table: string;
  where?: Record<string, unknown>;
  limit?: number;
}

export interface SubstrateTransactionCheckpoint {
  checkpointId: string;
  timestamp: number;
  entityCount: number;
}

/**
 * Zero-dependency operational substrate store.
 */
export class BroccoliSubstrateStore {
  private readonly entities = new Map<string, SubstrateEntity>();
  private readonly checkpoints = new Map<string, Map<string, SubstrateEntity>>();
  private readonly dbPath?: string;

  constructor(dbPath?: string) {
    this.dbPath = dbPath;
  }

  /**
   * Inserts or updates an entity record in the substrate store.
   */
  public putEntity(table: string, id: string, data: Record<string, unknown>): SubstrateEntity {
    const key = `${table}:${id}`;
    const now = Date.now();
    const existing = this.entities.get(key);

    const entity: SubstrateEntity = {
      id,
      table,
      data: { ...(existing?.data ?? {}), ...data },
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
    };

    this.entities.set(key, entity);
    return entity;
  }

  /**
   * Retrieves an entity record by table and ID.
   */
  public getEntity(table: string, id: string): SubstrateEntity | undefined {
    const key = `${table}:${id}`;
    return this.entities.get(key);
  }

  /**
   * Queries entities matching table and filter constraints.
   */
  public query(filter: SubstrateQueryFilter): SubstrateEntity[] {
    const results: SubstrateEntity[] = [];

    for (const entity of this.entities.values()) {
      if (entity.table !== filter.table) continue;

      if (filter.where) {
        let match = true;
        for (const [k, v] of Object.entries(filter.where)) {
          if (entity.data[k] !== v) {
            match = false;
            break;
          }
        }
        if (!match) continue;
      }

      results.push(entity);
      if (filter.limit && results.length >= filter.limit) break;
    }

    return results;
  }

  /**
   * Deletes an entity record from the store.
   */
  public deleteEntity(table: string, id: string): boolean {
    const key = `${table}:${id}`;
    return this.entities.delete(key);
  }

  /**
   * Creates an atomic transaction checkpoint for rollback safety.
   */
  public createCheckpoint(): SubstrateTransactionCheckpoint {
    const checkpointId = `chk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const snapshot = new Map<string, SubstrateEntity>();

    for (const [k, v] of this.entities.entries()) {
      snapshot.set(k, { ...v, data: { ...v.data } });
    }

    this.checkpoints.set(checkpointId, snapshot);
    return {
      checkpointId,
      timestamp: Date.now(),
      entityCount: snapshot.size,
    };
  }

  /**
   * Rolls back store state to a previously saved checkpoint.
   */
  public rollbackToCheckpoint(checkpointId: string): boolean {
    const snapshot = this.checkpoints.get(checkpointId);
    if (!snapshot) return false;

    this.entities.clear();
    for (const [k, v] of snapshot.entries()) {
      this.entities.set(k, { ...v, data: { ...v.data } });
    }
    return true;
  }

  /**
   * Saves store state to disk as JSON if dbPath was provided.
   */
  public async persistToDisk(): Promise<void> {
    if (!this.dbPath) return;
    const serializable = Array.from(this.entities.values());
    await fs.mkdir(path.dirname(this.dbPath), { recursive: true });
    await fs.writeFile(this.dbPath, JSON.stringify(serializable, null, 2), "utf-8");
  }

  /**
   * Loads store state from JSON disk snapshot.
   */
  public async loadFromDisk(): Promise<void> {
    if (!this.dbPath) return;
    try {
      const content = await fs.readFile(this.dbPath, "utf-8");
      const entities: SubstrateEntity[] = JSON.parse(content);
      this.entities.clear();
      for (const e of entities) {
        this.entities.set(`${e.table}:${e.id}`, e);
      }
    } catch {
      // Missing file
    }
  }

  /**
   * Returns store entity metrics.
   */
  public getMetrics(): { totalEntities: number; checkpointCount: number } {
    return {
      totalEntities: this.entities.size,
      checkpointCount: this.checkpoints.size,
    };
  }
}
