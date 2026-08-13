# Changelog

All notable changes to the **LUMI-NEW** Deterministic Game Engine Agent Framework will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to Semantic Versioning and conventional commit standards.

---

## [Unreleased]

### Added (Token-Aware Multi-Turn Context Lifecycle)

- **Model-aware context admission**: Connected live provider requests to model-catalog window limits, output/safety reserves, proactive compaction thresholds, and a final turn-aware token guard.
- **Non-destructive rolling compaction**: Split the durable transcript from the active provider projection; added exact policy pinning, recent complete-turn retention, deterministic `LUMI-CONTEXT/1` checkpoints, SHA-256 transcript references, and non-recursive rebuilds.
- **Provider thread continuity**: Added versioned `LUMI-THREAD/1` rehydration after compaction, rewind, import, model/CWD changes, stateless provider calls, local turns, and failures while retaining the fast consecutive-turn path.
- **Deterministic turn ordering**: Serialized concurrent submissions per engine so session mutations and stateful provider calls cannot interleave.
- **Memory trust boundary**: Moved user-derived long-term memory out of the system prompt into a JSON-encoded `LUMI-MEMORY/1` assistant-scope envelope.
- **Context regression suite**: Added deterministic validation for budgets, compaction pressure, oversized input, tool-turn integrity, persistence, rewind, checkpoint recurrence, and stateful SDK handoffs ([ADR-083](.wiki/adr/ADR-083-token-aware-multi-turn-context-lifecycle.md)).
- **Linear compaction planning**: Added prefix-cost cutoff estimation with bounded refinement, avoiding quadratic checkpoint rebuilding on long histories.

### Added (Structured Agent Activity Streaming)

- **Typed progress lifecycle**: Extended `EngineTickInput` with local cancellation and structured `onProgress` events carrying stable activity identity, lifecycle status, safe detail, timestamps, elapsed time, ordering, and metadata.
- **Codex SDK activity adapter**: Added `CodexProgressAdapter` to preserve thread/turn/item lifecycle identity, deduplicate updates, expose readable reasoning summaries, plan counts, safe commands, file changes, MCP/web activity, response readiness, usage totals, and explicit terminal states.
- **Persistent terminal timeline**: Added `AgentActivityTimeline` and integrated it into fullscreen and fallback interactive sessions with elapsed time, bounded history, pinned turn summary, active animation, familiar terminal-state icons, and retained audit history.
- **Progress security boundary**: Added shared `sanitizeProgressText()` defense-in-depth redaction for authorization headers, provider keys, GitHub tokens, JWTs, URL credentials, secret query parameters, environment assignments, and CLI flags.
- **Architecture documentation**: Published the canonical [Agent Activity Streaming Strategy](.wiki/agent/streaming-activity-strategy.md) and [ADR-082](.wiki/adr/ADR-082-structured-agent-activity-streaming.md).

### Fixed (Model Dispatch and Interactive Execution)

- Routed Codex OAuth turns through the official `@openai/codex-sdk` streamed thread API rather than treating subscription OAuth as a direct API-key request.
- Made guided Codex setup launch the system browser on a best-effort basis while always exposing a clickable/copyable login URL, `O` retry, automatic localhost callback, and manual code/URL fallback.
- Reused valid existing Codex credentials without forcing another login and persisted the provider's selected default model.
- Replaced the indefinite generic `Thinking...` presentation with explicit connection, analysis, plan, tool, file, response, completion, failure, timeout, and cancellation states.
- Added `Esc/Ctrl+C` cancellation, ten-minute Codex turn timeout, endpoint timeout composition, duplicate-turn prevention, failed-thread reset, loop-phase cleanup, and orphan-process verification.
- Made missing credentials and provider errors visible instead of silently returning a misleading offline response.
- Limited the built-in Frogger shortcut to explicit Frogger requests so general game prompts reach the authenticated model.

### Added (Pass 6)
- **Zero-GC Substrate Memory Allocation (`broccolidb`)**: Added `ArenaAllocator` ([arena-allocator.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/sessions/extensions/substrate/arena-allocator.ts)) contiguous 16MB ArrayBuffer slab allocation inside `PersistentSessionStore` ([session-store.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/sessions/extensions/persistence/session-store.ts)) and published `ADR-009`.

### Added (Pass 7)
- **AST Symbol Perception (`codemarie`)**: Added `AstPerceptionEyes.searchSymbols()` ([ast-eyes.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/perception/ast-eyes.ts)) for fast structural code symbol searching (`class`, `function`, `interface`, `type`, `enum`, `const`) and published `ADR-010`.

### Added (Pass 8)
- **Terminal Progress Renderer (`tui` & `client`)**: Added `ProgressStreamingEars` and `TerminalProgressRenderer` ([progress-ears.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/progress/progress-ears.ts)) for streaming JSON-RPC `telemetry/progress` notifications and published `ADR-011`.

### Added (Pass 13)
- **Workspace Intelligence Engine (`codemarie`)**: Added `WorkspaceIntelligenceEngine` ([workspace-intelligence.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/agents/extensions/intelligence/workspace-intelligence.ts)) for package identity indexing, workspace topology analysis, and cognitive graph snapshot generation (`ADR-017`).

