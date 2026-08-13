#!/usr/bin/env node
import { realpathSync } from "node:fs";
import * as readline from "node:readline";
import { fileURLToPath, pathToFileURL } from "node:url";
import { MonolithFactory, type MonolithFactoryOptions } from "./factories/monolith-factory.js";
import type { EngineTickInput, EngineTickResult, IAgentEngine } from "./core/contracts/agent.contracts.js";
import type { GameStateSnapshot } from "./core/contracts/session.contracts.js";
import { AgentConfig } from "./agents/base/agent-config.js";
import { AgentEngine } from "./agents/extensions/execution/agent-engine.js";
import { PromptComposer } from "./agents/extensions/compaction/prompt-composer.js";
import { ModelResolver } from "./agents/extensions/resolution/model-resolver.js";
import { AgentSlashRouter } from "./agents/extensions/resolution/agent-slash-router.js";
import { MentionResolver } from "./agents/extensions/mentions/mention-resolver.js";
import { AgentSwarmDispatcher, type SwarmSubagentTaskResult } from "./agents/extensions/swarm/agent-swarm-dispatcher.js";
import { WorkspaceIntelligenceEngine, type WorkspaceCognitiveModel } from "./agents/extensions/intelligence/workspace-intelligence.js";
import { ModelCatalog, type ModelSpecs } from "./agents/extensions/resolution/model-catalog.js";
import { InteractiveModeController } from "./agents/extensions/execution/interactive-mode-controller.js";
import { EnvironmentKeyResolver, type ProviderKeyStatus } from "./agents/extensions/resolution/environment-key-resolver.js";
import { ImageModelRegistry, type ImageModelSpecs } from "./agents/extensions/resolution/image-model-registry.js";
import { LlmProxyGateway, type ProxyEndpointConfig } from "./agents/extensions/resolution/llm-proxy-gateway.js";
import { ReasoningEffortController, type ReasoningEffortLevel } from "./agents/extensions/resolution/reasoning-effort-controller.js";
import { DynamicModelCache, type CachedModelList } from "./agents/extensions/resolution/dynamic-model-cache.js";
import { LoopPhaseController, type LoopPhase, type PhaseTransitionEvent } from "./agents/extensions/execution/loop-phase-controller.js";
import { ContextBudgetCalculator, type ContextBudgetInfo } from "./agents/extensions/compaction/context-budget-calculator.js";
import { TokenTruncator } from "./agents/extensions/compaction/token-truncator.js";
import { PromptTemplateEngine } from "./agents/extensions/compaction/prompt-template-engine.js";
import { DynamicVariableInjector } from "./agents/extensions/compaction/dynamic-variable-injector.js";
import { AgentLoopHarness } from "./agents/extensions/execution/agent-loop-harness.js";
import { ProviderAttributionComposer, type AttributionRecord, type AttributionSummary } from "./agents/extensions/resolution/provider-attribution.js";
import { HttpDispatcherOverlay, type DispatcherConfig } from "./agents/extensions/resolution/http-dispatcher.js";
import { AuthStorageVault, type AuthTokenRecord } from "./agents/extensions/resolution/auth-storage-vault.js";
import { CodexOAuthManager, type OpenAiCodexCredentials, type CodexAuthUrlDetails } from "./agents/extensions/resolution/codex-oauth-manager.js";
import { CodexProviderBridge, MODERN_GPT56_MODELS, type ResolvedAuthHeaders, type ModernGpt56Model } from "./agents/extensions/resolution/codex-provider-bridge.js";
import { SetupWizard } from "./agents/extensions/setup/setup-wizard.js";

import { SessionContext } from "./sessions/base/session-context.js";
import { PersistentSessionStore, SessionStore } from "./sessions/extensions/persistence/session-store.js";
import { SessionCompactor } from "./sessions/extensions/compaction/session-compactor.js";
import { SessionVfs } from "./sessions/extensions/vfs/session-vfs.js";
import { SessionMemoryStore } from "./sessions/extensions/memory/session-memory-store.js";
import { StabilityDoctor, type EnvironmentIntegrityReport } from "./sessions/extensions/integrity/stability-doctor.js";
import { PostmortemDiagnostic, type ExceptionRecord, type PostmortemReport } from "./sessions/extensions/integrity/postmortem-diagnostic.js";
import { SystemHealthAggregator, type SubsystemHealthStatus, type AggregateHealthReport } from "./sessions/extensions/integrity/system-health-aggregator.js";
import { SnapcompactEngine, type SnapcompactResult } from "./sessions/extensions/compaction/snapcompact-engine.js";
import { FileLockManager, LruCache } from "./sessions/extensions/substrate/file-lock.js";
import { RemoteSessionHandle } from "./sessions/extensions/persistence/remote-session-handle.js";
import { GatewaySessionRegistry, type ActiveSessionInfo } from "./sessions/extensions/persistence/gateway-session-registry.js";
import { SnapshotStorageIndex, type SnapshotMetadata } from "./sessions/extensions/persistence/snapshot-storage-index.js";
import { SnowflakeIdGenerator } from "./sessions/extensions/substrate/snowflake-id-generator.js";
import { SystemDirectoryResolver, type SystemDirectories } from "./sessions/extensions/substrate/system-directory-resolver.js";
import { FixedRingBuffer } from "./sessions/extensions/substrate/ring-buffer.js";
import { SemanticVersionComparator, type ParsedSemver } from "./sessions/extensions/integrity/semantic-version-comparator.js";
import { GitIgnoreFilter } from "./sessions/extensions/vfs/git-ignore-filter.js";
import { WorkspaceTreeWalker, type FileTreeNode } from "./sessions/extensions/vfs/workspace-tree-walker.js";

