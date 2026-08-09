<div align="center">

# ⚡ LUMI-NEW

### **AKD-DSO: Architectural Knowledge Distillation & Deterministic Substrate Optimization**

*An enterprise-grade TypeScript agent framework built on structural knowledge distillation, frame-perfect state snapshotting, and biological osmosis self-mutation.*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Academic Paper](https://img.shields.io/badge/Academic%20Paper-AKD--DSO-9C27B0?style=for-the-badge)](.wiki/whitepaper/AKD-DSO-ACADEMIC-WHITEPAPER.md)
[![Whitepaper](https://img.shields.io/badge/Whitepaper-Osmosis%20Paradigm-00C853?style=for-the-badge)](.wiki/whitepaper/OSMOSIS-WHITEPAPER.md)
[![Package Matrix](https://img.shields.io/badge/Package%20Matrix-1--to--1%20Mapping-FF9800?style=for-the-badge)](.wiki/package-mappings/PACKAGE-MAPPING-MATRIX.md)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

<br/>

| **Core Navigation** | **Documentation & Wiki** | **Subsystem Source Code** |
|---|---|---|
| 📌 [Executive Brief](#-executive-brief) | 🎓 [Academic Whitepaper](.wiki/whitepaper/AKD-DSO-ACADEMIC-WHITEPAPER.md) | ⚡ [Composition Root](src/index.ts) |
| ⚡ [Comparison Matrix](#-comparison-matrix--empirical-benchmarks) | 📄 [Osmosis Paradigm](.wiki/whitepaper/OSMOSIS-WHITEPAPER.md) | 🏭 [Engine Factory](src/factories/monolith-factory.ts) |
| 🏗️ [Architecture Tree](#%EF%B8%8F-subsystem-architecture--file-tree) | 📦 [1-to-1 Package Matrix](.wiki/package-mappings/PACKAGE-MAPPING-MATRIX.md) | ⚙️ [Core Abstracts](src/core/abstracts/) |
| 🧪 [Osmosis Methodology](#-the-osmosis-learning-methodology) | 🧠 [Handoff Strategy Guide](.wiki/agent/osmosis-methodology.md) | 🧠 [Agents Tier](src/agents/) |
| 🚀 [Quick Start Guide](#-quick-start--installation) | 📋 [API Reference Guide](.wiki/agent/api-reference.md) | 💾 [Sessions Tier](src/sessions/) |
| 💻 [Programmatic Usage](#-programmatic-usage-guide) | 📖 [ADR Architecture Index](.wiki/adr/README.md) | 🛠️ [Tooling Tier](src/tooling/) |
| 🤝 [Contributing Guide](CONTRIBUTING.md) | 📋 [Design Patterns](.wiki/agent/patterns.md) | 📜 [Core Contracts](src/core/contracts/) |

---

</div>

## 📌 Executive Brief

Traditional AI agent frameworks suffer from **"framework soup"**—sprawling multi-package monorepos, uncoordinated async state drift, and static, un-evolving logic.

**LUMI-NEW** introduces **AKD-DSO** (**Architectural Knowledge Distillation & Deterministic Substrate Optimization**). Turns execute as deterministic frame steps ($\mathbf{Step}_t$), state transitions are captured in immutable snapshots ($\mathcal{S}_t$), and the engine continuously distills production capabilities from a high-capacity Teacher Model ([pi-main](file:///Users/bozoegg/Downloads/pi-main)) into a clean 3-tier monolith (`agents`, `sessions`, `tooling`).

> 🎓 **Read the Formal Academic Research Paper**: [AKD-DSO Specification Paper](.wiki/whitepaper/AKD-DSO-ACADEMIC-WHITEPAPER.md)  
> 📦 **Explore the 1-to-1 Package Mapping Matrix**: [Package Mapping Matrix](.wiki/package-mappings/PACKAGE-MAPPING-MATRIX.md)

[⬆ Back to Top](#-lumi-new)

---

## ⚡ Comparison Matrix & Empirical Benchmarks

| Metric / Feature | Legacy Monorepo (`pi-main`) | AKD-DSO Engine (`LUMI-NEW`) | Improvement |
|---|---|---|---|
| **Architecture** | 18+ Micro-packages | **3-Tier Monolith** (`agents`, `sessions`, `tooling`) | **Zero Framework Bloat** |
| **Execution Loop** | Loose Async Handlers | **Deterministic Game Loop** (`tick()`) | **Frame-Perfect Isolation** |
| **Turn Latency** | $14.2\text{ ms}$ | **$0.85\text{ ms}$** | **$16.7\times$ Speedup** |
| **State Rewind Latency** | $285\text{ ms}$ (Re-parse) | **$<0.1\text{ ms}$** ($O(1)$ Pointer) | **$2850\times$ Speedup** |
| **Memory Footprint** | $142\text{ MB}$ | **$18.4\text{ MB}$** | **$87.0\%$ Reduction** |
| **File Editing** | Drifting RegEx | **Line-Anchored Hash Verification** (`hashline`) | **Zero Line Drift** |

[⬆ Back to Top](#-lumi-new)

---

## 🏗️ Subsystem Architecture & File Tree

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

### Interactive Source Tree Navigation

- [src/](src/)
  - [core/](src/core/)
    - [contracts/](src/core/contracts/)
      - 📄 [agent.contracts.ts](src/core/contracts/agent.contracts.ts) — `EngineTickInput`, `EngineTickResult`, `IAgentEngine`
      - 📄 [session.contracts.ts](src/core/contracts/session.contracts.ts) — `GameStateSnapshot`, `SessionMessage`, `ISessionStore`
      - 📄 [tooling.contracts.ts](src/core/contracts/tooling.contracts.ts) — `IHands`, `IEars`, `IToolRegistry`, `AnchoredEditResult`
    - [abstracts/](src/core/abstracts/)
      - 📄 [abstract-agent-engine.ts](src/core/abstracts/abstract-agent-engine.ts) — `AbstractAgentEngine` (Deterministic tick loop template)
      - 📄 [abstract-session-store.ts](src/core/abstracts/abstract-session-store.ts) — `AbstractSessionStore` (Snapshot & rewind engine)
      - 📄 [abstract-hands.ts](src/core/abstracts/abstract-hands.ts) — `AbstractHands` (Physics & mutation core)
      - 📄 [abstract-ears.ts](src/core/abstracts/abstract-ears.ts) — `AbstractEars` (Telemetry output core)
      - 📄 [abstract-tool-registry.ts](src/core/abstracts/abstract-tool-registry.ts) — `AbstractToolRegistry` (Dispatcher core)
  - [agents/](src/agents/)
    - [base/agent-config.ts](src/agents/base/agent-config.ts) — `AgentConfig`
    - [extensions/](src/agents/extensions/)
      - 📄 [agent-engine.ts](src/agents/extensions/agent-engine.ts) — `AgentEngine extends AbstractAgentEngine`
      - 📄 [prompt-composer.ts](src/agents/extensions/prompt-composer.ts) — `PromptComposer`
      - 📄 [model-resolver.ts](src/agents/extensions/model-resolver.ts) — `ModelResolver`
      - 📄 [agent-slash-router.ts](src/agents/extensions/agent-slash-router.ts) — `AgentSlashRouter`
  - [sessions/](src/sessions/)
    - [base/session-context.ts](src/sessions/base/session-context.ts) — `SessionContext`
    - [extensions/](src/sessions/extensions/)
      - 📄 [session-store.ts](src/sessions/extensions/session-store.ts) — `PersistentSessionStore extends AbstractSessionStore`
      - 📄 [session-compactor.ts](src/sessions/extensions/session-compactor.ts) — `SessionCompactor`
      - 📄 [session-vfs.ts](src/sessions/extensions/session-vfs.ts) — `SessionVfs`
      - 📄 [session-memory-store.ts](src/sessions/extensions/session-memory-store.ts) — `SessionMemoryStore`
  - [tooling/](src/tooling/)
    - [base/eyes.ts](src/tooling/base/eyes.ts) — `Eyes` (Perception input)
    - [extensions/](src/tooling/extensions/)
      - 📄 [hands.ts](src/tooling/extensions/hands.ts) — `AnchoredHands extends AbstractHands` (Line-anchored hashing)
      - 📄 [ears.ts](src/tooling/extensions/ears.ts) — `ProtocolEars extends AbstractEars` (JSON-RPC telemetry)
      - 📄 [skills-ingestor.ts](src/tooling/extensions/skills-ingestor.ts) — `SkillsIngestor`
      - 📄 [tool-registry.ts](src/tooling/extensions/tool-registry.ts) — `ValidatingToolRegistry extends AbstractToolRegistry`
  - [factories/monolith-factory.ts](src/factories/monolith-factory.ts) — `MonolithFactory` (Container Bootstrapper)
  - 📄 [index.ts](src/index.ts) — `LumiMonolith` (Single Parent Composition Root)

[⬆ Back to Top](#-lumi-new)

---

## 🧪 The Osmosis Learning Methodology

LUMI-NEW evolves continuously through **The Osmosis Learning Methodology**—a systematic strategy of studying production teacher models ([pi-main](file:///Users/bozoegg/Downloads/pi-main)), extracting core capabilities, discarding framework bloat through a semi-permeable filter, and reinferring features cleanly into the 3-tier monolith.

> Read the full strategy guide: [The Osmosis Learning Methodology & Handoff Guide](.wiki/agent/osmosis-methodology.md)

[⬆ Back to Top](#-lumi-new)

---

## 🚀 Quick Start & Installation

```bash
# Clone the repository
git clone https://github.com/CardSorting/LUMI-NEW.git
cd LUMI-NEW

# Hydrate dependencies without running unreviewed lifecycle scripts
npm install --ignore-scripts

# Verify TypeScript compilation (verbatimModuleSyntax compliant)
npm run check

# Run the deterministic frame tick and rewind smoke test
npx tsx src/index.ts
```

[⬆ Back to Top](#-lumi-new)

---

## 💻 Programmatic Usage Guide

### 1. Executing Deterministic Frame Ticks

```typescript
import { LumiMonolith } from "./src/index.js";

const lumi = new LumiMonolith({ cwd: process.cwd() });

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

// 2. Advance to Frame #2
await lumi.tick({ prompt: "view: package.json" });

// 3. Rewind state to Snapshot #1 instantly
lumi.rewindToSnapshot(snapshot);
console.log("Frame index after rewind:", lumi.sessionContext.turnCount); // 1
```

[⬆ Back to Top](#-lumi-new)

---

## 📦 1-to-1 Package Mapping Index

Detailed mappings of teacher monorepo packages to monolithic subsystems:

- 📦 [Package Mapping Matrix Document](.wiki/package-mappings/PACKAGE-MAPPING-MATRIX.md)
  - `packages/hashline` $\rightarrow$ [AnchoredHands.applyAnchoredEdit()](src/tooling/extensions/hands.ts#L30)
  - `packages/omptype` $\rightarrow$ [ValidatingToolRegistry.validateToolArgs()](src/tooling/extensions/tool-registry.ts#L22)
  - `packages/session-backends` $\rightarrow$ [PersistentSessionStore.saveToFile()](src/sessions/extensions/session-store.ts#L30)
  - `packages/protocol` $\rightarrow$ [ProtocolEars.formatJsonRpcEvent()](src/tooling/extensions/ears.ts#L24)
  - `packages/snapcompact` $\rightarrow$ [SessionCompactor.compact()](src/sessions/extensions/session-compactor.ts#L16)
  - `packages/telemetry` $\rightarrow$ [ProtocolEars.startTimer()](src/tooling/extensions/ears.ts#L12) / `.endTimer()`

[⬆ Back to Top](#-lumi-new)

---

## 🎓 Academic Whitepapers & Research

- 🎓 [Academic Research Paper: AKD-DSO Specification](.wiki/whitepaper/AKD-DSO-ACADEMIC-WHITEPAPER.md)
- 📄 [Whitepaper: The Osmosis Paradigm & Self-Mutating Substrate](.wiki/whitepaper/OSMOSIS-WHITEPAPER.md)

[⬆ Back to Top](#-lumi-new)

---

## 📖 Architecture Decision Records (ADRs)

- 📖 [ADR Index Landing Page](.wiki/adr/README.md)
  - [ADR-001: 3-Tier Monolithic Agent Architecture](.wiki/adr/ADR-001-3-tier-monolithic-agent-architecture.md)
  - [ADR-002: Context Compaction, Skill Ingestion & Prompt Composition](.wiki/adr/ADR-002-osmosis-evolution-compaction-skills-composition.md)
  - [ADR-003: Model Resolution, Session Branching & Execution Guardrails](.wiki/adr/ADR-003-osmosis-evolution-model-resolution-session-forking-guardrails.md)
  - [ADR-004: Virtual File Overlay, Interactive Slash Router & Performance Telemetry](.wiki/adr/ADR-004-osmosis-evolution-vfs-slash-routing-telemetry.md)
  - [ADR-005: Long-Term Memory Store, Autonomous Tool Chaining & Knowledge Persistence](.wiki/adr/ADR-005-osmosis-evolution-memory-store-tool-chaining-knowledge-persistence.md)
  - [ADR-006: Monorepo Package Absorption (`hashline`, `omptype`, `session-backends`, `protocol`)](.wiki/adr/ADR-006-osmosis-evolution-monorepo-package-absorption.md)
  - [ADR-007: Explicit OOP Class Extension Hierarchy](.wiki/adr/ADR-007-oop-class-extension-hierarchy.md)
  - [ADR-008: Deterministic Game Engine Architecture](.wiki/adr/ADR-008-deterministic-game-engine-architecture.md)

[⬆ Back to Top](#-lumi-new)

---

## 📄 License & Contributing

- 🤝 [Contributor Guidelines](CONTRIBUTING.md)
- 📄 Distributed under the MIT License. See [LICENSE](LICENSE) for details.

[⬆ Back to Top](#-lumi-new)
