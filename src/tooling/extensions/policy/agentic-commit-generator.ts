export interface ConventionalCommitResult {
  type: "feat" | "fix" | "docs" | "style" | "refactor" | "perf" | "test" | "chore";
  scope: string;
  subject: string;
  fullMessage: string;
}

/**
 * AgenticCommitGenerator.
 * Absorbed from packages/coding-agent/src/commit (Pass 22 / ADR-012).
 *
 * Analyzes file diffs and generates clean conventional commit messages
 * following project rules (no emojis, direct technical prose).
 */
export class AgenticCommitGenerator {
  generateCommitMessage(
    modifiedFiles: readonly string[],
    addedFiles: readonly string[],
    summary: string
  ): ConventionalCommitResult {
    let type: ConventionalCommitResult["type"] = "chore";
    let scope = "agent";

    const allFiles = [...modifiedFiles, ...addedFiles];

    if (allFiles.some((f) => f.includes("ADR-") || f.endsWith(".md"))) {
      type = "docs";
    } else if (allFiles.some((f) => f.includes("src/agents/"))) {
      type = "feat";
      scope = "agent";
    } else if (allFiles.some((f) => f.includes("src/sessions/"))) {
      type = "feat";
      scope = "session";
    } else if (allFiles.some((f) => f.includes("src/tooling/"))) {
      type = "feat";
      scope = "tooling";
    }

    const cleanSummary = summary.replace(/[^\w\s\-\:\(\)]/gi, "").trim();
    const subject = cleanSummary.length > 0 ? cleanSummary : "update subsystem components";
    const fullMessage = `${type}(${scope}): ${subject}`;

    return {
      type,
      scope,
      subject,
      fullMessage,
    };
  }
}
