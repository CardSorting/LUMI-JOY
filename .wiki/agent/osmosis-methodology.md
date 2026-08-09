# The Osmosis Learning Methodology & Whitepaper

This document is the authoritative guide and formal whitepaper for human developers and AI agents operating within **The Osmosis Learning Methodology** in `/Users/bozoegg/Desktop/LUMI-NEW`.

---

## 📄 Executive Brief

**LUMI-NEW** is a self-evolving agent framework and self-mutating code substrate. Instead of relying on static prompts or brittle micro-agent networks, LUMI-NEW continuously ingests production concepts from an external **Teacher Model** ([pi-main](file:///Users/bozoegg/Downloads/pi-main)), filters out framework bloat, and autonomously mutates its own 3-tier monolithic codebase (`agents`, `sessions`, `tooling`).

Turn processing is encapsulated inside a **Deterministic Game Engine**, where interactions execute as frame ticks (`tick()`), state transitions are captured in immutable snapshots (`GameStateSnapshot`), and sessions support frame-perfect state rewind and replay.

> 📖 Read the full whitepaper: [Whitepaper: The Osmosis Paradigm & Self-Mutating Game Engine Agent Substrate](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/whitepaper/OSMOSIS-WHITEPAPER.md)

---

## 💡 Foundational Philosophy

1. **Code as a Living, Self-Mutating Organism**: Software is not static scaffolding; it actively ingests beneficial paradigms from superior reference architectures and sheds bloat.
2. **Selective Osmotic Filtering**: Like a biological cell membrane, the Osmotic Filter selectively absorbs algorithms, contracts, line-anchored hashing, and zero-GC memory structures while discarding monorepo over-engineering.
3. **Deterministic Guardrails for Safe Self-Mutation**: Self-mutation without deterministic constraints leads to code degeneration. By enforcing frame-perfect snapshot rewinds and strict type verification (`npm run check`), every mutation step is guaranteed to be stable and type-safe.

---

## 1. Workspace Configuration & Roles

| Role | Repository CWD Path | Purpose & Responsibilities |
|---|---|---|
| **Teacher Model** | `/Users/bozoegg/Downloads/pi-main` | Reference codebase containing production feature packages (`packages/*`). Audited for algorithms, patterns, and contracts. Never modified directly. |
| **Student Model (Self-Mutating Engine)** | `/Users/bozoegg/Desktop/LUMI-NEW` | Greenfield 3-tier monolithic agent framework (`agents`, `sessions`, `tooling`). Reinvents absorbed concepts under the **Deterministic Game Engine Strategy**. |

---

## 2. Completed Evolution Ledger (Where We Left Off)

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

1. **Teacher Audit**: Inspect `/Users/bozoegg/Downloads/pi-main/packages/<target-package>`.
2. **Reinterpretation**: Strip away multi-package IPC, AST compilers, and parameter properties.
3. **Engraftment**: Implement contract in `src/core/contracts/` and extensions in `src/*/extensions/`.
4. **Verification**: Run `npm run check` and `npx tsx src/index.ts`. Log ADR in `.wiki/adr/`.
