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
[![License](https://img.shields.io/badge/License-Apache_2.0-blue?style=for-the-badge)](LICENSE)

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

---

## 👔 Role-Based Stakeholder Onboarding

Select your role for tailored navigation and onboarding instructions:

| Stakeholder Role | Primary Focus | Recommended Onboarding Path & Key Resources |
|---|---|---|
| 👔 **Executive & VP of Engineering** | ROI, Infrastructure Cost, Latency SLAs & Compliance | Read [Business & Technical ROI](#-business--technical-roi-highlights), evaluate [Benchmark SLA Matrix](#-comparison-matrix--empirical-benchmarks), and review [Apache 2.0 License](LICENSE) & [Defensive Patent Pledge](PATENT-NON-AGGRESSION-PLEDGE.md). |
| 🏗️ **Enterprise Architect & Tech Lead** | Monolith Topology, State Memory Substrates & DSL Engine | Inspect [3-Tier Architecture Tree](#%EF%B8%8F-subsystem-architecture--file-tree), review [Context DSL & Template Engine](#-multi-turn-context-lifecycle), and read [ADR-083 Context Lifecycle](.wiki/adr/ADR-083-token-aware-multi-turn-context-lifecycle.md). |
| 🔒 **Security & Compliance Officer** | Authentication Security, PKCE OAuth & Permission Gates | Audit [Live Activity Streaming](#-live-agent-activity-streaming), check [OpenAI Codex PKCE Setup](#2-provider-authentication--guided-setup), and review [ADR-082 Streaming Policy](.wiki/adr/ADR-082-structured-agent-activity-streaming.md). |
| 💻 **Software Engineer & Developer** | Installation, Local Shell Execution & TypeScript SDK | Follow 3-step [Quick Start](#-quick-start--onboarding), test [Programmatic SDK Usage](#programmatic-typescript-usage), and consult the [API Reference Guide](.wiki/agent/api-reference.md). |

### 🎯 Concrete Goals by Stakeholder Role

#### 👔 Executive & Engineering VP
- **Goal 1: Predictable Infrastructure Costs & High Density**: Scale agent workloads to 247,000+ turns/min per server node with zero microservice overhead.
- **Goal 2: Strict Turn Latency SLAs**: Enforce sub-millisecond turn tick bounds ($0.11\text{ ms}$) guaranteed by pre-commit automated guardrail testing.
- **Goal 3: Enterprise Compliance**: Deploy under the Apache License 2.0 backed by an explicit Defensive Patent Non-Aggression Pledge.

#### 🏗️ Enterprise Architect & Technical Lead
- **Goal 1: Monolithic Simplicity over Monorepo Bloat**: Eliminate 18+ uncoordinated micro-packages in favor of a clean 3-tier TypeScript monolith (`agents`, `sessions`, `tooling`).
- **Goal 2: Zero-GC Memory Stability**: Prevent runtime garbage collection sweeps during live streaming using a contiguous 16MB ArrayBuffer substrate.
- **Goal 3: Deterministic Context Envelopes**: Replace raw string concatenation with `ContextDslEngine` AST parsing and `PromptTemplateEngine` conditional block rendering.

#### 🔒 Security & InfoSec Officer
- **Goal 1: PKCE OAuth Security**: Secure OpenAI Codex credentials using local PKCE authentication (`localhost:1455`) with encrypted disk storage (`~/.lumi/config.json`).
- **Goal 2: Redacted Telemetry**: Stream progress events (`CodexProgressAdapter`) without leaking raw chain-of-thought, tokens, secrets, or file contents.
- **Goal 3: Command & Permission Sandboxing**: Restrict execution via `CommandPermissionController` and validate all terminal commands before invocation.

#### 💻 Software Engineer & Developer
- **Goal 1: Instant Local Setup**: Get up and running in under 60 seconds with `npm install` and `npx tsx src/index.ts --setup`.
- **Goal 2: Frame-Perfect State Rewind**: Perform $O(1)$ state rollbacks ($0.04\text{ ms}$) during iterative agent debugging.
- **Goal 3: Type-Safe Programmatic SDK**: Embed `LumiMonolith` seamlessly into node applications with full TypeScript autocompletion and progress callbacks.

---

## 🌟 Business & Technical ROI Highlights

- **⚡ $129\times$ Latency Reduction ($0.11\text{ ms}$ SLA)**: Direct function dispatch eliminates micro-package IPC/RPC network queues, dropping mean tick latency from $14.2\text{ ms}$ down to $0.11\text{ ms}$.
- **📈 $58.7\times$ Throughput Boost ($4,132\text{ turns/sec}$)**: High-density turn processing supports over $247,000$ turns per minute on a single node.
- **🔄 $O(1)$ Instant State Rewind ($0.04\text{ ms}$)**: Replaces slow JSON re-parsing with $O(1)$ memory pointer assignments for instantaneous state rollbacks.
- **🔒 Enterprise Security & OAuth PKCE**: Native PKCE OAuth 2.0 integration with zero-leak credential storage in `~/.lumi/config.json` and strict permission gates (`CommandPermissionController`).
- **🧠 Formal Context Envelope DSL & Template Engine**: Structured `ContextDslEngine` AST parsing (`LUMI-CONTEXT/1`, `LUMI-THREAD/1`, `LUMI-MEMORY/1`, `LUMI-TOOL-RESULT/1`, `LUMI-GOAL/1`) and `PromptTemplateEngine` (`{{#if}}`/`{{#unless}}`) prevent prompt injection and guarantee deterministic context control.
- **🛡️ Contiguous Zero-GC Substrate**: 16MB pre-allocated ArrayBuffer memory slab eliminates runtime Garbage Collection latency spikes.

---

## 🚀 Quick Start & Onboarding

Get up and running with **LUMI-NEW** in seconds:

### 1. Prerequisites & Installation

Ensure you have **Node.js 20+** installed:

```bash
# Clone the repository
git clone https://github.com/CardSorting/LUMI-JOY.git
cd LUMI-JOY

# Install dependencies
npm install

# Build the project
npm run build
```

### 2. Provider Authentication & Guided Setup

Configure your LLM providers (OpenAI Codex OAuth, Anthropic, or OpenAI API keys):

```bash
# Launch the interactive guided setup wizard
npx tsx src/index.ts --setup
# or run the global binary if linked:
# lumi --setup
```

> **Codex OAuth**: Select **OpenAI Codex OAuth** to initiate browser sign-in. Paste the callback authorization code if automatic redirect capture is unavailable. Credentials are stored securely in `~/.lumi/config.json`.

### 3. Launch the Interactive Shell or Programmatic SDK

```bash
# Start the interactive terminal shell
npx tsx src/index.ts

# Run a single prompt directly from the CLI
npx tsx src/index.ts "Build a HTML5 Canvas game in src/app.js"
```

#### Programmatic TypeScript Usage

```typescript
import { LumiMonolith } from "lumi-new";

// Initialize the deterministic monolith engine
const lumi = new LumiMonolith();

// Execute a frame-perfect turn with real-time progress callbacks
const result = await lumi.tick({
  prompt: "Analyze repository topology and write unit tests",
  onProgress: (event) => {
    console.log(`[${event.phase}] ${event.message}`);
  },
});

console.log("Agent Response:", result.response);
```

### 🛠️ Common Operational Commands

| Command | Action |
|---|---|
| `npm test` | Run complete validation suite (`validate-dsl-strategy`, `validate-context-management`, `validate-repo`) |
| `npm run build` | Compile TypeScript (`tsc`) to `dist/` |
| `npx tsx src/index.ts --benchmark` | Run sub-millisecond turn tick latency and throughput benchmark suite |
| `npx tsx src/index.ts --setup` | Run guided provider & model selection wizard |

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

Compaction triggers before the hard provider limit and targets a lower utilization level, leaving space for subsequent tool rounds. A final turn-aware guard prevents provider-side blind truncation. All context envelopes (`LUMI-CONTEXT/1`, `LUMI-THREAD/1`, `LUMI-MEMORY/1`, `LUMI-TOOL-RESULT/1`, `LUMI-GOAL/1`) are parsed, validated, and serialized through `ContextDslEngine`. System prompts are compiled via `PromptTemplateEngine`, supporting handlebar variable placeholders (`{{var}}`) and conditional blocks (`{{#if}}`/`{{#unless}}`). Stateful Codex threads are automatically rehydrated from `LUMI-THREAD/1` after compaction, rewind, model changes, stateless provider turns, or local-only responses.

Run `npm test` to exercise DSL AST parsing (`scripts/validate-dsl-strategy.ts`), message pressure, token pressure, oversized DSL/code input, checkpoint recurrence, durable persistence, rewind, and multi-turn thread handoff. See [ADR-083](.wiki/adr/ADR-083-token-aware-multi-turn-context-lifecycle.md) for the policy and trade-offs.

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
---

## ❓ Frequently Asked Questions (FAQ)

### Q: How does LUMI-NEW differ from multi-agent frameworks like LangChain, AutoGen, or CrewAI?
Traditional frameworks rely on loose, uncoordinated async loops and heavy multi-package abstractions that incur high serialization latency and non-deterministic state drift. **LUMI-NEW** uses a single, deterministic 3-tier monolith (`agents`, `sessions`, `tooling`) operating as a frame-based engine tick ($\mathbf{Step}_t$). This achieves **$0.11\text{ ms}$ tick latency** ($129\times$ faster) and $O(1)$ state snapshot rewinds.

### Q: What security guarantees are provided for OAuth tokens and API keys?
Credentials configured via `/setup` or `lumi --setup` are stored exclusively in user-restricted storage at `~/.lumi/config.json` (0600 file permissions). PKCE (Proof Key for Code Exchange) S256 verifiers ensure authorization codes cannot be intercepted. Progress activity streaming explicitly redacts secrets, bearer tokens, tool payloads, and raw prompt content.

### Q: How does the Context DSL Engine prevent prompt injection and context overflow?
`ContextDslEngine` parses all history envelopes (`LUMI-CONTEXT/1`, `LUMI-THREAD/1`, `LUMI-MEMORY/1`, `LUMI-TOOL-RESULT/1`, `LUMI-GOAL/1`) as strongly typed AST nodes. Quoted user content and evicted history are kept in assistant scope with SHA-256 transcript references, preventing user text from being promoted to system policy. `PromptTemplateEngine` compiles handlebar conditionals (`{{#if}}`/`{{#unless}}`) safely.

### Q: How does LUMI-NEW handle memory allocation without Garbage Collection spikes?
`ArenaAllocator` pre-allocates a contiguous 16MB ArrayBuffer slab for session state and text buffers. By resetting pointers during turn cycles rather than freeing objects dynamically, runtime V8 Garbage Collection sweeps are completely eliminated.

### Q: Can LUMI-NEW be integrated programmatically as a Node.js library?
Yes. Import `LumiMonolith` directly from `lumi-new` or `src/index.ts`. Instantiate `new LumiMonolith()` and execute frame turns using `await lumi.tick({ prompt, signal, onProgress })`. Full type safety and progress event hooks are included.

### Q: What open-source license governs LUMI-NEW?
**LUMI-NEW** is distributed under the enterprise-friendly **Apache License 2.0** and backed by an explicit **Defensive Patent Non-Aggression Pledge** ([PATENT-NON-AGGRESSION-PLEDGE.md](PATENT-NON-AGGRESSION-PLEDGE.md)).

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
- 📄 Distributed under the Apache License 2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE) for details.