### Added (Passes 190–192 / Phase 60 Evolution)
- **Zero-Dependency Broccoli Command Diagnostics (`codemarie`)**: Added `BroccoliCommandDiagnostics` ([broccolidb-command-diagnostics.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/permissions/broccolidb-command-diagnostics.ts)) providing non-destructive command failure recovery advisor (`analyzeCommandFailure`), detecting port collisions (`EADDRINUSE`), Git lock contention (`.git/index.lock`), missing commands (exit 127/9009), and permission errors without third-party libraries (`ADR-081`).
- **Broccoli Command Output Buffer (`codemarie`)**: Added `BroccoliCommandOutputBuffer` ([broccolidb-output-buffer.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/telemetry/broccolidb-output-buffer.ts)) providing bounded terminal stream output chunking (`appendChunk`), head/tail summary line retention, and safe formatted truncation (`getFormattedSummary`) for oversized output (`ADR-081`).
- **Phase 60 Master Monolith Composition**: Integrated both into `TerminalTextSanitizer` ([text-sanitizer.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/telemetry/text-sanitizer.ts)) via unified `sanitizeAndBuffer()` pipeline, `MonolithFactory` ([monolith-factory.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/factories/monolith-factory.ts)), and `src/index.ts`.

### Added (Passes 187–189 / Phase 59 Evolution)
- **Zero-Dependency Broccoli Command Sanitizer (`codemarie`)**: Added `BroccoliCommandSanitizer` ([broccolidb-command-sanitizer.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/permissions/broccolidb-command-sanitizer.ts)) providing shell command boundary splitting (`splitCommand`), interactive process blocking (`validateCommand`), and execution safety scoring (`ADR-080`).
- **Broccoli Shell Environment Resolver (`codemarie`)**: Added `BroccoliShellEnvironmentResolver` ([broccolidb-shell-resolver.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/permissions/broccolidb-shell-resolver.ts)) providing platform shell detection (`detectDefaultShell`), system shell profile map generation (`getSystemShellProfiles`), and invocation argument composition (`ADR-080`).
- **Phase 59 Master Monolith Composition**: Integrated Command Sanitizer and Shell Resolver into `CommandPathResolver`, `MonolithFactory` ([monolith-factory.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/factories/monolith-factory.ts)), and `src/index.ts`.

### Added (Passes 184–186 / Phase 58 Evolution)
- **Zero-Dependency Broccoli Semantic Axiom Engine (`codemarie`)**: Added `BroccoliSemanticAxiomEngine` ([broccolidb-semantic-axiom.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/permissions/broccolidb-semantic-axiom.ts)) providing cognitive bloat limit checking (`validateAxioms`), SIMPLICITY axiom enforcement, and automated remediation plan generation (`ADR-079`).
- **Broccoli Simulation Engine (`codemarie`)**: Added `BroccoliSimulationEngine` ([broccolidb-simulation-engine.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/permissions/broccolidb-simulation-engine.ts)) providing pre-flight architectural impact simulation (`simulateMove`, `simulateWrite`), predicting score drop and downstream impacted dependents (`ADR-079`).
- **Phase 58 Master Monolith Composition**: Integrated Semantic Axiom Engine and Simulation Engine into `BroccoliAxiomVerifier`, `BroccoliPlanModeEnforcer`, `MonolithFactory` ([monolith-factory.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/factories/monolith-factory.ts)), and `src/index.ts`.

### Added (Passes 181–183 / Phase 57 Evolution)
- **Zero-Dependency Broccoli Integrity Optimizer (`codemarie`)**: Added `BroccoliIntegrityOptimizer` ([broccolidb-integrity-optimizer.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/permissions/broccolidb-integrity-optimizer.ts)) providing workspace structural migration optimization analysis (`findOptimizations`), layer drift sensing, and archetypal file protections (`ADR-078`).
- **Broccoli Stability Forensics (`codemarie`)**: Added `BroccoliStabilityForensics` ([broccolidb-stability-forensics.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/permissions/broccolidb-stability-forensics.ts)) providing architectural evidence verification (`verifyEvidenceVerification`), detecting phantom cited file paths vs conversationally grounded paths during Plan/Act mode shifts (`ADR-078`).
- **Phase 57 Master Monolith Composition**: Integrated Integrity Optimizer and Stability Forensics into `BroccoliWorkspaceArchitectureProfiler`, `BroccoliPlanModeEnforcer`, `MonolithFactory` ([monolith-factory.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/factories/monolith-factory.ts)), and `src/index.ts`.

### Added (Passes 178–180 / Phase 56 Evolution)
- **Zero-Dependency Broccoli Integrity Protocol (`codemarie`)**: Added `BroccoliIntegrityProtocol` ([broccolidb-integrity-protocol.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/permissions/broccolidb-integrity-protocol.ts)) providing Triad Audit template generation (`generateAuditTemplate`), section compliance checking (`evaluateAudit`), and semantic review headers (`ADR-077`).
- **Broccoli Automated Mode Controller (`codemarie`)**: Added `BroccoliAutomatedModeController` ([broccolidb-mode-controller.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/agents/extensions/execution/broccolidb-mode-controller.ts)) managing automated state-machine Plan/Act mode transitions (`transitionMode`, `canExecuteToolInMode`) and tool execution gating (`ADR-077`).
- **Phase 56 Master Monolith Composition**: Integrated Integrity Protocol and Automated Mode Controller into `BroccoliPlanModeEnforcer`, `BroccoliUniversalGuard`, `MonolithFactory` ([monolith-factory.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/factories/monolith-factory.ts)), and `src/index.ts`.