import { Eyes } from "./tooling/base/eyes.js";
import { AstPerceptionEyes, type SymbolSearchResult } from "./tooling/extensions/perception/ast-eyes.js";
import { FrontmatterParser, type FrontmatterResult } from "./tooling/extensions/perception/frontmatter-parser.js";
import { BoundedFilePeeker, type PeekFileResult } from "./tooling/extensions/perception/file-peeker.js";
import { CommandPathResolver } from "./tooling/extensions/permissions/command-path-resolver.js";
import { TerminalTextSanitizer } from "./tooling/extensions/telemetry/text-sanitizer.js";
import { MicrosecondTimingBuffer, type TimingMeasurement } from "./tooling/extensions/telemetry/timing-buffer.js";
import { TabSpacingNormalizer } from "./tooling/extensions/hashline/tab-spacing-normalizer.js";
import { ToolCallSchemaValidator, type ValidationResult } from "./tooling/extensions/registry/tool-call-schema-validator.js";
import { ArgumentCoercer } from "./tooling/extensions/registry/argument-coercer.js";
import { BatchEditAnchorer, type BatchEditTask } from "./tooling/extensions/hashline/batch-edit-anchorer.js";
import { DiffSynthesizer } from "./tooling/extensions/hashline/diff-synthesizer.js";
import { MasterBenchmarkOrchestrator, type GrandBenchmarkResult } from "./tooling/extensions/evals/master-benchmark-orchestrator.js";
import { RuntimeSmokeSuite, type RuntimeSmokeReport } from "./tooling/extensions/evals/runtime-smoke-suite.js";
import { LiveBaselineReporter } from "./tooling/extensions/evals/live-baseline-reporter.js";
import { FlappyBirdProjectBenchmark } from "./tooling/extensions/evals/flappy-bird-project-benchmark.js";
import { ArchitectureGuardrailGate } from "./tooling/extensions/policy/architecture-guardrail-gate.js";
import { McpHub, type McpServerConfig, type McpDiscoveredTool } from "./tooling/extensions/mcp/mcp-hub.js";
import { RipgrepSearchService, type RipgrepMatch } from "./tooling/extensions/perception/ripgrep-search-service.js";
import { UrlContentFetcher } from "./tooling/extensions/perception/url-content-fetcher.js";
import { LanguageSyntaxParser, type SyntaxSymbol } from "./tooling/extensions/perception/language-syntax-parser.js";
import {
  RoadmapCompletionGate,
  AttemptCompletionGateStrategy,
  type GateCriteria,
  type CompletionGateResult,
  type AttemptGateEvaluationContext,
  type DynamicGateCriteria,
  type CriterionEvaluatorFn,
  type AttemptGateStrategyConfig,
  type AutonomousAttemptExecutionResult,
} from "./tooling/extensions/policy/roadmap-completion-gate.js";
import { RoadmapCheckpointDigest, type CheckpointDigest } from "./tooling/extensions/policy/roadmap-checkpoint-digest.js";
import { NativeClipboardBridge } from "./tooling/extensions/perception/native-clipboard.js";
import { AnchoredHands, Hands } from "./tooling/extensions/hashline/hands.js";
import { CommandPermissionController, type PermissionValidationResult } from "./tooling/extensions/permissions/command-permission-controller.js";
import { ProcessLifecycleManager, type ProcessHandle } from "./tooling/extensions/permissions/process-lifecycle-manager.js";
import { KeybindingsController, type KeybindingBinding } from "./tooling/extensions/permissions/keybindings-controller.js";
import { ProtocolEars, Ears } from "./tooling/extensions/telemetry/ears.js";
import { ProgressStreamingEars, TerminalProgressRenderer } from "./tooling/extensions/progress/progress-ears.js";
import { SkillsIngestor } from "./tooling/extensions/registry/skills-ingestor.js";
import { ValidatingToolRegistry, ToolRegistry } from "./tooling/extensions/registry/tool-registry.js";
import { ModuleDecomposer } from "./tooling/extensions/policy/module-decomposer.js";
import { MonolithGatewayServer } from "./tooling/extensions/gateway/monolith-gateway-server.js";
import { MonolithBenchmarkEvaluator } from "./tooling/extensions/evals/benchmark-evaluator.js";
import { TelemetryTracer, type ActiveSpan } from "./tooling/extensions/telemetry/telemetry-tracer.js";
import { AgenticCommitGenerator, type ConventionalCommitResult } from "./tooling/extensions/policy/agentic-commit-generator.js";
import { StreamEventFormatter, type StreamChunkEvent } from "./tooling/extensions/telemetry/stream-event-formatter.js";
import { TransportConnectionController, type ConnectionHealth } from "./tooling/extensions/gateway/transport-connection-controller.js";
import { ResilientFetchClient, type FetchResult } from "./tooling/extensions/telemetry/resilient-fetch-client.js";
import { StderrGuardFilter, type SuppressionStats } from "./tooling/extensions/telemetry/stderr-guard.js";
import { TTSRCoordinator, type TTSRMeasurement } from "./tooling/extensions/telemetry/ttsr-coordinator.js";
import { CentennialPassMarker, type CentennialMilestone } from "./tooling/extensions/policy/centennial-pass-marker.js";

import { ArenaAllocator } from "./sessions/extensions/substrate/arena-allocator.js";

export type {
  EngineProgressEvent,
  EngineProgressMetadata,
  EngineProgressPhase,
  EngineProgressStatus,
  EngineTickInput,
  EngineTickOutcome,
  EngineTickResult,
  IAgentEngine,
} from "./core/contracts/agent.contracts.js";
export type { GameStateSnapshot, SessionMessage, ISessionStore, SlabBufferSnapshot } from "./core/contracts/session.contracts.js";
export type { CommandResult, AnchoredEditResult, ToolingEvent, JsonRpcNotification, TerminalProgressFrame, IHands, IEars, IToolRegistry } from "./core/contracts/tooling.contracts.js";
export {
  estimateMessageTokens,
  estimateMessagesTokens,
  estimateTextTokens,
  truncateTextToTokenBudget,
} from "./core/utilities/token-estimator.js";

export { AbstractAgentEngine } from "./core/abstracts/abstract-agent-engine.js";
export { AbstractSessionStore } from "./core/abstracts/abstract-session-store.js";
export { AbstractHands } from "./core/abstracts/abstract-hands.js";
export { AbstractEars } from "./core/abstracts/abstract-ears.js";
export { AbstractToolRegistry } from "./core/abstracts/abstract-tool-registry.js";

export { AgentConfig } from "./agents/base/agent-config.js";
export { AgentEngine } from "./agents/extensions/execution/agent-engine.js";
export type { AgentContextServices } from "./agents/extensions/execution/agent-engine.js";
export { PromptComposer } from "./agents/extensions/compaction/prompt-composer.js";
export { ContextDslEngine } from "./agents/extensions/compaction/context-dsl-engine.js";
export type {
  ContextDslEnvelope,
  ContextCheckpointEnvelope,
  ThreadBootstrapEnvelope,
  MemoryEnvelopePayload,
  ToolResultEnvelopePayload,
  GoalEnvelopePayload,
  DslIntegrityResult,
  DslEnvelopeMetrics,
} from "./agents/extensions/compaction/context-dsl-engine.js";
export { ModelResolver } from "./agents/extensions/resolution/model-resolver.js";
export { AgentSlashRouter } from "./agents/extensions/resolution/agent-slash-router.js";
export { MentionResolver } from "./agents/extensions/mentions/mention-resolver.js";
export { AgentSwarmDispatcher } from "./agents/extensions/swarm/agent-swarm-dispatcher.js";
export type { SwarmSubagentTaskResult } from "./agents/extensions/swarm/agent-swarm-dispatcher.js";
export { WorkspaceIntelligenceEngine } from "./agents/extensions/intelligence/workspace-intelligence.js";
export type { WorkspaceCognitiveModel } from "./agents/extensions/intelligence/workspace-intelligence.js";
export { ModelCatalog } from "./agents/extensions/resolution/model-catalog.js";
export type { ModelSpecs } from "./agents/extensions/resolution/model-catalog.js";
export { InteractiveModeController } from "./agents/extensions/execution/interactive-mode-controller.js";
export { EnvironmentKeyResolver } from "./agents/extensions/resolution/environment-key-resolver.js";
export type { ProviderKeyStatus } from "./agents/extensions/resolution/environment-key-resolver.js";
export { ImageModelRegistry } from "./agents/extensions/resolution/image-model-registry.js";
export type { ImageModelSpecs } from "./agents/extensions/resolution/image-model-registry.js";
export { LlmProxyGateway } from "./agents/extensions/resolution/llm-proxy-gateway.js";
export type { ProxyEndpointConfig } from "./agents/extensions/resolution/llm-proxy-gateway.js";
export { ReasoningEffortController } from "./agents/extensions/resolution/reasoning-effort-controller.js";
export type { ReasoningEffortLevel } from "./agents/extensions/resolution/reasoning-effort-controller.js";
export { DynamicModelCache } from "./agents/extensions/resolution/dynamic-model-cache.js";
export type { CachedModelList } from "./agents/extensions/resolution/dynamic-model-cache.js";
export { LoopPhaseController } from "./agents/extensions/execution/loop-phase-controller.js";
export type { LoopPhase, PhaseTransitionEvent } from "./agents/extensions/execution/loop-phase-controller.js";
export { ContextBudgetCalculator } from "./agents/extensions/compaction/context-budget-calculator.js";
export type { ContextBudgetInfo, ContextBudgetOptions } from "./agents/extensions/compaction/context-budget-calculator.js";
export { TokenTruncator } from "./agents/extensions/compaction/token-truncator.js";
export type { TokenTruncationOptions } from "./agents/extensions/compaction/token-truncator.js";
export { PromptTemplateEngine } from "./agents/extensions/compaction/prompt-template-engine.js";
export { DynamicVariableInjector } from "./agents/extensions/compaction/dynamic-variable-injector.js";
export { AgentLoopHarness } from "./agents/extensions/execution/agent-loop-harness.js";
export type { HarnessStepEvent, HarnessExecutionResult, AutonomousHarnessOptions } from "./agents/extensions/execution/agent-loop-harness.js";
export { ProviderAttributionComposer } from "./agents/extensions/resolution/provider-attribution.js";
export type { AttributionRecord, AttributionSummary } from "./agents/extensions/resolution/provider-attribution.js";
export { HttpDispatcherOverlay } from "./agents/extensions/resolution/http-dispatcher.js";
export type { DispatcherConfig } from "./agents/extensions/resolution/http-dispatcher.js";
export { AuthStorageVault } from "./agents/extensions/resolution/auth-storage-vault.js";
export type { AuthTokenRecord } from "./agents/extensions/resolution/auth-storage-vault.js";
export { CodexOAuthManager } from "./agents/extensions/resolution/codex-oauth-manager.js";
export type { OpenAiCodexCredentials, CodexAuthUrlDetails } from "./agents/extensions/resolution/codex-oauth-manager.js";
export { CodexProviderBridge, MODERN_GPT56_MODELS } from "./agents/extensions/resolution/codex-provider-bridge.js";
export type { ResolvedAuthHeaders, ModernGpt56Model } from "./agents/extensions/resolution/codex-provider-bridge.js";

