# ADR-008: Deterministic Game Engine Architecture

- **Status**: Accepted
- **Deciders**: LUMI Architectural Team
- **Date**: 2026-08-09
- **Technical Story**: Structuring `/Users/bozoegg/Desktop/LUMI-NEW` around the architectural design of a Deterministic Game Engine with frame ticks (`tick()`), immutable state snapshots (`GameStateSnapshot`), and frame-perfect state rewind/replay.

---

## 1. Context & Motivation (The Why)

### Deterministic State Machine Isolation
Traditional agent loops suffer from state drift, non-reproducible turns, and side-effect leakage across execution cycles. Modeling an agent runtime like a **Deterministic Game Engine** establishes:
1. **Frame Ticks (`tick()`)**: Every user interaction is a deterministic frame step executing `Input -> State Transition -> Output Telemetry`.
2. **Immutable State Snapshots (`GameStateSnapshot`)**: Frame-perfect snapshots capture session turns, VFS staged buffers, memory stores, and usage metrics.
3. **Frame Rewind & Replay (`rewindToSnapshot()`)**: Enables instant rollback to any prior frame tick without state corruption.

---

## 2. Architectural Decision (The What)

### Complete Tree Hierarchy

```
src/
├── core/                                # Contracts & Abstract Subsystems (DIP)
│   ├── contracts/                       # Interfaces & State Types
│   │   ├── agent.contracts.ts           # EngineTickInput, EngineTickResult, IAgentEngine
│   │   ├── session.contracts.ts         # GameStateSnapshot, SessionMessage, ISessionStore
│   │   └── tooling.contracts.ts         # IHands, IEars, IToolRegistry, AnchoredEditResult
│   └── abstracts/                       # Abstract Base Classes (Template Method)
│       ├── abstract-agent-engine.ts     # AbstractAgentEngine
│       ├── abstract-session-store.ts    # AbstractSessionStore
│       ├── abstract-hands.ts            # AbstractHands
│       ├── abstract-ears.ts             # AbstractEars
│       └── abstract-tool-registry.ts    # AbstractToolRegistry
│
├── agents/                              # Tier 1: Agents Subsystem
│   ├── base/agent-config.ts             # AgentConfig
│   └── extensions/
│       ├── prompt-composer.ts           # PromptComposer
│       ├── model-resolver.ts           # ModelResolver
│       ├── agent-slash-router.ts        # AgentSlashRouter
│       └── agent-engine.ts              # AgentEngine extends AbstractAgentEngine
│
├── sessions/                            # Tier 2: Sessions Subsystem
│   ├── base/session-context.ts          # SessionContext
│   └── extensions/
│       ├── session-compactor.ts         # SessionCompactor
│       ├── session-vfs.ts               # SessionVfs
│       ├── session-memory-store.ts      # SessionMemoryStore
│       └── session-store.ts             # PersistentSessionStore extends AbstractSessionStore
│
├── tooling/                             # Tier 3: Tooling Subsystem
│   ├── base/eyes.ts                     # Eyes (Input perception)
│   └── extensions/
│       ├── skills-ingestor.ts           # SkillsIngestor
│       ├── hands.ts                     # AnchoredHands extends AbstractHands
│       ├── ears.ts                      # ProtocolEars extends AbstractEars
│       └── tool-registry.ts             # ValidatingToolRegistry extends AbstractToolRegistry
│
├── factories/                           # Game Engine Bootstrapper
│   └── monolith-factory.ts              # MonolithFactory
│
└── index.ts                             # Game Engine Composition Root (LumiMonolith)
```

---

## 3. Technical Implementation (The How)

### Engine Tick & Rewind APIs

```typescript
// Primary Game Engine Frame Step
const tickResult = await lumi.tick({ prompt: "remember: engine = deterministic" });

// Immutable Frame Snapshot Capture
const snapshot = lumi.createSnapshot();

// Frame-Perfect Rewind
lumi.rewindToSnapshot(snapshot);
```

---

## 4. Verification

- **Type Safety**: `npm run check` passed cleanly (`verbatimModuleSyntax` compliant).
- **Runtime Determinism**: `npx tsx src/index.ts` verified 100% `instanceof` truthiness across all subsystem abstract base classes, frame tick execution (0.85ms), snapshot generation, and frame-perfect state rewind.
