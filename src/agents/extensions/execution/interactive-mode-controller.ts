import type { LumiMonolith } from "../../../index.js";

export interface InteractiveSessionOptions {
  sessionId?: string;
  enableTelemetry?: boolean;
}

/**
 * InteractiveModeController.
 * Absorbed from packages/coding-agent/src/modes (Pass 23 / ADR-012).
 *
 * Manages interactive prompt turn execution, streaming progress, and CLI turn events.
 */
export class InteractiveModeController {
  async executeInteractiveTurn(
    monolith: LumiMonolith,
    prompt: string,
    onProgress?: (label: string, percent: number) => void
  ): Promise<string> {
    if (onProgress) {
      onProgress("Processing frame tick prompt", 25);
    }

    const tickResult = await monolith.tick({ prompt });

    if (onProgress) {
      onProgress("Turn tick complete", 100);
    }

    return tickResult.response;
  }
}
