import { AbstractAgentEngine } from "../../../core/abstracts/abstract-agent-engine.js";
import type { EngineTickInput, EngineTickResult } from "../../../core/contracts/agent.contracts.js";
import type { AgentConfig } from "../../base/agent-config.js";
import type { SessionContext } from "../../../sessions/base/session-context.js";
import type { PersistentSessionStore } from "../../../sessions/extensions/persistence/session-store.js";
import type { ValidatingToolRegistry } from "../../../tooling/extensions/registry/tool-registry.js";
import type { PromptComposer } from "../compaction/prompt-composer.js";
import type { SessionCompactor } from "../../../sessions/extensions/compaction/session-compactor.js";
import type { ModelResolver } from "../resolution/model-resolver.js";
import type { SessionVfs } from "../../../sessions/extensions/vfs/session-vfs.js";
import type { SessionMemoryStore } from "../../../sessions/extensions/memory/session-memory-store.js";
import type { AgentSlashRouter } from "../resolution/agent-slash-router.js";

export class AgentEngine extends AbstractAgentEngine {
  readonly promptComposer: PromptComposer;
  readonly sessionCompactor: SessionCompactor;
  readonly modelResolver: ModelResolver;
  readonly sessionVfs: SessionVfs;
  readonly sessionMemoryStore: SessionMemoryStore;
  readonly slashRouter: AgentSlashRouter;

  constructor(
    config: AgentConfig,
    sessionContext: SessionContext,
    sessionStore: PersistentSessionStore,
    toolRegistry: ValidatingToolRegistry,
    promptComposer: PromptComposer,
    sessionCompactor: SessionCompactor,
    modelResolver: ModelResolver,
    sessionVfs: SessionVfs,
    sessionMemoryStore: SessionMemoryStore,
    slashRouter: AgentSlashRouter
  ) {
    super(config, sessionContext, sessionStore, toolRegistry);
    this.promptComposer = promptComposer;
    this.sessionCompactor = sessionCompactor;
    this.modelResolver = modelResolver;
    this.sessionVfs = sessionVfs;
    this.sessionMemoryStore = sessionMemoryStore;
    this.slashRouter = slashRouter;
  }

  protected async preTick(input: EngineTickInput): Promise<void> {
    this.sessionContext.incrementTurn();
  }

  protected async executeTick(input: EngineTickInput): Promise<EngineTickResult> {
    const sessionStore = this.sessionStore as PersistentSessionStore;

    // 1. Handle Slash Commands
    if (input.prompt) {
      const slashResult = await this.slashRouter.handleSlashCommand(input.prompt, {
        sessionContext: this.sessionContext,
        sessionStore,
        sessionCompactor: this.sessionCompactor,
        sessionVfs: this.sessionVfs,
        sessionMemoryStore: this.sessionMemoryStore,
        modelResolver: this.modelResolver,
        toolRegistry: this.toolRegistry as ValidatingToolRegistry,
      });

      if (slashResult.handled) {
        return {
          frameIndex: this.sessionContext.turnCount,
          activeModel: this.modelResolver.getActiveModel(),
          isFallbackModel: false,
          isSlashCommand: true,
          composedPrompt: input.prompt,
          response: slashResult.output ?? "Slash command executed.",
          toolResults: [],
        };
      }
    }

    // 2. Add User Message
    if (input.prompt) {
      sessionStore.addMessage({
        role: "user",
        content: input.prompt,
      });
    }

    // 3. Compact History if Over Capacity
    if (sessionStore.getMessages().length > this.config.maxTurns) {
      sessionStore.compact(this.sessionCompactor);
    }

    // 4. Response Resolution Simulation / Heuristic Execution
    let responseText = `Executed frame #${this.sessionContext.turnCount}`;
    if (input.prompt?.startsWith("remember:")) {
      const fact = input.prompt.substring(9).trim();
      this.sessionMemoryStore.saveMemory("user_fact", fact, "fact");
      responseText = `Persisted memory fact: ${fact}`;
    } else if (input.prompt?.startsWith("view:")) {
      const targetPath = input.prompt.substring(5).trim();
      responseText = `Read file content from ${targetPath}`;
    }

    // 5. Add Assistant Response Message
    sessionStore.addMessage({
      role: "assistant",
      content: responseText,
    });

    this.modelResolver.recordTurnExecution(
      input.prompt?.length ?? 0,
      responseText.length
    );

    return {
      frameIndex: this.sessionContext.turnCount,
      activeModel: this.modelResolver.getActiveModel(),
      isFallbackModel: false,
      isSlashCommand: false,
      composedPrompt: input.prompt ?? "",
      response: responseText,
      toolResults: [],
    };
  }

  protected async postTick(_result: EngineTickResult): Promise<void> {
    // Post-tick state audit hook
  }
}
