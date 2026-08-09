import { ProtocolEars } from "../telemetry/ears.js";
import type { ToolingEvent, JsonRpcNotification, TerminalProgressFrame } from "../../../core/contracts/tooling.contracts.js";

/**
 * Reactive CLI terminal progress spinner & percent bar renderer.
 * Absorbed from packages/tui & packages/client via Non-Destructive Extension Pattern (Pass 8 / ADR-012).
 */
export class TerminalProgressRenderer {
  private readonly spinnerFrames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  private currentFrameIndex = 0;

  renderProgressBar(percent: number, width = 10): string {
    const clamped = Math.max(0, Math.min(100, percent));
    const filledCount = Math.round((clamped / 100) * width);
    const emptyCount = width - filledCount;
    return `[${"█".repeat(filledCount)}${"░".repeat(emptyCount)}] ${Math.round(clamped)}%`;
  }

  nextFrame(label: string, percent = 0): TerminalProgressFrame {
    const spinnerSymbol = this.spinnerFrames[this.currentFrameIndex % this.spinnerFrames.length];
    this.currentFrameIndex += 1;
    const progressBar = this.renderProgressBar(percent);
    return {
      frameIndex: this.currentFrameIndex,
      spinnerSymbol,
      label,
      percent: Math.round(percent),
      progressBar,
      timestamp: Date.now(),
    };
  }

  reset(): void {
    this.currentFrameIndex = 0;
  }
}

/**
 * Progress Streaming Protocol Ears Extension Class.
 * Adds reactive progress rendering and JSON-RPC progress notification streaming.
 */
export class ProgressStreamingEars extends ProtocolEars {
  readonly progressRenderer: TerminalProgressRenderer;

  constructor() {
    super();
    this.progressRenderer = new TerminalProgressRenderer();
  }

  emitProgress(label: string, percent = 0): JsonRpcNotification {
    const frame = this.progressRenderer.nextFrame(label, percent);
    const event: ToolingEvent = {
      type: "progress",
      source: "ProgressStreamingEars",
      payload: { ...frame as unknown as Record<string, unknown> },
      timestamp: frame.timestamp,
    };
    this.emit("progress", "ProgressStreamingEars", event.payload);
    return this.formatJsonRpcEvent(event);
  }
}
