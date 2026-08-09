# Changelog

All notable changes to the **LUMI-NEW** Deterministic Game Engine Agent Framework will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to Semantic Versioning and conventional commit standards.

---

## [Unreleased]

### Planned (Pass 6)
- **Zero-GC Substrate Memory Allocation (`broccolidb`)**: Pre-allocated slab array buffer caching in `PersistentSessionStore` to eliminate V8 garbage collection pauses during multi-turn LLM agent execution loops.

---

## [0.1.0] - 2026-08-09

### Added
- **AKD-DSO Paradigm & Formal Whitepaper**: Published formal academic specification paper ([AKD-DSO-ACADEMIC-WHITEPAPER.md](.wiki/whitepaper/AKD-DSO-ACADEMIC-WHITEPAPER.md)) detailing Architectural Knowledge Distillation ($\mathcal{L}_{\text{AKD}}$) and Deterministic Substrate Optimization ($\mathbf{Step}_t$).
- **Deterministic Game Engine Execution Loop**: Implemented `tick(input: EngineTickInput)` in `AbstractAgentEngine` ([abstract-agent-engine.ts](src/core/abstracts/abstract-agent-engine.ts#L12)) and `AgentEngine` ([agent-engine.ts](src/agents/extensions/agent-engine.ts#L18)).
- **Immutable State Snapshotting & Frame Rewind**: Implemented `createSnapshot()` and `rewindToSnapshot()` in `PersistentSessionStore` ([session-store.ts](src/sessions/extensions/session-store.ts#L14)) with $O(1)$ zero-drift state time travel.
- **Dependency Inversion Core Contracts & Abstracts**: Added `src/core/contracts/` (`agent`, `session`, `tooling`) and `src/core/abstracts/` (`AbstractAgentEngine`, `AbstractSessionStore`, `AbstractHands`, `AbstractEars`, `AbstractToolRegistry`).
- **Container Factory Composition**: Added `MonolithFactory` ([monolith-factory.ts](src/factories/monolith-factory.ts#L18)) for clean engine bootstrapping and session forking.
- **Line-Anchored Hash Editing (`hashline`)**: Added `AnchoredHands.applyAnchoredEdit()` ([hands.ts](src/tooling/extensions/hands.ts#L30)) with native bitwise hash calculation (`computeLineHash`).
- **Type-Safe Tool Schema Validation (`omptype`)**: Added `ValidatingToolRegistry.validateToolArgs()` ([tool-registry.ts](src/tooling/extensions/tool-registry.ts#L22)) to enforce argument parameter types prior to tool execution.
- **JSON-RPC 2.0 Telemetry Stream (`protocol`)**: Added `ProtocolEars.formatJsonRpcEvent()` ([ears.ts](src/tooling/extensions/ears.ts#L24)) for streaming performance telemetry notifications.
- **File System Session Persistence (`session-backends`)**: Added `PersistentSessionStore.saveToFile()` and `.loadFromFile()` ([session-store.ts](src/sessions/extensions/session-store.ts#L30)).
- **Long-Term Memory Fact & KI Store**: Added `SessionMemoryStore` ([session-memory-store.ts](src/sessions/extensions/session-memory-store.ts#L8)) and tools `search_memory` & `save_memory`.
- **In-Memory Virtual File System Overlay**: Added `SessionVfs` ([session-vfs.ts](src/sessions/extensions/session-vfs.ts#L10)) for staging file diff overlays prior to disk commit.
- **Interactive Slash Command Router**: Added `AgentSlashRouter` ([agent-slash-router.ts](src/agents/extensions/agent-slash-router.ts#L24)) supporting sub-millisecond `/stats`, `/vfs`, `/memory`, `/skills`, `/models`, `/compact`, and `/clear` commands.

### Changed
- **Directory Hierarchy Restructuring**: Re-organized 3-tier monolith into `base/` (foundational domain types) and `extensions/` (subclass mutations) subdirectories across `src/agents/`, `src/sessions/`, and `src/tooling/`.
- **Organic Tier Expansion**: Relaxed fixed 5-class cap restriction to allow organic subsystem class growth modeling the Game Engine strategy.

### Removed
- Removed flat file structures in `src/agents/`, `src/sessions/`, and `src/tooling/` in favor of structured `base/` and `extensions/` directories.
