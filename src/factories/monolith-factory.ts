import { AgentConfig } from "../agents/base/agent-config.js";
import { AgentEngine } from "../agents/extensions/execution/agent-engine.js";
import { PromptComposer } from "../agents/extensions/compaction/prompt-composer.js";
import { ModelResolver } from "../agents/extensions/resolution/model-resolver.js";
import { AgentSlashRouter } from "../agents/extensions/resolution/agent-slash-router.js";
import { MentionResolver } from "../agents/extensions/mentions/mention-resolver.js";
import { AgentSwarmDispatcher } from "../agents/extensions/swarm/agent-swarm-dispatcher.js";
import { WorkspaceIntelligenceEngine } from "../agents/extensions/intelligence/workspace-intelligence.js";
import { KnowledgeGraphSubstrate } from "../agents/extensions/intelligence/knowledge-graph-substrate.js";
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
import { AgentLoopHarness } from "../agents/extensions/execution/agent-loop-harness.js";
import { ProviderAttributionComposer } from "../agents/extensions/resolution/provider-attribution.js";
import { HttpDispatcherOverlay } from "../agents/extensions/resolution/http-dispatcher.js";
import { AuthStorageVault } from "../agents/extensions/resolution/auth-storage-vault.js";
import { CodexOAuthManager } from "../agents/extensions/resolution/codex-oauth-manager.js";
import { CodexProviderBridge } from "../agents/extensions/resolution/codex-provider-bridge.js";
import { SetupWizard } from "../agents/extensions/setup/setup-wizard.js";

