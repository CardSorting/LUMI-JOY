# Auto-Rolling & Self-Documenting Evolution Roadmap

This document serves as the **Auto-Rolling Evolution Roadmap** for `/Users/bozoegg/Desktop/LUMI-NEW`. It automatically tracks completed evolutionary passes, defines the active next pass, and provides self-documenting instructions for AI agents extending the engine.

---

## 1. Auto-Rolling Evolution Pipeline

```
  [DONE] Pass 1 ──► [DONE] Pass 2 ──► [DONE] Pass 3 ──► [DONE] Pass 4 ──► [DONE] Pass 5 ──► [DONE] AKD-DSO
                                                                                               │
  [PLANNED] Pass 14 ◄── [PLANNED] Pass 13 ◄── [PLANNED] Pass 12 ◄── [PLANNED] Pass 11 ◄── [ACTIVE NEXT] Pass 10 ◄── [DONE] Pass 9 ◄── [DONE] Pass 8 ◄── [DONE] Pass 7 ◄── [DONE] Pass 6 ◄──┘
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
| **Pass 10** | `[ACTIVE NEXT]` | `packages/codemarie/src/core/policy` | Zombie symbol detection & dependency analysis in `ModuleDecomposer` | [Pass 10 Blueprint](#pass-10-zombie-symbol--module-decomposition) |
| **Pass 11** | `[PLANNED]` | `packages/codemarie/src/core/swarm` | Subagent task delegation & snapshot sync in `AgentSwarmDispatcher` | [Pass 11 Blueprint](#pass-11-swarm-subagent-task-delegation) |
| **Pass 12** | `[PLANNED]` | `packages/codemarie/src/core/integrity` | Environment auditing & self-healing diagnostics in `StabilityDoctor` | [Pass 12 Blueprint](#pass-12-environment-integrity--forensic-healing) |
| **Pass 13** | `[PLANNED]` | `packages/codemarie/src/core/workspace-intelligence` | Workspace topology & symbol knowledge graph in `WorkspaceIntelligenceEngine` | [Pass 13 Blueprint](#pass-13-workspace-intelligence-engine) |
| **Pass 14** | `[PLANNED]` | `packages/codemarie/src/core/permissions` | Command permission controller & execution guardrails in `CommandPermissionController` | [Pass 14 Blueprint](#pass-14-command-permission--security-guardrails) |

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
- **Status**: `[ACTIVE NEXT]`
- **Teacher Reference**: `/Users/bozoegg/Downloads/pi-main/packages/codemarie/src/core/policy/ModuleDecomposer.ts`
- **Objective**: Detect orphan/zombie exported symbols with zero active importers and calculate module coupling metrics.
- **Files to Modify/Create**:
  - `src/tooling/extensions/module-decomposer.ts`: Create `ModuleDecomposer`.
  - [src/tooling/extensions/tool-registry.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/tool-registry.ts): Register `audit_symbols` tool.

### Pass 11: Swarm Subagent Task Delegation (`packages/codemarie/src/core/swarm`)
- **Status**: `[PLANNED]`
- **Teacher Reference**: `/Users/bozoegg/Downloads/pi-main/packages/codemarie/src/core/swarm`
- **Objective**: Delegate isolated sub-tasks to child `LumiMonolith` session instances with frame snapshot synchronization.
- **Files to Modify/Create**:
  - `src/agents/extensions/agent-swarm-dispatcher.ts`: Create `AgentSwarmDispatcher`.
  - [src/tooling/extensions/tool-registry.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/tool-registry.ts): Register `delegate_task` tool.

### Pass 12: Environment Integrity & Forensic Healing (`packages/codemarie/src/core/integrity`)
- **Status**: `[PLANNED]`
- **Teacher Reference**: `/Users/bozoegg/Downloads/pi-main/packages/codemarie/src/core/integrity/EnvironmentIntegrity.ts`
- **Objective**: Audit environment state, detect runtime anomalies during frame ticks, and execute automated forensic healing.
- **Files to Modify/Create**:
  - `src/sessions/extensions/stability-doctor.ts`: Create `StabilityDoctor` & `EnvironmentIntegrity`.
  - [src/tooling/extensions/tool-registry.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/tool-registry.ts): Register `audit_integrity` tool.

### Pass 13: Workspace Intelligence Engine (`packages/codemarie/src/core/workspace-intelligence`)
- **Status**: `[PLANNED]`
- **Teacher Reference**: `/Users/bozoegg/Downloads/pi-main/packages/codemarie/src/core/workspace-intelligence/WorkspaceIntelligenceEngine.ts`
- **Objective**: Maintain a persistent background knowledge graph of workspace file structure, import topology, and symbol relationships.
- **Files to Modify/Create**:
  - `src/agents/extensions/workspace-intelligence.ts`: Create `WorkspaceIntelligenceEngine`.

### Pass 14: Command Permission & Security Guardrails (`packages/codemarie/src/core/permissions`)
- **Status**: `[PLANNED]`
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
