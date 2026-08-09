# Auto-Rolling & Self-Documenting Evolution Roadmap

This document serves as the **Auto-Rolling Evolution Roadmap** for `/Users/bozoegg/Desktop/LUMI-NEW`. It automatically tracks completed evolutionary passes, defines the active next pass, and provides self-documenting instructions for AI agents extending the engine.

---

## 1. Auto-Rolling Evolution Pipeline

```
  [DONE] Passes 1–5 (Core Monolith Architecture)
  [DONE] Passes 6–14 (Phase 1 Subsystem Extensions)
  [DONE] Passes 15–18 (Phase 2 Extended Packages)
  [DONE] Passes 19–21 (Phase 3 Monolith Orchestration)
  [DONE] Passes 22–24 (Phase 4 Agentic Commit & Modes)
  [DONE] Passes 25–27 (Phase 5 Provider Keys & Image Models)
  [DONE] Passes 28–30 (Phase 6 Proxy Gateway & Stream Formatter)
  [DONE] Passes 31–33 (Phase 7 Reasoning Effort & Dynamic Model Cache)
  [DONE] Passes 34–36 (Phase 8 Transport Connection & Remote Session Handle)
  [DONE] Passes 37–39 (Phase 9 Gateway Session Registry & Snapshot Storage Index)
  [DONE] Passes 40–42 (Phase 10 Resilient Fetch Client & Snowflake ID Generator)
  [DONE] Passes 43–45 (Phase 11 Frontmatter Parser & Bounded File Peeker)
  [DONE] Passes 46–48 (Phase 12 System Directory Resolver & Command Path Resolver)
  [DONE] Passes 49–51 (Phase 13 Terminal Text Sanitizer & Loop Phase Controller)
  [DONE] Passes 52–54 (Phase 14 Fixed Ring Buffer & Microsecond Timing Buffer)
  [DONE] Passes 55–57 (Phase 15 Tab Spacing Normalizer & Semantic Version Comparator)
  [DONE] Passes 58–60 (Phase 16 Context Budget Calculator & Token Truncator)
  [DONE] Passes 61–63 (Phase 17 Tool Call Schema Validator & Argument Coercer)
  [DONE] Passes 64–66 (Phase 18 Multi-File Batch Edit Anchorer & Diff Synthesizer)
  [DONE] Passes 67–69 (Phase 19 Workspace Git Ignore Filter & Tree Walker)
  [DONE] Passes 70–72 (Phase 20 System Prompt Template Engine & Dynamic Variable Injector)
  [DONE] Passes 73–75 (Phase 21 Master Benchmark Orchestrator & Grand Synthesis)
```

