import type { Component, Focusable } from "../tui.js";
import { Box } from "./box.js";
import { Markdown, type MarkdownTheme } from "./markdown.js";
import { VStack } from "./v-stack.js";
import { Text } from "./text.js";
import { matchesKey } from "../keys.js";

const HELP_MARKDOWN_THEME: MarkdownTheme = {
  heading: (text) => `\x1b[1;35m${text}\x1b[0m`,
  link: (text) => `\x1b[4;36m${text}\x1b[0m`,
  linkUrl: (text) => `\x1b[90m${text}\x1b[0m`,
  code: (text) => `\x1b[1;33m${text}\x1b[0m`,
  codeBlock: (text) => text,
  codeBlockBorder: (text) => `\x1b[90m${text}\x1b[0m`,
  quote: (text) => `\x1b[36m${text}\x1b[0m`,
  quoteBorder: (text) => `\x1b[90m${text}\x1b[0m`,
  hr: (text) => `\x1b[90m${text}\x1b[0m`,
  listBullet: (text) => `\x1b[35m${text}\x1b[0m`,
  bold: (text) => `\x1b[1;37m${text}\x1b[0m`,
  italic: (text) => `\x1b[3m${text}\x1b[0m`,
  strikethrough: (text) => `\x1b[9m${text}\x1b[0m`,
  underline: (text) => `\x1b[4m${text}\x1b[0m`,
};

export class HelpModal implements Component, Focusable {
  focused: boolean = false;
  private readonly container: Box;
  private readonly onClose: () => void;

  constructor(onClose: () => void) {
    this.onClose = onClose;

    const bgFn = (text: string) => `\x1b[48;5;235m${text}\x1b[0m`;
    this.container = new Box(2, 1, bgFn);

    const vstack = new VStack();
    const title = new Text(
      `\x1b[1;35m━━━ LUMI MONOLITH TUI QUICK HELP & SHORTCUTS REFERENCE ━━━\x1b[0m`,
      0,
      0
    );

    const body = new Markdown(
      `### Keyboard Navigation & Shortcuts\n` +
        `- \`Enter\` : Submit prompt or run slash command\n` +
        `- \`Shift + Enter\` or \`Alt + Enter\` : Insert new line in prompt editor\n` +
        `- \`↑ / ↓\` : Browse prompt history or navigate autocomplete list\n` +
        `- \`Tab\` : Trigger slash command & file autocomplete menu\n` +
        `- \`Ctrl + L\` or \`/clear\` : Clear screen history\n` +
        `- \`Ctrl + C\` or \`/exit\` : Quit application\n` +
        `- \`?\` or \`/help\` : Display this Help & Shortcuts Reference\n\n` +
        `### Slash Commands Reference\n` +
        `- **[Session]** \`/snapshot\` : Create immutable state snapshot checkpoint\n` +
        `- **[Session]** \`/clear\` : Clear message history from TUI view\n` +
        `- **[Session]** \`/exit\` : Terminate interactive REPL session\n` +
        `- **[System]**  \`/health\` : Audit subsystem operational health\n` +
        `- **[System]**  \`/setup\` : Launch interactive API key configuration wizard\n` +
        `- **[System]**  \`/about\` : Display monolith memory slab & performance specs\n\n` +
        `### Architecture Highlights\n` +
        `- **Zero-GC Contiguous Memory**: 16MB ArrayBuffer slab allocation\n` +
        `- **Performance SLA**: Sub-millisecond tick latency & O(1) state rewind\n` +
        `- **Differential Rendering**: High-frequency terminal viewport compositing\n\n` +
        `\x1b[90mPress [Esc], [q], or [Enter] to dismiss this help guide\x1b[0m`,
      0,
      0,
      HELP_MARKDOWN_THEME
    );

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
