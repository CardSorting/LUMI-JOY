import type { Eyes } from "../../tooling/base/eyes.js";
import type { AbstractHands } from "../../core/abstracts/abstract-hands.js";

export interface StagedFile {
  path: string;
  originalContent: string;
  stagedContent: string;
  isNew: boolean;
}

export class SessionVfs {
  private readonly stagedFiles: Map<string, StagedFile>;

  constructor(initialStaged: StagedFile[] = []) {
    this.stagedFiles = new Map();
    for (const file of initialStaged) {
      this.stagedFiles.set(file.path, { ...file });
    }
  }

  async stageFile(filePath: string, newContent: string, eyes: Eyes): Promise<StagedFile> {
    const exists = await eyes.exists(filePath);
    let originalContent = "";

    if (exists) {
      const readRes = await eyes.readFile(filePath);
      originalContent = readRes.content;
    }

    const staged: StagedFile = {
      path: filePath,
      originalContent,
      stagedContent: newContent,
      isNew: !exists,
    };

    this.stagedFiles.set(filePath, staged);
    return staged;
  }

  getStagedFile(filePath: string): StagedFile | undefined {
    return this.stagedFiles.get(filePath);
  }

  listStaged(): readonly StagedFile[] {
    return Array.from(this.stagedFiles.values());
  }

  generateDiff(filePath: string): string | undefined {
    const staged = this.stagedFiles.get(filePath);
    if (!staged) return undefined;

    if (staged.isNew) {
      return `+++ ${staged.path} (NEW FILE)\n` + staged.stagedContent.split("\n").map((l) => `+ ${l}`).join("\n");
    }

    const origLines = staged.originalContent.split("\n");
    const newLines = staged.stagedContent.split("\n");
    const diffLines: string[] = [`--- ${staged.path} (ORIGINAL)`, `+++ ${staged.path} (STAGED)`];

    const maxLen = Math.max(origLines.length, newLines.length);
    for (let i = 0; i < maxLen; i++) {
      const orig = origLines[i];
      const next = newLines[i];
      if (orig !== next) {
        if (orig !== undefined) diffLines.push(`- ${orig}`);
        if (next !== undefined) diffLines.push(`+ ${next}`);
      } else {
        if (orig !== undefined) diffLines.push(`  ${orig}`);
      }
    }

    return diffLines.join("\n");
  }

  async commitAll(hands: AbstractHands): Promise<string[]> {
    const committedPaths: string[] = [];
    for (const staged of this.stagedFiles.values()) {
      await hands.writeFile(staged.path, staged.stagedContent);
      committedPaths.push(staged.path);
    }
    this.stagedFiles.clear();
    return committedPaths;
  }

  exportStaged(): StagedFile[] {
    return Array.from(this.stagedFiles.values()).map((f) => ({ ...f }));
  }

  clear(): void {
    this.stagedFiles.clear();
  }
}
