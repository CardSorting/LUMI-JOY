# Auto-Rolling & Self-Documenting Evolution Roadmap

This document serves as the **Auto-Rolling Evolution Roadmap** for `/Users/bozoegg/Desktop/LUMI-NEW`. It automatically tracks completed evolutionary passes, defines the active next pass, and provides self-documenting instructions for AI agents extending the engine.

---

## 1. Auto-Rolling Evolution Pipeline

```
  [DONE] Pass 1 ──► [DONE] Pass 2 ──► [DONE] Pass 3 ──► [DONE] Pass 4 ──► [DONE] Pass 5 ──► [DONE] AKD-DSO
                                                                                               │
  [DONE] Pass 14 ◄── [DONE] Pass 13 ◄── [DONE] Pass 12 ◄── [DONE] Pass 11 ◄── [DONE] Pass 10 ◄── [DONE] Pass 9 ◄── [DONE] Pass 8 ◄── [DONE] Pass 7 ◄── [DONE] Pass 6 ◄──┘
```

| Pass Stage | Status | Target Package in Teacher (`pi-main`) | Student Implementation (`LUMI-NEW`) | Governance & Code Links |
|---|---|---|---|---|
| **Pass 1** | `[COMPLETE]` | `compaction/`, `skills.ts`, `system-prompt.ts` | `SessionCompactor`, `SkillsIngestor`, `PromptComposer` | [ADR-002](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-002-osmosis-evolution-compaction-skills-composition.md) |
| **Pass 2** | `[COMPLETE]` | `model-resolver.ts`, `session-manager.ts` | `ModelResolver`, `SessionStore.fork()`, Stream Guardrails | [ADR-003](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-003-osmosis-evolution-model-resolution-session-forking-guardrails.md) |
| **Pass 3** | `[COMPLETE]` | `vfs-router.ts`, `slash-commands.ts`, `telemetry.ts` | `SessionVfs`, `AgentSlashRouter`, `ProtocolEars` | [ADR-004](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-004-osmosis-evolution-vfs-slash-routing-telemetry.md) |
| **Pass 4** | `[COMPLETE]` | `memory/`, Knowledge Items (KIs) | `SessionMemoryStore`, memory tools | [ADR-005](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-005-osmosis-evolution-memory-store-tool-chaining-knowledge-persistence.md) |
| **Pass 5** | `[COMPLETE]` | `packages/hashline`, `omptype`, `protocol` | `applyAnchoredEdit()`, `validateToolArgs()`, `formatJsonRpcEvent()` | [ADR-006](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-006-osmosis-evolution-monorepo-package-absorption.md) |
| **AKD-DSO** | `[COMPLETE]` | Monolithic Subsystem Refactor | `AbstractAgentEngine`, `tick()`, `createSnapshot()`, rewind | [ADR-008](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-008-deterministic-game-engine-architecture.md) |
| **Pass 6** | `[COMPLETE]` | `packages/broccolidb` | Slab pre-allocation array caching in `PersistentSessionStore` | [ADR-009](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-009-zero-gc-substrate-memory-allocation.md) |
| **Pass 7** | `[COMPLETE]` | `packages/codemarie` | AST structural code symbol search in `Eyes` (`searchSymbols`) | [ADR-010](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-010-ast-symbol-perception.md) |
| **Pass 8** | `[COMPLETE]` | `packages/tui` & `packages/client` | Terminal progress renderer connected to `ProtocolEars` stream | [ADR-011](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-011-terminal-progress-renderer.md) |
| **Pass 9** | `[COMPLETE]` | `packages/codemarie/src/core/mentions` | Context `@mention` resolution (`@file`, `@symbol`, `@git`, `@terminal`) in `MentionResolver` | [ADR-013](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-013-workspace-mention-resolution.md) |
| **Pass 10** | `[COMPLETE]` | `packages/codemarie/src/core/policy` | Zombie symbol detection & dependency analysis in `ModuleDecomposer` | [ADR-014](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-014-zombie-symbol-module-decomposition.md) |
| **Pass 11** | `[COMPLETE]` | `packages/codemarie/src/core/swarm` | Subagent task delegation & snapshot sync in `AgentSwarmDispatcher` | [ADR-015](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-015-swarm-subagent-task-delegation.md) |
| **Pass 12** | `[COMPLETE]` | `packages/codemarie/src/core/integrity` | Environment auditing & self-healing diagnostics in `StabilityDoctor` | [ADR-016](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-016-environment-integrity-forensic-healing.md) |
| **Pass 13** | `[COMPLETE]` | `packages/codemarie/src/core/workspace-intelligence` | Workspace topology & symbol knowledge graph in `WorkspaceIntelligenceEngine` | [ADR-017](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-017-workspace-intelligence-engine.md) |
| **Pass 14** | `[COMPLETE]` | `packages/codemarie/src/core/permissions` | Command permission controller & execution guardrails in `CommandPermissionController` | [ADR-018](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-018-command-permission-security-guardrails.md) |
| **Pass 15** | `[COMPLETE]` | `packages/snapcompact` | Dense bitmap history compression in `SnapcompactEngine` | [ADR-019](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-019-phase-2-extended-package-osmosis.md) |
| **Pass 16** | `[COMPLETE]` | `packages/catalog` | Model capability specs & pricing calculation in `ModelCatalog` | [ADR-019](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-019-phase-2-extended-package-osmosis.md) |
| **Pass 17** | `[COMPLETE]` | `packages/server` | JSON-RPC 2.0 streaming gateway in `MonolithGatewayServer` | [ADR-019](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-019-phase-2-extended-package-osmosis.md) |
| **Pass 18** | `[COMPLETE]` | `packages/evals` | Automated benchmark suite evaluation & latency assertions in `MonolithBenchmarkEvaluator` | [ADR-019](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-019-phase-2-extended-package-osmosis.md) |

