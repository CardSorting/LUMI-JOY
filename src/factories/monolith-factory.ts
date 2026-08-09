import { AgentConfig } from "../agents/base/agent-config.js";
import { AgentEngine } from "../agents/extensions/execution/agent-engine.js";
import { PromptComposer } from "../agents/extensions/compaction/prompt-composer.js";
import { ModelResolver } from "../agents/extensions/resolution/model-resolver.js";
import { AgentSlashRouter } from "../agents/extensions/resolution/agent-slash-router.js";
import { MentionResolver } from "../agents/extensions/mentions/mention-resolver.js";
import { AgentSwarmDispatcher } from "../agents/extensions/swarm/agent-swarm-dispatcher.js";
import { WorkspaceIntelligenceEngine } from "../agents/extensions/intelligence/workspace-intelligence.js";
import { ModelCatalog } from "../agents/extensions/resolution/model-catalog.js";
import { InteractiveModeController } from "../agents/extensions/execution/interactive-mode-controller.js";
import { EnvironmentKeyResolver } from "../agents/extensions/resolution/environment-key-resolver.js";
import { ImageModelRegistry } from "../agents/extensions/resolution/image-model-registry.js";
import { LlmProxyGateway } from "../agents/extensions/resolution/llm-proxy-gateway.js";
import { ReasoningEffortController } from "../agents/extensions/resolution/reasoning-effort-controller.js";
import { DynamicModelCache } from "../agents/extensions/resolution/dynamic-model-cache.js";
import { LoopPhaseController } from "../agents/extensions/execution/loop-phase-controller.js";
import { ContextBudgetCalculator } from "../agents/extensions/compaction/context-budget-calculator.js";
import { TokenTruncator } from "../agents/extensions/compaction/token-truncator.js";
import { PromptTemplateEngine } from "../agents/extensions/compaction/prompt-template-engine.js";
import { DynamicVariableInjector } from "../agents/extensions/compaction/dynamic-variable-injector.js";

import { SessionContext } from "../sessions/base/session-context.js";
import { PersistentSessionStore } from "../sessions/extensions/persistence/session-store.js";
import { SessionCompactor } from "../sessions/extensions/compaction/session-compactor.js";
import { SessionVfs } from "../sessions/extensions/vfs/session-vfs.js";
import { SessionMemoryStore } from "../sessions/extensions/memory/session-memory-store.js";
import { StabilityDoctor } from "../sessions/extensions/integrity/stability-doctor.js";
import { SnapcompactEngine } from "../sessions/extensions/compaction/snapcompact-engine.js";
import { FileLockManager, LruCache } from "../sessions/extensions/substrate/file-lock.js";
import { GatewaySessionRegistry } from "../sessions/extensions/persistence/gateway-session-registry.js";
import { SnapshotStorageIndex } from "../sessions/extensions/persistence/snapshot-storage-index.js";
import { SnowflakeIdGenerator } from "../sessions/extensions/substrate/snowflake-id-generator.js";
import { SystemDirectoryResolver } from "../sessions/extensions/substrate/system-directory-resolver.js";
import { FixedRingBuffer } from "../sessions/extensions/substrate/ring-buffer.js";
import { SemanticVersionComparator } from "../sessions/extensions/integrity/semantic-version-comparator.js";
import { GitIgnoreFilter } from "../sessions/extensions/vfs/git-ignore-filter.js";
import { WorkspaceTreeWalker } from "../sessions/extensions/vfs/workspace-tree-walker.js";

