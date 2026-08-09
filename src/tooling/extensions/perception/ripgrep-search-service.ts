import * as fs from "node:fs/promises";
import * as path from "node:path";

export interface RipgrepMatch {
  filePath: string;
  lineNumber: number;
  lineContent: string;
}

/**
 * RipgrepSearchService.
 * Absorbed from packages/codemarie/src/services/ripgrep (Pass 77 / ADR-012).
 *
 * High-speed pattern matching across workspace files.
 */
export class RipgrepSearchService {
  async search(query: string, searchDir: string): Promise<RipgrepMatch[]> {
    const matches: RipgrepMatch[] = [];
    const regex = new RegExp(query, "i");

    const walkAndSearch = async (dir: string): Promise<void> => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "dist") {
            continue;
          }

          if (entry.isDirectory()) {
            await walkAndSearch(fullPath);
          } else if (entry.isFile()) {
            try {
              const content = await fs.readFile(fullPath, "utf-8");
              const lines = content.split("\n");
              for (let i = 0; i < lines.length; i++) {
                if (regex.test(lines[i])) {
                  matches.push({
                    filePath: fullPath,
                    lineNumber: i + 1,
                    lineContent: lines[i].trim(),
                  });
                }
              }
            } catch {
              // Skip unreadable binary files
            }
          }
        }
      } catch {
        // Unreadable directory
      }
    };

    await walkAndSearch(searchDir);
    return matches;
  }
}
