import type { PersistentSessionStore } from "../../sessions/extensions/session-store.js";
import type { SessionCompactor } from "../../sessions/extensions/session-compactor.js";
import type { SessionVfs, StagedFile } from "../../sessions/extensions/session-vfs.js";
import type { SessionMemoryStore, MemoryEntry } from "../../sessions/extensions/session-memory-store.js";
import type { ModelResolver } from "./model-resolver.js";
import type { ValidatingToolRegistry } from "../../tooling/extensions/tool-registry.js";
import type { SkillManifest } from "../../tooling/extensions/skills-ingestor.js";

export interface SlashCommandResult {
  handled: boolean;
  command?: string;
  output?: string;
  payload?: unknown;
}

export interface SlashRouterContext {
  sessionStore: PersistentSessionStore;
  sessionCompactor: SessionCompactor;
  sessionVfs?: SessionVfs;
  memoryStore?: SessionMemoryStore;
  modelResolver: ModelResolver;
  toolRegistry: ValidatingToolRegistry;
  cwd: string;
}

export class AgentSlashRouter {
  isSlashCommand(input: string): boolean {
    return input.trim().startsWith("/");
  }

  async handleCommand(input: string, context: SlashRouterContext): Promise<SlashCommandResult> {
    const trimmed = input.trim();
    if (!trimmed.startsWith("/")) {
      return { handled: false };
    }

    const spaceIdx = trimmed.indexOf(" ");
    const command = spaceIdx === -1 ? trimmed.slice(1) : trimmed.slice(1, spaceIdx);
    const args = spaceIdx === -1 ? "" : trimmed.slice(spaceIdx + 1).trim();

    switch (command.toLowerCase()) {
      case "compact": {
        context.sessionStore.compact(context.sessionCompactor);
        return {
          handled: true,
          command,
          output: `Session history compacted. Remaining turns: ${context.sessionStore.getMessages().length}`,
        };
      }

      case "clear": {
        context.sessionStore.clear();
        return {
          handled: true,
          command,
          output: "Session turn history cleared.",
        };
      }

      case "stats": {
        const metrics = context.modelResolver.getMetrics();
        const msgCount = context.sessionStore.getMessages().length;
        const resolution = context.modelResolver.resolveModel();
        const memCount = context.memoryStore ? context.memoryStore.listMemories().length : 0;
        return {
          handled: true,
          command,
          output: `[Monolith Stats]\n- Active Model: ${resolution.activeModel} (Fallback: ${resolution.isFallback})\n- Recorded Turns: ${metrics.totalTurns}\n- Total Messages: ${msgCount}\n- Estimated Tokens: ${metrics.totalTokensEstimated}\n- Memory Facts: ${memCount}\n- Fallback Triggers: ${metrics.fallbackTriggeredCount}`,
          payload: metrics,
        };
      }

      case "skills": {
        const skills = await context.toolRegistry.skillsIngestor.discoverSkills(context.cwd);
        const skillNames = skills.map((s: SkillManifest) => `- ${s.name}: ${s.description}`).join("\n");
        return {
          handled: true,
          command,
          output: skills.length > 0
            ? `Discovered ${skills.length} workspace skills:\n${skillNames}`
            : "No workspace skills found.",
          payload: skills,
        };
      }

      case "models": {
        const res = context.modelResolver.resolveModel();
        return {
          handled: true,
          command,
          output: `Primary Model: ${context.modelResolver.primaryModel}\nActive Model: ${res.activeModel}\nFallback Chain: ${context.modelResolver.fallbackModels.join(", ")}`,
        };
      }

      case "vfs": {
        if (!context.sessionVfs) {
          return { handled: true, command, output: "VFS overlay is not enabled in context." };
        }
        const staged = context.sessionVfs.listStaged();
        if (staged.length === 0) {
          return { handled: true, command, output: "No files staged in VFS overlay." };
        }
        const listStr = staged.map((s: StagedFile) => `- ${s.path} (${s.isNew ? "NEW" : "MODIFIED"})`).join("\n");
        return {
          handled: true,
          command,
          output: `Staged VFS Files (${staged.length}):\n${listStr}`,
          payload: staged,
        };
      }

      case "memory": {
        if (!context.memoryStore) {
          return { handled: true, command, output: "SessionMemoryStore is not initialized." };
        }
        if (args.startsWith("search ")) {
          const query = args.replace("search ", "").trim();
          const results = context.memoryStore.searchMemories(query);
          const resStr = results.map((r: MemoryEntry) => `- [${r.category}] ${r.key}: ${r.value}`).join("\n");
          return {
            handled: true,
            command,
            output: results.length > 0
              ? `Memory Query Results for '${query}' (${results.length}):\n${resStr}`
              : `No memories matching '${query}'.`,
            payload: results,
          };
        }
        const allMemories = context.memoryStore.listMemories();
        if (allMemories.length === 0) {
          return { handled: true, command, output: "No persistent memory facts stored." };
        }
        const listStr = allMemories.map((m: MemoryEntry) => `- [${m.category}] ${m.key}: ${m.value}`).join("\n");
        return {
          handled: true,
          command,
          output: `Stored Agent Memories (${allMemories.length}):\n${listStr}`,
          payload: allMemories,
        };
      }

      default:
        return {
          handled: true,
          command,
          output: `Unknown slash command: /${command}. Supported: /compact, /clear, /stats, /skills, /models, /vfs, /memory`,
        };
    }
  }
}
