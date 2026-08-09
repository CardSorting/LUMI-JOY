# The Osmosis Learning Methodology & Strategy Guide

This document establishes the official **Osmosis Learning Methodology** for evolving `/Users/bozoegg/Desktop/LUMI-NEW` by studying the production teacher model (`/Users/bozoegg/Downloads/pi-main`).

---

## 1. Core Philosophy: Teacher vs. Evolving Monolith

```
┌───────────────────────────────────────────┐         Osmosis Filter         ┌───────────────────────────────────────────┐
│              TEACHER MODEL                │    (Discard Over-Engineering)  │              EVOLVING MODEL               │
│     (/Users/bozoegg/Downloads/pi-main)    │ ─────────────────────────────► │      (/Users/bozoegg/Desktop/LUMI-NEW)   │
│                                           │                                │                                           │
│ • 18 Monorepo Packages                    │    Absorb Core Concepts        │ • Deterministic Game Engine Architecture  │
│ • Complex Async Message Queues            │    Reinvent in 3-Tier Monolith │ • 3-Tier Subsystem Hierarchy              │
│ • Multi-Agent Micro-Frameworks            │    Enforce Strict 5 Class Cap  │ • <= 5 Class Cap per Tier Directory       │
└───────────────────────────────────────────┘                                └───────────────────────────────────────────┘
```

The Osmosis strategy treats a large reference codebase (`pi-main`) as a **Teacher Model**. Rather than copying code blindly or inheriting multi-package overhead, `LUMI-NEW` extracts production concepts, discards unnecessary framework bloat ("framework soup"), and reinvents the feature inside a clean, deterministic 3-tier monolith (`agents`, `sessions`, `tooling`).

---

## 2. The 4-Step Osmosis Execution Cycle

For every evolutionary pass, future agents MUST follow this 4-step cycle:

```
  ┌───────────────────────┐
  │  1. DEEP INSPECTION   │ Examine teacher packages, contracts, and execution paths in pi-main.
  └───────────┬───────────┘
              │
              ▼
  ┌───────────────────────┐
  │ 2. REINTERPRET & FILTER│ Discard multi-agent queues, dynamic imports, and complex wrappers.
  └───────────┬───────────┘
              │
              ▼
  ┌───────────────────────┐
  │ 3. MONOLITHIC ENGRAFT │ Implement in src/core/, src/agents/, src/sessions/, or src/tooling/.
  └───────────┬───────────┘
              │
              ▼
  ┌───────────────────────┐
  │ 4. ADR & WIKI GOVERN  │ Record decisions in .wiki/adr/ and verify type check (npm run check).
  └───────────────────────┘
```

### Step 1: Deep Inspection
- Scan `pi-main/packages/` or `pi-main/packages/coding-agent/src/core/` for capabilities (e.g. compactor, VFS, line hashing, schema validation).
- Trace inputs, outputs, and edge-case handling.

### Step 2: Reinterpretation & Filtering
- **Discard**: Multi-agent inter-process channels, complex AST compilers, dynamic `await import()` calls, and parameter properties.
- **Extract**: Underlying algorithm, state transformation, or user-facing capability.

### Step 3: Monolithic Engraftment
- Check tier class caps: **Strict maximum of 5 orchestrating classes per tier directory** (`src/agents/`, `src/sessions/`, `src/tooling/`).
- If tier class slots are available: Create a clean new subclass extending `src/core/abstracts/` (e.g. `SessionMemoryStore`, `SessionVfs`).
- If tier class slots are at capacity (5 classes): Enrich existing base/extended classes (e.g. adding `applyAnchoredEdit` to `Hands` or `validateToolArgs` to `ToolRegistry`).

### Step 4: Governance & Verification
- Record architectural decisions in `.wiki/adr/ADR-XXX-<topic>.md`.
- Update `.wiki/adr/README.md` and `.wiki/agent/playbook.md`.
- Run `npm run check` (`tsc --noEmit`) and verify runtime execution via `npx tsx src/index.ts`.

---

## 3. History of Osmosis Passes (Passes 1 - 5)

