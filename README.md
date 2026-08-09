<div align="center">

# ⚡ LUMI-NEW

### **Deterministic Game Engine Agent Framework**

*A high-performance, zero-bloat TypeScript agent framework built on SOLID principles, frame-perfect state snapshotting, and the Osmosis Learning Methodology.*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Architecture](https://img.shields.io/badge/Architecture-3--Tier%20Monolith-FF6B6B?style=for-the-badge)](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-001-3-tier-monolithic-agent-architecture.md)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

---

</div>

## 📌 Why LUMI-NEW?

Traditional AI agent frameworks suffer from **"framework soup"**—sprawling multi-package monorepos, uncoordinated async state drift, and un-reproducible turn execution.

**LUMI-NEW** re-imagines agent execution through the lens of a **Deterministic Game Engine**. Turns execute as frame-perfect steps (`tick()`), state transitions are captured in immutable snapshots (`GameStateSnapshot`), and sessions support frame-perfect rewind, replay, and isolated branching.

---

## ⚡ Comparison Matrix

| Feature | Legacy Agent Frameworks | LUMI-NEW Monolith |
|---|---|---|
| **Architecture** | 18+ Micro-packages (Over-engineered) | **3-Tier Monolith** (`agents`, `sessions`, `tooling`) |
| **Execution Loop** | Loose Async Event Handlers | **Deterministic Game Engine Tick Loop** (`tick()`) |
| **State Time Travel** | Impossible / Manual Log Parsing | **Frame-Perfect Snapshot Rewind** (`rewindToSnapshot()`) |
| **File Editing** | Drifting RegEx / Whole File Overwrites | **Line-Anchored Hash Verification** (`hashline`) |
| **Class Constraints** | Unlimited Class Proliferation | **Strict $\le 5$ Class Cap per Tier Directory** |
| **Schema Validation** | Ad-hoc / Missing Type Guards | **Built-in Schema Parameter Validator** (`omptype`) |
| **Telemetry** | Unstructured Console Logs | **Microsecond JSON-RPC 2.0 Streaming** (`protocol`) |

---

## 🏗️ Subsystem Architecture

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

```
src/
├── core/                                # Contracts & Abstract Base Classes (DIP)
│   ├── contracts/                       # Interfaces & Snapshot Types (agent, session, tooling)
│   └── abstracts/                       # Template Method Abstract Classes (AbstractAgentEngine, etc.)
├── agents/                              # Tier 1: Agents Subsystem (5 classes MAX)
│   ├── base/agent-config.ts             # AgentConfig
│   └── extensions/                      # PromptComposer, ModelResolver, AgentSlashRouter, AgentEngine
├── sessions/                            # Tier 2: Sessions Subsystem (5 classes MAX)
│   ├── base/session-context.ts          # SessionContext
│   └── extensions/                      # SessionCompactor, SessionVfs, SessionMemoryStore, PersistentSessionStore
├── tooling/                             # Tier 3: Tooling Subsystem (5 classes MAX)
│   ├── base/eyes.ts                     # Eyes (Input perception)
│   └── extensions/                      # SkillsIngestor, AnchoredHands, ProtocolEars, ValidatingToolRegistry
├── factories/                           # Game Engine Bootstrapper Container (MonolithFactory)
└── index.ts                             # Composition Root (LumiMonolith)
```

---

## 🧪 The Osmosis Learning Methodology

LUMI-NEW evolves continuously through **The Osmosis Learning Methodology**—a systematic strategy of studying production teacher models ([pi-main](file:///Users/bozoegg/Downloads/pi-main)), extracting core capabilities, discarding framework bloat, and reinferring features cleanly into the 3-tier monolith.

```
  ┌───────────────────────┐
  │  1. DEEP INSPECTION   │ Examine teacher packages and execution paths in pi-main.
  └───────────┬───────────┘
              │
              ▼
  ┌───────────────────────┐
  │ 2. REINTERPRET & FILTER│ Discard multi-agent queues, dynamic imports, and bloat.
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

> Read the full strategy guide in [The Osmosis Learning Methodology & Strategy Guide](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/agent/osmosis-methodology.md).

---

## 🚀 Quick Start

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/CardSorting/LUMI-NEW.git
cd LUMI-NEW

# Hydrate dependencies without running unreviewed lifecycle scripts
npm install --ignore-scripts
```

### 2. Type Verification

```bash
# Run TypeScript compilation check (verbatimModuleSyntax compliant)
npm run check
```

### 3. Run Deterministic Engine Smoke Test

```bash
# Execute tick loop, snapshot creation, and frame-perfect rewind verification
npx tsx src/index.ts
```

---

## 💻 Programmatic Usage Guide

### 1. Executing Deterministic Frame Ticks

```typescript
import { LumiMonolith } from "./src/index.js";

// Initialize the game engine monolith
const lumi = new LumiMonolith({
  cwd: process.cwd(),
});

// Subscribe to JSON-RPC 2.0 telemetry events
lumi.ears.listen("turn_complete", (evt) => {
  const rpcEvent = lumi.ears.formatJsonRpcEvent(evt);
  console.log("[JSON-RPC Telemetry]", JSON.stringify(rpcEvent));
});

// Execute frame tick #1
const frame1 = await lumi.tick({ prompt: "remember: engine = deterministic" });
console.log(`Frame #${frame1.frameIndex} (${frame1.durationMs}ms):`, frame1.response);
```

### 2. Frame-Perfect Snapshot Capture & State Rewind

```typescript
// 1. Capture an immutable snapshot at Frame #1
const snapshot = lumi.createSnapshot();
console.log(`Captured Snapshot ID: ${snapshot.snapshotId}`);

// 2. Advance to Frame #2
await lumi.tick({ prompt: "view: package.json" });
console.log("Turn messages before rewind:", lumi.sessionStore.getMessages().length); // 4 messages

// 3. Rewind state to Snapshot #1
lumi.rewindToSnapshot(snapshot);
console.log("Frame index after rewind:", lumi.sessionContext.turnCount); // 1
console.log("Turn messages after rewind:", lumi.sessionStore.getMessages().length); // 2 messages
```

### 3. Line-Anchored Delta Edits (`hashline`)

```typescript
import { AnchoredHands } from "./src/tooling/extensions/hands.js";

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

### 4. Interactive Slash Commands

```typescript
// Intercept operational commands in sub-millisecond cycles
const statsRes = await lumi.runTurn("/stats");
console.log(statsRes.response); // Displays active model, turn metrics, token usage

const memoryRes = await lumi.runTurn("/memory");
console.log(memoryRes.response); // Displays persistent memory facts & Knowledge Items

const vfsRes = await lumi.runTurn("/vfs");
console.log(vfsRes.response); // Displays staged VFS file buffer diffs
```

---

## 📚 Architecture Decision Records (ADRs) & Wiki

All architectural milestones are fully documented in the workspace wiki:

- 📖 [Wiki Landing Page](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/index.md)
- 🧠 [The Osmosis Methodology Guide](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/agent/osmosis-methodology.md)
- 📋 [API Reference Guide](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/agent/api-reference.md)
- 📖 [ADR-001: 3-Tier Monolithic Agent Architecture](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-001-3-tier-monolithic-agent-architecture.md)
- 📖 [ADR-002: Context Compaction, Skill Ingestion & Prompt Composition](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-002-osmosis-evolution-compaction-skills-composition.md)
- 📖 [ADR-003: Model Resolution, Session Branching & Execution Guardrails](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-003-osmosis-evolution-model-resolution-session-forking-guardrails.md)
- 📖 [ADR-004: Virtual File Overlay, Interactive Slash Router & Performance Telemetry](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-004-osmosis-evolution-vfs-slash-routing-telemetry.md)
- 📖 [ADR-005: Long-Term Memory Store, Autonomous Tool Chaining & Knowledge Persistence](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-005-osmosis-evolution-memory-store-tool-chaining-knowledge-persistence.md)
- 📖 [ADR-006: Monorepo Package Absorption (`hashline`, `omptype`, `session-backends`, `protocol`)](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-006-osmosis-evolution-monorepo-package-absorption.md)
- 📖 [ADR-007: Explicit OOP Class Extension Hierarchy](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-007-oop-class-extension-hierarchy.md)
- 📖 [ADR-008: Deterministic Game Engine Architecture](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-008-deterministic-game-engine-architecture.md)

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.