export { SessionContext } from "./sessions/base/session-context.js";
export { PersistentSessionStore, SessionStore } from "./sessions/extensions/persistence/session-store.js";
export { ArenaAllocator } from "./sessions/extensions/substrate/arena-allocator.js";
export { SessionCompactor } from "./sessions/extensions/compaction/session-compactor.js";
export type {
  CompactorOptions,
  CompactionReason,
  ContextCompactionPolicy,
  ContextCompactionReport,
} from "./sessions/extensions/compaction/session-compactor.js";
export { SessionVfs } from "./sessions/extensions/vfs/session-vfs.js";
export { SessionMemoryStore } from "./sessions/extensions/memory/session-memory-store.js";
export { StabilityDoctor } from "./sessions/extensions/integrity/stability-doctor.js";
export type { EnvironmentIntegrityReport } from "./sessions/extensions/integrity/stability-doctor.js";
export { PostmortemDiagnostic } from "./sessions/extensions/integrity/postmortem-diagnostic.js";
export type { ExceptionRecord, PostmortemReport } from "./sessions/extensions/integrity/postmortem-diagnostic.js";
export { SystemHealthAggregator } from "./sessions/extensions/integrity/system-health-aggregator.js";
export type { SubsystemHealthStatus, AggregateHealthReport } from "./sessions/extensions/integrity/system-health-aggregator.js";
export { SnapcompactEngine } from "./sessions/extensions/compaction/snapcompact-engine.js";
export type { SnapcompactResult } from "./sessions/extensions/compaction/snapcompact-engine.js";
export { FileLockManager, LruCache } from "./sessions/extensions/substrate/file-lock.js";
export { RemoteSessionHandle } from "./sessions/extensions/persistence/remote-session-handle.js";
export { GatewaySessionRegistry } from "./sessions/extensions/persistence/gateway-session-registry.js";
export type { ActiveSessionInfo } from "./sessions/extensions/persistence/gateway-session-registry.js";
export { SnapshotStorageIndex } from "./sessions/extensions/persistence/snapshot-storage-index.js";
export type { SnapshotMetadata } from "./sessions/extensions/persistence/snapshot-storage-index.js";
export { SnowflakeIdGenerator } from "./sessions/extensions/substrate/snowflake-id-generator.js";
export { SystemDirectoryResolver } from "./sessions/extensions/substrate/system-directory-resolver.js";
export type { SystemDirectories } from "./sessions/extensions/substrate/system-directory-resolver.js";
export { FixedRingBuffer } from "./sessions/extensions/substrate/ring-buffer.js";
export { SemanticVersionComparator } from "./sessions/extensions/integrity/semantic-version-comparator.js";
export type { ParsedSemver } from "./sessions/extensions/integrity/semantic-version-comparator.js";
export { GitIgnoreFilter } from "./sessions/extensions/vfs/git-ignore-filter.js";
export { WorkspaceTreeWalker } from "./sessions/extensions/vfs/workspace-tree-walker.js";
export type { FileTreeNode } from "./sessions/extensions/vfs/workspace-tree-walker.js";
export { LockAuthorityEngine, BroccoliFencingSubstrate } from "./sessions/extensions/substrate/lock-authority.js";
export type { LockClaim, LockAcquireResult, LockReleaseResult, StaleRecoveryReport } from "./sessions/extensions/substrate/lock-authority.js";
export { JoyRideHotPathCache, HotPathCommandClassifier } from "./tooling/extensions/cache/joyride-cache.js";
export type { JoyRideCacheKind, JoyRideCacheEntry, JoyRideCacheStats, CommandSafetyTier } from "./tooling/extensions/cache/joyride-cache.js";
export { ContextStalenessTracker, CognitiveFreshnessGuard } from "./sessions/extensions/memory/context-staleness-tracker.js";
export type { ContextReadEntry, StalenessReport } from "./sessions/extensions/memory/context-staleness-tracker.js";
export { KnowledgeGraphSubstrate } from "./agents/extensions/intelligence/knowledge-graph-substrate.js";
export type { KnowledgeNode, KnowledgeEdge, GraphTraversalFilter } from "./agents/extensions/intelligence/knowledge-graph-substrate.js";
export { LumiIgnorePolicyController } from "./tooling/extensions/permissions/lumi-ignore-controller.js";
export type { IgnorePolicyStatus } from "./tooling/extensions/permissions/lumi-ignore-controller.js";
export { NativeMutationTransactionSubstrate, isPathInWorkspace, getNormalizedHash } from "./sessions/extensions/substrate/native-mutation-substrate.js";
export type { MutationTransaction, MutationResult } from "./sessions/extensions/substrate/native-mutation-substrate.js";
export { WriteCoalescerSubstrate, calculateFastHash } from "./sessions/extensions/substrate/write-coalescer.js";
export type { PendingWrite, CoalescerStats } from "./sessions/extensions/substrate/write-coalescer.js";
export { ConvergenceEngineSubstrate, PRIORITY_LATTICE } from "./agents/extensions/swarm/convergence-engine.js";
export type { AgentRefinement, ResolvedDecision, ConflictResolution } from "./agents/extensions/swarm/convergence-engine.js";
export { BroccoliSubstrateStore } from "./sessions/extensions/substrate/broccoli-substrate-store.js";
export type { SubstrateEntity, SubstrateQueryFilter, SubstrateTransactionCheckpoint } from "./sessions/extensions/substrate/broccoli-substrate-store.js";
export { BroccoliTaskDagScheduler } from "./agents/extensions/swarm/broccoli-task-dag-scheduler.js";
export type { DagTaskNode, TaskStatus } from "./agents/extensions/swarm/broccoli-task-dag-scheduler.js";
export { BroccoliCircuitBreaker, TokenBucketRateGovernor } from "./tooling/extensions/policy/broccoli-circuit-breaker.js";
export type { CircuitState, CircuitStatus } from "./tooling/extensions/policy/broccoli-circuit-breaker.js";
export { BroccoliCasCompactor } from "./sessions/extensions/compaction/broccolidb-cas-compactor.js";
export type { CasBlobRecord, ContextProjectionRecord } from "./sessions/extensions/compaction/broccolidb-cas-compactor.js";
export { BroccoliSpiderAuditEngine } from "./agents/extensions/intelligence/broccolidb-spider-audit.js";
export type { SpiderAuditItem, SpiderAuditReport } from "./agents/extensions/intelligence/broccolidb-spider-audit.js";
export { BroccoliEpistemicReasoningEngine } from "./agents/extensions/intelligence/broccolidb-epistemic-reasoning.js";
export type { ContradictionReport } from "./agents/extensions/intelligence/broccolidb-epistemic-reasoning.js";
export { BroccoliSystemInvariantEngine } from "./sessions/extensions/integrity/broccolidb-system-invariant.js";
export type { SystemInvariantViolation, InvariantAuditReport } from "./sessions/extensions/integrity/broccolidb-system-invariant.js";
export { BroccoliStreamingToolExecutor } from "./tooling/extensions/registry/broccolidb-streaming-tool-executor.js";
export type { ToolExecutionPhase, ToolExecutionProgress, StreamingToolExecutorOptions } from "./tooling/extensions/registry/broccolidb-streaming-tool-executor.js";
export { BroccoliTaskStateEngine } from "./sessions/extensions/persistence/broccolidb-task-state.js";
export { BroccoliLspProtocolBridge } from "./tooling/extensions/perception/broccolidb-lsp-bridge.js";
export type { LspLocation, LspDiagnostic } from "./tooling/extensions/perception/broccolidb-lsp-bridge.js";
export { BroccoliBlastRadiusCalculator } from "./agents/extensions/intelligence/broccolidb-blast-radius.js";
export type { BlastRadiusResult, FileDependencyNode } from "./agents/extensions/intelligence/broccolidb-blast-radius.js";
export { BroccoliCognitiveSuggestionEngine } from "./agents/extensions/intelligence/broccolidb-cognitive-suggestion.js";
export type { PromptSuggestion } from "./agents/extensions/intelligence/broccolidb-cognitive-suggestion.js";
export { BroccoliFencingMutexEngine } from "./sessions/extensions/substrate/broccolidb-fencing-mutex.js";
export type { FencingLockRecord } from "./sessions/extensions/substrate/broccolidb-fencing-mutex.js";
export { BroccoliRepairMutationExecutor } from "./agents/extensions/execution/broccolidb-repair-executor.js";
export type { RepairDirective, MutationStep, MutationPlan, RepairExecution } from "./agents/extensions/execution/broccolidb-repair-executor.js";
export { BroccoliVerificationPipeline } from "./agents/extensions/intelligence/broccolidb-verification-pipeline.js";
export type { VerificationFinding, VerificationReport } from "./agents/extensions/intelligence/broccolidb-verification-pipeline.js";
export { BroccoliRollbackCoordinator } from "./sessions/extensions/substrate/broccolidb-rollback-coordinator.js";
export type { FileSnapshotRecord, RollbackResult } from "./sessions/extensions/substrate/broccolidb-rollback-coordinator.js";
export { BroccoliInterAgentMailbox } from "./agents/extensions/swarm/broccolidb-inter-agent-mailbox.js";
export type { MailboxMessage } from "./agents/extensions/swarm/broccolidb-inter-agent-mailbox.js";
export { BroccoliApprovalPolicyEngine, PolicyBlockedError } from "./tooling/extensions/permissions/broccolidb-approval-policy.js";
export type { ApprovalPolicy, RepairRiskLevel, PolicyDecision } from "./tooling/extensions/permissions/broccolidb-approval-policy.js";
export { BroccoliMutationPlanner } from "./agents/extensions/execution/broccolidb-mutation-planner.js";
export { BroccoliExecutionTraceRecorder } from "./tooling/extensions/telemetry/broccolidb-execution-trace.js";
export type { ExecutionTraceEvent, ExecutionTraceEventKind } from "./tooling/extensions/telemetry/broccolidb-execution-trace.js";
export { BroccoliIntentTracer } from "./agents/extensions/intelligence/broccolidb-intent-tracer.js";
export type { CapabilityIntent, IntentTrace, IntentTracerHealth } from "./agents/extensions/intelligence/broccolidb-intent-tracer.js";
export { BroccoliCASScratchpadService } from "./sessions/extensions/persistence/broccolidb-cas-scratchpad.js";
export type { ScratchpadRecord } from "./sessions/extensions/persistence/broccolidb-cas-scratchpad.js";
export { BroccoliContextDiagnosisService } from "./sessions/extensions/integrity/broccolidb-context-diagnosis.js";
export type { DiagnosisKnowledgeNode, ContextHealthReport } from "./sessions/extensions/integrity/broccolidb-context-diagnosis.js";
export { BroccoliRetentionCleanupService } from "./sessions/extensions/integrity/broccolidb-retention-cleanup.js";
export type { CleanupMetrics } from "./sessions/extensions/integrity/broccolidb-retention-cleanup.js";
export { BroccoliTaskCoordinator } from "./agents/extensions/swarm/broccolidb-task-coordinator.js";
export type { ActiveWorkerRecord, TaskCoordinatorStatus } from "./agents/extensions/swarm/broccolidb-task-coordinator.js";
export { BroccoliSideQueryService } from "./agents/extensions/execution/broccolidb-side-query.js";
export type { SideQueryResult, IntentClassification } from "./agents/extensions/execution/broccolidb-side-query.js";
export { BroccoliTokenEstimator } from "./tooling/extensions/policy/broccolidb-token-estimator.js";
export type { TokenEstimationReport } from "./tooling/extensions/policy/broccolidb-token-estimator.js";
export { BroccoliQueryLoopOrchestrator } from "./agents/extensions/execution/broccolidb-query-loop.js";
export type { QueryLoopState } from "./agents/extensions/execution/broccolidb-query-loop.js";
export { BroccoliStructuralDiscoveryService } from "./tooling/extensions/perception/broccolidb-structural-discovery.js";
export type { StructuralBlastRadius } from "./tooling/extensions/perception/broccolidb-structural-discovery.js";
export { BroccoliAxiomVerifier } from "./tooling/extensions/permissions/broccolidb-axiom-verifier.js";
export type { AxiomVerificationResult } from "./tooling/extensions/permissions/broccolidb-axiom-verifier.js";
export { BroccoliPlanModeEnforcer } from "./agents/extensions/execution/broccolidb-plan-enforcer.js";
export type { PlanReviewResult } from "./agents/extensions/execution/broccolidb-plan-enforcer.js";
export { BroccoliJoyZoningEngine, CommentStyleMap } from "./tooling/extensions/permissions/broccolidb-joy-zoning.js";
export type { JoyLayer, CommentStyle } from "./tooling/extensions/permissions/broccolidb-joy-zoning.js";
export { BroccoliJoyZoningGuard } from "./tooling/extensions/permissions/broccolidb-joy-zoning-guard.js";
export type { BoundaryViolation, BoundaryValidationResult } from "./tooling/extensions/permissions/broccolidb-joy-zoning-guard.js";
export { BroccoliWorkspaceArchitectureProfiler, DEFAULT_JOY_ZONING_STEERING_THRESHOLDS } from "./tooling/extensions/permissions/broccolidb-architecture-profiler.js";
export type { WorkspaceArchitectureMode, JoyZoningSteeringThresholds, WorkspaceArchitectureProfileResult } from "./tooling/extensions/permissions/broccolidb-architecture-profiler.js";
export { BroccoliJoyZoningModuleDecomposer } from "./tooling/extensions/permissions/broccolidb-module-decomposer.js";
export type { DecompositionAction, DecompositionStep, DecompositionPlan } from "./tooling/extensions/permissions/broccolidb-module-decomposer.js";
export { BroccoliTspPolicyPlugin } from "./tooling/extensions/permissions/broccolidb-tsp-policy.js";
export type { EnforcementTheme, ExceptionRule, PolicyEvaluationResult } from "./tooling/extensions/permissions/broccolidb-tsp-policy.js";
export { BroccoliJoyRideDiagnostics } from "./tooling/extensions/cache/broccolidb-joyride-diagnostics.js";
export type { JoyRideDiagnosticMetrics } from "./tooling/extensions/cache/broccolidb-joyride-diagnostics.js";
export { BroccoliJoyRideContractVerifier, JOYRIDE_FORBIDDEN_EXPORTS } from "./tooling/extensions/cache/broccolidb-joyride-contract.js";
export type { ContractValidationResult } from "./tooling/extensions/cache/broccolidb-joyride-contract.js";
export { BroccoliReactivePolicyObserver } from "./tooling/extensions/permissions/broccolidb-reactive-policy.js";
export type { ToolExecutionPayload, ReactiveObservationResult } from "./tooling/extensions/permissions/broccolidb-reactive-policy.js";
export { BroccoliUniversalGuard } from "./tooling/extensions/permissions/broccolidb-universal-guard.js";
export * as Tui from "./tui/tui-facade.js";
export type { ExecutionMode } from "./tooling/extensions/permissions/broccolidb-universal-guard.js";
export { BroccoliJoyRideDecisionLog } from "./tooling/extensions/cache/broccolidb-joyride-decision-log.js";
export type { DecisionType, JoyRideCacheDecision } from "./tooling/extensions/cache/broccolidb-joyride-decision-log.js";
export { BroccoliIntegrityProtocol } from "./tooling/extensions/permissions/broccolidb-integrity-protocol.js";
export type { TriadAuditCheck } from "./tooling/extensions/permissions/broccolidb-integrity-protocol.js";
export { BroccoliAutomatedModeController } from "./agents/extensions/execution/broccolidb-mode-controller.js";
export type { ModeState, ModeGateResult } from "./agents/extensions/execution/broccolidb-mode-controller.js";
export { BroccoliIntegrityOptimizer } from "./tooling/extensions/permissions/broccolidb-integrity-optimizer.js";
export type { OptimizationOpportunity } from "./tooling/extensions/permissions/broccolidb-integrity-optimizer.js";
export { BroccoliStabilityForensics } from "./tooling/extensions/permissions/broccolidb-stability-forensics.js";
export type { ForensicVerificationResult } from "./tooling/extensions/permissions/broccolidb-stability-forensics.js";
export { BroccoliSemanticAxiomEngine } from "./tooling/extensions/permissions/broccolidb-semantic-axiom.js";
export type { AxiomViolation } from "./tooling/extensions/permissions/broccolidb-semantic-axiom.js";
export { BroccoliSimulationEngine } from "./tooling/extensions/permissions/broccolidb-simulation-engine.js";
export type { SimulationResult } from "./tooling/extensions/permissions/broccolidb-simulation-engine.js";
export { BroccoliCommandSanitizer } from "./tooling/extensions/permissions/broccolidb-command-sanitizer.js";
export type { CommandValidationResult } from "./tooling/extensions/permissions/broccolidb-command-sanitizer.js";
export { BroccoliShellEnvironmentResolver } from "./tooling/extensions/permissions/broccolidb-shell-resolver.js";
export type { ShellProfile } from "./tooling/extensions/permissions/broccolidb-shell-resolver.js";
// Phase 60: Command Diagnostics & Output Buffer
export { BroccoliCommandDiagnostics } from "./tooling/extensions/permissions/broccolidb-command-diagnostics.js";
export type { CommandDiagnosticResult } from "./tooling/extensions/permissions/broccolidb-command-diagnostics.js";
export { BroccoliCommandOutputBuffer } from "./tooling/extensions/telemetry/broccolidb-output-buffer.js";
export type { BufferSummaryOptions } from "./tooling/extensions/telemetry/broccolidb-output-buffer.js";

