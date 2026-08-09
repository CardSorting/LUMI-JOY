# Key Architectural Findings & Osmosis Audit

This document records the foundational research findings and lessons learned during the migration from early multi-agent experiments to the 3-tier monolithic Deterministic Game Engine architecture in `/Users/bozoegg/Desktop/LUMI-NEW`.

---

## 1. Why Multi-Agent Framework Experiments Failed

In earlier iterations, attempting to partition simple coding tasks across 6+ specialized agent micro-services resulted in severe structural failures:

1. **Context Fragmentation**: Agents lost track of system prompt rules and conversation turns across inter-agent RPC calls.
2. **Framework Bloat & Latency**: Serializing turns over multiple async event buses added 100ms+ latency overhead per turn.
3. **Uncoordinated State Mutations**: Multiple agents modified files simultaneously, leading to race conditions and file content corruption.

### The Monolithic Solution
Consolidating into a 3-tier monolithic framework (`agents`, `sessions`, `tooling`) with a **strict cap of $\le 5$ orchestrating classes per tier directory** eliminated multi-service overhead while retaining full modularity.

---

## 2. Key Insights Absorbed from `pi-main` (Teacher Model)

By running 5 passes of the **Osmosis Learning Methodology** against `/Users/bozoegg/Downloads/pi-main`, we isolated key production capabilities and discarded framework complexity:

- **Pass 1 (Context Compaction)**: Compacts turn history dynamically when turn threshold is exceeded ([SessionCompactor](file:///Users/bozoegg/Desktop/LUMI-NEW/src/sessions/extensions/session-compactor.ts#L8)).
- **Pass 2 (Model Resolution & Branching)**: Fallback model resolution chain (`gemini-3.6-flash` $\rightarrow$ `gemini-1.5-pro`) and isolated session branching (`fork()`) ([ModelResolver](file:///Users/bozoegg/Desktop/LUMI-NEW/src/agents/extensions/model-resolver.ts#L13)).
- **Pass 3 (VFS & Slash Router)**: In-memory Virtual File System staging overlays (`SessionVfs`) and sub-millisecond slash command routing (`AgentSlashRouter`).
- **Pass 4 (Long-Term Memory & KIs)**: Persistent memory fact storage and Knowledge Item indexing (`SessionMemoryStore`).
- **Pass 5 (Monorepo Package Absorption)**: Line-anchored hash verification (`hashline`), type-safe schema validation (`omptype`), file storage (`session-backends`), and JSON-RPC telemetry (`protocol`).

---

## 3. The Deterministic Game Engine Paradigm

Capturing agent turns as frame steps (`tick()`) and session states as immutable snapshots (`GameStateSnapshot`) proved to be the ultimate architecture for AI agent stability.

- **Predictable Execution**: Every tick follows the invariant lifecycle: `preTick() -> executeTick() -> postTick()`.
- **Zero-Drift Rewind**: `rewindToSnapshot()` allows instantaneous time-travel to any previous frame without side-effect leakage.