### Added (Passes 175–177 / Phase 55 Evolution)
- **Zero-Dependency Broccoli Universal Guard (`codemarie`)**: Added `BroccoliUniversalGuard` ([broccolidb-universal-guard.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/permissions/broccolidb-universal-guard.ts)) serving as unified singleton authority for architectural enforcement, system pressure management, and execution mode tracking (`setMode`) (`ADR-076`).
- **Broccoli JoyRide Decision Log (`codemarie`)**: Added `BroccoliJoyRideDecisionLog` ([broccolidb-joyride-decision-log.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/cache/broccolidb-joyride-decision-log.ts)) maintaining bounded in-process ring-buffer cache decision audit logs (`recordDecision`, `getDecisionLog`, `explainDecision`) (`ADR-076`).
- **Phase 55 Master Monolith Composition**: Integrated Universal Guard and JoyRide Decision Log into `BroccoliAxiomVerifier`, `JoyRideHotPathCache`, `MonolithFactory` ([monolith-factory.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/factories/monolith-factory.ts)), and `src/index.ts`.

### Added (Passes 172–174 / Phase 54 Evolution)
- **Zero-Dependency Broccoli JoyRide Contract Verifier (`codemarie`)**: Added `BroccoliJoyRideContractVerifier` ([broccolidb-joyride-contract.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/cache/broccolidb-joyride-contract.ts)) enforcing frozen JoyRide public API contracts (`JOYRIDE_FORBIDDEN_EXPORTS`, `validateExportSurface`), preventing internal symbol exposure (`ADR-075`).
- **Broccoli Reactive Policy Observer (`codemarie`)**: Added `BroccoliReactivePolicyObserver` ([broccolidb-reactive-policy.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/permissions/broccolidb-reactive-policy.ts)) providing real-time streaming tool execution observation (`observeToolExecution`) for proactive Joy-Zoning warnings prior to file mutation (`ADR-075`).
- **Phase 54 Master Monolith Composition**: Integrated JoyRide Contract Verifier and Reactive Policy Observer into `JoyRideHotPathCache`, `BroccoliAxiomVerifier`, `MonolithFactory` ([monolith-factory.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/factories/monolith-factory.ts)), and `src/index.ts`.

### Added (Passes 169–171 / Phase 53 Evolution)
- **Zero-Dependency Broccoli TSP Policy Plugin (`codemarie`)**: Added `BroccoliTspPolicyPlugin` ([broccolidb-tsp-policy.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/permissions/broccolidb-tsp-policy.ts)) providing configurable enforcement theme management (`strict`, `relaxed`, `safety`), exception rule registration (`addExceptionRule`), and real-time AST policy evaluation (`evaluatePolicy`) (`ADR-074`).
- **Broccoli JoyRide Diagnostics (`codemarie`)**: Added `BroccoliJoyRideDiagnostics` ([broccolidb-joyride-diagnostics.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/cache/broccolidb-joyride-diagnostics.ts)) tracking JoyRide hot-path cache hit/miss ratios, degraded performance triggers, and pressure trim events (`buildDiagnosticReport`) (`ADR-074`).
- **Phase 53 Master Monolith Composition**: Integrated TSP Policy Plugin and JoyRide Diagnostics into `BroccoliAxiomVerifier`, `JoyRideHotPathCache`, `MonolithFactory` ([monolith-factory.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/factories/monolith-factory.ts)), and `src/index.ts`.

### Added (Passes 166–168 / Phase 52 Evolution)
- **Zero-Dependency Broccoli Workspace Architecture Profiler (`codemarie`)**: Added `BroccoliWorkspaceArchitectureProfiler` ([broccolidb-architecture-profiler.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/permissions/broccolidb-architecture-profiler.ts)) providing workspace mode detection (`detectProfile`), canonical layer compliance scoring, and Joy-Zoning steering threshold checks (`ADR-073`).
- **Broccoli Joy-Zoning Module Decomposer (`codemarie`)**: Added `BroccoliJoyZoningModuleDecomposer` ([broccolidb-module-decomposer.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/permissions/broccolidb-module-decomposer.ts)) performing Joy-Zoning refactoring analysis (`analyzeDecomposition`), structural integrity scoring ($0-100$), logic island extraction, and step-by-step refactoring plan generation (`ADR-073`).
- **Phase 52 Master Monolith Composition**: Integrated Architecture Profiler and Module Decomposer into `BroccoliAxiomVerifier`, `BroccoliMutationPlanner`, `MonolithFactory` ([monolith-factory.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/factories/monolith-factory.ts)), and `src/index.ts`.

