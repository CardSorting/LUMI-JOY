import * as path from "node:path";
import * as fs from "node:fs/promises";

/**
 * CommandPathResolver.
 * Absorbed from packages/utils/src/which.ts (Pass 47 / ADR-012).
 *
 * Resolves binary executable paths within the environment PATH variable cross-platform.
 */
export class CommandPathResolver {
  async which(commandName: string): Promise<string | undefined> {
    if (path.isAbsolute(commandName)) {
      try {
        await fs.access(commandName, fs.constants.X_OK);
        return commandName;
      } catch {
        return undefined;
      }
    }

    const pathEnv = process.env.PATH ?? "";
    const pathDirs = pathEnv.split(process.platform === "win32" ? ";" : ":");
    const extensions = process.platform === "win32" ? [".exe", ".cmd", ".bat", ""] : [""];

    for (const dir of pathDirs) {
      if (!dir) continue;
      for (const ext of extensions) {
        const fullPath = path.join(dir, commandName + ext);
        try {
          await fs.access(fullPath, fs.constants.X_OK);
          return fullPath;
        } catch {
          // Keep searching
        }
      }
    }

    return undefined;
  }
}
