export interface StreamChunkEvent {
  type: "text_delta" | "tool_call_delta" | "finish";
  deltaText?: string;
  frameIndex: number;
  timestamp: number;
}

/**
 * StreamEventFormatter.
 * Absorbed from packages/agent/src/stream-fn.ts (Pass 29 / ADR-012).
 *
 * Formats response text stream chunks into standardized SSE / JSON-RPC event envelopes.
 */
export class StreamEventFormatter {
  formatTextDelta(text: string, frameIndex: number): StreamChunkEvent {
    return {
      type: "text_delta",
      deltaText: text,
      frameIndex,
      timestamp: Date.now(),
    };
  }

  formatFinishEvent(frameIndex: number): StreamChunkEvent {
    return {
      type: "finish",
      frameIndex,
      timestamp: Date.now(),
    };
  }

  toSseString(event: StreamChunkEvent): string {
    return `data: ${JSON.stringify(event)}\n\n`;
  }
}
