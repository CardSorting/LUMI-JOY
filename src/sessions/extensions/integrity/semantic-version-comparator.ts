export interface ParsedSemver {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
}

/**
 * SemanticVersionComparator.
 * Absorbed from packages/utils/src/version.ts (Pass 56 / ADR-012).
 *
 * Parses and compares semantic version strings for package integrity checks.
 */
export class SemanticVersionComparator {
  parse(versionStr: string): ParsedSemver | undefined {
    const clean = versionStr.replace(/^[v^~]/, "").trim();
    const match = /^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/.exec(clean);

    if (!match) return undefined;

    return {
      major: parseInt(match[1], 10),
      minor: parseInt(match[2], 10),
      patch: parseInt(match[3], 10),
      prerelease: match[4],
    };
  }

  compare(v1Str: string, v2Str: string): number {
    const v1 = this.parse(v1Str);
    const v2 = this.parse(v2Str);

    if (!v1 || !v2) return 0;

    if (v1.major !== v2.major) return v1.major > v2.major ? 1 : -1;
    if (v1.minor !== v2.minor) return v1.minor > v2.minor ? 1 : -1;
    if (v1.patch !== v2.patch) return v1.patch > v2.patch ? 1 : -1;

    return 0;
  }

  isCompatible(v1Str: string, targetRangeStr: string): boolean {
    return this.compare(v1Str, targetRangeStr) >= 0;
  }
}
