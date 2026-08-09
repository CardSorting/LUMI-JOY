import * as fs from "node:fs/promises";
import * as path from "node:path";
import { GitIgnoreFilter } from "./git-ignore-filter.js";

export interface FileTreeNode {
  relativePath: string;
  isDirectory: boolean;
  sizeBytes?: number;
}

/**
 * WorkspaceTreeWalker.
 * Absorbed in Pass 68 (ADR-036 / ADR-012).
 *
 * Traverses workspace directories recursively respecting .gitignore filters.
 */
export class WorkspaceTreeWalker {
  private readonly gitIgnoreFilter: GitIgnoreFilter;

  constructor(gitIgnoreFilter = new GitIgnoreFilter()) {
    this.gitIgnoreFilter = gitIgnoreFilter;
  }

  async walk(rootDir: string, currentSubDir = ""): Promise<FileTreeNode[]> {
    const fullDir = path.join(rootDir, currentSubDir);
    const results: FileTreeNode[] = [];

    try {
      const entries = await fs.readdir(fullDir, { withFileTypes: true });

      for (const entry of entries) {
        const relPath = currentSubDir ? path.join(currentSubDir, entry.name) : entry.name;

        if (this.gitIgnoreFilter.isIgnored(relPath)) continue;

        if (entry.isDirectory()) {
          results.push({ relativePath: relPath, isDirectory: true });
          const subResults = await this.walk(rootDir, relPath);
          results.push(...subResults);
        } else {
          const stats = await fs.stat(path.join(rootDir, relPath));
          results.push({ relativePath: relPath, isDirectory: false, sizeBytes: stats.size });
        }
      }
    } catch {
      // Directory unreadable or doesn't exist
    }

    return results;
  }
}