import { SessionContext } from "../sessions/base/session-context.js";
import { PersistentSessionStore } from "../sessions/extensions/persistence/session-store.js";
import { SessionCompactor } from "../sessions/extensions/compaction/session-compactor.js";
import { SessionVfs } from "../sessions/extensions/vfs/session-vfs.js";
import { SessionMemoryStore } from "../sessions/extensions/memory/session-memory-store.js";
import { ContextStalenessTracker, CognitiveFreshnessGuard } from "../sessions/extensions/memory/context-staleness-tracker.js";
import { StabilityDoctor } from "../sessions/extensions/integrity/stability-doctor.js";
import { PostmortemDiagnostic } from "../sessions/extensions/integrity/postmortem-diagnostic.js";
import { SystemHealthAggregator } from "../sessions/extensions/integrity/system-health-aggregator.js";
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
import { LockAuthorityEngine } from "../sessions/extensions/substrate/lock-authority.js";
import { NativeMutationTransactionSubstrate } from "../sessions/extensions/substrate/native-mutation-substrate.js";
import { WriteCoalescerSubstrate } from "../sessions/extensions/substrate/write-coalescer.js";
import { BroccoliSubstrateStore } from "../sessions/extensions/substrate/broccoli-substrate-store.js";
import { BroccoliCasCompactor } from "../sessions/extensions/compaction/broccolidb-cas-compactor.js";
import { ConvergenceEngineSubstrate } from "../agents/extensions/swarm/convergence-engine.js";
import { BroccoliTaskDagScheduler } from "../agents/extensions/swarm/broccoli-task-dag-scheduler.js";
import { BroccoliSpiderAuditEngine } from "../agents/extensions/intelligence/broccolidb-spider-audit.js";
import { BroccoliEpistemicReasoningEngine } from "../agents/extensions/intelligence/broccolidb-epistemic-reasoning.js";
import { BroccoliBlastRadiusCalculator } from "../agents/extensions/intelligence/broccolidb-blast-radius.js";
import { BroccoliCognitiveSuggestionEngine } from "../agents/extensions/intelligence/broccolidb-cognitive-suggestion.js";
import { BroccoliVerificationPipeline } from "../agents/extensions/intelligence/broccolidb-verification-pipeline.js";
import { BroccoliRepairMutationExecutor } from "../agents/extensions/execution/broccolidb-repair-executor.js";
import { BroccoliSystemInvariantEngine } from "../sessions/extensions/integrity/broccolidb-system-invariant.js";
import { BroccoliTaskStateEngine } from "../sessions/extensions/persistence/broccolidb-task-state.js";
import { BroccoliFencingMutexEngine } from "../sessions/extensions/substrate/broccolidb-fencing-mutex.js";
import { BroccoliRollbackCoordinator } from "../sessions/extensions/substrate/broccolidb-rollback-coordinator.js";
import { BroccoliInterAgentMailbox } from "../agents/extensions/swarm/broccolidb-inter-agent-mailbox.js";
import { BroccoliApprovalPolicyEngine } from "../tooling/extensions/permissions/broccolidb-approval-policy.js";
import { BroccoliMutationPlanner } from "../agents/extensions/execution/broccolidb-mutation-planner.js";
import { BroccoliExecutionTraceRecorder } from "../tooling/extensions/telemetry/broccolidb-execution-trace.js";
import { BroccoliIntentTracer } from "../agents/extensions/intelligence/broccolidb-intent-tracer.js";
import { BroccoliCASScratchpadService } from "../sessions/extensions/persistence/broccolidb-cas-scratchpad.js";
import { BroccoliContextDiagnosisService } from "../sessions/extensions/integrity/broccolidb-context-diagnosis.js";
import { BroccoliRetentionCleanupService } from "../sessions/extensions/integrity/broccolidb-retention-cleanup.js";
import { BroccoliTaskCoordinator } from "../agents/extensions/swarm/broccolidb-task-coordinator.js";
import { BroccoliSideQueryService } from "../agents/extensions/execution/broccolidb-side-query.js";
import { BroccoliTokenEstimator } from "../tooling/extensions/policy/broccolidb-token-estimator.js";
import { BroccoliQueryLoopOrchestrator } from "../agents/extensions/execution/broccolidb-query-loop.js";
import { BroccoliStructuralDiscoveryService } from "../tooling/extensions/perception/broccolidb-structural-discovery.js";
import { BroccoliAxiomVerifier } from "../tooling/extensions/permissions/broccolidb-axiom-verifier.js";
import { BroccoliPlanModeEnforcer } from "../agents/extensions/execution/broccolidb-plan-enforcer.js";
import { BroccoliJoyZoningEngine } from "../tooling/extensions/permissions/broccolidb-joy-zoning.js";
import { BroccoliJoyZoningGuard } from "../tooling/extensions/permissions/broccolidb-joy-zoning-guard.js";
import { BroccoliWorkspaceArchitectureProfiler } from "../tooling/extensions/permissions/broccolidb-architecture-profiler.js";
import { BroccoliJoyZoningModuleDecomposer } from "../tooling/extensions/permissions/broccolidb-module-decomposer.js";
import { BroccoliTspPolicyPlugin } from "../tooling/extensions/permissions/broccolidb-tsp-policy.js";
import { BroccoliJoyRideDiagnostics } from "../tooling/extensions/cache/broccolidb-joyride-diagnostics.js";
import { BroccoliJoyRideContractVerifier } from "../tooling/extensions/cache/broccolidb-joyride-contract.js";
import { BroccoliReactivePolicyObserver } from "../tooling/extensions/permissions/broccolidb-reactive-policy.js";
import { BroccoliUniversalGuard } from "../tooling/extensions/permissions/broccolidb-universal-guard.js";
import { BroccoliJoyRideDecisionLog } from "../tooling/extensions/cache/broccolidb-joyride-decision-log.js";
import { BroccoliIntegrityProtocol } from "../tooling/extensions/permissions/broccolidb-integrity-protocol.js";
import { BroccoliAutomatedModeController } from "../agents/extensions/execution/broccolidb-mode-controller.js";
import { BroccoliIntegrityOptimizer } from "../tooling/extensions/permissions/broccolidb-integrity-optimizer.js";
import { BroccoliStabilityForensics } from "../tooling/extensions/permissions/broccolidb-stability-forensics.js";
import { BroccoliSemanticAxiomEngine } from "../tooling/extensions/permissions/broccolidb-semantic-axiom.js";
import { BroccoliSimulationEngine } from "../tooling/extensions/permissions/broccolidb-simulation-engine.js";
import { BroccoliCommandSanitizer } from "../tooling/extensions/permissions/broccolidb-command-sanitizer.js";
import { BroccoliShellEnvironmentResolver } from "../tooling/extensions/permissions/broccolidb-shell-resolver.js";
import { BroccoliCommandDiagnostics } from "../tooling/extensions/permissions/broccolidb-command-diagnostics.js";
import { BroccoliCommandOutputBuffer } from "../tooling/extensions/telemetry/broccolidb-output-buffer.js";

