/**
 * TerminalTextSanitizer.
 * Absorbed from packages/utils/src/sanitize-text.ts (Pass 49 / ADR-012).
 *
 * Strips ANSI escape sequences, terminal control characters, and hidden unicode overrides from text.
 */
export class TerminalTextSanitizer {
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
}
