import * as fs from "node:fs/promises";
import { AbstractHands } from "../../core/abstracts/abstract-hands.js";
import type { CommandResult, AnchoredEditResult } from "../../core/contracts/tooling.contracts.js";

export interface HandsGuardOptions {
  maxOutputBytes?: number;
  maxOutputLines?: number;
}

export class AnchoredHands extends AbstractHands {
  readonly maxOutputBytes: number;
  readonly maxOutputLines: number;

  constructor(options: HandsGuardOptions = {}) {
    super();
    this.maxOutputBytes = options.maxOutputBytes ?? 100 * 1024;
    this.maxOutputLines = options.maxOutputLines ?? 1000;
  }

  static computeLineHash(lineContent: string): string {
    let hash = 0;
    const str = lineContent.trim();
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `h${Math.abs(hash).toString(16)}`;
  }

  async applyAnchoredEdit(
    filePath: string,
    lineNumber: number,
    expectedHash: string,
    replacementLineContent: string
  ): Promise<AnchoredEditResult> {
    try {
      const rawContent = await fs.readFile(filePath, "utf-8");
      const lines = rawContent.split("\n");
      const targetIdx = lineNumber - 1;

      if (targetIdx < 0 || targetIdx >= lines.length) {
        return { success: false, error: `Line number ${lineNumber} out of bounds (total lines: ${lines.length})` };
      }

      const currentLine = lines[targetIdx];
      const actualHash = AnchoredHands.computeLineHash(currentLine);

      if (expectedHash !== "*" && actualHash !== expectedHash) {
        return {
          success: false,
          actualHash,
          expectedHash,
          error: `Line anchor hash mismatch at line ${lineNumber}. Expected '${expectedHash}', found '${actualHash}'`,
        };
      }

      lines[targetIdx] = replacementLineContent;
      await fs.writeFile(filePath, lines.join("\n"), "utf-8");
      return { success: true, actualHash, expectedHash };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  async runCommand(command: string, cwd: string): Promise<CommandResult> {
    const rawRes = await this.runRawProcess(command, cwd);
    const sanitizedStdout = this.applyStreamGuardrail(rawRes.stdout);
    const sanitizedStderr = this.applyStreamGuardrail(rawRes.stderr);

    return {
      stdout: sanitizedStdout.content,
      stderr: sanitizedStderr.content,
      exitCode: rawRes.exitCode,
      truncated: sanitizedStdout.truncated || sanitizedStderr.truncated,
    };
  }

  private applyStreamGuardrail(output: string): { content: string; truncated: boolean } {
    let truncated = false;
    let content = output;

    const lines = content.split("\n");
    if (lines.length > this.maxOutputLines) {
      content = lines.slice(0, this.maxOutputLines).join("\n") + `\n[Stream Notice: Output truncated at ${this.maxOutputLines} lines]`;
      truncated = true;
    }

    if (Buffer.byteLength(content, "utf-8") > this.maxOutputBytes) {
      content = content.slice(0, this.maxOutputBytes) + "\n[Stream Notice: Output truncated due to byte size guardrail]";
      truncated = true;
    }

    return { content, truncated };
  }
}

export { AnchoredHands as Hands };
