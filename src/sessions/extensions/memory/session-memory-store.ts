export interface MemoryEntry {
  id: string;
  key: string;
  value: string;
  category: "fact" | "rule" | "troubleshooting" | "ki";
  timestamp: number;
}

export class SessionMemoryStore {
  private readonly memories: Map<string, MemoryEntry>;

  constructor(initialMemories: MemoryEntry[] = []) {
    this.memories = new Map();
    for (const mem of initialMemories) {
      this.memories.set(mem.key, mem);
    }
  }

  saveMemory(key: string, value: string, category: MemoryEntry["category"] = "fact"): MemoryEntry {
    const entry: MemoryEntry = {
      id: `mem-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      key,
      value,
      category,
      timestamp: Date.now(),
    };
    this.memories.set(key, entry);
    return entry;
  }

  getMemory(key: string): MemoryEntry | undefined {
    return this.memories.get(key);
  }

  searchMemories(query: string): MemoryEntry[] {
    const lower = query.toLowerCase();
    return Array.from(this.memories.values()).filter(
      (entry) =>
        entry.key.toLowerCase().includes(lower) ||
        entry.value.toLowerCase().includes(lower) ||
        entry.category.toLowerCase().includes(lower)
    );
  }

  listMemories(): MemoryEntry[] {
    return Array.from(this.memories.values());
  }

  deleteMemory(key: string): boolean {
    return this.memories.delete(key);
  }

  clear(): void {
    this.memories.clear();
  }

  formatMemoryContext(): string {
    if (this.memories.size === 0) return "";
    const lines = Array.from(this.memories.values()).map(
      (m) => `- [${m.category.toUpperCase()}] ${m.key}: ${m.value}`
    );
    return lines.join("\n");
  }
}
