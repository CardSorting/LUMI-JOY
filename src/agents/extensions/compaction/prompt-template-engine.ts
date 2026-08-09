/**
 * PromptTemplateEngine.
 * Absorbed in Pass 70 (ADR-037 / ADR-012).
 *
 * Compiles handlebar template placeholders `{{variable}}` in system prompts.
 */
export class PromptTemplateEngine {
  render(template: string, variables: Record<string, string>): string {
    return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
      return variables[key] !== undefined ? variables[key] : `{{${key}}}`;
    });
  }
}