### Added (Passes 163–165 / Phase 51 Evolution)
- **Zero-Dependency Broccoli Joy-Zoning Engine (`codemarie`)**: Added `BroccoliJoyZoningEngine` ([broccolidb-joy-zoning.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/permissions/broccolidb-joy-zoning.ts)) providing architectural layer determination (`getLayer`), header tag parsing (`parseLayerTag`), comment style mapping (`CommentStyle`), and header tag injection (`injectOrUpdateLayerTag`) across 8+ languages (`ADR-072`).
- **Broccoli Joy-Zoning Guard (`codemarie`)**: Added `BroccoliJoyZoningGuard` ([broccolidb-joy-zoning-guard.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/permissions/broccolidb-joy-zoning-guard.ts)) enforcing single-direction layer boundary rules (`validateLayerBoundary`), preventing lower-tier layer leaks (`ADR-072`).
- **Phase 51 Master Monolith Composition**: Integrated Joy-Zoning Engine and Guard into `BroccoliAxiomVerifier`, `MonolithFactory` ([monolith-factory.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/factories/monolith-factory.ts)), and `src/index.ts`.

### Added (Passes 160–162 / Phase 50 Evolution)
- **Zero-Dependency Broccoli Axiom Verifier (`codemarie`)**: Added `BroccoliAxiomVerifier` ([broccolidb-axiom-verifier.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/permissions/broccolidb-axiom-verifier.ts)) performing architectural layer tag validation (`verifyLayerTag`), providing layer guidance (`getFileLayerContext`), and generating correction hints (`ADR-071`).
- **Broccoli Plan Mode Enforcer (`codemarie`)**: Added `BroccoliPlanModeEnforcer` ([broccolidb-plan-enforcer.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/agents/extensions/execution/broccolidb-plan-enforcer.ts)) enforcing strategic plan drafting workflows (`enforceStrategicReview`), scratchpad advisory checks, and Triad Audit verification (`ADR-071`).
- **Phase 50 Master Monolith Composition**: Integrated axiom verifier and plan mode enforcer into `BroccoliApprovalPolicyEngine`, `BroccoliMutationPlanner`, `MonolithFactory` ([monolith-factory.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/factories/monolith-factory.ts)), and `src/index.ts`.

### Added (Passes 157–159 / Phase 49 Evolution)
- **Zero-Dependency Broccoli Query Loop Orchestrator (`broccolidb`)**: Added `BroccoliQueryLoopOrchestrator` ([broccolidb-query-loop.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/agents/extensions/execution/broccolidb-query-loop.ts)) managing autonomous agent turn loop execution (`advanceTurn`, `recordToolRound`), tracking turn metrics, and checking compaction barriers at 80% context window limits (`ADR-070`).
- **Broccoli Structural Discovery Service (`broccolidb`)**: Added `BroccoliStructuralDiscoveryService` ([broccolidb-structural-discovery.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/perception/broccolidb-structural-discovery.ts)) performing structural dependency graph analysis (`getBlastRadius`, incremental inverse graph mapping, centrality score calculation) (`ADR-070`).
- **Phase 49 Master Monolith Composition**: Integrated query loop orchestrator and structural discovery service into `LoopPhaseController`, `BroccoliBlastRadiusCalculator`, `MonolithFactory` ([monolith-factory.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/factories/monolith-factory.ts)), and `src/index.ts`.

### Added (Passes 154–156 / Phase 48 Evolution)
- **Zero-Dependency Broccoli Side Query Service (`broccolidb`)**: Added `BroccoliSideQueryService` ([broccolidb-side-query.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/agents/extensions/execution/broccolidb-side-query.ts)) providing isolated out-of-band reasoning query evaluations (`executeIsolatedReasoning`), intent classification (`classifyIntent`), and policy pre-audits (`ADR-069`).
- **Broccoli Token Estimator (`broccolidb`)**: Added `BroccoliTokenEstimator` ([broccolidb-token-estimator.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/policy/broccolidb-token-estimator.ts)) managing adaptive character-ratio token estimation heuristics (`estimateTokens`, `roughTokenCountEstimation`), token budget overflow checking, and message token calculations (`ADR-069`).
- **Phase 48 Master Monolith Composition**: Integrated side query service and token estimator into `BroccoliMutationPlanner`, `TokenBucketRateGovernor`, `MonolithFactory` ([monolith-factory.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/factories/monolith-factory.ts)), and `src/index.ts`.

### Added (Passes 151–153 / Phase 47 Evolution)
- **Zero-Dependency Broccoli Retention Cleanup Service (`broccolidb`)**: Added `BroccoliRetentionCleanupService` ([broccolidb-retention-cleanup.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/sessions/extensions/integrity/broccolidb-retention-cleanup.ts)) providing automatic workspace garbage collection (`runBackgroundCleanup`, `purgeStaleLocks`, `cleanupTempFiles`), lock file pruning, and unref'd timer loops (`ADR-068`).
- **Broccoli Task Coordinator (`broccolidb`)**: Added `BroccoliTaskCoordinator` ([broccolidb-task-coordinator.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/agents/extensions/swarm/broccolidb-task-coordinator.ts)) managing subagent multi-worker task orchestration (`dispatchTask`, `monitorHeartbeats`, `recordHeartbeat`), worker heartbeat monitoring, and stale worker eviction (`ADR-068`).
- **Phase 47 Master Monolith Composition**: Integrated retention cleanup service and task coordinator into `StabilityDoctor`, `AgentSwarmDispatcher`, `MonolithFactory` ([monolith-factory.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/factories/monolith-factory.ts)), and `src/index.ts`.