export type { SymbolSearchResult } from "./tooling/extensions/perception/ast-eyes.js";
export { Eyes } from "./tooling/base/eyes.js";
export { AstPerceptionEyes } from "./tooling/extensions/perception/ast-eyes.js";
export { FrontmatterParser } from "./tooling/extensions/perception/frontmatter-parser.js";
export type { FrontmatterResult } from "./tooling/extensions/perception/frontmatter-parser.js";
export { BoundedFilePeeker } from "./tooling/extensions/perception/file-peeker.js";
export type { PeekFileResult } from "./tooling/extensions/perception/file-peeker.js";
export { CommandPathResolver } from "./tooling/extensions/permissions/command-path-resolver.js";
export { TerminalTextSanitizer } from "./tooling/extensions/telemetry/text-sanitizer.js";
export { MicrosecondTimingBuffer } from "./tooling/extensions/telemetry/timing-buffer.js";
export type { TimingMeasurement } from "./tooling/extensions/telemetry/timing-buffer.js";
export { TabSpacingNormalizer } from "./tooling/extensions/hashline/tab-spacing-normalizer.js";
export { ToolCallSchemaValidator } from "./tooling/extensions/registry/tool-call-schema-validator.js";
export type { ValidationResult } from "./tooling/extensions/registry/tool-call-schema-validator.js";
export { ArgumentCoercer } from "./tooling/extensions/registry/argument-coercer.js";
export { BatchEditAnchorer } from "./tooling/extensions/hashline/batch-edit-anchorer.js";
export type { BatchEditTask } from "./tooling/extensions/hashline/batch-edit-anchorer.js";
export { DiffSynthesizer } from "./tooling/extensions/hashline/diff-synthesizer.js";
export { MasterBenchmarkOrchestrator } from "./tooling/extensions/evals/master-benchmark-orchestrator.js";
export type { GrandBenchmarkResult } from "./tooling/extensions/evals/master-benchmark-orchestrator.js";
export { RuntimeSmokeSuite } from "./tooling/extensions/evals/runtime-smoke-suite.js";
export type { RuntimeSmokeCheckResult, RuntimeSmokeReport } from "./tooling/extensions/evals/runtime-smoke-suite.js";
export { LiveBaselineReporter } from "./tooling/extensions/evals/live-baseline-reporter.js";
export type { LiveBaselineInput, LiveBaselineWriteResult } from "./tooling/extensions/evals/live-baseline-reporter.js";
export { FlappyBirdProjectBenchmark } from "./tooling/extensions/evals/flappy-bird-project-benchmark.js";
export type { FlappyBirdBenchmarkCheck } from "./tooling/extensions/evals/flappy-bird-project-benchmark.js";
export {
  FLAPPY_BIRD_PROJECT_DIRECTORY,
  FlappyBirdProjectSynthesizer,
} from "./agents/extensions/execution/flappy-bird-project-synthesizer.js";
export type {
  SynthesizedFlappyBirdProject,
  SynthesizedProjectFile,
  WrittenFlappyBirdProject,
} from "./agents/extensions/execution/flappy-bird-project-synthesizer.js";
export { ArchitectureGuardrailGate } from "./tooling/extensions/policy/architecture-guardrail-gate.js";
export type { GuardrailAuditReport, GuardrailCheckResult } from "./tooling/extensions/policy/architecture-guardrail-gate.js";
export { McpHub } from "./tooling/extensions/mcp/mcp-hub.js";
export type { McpServerConfig, McpDiscoveredTool } from "./tooling/extensions/mcp/mcp-hub.js";
export { RipgrepSearchService } from "./tooling/extensions/perception/ripgrep-search-service.js";
export type { RipgrepMatch } from "./tooling/extensions/perception/ripgrep-search-service.js";
export { UrlContentFetcher } from "./tooling/extensions/perception/url-content-fetcher.js";
export { LanguageSyntaxParser } from "./tooling/extensions/perception/language-syntax-parser.js";
export type { SyntaxSymbol } from "./tooling/extensions/perception/language-syntax-parser.js";
export {
  RoadmapCompletionGate,
  AttemptCompletionGateStrategy,
} from "./tooling/extensions/policy/roadmap-completion-gate.js";
export type {
  GateCriteria,
  CompletionGateResult,
  AttemptGateEvaluationContext,
  DynamicGateCriteria,
  CriterionEvaluatorFn,
  AttemptGateStrategyConfig,
  AutonomousAttemptExecutionResult,
  GateCriterionSeverity,
  GateCriterionCategory,
  GatePhase,
  EvaluationAggregationPolicy,
  RemediationStrategyType,
  RemediationDirective,
  AttemptDiff,
  CircuitBreakerConfig,
  BackoffStrategy,
} from "./tooling/extensions/policy/roadmap-completion-gate.js";
export { RoadmapCheckpointDigest } from "./tooling/extensions/policy/roadmap-checkpoint-digest.js";
export type { CheckpointDigest } from "./tooling/extensions/policy/roadmap-checkpoint-digest.js";
export { NativeClipboardBridge } from "./tooling/extensions/perception/native-clipboard.js";
export { AnchoredHands, Hands } from "./tooling/extensions/hashline/hands.js";
export { CommandPermissionController } from "./tooling/extensions/permissions/command-permission-controller.js";
export type { PermissionValidationResult } from "./tooling/extensions/permissions/command-permission-controller.js";
export { ProcessLifecycleManager } from "./tooling/extensions/permissions/process-lifecycle-manager.js";
export type { ProcessHandle } from "./tooling/extensions/permissions/process-lifecycle-manager.js";
export { KeybindingsController } from "./tooling/extensions/permissions/keybindings-controller.js";
export type { KeybindingBinding } from "./tooling/extensions/permissions/keybindings-controller.js";
export { ProtocolEars, Ears } from "./tooling/extensions/telemetry/ears.js";
export { ProgressStreamingEars, TerminalProgressRenderer } from "./tooling/extensions/progress/progress-ears.js";
export { SkillsIngestor } from "./tooling/extensions/registry/skills-ingestor.js";
export { ValidatingToolRegistry, ToolRegistry } from "./tooling/extensions/registry/tool-registry.js";
export { ModuleDecomposer } from "./tooling/extensions/policy/module-decomposer.js";
export { MonolithGatewayServer } from "./tooling/extensions/gateway/monolith-gateway-server.js";
export { MonolithBenchmarkEvaluator } from "./tooling/extensions/evals/benchmark-evaluator.js";
export type {
  BenchmarkAssertionResult,
  BenchmarkCaseExecution,
  BenchmarkSuiteResult,
  BenchmarkTestCase,
  BenchmarkTestResult,
} from "./tooling/extensions/evals/benchmark-evaluator.js";
export { TelemetryTracer } from "./tooling/extensions/telemetry/telemetry-tracer.js";
export type { ActiveSpan } from "./tooling/extensions/telemetry/telemetry-tracer.js";
export { AgenticCommitGenerator } from "./tooling/extensions/policy/agentic-commit-generator.js";
export type { ConventionalCommitResult } from "./tooling/extensions/policy/agentic-commit-generator.js";
export { StreamEventFormatter } from "./tooling/extensions/telemetry/stream-event-formatter.js";
export type { StreamChunkEvent } from "./tooling/extensions/telemetry/stream-event-formatter.js";
export { TransportConnectionController } from "./tooling/extensions/gateway/transport-connection-controller.js";
export type { ConnectionHealth } from "./tooling/extensions/gateway/transport-connection-controller.js";
export { ResilientFetchClient } from "./tooling/extensions/telemetry/resilient-fetch-client.js";
export type { FetchResult } from "./tooling/extensions/telemetry/resilient-fetch-client.js";
export { StderrGuardFilter } from "./tooling/extensions/telemetry/stderr-guard.js";
export type { SuppressionStats } from "./tooling/extensions/telemetry/stderr-guard.js";
export { TTSRCoordinator } from "./tooling/extensions/telemetry/ttsr-coordinator.js";
export type { TTSRMeasurement } from "./tooling/extensions/telemetry/ttsr-coordinator.js";
export { CentennialPassMarker } from "./tooling/extensions/policy/centennial-pass-marker.js";
export type { CentennialMilestone } from "./tooling/extensions/policy/centennial-pass-marker.js";

