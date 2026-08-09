# LUMI-NEW: Deterministic Game Engine Agent Framework

A high-performance, enterprise-grade TypeScript agent framework designed around a **Deterministic Game Engine Architecture**. LUMI-NEW models agent interactions as deterministic frame ticks (`tick()`), state transitions as immutable snapshots (`GameStateSnapshot`), and provides frame-perfect state rewind, replay, and session forking.

```
                                  ┌────────────────────────┐
                                  │      LumiMonolith      │ (src/index.ts)
                                  │  Deterministic Engine  │
                                  └───────────┬────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    ▼                         ▼                         ▼
          ┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐
          │   ENGINE TICK     │     │   WORLD STATE     │     │ SENSORY SUBSYSTEM │
          │    (AGENTS)       │     │   (SESSIONS)      │     │    (TOOLING)      │
          ├───────────────────┤     ├───────────────────┤     ├───────────────────┤
          │ AbstractEngine    │     │ AbstractSession   │     │ AbstractHands     │
          │ AgentEngine       │     │ PersistentSession │     │ AbstractEars      │
          │ PromptComposer    │     │ SessionVfs        │     │ AbstractRegistry  │
          │ ModelResolver     │     │ SessionMemory     │     │ Eyes (Input)      │
          │ SlashRouter       │     │ SessionCompactor  │     │ SkillsIngestor    │
          └───────────────────┘     └───────────────────┘     └───────────────────┘
```

---

## Key Features & Design Patterns

- **Deterministic Game Loop (`tick()`)**:
  - Turns execute as frame steps (`EngineTickInput` $\rightarrow$ `EngineTickResult`) with microsecond performance telemetry.
- **Frame-Perfect State Snapshotting & Rewind**:
  - `createSnapshot()` captures immutable game state snapshots across turn messages, VFS staged buffers, memory stores, and model usage metrics.
  - `rewindToSnapshot()` restores active session state to any frame snapshot instantly.