| Pass Stage | Status | Target Package in Teacher (`pi-main`) | Student Implementation (`LUMI-NEW`) | Governance & Code Links |
|---|---|---|---|---|
| **Pass 1** | `[COMPLETE]` | `compaction/`, `skills.ts` | `SessionCompactor`, `SkillsIngestor`, `PromptComposer` | [ADR-002](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-002-osmosis-evolution-compaction-skills-composition.md) |
| **Pass 2** | `[COMPLETE]` | `model-resolver.ts` | `ModelResolver`, `SessionStore.fork()`, Stream Guardrails | [ADR-003](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-003-osmosis-evolution-model-resolution-session-forking-guardrails.md) |
| **Pass 3** | `[COMPLETE]` | `vfs-router.ts`, `slash-commands.ts` | `SessionVfs`, `AgentSlashRouter`, `ProtocolEars` | [ADR-004](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-004-osmosis-evolution-vfs-slash-routing-telemetry.md) |
| **Pass 4** | `[COMPLETE]` | `memory/`, KIs | `SessionMemoryStore`, memory tools | [ADR-005](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-005-osmosis-evolution-memory-store-tool-chaining-knowledge-persistence.md) |
| **Pass 5** | `[COMPLETE]` | `hashline`, `omptype` | `applyAnchoredEdit()`, `validateToolArgs()` | [ADR-006](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-006-osmosis-evolution-monorepo-package-absorption.md) |
| **AKD-DSO** | `[COMPLETE]` | Monolithic Subsystem Refactor | `AbstractAgentEngine`, `tick()`, `createSnapshot()` | [ADR-008](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-008-deterministic-game-engine-architecture.md) |
| **Pass 6** | `[COMPLETE]` | `broccolidb` | Slab pre-allocation array caching in `ArenaAllocator` | [ADR-009](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-009-zero-gc-substrate-memory-allocation.md) |
| **Pass 7** | `[COMPLETE]` | `codemarie` | AST structural symbol perception in `AstPerceptionEyes` | [ADR-010](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-010-ast-symbol-perception.md) |
| **Pass 8** | `[COMPLETE]` | `tui` & `client` | Terminal progress renderer in `ProgressStreamingEars` | [ADR-011](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-011-terminal-progress-renderer.md) |
| **Passes 9–14** | `[COMPLETE]` | `codemarie` | Mentions, Swarm, Integrity, Intelligence & Guardrails | [ADR-013](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-013-workspace-mention-resolution.md)–[ADR-018](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-018-command-permission-security-guardrails.md) |
| **Passes 15–18** | `[COMPLETE]` | Phase 2 Extensions | Snapcompact, Catalog, Gateway Server & Benchmark Suite | [ADR-019](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-019-phase-2-extended-package-osmosis.md) |
| **Passes 19–21** | `[COMPLETE]` | Phase 3 Telemetry | TelemetryTracer, FileLockManager & Master Orchestration | [ADR-020](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-020-phase-3-master-subsystem-orchestration.md) |
| **Passes 22–24** | `[COMPLETE]` | Phase 4 Execution | AgenticCommitGenerator, InteractiveModeController & Synthesis | [ADR-021](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-021-phase-4-agentic-commit-interactive-cli-controller.md) |
| **Passes 25–27** | `[COMPLETE]` | Phase 5 Resolution | EnvironmentKeyResolver, ImageModelRegistry & Master Synthesis | [ADR-022](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-022-phase-5-environment-key-and-image-model-registry.md) |
| **Passes 28–30** | `[COMPLETE]` | Phase 6 Gateway | LlmProxyGateway, StreamEventFormatter & Master Synthesis | [ADR-023](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-023-phase-6-llm-proxy-gateway-and-stream-event-formatter.md) |
| **Passes 31–33** | `[COMPLETE]` | Phase 7 Catalog | ReasoningEffortController, DynamicModelCache & Master Synthesis | [ADR-024](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-024-phase-7-reasoning-effort-and-dynamic-model-cache.md) |
| **Passes 34–36** | `[COMPLETE]` | Phase 8 Transport | TransportConnectionController, RemoteSessionHandle & Synthesis | [ADR-025](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-025-phase-8-transport-connection-and-remote-session-handle.md) |
| **Passes 37–39** | `[COMPLETE]` | Phase 9 Server | GatewaySessionRegistry, SnapshotStorageIndex & Master Synthesis | [ADR-026](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-026-phase-9-gateway-session-registry-and-snapshot-storage-index.md) |
| **Passes 40–42** | `[COMPLETE]` | Phase 10 Utils | ResilientFetchClient, SnowflakeIdGenerator & Master Synthesis | [ADR-027](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-027-phase-10-resilient-fetch-client-and-snowflake-id-generator.md) |
| **Passes 43–45** | `[COMPLETE]` | Phase 11 Utils | FrontmatterParser, BoundedFilePeeker & Master Synthesis | [ADR-028](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-028-phase-11-frontmatter-parser-and-bounded-file-peeker.md) |
| **Passes 46–48** | `[COMPLETE]` | Phase 12 Utils | SystemDirectoryResolver, CommandPathResolver & Master Synthesis | [ADR-029](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-029-phase-12-system-directory-resolver-and-command-path-resolver.md) |
| **Passes 49–51** | `[COMPLETE]` | Phase 13 Utils | TerminalTextSanitizer, LoopPhaseController & Master Synthesis | [ADR-030](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-030-phase-13-terminal-text-sanitizer-and-loop-phase-controller.md) |
| **Passes 52–54** | `[COMPLETE]` | Phase 14 Utils | FixedRingBuffer, MicrosecondTimingBuffer & Master Synthesis | [ADR-031](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-031-phase-14-fixed-ring-buffer-and-microsecond-timing-buffer.md) |
| **Passes 55–57** | `[COMPLETE]` | Phase 15 Utils | TabSpacingNormalizer, SemanticVersionComparator & Master Synthesis | [ADR-032](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-032-phase-15-tab-spacing-normalizer-and-semantic-version-comparator.md) |
| **Passes 58–60** | `[COMPLETE]` | Phase 16 Coding Agent | ContextBudgetCalculator, TokenTruncator & Master Synthesis | [ADR-033](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-033-phase-16-context-budget-calculator-and-token-truncator.md) |
| **Passes 61–63** | `[COMPLETE]` | Phase 17 Tooling | ToolCallSchemaValidator, ArgumentCoercer & Master Synthesis | [ADR-034](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-034-phase-17-tool-call-schema-validator-and-argument-coercer.md) |
| **Passes 64–66** | `[COMPLETE]` | Phase 18 Hashline | BatchEditAnchorer, DiffSynthesizer & Master Synthesis | [ADR-035](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-035-phase-18-multi-file-batch-edit-anchorer-and-diff-synthesizer.md) |
| **Passes 67–69** | `[COMPLETE]` | Phase 19 VFS | GitIgnoreFilter, WorkspaceTreeWalker & Master Synthesis | [ADR-036](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-036-phase-19-workspace-git-ignore-filter-and-tree-walker.md) |
| **Passes 70–72** | `[COMPLETE]` | Phase 20 Compaction | PromptTemplateEngine, DynamicVariableInjector & Master Synthesis | [ADR-037](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-037-phase-20-system-prompt-template-engine-and-dynamic-variable-injector.md) |
| **Passes 73–75** | `[COMPLETE]` | Phase 21 Evals & Grand Monolith | MasterBenchmarkOrchestrator, GrandMonolithSynthesizer & Grand Synthesis | [ADR-038](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-038-phase-21-master-benchmark-orchestrator-and-grand-synthesis.md) |

---

## 2. Self-Documenting Agent Protocol (How to Auto-Roll)

When an AI agent completes Pass $N$, it MUST execute the following **Auto-Rolling Protocol**:

1. **Update Code & Verification**:
   - Implement changes in `src/core/` and `src/*/extensions/`.
   - Verify `npm run check` and `npx tsx src/index.ts`.

2. **Publish Architecture Decision Record (ADR)**:
   - Create `.wiki/adr/ADR-xxx.md`.
   - Update `.wiki/adr/README.md`.

3. **Update Evolution Roadmap & Changelog**:
   - Update `.wiki/roadmap/AUTOROLLING-ROADMAP.md`.
   - Log entries in `CHANGELOG.md`.

4. **Git Commit & Push**:
   - Stage explicit files: `git add <files>`.
   - Commit message: `feat(agent): complete Pass N ...`.
   - Push to `main`.
