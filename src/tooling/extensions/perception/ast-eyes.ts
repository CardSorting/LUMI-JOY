import * as fs from "node:fs/promises";
import * as path from "node:path";
import { Eyes } from "../../base/eyes.js";
import { BroccoliLspProtocolBridge } from "./broccolidb-lsp-bridge.js";

export interface SymbolSearchResult {
  path: string;
  line: number;
  symbol: string;
  kind: "class" | "interface" | "function" | "type" | "enum" | "const" | "var" | "let" | "export" | "unknown";
  snippet: string;
}

/**
 * Specialized AST Symbol Perception Eyes Subclass.
 * Absorbed from packages/codemarie via Non-Destructive Extension Pattern (Pass 7 / ADR-012).
 */
export class AstPerceptionEyes extends Eyes {
  readonly lspBridge: BroccoliLspProtocolBridge;

  constructor(workspaceRoot: string = process.cwd()) {
    super();
    this.lspBridge = new BroccoliLspProtocolBridge(workspaceRoot);
  }
  /**
   * Fast structural AST symbol indexing without heavy LSP daemon overhead.
   */
  async searchSymbols(dirPath: string, query: string): Promise<SymbolSearchResult[]> {
    const results: SymbolSearchResult[] = [];
    const lowerQuery = query.toLowerCase();
    const symbolRegex = /(?:export\s+)?(?:abstract\s+)?\b(class|interface|function|type|enum|const|let|var)\s+([A-Za-z0-9_$]+)/g;

    const walk = async (currentPath: string) => {
      let entries;
      try {
        entries = await fs.readdir(currentPath, { withFileTypes: true });
      } catch {
        return;
      }

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        if (entry.isDirectory()) {
          if (entry.name !== "node_modules" && entry.name !== ".git" && entry.name !== "dist") {
            await walk(fullPath);
          }
        } else if (entry.isFile() && /\.(ts|js|tsx|jsx|json)$/i.test(entry.name)) {
          try {
            const content = await fs.readFile(fullPath, "utf-8");
            const lines = content.split("\n");
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i];
              symbolRegex.lastIndex = 0;
              let match;
              while ((match = symbolRegex.exec(line)) !== null) {
                const kind = match[1] as SymbolSearchResult["kind"];
                const symbol = match[2];
                if (symbol.toLowerCase().includes(lowerQuery) || query === "*") {
                  results.push({
                    path: fullPath,
                    line: i + 1,
                    symbol,
                    kind,
                    snippet: line.trim(),
                  });
                }
              }
            }
          } catch {
            // ignore read errors
          }
        }
      }
    };

    const stat = await fs.stat(dirPath).catch(() => null);
    if (stat?.isFile()) {
      const content = await fs.readFile(dirPath, "utf-8").catch(() => "");
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        symbolRegex.lastIndex = 0;
        let match;
        while ((match = symbolRegex.exec(line)) !== null) {
          const kind = match[1] as SymbolSearchResult["kind"];
          const symbol = match[2];
          if (symbol.toLowerCase().includes(lowerQuery) || query === "*") {
            results.push({
              path: dirPath,
              line: i + 1,
              symbol,
              kind,
              snippet: line.trim(),
            });
          }
        }
      }
    } else {
      await walk(dirPath);
    }

    return results;
  }
}