| Pass | Target Concept Absorbed from `pi-main` | Reinterpreted Implementation in `LUMI-NEW` | Governance Record |
|---|---|---|---|
| **Pass 1** | `compaction/`, `skills.ts`, `system-prompt.ts` | [SessionCompactor](file:///Users/bozoegg/Desktop/LUMI-NEW/src/sessions/extensions/session-compactor.ts#L8), [SkillsIngestor](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/skills-ingestor.ts#L11), [PromptComposer](file:///Users/bozoegg/Desktop/LUMI-NEW/src/agents/extensions/prompt-composer.ts#L14) | [ADR-002](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-002-osmosis-evolution-compaction-skills-composition.md) |
| **Pass 2** | `model-resolver.ts`, `session-manager.ts`, `output-guard.ts` | [ModelResolver](file:///Users/bozoegg/Desktop/LUMI-NEW/src/agents/extensions/model-resolver.ts#L13), `SessionStore.fork()`, Stream Guardrails in [Hands](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/hands.ts#L10) | [ADR-003](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-003-osmosis-evolution-model-resolution-session-forking-guardrails.md) |
| **Pass 3** | `vfs-router.ts`, `slash-commands.ts`, `telemetry.ts` | [SessionVfs](file:///Users/bozoegg/Desktop/LUMI-NEW/src/sessions/extensions/session-vfs.ts#L10), [AgentSlashRouter](file:///Users/bozoegg/Desktop/LUMI-NEW/src/agents/extensions/agent-slash-router.ts#L24), Microsecond Timers in [ProtocolEars](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/ears.ts#L4) | [ADR-004](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-004-osmosis-evolution-vfs-slash-routing-telemetry.md) |
| **Pass 4** | `memory/`, Knowledge Items (KIs), Autonomous Tooling | [SessionMemoryStore](file:///Users/bozoegg/Desktop/LUMI-NEW/src/sessions/extensions/session-memory-store.ts#L8), `search_memory` & `save_memory` tools | [ADR-005](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-005-osmosis-evolution-memory-store-tool-chaining-knowledge-persistence.md) |
| **Pass 5** | `packages/hashline`, `omptype`, `session-backends`, `protocol` | `applyAnchoredEdit()`, `validateToolArgs()`, `saveToFile()`, `formatJsonRpcEvent()` | [ADR-006](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-006-osmosis-evolution-monorepo-package-absorption.md) |

---

## 4. Strategy Roadmap for Subsequent Osmosis Passes

Future agents extending `LUMI-NEW` should target the following candidate packages in `/Users/bozoegg/Downloads/pi-main/packages/`:

### Candidate 1: `packages/broccolidb` (Zero-GC Substrate State Storage)
- **Concept**: Pre-allocated slab memory allocation for zero garbage-collection overhead during large session turns.
- **LUMI Integration Plan**: Enhance [SessionStore](file:///Users/bozoegg/Desktop/LUMI-NEW/src/sessions/extensions/session-store.ts#L14) to pre-allocate message turn buffers using fixed typed arrays for zero-GC turn processing.

### Candidate 2: `packages/codemarie` (Ast-Aware File Indexing & Symbol Search)
- **Concept**: Fast structural code search without heavy LSP servers.
- **LUMI Integration Plan**: Enhance [Eyes](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/base/eyes.ts#L14) with a lightweight regex-based symbol scanner (`searchSymbols`).

### Candidate 3: `packages/tui` & `packages/client` (Interactive Terminal Component Framework)
- **Concept**: Structured TUI rendering for agent turns.
- **LUMI Integration Plan**: Connect `ProtocolEars.formatJsonRpcEvent()` to a lightweight terminal progress renderer in `src/index.ts`.

---

## 5. Non-Negotiable Constraints for Future Osmosis Passes

1. **Class Cap Limit**: Never exceed 5 classes per tier directory (`src/agents/`, `src/sessions/`, `src/tooling/`).
2. **Erasable TypeScript Syntax**: Maintain Node strip-only mode compatibility (no `enum`, no `namespace`, no constructor parameter properties).
3. **Template Method Inheritance**: All extended classes must inherit from core contracts in `src/core/contracts/` and `src/core/abstracts/`.
4. **Single Parent Monolith Composition**: [LumiMonolith](file:///Users/bozoegg/Desktop/LUMI-NEW/src/index.ts#L57) in `src/index.ts` remains the single parent composition root.
