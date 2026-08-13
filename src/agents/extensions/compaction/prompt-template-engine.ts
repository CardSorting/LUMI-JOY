/**
 * PromptTemplateEngine.
 *
 * Enterprise-grade template engine for prompt compilation.
 * Supports handlebar variable placeholders `{{variable}}`, conditional blocks `{{#if variable}}...{{/if}}`,
 * and `{{#unless variable}}...{{/unless}}`.
 */
export class PromptTemplateEngine {
  render(template: string, variables: Record<string, string | boolean | undefined>): string {
    if (!template) return "";

    // 1. Process {{#if key}}...{{/if}} conditional blocks
    let output = template.replace(/\{\{#if\s+([a-zA-Z0-9_]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, key, body) => {
      const val = variables[key];
      const isTruthy = Boolean(val) && val !== "false" && val !== "0";
      return isTruthy ? body : "";
    });

    // 2. Process {{#unless key}}...{{/unless}} conditional blocks
    output = output.replace(/\{\{#unless\s+([a-zA-Z0-9_]+)\}\}([\s\S]*?)\{\{\/unless\}\}/g, (_, key, body) => {
      const val = variables[key];
      const isFalsy = !val || val === "false" || val === "0";
      return isFalsy ? body : "";
    });

    // 3. Process {{variable}} replacements
    output = output.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
      const val = variables[key];
      return val !== undefined ? String(val) : `{{${key}}}`;
    });

    return output;
  }
}

