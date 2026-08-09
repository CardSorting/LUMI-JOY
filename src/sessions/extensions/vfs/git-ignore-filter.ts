import * as path from "node:path";

/**
 * GitIgnoreFilter.
 * Absorbed in Pass 67 (ADR-036 / ADR-012).
 *
 * Evaluates .gitignore matching rules during workspace indexing.
 */
export class GitIgnoreFilter {
  private readonly ignoredPatterns: string[];

  constructor(customPatterns: string[] = []) {
    this.ignoredPatterns = [
      "node_modules",
      ".git",
      "dist",
      "build",
      ".DS_Store",
      ...customPatterns,
    ];
  }

  isIgnored(filePath: string): boolean {
    const segments = filePath.split(path.sep);
    return segments.some((segment) =>
      this.ignoredPatterns.some((pattern) => segment === pattern || segment.endsWith(pattern))
    );
  }
}
