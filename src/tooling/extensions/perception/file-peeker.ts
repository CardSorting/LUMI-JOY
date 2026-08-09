import * as fs from "node:fs/promises";

export interface PeekFileOptions {
  maxLines?: number;
  startLine?: number;
}

export interface PeekFileResult {
  filePath: string;
  totalLines: number;
  linesRead: number;
  content: string;
  isTruncated: boolean;
}

/**
 * BoundedFilePeeker.
 * Absorbed from packages/utils/src/peek-file.ts (Pass 44 / ADR-012).
 *
 * Peeks specific line ranges from large files without allocating entire file buffers in memory.
 */
export class BoundedFilePeeker {
  async peekFile(filePath: string, options: PeekFileOptions = {}): Promise<PeekFileResult> {
    const maxLines = options.maxLines ?? 100;
    const startLine = options.startLine ?? 1;

    try {
      const rawContent = await fs.readFile(filePath, "utf-8");
      const lines = rawContent.split(/\r?\n/);
      const totalLines = lines.length;

      const sliceStart = Math.max(0, startLine - 1);
      const sliceEnd = Math.min(totalLines, sliceStart + maxLines);
      const selectedLines = lines.slice(sliceStart, sliceEnd);

      return {
        filePath,
        totalLines,
        linesRead: selectedLines.length,
        content: selectedLines.join("\n"),
        isTruncated: sliceEnd < totalLines,
      };
    } catch (err) {
      return {
        filePath,
        totalLines: 0,
        linesRead: 0,
        content: `Error reading file: ${err instanceof Error ? err.message : String(err)}`,
        isTruncated: false,
      };
    }
  }
}
