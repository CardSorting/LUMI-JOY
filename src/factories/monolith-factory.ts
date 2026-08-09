import { AgentConfig } from "../agents/base/agent-config.js";
import { AgentEngine } from "../agents/extensions/agent-engine.js";
import { PromptComposer } from "../agents/extensions/prompt-composer.js";
import { ModelResolver } from "../agents/extensions/model-resolver.js";
import { AgentSlashRouter } from "../agents/extensions/agent-slash-router.js";
import { SessionContext } from "../sessions/base/session-context.js";
import { PersistentSessionStore } from "../sessions/extensions/session-store.js";
import { SessionCompactor } from "../sessions/extensions/session-compactor.js";
import { SessionVfs } from "../sessions/extensions/session-vfs.js";
import { SessionMemoryStore } from "../sessions/extensions/session-memory-store.js";
import { Eyes } from "../tooling/base/eyes.js";
import { AnchoredHands } from "../tooling/extensions/hands.js";
import { ProtocolEars } from "../tooling/extensions/ears.js";
import { SkillsIngestor } from "../tooling/extensions/skills-ingestor.js";
import { ValidatingToolRegistry } from "../tooling/extensions/tool-registry.js";
import type { GameStateSnapshot } from "../core/contracts/session.contracts.js";

export interface MonolithFactoryOptions {
  cwd?: string;
  sessionId?: string;
  config?: AgentConfig;
  maxTurnHistory?: number;
  fallbackModels?: readonly string[];
}

export class MonolithFactory {
  static createEngine(options: MonolithFactoryOptions = {}): {
    config: AgentConfig;
    sessionContext: SessionContext;
    sessionStore: PersistentSessionStore;
    sessionCompactor: SessionCompactor;
    sessionVfs: SessionVfs;
    sessionMemoryStore: SessionMemoryStore;
    modelResolver: ModelResolver;
    slashRouter: AgentSlashRouter;
    eyes: Eyes;
    hands: AnchoredHands;
    ears: ProtocolEars;
    skillsIngestor: SkillsIngestor;
    toolRegistry: ValidatingToolRegistry;
    promptComposer: PromptComposer;
    agentEngine: AgentEngine;
  } {
    const cwd = options.cwd ?? process.cwd();
    const sessionId = options.sessionId ?? `session-${Date.now()}`;

    const config = options.config ?? AgentConfig.createDefault();
    const sessionContext = new SessionContext({ sessionId, cwd });
    const sessionStore = new PersistentSessionStore();
    const sessionCompactor = new SessionCompactor({
      maxTurnHistory: options.maxTurnHistory ?? config.maxTurns,
    });
    const sessionVfs = new SessionVfs();
    const sessionMemoryStore = new SessionMemoryStore();
    const modelResolver = new ModelResolver(
      config.modelName,
      options.fallbackModels
    );
    const slashRouter = new AgentSlashRouter();

    const eyes = new Eyes();
    const hands = new AnchoredHands();
    const ears = new ProtocolEars();
    const skillsIngestor = new SkillsIngestor(eyes);

    const toolRegistry = new ValidatingToolRegistry(
      eyes,
      hands,
      ears,
      skillsIngestor,
      sessionMemoryStore
    );

    const promptComposer = new PromptComposer();

    const agentEngine = new AgentEngine(
      config,
      sessionContext,
      sessionStore,
      toolRegistry,
      promptComposer,
      sessionCompactor,
      modelResolver,
      sessionVfs,
      sessionMemoryStore,
      slashRouter
    );

    return {
      config,
      sessionContext,
      sessionStore,
      sessionCompactor,
      sessionVfs,
      sessionMemoryStore,
      modelResolver,
      slashRouter,
      eyes,
      hands,
      ears,
      skillsIngestor,
      toolRegistry,
      promptComposer,
      agentEngine,
    };
  }

  static createFromSnapshot(snapshot: GameStateSnapshot, options: MonolithFactoryOptions = {}): ReturnType<typeof MonolithFactory.createEngine> {
    const components = MonolithFactory.createEngine(options);
    components.sessionStore.rewindToSnapshot(snapshot);
    return components;
  }
}
