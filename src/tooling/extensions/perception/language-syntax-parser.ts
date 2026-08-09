export interface SyntaxSymbol {
  kind: "import" | "export" | "class" | "function" | "interface" | "type";
  name: string;
  line: number;
}

/**
 * LanguageSyntaxParser.
 * Absorbed from packages/codemarie/src/services/tree-sitter/languageParser.ts (Pass 80 / ADR-012).
 *
 * Fast multi-language syntax tree symbol extractor.
 */
export class LanguageSyntaxParser {
  parseSymbols(codeContent: string): SyntaxSymbol[] {
    const symbols: SyntaxSymbol[] = [];
    const lines = codeContent.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNum = i + 1;

      if (line.startsWith("import ")) {
        symbols.push({ kind: "import", name: line.slice(0, 40), line: lineNum });
      } else if (line.startsWith("export class ") || line.startsWith("class ")) {
        const match = /(?:export\s+)?class\s+([A-Za-z0-9_]+)/.exec(line);
        if (match) symbols.push({ kind: "class", name: match[1], line: lineNum });
      } else if (line.startsWith("export function ") || line.startsWith("function ") || line.includes(" async function ")) {
        const match = /(?:export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_]+)/.exec(line);
        if (match) symbols.push({ kind: "function", name: match[1], line: lineNum });
      } else if (line.startsWith("export interface ") || line.startsWith("interface ")) {
        const match = /(?:export\s+)?interface\s+([A-Za-z0-9_]+)/.exec(line);
        if (match) symbols.push({ kind: "interface", name: match[1], line: lineNum });
      } else if (line.startsWith("export type ") || line.startsWith("type ")) {
        const match = /(?:export\s+)?type\s+([A-Za-z0-9_]+)/.exec(line);
        if (match) symbols.push({ kind: "type", name: match[1], line: lineNum });
      }
    }

    return symbols;
  }
}