export { MonolithFactory } from "./factories/monolith-factory.js";
export {
  CURRENT_EVOLUTION_BASELINE,
  CURRENT_REQUIRED_COMPONENTS,
  GrandMonolithSynthesizer,
} from "./factories/grand-monolith-synthesizer.js";
export type { CompositionVerification } from "./factories/grand-monolith-synthesizer.js";

/**
 * Deterministic Game Engine Monolith Composition Root.
 * Models agent interactions as frame ticks (`tick()`), state transitions as immutable snapshots (`GameStateSnapshot`),
 * and provides frame-perfect state rewind and replay.
 */
export class LumiMonolith implements IAgentEngine {
  /** Complete, future-compatible factory composition. Named fields below remain compatibility aliases. */
  readonly components: Readonly<ReturnType<typeof MonolithFactory.createEngine>>;
  readonly config: AgentConfig;
  readonly sessionContext: SessionContext;
  readonly sessionStore: PersistentSessionStore;
  readonly sessionCompactor: SessionCompactor;
  readonly sessionVfs: SessionVfs;
  readonly sessionMemoryStore: SessionMemoryStore;
  readonly stabilityDoctor: StabilityDoctor;
  readonly snapcompactEngine: SnapcompactEngine;
  readonly fileLockManager: FileLockManager;
  readonly snapshotLruCache: LruCache<string, GameStateSnapshot>;
  readonly gatewaySessionRegistry: GatewaySessionRegistry;
  readonly snapshotStorageIndex: SnapshotStorageIndex;
  readonly snowflakeIdGenerator: SnowflakeIdGenerator;
  readonly systemDirectoryResolver: SystemDirectoryResolver;
  readonly ringBuffer: FixedRingBuffer<string>;
  readonly semverComparator: SemanticVersionComparator;
  readonly gitIgnoreFilter: GitIgnoreFilter;
  readonly treeWalker: WorkspaceTreeWalker;
  readonly modelResolver: ModelResolver;
  readonly modelCatalog: ModelCatalog;
  readonly envKeyResolver: EnvironmentKeyResolver;
  readonly imageModelRegistry: ImageModelRegistry;
  readonly proxyGateway: LlmProxyGateway;
  readonly reasoningEffortController: ReasoningEffortController;
  readonly dynamicModelCache: DynamicModelCache;
  readonly loopPhaseController: LoopPhaseController;
  readonly budgetCalculator: ContextBudgetCalculator;
  readonly tokenTruncator: TokenTruncator;
  readonly templateEngine: PromptTemplateEngine;
  readonly variableInjector: DynamicVariableInjector;
  readonly connectionController: TransportConnectionController;
  readonly resilientFetchClient: ResilientFetchClient;
  readonly frontmatterParser: FrontmatterParser;
  readonly filePeeker: BoundedFilePeeker;
  readonly commandPathResolver: CommandPathResolver;
  readonly textSanitizer: TerminalTextSanitizer;
  readonly timingBuffer: MicrosecondTimingBuffer;
  readonly tabSpacingNormalizer: TabSpacingNormalizer;
  readonly schemaValidator: ToolCallSchemaValidator;
  readonly argumentCoercer: ArgumentCoercer;
  readonly batchAnchorer: BatchEditAnchorer;
  readonly diffSynthesizer: DiffSynthesizer;
  readonly masterBenchmarkOrchestrator: MasterBenchmarkOrchestrator;
  readonly mcpHub: McpHub;
  readonly ripgrepSearchService: RipgrepSearchService;
  readonly urlContentFetcher: UrlContentFetcher;
  readonly languageSyntaxParser: LanguageSyntaxParser;
  readonly completionGate: RoadmapCompletionGate;
  readonly checkpointDigest: RoadmapCheckpointDigest;
  readonly clipboardBridge: NativeClipboardBridge;
  readonly loopHarness: AgentLoopHarness;
  readonly postmortemDiagnostic: PostmortemDiagnostic;
  readonly processLifecycleManager: ProcessLifecycleManager;
  readonly providerAttribution: ProviderAttributionComposer;
  readonly stderrGuard: StderrGuardFilter;
  readonly keybindingsController: KeybindingsController;
  readonly httpDispatcher: HttpDispatcherOverlay;
  readonly authStorageVault: AuthStorageVault;
  readonly ttsrCoordinator: TTSRCoordinator;
  readonly centennialPassMarker: CentennialPassMarker;
  readonly systemHealthAggregator: SystemHealthAggregator;
  readonly codexOAuthManager: CodexOAuthManager;
  readonly codexProviderBridge: CodexProviderBridge;
  readonly setupWizard: SetupWizard;
  readonly slashRouter: AgentSlashRouter;
  readonly mentionResolver: MentionResolver;
  readonly swarmDispatcher: AgentSwarmDispatcher;
  readonly intelligenceEngine: WorkspaceIntelligenceEngine;
  readonly interactiveController: InteractiveModeController;
  readonly permissionController: CommandPermissionController;
  readonly commitGenerator: AgenticCommitGenerator;
  readonly gatewayServer: MonolithGatewayServer;
  readonly benchmarkEvaluator: MonolithBenchmarkEvaluator;
  readonly telemetryTracer: TelemetryTracer;
  readonly streamFormatter: StreamEventFormatter;
  readonly eyes: AstPerceptionEyes;
  readonly hands: AnchoredHands;
  readonly ears: ProgressStreamingEars;
  readonly skillsIngestor: SkillsIngestor;
  readonly toolRegistry: ValidatingToolRegistry;
  readonly promptComposer: PromptComposer;
  readonly agentEngine: AgentEngine;