import { TransportConnectionController } from "../tooling/extensions/gateway/transport-connection-controller.js";
import { ResilientFetchClient } from "../tooling/extensions/telemetry/resilient-fetch-client.js";
import { FrontmatterParser } from "../tooling/extensions/perception/frontmatter-parser.js";
import { BoundedFilePeeker } from "../tooling/extensions/perception/file-peeker.js";
import { CommandPathResolver } from "../tooling/extensions/permissions/command-path-resolver.js";
import { TerminalTextSanitizer } from "../tooling/extensions/telemetry/text-sanitizer.js";
import { MicrosecondTimingBuffer } from "../tooling/extensions/telemetry/timing-buffer.js";
import { TabSpacingNormalizer } from "../tooling/extensions/hashline/tab-spacing-normalizer.js";
import { ToolCallSchemaValidator } from "../tooling/extensions/registry/tool-call-schema-validator.js";
import { ArgumentCoercer } from "../tooling/extensions/registry/argument-coercer.js";
import { BatchEditAnchorer } from "../tooling/extensions/hashline/batch-edit-anchorer.js";
import { DiffSynthesizer } from "../tooling/extensions/hashline/diff-synthesizer.js";
import { MasterBenchmarkOrchestrator } from "../tooling/extensions/evals/master-benchmark-orchestrator.js";
import { McpHub } from "../tooling/extensions/mcp/mcp-hub.js";
import { RipgrepSearchService } from "../tooling/extensions/perception/ripgrep-search-service.js";
import { UrlContentFetcher } from "../tooling/extensions/perception/url-content-fetcher.js";
import { LanguageSyntaxParser } from "../tooling/extensions/perception/language-syntax-parser.js";
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
import { TelemetryTracer } from "../tooling/extensions/telemetry/telemetry-tracer.js";
import { AgenticCommitGenerator } from "../tooling/extensions/policy/agentic-commit-generator.js";
import { StreamEventFormatter } from "../tooling/extensions/telemetry/stream-event-formatter.js";

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
    fileLockManager: FileLockManager;
    snapshotLruCache: LruCache<string, GameStateSnapshot>;
    gatewaySessionRegistry: GatewaySessionRegistry;
    snapshotStorageIndex: SnapshotStorageIndex;
    snowflakeIdGenerator: SnowflakeIdGenerator;
    systemDirectoryResolver: SystemDirectoryResolver;
    ringBuffer: FixedRingBuffer<string>;
    semverComparator: SemanticVersionComparator;
    gitIgnoreFilter: GitIgnoreFilter;
    treeWalker: WorkspaceTreeWalker;
    modelResolver: ModelResolver;
    modelCatalog: ModelCatalog;
    envKeyResolver: EnvironmentKeyResolver;
    imageModelRegistry: ImageModelRegistry;
    proxyGateway: LlmProxyGateway;
    reasoningEffortController: ReasoningEffortController;
    dynamicModelCache: DynamicModelCache;
    loopPhaseController: LoopPhaseController;
    budgetCalculator: ContextBudgetCalculator;
    tokenTruncator: TokenTruncator;
    templateEngine: PromptTemplateEngine;
    variableInjector: DynamicVariableInjector;
    connectionController: TransportConnectionController;
    resilientFetchClient: ResilientFetchClient;
    frontmatterParser: FrontmatterParser;
    filePeeker: BoundedFilePeeker;
    commandPathResolver: CommandPathResolver;
    textSanitizer: TerminalTextSanitizer;
    timingBuffer: MicrosecondTimingBuffer;
    tabSpacingNormalizer: TabSpacingNormalizer;
    schemaValidator: ToolCallSchemaValidator;
    argumentCoercer: ArgumentCoercer;
    batchAnchorer: BatchEditAnchorer;
    diffSynthesizer: DiffSynthesizer;
    masterBenchmarkOrchestrator: MasterBenchmarkOrchestrator;
    mcpHub: McpHub;
    ripgrepSearchService: RipgrepSearchService;
    urlContentFetcher: UrlContentFetcher;
    languageSyntaxParser: LanguageSyntaxParser;
    slashRouter: AgentSlashRouter;
    mentionResolver: MentionResolver;
    swarmDispatcher: AgentSwarmDispatcher;
    intelligenceEngine: WorkspaceIntelligenceEngine;
    interactiveController: InteractiveModeController;
    permissionController: CommandPermissionController;
    commitGenerator: AgenticCommitGenerator;
    gatewayServer: MonolithGatewayServer;
    benchmarkEvaluator: MonolithBenchmarkEvaluator;
    telemetryTracer: TelemetryTracer;
    streamFormatter: StreamEventFormatter;
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
    const fileLockManager = new FileLockManager();
    const snapshotLruCache = new LruCache<string, GameStateSnapshot>(50);
    const gatewaySessionRegistry = new GatewaySessionRegistry();
    const snapshotStorageIndex = new SnapshotStorageIndex();
    const snowflakeIdGenerator = new SnowflakeIdGenerator();
    const systemDirectoryResolver = new SystemDirectoryResolver();
    const ringBuffer = new FixedRingBuffer<string>(100);
    const semverComparator = new SemanticVersionComparator();
    const gitIgnoreFilter = new GitIgnoreFilter();
    const treeWalker = new WorkspaceTreeWalker(gitIgnoreFilter);

    const modelResolver = new ModelResolver(
      config.modelName,
      options.fallbackModels
    );
    const modelCatalog = new ModelCatalog();
    const envKeyResolver = new EnvironmentKeyResolver();
    const imageModelRegistry = new ImageModelRegistry();
    const proxyGateway = new LlmProxyGateway();
    const reasoningEffortController = new ReasoningEffortController();
    const dynamicModelCache = new DynamicModelCache();
    const loopPhaseController = new LoopPhaseController();
    const budgetCalculator = new ContextBudgetCalculator();
    const tokenTruncator = new TokenTruncator();
    const templateEngine = new PromptTemplateEngine();
    const variableInjector = new DynamicVariableInjector();

    const connectionController = new TransportConnectionController();
    const resilientFetchClient = new ResilientFetchClient();
    const frontmatterParser = new FrontmatterParser();
    const filePeeker = new BoundedFilePeeker();
    const commandPathResolver = new CommandPathResolver();
    const textSanitizer = new TerminalTextSanitizer();
    const timingBuffer = new MicrosecondTimingBuffer(100);
    const tabSpacingNormalizer = new TabSpacingNormalizer();
    const schemaValidator = new ToolCallSchemaValidator();
    const argumentCoercer = new ArgumentCoercer();
    const mcpHub = new McpHub();
    const ripgrepSearchService = new RipgrepSearchService();
    const urlContentFetcher = new UrlContentFetcher(resilientFetchClient);
    const languageSyntaxParser = new LanguageSyntaxParser();

    const permissionController = new CommandPermissionController();
    const eyes = new AstPerceptionEyes();
    const hands = new AnchoredHands(permissionController);
    const batchAnchorer = new BatchEditAnchorer(hands);
    const diffSynthesizer = new DiffSynthesizer();
    const benchmarkEvaluator = new MonolithBenchmarkEvaluator();
    const masterBenchmarkOrchestrator = new MasterBenchmarkOrchestrator(benchmarkEvaluator);

    const ears = new ProgressStreamingEars();
    const skillsIngestor = new SkillsIngestor(eyes);
    const slashRouter = new AgentSlashRouter();
    const mentionResolver = new MentionResolver();
    const swarmDispatcher = new AgentSwarmDispatcher();
    const intelligenceEngine = new WorkspaceIntelligenceEngine();
    const interactiveController = new InteractiveModeController();
    const commitGenerator = new AgenticCommitGenerator();
    const gatewayServer = new MonolithGatewayServer();
    const telemetryTracer = new TelemetryTracer();
    const streamFormatter = new StreamEventFormatter();

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
      fileLockManager,
      snapshotLruCache,
      gatewaySessionRegistry,
      snapshotStorageIndex,
      snowflakeIdGenerator,
      systemDirectoryResolver,
      ringBuffer,
      semverComparator,
      gitIgnoreFilter,
      treeWalker,
      modelResolver,
      modelCatalog,
      envKeyResolver,
      imageModelRegistry,
      proxyGateway,
      reasoningEffortController,
      dynamicModelCache,
      loopPhaseController,
      budgetCalculator,
      tokenTruncator,
      templateEngine,
      variableInjector,
      connectionController,
      resilientFetchClient,
      frontmatterParser,
      filePeeker,
      commandPathResolver,
      textSanitizer,
      timingBuffer,
      tabSpacingNormalizer,
      schemaValidator,
      argumentCoercer,
      batchAnchorer,
      diffSynthesizer,
      masterBenchmarkOrchestrator,
      mcpHub,
      ripgrepSearchService,
      urlContentFetcher,
      languageSyntaxParser,
      slashRouter,
      mentionResolver,
      swarmDispatcher,
      intelligenceEngine,
      interactiveController,
      permissionController,
      commitGenerator,
      gatewayServer,
      benchmarkEvaluator,
      telemetryTracer,
      streamFormatter,
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
