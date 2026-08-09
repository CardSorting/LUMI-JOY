export interface MemoryEntry {
  key: string;
  value: string;
  category: "fact" | "rule" | "troubleshooting" | "ki";
  timestamp: number;
}

export class SessionMemoryStore {
  private readonly memories: Map<string, MemoryEntry>;

  constructor(initialEntries: MemoryEntry[] = []) {
    this.memories = new Map();
    for (const entry of initialEntries) {
      this.memories.set(entry.key, { ...entry });
    }
  }

  saveMemory(key: string, value: string, category: MemoryEntry["category"] = "fact"): MemoryEntry {
    const entry: MemoryEntry = {
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
    const lowerQuery = query.toLowerCase();
    const results: MemoryEntry[] = [];
    for (const entry of this.memories.values()) {
      if (
        entry.key.toLowerCase().includes(lowerQuery) ||
        entry.value.toLowerCase().includes(lowerQuery) ||
        entry.category.toLowerCase().includes(lowerQuery)
      ) {
        results.push(entry);
      }
    }
    return results;
  }

  listMemories(): readonly MemoryEntry[] {
    return Array.from(this.memories.values());
  }

  exportJson(): string {
    return JSON.stringify(Array.from(this.memories.values()), null, 2);
  }

  importJson(jsonData: string): void {
    const parsed: MemoryEntry[] = JSON.parse(jsonData);
    this.memories.clear();
    for (const entry of parsed) {
      this.memories.set(entry.key, entry);
    }
  }

  clear(): void {
    this.memories.clear();
  }
}