- **SOLID Principles & Template Method Pattern**:
  - High-level subsystems depend on abstractions in `src/core/contracts/` and `src/core/abstracts/` ([AbstractAgentEngine](file:///Users/bozoegg/Desktop/LUMI-NEW/src/core/abstracts/abstract-agent-engine.ts#L12), [AbstractSessionStore](file:///Users/bozoegg/Desktop/LUMI-NEW/src/core/abstracts/abstract-session-store.ts#L7), [AbstractHands](file:///Users/bozoegg/Desktop/LUMI-NEW/src/core/abstracts/abstract-hands.ts#L9), [AbstractEars](file:///Users/bozoegg/Desktop/LUMI-NEW/src/core/abstracts/abstract-ears.ts#L4), [AbstractToolRegistry](file:///Users/bozoegg/Desktop/LUMI-NEW/src/core/abstracts/abstract-tool-registry.ts#L6)).
- **Subsystem Tree Hierarchy**:
  - Organized into clean `base/` (foundational domain logic) and `extensions/` (specialized subclass mutations) subdirectories across every tier (`agents/`, `sessions/`, `tooling/`).
- **Production Package Capabilities (Osmosis Learned)**:
  - **Line-Anchored Delta Edits (`hashline`)**: Target line content hash verification (`applyAnchoredEdit`) preventing line drift errors.
  - **Type-Safe Schema Parameter Validation (`omptype`)**: Runtime schema validation (`validateToolArgs`) enforcing parameter types before tool execution.
  - **JSON-RPC Protocol Envelope Encoding (`protocol`)**: Standardized telemetry event notifications (`formatJsonRpcEvent`).
  - **File-System Session Persistence (`session-backends`)**: Turn history serialization to disk (`saveToFile` / `loadFromFile`).
- **Strict Class Cap**: Exactly 5 orchestrating classes per tier directory.

---

## Subsystem Tree Layout

```
src/
├── core/                                # Core Contracts & Abstract Subsystems (DIP)
│   ├── contracts/                       # Interfaces & State Snapshot Types
│   │   ├── agent.contracts.ts           # EngineTickInput, EngineTickResult, IAgentEngine
│   │   ├── session.contracts.ts         # GameStateSnapshot, SessionMessage, ISessionStore
│   │   └── tooling.contracts.ts         # IHands, IEars, IToolRegistry, AnchoredEditResult
│   └── abstracts/                       # Abstract Base Classes (Template Method)
│       ├── abstract-agent-engine.ts     # AbstractAgentEngine (Deterministic tick loop)
│       ├── abstract-session-store.ts    # AbstractSessionStore (Snapshot & rewind engine)
│       ├── abstract-hands.ts            # AbstractHands (Physics/mutation)
│       ├── abstract-ears.ts             # AbstractEars (Telemetry event output)
│       └── abstract-tool-registry.ts    # AbstractToolRegistry (Action dispatcher)
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
├── factories/                           # Game Engine Bootstrapper Container
│   └── monolith-factory.ts              # MonolithFactory
│
└── index.ts                             # Deterministic Engine Composition Root (LumiMonolith)
```

---

## Quick Start

### 1. Installation

```bash
# Hydrate workspace dependencies cleanly without lifecycle scripts
npm install --ignore-scripts
```

### 2. Type-Checking

```bash
# Verify TypeScript compilation (verbatimModuleSyntax compliant)
npm run check
```

### 3. Run Deterministic Engine Test

```bash
# Run the frame tick, snapshot, and rewind smoke test
npx tsx src/index.ts
```

---

## Programmatic Usage Guide

### Deterministic Frame Tick & Telemetry

```typescript
import { LumiMonolith } from "./src/index.js";

// Initialize the game engine monolith
const lumi = new LumiMonolith({
  cwd: process.cwd(),
});

// Subscribe to JSON-RPC 2.0 telemetry stream
lumi.ears.listen("turn_complete", (evt) => {
  const rpcEvent = lumi.ears.formatJsonRpcEvent(evt);
  console.log("[JSON-RPC Telemetry]", JSON.stringify(rpcEvent));
});

// Execute frame tick #1
const frame1 = await lumi.tick({ prompt: "remember: architecture = deterministic" });
console.log(`Frame #${frame1.frameIndex} (${frame1.durationMs}ms):`, frame1.response);
```

### Frame-Perfect Snapshot Capture & Rewind

```typescript
// 1. Create an immutable snapshot at Frame #1
const snapshot = lumi.createSnapshot();
console.log(`Captured Snapshot ID: ${snapshot.snapshotId}`);

// 2. Advance to Frame #2
await lumi.tick({ prompt: "view: package.json" });
console.log("Turns before rewind:", lumi.sessionStore.getMessages().length); // 4 messages

// 3. Rewind state to Snapshot #1
lumi.rewindToSnapshot(snapshot);
console.log("Frame after rewind:", lumi.sessionContext.turnCount); // 1
console.log("Turns after rewind:", lumi.sessionStore.getMessages().length); // 2 messages
```

### Line-Anchored Delta Edits (`hashline`)

```typescript
// Calculate expected hash for target line
const targetContent = "Line 2: Beta";
const lineHash = AnchoredHands.computeLineHash(targetContent);

// Apply edit with hash verification
const result = await lumi.hands.applyAnchoredEdit(
  "/path/to/file.txt",
  2,          // line number (1-indexed)
  lineHash,   // expected hash (e.g. 'h78ee7324')
  "Line 2: Beta (Evolved)"
);

if (result.success) {
  console.log("Anchored edit applied cleanly without line drift!");
}
```

### Sub-Millisecond Interactive Slash Commands

```typescript
// Intercept operational commands without calling model APIs
const statsRes = await lumi.runTurn("/stats");
console.log(statsRes.response); // Displays active model, turn metrics, token usage

const memoryRes = await lumi.runTurn("/memory");
console.log(memoryRes.response); // Displays persistent memory facts & KIs

const vfsRes = await lumi.runTurn("/vfs");
console.log(vfsRes.response); // Displays staged VFS file buffer diffs
```

---

## Architecture Decision Records (ADRs)

All core design decisions and evolution milestones are documented in the workspace wiki:

- [ADR-001: 3-Tier Monolithic Agent Architecture](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-001-3-tier-monolithic-agent-architecture.md)
- [ADR-002: Osmosis Evolution 1 - Context Compaction, Skill Ingestion & Prompt Composition](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-002-osmosis-evolution-compaction-skills-composition.md)
- [ADR-003: Osmosis Evolution 2 - Model Resolution, Session Branching & Execution Guardrails](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-003-osmosis-evolution-model-resolution-session-forking-guardrails.md)
- [ADR-004: Osmosis Evolution 3 - Virtual File Overlay, Interactive Slash Router & Performance Telemetry](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-004-osmosis-evolution-vfs-slash-routing-telemetry.md)
- [ADR-005: Osmosis Evolution 4 - Long-Term Memory Store, Autonomous Tool Chaining & Knowledge Persistence](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-005-osmosis-evolution-memory-store-tool-chaining-knowledge-persistence.md)
- [ADR-006: Osmosis Evolution 5 - Monorepo Package Absorption (`hashline`, `omptype`, `session-backends`, `protocol`)](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-006-osmosis-evolution-monorepo-package-absorption.md)
- [ADR-007: Explicit OOP Class Extension Hierarchy](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-007-oop-class-extension-hierarchy.md)
- [ADR-008: Deterministic Game Engine Architecture](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-008-deterministic-game-engine-architecture.md)
- [Wiki Landing Page](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/index.md) | [API Reference](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/agent/api-reference.md)
