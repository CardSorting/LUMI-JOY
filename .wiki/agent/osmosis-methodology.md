# The Osmosis Learning Methodology & Whitepaper

This document is the authoritative guide and formal whitepaper for human developers and AI agents operating within **The Osmosis Learning Methodology** in `/Users/bozoegg/Desktop/LUMI-NEW`.

---

## 📄 Executive Brief

**LUMI-NEW** is a self-evolving agent framework and self-mutating code substrate. Instead of relying on static prompts or brittle micro-agent networks, LUMI-NEW continuously ingests production concepts from an external **Teacher Model** ([pi-main](file:///Users/bozoegg/Downloads/pi-main)), filters out framework bloat, and autonomously mutates its own 3-tier monolithic codebase (`agents`, `sessions`, `tooling`).

Turn processing is encapsulated inside a **Deterministic Game Engine**, where interactions execute as frame ticks (`tick()`), state transitions are captured in immutable snapshots (`GameStateSnapshot`), and sessions support frame-perfect state rewind and replay.

> 📖 Read the full whitepaper: [Whitepaper: The Osmosis Paradigm & Self-Mutating Game Engine Agent Substrate](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/whitepaper/OSMOSIS-WHITEPAPER.md)

> **Current verification:** Pass 192 + runtime hardening; exact composition 142/142, smoke 9/9, heterogeneous benchmark 5/5, complete Flappy Bird React + TypeScript + Vite synthesis 8/8 assertions, and guardrails 6/6. [`docs/LIVE_BASELINE.json`](../../docs/LIVE_BASELINE.json) is authoritative for current measurements.

---

## 💡 Foundational Philosophy

1. **Code as a Living, Self-Mutating Organism**: Software is not static scaffolding; it actively ingests beneficial paradigms from superior reference architectures and sheds bloat.
2. **Selective Osmotic Filtering**: Like a biological cell membrane, the Osmotic Filter selectively absorbs algorithms, contracts, line-anchored hashing, and zero-GC memory structures while discarding monorepo over-engineering.
3. **Non-Destructive Class Extension & Mutation Directories (`ADR-012`)**: Base classes in `src/*/base/` remain immutable. Each pass introduces single-responsibility extension classes in dedicated mutation subdirectories (`src/*/extensions/<mutation-domain>/`) without barrel re-export bloat.
4. **Deterministic Guardrails for Safe Self-Mutation**: Self-mutation without deterministic constraints leads to code degeneration. By enforcing frame-perfect snapshot rewinds and strict type verification (`npm run check`), every mutation step is guaranteed to be stable and type-safe.

---

## 1. Workspace Configuration & Roles

| Role | Repository CWD Path | Purpose & Responsibilities |
|---|---|---|
| **Teacher Model** | `/Users/bozoegg/Downloads/pi-main` | Reference codebase containing production feature packages (`packages/*`). Audited for algorithms, patterns, and contracts. Never modified directly. |
| **Student Model (Self-Mutating Engine)** | `/Users/bozoegg/Desktop/LUMI-NEW` | Greenfield 3-tier monolithic agent framework (`agents`, `sessions`, `tooling`). Reinvents absorbed concepts under the **Deterministic Game Engine Strategy**. |

---

## 2. Historical Foundation Ledger (Passes 1–8)

This table is the original foundation-era excerpt. It is retained for methodology context and must not be used as the current handoff or pass counter. The [Auto-Rolling Evolution Roadmap](../roadmap/AUTOROLLING-ROADMAP.md) is the canonical ledger and currently records Passes 1–192 plus cross-cutting runtime hardening.

| Pass # | Feature Absorbed from Teacher (`pi-main`) | Student Implementation in `LUMI-NEW` | Files Created / Modified | ADR Governance |
|---|---|---|---|---|
| **Pass 1** | `compaction/`, `skills.ts`, `system-prompt.ts` | Dynamic turn history compactor, workspace skill ingestor, system prompt composer | [session-compactor.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/sessions/extensions/compaction/session-compactor.ts), [skills-ingestor.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/registry/skills-ingestor.ts), [prompt-composer.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/agents/extensions/compaction/prompt-composer.ts) | [ADR-002](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-002-osmosis-evolution-compaction-skills-composition.md) |
| **Pass 2** | `model-resolver.ts`, `session-manager.ts`, `output-guard.ts` | Primary/fallback model resolution, isolated session forking, execution stream guardrails | [model-resolver.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/agents/extensions/resolution/model-resolver.ts), `SessionStore.fork()`, [hands.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/hashline/hands.ts) | [ADR-003](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-003-osmosis-evolution-model-resolution-session-forking-guardrails.md) |
| **Pass 3** | `vfs-router.ts`, `slash-commands.ts`, `telemetry.ts` | In-memory VFS diff overlay, sub-millisecond slash command router, microsecond telemetry | [session-vfs.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/sessions/extensions/vfs/session-vfs.ts), [agent-slash-router.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/agents/extensions/resolution/agent-slash-router.ts), [ears.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/telemetry/ears.ts) | [ADR-004](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-004-osmosis-evolution-vfs-slash-routing-telemetry.md) |
| **Pass 4** | `memory/`, knowledge items, tool chaining | Persistent memory facts and indexed knowledge retrieval | [session-memory-store.ts](../../src/sessions/extensions/memory/session-memory-store.ts) | [ADR-005](../adr/ADR-005-osmosis-evolution-memory-store-tool-chaining-knowledge-persistence.md) |
| **Pass 5** | `packages/hashline`, `omptype`, `session-backends`, `protocol` | Line-anchored hash edits (`applyAnchoredEdit`), tool schema validation (`validateToolArgs`), JSON-RPC telemetry (`formatJsonRpcEvent`) | [hands.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/hashline/hands.ts), [tool-registry.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/registry/tool-registry.ts), [ears.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/telemetry/ears.ts) | [ADR-006](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-006-osmosis-evolution-monorepo-package-absorption.md) |
| **Pass 6** | `packages/broccolidb` | Contiguous 16MB ArrayBuffer slab allocation, zero-GC turn message caching, O(1) memory reset | [arena-allocator.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/sessions/extensions/substrate/arena-allocator.ts), [session-store.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/sessions/extensions/persistence/session-store.ts) | [ADR-009](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-009-zero-gc-substrate-memory-allocation.md) |
| **Pass 7** | `packages/codemarie` | Fast structural AST code symbol search without heavy LSP daemon overhead | [ast-eyes.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/perception/ast-eyes.ts) | [ADR-010](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-010-ast-symbol-perception.md) |
| **Pass 8** | `packages/tui` & `packages/client` | Reactive CLI progress spinners and percent bars connected to ProtocolEars telemetry streams | [progress-ears.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/progress/progress-ears.ts) | [ADR-011](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-011-terminal-progress-renderer.md) |
| **Refactor** | Non-Destructive Extension & Mutation Directory Architecture | Abstract base classes (`src/core/abstracts/`), `tick()`, `GameStateSnapshot`, mutation subdirectories (`src/*/extensions/<domain>/`) | [ADR-012](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-012-non-destructive-osmosis-class-extension-strategy.md) | [ADR-012](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-012-non-destructive-osmosis-class-extension-strategy.md) |

> **Current handoff**: Pass 9 is historical and already recorded as complete. No next numbered pass is assigned. Select future scope explicitly and add it to the canonical roadmap as `[IN PROGRESS]` before treating it as active.

---

## 3. Playbook: How to Execute an Assigned Evolution Pass

1. **Teacher Audit**: Inspect `/Users/bozoegg/Downloads/pi-main/packages/<target-package>`.
2. **Reinterpretation**: Strip away multi-package IPC, AST compilers, and parameter properties.
3. **Non-Destructive Extension**: Create a new single-responsibility extension file in a domain-scoped mutation subdirectory (e.g. `src/agents/extensions/mentions/mention-resolver.ts`). DO NOT modify base classes in `src/*/base/`.
4. **Direct Composition**: Wire the new extension class directly into `MonolithFactory` and `LumiMonolith`.
5. **Verification**: Run `npm run check`, `npm test`, `npm run build`, and `git diff --check`, then add feature-specific evidence. Log the ADR and update the canonical roadmap and changelog.
6. **Completion Gate**: Mark the pass `[COMPLETE]` only after implementation, direct composition, verification, and documentation are all finished. `npm run smoke` verifies the current composition and cross-cutting runtime contracts, but it complements rather than replaces feature-specific assertions and the full test/build gates. Run `npm run baseline:update` when a change affects runtime performance, baseline composition, or guardrails.
7. **Documentation Freshness**: Reference the generated JSON for volatile timings. Preserve decision-time numbers only in explicitly historical ADR, research, legal, or field-note sections; never duplicate a live measurement into a current guide without its generation timestamp and host context.