import { JoyRideHotPathCache, HotPathCommandClassifier } from "../tooling/extensions/cache/joyride-cache.js";
import { LumiIgnorePolicyController } from "../tooling/extensions/permissions/lumi-ignore-controller.js";
import { BroccoliCircuitBreaker, TokenBucketRateGovernor } from "../tooling/extensions/policy/broccoli-circuit-breaker.js";
import { BroccoliStreamingToolExecutor } from "../tooling/extensions/registry/broccolidb-streaming-tool-executor.js";
import { BroccoliLspProtocolBridge } from "../tooling/extensions/perception/broccolidb-lsp-bridge.js";
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
import { RoadmapCompletionGate } from "../tooling/extensions/policy/roadmap-completion-gate.js";
import { RoadmapCheckpointDigest } from "../tooling/extensions/policy/roadmap-checkpoint-digest.js";
import { Eyes } from "../tooling/base/eyes.js";
import { AstPerceptionEyes } from "../tooling/extensions/perception/ast-eyes.js";
import { NativeClipboardBridge } from "../tooling/extensions/perception/native-clipboard.js";
import { AnchoredHands } from "../tooling/extensions/hashline/hands.js";
import { CommandPermissionController } from "../tooling/extensions/permissions/command-permission-controller.js";
import { ProcessLifecycleManager } from "../tooling/extensions/permissions/process-lifecycle-manager.js";
import { KeybindingsController } from "../tooling/extensions/permissions/keybindings-controller.js";
import { ProtocolEars } from "../tooling/extensions/telemetry/ears.js";
import { ProgressStreamingEars } from "../tooling/extensions/progress/progress-ears.js";
import { SkillsIngestor } from "../tooling/extensions/registry/skills-ingestor.js";
import { ValidatingToolRegistry } from "../tooling/extensions/registry/tool-registry.js";
import { MonolithGatewayServer } from "../tooling/extensions/gateway/monolith-gateway-server.js";
import { MonolithBenchmarkEvaluator } from "../tooling/extensions/evals/benchmark-evaluator.js";
import { TelemetryTracer } from "../tooling/extensions/telemetry/telemetry-tracer.js";
import { AgenticCommitGenerator } from "../tooling/extensions/policy/agentic-commit-generator.js";
import { StreamEventFormatter } from "../tooling/extensions/telemetry/stream-event-formatter.js";
import { StderrGuardFilter } from "../tooling/extensions/telemetry/stderr-guard.js";
import { TTSRCoordinator } from "../tooling/extensions/telemetry/ttsr-coordinator.js";
import { CentennialPassMarker } from "../tooling/extensions/policy/centennial-pass-marker.js";

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
    lockAuthorityEngine: LockAuthorityEngine;
    joyrideCache: JoyRideHotPathCache;
    stalenessTracker: ContextStalenessTracker;
    knowledgeGraph: KnowledgeGraphSubstrate;
    ignoreController: LumiIgnorePolicyController;
    mutationSubstrate: NativeMutationTransactionSubstrate;
    writeCoalescer: WriteCoalescerSubstrate;
    convergenceEngine: ConvergenceEngineSubstrate;
    broccoliSubstrateStore: BroccoliSubstrateStore;
    broccoliTaskDagScheduler: BroccoliTaskDagScheduler;
    broccoliCircuitBreaker: BroccoliCircuitBreaker;
    tokenBucketRateGovernor: TokenBucketRateGovernor;
    broccoliCasCompactor: BroccoliCasCompactor;
    broccoliSpiderAuditEngine: BroccoliSpiderAuditEngine;
    broccoliEpistemicReasoningEngine: BroccoliEpistemicReasoningEngine;
    broccoliSystemInvariantEngine: BroccoliSystemInvariantEngine;
    broccoliStreamingToolExecutor: BroccoliStreamingToolExecutor;
    broccoliTaskStateEngine: BroccoliTaskStateEngine;
    broccoliLspBridge: BroccoliLspProtocolBridge;
    broccoliBlastRadiusCalculator: BroccoliBlastRadiusCalculator;
    broccoliCognitiveSuggestionEngine: BroccoliCognitiveSuggestionEngine;
    broccoliFencingMutexEngine: BroccoliFencingMutexEngine;
    broccoliRepairMutationExecutor: BroccoliRepairMutationExecutor;
    broccoliVerificationPipeline: BroccoliVerificationPipeline;
    broccoliRollbackCoordinator: BroccoliRollbackCoordinator;
    broccoliInterAgentMailbox: BroccoliInterAgentMailbox;
    broccoliApprovalPolicyEngine: BroccoliApprovalPolicyEngine;
    broccoliMutationPlanner: BroccoliMutationPlanner;
    broccoliExecutionTraceRecorder: BroccoliExecutionTraceRecorder;
    broccoliIntentTracer: BroccoliIntentTracer;
    broccoliCASScratchpad: BroccoliCASScratchpadService;
    broccoliContextDiagnosis: BroccoliContextDiagnosisService;
    broccoliRetentionCleanup: BroccoliRetentionCleanupService;
    broccoliTaskCoordinator: BroccoliTaskCoordinator;
    broccoliSideQuery: BroccoliSideQueryService;
    broccoliTokenEstimator: BroccoliTokenEstimator;
    broccoliQueryLoop: BroccoliQueryLoopOrchestrator;
    broccoliStructuralDiscovery: BroccoliStructuralDiscoveryService;
    broccoliAxiomVerifier: BroccoliAxiomVerifier;
    broccoliPlanEnforcer: BroccoliPlanModeEnforcer;
    broccoliJoyZoningEngine: BroccoliJoyZoningEngine;
    broccoliJoyZoningGuard: BroccoliJoyZoningGuard;
    broccoliArchitectureProfiler: BroccoliWorkspaceArchitectureProfiler;
    broccoliModuleDecomposer: BroccoliJoyZoningModuleDecomposer;
    broccoliTspPolicy: BroccoliTspPolicyPlugin;
    broccoliJoyRideDiagnostics: BroccoliJoyRideDiagnostics;
    broccoliContractVerifier: BroccoliJoyRideContractVerifier;
    broccoliReactiveObserver: BroccoliReactivePolicyObserver;
    broccoliUniversalGuard: BroccoliUniversalGuard;
    broccoliDecisionLog: BroccoliJoyRideDecisionLog;
    broccoliIntegrityProtocol: BroccoliIntegrityProtocol;
    broccoliModeController: BroccoliAutomatedModeController;
    broccoliIntegrityOptimizer: BroccoliIntegrityOptimizer;
    broccoliStabilityForensics: BroccoliStabilityForensics;
    broccoliSemanticAxiom: BroccoliSemanticAxiomEngine;
    broccoliSimulation: BroccoliSimulationEngine;
    broccoliCommandSanitizer: BroccoliCommandSanitizer;
    broccoliShellResolver: BroccoliShellEnvironmentResolver;
    broccoliCommandDiagnostics: BroccoliCommandDiagnostics;
    broccoliOutputBuffer: BroccoliCommandOutputBuffer;
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
    completionGate: RoadmapCompletionGate;
    checkpointDigest: RoadmapCheckpointDigest;
    clipboardBridge: NativeClipboardBridge;
    loopHarness: AgentLoopHarness;
    postmortemDiagnostic: PostmortemDiagnostic;
    processLifecycleManager: ProcessLifecycleManager;
    providerAttribution: ProviderAttributionComposer;
    stderrGuard: StderrGuardFilter;
    keybindingsController: KeybindingsController;
    httpDispatcher: HttpDispatcherOverlay;
    authStorageVault: AuthStorageVault;
    ttsrCoordinator: TTSRCoordinator;
    centennialPassMarker: CentennialPassMarker;
    systemHealthAggregator: SystemHealthAggregator;
    codexOAuthManager: CodexOAuthManager;
    codexProviderBridge: CodexProviderBridge;
    setupWizard: SetupWizard;
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
    const lockAuthorityEngine = new LockAuthorityEngine();
    const joyrideCache = new JoyRideHotPathCache();
    const stalenessTracker = new ContextStalenessTracker(cwd);
    const knowledgeGraph = new KnowledgeGraphSubstrate();
    const ignoreController = new LumiIgnorePolicyController(cwd);
    const mutationSubstrate = new NativeMutationTransactionSubstrate(cwd);
    const writeCoalescer = new WriteCoalescerSubstrate();
    const convergenceEngine = new ConvergenceEngineSubstrate();
    const broccoliSubstrateStore = new BroccoliSubstrateStore();
    const broccoliTaskDagScheduler = new BroccoliTaskDagScheduler();
    const broccoliCircuitBreaker = new BroccoliCircuitBreaker();
    const tokenBucketRateGovernor = new TokenBucketRateGovernor();
    const broccoliCasCompactor = new BroccoliCasCompactor();
    const broccoliSpiderAuditEngine = new BroccoliSpiderAuditEngine(cwd);
    const broccoliEpistemicReasoningEngine = new BroccoliEpistemicReasoningEngine();
    const broccoliSystemInvariantEngine = new BroccoliSystemInvariantEngine(cwd);
    const broccoliStreamingToolExecutor = new BroccoliStreamingToolExecutor();
    const broccoliTaskStateEngine = new BroccoliTaskStateEngine(cwd);
    const broccoliLspBridge = new BroccoliLspProtocolBridge(cwd);
    const broccoliBlastRadiusCalculator = new BroccoliBlastRadiusCalculator(cwd);
    const broccoliCognitiveSuggestionEngine = new BroccoliCognitiveSuggestionEngine();
    const broccoliFencingMutexEngine = new BroccoliFencingMutexEngine();
    const broccoliRepairMutationExecutor = new BroccoliRepairMutationExecutor(cwd);
    const broccoliVerificationPipeline = new BroccoliVerificationPipeline();
    const broccoliRollbackCoordinator = new BroccoliRollbackCoordinator(cwd);
    const broccoliInterAgentMailbox = new BroccoliInterAgentMailbox();
    const broccoliApprovalPolicyEngine = new BroccoliApprovalPolicyEngine();
    const broccoliMutationPlanner = new BroccoliMutationPlanner(broccoliApprovalPolicyEngine);
    const broccoliExecutionTraceRecorder = new BroccoliExecutionTraceRecorder();
    const broccoliIntentTracer = new BroccoliIntentTracer();
    const broccoliCASScratchpad = new BroccoliCASScratchpadService(cwd);
    const broccoliContextDiagnosis = new BroccoliContextDiagnosisService();
    const broccoliRetentionCleanup = new BroccoliRetentionCleanupService(cwd);
    const broccoliTaskCoordinator = new BroccoliTaskCoordinator();
    const broccoliSideQuery = new BroccoliSideQueryService();
    const broccoliTokenEstimator = new BroccoliTokenEstimator();
    const broccoliQueryLoop = new BroccoliQueryLoopOrchestrator();
    const broccoliStructuralDiscovery = new BroccoliStructuralDiscoveryService(cwd);
    const broccoliAxiomVerifier = new BroccoliAxiomVerifier();
    const broccoliPlanEnforcer = new BroccoliPlanModeEnforcer(cwd);
    const broccoliJoyZoningEngine = new BroccoliJoyZoningEngine();
    const broccoliJoyZoningGuard = new BroccoliJoyZoningGuard(broccoliJoyZoningEngine);
    const broccoliArchitectureProfiler = new BroccoliWorkspaceArchitectureProfiler(broccoliJoyZoningEngine);
    const broccoliModuleDecomposer = new BroccoliJoyZoningModuleDecomposer(broccoliJoyZoningEngine);
    const broccoliTspPolicy = new BroccoliTspPolicyPlugin();
    const broccoliJoyRideDiagnostics = new BroccoliJoyRideDiagnostics();
    const broccoliContractVerifier = new BroccoliJoyRideContractVerifier();
    const broccoliReactiveObserver = new BroccoliReactivePolicyObserver(broccoliJoyZoningEngine);
    const broccoliUniversalGuard = new BroccoliUniversalGuard(broccoliJoyZoningEngine);
    const broccoliDecisionLog = new BroccoliJoyRideDecisionLog();
    const broccoliIntegrityProtocol = new BroccoliIntegrityProtocol();
    const broccoliModeController = new BroccoliAutomatedModeController();
    const broccoliIntegrityOptimizer = new BroccoliIntegrityOptimizer(broccoliJoyZoningEngine);
    const broccoliStabilityForensics = new BroccoliStabilityForensics(cwd);
    const broccoliSemanticAxiom = new BroccoliSemanticAxiomEngine(broccoliJoyZoningEngine);
    const broccoliSimulation = new BroccoliSimulationEngine(cwd, broccoliJoyZoningEngine);
    const broccoliCommandSanitizer = new BroccoliCommandSanitizer();
    const broccoliShellResolver = new BroccoliShellEnvironmentResolver();
    const broccoliCommandDiagnostics = new BroccoliCommandDiagnostics();
    const broccoliOutputBuffer = new BroccoliCommandOutputBuffer();

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
    const completionGate = new RoadmapCompletionGate();
    const checkpointDigest = new RoadmapCheckpointDigest();
    const clipboardBridge = new NativeClipboardBridge();
    const loopHarness = new AgentLoopHarness();
    const postmortemDiagnostic = new PostmortemDiagnostic();
    const processLifecycleManager = new ProcessLifecycleManager();
    const providerAttribution = new ProviderAttributionComposer();
    const stderrGuard = new StderrGuardFilter();
    const keybindingsController = new KeybindingsController();
    const httpDispatcher = new HttpDispatcherOverlay();
    const authStorageVault = new AuthStorageVault();
    const ttsrCoordinator = new TTSRCoordinator();
    const centennialPassMarker = new CentennialPassMarker();
    const systemHealthAggregator = new SystemHealthAggregator();
    const codexOAuthManager = new CodexOAuthManager(authStorageVault);
    codexOAuthManager.loadFromDisk();
    const codexProviderBridge = new CodexProviderBridge(codexOAuthManager, authStorageVault);
    const setupWizard = new SetupWizard({
      envKeyResolver,
      authStorageVault,
      codexOAuthManager,
      codexProviderBridge,
      proxyGateway,
    });
    const savedModel = setupWizard.getSavedModel();
    if (!options.config && savedModel) {
      (config as { modelName: string }).modelName = savedModel;
      modelResolver.setActiveModel(savedModel);
    }







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
      slashRouter,
      codexProviderBridge,
      proxyGateway
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
      lockAuthorityEngine,
      joyrideCache,
      stalenessTracker,
      knowledgeGraph,
      ignoreController,
      mutationSubstrate,
      writeCoalescer,
      convergenceEngine,
      broccoliSubstrateStore,
      broccoliTaskDagScheduler,
      broccoliCircuitBreaker,
      tokenBucketRateGovernor,
      broccoliCasCompactor,
      broccoliSpiderAuditEngine,
      broccoliEpistemicReasoningEngine,
      broccoliSystemInvariantEngine,
      broccoliStreamingToolExecutor,
      broccoliTaskStateEngine,
      broccoliLspBridge,
      broccoliBlastRadiusCalculator,
      broccoliCognitiveSuggestionEngine,
      broccoliFencingMutexEngine,
      broccoliRepairMutationExecutor,
      broccoliVerificationPipeline,
      broccoliRollbackCoordinator,
      broccoliInterAgentMailbox,
      broccoliApprovalPolicyEngine,
      broccoliMutationPlanner,
      broccoliExecutionTraceRecorder,
      broccoliIntentTracer,
      broccoliCASScratchpad,
      broccoliContextDiagnosis,
      broccoliRetentionCleanup,
      broccoliTaskCoordinator,
      broccoliSideQuery,
      broccoliTokenEstimator,
      broccoliQueryLoop,
      broccoliStructuralDiscovery,
      broccoliAxiomVerifier,
      broccoliPlanEnforcer,
      broccoliJoyZoningEngine,
      broccoliJoyZoningGuard,
      broccoliArchitectureProfiler,
      broccoliModuleDecomposer,
      broccoliTspPolicy,
      broccoliJoyRideDiagnostics,
      broccoliContractVerifier,
      broccoliReactiveObserver,
      broccoliUniversalGuard,
      broccoliDecisionLog,
      broccoliIntegrityProtocol,
      broccoliModeController,
      broccoliIntegrityOptimizer,
      broccoliStabilityForensics,
      broccoliSemanticAxiom,
      broccoliSimulation,
      broccoliCommandSanitizer,
      broccoliShellResolver,
      broccoliCommandDiagnostics,
      broccoliOutputBuffer,
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
      completionGate,
      checkpointDigest,
      clipboardBridge,
      loopHarness,
      postmortemDiagnostic,
      processLifecycleManager,
      providerAttribution,
      stderrGuard,
      keybindingsController,
      httpDispatcher,
      authStorageVault,
      ttsrCoordinator,
      centennialPassMarker,
      systemHealthAggregator,
      codexOAuthManager,
      codexProviderBridge,
      setupWizard,
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
