<div align="center">

# ⚡ LUMI-NEW

### **Deterministic Game Engine Agent Framework & Self-Mutating Substrate**

*A high-performance, zero-bloat TypeScript agent framework built on SOLID principles, frame-perfect state snapshotting, and the Osmosis Learning Methodology.*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Architecture](https://img.shields.io/badge/Architecture-3--Tier%20Monolith-FF6B6B?style=for-the-badge)](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-001-3-tier-monolithic-agent-architecture.md)
[![Whitepaper](https://img.shields.io/badge/Whitepaper-Osmosis%20Paradigm-00C853?style=for-the-badge)](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/whitepaper/OSMOSIS-WHITEPAPER.md)
[![Package Matrix](https://img.shields.io/badge/Package%20Matrix-1--to--1%20Mapping-FF9800?style=for-the-badge)](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/package-mappings/PACKAGE-MAPPING-MATRIX.md)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

---

</div>

## 📌 Executive Brief

Traditional AI agent frameworks suffer from **"framework soup"**—sprawling multi-package monorepos, uncoordinated async state drift, and static, un-evolving logic.

**LUMI-NEW** re-imagines agent execution as a **Self-Evolving Agent Substrate** operating inside a **Deterministic Game Engine**. Turns execute as frame-perfect steps (`tick()`), state transitions are captured in immutable snapshots (`GameStateSnapshot`), and the engine continuously mutates its own codebase through **The Osmosis Learning Methodology**.

> 📦 **Explore the 1-to-1 Package Mapping Matrix**: [True 1-to-1 Package Mapping Matrix: pi-main vs LUMI-NEW](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/package-mappings/PACKAGE-MAPPING-MATRIX.md)  
> 📄 **Read the Formal Whitepaper**: [Whitepaper: The Osmosis Paradigm & Self-Mutating Game Engine Agent Substrate](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/whitepaper/OSMOSIS-WHITEPAPER.md)

---

## ⚡ 1-to-1 Package Comparison Matrix

| Teacher Package in `pi-main` | Functional Role | LUMI-NEW Monolithic Equivalent | Status |
|---|---|---|---|
| `packages/hashline` | Anchored line delta editing | [AnchoredHands.applyAnchoredEdit()](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/hands.ts#L30) | **Absorbed** |
| `packages/omptype` | Schema parameter validation | [ValidatingToolRegistry.validateToolArgs()](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/tool-registry.ts#L22) | **Absorbed** |
| `packages/session-backends` | File session persistence (JSONL) | [PersistentSessionStore.saveToFile()](file:///Users/bozoegg/Desktop/LUMI-NEW/src/sessions/extensions/session-store.ts#L30) | **Absorbed** |
| `packages/protocol` | Telemetry event protocol | [ProtocolEars.formatJsonRpcEvent()](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/ears.ts#L24) | **Absorbed** |
| `packages/snapcompact` | History context compactor | [SessionCompactor.compact()](file:///Users/bozoegg/Desktop/LUMI-NEW/src/sessions/extensions/session-compactor.ts#L16) | **Absorbed** |
| `packages/telemetry` | Microsecond execution timing | [ProtocolEars.startTimer()](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/ears.ts#L12) / `.endTimer()` | **Absorbed** |
| `packages/coding-agent` | Agent engine turn loop | [AgentEngine](file:///Users/bozoegg/Desktop/LUMI-NEW/src/agents/extensions/agent-engine.ts#L18) & [LumiMonolith](file:///Users/bozoegg/Desktop/LUMI-NEW/src/index.ts#L57) | **Absorbed** |
| `packages/ai` | Model provider resolution | [ModelResolver](file:///Users/bozoegg/Desktop/LUMI-NEW/src/agents/extensions/model-resolver.ts#L13) | **Absorbed** |
| `packages/broccolidb` | Slab array memory store | Blueprint for Pass 6 | Planned |
| `packages/codemarie` | AST structural symbol search | Blueprint for Pass 7 | Planned |

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

---

## 📚 Whitepaper & Documentation Index

- 📦 [True 1-to-1 Package Mapping Matrix](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/package-mappings/PACKAGE-MAPPING-MATRIX.md)
- 📄 [Whitepaper: The Osmosis Paradigm](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/whitepaper/OSMOSIS-WHITEPAPER.md)
- 🧠 [The Osmosis Methodology & Handoff Guide](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/agent/osmosis-methodology.md)
- 📖 [Wiki Landing Page](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/index.md)
- 📋 [API Reference Guide](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/agent/api-reference.md)
- 📖 [ADR Index & Decision Records](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/README.md)

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.