### Added (Passes 148–150 / Phase 46 Evolution)
- **Zero-Dependency Broccoli CAS Scratchpad Service (`broccolidb`)**: Added `BroccoliCASScratchpadService` ([broccolidb-cas-scratchpad.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/sessions/extensions/persistence/broccolidb-cas-scratchpad.ts)) providing CAS-deduplicated task scratchpad storage (`.broccolidb/scratchpad`), atomic lock acquisition (`acquireLock`), and section updating (`ADR-067`).
- **Broccoli Context Diagnosis Service (`broccolidb`)**: Added `BroccoliContextDiagnosisService` ([broccolidb-context-diagnosis.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/sessions/extensions/integrity/broccolidb-context-diagnosis.ts)) performing epistemic context health audits (`diagnoseContext`), scoring graph health ($0-100$), and tracking stale/unverified/contradictory node counts (`ADR-067`).
- **Phase 46 Master Monolith Composition**: Integrated CAS scratchpad service and context diagnosis service into `BroccoliTaskStateEngine`, `PostmortemDiagnostic`, `MonolithFactory` ([monolith-factory.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/factories/monolith-factory.ts)), and `src/index.ts`.

### Added (Passes 145–147 / Phase 45 Evolution)
- **Zero-Dependency Broccoli Execution Trace Recorder (`broccolidb`)**: Added `BroccoliExecutionTraceRecorder` ([broccolidb-execution-trace.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/telemetry/broccolidb-execution-trace.ts)) managing execution event stream recording (`emit`, `getEvents`, `clear`), ring-buffer auto-shift (`maxEvents`), and session correlation filtering (`ADR-066`).
- **Broccoli Intent Tracer (`broccolidb`)**: Added `BroccoliIntentTracer` ([broccolidb-intent-tracer.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/agents/extensions/intelligence/broccolidb-intent-tracer.ts)) tracking high-level capability intents (`startIntent`, `endIntent`, `failIntent`), measuring latency statistics, capability counts, and active intent maps (`ADR-066`).
- **Phase 45 Master Monolith Composition**: Integrated execution trace recorder and intent tracer into `TelemetryTracer`, `WorkspaceIntelligenceEngine`, `MonolithFactory` ([monolith-factory.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/factories/monolith-factory.ts)), and `src/index.ts`.

### Added (Passes 142–144 / Phase 44 Evolution)
- **Zero-Dependency Broccoli Approval Policy Engine (`broccolidb`)**: Added `BroccoliApprovalPolicyEngine` ([broccolidb-approval-policy.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/permissions/broccolidb-approval-policy.ts)) evaluating mutation plans against risk levels (`low`, `medium`, `high`) and approval policies (`readonly`, `production_locked`, `human_approval_required`, `ci_gate_only`, `autonomous_safe`) (`ADR-065`).
- **Broccoli Mutation Planner (`broccolidb`)**: Added `BroccoliMutationPlanner` ([broccolidb-mutation-planner.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/agents/extensions/execution/broccolidb-mutation-planner.ts)) constructing mutation step sequences (`planFromAudit`), calculating aggregate plan risk (`maxRisk`), and assigning required verification gates (`ADR-065`).
- **Phase 44 Master Monolith Composition**: Integrated approval policy engine and mutation planner into `LumiIgnorePolicyController`, `BroccoliRepairMutationExecutor`, `MonolithFactory` ([monolith-factory.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/factories/monolith-factory.ts)), and `src/index.ts`.

### Added (Passes 139–141 / Phase 43 Evolution)
- **Zero-Dependency Broccoli Rollback Coordinator (`broccolidb`)**: Added `BroccoliRollbackCoordinator` ([broccolidb-rollback-coordinator.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/sessions/extensions/substrate/broccolidb-rollback-coordinator.ts)) capturing pre-mutation file snapshots (`snapshotBefore`) and executing atomic multi-file restorations (`restore`) upon edit failures (`ADR-064`).
- **Broccoli Inter-Agent Mailbox (`broccolidb`)**: Added `BroccoliInterAgentMailbox` ([broccolidb-inter-agent-mailbox.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/agents/extensions/swarm/broccolidb-inter-agent-mailbox.ts)) providing decentralized inter-subagent message queues (`postMessage`), inbox polling (`pollInbox`), and status notifications (`ADR-064`).
- **Phase 43 Master Monolith Composition**: Integrated rollback coordinator and inter-agent mailbox into `NativeMutationTransactionSubstrate`, `AgentSwarmDispatcher`, `MonolithFactory` ([monolith-factory.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/factories/monolith-factory.ts)), and `src/index.ts`.

### Added (Passes 133–135 / Phase 41 Evolution)
- **Zero-Dependency Broccoli Cognitive Suggestion Engine (`broccolidb`)**: Added `BroccoliCognitiveSuggestionEngine` ([broccolidb-cognitive-suggestion.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/agents/extensions/intelligence/broccolidb-cognitive-suggestion.ts)) generating context-aware edit suggestions based on active file paths, workspace diagnostics, git status, and MD5 content hashes (`ADR-062`).
- **Broccoli Fencing Mutex Engine (`broccolidb`)**: Added `BroccoliFencingMutexEngine` ([broccolidb-fencing-mutex.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/sessions/extensions/substrate/broccolidb-fencing-mutex.ts)) managing fault-tolerant distributed locking using Sovereign Fencing Tokens, automatic lock annexation, and heartbeat timers (`ADR-062`).
- **Phase 41 Master Monolith Composition**: Integrated cognitive suggestion engine and fencing mutex engine into `PromptComposer`, `LockAuthorityEngine`, `MonolithFactory` ([monolith-factory.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/factories/monolith-factory.ts)), and `src/index.ts`.