---

## 2. Detailed Blueprints for Immediate Passes

### Pass 6: Zero-GC Substrate Memory Allocation (`packages/broccolidb`)
- **Status**: `[COMPLETE]`
- **Teacher Reference**: `/Users/bozoegg/Downloads/pi-main/packages/broccolidb`
- **Objective**: Pre-allocate typed array slab buffers inside [PersistentSessionStore](file:///Users/bozoegg/Desktop/LUMI-NEW/src/sessions/extensions/session-store.ts#L14) to eliminate V8 garbage collection pauses during long agent loops.
- **Files Modified/Created**:
  - [src/core/contracts/session.contracts.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/core/contracts/session.contracts.ts): Add `SlabBufferSnapshot` interface.
  - [src/sessions/extensions/substrate/arena-allocator.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/sessions/extensions/substrate/arena-allocator.ts): Implement `ArenaAllocator` slab allocator.
  - [src/sessions/extensions/persistence/session-store.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/sessions/extensions/persistence/session-store.ts): Integrate pre-allocated turn buffer allocation.

### Pass 7: AST Symbol Perception (`packages/codemarie`)
- **Status**: `[COMPLETE]`
- **Teacher Reference**: `/Users/bozoegg/Downloads/pi-main/packages/codemarie`
- **Objective**: Provide fast structural symbol indexing without running heavy language server daemons.
- **Files Modified/Created**:
  - [src/tooling/base/eyes.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/base/eyes.ts): Add base file reader.
  - [src/tooling/extensions/perception/ast-eyes.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/perception/ast-eyes.ts): Implement `AstPerceptionEyes` and `searchSymbols`.

### Pass 8: Terminal Progress Renderer (`packages/tui` & `packages/client`)
- **Status**: `[COMPLETE]`
- **Teacher Reference**: `/Users/bozoegg/Downloads/pi-main/packages/tui` & `/Users/bozoegg/Downloads/pi-main/packages/client`
- **Objective**: Render reactive CLI progress spinners and status notifications connected to `ProtocolEars` JSON-RPC streams.
- **Files Modified/Created**:
  - [src/core/contracts/tooling.contracts.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/core/contracts/tooling.contracts.ts): Add `TerminalProgressFrame` interface.
  - [src/tooling/extensions/progress/progress-ears.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/progress/progress-ears.ts): Add `TerminalProgressRenderer` and `ProgressStreamingEars`.

### Pass 9: Workspace Mention Resolution (`packages/codemarie/src/core/mentions`)
- **Status**: `[COMPLETE]`
- **Teacher Reference**: `/Users/bozoegg/Downloads/pi-main/packages/codemarie/src/core/mentions`
- **Objective**: Parse dynamic prompt context mentions (`@file:<path>`, `@symbol:<name>`, `@git:staged`, `@terminal:last`) and automatically expand them into structured context blocks before LLM turn execution.
- **Files Modified/Created**:
  - [src/agents/extensions/mentions/mention-resolver.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/agents/extensions/mentions/mention-resolver.ts): Implement `MentionResolver` parser & resolver.
  - [src/factories/monolith-factory.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/factories/monolith-factory.ts): Wire `MentionResolver` into engine monad composition root.

### Pass 10: Zombie Symbol & Module Decomposition (`packages/codemarie/src/core/policy`)
- **Status**: `[COMPLETE]`
- **Teacher Reference**: `/Users/bozoegg/Downloads/pi-main/packages/codemarie/src/core/policy/ModuleDecomposer.ts`
- **Objective**: Detect orphan/zombie exported symbols with zero active importers and calculate module coupling metrics.
- **Files Modified/Created**:
  - [src/tooling/extensions/policy/module-decomposer.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/policy/module-decomposer.ts): Implement `ModuleDecomposer` & zombie symbol auditing.
  - [src/tooling/extensions/registry/tool-registry.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/registry/tool-registry.ts): Register `audit_symbols` tool.

### Pass 11: Swarm Subagent Task Delegation (`packages/codemarie/src/core/swarm`)
- **Status**: `[COMPLETE]`
- **Teacher Reference**: `/Users/bozoegg/Downloads/pi-main/packages/codemarie/src/core/swarm`
- **Objective**: Delegate isolated sub-tasks to child `LumiMonolith` session instances with frame snapshot synchronization.
- **Files Modified/Created**:
  - [src/agents/extensions/swarm/agent-swarm-dispatcher.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/agents/extensions/swarm/agent-swarm-dispatcher.ts): Implement `AgentSwarmDispatcher` & subagent task delegation.
  - [src/factories/monolith-factory.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/factories/monolith-factory.ts): Wire `AgentSwarmDispatcher` into engine monad composition root.

### Pass 12: Environment Integrity & Forensic Healing (`packages/codemarie/src/core/integrity`)
- **Status**: `[COMPLETE]`
- **Teacher Reference**: `/Users/bozoegg/Downloads/pi-main/packages/codemarie/src/core/integrity/EnvironmentIntegrity.ts`
- **Objective**: Audit environment state, detect runtime anomalies during frame ticks, and execute automated forensic healing.
- **Files Modified/Created**:
  - [src/sessions/extensions/integrity/stability-doctor.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/sessions/extensions/integrity/stability-doctor.ts): Implement `StabilityDoctor` & `EnvironmentIntegrity`.
  - [src/tooling/extensions/registry/tool-registry.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/registry/tool-registry.ts): Register `audit_integrity` tool.

### Pass 13: Workspace Intelligence Engine (`packages/codemarie/src/core/workspace-intelligence`)
- **Status**: `[COMPLETE]`
- **Teacher Reference**: `/Users/bozoegg/Downloads/pi-main/packages/codemarie/src/core/workspace-intelligence/WorkspaceIntelligenceEngine.ts`
- **Objective**: Maintain a persistent background knowledge graph of workspace file structure, import topology, and symbol relationships.
- **Files Modified/Created**:
  - [src/agents/extensions/intelligence/workspace-intelligence.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/agents/extensions/intelligence/workspace-intelligence.ts): Implement `WorkspaceIntelligenceEngine` & `WorkspaceCognitiveModel`.
  - [src/factories/monolith-factory.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/factories/monolith-factory.ts): Wire `WorkspaceIntelligenceEngine` into composition root.

### Pass 14: Command Permission & Security Guardrails (`packages/codemarie/src/core/permissions`)
- **Status**: `[COMPLETE]`
- **Teacher Reference**: `/Users/bozoegg/Downloads/pi-main/packages/codemarie/src/core/permissions/CommandPermissionController.ts`
- **Objective**: Enforce strict command execution policies, allowlists/denylists, and user confirmation requirements prior to executing shell commands in `AnchoredHands`.
- **Files Modified/Created**:
  - [src/tooling/extensions/permissions/command-permission-controller.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/permissions/command-permission-controller.ts): Implement `CommandPermissionController` & security guardrails.
  - [src/tooling/extensions/hashline/hands.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/hashline/hands.ts): Integrate command permission validation into `AnchoredHands.runCommand()`.
- **Teacher Reference**: `/Users/bozoegg/Downloads/pi-main/packages/codemarie/src/core/permissions/CommandPermissionController.ts`
- **Objective**: Enforce strict command execution policies, allowlists/denylists, and user confirmation requirements prior to executing shell commands in `AnchoredHands`.
- **Files to Modify/Create**:
  - `src/tooling/extensions/command-permission-controller.ts`: Create `CommandPermissionController`.

---

## 3. Self-Documenting Agent Protocol (How to Auto-Roll)

When an AI agent completes Pass $N$, it MUST execute the following **Auto-Rolling Protocol**:

1. **Non-Destructive Extension Implementation**:
   - MUST NOT destructively overwrite existing base classes (`eyes.ts`, `ears.ts`, `session-store.ts`, `prompt-composer.ts`).
   - Create a dedicated single-responsibility extension file in `src/*/extensions/` (e.g. `AstPerceptionEyes extends Eyes`, `ProgressStreamingEars extends ProtocolEars`).
   - Compose the extension class cleanly in `MonolithFactory` and `LumiMonolith`.
   - Verify `npm run check` and `npx tsx src/index.ts`.
2. **Roll the Roadmap**:
   - Change Pass $N$ status from `[ACTIVE NEXT]` to `[COMPLETE]` in the pipeline table and blueprints.
   - Change Pass $N+1$ status from `[PLANNED]` to `[ACTIVE NEXT]`.
3. **Roll the Changelog**:
   - Add new features under `## [Unreleased]` in [CHANGELOG.md](file:///Users/bozoegg/Desktop/LUMI-NEW/CHANGELOG.md).
4. **Log Architecture Decision**:
   - Create `.wiki/adr/ADR-0XX-<name>.md` and update [.wiki/adr/README.md](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/README.md).
5. **Commit & Push**:
   - `git add <files> && git commit -m "feat(agent): complete Pass N ..."`
   - `git push origin main`
