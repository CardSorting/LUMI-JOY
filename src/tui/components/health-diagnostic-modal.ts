import type { Component, Focusable } from "../tui.js";
import { Box } from "./box.js";
import { Markdown, type MarkdownTheme } from "./markdown.js";
import { VStack } from "./v-stack.js";
import { Text } from "./text.js";
import { matchesKey } from "../keys.js";

const HEALTH_MARKDOWN_THEME: MarkdownTheme = {
  heading: (text) => `\x1b[1;32m${text}\x1b[0m`,
  link: (text) => `\x1b[4;36m${text}\x1b[0m`,
  linkUrl: (text) => `\x1b[90m${text}\x1b[0m`,
  code: (text) => `\x1b[1;33m${text}\x1b[0m`,
  codeBlock: (text) => text,
  codeBlockBorder: (text) => `\x1b[90m${text}\x1b[0m`,
  quote: (text) => `\x1b[36m${text}\x1b[0m`,
  quoteBorder: (text) => `\x1b[90m${text}\x1b[0m`,
  hr: (text) => `\x1b[90m${text}\x1b[0m`,
  listBullet: (text) => `\x1b[32m${text}\x1b[0m`,
  bold: (text) => `\x1b[1;37m${text}\x1b[0m`,
  italic: (text) => `\x1b[3m${text}\x1b[0m`,
  strikethrough: (text) => `\x1b[9m${text}\x1b[0m`,
  underline: (text) => `\x1b[4m${text}\x1b[0m`,
};

export interface SubsystemHealthEntry {
  subsystem: string;
  status: "OPERATIONAL" | "DEGRADED" | "STANDBY";
  details: string;
}

export class HealthDiagnosticModal implements Component, Focusable {
  focused: boolean = false;
  private readonly container: Box;
  private readonly onClose: () => void;

  constructor(overallStatus: string, entries: SubsystemHealthEntry[], onClose: () => void) {
    this.onClose = onClose;

    const bgFn = (text: string) => `\x1b[48;5;235m${text}\x1b[0m`;
    this.container = new Box(2, 1, bgFn);

    const vstack = new VStack();
    const title = new Text(
      `\x1b[1;32m━━━ LUMI MONOLITH SUBSYSTEM DIAGNOSTIC AUDIT ━━━\x1b[0m`,
      0,
      0
    );

    let diagnosticMarkdown = `### Overall Verdict: \`${overallStatus}\`\n\n`;
    diagnosticMarkdown += `| Subsystem | Operational Status | Technical Invariants & Verification |\n`;
    diagnosticMarkdown += `| :--- | :---: | :--- |\n`;

    for (const entry of entries) {
      const statusColor = entry.status === "OPERATIONAL" ? "`[PASS]`" : "`[WARN]`";
      diagnosticMarkdown += `| **${entry.subsystem}** | ${statusColor} | ${entry.details} |\n`;
    }

    diagnosticMarkdown += `\n\x1b[90mPress [Esc], [q], or [Enter] to close this diagnostic report\x1b[0m`;

    const body = new Markdown(diagnosticMarkdown, 0, 0, HEALTH_MARKDOWN_THEME);

    vstack.addChild(title);
    vstack.addChild(body);
    this.container.addChild(vstack);
  }

  invalidate(): void {
    this.container.invalidate();
  }

  handleInput(data: string): void {
    if (matchesKey(data, "escape") || data === "q" || data === "Q" || matchesKey(data, "return")) {
      this.onClose();
    }
  }

  render(width: number): string[] {
    return this.container.render(width);
  }
}
