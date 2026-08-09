export interface FrontmatterResult<T = Record<string, string>> {
  attributes: T;
  body: string;
}

/**
 * FrontmatterParser.
 * Absorbed from packages/utils/src/frontmatter.ts (Pass 43 / ADR-012).
 *
 * Extracts and parses YAML frontmatter headers from markdown documents and skills.
 */
export class FrontmatterParser {
  parse<T = Record<string, string>>(content: string): FrontmatterResult<T> {
    const pattern = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
    const match = pattern.exec(content);

    if (!match) {
      return {
        attributes: {} as T,
        body: content,
      };
    }

    const frontmatterBlock = match[1];
    const body = content.slice(match[0].length);

    const attributes: Record<string, string> = {};
    for (const line of frontmatterBlock.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const colonIndex = trimmed.indexOf(":");
      if (colonIndex > -1) {
        const key = trimmed.slice(0, colonIndex).trim();
        let value = trimmed.slice(colonIndex + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        attributes[key] = value;
      }
    }

    return {
      attributes: attributes as T,
      body,
    };
  }
}