### Added (Passes 130–132 / Phase 40 Evolution)
- **Zero-Dependency Broccoli LSP Protocol Bridge (`broccolidb`)**: Added `BroccoliLspProtocolBridge` ([broccolidb-lsp-bridge.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/perception/broccolidb-lsp-bridge.ts)) formatting stdio JSON-RPC LSP protocol payloads (`initialize`, `textDocument/definition`, `textDocument/hover`), language server executable maps, and diagnostic map indexing (`ADR-061`).
- **Broccoli Blast Radius Calculator (`broccolidb`)**: Added `BroccoliBlastRadiusCalculator` ([broccolidb-blast-radius.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/agents/extensions/intelligence/broccolidb-blast-radius.ts)) calculating file edit blast radius, inverse dependency graph traversal, centrality scores, and critical dependent lists (`ADR-061`).
- **Phase 40 Master Monolith Composition**: Integrated LSP protocol bridge and blast radius calculator into `AstPerceptionEyes`, `WorkspaceIntelligenceEngine`, `MonolithFactory` ([monolith-factory.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/factories/monolith-factory.ts)), and `src/index.ts`.

### Added (Passes 127–129 / Phase 39 Evolution)
- **Zero-Dependency Broccoli Streaming Tool Executor (`broccolidb`)**: Added `BroccoliStreamingToolExecutor` ([broccolidb-streaming-tool-executor.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/registry/broccolidb-streaming-tool-executor.ts)) managing tool execution phase transitions (`queued` $\rightarrow$ `validating` $\rightarrow$ `running` $\rightarrow$ `completed`/`failed`/`timeout`), native timeout cancellation via `AbortController`, and progress callbacks (`ADR-060`).
- **Broccoli Task State Engine (`broccolidb`)**: Added `BroccoliTaskStateEngine` ([broccolidb-task-state.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/sessions/extensions/persistence/broccolidb-task-state.ts)) managing Sovereign Scratchpads (`SOFT_STATE.md`), task sidechain outputs (`tasks/${taskId}.output`), and atomic disk writes (`ADR-060`).
- **Phase 39 Master Monolith Composition**: Integrated streaming tool executor and task state engine into `ValidatingToolRegistry`, `PersistentSessionStore`, `MonolithFactory` ([monolith-factory.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/factories/monolith-factory.ts)), and `src/index.ts`.

### Added (Passes 121–123 / Phase 37 Evolution)
- **Zero-Dependency Broccoli CAS & Brotli Compactor (`broccolidb`)**: Added `BroccoliCasCompactor` ([broccolidb-cas-compactor.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/sessions/extensions/compaction/broccolidb-cas-compactor.ts)) for SHA-256 content-addressable blob storage, Brotli compression/decompression (`node:zlib`), and context projection DAGs (`ADR-058`).
- **Broccoli Spider Forensic Audit Engine (`broccolidb`)**: Added `BroccoliSpiderAuditEngine` ([broccolidb-spider-audit.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/agents/extensions/intelligence/broccolidb-spider-audit.ts)) for 2-phase structural audits, unresolved import scanning, ghost symbol detection, and VFS physical reality verification (`ADR-058`).
- **Phase 37 Master Monolith Composition**: Integrated CAS compactor and Spider audit engine into `SessionCompactor`, `WorkspaceIntelligenceEngine`, `MonolithFactory` ([monolith-factory.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/factories/monolith-factory.ts)), and `src/index.ts`.

### Added (Passes 118–120 / Phase 36 Evolution)
- **Zero-Dependency Broccoli Substrate Store (`broccolidb`)**: Added `BroccoliSubstrateStore` ([broccoli-substrate-store.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/sessions/extensions/substrate/broccoli-substrate-store.ts)) replacing external database libraries (`better-sqlite3`, `kysely`) with pure TypeScript in-memory indexing, entity table mapping, JSON snapshot persistence, and atomic transaction rollback checkpoints (`ADR-057`).
- **Broccoli Task DAG Scheduler & Circuit Breaker (`broccolidb`)**: Added `BroccoliTaskDagScheduler` ([broccoli-task-dag-scheduler.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/agents/extensions/swarm/broccoli-task-dag-scheduler.ts)) for dependency task DAG execution (`dependsOnTaskIds`), and `BroccoliCircuitBreaker` & `TokenBucketRateGovernor` ([broccoli-circuit-breaker.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/policy/broccoli-circuit-breaker.ts)) for auto-tripping tool failure loops (`ADR-057`).
- **Phase 36 Master Monolith Composition**: Integrated zero-dependency BroccoliDB components into `MonolithFactory` ([monolith-factory.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/factories/monolith-factory.ts)), `ValidatingToolRegistry`, `AgentSwarmDispatcher`, and `src/index.ts`.