  constructor(options: MonolithFactoryOptions = {}) {
    const components = MonolithFactory.createEngine(options);
    this.components = components;
    this.config = components.config;
    this.sessionContext = components.sessionContext;
    this.sessionStore = components.sessionStore;
    this.sessionCompactor = components.sessionCompactor;
    this.sessionVfs = components.sessionVfs;
    this.sessionMemoryStore = components.sessionMemoryStore;
    this.stabilityDoctor = components.stabilityDoctor;
    this.snapcompactEngine = components.snapcompactEngine;
    this.fileLockManager = components.fileLockManager;
    this.snapshotLruCache = components.snapshotLruCache;
    this.gatewaySessionRegistry = components.gatewaySessionRegistry;
    this.snapshotStorageIndex = components.snapshotStorageIndex;
    this.snowflakeIdGenerator = components.snowflakeIdGenerator;
    this.systemDirectoryResolver = components.systemDirectoryResolver;
    this.ringBuffer = components.ringBuffer;
    this.semverComparator = components.semverComparator;
    this.gitIgnoreFilter = components.gitIgnoreFilter;
    this.treeWalker = components.treeWalker;
    this.modelResolver = components.modelResolver;
    this.modelCatalog = components.modelCatalog;
    this.envKeyResolver = components.envKeyResolver;
    this.imageModelRegistry = components.imageModelRegistry;
    this.proxyGateway = components.proxyGateway;
    this.reasoningEffortController = components.reasoningEffortController;
    this.dynamicModelCache = components.dynamicModelCache;
    this.loopPhaseController = components.loopPhaseController;
    this.budgetCalculator = components.budgetCalculator;
    this.tokenTruncator = components.tokenTruncator;
    this.templateEngine = components.templateEngine;
    this.variableInjector = components.variableInjector;
    this.connectionController = components.connectionController;
    this.resilientFetchClient = components.resilientFetchClient;
    this.frontmatterParser = components.frontmatterParser;
    this.filePeeker = components.filePeeker;
    this.commandPathResolver = components.commandPathResolver;
    this.textSanitizer = components.textSanitizer;
    this.timingBuffer = components.timingBuffer;
    this.tabSpacingNormalizer = components.tabSpacingNormalizer;
    this.schemaValidator = components.schemaValidator;
    this.argumentCoercer = components.argumentCoercer;
    this.batchAnchorer = components.batchAnchorer;
    this.diffSynthesizer = components.diffSynthesizer;
    this.masterBenchmarkOrchestrator = components.masterBenchmarkOrchestrator;
    this.mcpHub = components.mcpHub;
    this.ripgrepSearchService = components.ripgrepSearchService;
    this.urlContentFetcher = components.urlContentFetcher;
    this.languageSyntaxParser = components.languageSyntaxParser;
    this.completionGate = components.completionGate;
    this.checkpointDigest = components.checkpointDigest;
    this.clipboardBridge = components.clipboardBridge;
    this.loopHarness = components.loopHarness;
    this.postmortemDiagnostic = components.postmortemDiagnostic;
    this.processLifecycleManager = components.processLifecycleManager;
    this.providerAttribution = components.providerAttribution;
    this.stderrGuard = components.stderrGuard;
    this.keybindingsController = components.keybindingsController;
    this.httpDispatcher = components.httpDispatcher;
    this.authStorageVault = components.authStorageVault;
    this.ttsrCoordinator = components.ttsrCoordinator;
    this.centennialPassMarker = components.centennialPassMarker;
    this.systemHealthAggregator = components.systemHealthAggregator;
    this.codexOAuthManager = components.codexOAuthManager;
    this.codexProviderBridge = components.codexProviderBridge;
    this.setupWizard = components.setupWizard;
    this.slashRouter = components.slashRouter;
    this.mentionResolver = components.mentionResolver;
    this.swarmDispatcher = components.swarmDispatcher;
    this.intelligenceEngine = components.intelligenceEngine;
    this.interactiveController = components.interactiveController;
    this.permissionController = components.permissionController;
    this.commitGenerator = components.commitGenerator;
    this.gatewayServer = components.gatewayServer;
    this.benchmarkEvaluator = components.benchmarkEvaluator;
    this.telemetryTracer = components.telemetryTracer;
    this.streamFormatter = components.streamFormatter;
    this.eyes = components.eyes;
    this.hands = components.hands;
    this.ears = components.ears;
    this.skillsIngestor = components.skillsIngestor;
    this.toolRegistry = components.toolRegistry;
    this.promptComposer = components.promptComposer;
    this.agentEngine = components.agentEngine;
  }

