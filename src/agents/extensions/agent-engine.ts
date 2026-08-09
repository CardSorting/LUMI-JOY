import { AbstractAgentEngine } from "../../core/abstracts/abstract-agent-engine.js";
import type { EngineTickInput, EngineTickResult } from "../../core/contracts/agent.contracts.js";
import type { AgentConfig } from "../base/agent-config.js";
import { PromptComposer } from "./prompt-composer.js";
import { ModelResolver } from "./model-resolver.js";
import { AgentSlashRouter } from "./agent-slash-router.js";
import type { SessionContext } from "../../sessions/base/session-context.js";
import type { PersistentSessionStore } from "../../sessions/extensions/session-store.js";
import { SessionCompactor } from "../../sessions/extensions/session-compactor.js";
import { SessionVfs } from "../../sessions/extensions/session-vfs.js";
import { SessionMemoryStore } from "../../sessions/extensions/session-memory-store.js";
import type { ValidatingToolRegistry } from "../../tooling/extensions/tool-registry.js";

/**
 * Deterministic Game Engine Agent Implementation.
 * Extends AbstractAgentEngine with deterministic tick loop execution,
 * prompt composition, slash command routing, and memory injection.
 */
export class AgentEngine extends AbstractAgentEngine {
  readonly sessionCompactor: SessionCompactor;
  readonly sessionVfs: SessionVfs;
  readonly sessionMemoryStore: SessionMemoryStore;
  readonly promptComposer: PromptComposer;
  readonly modelResolver: ModelResolver;
  readonly slashRouter: AgentSlashRouter;

  constructor(
    config: AgentConfig,
    sessionContext: SessionContext,
    sessionStore: PersistentSessionStore,
    toolRegistry: ValidatingToolRegistry,
    promptComposer?: PromptComposer,
    sessionCompactor?: SessionCompactor,
    modelResolver?: ModelResolver,
    sessionVfs?: SessionVfs,
    sessionMemoryStore?: SessionMemoryStore,
    slashRouter?: AgentSlashRouter
  ) {
    super(config, sessionContext, sessionStore, toolRegistry);
    this.promptComposer = promptComposer ?? new PromptComposer();
    this.sessionCompactor = sessionCompactor ?? new SessionCompactor({ maxTurnHistory: config.maxTurns });
    this.modelResolver = modelResolver ?? ModelResolver.fromConfig(config);
    this.sessionVfs = sessionVfs ?? new SessionVfs();
    this.sessionMemoryStore = sessionMemoryStore ?? new SessionMemoryStore();
    this.slashRouter = slashRouter ?? new AgentSlashRouter();
  }

  protected async preTick(input: EngineTickInput): Promise<void> {
    // Compact history before frame processing if needed
    (this.sessionStore as PersistentSessionStore).compact(this.sessionCompactor);
  }

  protected async executeTick(input: EngineTickInput): Promise<EngineTickResult> {
    const promptText = input.prompt.trim();
    const resolution = this.modelResolver.resolveModel();
    const store = this.sessionStore as PersistentSessionStore;
    const registry = this.toolRegistry as ValidatingToolRegistry;

    // Intercept Slash Commands
    if (this.slashRouter.isSlashCommand(promptText)) {
      const slashRes = await this.slashRouter.handleCommand(promptText, {
        sessionStore: store,
        sessionCompactor: this.sessionCompactor,
        sessionVfs: this.sessionVfs,
        memoryStore: this.sessionMemoryStore,
        modelResolver: this.modelResolver,
        toolRegistry: registry,
        cwd: this.sessionContext.cwd,
      });

      return {
        frameIndex: this.sessionContext.turnCount,
        activeModel: resolution.activeModel,
        isFallbackModel: resolution.isFallback,
        isSlashCommand: true,
        composedPrompt: "[Slash Command Intercepted]",
        response: slashRes.output ?? "Slash command executed.",
        toolResults: [],
      };
    }

    const frameIndex = this.sessionContext.incrementTurn();

    // 1. Discover skills, retrieve memories & compose prompt
    const skills = await registry.skillsIngestor.discoverSkills(this.sessionContext.cwd);
    const memories = this.sessionMemoryStore.searchMemories(promptText.slice(0, 30));
    const composedPrompt = this.promptComposer.composeSystemPrompt({
      config: this.config,
      sessionContext: this.sessionContext,
      toolRegistry: registry,
      skills,
      memories,
    });

    // 2. Record User Message
    store.addMessage({
      role: "user",
      content: promptText,
    });

    // 3. Monolithic turn execution
    const toolResults: Array<{ name: string; output: unknown }> = [];
    let responseText = `Executed frame #${frameIndex} [Model: ${resolution.activeModel}] for prompt: "${promptText}"`;

    if (promptText.startsWith("read:") || promptText.startsWith("view:")) {
      const targetPath = promptText.split(":")[1]?.trim();
      if (targetPath) {
        const fileData = await registry.executeTool(
          "view_file",
          { path: targetPath },
          this.sessionContext.cwd
        );
        toolResults.push({ name: "view_file", output: fileData });
        responseText = `Read file content from ${targetPath}`;
      }
    } else if (promptText.includes("skills")) {
      const skillList = await registry.executeTool(
        "list_skills",
        {},
        this.sessionContext.cwd
      );
      toolResults.push({ name: "list_skills", output: skillList });
      responseText = `Discovered ${Array.isArray(skillList) ? skillList.length : 0} workspace skills.`;
    } else if (promptText.startsWith("remember:") || promptText.startsWith("save:")) {
      const parts = promptText.replace(/^(remember:|save:)/, "").trim().split("=");
      const key = parts[0]?.trim();
      const val = parts.slice(1).join("=").trim();
      if (key && val) {
        const memRes = await registry.executeTool(
          "save_memory",
          { key, value: val, category: "fact" },
          this.sessionContext.cwd
        );
        toolResults.push({ name: "save_memory", output: memRes });
        responseText = `Persisted memory fact: ${key} = ${val}`;
      }
    }

    // 4. Record Assistant Message & update usage metrics
    store.addMessage({
      role: "assistant",
      content: responseText,
    });
    this.modelResolver.recordUsage(promptText.length + responseText.length);

    return {
      frameIndex,
      activeModel: resolution.activeModel,
      isFallbackModel: resolution.isFallback,
      isSlashCommand: false,
      composedPrompt,
      response: responseText,
      toolResults,
    };
  }

  protected async postTick(result: EngineTickResult): Promise<void> {
    this.toolRegistry.ears.emit("turn_complete", "AgentEngine", {
      frameIndex: result.frameIndex,
      responseText: result.response,
      activeModel: result.activeModel,
      metrics: this.modelResolver.getMetrics(),
    }, result.durationMs);
  }
}

export { AgentEngine as Engine };
