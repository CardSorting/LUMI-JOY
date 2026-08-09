import { AgentConfig } from "../agents/base/agent-config.js";
import { AgentEngine } from "../agents/extensions/execution/agent-engine.js";
import { PromptComposer } from "../agents/extensions/compaction/prompt-composer.js";
import { ModelResolver } from "../agents/extensions/resolution/model-resolver.js";
import { AgentSlashRouter } from "../agents/extensions/resolution/agent-slash-router.js";
import { MentionResolver } from "../agents/extensions/mentions/mention-resolver.js";
import { AgentSwarmDispatcher } from "../agents/extensions/swarm/agent-swarm-dispatcher.js";
import { WorkspaceIntelligenceEngine } from "../agents/extensions/intelligence/workspace-intelligence.js";
import { ModelCatalog } from "../agents/extensions/resolution/model-catalog.js";

import { SessionContext } from "../sessions/base/session-context.js";
import { PersistentSessionStore } from "../sessions/extensions/persistence/session-store.js";
import { SessionCompactor } from "../sessions/extensions/compaction/session-compactor.js";
import { SessionVfs } from "../sessions/extensions/vfs/session-vfs.js";
import { SessionMemoryStore } from "../sessions/extensions/memory/session-memory-store.js";
import { StabilityDoctor } from "../sessions/extensions/integrity/stability-doctor.js";
import { SnapcompactEngine } from "../sessions/extensions/compaction/snapcompact-engine.js";

import { Eyes } from "../tooling/base/eyes.js";
import { AstPerceptionEyes } from "../tooling/extensions/perception/ast-eyes.js";
import { AnchoredHands } from "../tooling/extensions/hashline/hands.js";
import { CommandPermissionController } from "../tooling/extensions/permissions/command-permission-controller.js";
import { ProtocolEars } from "../tooling/extensions/telemetry/ears.js";
import { ProgressStreamingEars } from "../tooling/extensions/progress/progress-ears.js";
import { SkillsIngestor } from "../tooling/extensions/registry/skills-ingestor.js";
import { ValidatingToolRegistry } from "../tooling/extensions/registry/tool-registry.js";
import { MonolithGatewayServer } from "../tooling/extensions/gateway/monolith-gateway-server.js";
import { MonolithBenchmarkEvaluator } from "../tooling/extensions/evals/benchmark-evaluator.js";

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
    stabilityDoctor: StabilityDoctor;
    snapcompactEngine: SnapcompactEngine;
    modelResolver: ModelResolver;
    modelCatalog: ModelCatalog;
    slashRouter: AgentSlashRouter;
    mentionResolver: MentionResolver;
    swarmDispatcher: AgentSwarmDispatcher;
    intelligenceEngine: WorkspaceIntelligenceEngine;
    permissionController: CommandPermissionController;
    gatewayServer: MonolithGatewayServer;
    benchmarkEvaluator: MonolithBenchmarkEvaluator;
    eyes: AstPerceptionEyes;
    hands: AnchoredHands;
    ears: ProgressStreamingEars;
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
    const stabilityDoctor = new StabilityDoctor();
    const snapcompactEngine = new SnapcompactEngine();

    const modelResolver = new ModelResolver(
      config.modelName,
      options.fallbackModels
    );
    const modelCatalog = new ModelCatalog();
    const slashRouter = new AgentSlashRouter();
    const mentionResolver = new MentionResolver();
    const swarmDispatcher = new AgentSwarmDispatcher();
    const intelligenceEngine = new WorkspaceIntelligenceEngine();

    const permissionController = new CommandPermissionController();
    const gatewayServer = new MonolithGatewayServer();
    const benchmarkEvaluator = new MonolithBenchmarkEvaluator();

    const eyes = new AstPerceptionEyes();
    const hands = new AnchoredHands(permissionController);
    const ears = new ProgressStreamingEars();
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
      stabilityDoctor,
      snapcompactEngine,
      modelResolver,
      modelCatalog,
      slashRouter,
      mentionResolver,
      swarmDispatcher,
      intelligenceEngine,
      permissionController,
      gatewayServer,
      benchmarkEvaluator,
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
