# The Osmosis Learning Methodology & Developer Handoff Guide

This document is the authoritative guide for human developers and AI agents adopting **The Osmosis Learning Methodology** in `/Users/bozoegg/Desktop/LUMI-NEW`. It details the Teacher-Student framework, the exact history of evolution passes completed, and a step-by-step playbook for continuing the evolutionary chain.

---

## 1. Workspace Configuration & Roles

| Role | Repository CWD Path | Purpose & Responsibilities |
|---|---|---|
| **Teacher Model** | `/Users/bozoegg/Downloads/pi-main` | Reference codebase containing production feature packages (`packages/*`). Audited for algorithms, patterns, and contracts. Never modified directly. |
| **Student Model (Evolving Engine)** | `/Users/bozoegg/Desktop/LUMI-NEW` | Greenfield 3-tier monolithic agent framework (`agents`, `sessions`, `tooling`). Reinvents absorbed concepts under the **Deterministic Game Engine Strategy**. |

---

## 2. Completed Evolution Ledger (Where We Left Off)

The following ledger tracks every Osmosis Pass completed in `LUMI-NEW`. Future agents can inspect this table to understand the exact lineage of absorbed features:

| Pass # | Feature Absorbed from Teacher (`pi-main`) | Student Implementation in `LUMI-NEW` | Files Created / Modified | ADR Governance |
|---|---|---|---|---|
| **Pass 1** | `compaction/`, `skills.ts`, `system-prompt.ts` | Dynamic turn history compactor, workspace skill ingestor, system prompt composer | [session-compactor.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/sessions/extensions/session-compactor.ts#L8), [skills-ingestor.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/skills-ingestor.ts#L11), [prompt-composer.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/agents/extensions/prompt-composer.ts#L14) | [ADR-002](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-002-osmosis-evolution-compaction-skills-composition.md) |
| **Pass 2** | `model-resolver.ts`, `session-manager.ts`, `output-guard.ts` | Primary/fallback model resolution, isolated session forking, execution stream guardrails | [model-resolver.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/agents/extensions/model-resolver.ts#L13), `SessionStore.fork()`, [hands.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/hands.ts#L10) | [ADR-003](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-003-osmosis-evolution-model-resolution-session-forking-guardrails.md) |
| **Pass 3** | `vfs-router.ts`, `slash-commands.ts`, `telemetry.ts` | In-memory VFS diff overlay, sub-millisecond slash command router, microsecond telemetry | [session-vfs.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/sessions/extensions/session-vfs.ts#L10), [agent-slash-router.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/agents/extensions/agent-slash-router.ts#L24), [ears.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/ears.ts#L4) | [ADR-004](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-004-osmosis-evolution-vfs-slash-routing-telemetry.md) |
| **Pass 5** | `packages/hashline`, `omptype`, `session-backends`, `protocol` | Line-anchored hash edits (`applyAnchoredEdit`), tool schema validation (`validateToolArgs`), JSON-RPC telemetry (`formatJsonRpcEvent`) | [hands.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/hands.ts#L10), [tool-registry.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/tool-registry.ts#L9), [ears.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/ears.ts#L4) | [ADR-006](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-006-osmosis-evolution-monorepo-package-absorption.md) |
| **Refactor** | Enterprise OOP Hierarchy & Game Engine Architecture | Abstract base classes (`src/core/abstracts/`), `tick()`, `GameStateSnapshot`, frame-perfect rewind/replay | [src/core/abstracts/](file:///Users/bozoegg/Desktop/LUMI-NEW/src/core/abstracts/), [MonolithFactory](file:///Users/bozoegg/Desktop/LUMI-NEW/src/factories/monolith-factory.ts#L18), [LumiMonolith](file:///Users/bozoegg/Desktop/LUMI-NEW/src/index.ts#L57) | [ADR-007](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-007-oop-class-extension-hierarchy.md), [ADR-008](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-008-deterministic-game-engine-architecture.md) |

> 📌 **Current Handoff Status**: **Pass 5 Complete & Architecture Hardened**. The next planned evolutionary pass is **Pass 6: Zero-GC Substrate Memory Allocation**.

---

## 3. Playbook: How to Execute Next Evolution Pass (e.g., Pass 6)

When picking up development, follow this step-by-step playbook to execute a new Osmosis pass cleanly:

### Phase 1: Teacher Source Audit
1. Navigate to the Teacher Model directory: `/Users/bozoegg/Downloads/pi-main/packages/<target-package>`.
2. Inspect core exports, types, and logic flow (e.g. studying `packages/broccolidb` for pre-allocated typed array buffers).

### Phase 2: Filtering & Reinterpretation
1. **Discard**:
   - Multi-package dependencies, IPC message wrappers, AST compilers.
   - Non-erasable TS constructs (`enum`, `namespace`, parameter properties).
2. **Re-interpret**:
   - Define a pure interface contract in `src/core/contracts/`.
   - Implement an abstract base class hook in `src/core/abstracts/` or extend an existing tier subsystem in `src/*/extensions/`.

### Phase 3: Engrafting into Game Engine Subsystem
1. Ensure new logic hooks directly into the **Deterministic Game Engine Tick Loop** (`AbstractAgentEngine.tick()`) or **State Snapshot Engine** (`createSnapshot()` / `rewindToSnapshot()`).
2. Add corresponding tool definitions to [ValidatingToolRegistry](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/tool-registry.ts#L9) or slash commands to [AgentSlashRouter](file:///Users/bozoegg/Desktop/LUMI-NEW/src/agents/extensions/agent-slash-router.ts#L24).

### Phase 4: Verification & Governance
1. Run TypeScript type check:
   ```bash
   npm run check
   ```
2. Run runtime smoke test:
   ```bash
   npx tsx src/index.ts
   ```
3. Record a new Architecture Decision Record in `.wiki/adr/ADR-009-<name>.md`.
4. Update `.wiki/adr/README.md`, `.wiki/agent/playbook.md`, and this Osmosis ledger.
5. Commit with conventional commit message format: `feat(agent): ...`.

---

## 4. Next Evolutionary Pass Blueprints (Pass 6 & Beyond)

### Blueprint: Pass 6 — Zero-GC Substrate Memory Allocation (`broccolidb`)
- **Teacher Reference**: `/Users/bozoegg/Downloads/pi-main/packages/broccolidb`
- **Goal**: Eliminate V8 garbage-collection pauses during long turn loops by pre-allocating slab buffers.
- **Target Files**:
  - `src/core/contracts/session.contracts.ts`: Add `SlabBufferSnapshot` interface.
  - `src/sessions/extensions/session-store.ts`: Add `ArenaAllocator` pre-allocated array buffer for message turn caching.

### Blueprint: Pass 7 — AST Symbol Perception (`codemarie`)
- **Teacher Reference**: `/Users/bozoegg/Downloads/pi-main/packages/codemarie`
- **Goal**: Enable instant regex symbol indexing without heavy LSP servers.
- **Target Files**:
  - `src/tooling/base/eyes.ts`: Add `searchSymbols(dirPath, query)` method to [Eyes](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/base/eyes.ts#L14).
  - `src/tooling/extensions/tool-registry.ts`: Register `search_symbols` tool.

---

## 5. Non-Negotiable Rules for All Future Passes

1. **Model the Game Engine Strategy**: Every turn interaction remains a frame tick (`tick()`), and state updates remain snapshot-compatible (`GameStateSnapshot`).
2. **Erasable TypeScript Syntax**: Strict Node strip-only mode (no `enum`, no `namespace`, no parameter properties).
3. **Single Composition Root**: [LumiMonolith](file:///Users/bozoegg/Desktop/LUMI-NEW/src/index.ts#L57) in `src/index.ts` remains the single parent composition root.
