import * as fs from "node:fs/promises";
import * as path from "node:path";
import { AbstractSessionStore } from "../../core/abstracts/abstract-session-store.js";
import type { GameStateSnapshot, SessionMessage } from "../../core/contracts/session.contracts.js";
import type { SessionCompactor } from "./session-compactor.js";
import type { SessionVfs } from "./session-vfs.js";
import type { SessionMemoryStore } from "./session-memory-store.js";
import type { ModelResolver } from "../../agents/extensions/model-resolver.js";

export class PersistentSessionStore extends AbstractSessionStore {
  compact(compactor: SessionCompactor): void {
    this.messages = compactor.compact(this.messages);
  }

  fork(): PersistentSessionStore {
    return new PersistentSessionStore(this.messages);
  }

  exportJsonl(): string {
    return this.messages.map((msg) => JSON.stringify(msg)).join("\n");
  }

  importJsonl(jsonlData: string): void {
    const lines = jsonlData.split("\n").filter((line) => line.trim().length > 0);
    const parsed: SessionMessage[] = lines.map((line) => JSON.parse(line));
    this.messages = parsed;
  }

  async saveToFile(filePath: string): Promise<void> {
    const parentDir = path.dirname(filePath);
    await fs.mkdir(parentDir, { recursive: true });
    await fs.writeFile(filePath, this.exportJsonl(), "utf-8");
  }

  async loadFromFile(filePath: string): Promise<void> {
    const content = await fs.readFile(filePath, "utf-8");
    this.importJsonl(content);
  }

  createSnapshot(
    frameIndex: number,
    sessionVfs?: SessionVfs,
    sessionMemoryStore?: SessionMemoryStore,
    modelResolver?: ModelResolver
  ): GameStateSnapshot {
    return {
      snapshotId: `snapshot-frame-${frameIndex}-${Date.now()}`,
      frameIndex,
      timestamp: Date.now(),
      messages: this.messages.map((msg) => ({ ...msg })),
      stagedFiles: sessionVfs ? sessionVfs.exportStaged() : [],
      memories: sessionMemoryStore ? [...sessionMemoryStore.listMemories()] : [],
      modelMetrics: modelResolver ? { ...modelResolver.getMetrics() } : { totalTurns: 0, totalTokensEstimated: 0, fallbackTriggeredCount: 0 },
    };
  }

  rewindToSnapshot(snapshot: GameStateSnapshot): void {
    this.messages = snapshot.messages.map((msg) => ({ ...msg }));
  }
}

export { PersistentSessionStore as SessionStore };
