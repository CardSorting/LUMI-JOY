import * as fs from "node:fs/promises";
import * as path from "node:path";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import type { IHands } from "../contracts/tooling.contracts.js";

const execAsync = promisify(exec);

export abstract class AbstractHands implements IHands {
  async writeFile(filePath: string, content: string): Promise<void> {
    const parentDir = path.dirname(filePath);
    await fs.mkdir(parentDir, { recursive: true });
    await fs.writeFile(filePath, content, "utf-8");
  }

  async editFile(
    filePath: string,
    target: string,
    replacement: string
  ): Promise<boolean> {
    const content = await fs.readFile(filePath, "utf-8");
    if (!content.includes(target)) {
      return false;
    }
    const updated = content.replace(target, replacement);
    await fs.writeFile(filePath, updated, "utf-8");
    return true;
  }

  protected async runRawProcess(command: string, cwd: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    try {
      const { stdout, stderr } = await execAsync(command, { cwd });
      return { stdout, stderr, exitCode: 0 };
    } catch (err: unknown) {
      const errorObj = err as { stdout?: string; stderr?: string; code?: number };
      return {
        stdout: errorObj.stdout ?? "",
        stderr: errorObj.stderr ?? String(err),
        exitCode: errorObj.code ?? 1,
      };
    }
  }
}
