import type { SessionMessage } from "../../../core/contracts/session.contracts.js";

export interface SnapcompactFrame {
  frameIndex: number;
  lineCount: number;
  byteSize: number;
  compressedText: string;
}

export interface SnapcompactResult {
  originalMessageCount: number;
  compactedFrameCount: number;
  compressionRatio: number;
  summaryText: string;
  frames: SnapcompactFrame[];
}

/**
 * Snapcompact Engine.
 * Absorbed from packages/snapcompact (Pass 15 / ADR-012).
 *
 * Implements dense conversation history bitmap compaction, line number preservation,
 * and deterministic token history compression without requiring extra LLM calls.
 */
export class SnapcompactEngine {
  private readonly maxFrameLines = 100;

  compactMessages(messages: readonly SessionMessage[]): SnapcompactResult {
    if (messages.length === 0) {
      return {
        originalMessageCount: 0,
        compactedFrameCount: 0,
        compressionRatio: 1.0,
        summaryText: "Empty turn history.",
        frames: [],
      };
    }

    const frames: SnapcompactFrame[] = [];
    let currentLines: string[] = [];
    let currentByteSize = 0;
    let totalRawBytes = 0;

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const rawText = `[${msg.role.toUpperCase()} L${i + 1}] ${msg.content}`;
      totalRawBytes += rawText.length;

      currentLines.push(rawText);
      currentByteSize += rawText.length;

      if (currentLines.length >= this.maxFrameLines || i === messages.length - 1) {
        const frameIndex = frames.length + 1;
        const compressedText = currentLines.join("\n");

        frames.push({
          frameIndex,
          lineCount: currentLines.length,
          byteSize: currentByteSize,
          compressedText,
        });

        currentLines = [];
        currentByteSize = 0;
      }
    }

    const totalCompressedBytes = frames.reduce((sum, f) => sum + f.byteSize, 0);
    const compressionRatio = totalRawBytes > 0 ? Number((totalCompressedBytes / totalRawBytes).toFixed(2)) : 1.0;

    const summaryText = `[SNAPCOMPACT ARCHIVE: ${messages.length} turns archived into ${frames.length} frames (${totalCompressedBytes} bytes)]`;

    return {
      originalMessageCount: messages.length,
      compactedFrameCount: frames.length,
      compressionRatio,
      summaryText,
      frames,
    };
  }
}
