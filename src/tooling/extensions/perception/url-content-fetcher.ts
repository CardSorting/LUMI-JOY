import { ResilientFetchClient } from "../telemetry/resilient-fetch-client.js";

/**
 * UrlContentFetcher.
 * Absorbed from packages/codemarie/src/services/browser/UrlContentFetcher.ts (Pass 79 / ADR-012).
 *
 * Fetches web URL contents and converts HTML markup into clean markdown formatting.
 */
export class UrlContentFetcher {
  private readonly fetchClient: ResilientFetchClient;

  constructor(fetchClient = new ResilientFetchClient()) {
    this.fetchClient = fetchClient;
  }

  async fetchMarkdown(url: string): Promise<{ success: boolean; markdown?: string; error?: string }> {
    const res = await this.fetchClient.fetchText(url);
    if (!res.ok) {
      return { success: false, error: `HTTP ${res.status}: ${res.error ?? "Failed to fetch URL"}` };
    }

    const html = res.data ?? "";
    const markdown = this.convertHtmlToMarkdown(html);

    return { success: true, markdown };
  }

  private convertHtmlToMarkdown(html: string): string {
    // Strip script and style blocks
    let clean = html.replace(/<script[\s\S]*?<\/script>/gi, "");
    clean = clean.replace(/<style[\s\S]*?<\/style>/gi, "");

    // Convert headings
    clean = clean.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "# $1\n\n");
    clean = clean.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "## $1\n\n");
    clean = clean.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "### $1\n\n");

    // Convert paragraphs & linebreaks
    clean = clean.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "$1\n\n");
    clean = clean.replace(/<br\s*\/?>/gi, "\n");

    // Strip remaining HTML tags
    clean = clean.replace(/<[^>]+>/g, "");

    return clean.trim();
  }
}
