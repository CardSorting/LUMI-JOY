export interface SuppressionStats {
  totalProcessedLines: number;
  suppressedLines: number;
  passedLines: number;
}

/**
 * Pass 92: Stderr Guard Filter
 * Ingests stderr noise suppression and stream error filtering concepts from `packages/utils/src/stderr-guard.ts`.
 * Suppresses harmless CLI warning noise while maintaining critical error trace transparency.
 */
export class StderrGuardFilter {
  private suppressionPatterns: RegExp[];
  private processedCount: number;
  private suppressedCount: number;

  constructor() {
    this.processedCount = 0;
    this.suppressedCount = 0;
    this.suppressionPatterns = [
      /ExperimentalWarning/i,
      /DeprecationWarning/i,
      /Debugger attached/i,
      /punycode/i,
    ];
  }

  isSuppressedLine(line: string): boolean {
    return this.suppressionPatterns.some((pattern) => pattern.test(line));
  }

  filterNoise(text: string): string {
    const lines = text.split("\n");
    const cleanLines: string[] = [];

    for (const line of lines) {
      this.processedCount++;
      if (this.isSuppressedLine(line)) {
        this.suppressedCount++;
      } else {
        cleanLines.push(line);
      }
    }

    return cleanLines.join("\n");
  }

  getSuppressionStats(): SuppressionStats {
    return {
      totalProcessedLines: this.processedCount,
      suppressedLines: this.suppressedCount,
      passedLines: this.processedCount - this.suppressedCount,
    };
  }
}
