<div align="center">

# ⚡ LUMI-NEW

### **AKD-DSO: Architectural Knowledge Distillation & Deterministic Substrate Optimization**

*An enterprise-grade TypeScript agent framework built on structural knowledge distillation, frame-perfect state snapshotting, and biological osmosis self-mutation.*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.19+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
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
- **Goal 1: Predictable Infrastructure Costs & High Density**: Enforce a deterministic fast-path floor of at least $1,000$ frames/second without microservice IPC overhead; consult the live baseline for the current host measurement.
- **Goal 2: Strict Turn Latency SLAs**: Enforce a mean deterministic fast-path latency below $1.0\text{ ms}$ through automated guardrail testing.
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
- **Goal 2: Frame-Perfect State Rewind**: Perform $O(1)$ state restoration under the enforced $0.1\text{ ms}$ warmed-p95 guardrail during iterative agent debugging.
- **Goal 3: Type-Safe Programmatic SDK**: Embed `LumiMonolith` seamlessly into node applications with full TypeScript autocompletion and progress callbacks.

## 💡 Why LUMI-NEW? (The Architectural Imperative)

Traditional AI agent frameworks (LangChain, AutoGen, CrewAI, and raw provider wrappers) suffer from systemic architectural flaws that limit their enterprise production readiness:

| Architectural Challenge | Traditional Agent Frameworks | AKD-DSO Engine (`LUMI-NEW`) | Business & Technical Impact |
|---|---|---|---|
| **Framework Overhead** | 18+ micro-packages with RPC/IPC queues | **Single 3-tier monolith** (`agents`, `sessions`, `tooling`) | **Measured deterministic fast path with $<1.0\text{ ms}$ latency SLA** |
| **Context Safety & DSL** | Loose string joins prone to prompt injection | **Formal `ContextDslEngine` AST parsing & SHA-256 digests** | **Deterministic context bounds & injection defense** |
| **Memory & GC Latency** | Dynamic heap allocations causing V8 GC sweeps | **Contiguous 16MB ArrayBuffer zero-GC substrate** | **Zero Garbage Collection pauses during live streaming** |
| **State Rewind & Audit** | Slow transcript re-parsing | **$O(1)$ in-memory snapshot restoration** | **Warmed-p95 guardrail below $0.1\text{ ms}$ and frame-perfect state verification** |

---

## 🌟 Business & Technical ROI Highlights

- **⚡ Enforced Fast-Path Latency**: Direct function dispatch eliminates micro-package IPC/RPC queues; `ArchitectureGuardrailGate` requires mean local frame latency below $1.0\text{ ms}$.
- **📈 Enforced Fast-Path Throughput**: The same guardrail requires at least $1,000$ deterministic frames/second and records the host-specific observation in the live baseline.
- **🔄 $O(1)$ State Rewind**: In-memory snapshot restoration is verified for state correctness and a warmed p95 below $0.1\text{ ms}$.
- **🔒 Enterprise Security & OAuth PKCE**: Native PKCE OAuth 2.0 integration with zero-leak credential storage in `~/.lumi/config.json` and strict permission gates (`CommandPermissionController`).
- **🧠 Formal Context Envelope DSL & Template Engine**: Structured `ContextDslEngine` AST parsing (`LUMI-CONTEXT/1`, `LUMI-THREAD/1`, `LUMI-MEMORY/1`, `LUMI-TOOL-RESULT/1`, `LUMI-GOAL/1`) and `PromptTemplateEngine` (`{{#if}}`/`{{#unless}}`) prevent prompt injection and guarantee deterministic context control.
- **🛡️ Contiguous Zero-GC Substrate**: 16MB pre-allocated ArrayBuffer memory slab eliminates runtime Garbage Collection latency spikes.

### Latest verified workspace baseline

The authoritative run was generated on **2026-08-13T04:45:51.966Z** using Node.js `v23.5.0` on macOS ARM64. It passed:

| Verification lane | Latest result |
|---|---:|
| Pass 192 composition manifest | 142/142 components |
| Runtime capability smoke | 9/9 checks |
| Heterogeneous benchmark suite | 5/5 cases |
| Complete Flappy Bird React + TypeScript + Vite case | 8/8 assertions; 12/12 files |
| Architecture and performance guardrails | 6/6 checks |

Performance timings are host-sensitive and must not be copied forward as permanent guarantees. Read the generated [machine-readable baseline](docs/LIVE_BASELINE.json), [benchmark evidence](docs/BENCHMARK_REPORT.md), and [architectural audit](docs/GRAND_ARCHITECTURAL_AUDIT.md) for the exact current measurements and regeneration timestamp.

---

## 🚀 Quick Start & Onboarding

Get up and running with **LUMI-NEW** in seconds:

### 1. Prerequisites & Installation

Ensure you have **Node.js 20.19+** (or a compatible newer release) installed:

```bash
# Clone the repository
git clone https://github.com/CardSorting/LUMI-NEW.git
cd LUMI-NEW

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
| `npm test` | Run the complete validation suite, including runtime-baseline contracts, documentation freshness/link checks, and architecture guardrails |
| `npm run build` | Compile TypeScript (`tsc`) to `dist/` |
| `npm run smoke` | Verify the current Pass 192 composition and critical runtime completion, rewind, safety, and integrity behaviors |
| `npm run benchmark` | Run the hermetic latency and throughput benchmark suite |
| `npm run baseline:update` | Run smoke, benchmarks, and guardrails, then atomically regenerate the live baseline reports |
| `npx tsx src/index.ts --setup` | Run guided provider & model selection wizard |

The current measured baseline is stored in [`docs/LIVE_BASELINE.json`](docs/LIVE_BASELINE.json). [`docs/BENCHMARK_REPORT.md`](docs/BENCHMARK_REPORT.md) and [`docs/GRAND_ARCHITECTURAL_AUDIT.md`](docs/GRAND_ARCHITECTURAL_AUDIT.md) are generated views of that same run; do not hand-edit their measured values.

---

## ⚡ Comparison Matrix & Empirical Benchmarks

| Metric / Feature | Legacy Monorepo (`pi-main`) | AKD-DSO Engine (`LUMI-NEW`) | Underlying Mechanism / Speedup |
|---|---|---|---|
| **Architecture** | 18+ Micro-packages | **3-Tier Monolith** (`agents`, `sessions`, `tooling`) | **Zero Framework Bloat** |
| **Execution Loop** | Loose Async Handlers | **Deterministic Game Loop** (`tick()`) | **Frame-Perfect Isolation** |
| **Mean Turn Latency** | $14.20\text{ ms}$ | **Live guardrail: $<1\text{ ms}$** | Direct function dispatch replacing IPC/RPC queues; see the generated live baseline for the current measurement. |
| **Execution Throughput** | $70.4\text{ turns/sec}$ | **Live guardrail: $\geq1,000\text{ frames/sec}$** | Direct deterministic fast-path measurement, kept separate from heterogeneous benchmark workloads. |
| **State Rewind Latency** | $285.00\text{ ms}$ (Re-parse) | **Live guardrail: $<0.1\text{ ms}$ p95** | Real snapshot mutation/rewind measured across warmed samples rather than a fixed fallback. |
| **VFS Perception Speed** | $12.40\text{ ms}$ (Disk I/O) | **Live benchmark case** | In-memory contiguous VFS overlay inspection. |
| **Memory Allocation** | Dynamic Heap GC Sweep | **16MB Zero-GC Slab** | Pre-allocated slab eliminates Garbage Collection sweeps. |
| **Complete Game Synthesis** | Manual multi-file setup | **12-file React + TypeScript + Vite project** | Temp-isolated generation, strict compiler diagnostics, executable physics simulation, responsive Canvas UI, controls, and accessibility checks. |

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

The timeline can show safe reasoning summaries, plan progress, redacted commands, relative file changes, MCP/web activity, response-candidate state, elapsed time, and final token totals. A completed message item is only a candidate: LUMI reports success after the provider turn also terminates and the candidate passes final-response validation. It never displays raw chain-of-thought, aggregated tool output, MCP payloads, OAuth material, or full response text.

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

if (result.outcome !== "completed") {
  // `response` contains safe failure or cancellation guidance, not a successful answer.
  console.error(result.response);
}
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

### Q: What is LUMI-NEW and what core business problem does it solve?
**LUMI-NEW** is an enterprise-grade AI pair programmer and autonomous agent engine. It addresses framework overhead and state drift through a deterministic local frame path guarded below $1.0\text{ ms}$ mean latency, explicit frame outcomes, immutable snapshots, and fail-closed completion semantics. Provider-backed model latency is external to this local-runtime guardrail.

### Q: How does LUMI-NEW reduce AI infrastructure and cloud operating costs?
By eliminating internal microservice RPC queues, LUMI-NEW keeps deterministic local orchestration in-process. The enforced floor is **$1,000$ local frames/second**; the latest host run observed **$7,787.13$ frames/second**. These figures are local framework measurements—not provider responses, model tokens, or a universal server-capacity promise—and should be regenerated on deployment hardware.

### Q: Which LLM providers and AI models are supported?
LUMI-NEW natively supports major provider ecosystems including **OpenAI** (`gpt-4o`, `gpt-5`, `Codex`), **Anthropic** (`Claude 3.5 Sonnet`), and standard OpenAI-compatible proxy gateways. It features automatic model resolution, fallback routing, and PKCE OAuth 2.0 authentication.

### Q: How does LUMI-NEW protect enterprise data privacy and source code security?
LUMI-NEW runs locally or within your private cloud infrastructure. Credentials configured via `/setup` are stored in restricted user storage (`~/.lumi/config.json` with 0600 permissions). The engine explicitly redacts credentials, bearer tokens, and internal file contents from streaming activity logs, and enforces strict command permission policies before executing any terminal operations.

### Q: Can LUMI-NEW be customized or embedded into internal enterprise tools?
Yes. LUMI-NEW is open-source under the **Apache License 2.0** and backed by a **Defensive Patent Non-Aggression Pledge**. You can integrate the TypeScript SDK (`LumiMonolith`) directly into internal developer portals, custom CLI tools, IDE plugins, or automated CI/CD code repair pipelines.

### Q: What user experience does LUMI-NEW offer developers during long agent tasks?
Developers receive real-time, transparent feedback through a differential terminal timeline UI or progress event stream. Instead of displaying a static "Thinking..." label, LUMI-NEW shows live activity updates (file viewing, test execution, plan updates) with elapsed time timers and clear completion status.

### Q: How quickly can an engineering team get started with LUMI-NEW?
Engineering teams can install LUMI-NEW in under 60 seconds with `npm install` and complete provider authentication using the built-in guided wizard (`lumi --setup`). Programmatic integration requires only 4 lines of TypeScript code.

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
- 📈 [Current Machine-Readable Baseline](docs/LIVE_BASELINE.json)
- 🧪 [Generated Benchmark Evidence](docs/BENCHMARK_REPORT.md)
- 🏛️ [Generated Architectural Audit](docs/GRAND_ARCHITECTURAL_AUDIT.md)
- 📖 [ADR Index & Decision Records](.wiki/adr/README.md)

---

## 📄 License & Contributing

- 🤝 [Contributor Guidelines](CONTRIBUTING.md)
- 📄 Distributed under the Apache License 2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE) for details.
