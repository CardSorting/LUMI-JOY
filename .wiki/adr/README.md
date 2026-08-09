# Architecture Decision Records (ADRs)

This index lists all Architecture Decision Records (ADRs) for the LUMI-NEW workspace.

## Active ADR Index

| ADR ID | Title | Status | Date | Core Domain |
|---|---|---|---|---|
| [ADR-001](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-001-3-tier-monolithic-agent-architecture.md) | 3-Tier Monolithic Agent Architecture | Accepted | 2026-08-09 | System Architecture |
| [ADR-002](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-002-osmosis-evolution-compaction-skills-composition.md) | Osmosis Evolution 1 - Context Compaction, Skill Ingestion & Prompt Composition | Accepted | 2026-08-09 | Feature Evolution |
| [ADR-003](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-003-osmosis-evolution-model-resolution-session-forking-guardrails.md) | Osmosis Evolution 2 - Model Resolution, Session Branching & Execution Guardrails | Accepted | 2026-08-09 | Feature Evolution |
| [ADR-004](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-004-osmosis-evolution-vfs-slash-routing-telemetry.md) | Osmosis Evolution 3 - Virtual File Overlay, Interactive Slash Router & Performance Telemetry | Accepted | 2026-08-09 | Feature Evolution |
| [ADR-005](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-005-osmosis-evolution-memory-store-tool-chaining-knowledge-persistence.md) | Osmosis Evolution 4 - Long-Term Memory Store, Autonomous Tool Chaining & Knowledge Persistence | Accepted | 2026-08-09 | Feature Evolution |
| [ADR-006](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-006-osmosis-evolution-monorepo-package-absorption.md) | Osmosis Evolution 5 - Monorepo Package Absorption (`hashline`, `omptype`, `session-backends`, `protocol`) | Accepted | 2026-08-09 | Feature Evolution |
| [ADR-007](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-007-oop-class-extension-hierarchy.md) | Explicit OOP Class Extension Hierarchy | Accepted | 2026-08-09 | Architectural Patterns |
| [ADR-008](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-008-deterministic-game-engine-architecture.md) | Deterministic Game Engine Architecture | Accepted | 2026-08-09 | Game Engine Architecture |
| [ADR-009](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-009-zero-gc-substrate-memory-allocation.md) | Zero-GC Substrate Memory Allocation (`broccolidb`) | Accepted | 2026-08-09 | Substrate Memory Allocation |
| [ADR-010](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-010-ast-symbol-perception.md) | AST Symbol Perception (`codemarie`) | Accepted | 2026-08-09 | Tooling & Symbol Perception |
| [ADR-011](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-011-terminal-progress-renderer.md) | Terminal Progress Renderer (`tui` & `client`) | Accepted | 2026-08-09 | Terminal Progress Telemetry |
| [ADR-012](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-012-non-destructive-osmosis-class-extension-strategy.md) | Non-Destructive Osmosis Class Extension Strategy | Accepted | 2026-08-09 | Architectural Governance |
| [ADR-013](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-013-workspace-mention-resolution.md) | Workspace Mention Resolution (`codemarie`) | Accepted | 2026-08-09 | Context & Mention Resolution |
| [ADR-014](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-014-zombie-symbol-module-decomposition.md) | Zombie Symbol & Module Decomposition (`codemarie`) | Accepted | 2026-08-09 | Policy & Symbol Audit |
| [ADR-015](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-015-swarm-subagent-task-delegation.md) | Swarm Subagent Task Delegation (`codemarie`) | Accepted | 2026-08-09 | Agent Swarm Delegation |
| [ADR-016](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-016-environment-integrity-forensic-healing.md) | Environment Integrity & Forensic Healing (`codemarie`) | Accepted | 2026-08-09 | Environment Integrity |

## Domain Grouping

### System Architecture & Game Engine Design
- **[ADR-001](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-001-3-tier-monolithic-agent-architecture.md)**: Greenfield 3-tier monolith (`agents`, `sessions`, `tooling`).
- **[ADR-007](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-007-oop-class-extension-hierarchy.md)**: Explicit class inheritance (`class Child extends Parent`) hierarchy.
- **[ADR-008](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-008-deterministic-game-engine-architecture.md)**: Deterministic Game Engine Architecture (`tick()`, `GameStateSnapshot`, rewind/replay).
- **[ADR-009](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-009-zero-gc-substrate-memory-allocation.md)**: Zero-GC Substrate Memory Allocation (`ArenaAllocator`, slab array buffer caching).
- **[ADR-010](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-010-ast-symbol-perception.md)**: AST Symbol Perception (`AstPerceptionEyes`, structural symbol indexing).
- **[ADR-011](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-011-terminal-progress-renderer.md)**: Terminal Progress Renderer (`ProgressStreamingEars`, `TerminalProgressRenderer`).
- **[ADR-012](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-012-non-destructive-osmosis-class-extension-strategy.md)**: Non-Destructive Class Extension & Additive Osmosis Strategy.

### Feature Evolution & Osmosis Learning
- **[ADR-002](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-002-osmosis-evolution-compaction-skills-composition.md)**: Context compaction, skill discovery, and prompt composition.
- **[ADR-003](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-003-osmosis-evolution-model-resolution-session-forking-guardrails.md)**: Model fallback resolution, session forking/branching, and execution stream guardrails.
- **[ADR-004](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-004-osmosis-evolution-vfs-slash-routing-telemetry.md)**: Virtual File System diff overlays, interactive slash command routing, and microsecond telemetry.
- **[ADR-005](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-005-osmosis-evolution-memory-store-tool-chaining-knowledge-persistence.md)**: Long-term memory store, autonomous multi-step tool chaining, and knowledge persistence.
- **[ADR-006](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-006-osmosis-evolution-monorepo-package-absorption.md)**: Line-anchored delta edits (`hashline`), schema parameter validation (`omptype`), file session backends (`session-backends`), and protocol envelope formatting (`protocol`).
