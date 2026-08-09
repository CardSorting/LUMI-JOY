import type { Eyes } from "../../base/eyes.js";
import type { AstPerceptionEyes } from "../perception/ast-eyes.js";

export interface DecompositionStep {
  action: "EXTRACT" | "MOVE" | "DECOUPLE" | "HARDEN";
  target: string;
  destination: string;
  reason: string;
  risk: "LOW" | "MEDIUM" | "HIGH";
}

export interface ModuleDecompositionReport {
  filePath: string;
  totalLines: number;
  symbolCount: number;
  integrityScore: number;
  couplingScore: number;
  recommendations: DecompositionStep[];
}

export interface ZombieSymbolResult {
  symbol: string;
  kind: string;
  filePath: string;
  line: number;
  importerCount: number;
  isOrphan: boolean;
}

/**
 * ModuleDecomposer & Zombie Symbol Auditor.
 * Absorbed from packages/codemarie/src/core/policy (Pass 10 / ADR-012).
 *
 * Calculates module coupling metrics, detects zombie/orphan symbols with zero active importers,
 * and generates structural refactoring decomposition plans.
 */
export class ModuleDecomposer {
  /**
   * Analyzes file content for structural coupling and integrity metrics.
   */
  analyzeModule(filePath: string, content: string): ModuleDecompositionReport {
    const lines = content.split("\n");
    const totalLines = lines.length;

    const symbolRegex = /(?:export\s+)?(?:abstract\s+)?\b(class|interface|function|type|enum)\s+([A-Za-z0-9_$]+)/g;
    const importRegex = /import\s+.*?from\s+["'](.*?)["']/g;

    let symbolCount = 0;
    let match: RegExpExecArray | null;
    while ((match = symbolRegex.exec(content)) !== null) {
      symbolCount += 1;
    }

    let importCount = 0;
    while ((match = importRegex.exec(content)) !== null) {
      importCount += 1;
    }

    // Health calculation heuristics
    const linePenalty = Math.max(0, (totalLines - 200) * 0.1);
    const symbolPenalty = Math.max(0, (symbolCount - 5) * 5);
    const integrityScore = Math.max(0, Math.round(100 - linePenalty - symbolPenalty));
    const couplingScore = Math.min(100, Math.round((importCount / Math.max(1, symbolCount)) * 25));

    const recommendations: DecompositionStep[] = [];
    if (totalLines > 300) {
      recommendations.push({
        action: "EXTRACT",
        target: "Monolithic file size",
        destination: "Domain-scoped sub-modules",
        reason: `File size (${totalLines} lines) exceeds target maximum of 300 lines.`,
        risk: "MEDIUM",
      });
    }

    if (symbolCount > 8) {
      recommendations.push({
        action: "DECOUPLE",
        target: "High symbol density",
        destination: "Separate single-responsibility files",
        reason: `File declares ${symbolCount} symbols. Decouple into distinct single-responsibility files.`,
        risk: "LOW",
      });
    }

    return {
      filePath,
      totalLines,
      symbolCount,
      integrityScore,
      couplingScore,
      recommendations,
    };
  }

  /**
   * Scans a directory for orphan/zombie exported symbols with zero active importers.
   */
  async auditZombieSymbols(dirPath: string, eyes: Eyes): Promise<ZombieSymbolResult[]> {
    const astEyes = eyes as AstPerceptionEyes;
    if (!astEyes.searchSymbols) {
      return [];
    }

    const allSymbols = await astEyes.searchSymbols(dirPath, "*");
    const results: ZombieSymbolResult[] = [];

    for (const sym of allSymbols) {
      if (sym.symbol === "LumiMonolith" || sym.symbol.startsWith("Abstract")) {
        continue;
      }

      // Check if symbol is referenced across other files
      const occurrences = await astEyes.searchSymbols(dirPath, sym.symbol);
      const uniqueImporterFiles = new Set(occurrences.map((o) => o.path).filter((p) => p !== sym.path));

      results.push({
        symbol: sym.symbol,
        kind: sym.kind,
        filePath: sym.path,
        line: sym.line,
        importerCount: uniqueImporterFiles.size,
        isOrphan: uniqueImporterFiles.size === 0,
      });
    }

    return results;
  }
}