### Added (Passes 115–117 / Phase 35 Evolution)
- **Write Coalescing Substrate (`packages/codemarie`)**: Added `WriteCoalescerSubstrate` ([write-coalescer.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/sessions/extensions/substrate/write-coalescer.ts)) with bitwise FNV-1a fast hashing (`calculateFastHash`), debounced write-behind buffers, hash deduplication, and direct integration into `PersistentSessionStore.coalesceSaveToFile()` (`ADR-056`).
- **Multi-Agent Convergence Engine Substrate (`packages/codemarie`)**: Added `ConvergenceEngineSubstrate` ([convergence-engine.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/agents/extensions/swarm/convergence-engine.ts)) for multi-role priority lattice consensus (`PRIORITY_LATTICE`), BFT phase filtering, conflict detection, and direct integration into `AgentSwarmDispatcher.convergeSwarmOutputs()` (`ADR-056`).
- **Phase 35 Master Monolith Composition**: Integrated write coalescer and convergence engine directly into `MonolithFactory` ([monolith-factory.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/factories/monolith-factory.ts)) and `src/index.ts`.

### Added (Passes 112–114 / Phase 34 Evolution)
- **Lumi Ignore Policy Controller (`packages/codemarie`)**: Added `LumiIgnorePolicyController` ([lumi-ignore-controller.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/permissions/lumi-ignore-controller.ts)) for enforcing `.lumiignore` / `.gitignore` pattern evaluation, policy generation counters, and 4096-entry access decision caching (`ADR-055`).
- **Native Mutation Transaction Substrate (`packages/codemarie`)**: Added `NativeMutationTransactionSubstrate` ([native-mutation-substrate.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/sessions/extensions/substrate/native-mutation-substrate.ts)) for workspace symlink boundary safety (`isPathInWorkspace`), normalized SHA-256 content hashing (`getNormalizedHash`), atomic staging writes, and transaction rollback buffers (`ADR-055`).
- **Phase 34 Master Monolith Composition**: Integrated ignore controller and mutation substrate directly into `MonolithFactory` ([monolith-factory.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/factories/monolith-factory.ts)) and `src/index.ts`.

### Added (Passes 109–111 / Phase 33 Evolution)
- **Context Staleness Tracker & Cognitive Freshness Guard (`packages/codemarie`)**: Added `ContextStalenessTracker` & `CognitiveFreshnessGuard` ([context-staleness-tracker.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/sessions/extensions/memory/context-staleness-tracker.ts)) for tracking read signatures, mtime stat modification checks, and prompt freshness validation (`ADR-054`).
- **Cognitive Knowledge Graph Substrate (`packages/codemarie`)**: Added `KnowledgeGraphSubstrate` ([knowledge-graph-substrate.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/agents/extensions/intelligence/knowledge-graph-substrate.ts)) for structured knowledge node storage, directional edge relations, BFS graph traversal, tag searching, and hub-score centrality calculation (`ADR-054`).
- **Phase 33 Master Monolith Composition**: Integrated staleness tracker and knowledge graph directly into `MonolithFactory` ([monolith-factory.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/factories/monolith-factory.ts)) and `src/index.ts`.

### Added (Passes 106–108 / Phase 32 Evolution)
- **JoyRide Bounded Hot-Path Execution Cache (`packages/codemarie`)**: Added `JoyRideHotPathCache` & `HotPathCommandClassifier` ([joyride-cache.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/cache/joyride-cache.ts)) for zero-GC memory-budgeted LRU execution caching, command safety tiering, and secret regex pattern sanitization (`ADR-053`).
- **Lock Authority & Broccoli Fencing Substrate (`packages/codemarie`)**: Added `LockAuthorityEngine` & `BroccoliFencingSubstrate` ([lock-authority.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/sessions/extensions/substrate/lock-authority.ts)) for fine-grained resource lock claims, fencing token epoch preservation, and stale lock eviction (`ADR-053`).
- **Phase 32 Master Monolith Composition**: Integrated hot-path cache and lock authority directly into `MonolithFactory` ([monolith-factory.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/factories/monolith-factory.ts)) and `src/index.ts`.

### Added (Passes 103–105 / Phase 31 Evolution)
- **OpenAI Codex OAuth Manager (`packages/codemarie`)**: Added `CodexOAuthManager` ([codex-oauth-manager.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/agents/extensions/resolution/codex-oauth-manager.ts)) for PKCE authorization URL generation, token exchange, automatic token refresh, and `ChatGPT-Account-Id` claims extraction (`ADR-048`).
- **Codex Provider Bridge (`packages/codemarie`)**: Added `CodexProviderBridge` ([codex-provider-bridge.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/agents/extensions/resolution/codex-provider-bridge.ts)) for identifying Codex model provider families and injecting Bearer OAuth access tokens & `ChatGPT-Account-Id` headers alongside standard API key providers (`ADR-048`).
- **Interactive Model Provider & OAuth Setup Wizard (`lumi --setup`)**: Added `SetupWizard` ([setup-wizard.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/agents/extensions/setup/setup-wizard.ts)) for interactive provider status audits, API key entry (Anthropic, OpenAI, Gemini, DeepSeek), local HTTP OAuth callback redirect listening (`http://localhost:1455/auth/callback`), custom proxy endpoint setup, and connection verification diagnostics.
- **Automated Engine Benchmark & Throughput Evaluation Harness (`lumi --benchmark`)**: Integrated `MasterBenchmarkOrchestrator` & `MonolithBenchmarkEvaluator` CLI suite, achieving **$0.24\text{ ms}$ mean turn tick latency** and **$3,759.4\text{ turns/sec}$ ($225.5k\text{ turns/min}$)** throughput.
- **Comprehensive Benchmark Field Note Document**: Published field note document ([BENCHMARK-PERFORMANCE-FIELD-NOTE.md](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/field-notes/BENCHMARK-PERFORMANCE-FIELD-NOTE.md)) detailing empirical throughput equations, latency metrics, and reproducibility guides.
- **Interactive CLI REPL & Single-Turn Prompt CLI Router (`lumi`)**: Added interactive terminal REPL loop, prompt argument execution (`lumi "prompt"`), `/setup` command, and `/stats` router.
- **Monolith Phase 31 Master Subsystem Synthesis**: Completed 105-pass master synthesis verification suite confirming total OpenAI Codex OAuth & provider bridge feature absorption with zero-barrel OOP class extension (`ADR-048`).