  /** Primary Game Engine Frame Step (Tick Loop) */
  async tick(input: EngineTickInput): Promise<EngineTickResult> {
    return this.telemetryTracer.startSpan(
      `tick-frame-${this.sessionContext.turnCount + 1}`,
      async (span) => {
        this.telemetryTracer.addEvent(span, "frame_start", { promptLength: input.prompt.length });
        this.loopPhaseController.setPhase("thinking");
        const startTime = Date.now();
        try {
          const res = await this.agentEngine.tick(input);
          this.timingBuffer.record("frame_tick", Date.now() - startTime);
          span.attributes["turn.outcome"] = res.outcome;
          if (res.outcome !== "completed") span.status = "error";
          this.telemetryTracer.addEvent(span, "frame_terminal", {
            outcome: res.outcome,
            responseLength: res.response.length,
          });
          return res;
        } finally {
          this.loopPhaseController.setPhase("idle");
        }
      }
    );
  }

  /** Backward-compatible turn runner */
  async runTurn(prompt: string): Promise<EngineTickResult> {
    return this.tick({ prompt });
  }

  /** Dynamically changes the active LLM model */
  setModel(modelName: string): void {
    (this.config as { modelName: string }).modelName = modelName;
    this.modelResolver.setActiveModel(modelName);
    this.setupWizard.setSavedModel(modelName);
  }

  /** Creates an immutable frame-perfect snapshot of active game engine state */
  createSnapshot(): GameStateSnapshot {
    const snapshot = this.sessionStore.createSnapshot(
      this.sessionContext.turnCount,
      this.sessionVfs,
      this.sessionMemoryStore,
      this.modelResolver
    );
    this.snapshotLruCache.set(snapshot.snapshotId, snapshot);
    this.snapshotStorageIndex.saveSnapshot(snapshot);
    return snapshot;
  }

  /** Frame-perfect state rewind to a target snapshot */
  rewindToSnapshot(snapshot: GameStateSnapshot): void {
    this.sessionStore.rewindToSnapshot(snapshot);
    this.sessionContext.turnCount = snapshot.frameIndex;
  }

  /** Forks game engine state into a new isolated engine instance */
  forkSession(newSessionId?: string): LumiMonolith {
    const snapshot = this.createSnapshot();
    const forkedMonolith = new LumiMonolith({
      cwd: this.sessionContext.cwd,
      sessionId: newSessionId ?? `${this.sessionContext.sessionId}-fork-${Date.now()}`,
      config: this.config,
    });
    forkedMonolith.rewindToSnapshot(snapshot);
    return forkedMonolith;
  }
}

// CLI entrypoint when run directly, including through an npm-link symlink.
const cliEntrypoint = process.argv[1];
let isDirectCliExecution = false;
if (cliEntrypoint) {
  try {
    isDirectCliExecution = realpathSync(cliEntrypoint) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    isDirectCliExecution = pathToFileURL(cliEntrypoint).href === import.meta.url;
  }
}

