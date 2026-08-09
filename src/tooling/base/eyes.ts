import * as fs from "node:fs/promises";

export interface FileReadOptions {
  startLine?: number;
  endLine?: number;
}

export interface FileViewResult {
  path: string;
  content: string;
  totalLines: number;
}

export class Eyes {
  async readFile(filePath: string, options?: FileReadOptions): Promise<FileViewResult> {
    const rawContent = await fs.readFile(filePath, "utf-8");
    const lines = rawContent.split("\n");
    const totalLines = lines.length;

    let start = (options?.startLine ?? 1) - 1;
    let end = options?.endLine ?? totalLines;

    if (start < 0) start = 0;
    if (end > totalLines) end = totalLines;

    const sliced = lines.slice(start, end).join("\n");
    return {
      path: filePath,
      content: sliced,
      totalLines,
    };
  }

  async listDirectory(dirPath: string): Promise<string[]> {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    return entries.map((entry) => {
      const suffix = entry.isDirectory() ? "/" : "";
      return `${entry.name}${suffix}`;
    });
  }

  async exists(targetPath: string): Promise<boolean> {
    try {
      await fs.access(targetPath);
      return true;
    } catch {
      return false;
    }
  }
}