### Added (ADR-012 Architecture)
- **Non-Destructive Extension & Mutation Directory Architecture**: Organized extension classes into domain-scoped mutation subdirectories (`compaction/`, `resolution/`, `execution/`, `substrate/`, `persistence/`, `memory/`, `vfs/`, `perception/`, `progress/`, `telemetry/`, `hashline/`, `registry/`, `mentions/`) and removed legacy flat barrel files (`ADR-012`).

---

## [0.1.0] - 2026-08-09

### Added
- **AKD-DSO Paradigm & Formal Whitepaper**: Published formal academic specification paper ([AKD-DSO-ACADEMIC-WHITEPAPER.md](.wiki/whitepaper/AKD-DSO-ACADEMIC-WHITEPAPER.md)) detailing Architectural Knowledge Distillation ($\mathcal{L}_{\text{AKD}}$) and Deterministic Substrate Optimization ($\mathbf{Step}_t$).
- **Deterministic Game Engine Execution Loop**: Implemented `tick(input: EngineTickInput)` in `AbstractAgentEngine` ([abstract-agent-engine.ts](src/core/abstracts/abstract-agent-engine.ts#L12)) and `AgentEngine` ([agent-engine.ts](src/agents/extensions/execution/agent-engine.ts)).
- **Immutable State Snapshotting & Frame Rewind**: Implemented `createSnapshot()` and `rewindToSnapshot()` in `PersistentSessionStore` ([session-store.ts](src/sessions/extensions/persistence/session-store.ts)) with $O(1)$ zero-drift state time travel.
- **Dependency Inversion Core Contracts & Abstracts**: Added `src/core/contracts/` (`agent`, `session`, `tooling`) and `src/core/abstracts/` (`AbstractAgentEngine`, `AbstractSessionStore`, `AbstractHands`, `AbstractEars`, `AbstractToolRegistry`).
- **Container Factory Composition**: Added `MonolithFactory` ([monolith-factory.ts](src/factories/monolith-factory.ts#L18)) for clean engine bootstrapping and session forking.
- **Line-Anchored Hash Editing (`hashline`)**: Added `AnchoredHands.applyAnchoredEdit()` ([hands.ts](src/tooling/extensions/hashline/hands.ts)) with native bitwise hash calculation (`computeLineHash`).
- **Type-Safe Tool Schema Validation (`omptype`)**: Added `ValidatingToolRegistry.validateToolArgs()` ([tool-registry.ts](src/tooling/extensions/registry/tool-registry.ts)) to enforce argument parameter types prior to tool execution.
- **JSON-RPC 2.0 Telemetry Stream (`protocol`)**: Added `ProtocolEars.formatJsonRpcEvent()` ([ears.ts](src/tooling/extensions/telemetry/ears.ts)) for streaming performance telemetry notifications.
- **File System Session Persistence (`session-backends`)**: Added `PersistentSessionStore.saveToFile()` and `.loadFromFile()` ([session-store.ts](src/sessions/extensions/persistence/session-store.ts)).
- **Long-Term Memory Fact & KI Store**: Added `SessionMemoryStore` ([session-memory-store.ts](src/sessions/extensions/memory/session-memory-store.ts)) and tools `search_memory` & `save_memory`.
- **In-Memory Virtual File System Overlay**: Added `SessionVfs` ([session-vfs.ts](src/sessions/extensions/vfs/session-vfs.ts)) for staging file diff overlays prior to disk commit.
- **Interactive Slash Command Router**: Added `AgentSlashRouter` ([agent-slash-router.ts](src/agents/extensions/resolution/agent-slash-router.ts)) supporting sub-millisecond `/stats`, `/vfs`, `/memory`, `/skills`, `/models`, `/compact`, and `/clear` commands.

### Changed
- **Directory Hierarchy Restructuring**: Re-organized 3-tier monolith into `base/` (foundational domain types) and `extensions/` (subclass mutations) subdirectories across `src/agents/`, `src/sessions/`, and `src/tooling/`.
- **Organic Tier Expansion**: Relaxed fixed 5-class cap restriction to allow organic subsystem class growth modeling the Game Engine strategy.

### Removed
- Removed flat file structures in `src/agents/`, `src/sessions/`, and `src/tooling/` in favor of structured `base/` and `extensions/` directories.
