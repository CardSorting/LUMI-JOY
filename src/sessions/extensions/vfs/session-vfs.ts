import * as fs from "node:fs/promises";
import * as path from "node:path";

export interface VfsFileOverlay {
  path: string;
  content: string;
  isDeleted: boolean;
  timestamp: number;
}

export class SessionVfs {
  private readonly stagedFiles: Map<string, VfsFileOverlay>;

  constructor() {
    this.stagedFiles = new Map();
  }

  stageWrite(filePath: string, content: string): void {
    const normalized = path.normalize(filePath);
    this.stagedFiles.set(normalized, {
      path: normalized,
      content,
      isDeleted: false,
      timestamp: Date.now(),
    });
  }

  stageDelete(filePath: string): void {
    const normalized = path.normalize(filePath);
    this.stagedFiles.set(normalized, {
      path: normalized,
      content: "",
      isDeleted: true,
      timestamp: Date.now(),
    });
  }

  getFile(filePath: string): VfsFileOverlay | undefined {
    return this.stagedFiles.get(path.normalize(filePath));
  }

  hasStaged(filePath: string): boolean {
    return this.stagedFiles.has(path.normalize(filePath));
  }

  unstage(filePath: string): boolean {
    return this.stagedFiles.delete(path.normalize(filePath));
  }

  clear(): void {
    this.stagedFiles.clear();
  }

  exportStaged(): VfsFileOverlay[] {
    return Array.from(this.stagedFiles.values());
  }

  async commitAll(): Promise<string[]> {
    const committedPaths: string[] = [];
    for (const overlay of this.stagedFiles.values()) {
      if (overlay.isDeleted) {
        try {
          await fs.unlink(overlay.path);
          committedPaths.push(overlay.path);
        } catch {
          // Ignore if missing
        }
      } else {
        const dir = path.dirname(overlay.path);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(overlay.path, overlay.content, "utf-8");
        committedPaths.push(overlay.path);
      }
    }
    this.stagedFiles.clear();
    return committedPaths;
  }
}
