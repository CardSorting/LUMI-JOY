# Auto-Rolling & Self-Documenting Evolution Roadmap

This document serves as the **Auto-Rolling Evolution Roadmap** for `/Users/bozoegg/Desktop/LUMI-NEW`. It automatically tracks completed evolutionary passes, defines the active next pass, and provides self-documenting instructions for AI agents extending the engine.

---

## 1. Auto-Rolling Evolution Pipeline

```
  [DONE] Pass 1 ──► [DONE] Pass 2 ──► [DONE] Pass 3 ──► [DONE] Pass 4 ──► [DONE] Pass 5 ──► [DONE] AKD-DSO
                                                                                               │
  [PLANNED] Pass 8 ◄── [PLANNED] Pass 7 ◄── [ACTIVE NEXT] Pass 6 (Zero-GC Substrate) ◄─────────┘
```

| Pass Stage | Status | Target Package in Teacher (`pi-main`) | Student Implementation (`LUMI-NEW`) | Governance & Code Links |
|---|---|---|---|---|
| **Pass 1** | `[COMPLETE]` | `compaction/`, `skills.ts`, `system-prompt.ts` | `SessionCompactor`, `SkillsIngestor`, `PromptComposer` | [ADR-002](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-002-osmosis-evolution-compaction-skills-composition.md) |
| **Pass 2** | `[COMPLETE]` | `model-resolver.ts`, `session-manager.ts` | `ModelResolver`, `SessionStore.fork()`, Stream Guardrails | [ADR-003](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-003-osmosis-evolution-model-resolution-session-forking-guardrails.md) |
| **Pass 3** | `[COMPLETE]` | `vfs-router.ts`, `slash-commands.ts`, `telemetry.ts` | `SessionVfs`, `AgentSlashRouter`, `ProtocolEars` | [ADR-004](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-004-osmosis-evolution-vfs-slash-routing-telemetry.md) |
| **Pass 4** | `[COMPLETE]` | `memory/`, Knowledge Items (KIs) | `SessionMemoryStore`, memory tools | [ADR-005](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-005-osmosis-evolution-memory-store-tool-chaining-knowledge-persistence.md) |
| **Pass 5** | `[COMPLETE]` | `packages/hashline`, `omptype`, `protocol` | `applyAnchoredEdit()`, `validateToolArgs()`, `formatJsonRpcEvent()` | [ADR-006](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-006-osmosis-evolution-monorepo-package-absorption.md) |
| **AKD-DSO** | `[COMPLETE]` | Monolithic Subsystem Refactor | `AbstractAgentEngine`, `tick()`, `createSnapshot()`, rewind | [ADR-008](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-008-deterministic-game-engine-architecture.md) |
| **Pass 6** | `[ACTIVE NEXT]`| `packages/broccolidb` | Slab pre-allocation array caching in `PersistentSessionStore` | [Pass 6 Blueprint](#pass-6-zero-gc-substrate-memory-allocation) |
| **Pass 7** | `[PLANNED]` | `packages/codemarie` | AST structural code symbol search in `Eyes` (`searchSymbols`) | [Pass 7 Blueprint](#pass-7-ast-symbol-perception) |
| **Pass 8** | `[PLANNED]` | `packages/tui` & `packages/client` | Terminal progress renderer connected to `ProtocolEars` stream | [Pass 8 Blueprint](#pass-8-terminal-progress-renderer) |

---

## 2. Detailed Blueprints for Immediate Passes

### Pass 6: Zero-GC Substrate Memory Allocation (`packages/broccolidb`)
- **Status**: `[ACTIVE NEXT]`
- **Teacher Reference**: `/Users/bozoegg/Downloads/pi-main/packages/broccolidb`
- **Objective**: Pre-allocate typed array slab buffers inside [PersistentSessionStore](file:///Users/bozoegg/Desktop/LUMI-NEW/src/sessions/extensions/session-store.ts#L14) to eliminate V8 garbage collection pauses during long agent loops.
- **Files to Modify/Create**:
  - [src/core/contracts/session.contracts.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/core/contracts/session.contracts.ts): Add `SlabBufferSnapshot` interface.
  - [src/sessions/extensions/session-store.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/sessions/extensions/session-store.ts): Implement pre-allocated turn buffer allocation.

### Pass 7: AST Symbol Perception (`packages/codemarie`)
- **Status**: `[PLANNED]`
- **Teacher Reference**: `/Users/bozoegg/Downloads/pi-main/packages/codemarie`
- **Objective**: Provide fast structural symbol indexing without running heavy language server daemons.
- **Files to Modify/Create**:
  - [src/tooling/base/eyes.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/base/eyes.ts): Add `searchSymbols(dirPath, query)` method.
  - [src/tooling/extensions/tool-registry.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/tool-registry.ts): Register `search_symbols` tool.

---

## 3. Self-Documenting Agent Protocol (How to Auto-Roll)

When an AI agent completes Pass $N$, it MUST execute the following **Auto-Rolling Protocol**:

1. **Update Code & Verification**:
   - Implement changes in `src/core/` and `src/*/extensions/`.
   - Verify `npm run check` and `npx tsx src/index.ts`.
2. **Roll the Roadmap**:
   - Change Pass $N$ status from `[ACTIVE NEXT]` to `[COMPLETE]` in this table.
   - Change Pass $N+1$ status from `[PLANNED]` to `[ACTIVE NEXT]`.
3. **Roll the Changelog**:
   - Add new features under `## [Unreleased]` in [CHANGELOG.md](file:///Users/bozoegg/Desktop/LUMI-NEW/CHANGELOG.md).
4. **Log Architecture Decision**:
   - Create `.wiki/adr/ADR-009-<name>.md` and update `.wiki/adr/README.md`.
5. **Commit & Push**:
   - `git add <files> && git commit -m "feat(agent): complete Pass N ..."`
   - `git push origin main`
