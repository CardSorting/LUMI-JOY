# Changelog

All notable changes to the **LUMI-NEW** Deterministic Game Engine Agent Framework will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to Semantic Versioning and conventional commit standards.

---

## [Unreleased]

### Added (Pass 6)
- **Zero-GC Substrate Memory Allocation (`broccolidb`)**: Added `ArenaAllocator` ([arena-allocator.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/sessions/extensions/substrate/arena-allocator.ts)) contiguous 16MB ArrayBuffer slab allocation inside `PersistentSessionStore` ([session-store.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/sessions/extensions/persistence/session-store.ts)) and published `ADR-009`.

### Added (Pass 7)
- **AST Symbol Perception (`codemarie`)**: Added `AstPerceptionEyes.searchSymbols()` ([ast-eyes.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/perception/ast-eyes.ts)) for fast structural code symbol searching (`class`, `function`, `interface`, `type`, `enum`, `const`) and published `ADR-010`.

### Added (Pass 8)
- **Terminal Progress Renderer (`tui` & `client`)**: Added `ProgressStreamingEars` and `TerminalProgressRenderer` ([progress-ears.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/progress/progress-ears.ts)) for streaming JSON-RPC `telemetry/progress` notifications and published `ADR-011`.

### Added (Pass 13)
- **Workspace Intelligence Engine (`codemarie`)**: Added `WorkspaceIntelligenceEngine` ([workspace-intelligence.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/agents/extensions/intelligence/workspace-intelligence.ts)) for package identity indexing, workspace topology analysis, and cognitive graph snapshot generation (`ADR-017`).

### Added (Passes 103–105 / Phase 31 Evolution)
- **OpenAI Codex OAuth Manager (`packages/codemarie`)**: Added `CodexOAuthManager` ([codex-oauth-manager.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/agents/extensions/resolution/codex-oauth-manager.ts)) for PKCE authorization URL generation, token exchange, automatic token refresh, and `ChatGPT-Account-Id` claims extraction (`ADR-048`).
- **Codex Provider Bridge (`packages/codemarie`)**: Added `CodexProviderBridge` ([codex-provider-bridge.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/agents/extensions/resolution/codex-provider-bridge.ts)) for identifying Codex model provider families and injecting Bearer OAuth access tokens & `ChatGPT-Account-Id` headers alongside standard API key providers (`ADR-048`).
- **Monolith Phase 31 Master Subsystem Synthesis**: Completed 105-pass master synthesis verification suite confirming total OpenAI Codex OAuth & provider bridge feature absorption with zero-barrel OOP class extension (`ADR-048`).

### Added (ADR-012 Architecture)
- **Non-Destructive Extension & Mutation Directory Architecture**: Organized extension classes into domain-scoped mutation subdirectories (`compaction/`, `resolution/`, `execution/`, `substrate/`, `persistence/`, `memory/`, `vfs/`, `perception/`, `progress/`, `telemetry/`, `hashline/`, `registry/`, `mentions/`) and removed legacy flat barrel files (`ADR-012`).

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
