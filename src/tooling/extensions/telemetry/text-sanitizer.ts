/**
 * TerminalTextSanitizer.
 * Absorbed from packages/utils/src/sanitize-text.ts (Pass 49 / ADR-012).
 * Pass 192: Integrated BroccoliCommandOutputBuffer for bounded stream output chunking and safe head/tail
 * summary truncation within a unified terminal text processing pipeline (ADR-081).
 *
 * Strips ANSI escape sequences, terminal control characters, and hidden unicode overrides from text.
 * Provides a combined sanitize+buffer pipeline via sanitizeAndBuffer().
 */
import { BroccoliCommandOutputBuffer } from "./broccolidb-output-buffer.js";
import { BroccoliCommandDiagnostics } from "../permissions/broccolidb-command-diagnostics.js";

export class TerminalTextSanitizer {
  /** Embedded bounded stream output buffer. */
  readonly outputBuffer = new BroccoliCommandOutputBuffer();

  /** Embedded command failure diagnostics. */
  readonly commandDiagnostics = new BroccoliCommandDiagnostics();

  stripAnsi(input: string): string {
    // Regular expression matching ANSI escape codes (CSI, SGR, OSC)
    const ansiRegex = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
    return input.replace(ansiRegex, "");
  }

  sanitize(input: string): string {
    const stripped = this.stripAnsi(input);
    // Remove control characters (except newline \n, carriage return \r, tab \t)
    const controlCodeRegex = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;
    return stripped.replace(controlCodeRegex, "");
  }

  /**
   * Sanitizes a terminal chunk then appends it to the bounded output buffer.
   * Use getFormattedSummary() to retrieve a head/tail-truncated view when output exceeds limits.
   */
  sanitizeAndBuffer(chunk: string): void {
    const clean = this.sanitize(chunk);
    this.outputBuffer.appendChunk(clean);
  }

  /**
   * Returns sanitized, optionally bounded/truncated buffer content.
   */
  getFormattedSummary(maxLines?: number, maxBytes?: number): string {
    return this.outputBuffer.getFormattedSummary({ maxLines, maxBytes });
  }

  /**
   * Resets the output buffer (e.g. between command executions).
   */
  clearBuffer(): void {
    this.outputBuffer.clear();
  }
}
