import * as fs from "node:fs/promises";
import * as path from "node:path";
import { AbstractSessionStore } from "../../../core/abstracts/abstract-session-store.js";
import type { GameStateSnapshot, SessionMessage, SlabBufferSnapshot } from "../../../core/contracts/session.contracts.js";
import { ArenaAllocator } from "../substrate/arena-allocator.js";
import type { SessionCompactor } from "../compaction/session-compactor.js";
import type { SessionVfs } from "../vfs/session-vfs.js";
import type { SessionMemoryStore } from "../memory/session-memory-store.js";
import type { ModelResolver } from "../../../agents/extensions/resolution/model-resolver.js";

export class PersistentSessionStore extends AbstractSessionStore {
  private readonly arena: ArenaAllocator;

  constructor(initialMessages: SessionMessage[] = [], arenaCapacityBytes?: number) {
    super(initialMessages);
    this.arena = new ArenaAllocator(arenaCapacityBytes ?? 16 * 1024 * 1024);
    for (const msg of this.messages) {
      if (msg.content) {
        this.arena.allocateString(msg.content);
      }
    }
  }

  addMessage(message: Omit<SessionMessage, "timestamp">): SessionMessage {
    const fullMessage = super.addMessage(message);
    if (fullMessage.content) {
      this.arena.allocateString(fullMessage.content);
    }
    return fullMessage;
  }

  clear(): void {
    super.clear();
    this.arena.reset();
  }

  compact(compactor: SessionCompactor): void {
    this.messages = compactor.compact(this.messages);
    this.arena.reset();
    for (const msg of this.messages) {
      if (msg.content) {
        this.arena.allocateString(msg.content);
      }
    }
  }

  fork(): PersistentSessionStore {
    const forkedStore = new PersistentSessionStore(this.messages, this.arena.getCapacityBytes());
    forkedStore.arena.setOffset(this.arena.getOffset());
    return forkedStore;
  }

  exportJsonl(): string {
    return this.messages.map((msg) => JSON.stringify(msg)).join("\n");
  }

  importJsonl(jsonlData: string): void {
    const lines = jsonlData.split("\n").filter((line) => line.trim().length > 0);
    const parsed: SessionMessage[] = lines.map((line) => JSON.parse(line));
    this.messages = parsed;
    this.arena.reset();
    for (const msg of this.messages) {
      if (msg.content) {
        this.arena.allocateString(msg.content);
      }
    }
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

  getSlabSnapshot(): SlabBufferSnapshot {
    return {
      capacityBytes: this.arena.getCapacityBytes(),
      offsetWords: this.arena.getOffset(),
      allocatedBytes: this.arena.getAllocatedBytes(),
      resetCount: this.arena.getResetCount(),
    };
  }

  resetSlab(): void {
    this.arena.reset();
  }

  createSnapshot(
    frameIndex: number,
    sessionVfs?: SessionVfs,
    sessionMemoryStore?: SessionMemoryStore,
    modelResolver?: ModelResolver
  ): GameStateSnapshot {
    const stagedFiles = sessionVfs
      ? sessionVfs.exportStaged().map((f) => ({
          path: f.path,
          originalContent: "",
          stagedContent: f.content,
          isNew: !f.isDeleted,
        }))
      : [];

    return {
      snapshotId: `snapshot-frame-${frameIndex}-${Date.now()}`,
      frameIndex,
      timestamp: Date.now(),
      messages: this.messages.map((msg) => ({ ...msg })),
      stagedFiles,
      memories: sessionMemoryStore ? [...sessionMemoryStore.listMemories()] : [],
      modelMetrics: modelResolver ? { ...modelResolver.getMetrics() } : { totalTurns: 0, totalTokensEstimated: 0, fallbackTriggeredCount: 0 },
      slabSnapshot: this.getSlabSnapshot(),
    };
  }

  rewindToSnapshot(snapshot: GameStateSnapshot): void {
    this.messages = snapshot.messages.map((msg) => ({ ...msg }));
    if (snapshot.slabSnapshot) {
      this.arena.setOffset(snapshot.slabSnapshot.offsetWords);
    } else {
      this.arena.reset();
    }
  }
}

export { PersistentSessionStore as SessionStore };