if (isDirectCliExecution) {
  const args = process.argv.slice(2);
  const isSmoke = args.includes("--smoke") || args.includes("-s");
  const isSetup = args.includes("--setup") || args.includes("setup");
  const isBenchmark = args.includes("--benchmark") || args.includes("-b");
  const isBaseline = args.includes("--baseline");
  const isHelp = args.includes("--help") || args.includes("-h");

  if (isHelp) {
    console.log(`
\x1b[1;36mLUMI Agent CLI\x1b[0m

Usage:
  lumi                    Start interactive REPL mode
  lumi --setup            Launch Interactive Setup Wizard (Model Providers & OAuth)
  lumi --benchmark (-b)   Run Automated Engine Benchmark & Throughput Test Suite
  lumi --baseline         Run smoke + benchmark + guardrails and regenerate live baseline reports
  lumi "your prompt"      Run a single prompt turn
  lumi --smoke (-s)       Run current capability-based runtime smoke suite
  lumi --help (-h)        Show this help message
`);
    process.exit(0);
  }

  const runSmokeTest = async (lumi: LumiMonolith): Promise<RuntimeSmokeReport> => {
    console.log("\x1b[1;36m========================================================\x1b[0m");
    console.log("\x1b[1;36m   LUMI Current Runtime Capability Smoke Suite          \x1b[0m");
    console.log("\x1b[1;36m========================================================\x1b[0m\n");

    const report = await new RuntimeSmokeSuite().run(lumi);
    console.log(`Evolution Baseline:       \x1b[36m${report.baseline.label}\x1b[0m`);
    console.log(`Composed Components:      \x1b[36m${report.composition.componentCount}\x1b[0m`);
    console.log(`Required Capabilities:    \x1b[36m${report.composition.requiredComponentCount}\x1b[0m\n`);

    for (const check of report.checks) {
      const status = check.passed ? "\x1b[32m[PASS]\x1b[0m" : "\x1b[31m[FAIL]\x1b[0m";
      console.log(`  ${status} ${check.name}`);
      console.log(`         ${check.detail} (${check.durationMs.toFixed(2)} ms)`);
    }

    console.log(`\nSmoke Result: ${report.passed ? "\x1b[1;32mPASSED" : "\x1b[1;31mFAILED"}\x1b[0m · ${report.passedCount}/${report.totalChecks} checks · ${report.durationMs.toFixed(2)} ms\n`);
    return report;
  };

  const runBenchmarkSuite = async (lumi: LumiMonolith): Promise<GrandBenchmarkResult> => {
    console.log("\x1b[1;36m========================================================\x1b[0m");
    console.log("\x1b[1;36m   LUMI Monolith Benchmark & Throughput Test Suite      \x1b[0m");
    console.log("\x1b[1;36m========================================================\x1b[0m\n");

    const rewindSnapshot = lumi.createSnapshot();
    const rewindMutation = await lumi.tick({ prompt: "remember: benchmark_rewind = mutated" });
    if (rewindMutation.outcome !== "completed") {
      throw new Error("Unable to prepare deterministic rewind benchmark");
    }

    const benchmarkResult = await lumi.masterBenchmarkOrchestrator.runGrandBenchmarkSuite(lumi, [
      { name: "Turn Tick Latency & Fact Storage", prompt: "remember: engine = deterministic", expectedKeywords: ["deterministic"] },
      { name: "VFS File Perception & Reading", prompt: "view: package.json", expectedKeywords: ["package.json"] },
      {
        name: "Complete Flappy Bird React + TypeScript + Vite Synthesis",
        expectedKeywords: ["Generated 12-file", "gameplay state-machine simulation"],
        execute: () => new FlappyBirdProjectBenchmark().execute(),
      },
      { name: "Slash Command Router Latency", prompt: "/stats", expectedKeywords: ["Telemetry"] },
      {
        name: "Snapshot State Rewind Latency",
        expectedKeywords: ["rewound"],
        execute: (current) => {
          current.rewindToSnapshot(rewindSnapshot);
          const restored = current.sessionContext.turnCount === rewindSnapshot.frameIndex
            && current.sessionStore.getMessages().length === rewindSnapshot.messages.length;
          return {
            outcome: restored ? "completed" : "failed",
            response: restored ? `Rewound to frame ${rewindSnapshot.frameIndex}` : "Snapshot rewind state mismatch",
            assertionPassed: restored,
          };
        },
      },
    ]);

    console.log(`\x1b[1;32mBenchmark Results:\x1b[0m`);
    console.log(`  Total Evaluated Tests:  \x1b[36m${benchmarkResult.suiteResult.totalTests}\x1b[0m`);
    console.log(`  Passed Tests:           \x1b[32m${benchmarkResult.suiteResult.passCount}\x1b[0m`);
    console.log(`  Failed Tests:           \x1b[31m${benchmarkResult.suiteResult.failCount}\x1b[0m`);
    console.log(`  Pass Rate:              \x1b[33m${benchmarkResult.suiteResult.passRate}%\x1b[0m`);
    console.log(`  Mean Case Latency:      \x1b[36m${benchmarkResult.suiteResult.meanLatencyMs} ms\x1b[0m`);
    console.log(`  Total Test Time:        \x1b[36m${benchmarkResult.totalDurationMs} ms\x1b[0m`);
    console.log(`  Workload Throughput:    \x1b[1;32m${benchmarkResult.throughputTps} cases/sec (${benchmarkResult.throughputPerMinute} cases/min)\x1b[0m\n`);

    console.log("\x1b[1;34mDetailed Test Case Metrics:\x1b[0m");
    for (const res of benchmarkResult.suiteResult.results) {
      const status = res.passed ? "\x1b[32m[PASS]\x1b[0m" : "\x1b[31m[FAIL]\x1b[0m";
      const assertionSummary = res.assertions.length > 0
        ? ` · Assertions: ${res.assertions.filter((assertion) => assertion.passed).length}/${res.assertions.length}`
        : "";
      console.log(`  ${status} ${res.testName.padEnd(62)} -> Latency: \x1b[33m${res.durationMs} ms\x1b[0m${assertionSummary}`);
      for (const assertion of res.assertions) {
        const assertionStatus = assertion.passed ? "\x1b[32m✓\x1b[0m" : "\x1b[31m✗\x1b[0m";
        console.log(`         ${assertionStatus} ${assertion.name}: ${assertion.detail}`);
      }
    }
    console.log();
    return benchmarkResult;
  };

  const updateLiveBaseline = async (lumi: LumiMonolith): Promise<boolean> => {
    const smoke = await runSmokeTest(lumi);
    const benchmark = await runBenchmarkSuite(lumi);
    const guardrails = await new ArchitectureGuardrailGate().runFullGuardrailAudit(lumi);
    const writeResult = new LiveBaselineReporter().write(process.cwd(), {
      repositoryVersion: process.env["npm_package_version"] ?? "0.1.0",
      configuredModel: lumi.modelResolver.getActiveModel(),
      smoke,
      benchmark,
      guardrails,
    });

    console.log("\x1b[1;34mLive baseline artifacts:\x1b[0m");
    for (const file of writeResult.files) console.log(`  - ${file}`);
    console.log(`  Generated: ${writeResult.generatedAt}`);
    console.log(`  Guardrails: ${guardrails.passedCount}/${guardrails.totalChecks}`);
    console.log(`  Status: ${writeResult.passed ? "\x1b[1;32mPASSED" : "\x1b[1;31mFAILED"}\x1b[0m\n`);
    return writeResult.passed;
  };

  const startRepl = async (lumi: LumiMonolith) => {
    await lumi.interactiveController.startInteractiveSession(lumi);
  };

  (async () => {
    const lumi = new LumiMonolith();

    if (isSetup) {
      await lumi.setupWizard.runInteractiveWizard();
    } else if (isBaseline) {
      const passed = await updateLiveBaseline(lumi);
      if (!passed) throw new Error("Live baseline verification failed");
    } else if (isBenchmark) {
      const benchmark = await runBenchmarkSuite(lumi);
      if (!benchmark.passed) throw new Error("Benchmark suite failed");
    } else if (isSmoke) {
      const smoke = await runSmokeTest(lumi);
      if (!smoke.passed) throw new Error("Runtime smoke suite failed");
    } else if (args.length > 0 && !args[0].startsWith("-")) {
      const prompt = args.join(" ");
      const result = await lumi.tick({ prompt });
      const color = result.outcome === "completed"
        ? "\x1b[1;32m"
        : result.outcome === "cancelled"
          ? "\x1b[1;33m"
          : "\x1b[1;31m";
      console.log(`${color}[${result.outcome.toUpperCase()} · LUMI Frame #${result.frameIndex}]\x1b[0m (${result.durationMs}ms)`);
      console.log(result.response);
    } else {
      await startRepl(lumi);
    }
  })().catch((err) => {
    console.error("LUMI CLI execution failed:", err);
    process.exitCode = 1;
  });
}
