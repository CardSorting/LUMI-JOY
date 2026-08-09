<div align="center">

# ⚡ LUMI-NEW

### **Deterministic Game Engine Agent Framework & Self-Mutating Substrate**

*A high-performance, zero-bloat TypeScript agent framework built on SOLID principles, frame-perfect state snapshotting, and the Osmosis Learning Methodology.*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Architecture](https://img.shields.io/badge/Architecture-3--Tier%20Monolith-FF6B6B?style=for-the-badge)](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-001-3-tier-monolithic-agent-architecture.md)
[![Whitepaper](https://img.shields.io/badge/Whitepaper-Osmosis%20Paradigm-00C853?style=for-the-badge)](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/whitepaper/OSMOSIS-WHITEPAPER.md)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

---

</div>

## 📌 Executive Brief

Traditional AI agent frameworks suffer from **"framework soup"**—sprawling multi-package monorepos, uncoordinated async state drift, and static, un-evolving logic.

**LUMI-NEW** re-imagines agent execution as a **Self-Evolving Agent Substrate** operating inside a **Deterministic Game Engine**. Turns execute as frame-perfect steps (`tick()`), state transitions are captured in immutable snapshots (`GameStateSnapshot`), and the engine continuously mutates its own codebase through **The Osmosis Learning Methodology**.

> 📄 **Read the Formal Whitepaper**: [Whitepaper: The Osmosis Paradigm & Self-Mutating Game Engine Agent Substrate](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/whitepaper/OSMOSIS-WHITEPAPER.md)

---

## ⚡ Comparison Matrix

| Feature | Legacy Agent Frameworks | LUMI-NEW Monolith |
|---|---|---|
| **Architecture** | 18+ Micro-packages (Over-engineered) | **3-Tier Monolith** (`agents`, `sessions`, `tooling`) |
| **Execution Loop** | Loose Async Event Handlers | **Deterministic Game Engine Tick Loop** (`tick()`) |
| **State Time Travel** | Impossible / Manual Log Parsing | **Frame-Perfect Snapshot Rewind** (`rewindToSnapshot()`) |
| **Evolution Model** | Static / Manual Human Refactoring | **Self-Mutating Osmosis Learning Model** |
| **File Editing** | Drifting RegEx / Whole File Overwrites | **Line-Anchored Hash Verification** (`hashline`) |
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

---

## 🧪 The Osmosis Learning Methodology

LUMI-NEW evolves continuously through **The Osmosis Learning Methodology**—a systematic strategy of studying production teacher models ([pi-main](file:///Users/bozoegg/Downloads/pi-main)), extracting core capabilities, discarding framework bloat through a semi-permeable filter, and reinferring features cleanly into the 3-tier monolith.

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

---

## 📚 Whitepaper & Documentation Index

- 📄 [Whitepaper: The Osmosis Paradigm](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/whitepaper/OSMOSIS-WHITEPAPER.md)
- 🧠 [The Osmosis Methodology & Handoff Guide](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/agent/osmosis-methodology.md)
- 📖 [Wiki Landing Page](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/index.md)
- 📋 [API Reference Guide](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/agent/api-reference.md)
- 📖 [ADR Index & Decision Records](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/README.md)

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.
