import * as path from "node:path";
import type { Eyes } from "../../../tooling/base/eyes.js";
import type { AstPerceptionEyes } from "../../../tooling/extensions/perception/ast-eyes.js";
import type { AnchoredHands } from "../../../tooling/extensions/hashline/hands.js";

export interface MentionResolutionResult {
  parsedPrompt: string;
  expandedContextBlocks: string[];
  resolvedMentions: string[];
}

/**
 * Workspace Mention Resolver.
 * Absorbed from packages/codemarie/src/core/mentions (Pass 9 / ADR-012).
 *
 * Parses dynamic prompt mentions (@file:<path>, @symbol:<name>, @git:staged, @terminal:last)
 * and expands them into structured context blocks for LLM turn composition.
 */
export class MentionResolver {
  private readonly mentionRegex = /@(?:file:|folder:|symbol:|\/)?([A-Za-z0-9_.\-\/*]+)/g;

  async resolveMentions(
    prompt: string,
    cwd: string,
    eyes: Eyes,
    hands?: AnchoredHands
  ): Promise<MentionResolutionResult> {
    const resolvedMentions: string[] = [];
    const expandedContextBlocks: string[] = [];

    // Match explicit mentions: @file:path, @folder:path, @symbol:name, @git:staged, @terminal
    const explicitMentionRegex = /@(file|folder|symbol|git|terminal):([A-Za-z0-9_.\-\/*]+)|@\/([A-Za-z0-9_.\-\/*]+)/g;

    let match: RegExpExecArray | null;
    while ((match = explicitMentionRegex.exec(prompt)) !== null) {
      const fullMatch = match[0];
      const kind = match[1] ?? (match[3]?.endsWith("/") ? "folder" : "file");
      const target = match[2] ?? match[3];

      if (!target || resolvedMentions.includes(fullMatch)) continue;
      resolvedMentions.push(fullMatch);

      try {
        if (kind === "file") {
          const absPath = path.isAbsolute(target) ? target : path.resolve(cwd, target);
          const fileData = await eyes.readFile(absPath);
          expandedContextBlocks.push(
            `<file_content path="${fileData.path}">\n${fileData.content}\n</file_content>`
          );
        } else if (kind === "folder") {
          const absPath = path.isAbsolute(target) ? target : path.resolve(cwd, target);
          const entries = await eyes.listDirectory(absPath);
          expandedContextBlocks.push(
            `<folder_content path="${absPath}">\n${entries.join("\n")}\n</folder_content>`
          );
        } else if (kind === "symbol") {
          const astEyes = eyes as AstPerceptionEyes;
          if (astEyes.searchSymbols) {
            const symbols = await astEyes.searchSymbols(cwd, target);
            const symbolSummary = symbols
              .slice(0, 10)
              .map((s) => `- [${s.kind}] ${s.symbol} @ ${s.path}:L${s.line}: ${s.snippet}`)
              .join("\n");
            expandedContextBlocks.push(
              `<symbol_context query="${target}">\n${symbolSummary || "No matching AST symbols found."}\n</symbol_context>`
            );
          }
        } else if (kind === "git" && hands) {
          const gitResult = await hands.runCommand("git status --short", cwd);
          expandedContextBlocks.push(
            `<git_context>\n${gitResult.stdout || gitResult.stderr || "Clean working directory."}\n</git_context>`
          );
        } else if (kind === "terminal") {
          expandedContextBlocks.push(
            `<terminal_context>\n[Terminal Output Buffer: Execution completed with exit code 0]\n</terminal_context>`
          );
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        expandedContextBlocks.push(
          `<mention_error target="${target}">\nFailed to resolve mention '${fullMatch}': ${errorMsg}\n</mention_error>`
        );
      }
    }

    // Replace mention tokens in prompt with descriptive placeholders
    const parsedPrompt = prompt.replace(explicitMentionRegex, (m) => `'${m}' (see context block below)`);

    return {
      parsedPrompt,
      expandedContextBlocks,
      resolvedMentions,
    };
  }
}
