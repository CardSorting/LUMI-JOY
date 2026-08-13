import type { SessionContext } from "../../../sessions/base/session-context.js";
import type { PersistentSessionStore } from "../../../sessions/extensions/persistence/session-store.js";
import type { SessionCompactor } from "../../../sessions/extensions/compaction/session-compactor.js";
import type { SessionVfs } from "../../../sessions/extensions/vfs/session-vfs.js";
import type { SessionMemoryStore } from "../../../sessions/extensions/memory/session-memory-store.js";
import type { ModelResolver } from "./model-resolver.js";
import type { ValidatingToolRegistry } from "../../../tooling/extensions/registry/tool-registry.js";

export interface SlashRouteContext {
  sessionContext: SessionContext;
  sessionStore: PersistentSessionStore;
  sessionCompactor: SessionCompactor;
  sessionVfs: SessionVfs;
  sessionMemoryStore: SessionMemoryStore;
  modelResolver: ModelResolver;
  toolRegistry: ValidatingToolRegistry;
}

export interface SlashRouteResult {
  handled: boolean;
  output?: string;
}

export class AgentSlashRouter {
  async handleSlashCommand(commandStr: string, context: SlashRouteContext): Promise<SlashRouteResult> {
    const trimmed = commandStr.trim();
    if (!trimmed.startsWith("/")) {
      return { handled: false };
    }

    const [cmd, ...args] = trimmed.split(" ");
    const lowerCmd = cmd.toLowerCase();

    switch (lowerCmd) {
      case "/stats": {
        const msgCount = context.sessionStore.getMessages().length;
        const transcriptCount = context.sessionStore.getTranscript().length;
        const metrics = context.modelResolver.getMetrics();
        const memories = context.sessionMemoryStore.listMemories().length;
        const staged = context.sessionVfs.exportStaged().length;
        const slab = context.sessionStore.getSlabSnapshot();
        const output = `--- Engine Monolith Telemetry Stats ---
Session ID: ${context.sessionContext.sessionId}
Turn Count: ${context.sessionContext.turnCount}
Active Messages: ${msgCount}
Durable Transcript Messages: ${transcriptCount}
Active Model: ${context.modelResolver.getActiveModel()}
Estimated Tokens Consumed: ${metrics.totalTokensEstimated}
Memories Stored: ${memories}
VFS Staged Files: ${staged}
Slab Allocated Bytes: ${slab.allocatedBytes} / ${slab.capacityBytes}`;
        return { handled: true, output };
      }

      case "/vfs": {
        const staged = context.sessionVfs.exportStaged();
        if (staged.length === 0) {
          return { handled: true, output: "VFS overlay clean (0 staged files)." };
        }
        const summary = staged.map((f) => `- [STAGED] ${f.path} (${f.content.length} bytes)`).join("\n");
        return { handled: true, output: `VFS Staged Files:\n${summary}` };
      }

      case "/memory": {
        const memories = context.sessionMemoryStore.listMemories();
        if (memories.length === 0) {
          return { handled: true, output: "Long-term memory store empty." };
        }
        const summary = memories.map((m) => `- [${m.category}] ${m.key} = ${m.value}`).join("\n");
        return { handled: true, output: `Long-Term Memory Facts:\n${summary}` };
      }

      case "/compact": {
        const beforeCount = context.sessionStore.getMessages().length;
        const report = context.sessionStore.compact(context.sessionCompactor, { force: true });
        const afterCount = context.sessionStore.getMessages().length;
        return {
          handled: true,
          output: report.compacted
            ? `Compacted active context: ${beforeCount} -> ${afterCount} messages, ${report.inputTokens} -> ${report.outputTokens} estimated tokens. Full transcript retained.`
            : `Context already minimal (${afterCount} active messages). Full transcript retained.`,
        };
      }

      case "/clear": {
        context.sessionStore.clear();
        context.sessionVfs.clear();
        context.sessionContext.turnCount = 0;
        return { handled: true, output: "Cleared active session state and reset turn counter." };
      }

      default:
        return { handled: false };
    }
  }
}
