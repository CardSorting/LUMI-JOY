/**
 * [LAYER: TOOLING EXTENSION]
 * Pass 112: Lumi Ignore Policy Controller
 *
 * Controls LLM access to files by enforcing ignore patterns (.lumiignore / .gitignore).
 * Maintains policy generation counters, pattern matching, and access decision caching.
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";
import { BroccoliApprovalPolicyEngine } from "./broccolidb-approval-policy.js";

export interface IgnorePolicyStatus {
  hasPolicyFile: boolean;
  policyGeneration: number;
  activePatternsCount: number;
  cachedDecisionsCount: number;
}

/**
 * Parses ignore pattern rules (.gitignore / .lumiignore style).
 */
export class LumiIgnorePolicyController {
  private readonly cwd: string;
  private readonly ignorePatterns: string[] = [];
  private readonly accessDecisionCache = new Map<string, boolean>();
  private readonly MAX_DECISION_CACHE = 4096;
  private policyGeneration = 0;
  private hasPolicyFile = false;
  readonly approvalPolicyEngine = new BroccoliApprovalPolicyEngine();

  constructor(cwd: string = process.cwd()) {
    this.cwd = cwd;
  }

  /**
   * Initializes policy loading from workspace .lumiignore / .gitignore.
   */
  public async initialize(): Promise<void> {
    await this.refreshPolicy();
  }

  /**
   * Refreshes policy patterns from disk.
   */
  public async refreshPolicy(): Promise<void> {
    this.ignorePatterns.length = 0;
    this.accessDecisionCache.clear();
    this.hasPolicyFile = false;

    const ignoreFileNames = [".lumiignore", ".dietcodeignore", ".gitignore"];
    for (const fileName of ignoreFileNames) {
      const fullPath = path.resolve(this.cwd, fileName);
      try {
        const content = await fs.readFile(fullPath, "utf-8");
        this.parsePatterns(content);
        this.hasPolicyFile = true;
      } catch {
        // Ignore missing files
      }
    }

    this.policyGeneration++;
  }

  private parsePatterns(content: string): void {
    const lines = content.split(/\r?\n/);
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      if (!this.ignorePatterns.includes(line)) {
        this.ignorePatterns.push(line);
      }
    }
  }

  /**
   * Evaluates if a target relative or absolute file path is ignored by policy.
   */
  public isIgnored(targetPath: string): boolean {
    const relativePath = path.isAbsolute(targetPath)
      ? path.relative(this.cwd, targetPath)
      : targetPath;

    if (!relativePath || relativePath.startsWith("..")) {
      return false;
    }

    const cached = this.accessDecisionCache.get(relativePath);
    if (cached !== undefined) {
      return cached;
    }

    let ignored = false;
    const normalized = relativePath.replace(/\\/g, "/");

    for (const pattern of this.ignorePatterns) {
      if (pattern.startsWith("!")) {
        const negPattern = pattern.slice(1);
        if (this.matchPattern(normalized, negPattern)) {
          ignored = false;
        }
      } else {
        if (this.matchPattern(normalized, pattern)) {
          ignored = true;
        }
      }
    }

    if (this.accessDecisionCache.size >= this.MAX_DECISION_CACHE) {
      const firstKey = this.accessDecisionCache.keys().next().value;
      if (firstKey) this.accessDecisionCache.delete(firstKey);
    }

    this.accessDecisionCache.set(relativePath, ignored);
    return ignored;
  }

  private matchPattern(filePath: string, pattern: string): boolean {
    const cleanPattern = pattern.replace(/^\//, "").replace(/\/$/, "");
    if (filePath === cleanPattern || filePath.startsWith(cleanPattern + "/")) {
      return true;
    }
    if (cleanPattern.startsWith("*.")) {
      const ext = cleanPattern.slice(1);
      return filePath.endsWith(ext);
    }
    return false;
  }

  /**
   * Returns current policy metrics.
   */
  public getStatus(): IgnorePolicyStatus {
    return {
      hasPolicyFile: this.hasPolicyFile,
      policyGeneration: this.policyGeneration,
      activePatternsCount: this.ignorePatterns.length,
      cachedDecisionsCount: this.accessDecisionCache.size,
    };
  }
}
