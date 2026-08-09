/**
 * DiffSynthesizer.
 * Absorbed in Pass 65 (ADR-035 / ADR-012).
 *
 * Renders unified diff chunks for display in audit trails and user interfaces.
 */
export class DiffSynthesizer {
  renderUnifiedDiff(filePath: string, originalText: string, updatedText: string): string {
    const origLines = originalText.split("\n");
    const newLines = updatedText.split("\n");

    const diffLines: string[] = [
      `--- a/${filePath}`,
      `+++ b/${filePath}`,
      `@@ -1,${origLines.length} +1,${newLines.length} @@`,
    ];

    for (let i = 0; i < Math.max(origLines.length, newLines.length); i++) {
      const origLine = origLines[i];
      const newLine = newLines[i];

      if (origLine !== undefined && newLine !== undefined) {
        if (origLine === newLine) {
          diffLines.push(` ${origLine}`);
        } else {
          diffLines.push(`-${origLine}`);
          diffLines.push(`+${newLine}`);
        }
      } else if (origLine !== undefined) {
        diffLines.push(`-${origLine}`);
      } else if (newLine !== undefined) {
        diffLines.push(`+${newLine}`);
      }
    }

    return diffLines.join("\n");
  }
}
