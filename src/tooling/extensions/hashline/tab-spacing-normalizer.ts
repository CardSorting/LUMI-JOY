/**
 * TabSpacingNormalizer.
 * Absorbed from packages/utils/src/tab-spacing.ts (Pass 55 / ADR-012).
 *
 * Normalizes tab characters to spaces (and vice versa) for accurate line delta matching.
 */
export class TabSpacingNormalizer {
  private readonly tabWidth: number;

  constructor(tabWidth = 2) {
    this.tabWidth = tabWidth;
  }

  expandTabs(text: string): string {
    const spaces = " ".repeat(this.tabWidth);
    return text.replace(/\t/g, spaces);
  }

  unexpandSpaces(text: string): string {
    const spaces = " ".repeat(this.tabWidth);
    const regex = new RegExp(spaces, "g");
    return text.replace(regex, "\t");
  }
}
