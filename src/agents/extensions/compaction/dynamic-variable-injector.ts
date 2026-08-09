import * as os from "node:os";

/**
 * DynamicVariableInjector.
 * Absorbed in Pass 71 (ADR-037 / ADR-012).
 *
 * Injects dynamic environment variables (OS, timestamp, cwd, shell) into system prompts.
 */
export class DynamicVariableInjector {
  getStandardVariables(cwd: string, modelName: string): Record<string, string> {
    return {
      OS: process.platform,
      ARCH: os.arch(),
      CWD: cwd,
      MODEL: modelName,
      TIMESTAMP: new Date().toISOString(),
    };
  }
}
