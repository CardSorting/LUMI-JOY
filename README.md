<div align="center">

# ⚡ LUMI-NEW

### **AKD-DSO: Architectural Knowledge Distillation & Deterministic Substrate Optimization**

*An enterprise-grade TypeScript agent framework built on structural knowledge distillation, frame-perfect state snapshotting, and biological osmosis self-mutation.*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Academic Paper](https://img.shields.io/badge/Academic%20Paper-AKD--DSO-9C27B0?style=for-the-badge)](.wiki/whitepaper/AKD-DSO-ACADEMIC-WHITEPAPER.md)
[![Whitepaper](https://img.shields.io/badge/Whitepaper-Osmosis%20Paradigm-00C853?style=for-the-badge)](.wiki/whitepaper/OSMOSIS-WHITEPAPER.md)
[![Auto-Rolling Roadmap](https://img.shields.io/badge/Roadmap-Auto--Rolling-E91E63?style=for-the-badge)](.wiki/roadmap/AUTOROLLING-ROADMAP.md)
[![Package Matrix](https://img.shields.io/badge/Package%20Matrix-1--to--1%20Mapping-FF9800?style=for-the-badge)](.wiki/package-mappings/PACKAGE-MAPPING-MATRIX.md)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

<br/>

| **Core Navigation** | **Documentation & Wiki** | **Subsystem Source Code** |
|---|---|---|
| 📌 [Executive Brief](#-executive-brief) | 🚀 [Auto-Rolling Roadmap](.wiki/roadmap/AUTOROLLING-ROADMAP.md) | ⚡ [Composition Root](src/index.ts) |
| ⚡ [Comparison Matrix](#-comparison-matrix--empirical-benchmarks) | 🎓 [Academic Whitepaper](.wiki/whitepaper/AKD-DSO-ACADEMIC-WHITEPAPER.md) | 🏭 [Engine Factory](src/factories/monolith-factory.ts) |
| 🏗️ [Architecture Tree](#%EF%B8%8F-subsystem-architecture--file-tree) | 📦 [1-to-1 Package Matrix](.wiki/package-mappings/PACKAGE-MAPPING-MATRIX.md) | ⚙️ [Core Abstracts](src/core/abstracts/) |
| 🧪 [Osmosis Methodology](#-the-osmosis-learning-methodology) | 🧠 [Handoff Strategy Guide](.wiki/agent/osmosis-methodology.md) | 🧠 [Agents Tier](src/agents/) |
| 🚀 [Quick Start Guide](#-quick-start--installation) | 📋 [API Reference Guide](.wiki/agent/api-reference.md) | 💾 [Sessions Tier](src/sessions/) |
| 📡 [Live Activity Streaming](#-live-agent-activity-streaming) | 📡 [Streaming Strategy](.wiki/agent/streaming-activity-strategy.md) | 🖥️ [TUI Components](src/tui/components/) |
| 🤝 [Contributing Guide](CONTRIBUTING.md) | 📋 [Workspace Changelog](CHANGELOG.md) | 📜 [Core Contracts](src/core/contracts/) |

---

</div>

## 📌 Executive Brief

Traditional AI agent frameworks suffer from **"framework soup"**—sprawling multi-package monorepos, uncoordinated async state drift, and static, un-evolving logic.

**LUMI-NEW** introduces **AKD-DSO** (**Architectural Knowledge Distillation & Deterministic Substrate Optimization**). Turns execute as deterministic frame steps ($\mathbf{Step}_t$), state transitions are captured in immutable snapshots ($\mathcal{S}_t$), and the engine continuously distills production capabilities from a high-capacity Teacher Model ([pi-main](file:///Users/bozoegg/Downloads/pi-main)) into a clean 3-tier monolith (`agents`, `sessions`, `tooling`).

> 🚀 **Explore the Auto-Rolling Roadmap**: [Auto-Rolling Evolution Roadmap](.wiki/roadmap/AUTOROLLING-ROADMAP.md)  
> 🎓 **Read the Formal Academic Research Paper**: [AKD-DSO Specification Paper](.wiki/whitepaper/AKD-DSO-ACADEMIC-WHITEPAPER.md)  
> 🌅 **Read Philosophy Brief**: [The Next Step Forward — Reframing Agent Architecture](.wiki/philosophy/THE-NEXT-STEP-PHILOSOPHY.md)  
> 📊 **Read Comprehensive Benchmark Field Note**: [Benchmark Performance Field Note](.wiki/field-notes/BENCHMARK-PERFORMANCE-FIELD-NOTE.md)  
> 🛡️ **Anti-Patent-Troll Pledge & Prior-Art Specification**: [Defensive Patent Pledge](PATENT-NON-AGGRESSION-PLEDGE.md) | [Prior-Art Claims](.wiki/ip/DEFENSIVE-PRIOR-ART-CLAIMS.md)  
> 📦 **Explore the 1-to-1 Package Mapping Matrix**: [Package Mapping Matrix](.wiki/package-mappings/PACKAGE-MAPPING-MATRIX.md)
> 📡 **Understand Live Agent Activity**: [Agent Activity Streaming Strategy](.wiki/agent/streaming-activity-strategy.md) | [ADR-082](.wiki/adr/ADR-082-structured-agent-activity-streaming.md)

---

## ⚡ Comparison Matrix & Empirical Benchmarks

| Metric / Feature | Legacy Monorepo (`pi-main`) | AKD-DSO Engine (`LUMI-NEW`) | Underlying Mechanism / Speedup |
|---|---|---|---|
| **Architecture** | 18+ Micro-packages | **3-Tier Monolith** (`agents`, `sessions`, `tooling`) | **Zero Framework Bloat** |
| **Execution Loop** | Loose Async Handlers | **Deterministic Game Loop** (`tick()`) | **Frame-Perfect Isolation** |
| **Mean Turn Latency** | $14.20\text{ ms}$ | **$0.22\text{ ms}$** | Direct function dispatch replacing IPC/RPC queues (**$64.5\times$ Speedup**). |
| **Execution Throughput** | $70.4\text{ turns/sec}$ | **$4,132.2\text{ turns/sec}$** ($247.9k\text{ tpm}$) | Direct function dispatch replacing async network queues (**$58.7\times$ Boost**). |
| **State Rewind Latency** | $285.00\text{ ms}$ (Re-parse) | **$0.04\text{ ms}$** ($O(1)$ Pointer) | Replaced JSON re-parsing with $O(1)$ pointer assignment (**$7,125\times$ Speedup**). |
| **VFS Perception Speed** | $12.40\text{ ms}$ (Disk I/O) | **$0.03\text{ ms}$** | In-memory contiguous VFS overlay inspection (**$413.3\times$ Speedup**). |
| **Memory Allocation** | Dynamic Heap GC Sweep | **16MB Zero-GC Slab** | Pre-allocated slab eliminates Garbage Collection sweeps. |
| **Canvas Game Synthesis** | N/A (Seconds) | **$0.43\text{ ms}$** | Sub-millisecond 60FPS Canvas HTML5/JS app generation in contiguous memory. |

### 🛠️ Run Automated Benchmarks
```bash
# Run automated engine benchmark & throughput evaluation suite
lumi --benchmark

# Run interactive setup wizard (Model Providers & Codex OAuth)
lumi --setup
```

---

## 🏗️ Subsystem Architecture & File Tree

```
src/
├── core/
│   ├── contracts/                         # System Interfaces & GameStateSnapshot
│   ├── abstracts/                         # Abstract Base Classes (DIP)
│   └── utilities/                         # Shared progress credential sanitizer
│
├── agents/                                # Tier 1: Agents Subsystem
│   ├── base/                              # Agent Base Config
│   └── extensions/                        # Domain Mutation Subdirectories
│       ├── compaction/                    # prompt-composer.ts
│       ├── resolution/                    # model-resolver.ts, agent-slash-router.ts, model-catalog.ts
│       ├── execution/                     # agent-engine.ts, Codex progress adapter, interactive controller
│       ├── mentions/                      # mention-resolver.ts (Pass 9)
│       ├── swarm/                         # agent-swarm-dispatcher.ts (Pass 11)
│       └── intelligence/                  # workspace-intelligence.ts (Pass 13)
│
├── sessions/                              # Tier 2: Sessions Subsystem
│   ├── base/                              # Session Context Base
│   └── extensions/                        # Domain Mutation Subdirectories
│       ├── substrate/                     # arena-allocator.ts, file-lock.ts (Pass 20)
│       ├── persistence/                   # session-store.ts
│       ├── memory/                        # session-memory-store.ts
│       ├── vfs/                           # session-vfs.ts
│       ├── compaction/                    # session-compactor.ts, snapcompact-engine.ts (Pass 15)
│       └── integrity/                     # stability-doctor.ts (Pass 12)
│
├── tooling/                               # Tier 3: Tooling Subsystem
│   ├── base/                              # eyes.ts
│   └── extensions/                        # Domain Mutation Subdirectories
│       ├── perception/                    # ast-eyes.ts
│       ├── progress/                      # progress-ears.ts
│       ├── telemetry/                     # ears.ts, telemetry-tracer.ts (Pass 19)
│       ├── hashline/                      # hands.ts
│       ├── registry/                      # skills-ingestor.ts, tool-registry.ts
│       ├── policy/                        # module-decomposer.ts (Pass 10)
│       ├── permissions/                   # command-permission-controller.ts (Pass 14)
│       ├── gateway/                       # monolith-gateway-server.ts (Pass 17)
│       └── evals/                         # benchmark-evaluator.ts (Pass 18)
│
├── factories/                             # Engine Monolith Bootstrapper
│   └── monolith-factory.ts
│
├── tui/                                   # Differential terminal renderer & activity timeline
│   └── components/                        # agent-activity-timeline.ts and UI primitives
│
└── index.ts                               # Composition Root (LumiMonolith)
```

> 🛡️ **Non-Destructive Osmosis Extension Strategy (`ADR-012`)**:  
> Base classes in `src/*/base/` remain immutable. Evolutionary passes introduce single-responsibility extension classes in dedicated mutation subdirectories (`src/*/extensions/<mutation-domain>/`) and compose them cleanly in `MonolithFactory` and `LumiMonolith`.

---

## 📡 Live Agent Activity Streaming

Authenticated Codex turns use the official SDK event stream and render a persistent activity card instead of a single ambiguous `Thinking...` label. Stable activities update in place as they move through `started`, `in_progress`, and a terminal state.

Use `/setup` to connect and activate a provider. Codex setup attempts to open the browser, but also displays a clickable and copyable OpenAI sign-in URL; press `O` to retry or paste the authorization code/full callback URL if automatic capture is unavailable. When Codex is already authenticated, submit an empty field to keep the login and activate its default model. The selection is saved in `~/.lumi/config.json`.

```text
Agent activity · Working 4s · gpt-5.6-terra
  ✓ Connected to Codex — gpt-5.6-terra
  ◐ Analyzing the request — Understanding goals and workspace context
  ◐ Running workspace command — npm test
```

The timeline can show safe reasoning summaries, plan progress, redacted commands, relative file changes, MCP/web activity, response readiness, elapsed time, and final token totals. It never displays raw chain-of-thought, aggregated tool output, MCP payloads, OAuth material, or full response text.

Press `Esc` or `Ctrl+C` to cancel an active turn. Cancellation and failure settle active child rows, discard the failed Codex thread, restore the loop phase to idle, and leave the terminal audit trail visible.

Programmatic callers can consume the same lifecycle through `EngineTickInput.onProgress`:

```typescript
const abortController = new AbortController();

const result = await lumi.tick({
  prompt: "make a racing game",
  signal: abortController.signal,
  onProgress: (event) => {
    console.log(event.activityId, event.status, event.message, event.detail);
  },
});
```

See the [complete streaming strategy](.wiki/agent/streaming-activity-strategy.md), [public API reference](.wiki/agent/api-reference.md), and [ADR-082](.wiki/adr/ADR-082-structured-agent-activity-streaming.md).

---

## 🧠 Multi-Turn Context Lifecycle

LUMI separates the full conversation transcript from the bounded context projection sent to a model. The transcript remains available for persistence, snapshots, forks, rewind, and SHA-256-addressed recall; the active projection keeps pinned system policy, one structured checkpoint, and the newest complete user turns.

Context admission is model-aware and token-aware:

```text
model context window
├── reserved model output
├── safety margin
└── usable model input
    ├── pinned system + memory context
    └── active conversation projection
        ├── LUMI-CONTEXT/1 checkpoint
        └── recent complete turns
```

Compaction triggers before the hard provider limit and targets a lower utilization level, leaving space for subsequent tool rounds. A final turn-aware guard prevents provider-side blind truncation. Stateful Codex threads are automatically rehydrated from `LUMI-THREAD/1` after compaction, rewind, model changes, stateless provider turns, or local-only responses.

Run `npm test` to exercise message pressure, token pressure, oversized DSL/code input, checkpoint recurrence, durable persistence, rewind, and multi-turn thread handoff. See [ADR-083](.wiki/adr/ADR-083-token-aware-multi-turn-context-lifecycle.md) for the policy and trade-offs.

---

## 🛡️ Non-Destructive Osmosis Extension Strategy (`ADR-012`)

To prevent code regression, file overwrites, and structural drift as new evolutionary passes are absorbed from `pi-main`, **LUMI-NEW** strictly enforces the **Non-Destructive Extension & Mutation Directory Strategy**:

### 1. Core Architectural Tenets

- **Base Class Immutability**: Base domain classes in `src/*/base/` (e.g. `Eyes`, `SessionContext`, `AgentConfig`) are foundational and immutable.
- **Single-Responsibility Mutation Subdirectories**: Every evolutionary pass or feature mutation creates a dedicated, single-responsibility file in a domain-scoped subdirectory inside `src/*/extensions/<mutation-domain>/`.
- **Zero-Barrel Import Policy**: All intermediate `index.ts` barrel re-export files are prohibited. Imports across subsystems MUST target explicit, deep relative paths.
- **Dependency Inversion Monolith Composition**: Extension classes extend base abstractions and are composed at the composition root (`MonolithFactory` & `LumiMonolith`).

### 2. Mutation Directory Responsibility Matrix

| Subsystem Tier | Mutation Directory | Pass / Feature Responsibility | Extension Class |
|---|---|---|---|
| **Agents** (`src/agents/extensions/`) | `compaction/` | System prompt compilation & context assembly | `PromptComposer` |
| | `resolution/` | Model fallback resolution, slash routing & pricing specs | `ModelResolver`, `AgentSlashRouter`, `ModelCatalog` |
| | `execution/` | Deterministic tick execution, Codex lifecycle adaptation, interactive orchestration | `AgentEngine`, `CodexProgressAdapter`, `InteractiveModeController` |
| | `mentions/` *(Pass 9)* | Prompt `@mention` context expansion | `MentionResolver` |
| | `swarm/` *(Pass 11)* | Subagent task delegation & frame snapshot sync | `AgentSwarmDispatcher` |
| | `intelligence/` *(Pass 13)* | Workspace topology & package identity indexing | `WorkspaceIntelligenceEngine` |
| **Sessions** (`src/sessions/extensions/`) | `substrate/` | Contiguous 16MB ArrayBuffer slab allocation & file locks | `ArenaAllocator`, `FileLockManager`, `LruCache` |
| | `persistence/` | File persistence & frame-perfect snapshot rewind | `PersistentSessionStore` |
| | `memory/` | Long-term fact store & KI persistence | `SessionMemoryStore` |
| | `vfs/` | In-memory Virtual File System diff overlay | `SessionVfs` |
| | `compaction/` | Sliding window compaction & dense bitmap archiving | `SessionCompactor`, `SnapcompactEngine` |
| | `integrity/` *(Pass 12)* | Environment auditing & forensic self-healing | `StabilityDoctor` |
| **Tooling** (`src/tooling/extensions/`) | `perception/` | AST structural code symbol search | `AstPerceptionEyes` |
| | `progress/` | Legacy JSON-RPC progress notification formatting; distinct from provider activity | `ProgressStreamingEars`, `TerminalProgressRenderer` |
| | `telemetry/` | Microsecond performance timers & OpenTelemetry spans | `ProtocolEars`, `TelemetryTracer` |
| | `hashline/` | Line-anchored hash edit verification | `AnchoredHands` |
| | `registry/` | Skill discovery & schema validation tool execution | `SkillsIngestor`, `ValidatingToolRegistry` |
| | `policy/` *(Pass 10)* | Zombie symbol detection & dependency analysis | `ModuleDecomposer` |
| | `permissions/` *(Pass 14)* | Command permission controller & execution guardrails | `CommandPermissionController` |
| | `gateway/` *(Pass 17)* | JSON-RPC 2.0 streaming gateway server | `MonolithGatewayServer` |
| | `evals/` *(Pass 18)* | Automated benchmark evaluation suite | `MonolithBenchmarkEvaluator` |

---

## 📚 Roadmap & Documentation Index

- 🚀 [Auto-Rolling Evolution Roadmap](.wiki/roadmap/AUTOROLLING-ROADMAP.md)
- 📋 [Workspace Changelog](CHANGELOG.md)
- 🎓 [Academic Research Paper: AKD-DSO Specification](.wiki/whitepaper/AKD-DSO-ACADEMIC-WHITEPAPER.md)
- 📦 [True 1-to-1 Package Mapping Matrix](.wiki/package-mappings/PACKAGE-MAPPING-MATRIX.md)
- 📄 [Whitepaper: The Osmosis Paradigm](.wiki/whitepaper/OSMOSIS-WHITEPAPER.md)
- 🧠 [The Osmosis Methodology & Handoff Guide](.wiki/agent/osmosis-methodology.md)
- 📖 [Wiki Landing Page](.wiki/index.md)
- 📋 [API Reference Guide](.wiki/agent/api-reference.md)
- 📡 [Agent Activity Streaming Strategy](.wiki/agent/streaming-activity-strategy.md)
- 🧭 [ADR-082: Structured Agent Activity Streaming](.wiki/adr/ADR-082-structured-agent-activity-streaming.md)
- 📖 [ADR Index & Decision Records](.wiki/adr/README.md)

---

## 📄 License & Contributing

- 🤝 [Contributor Guidelines](CONTRIBUTING.md)
- 📄 Distributed under the MIT License. See [LICENSE](LICENSE) for details.
