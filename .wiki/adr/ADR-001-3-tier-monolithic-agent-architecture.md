# ADR-001: 3-Tier Monolithic Agent Architecture

- **Status**: Accepted
- **Deciders**: LUMI Architectural Team
- **Date**: 2026-08-09
- **Technical Story**: Replacement of failed 6-in-1 multi-agent framework experiment with a clean 3-tier monolithic design in `/Users/bozoegg/Desktop/LUMI-NEW`.

---

## 1. Context & Motivation (The Why)

### Real-World Operational Failure
The prior 6-in-1 multi-agent setup attempted to split agent functionality into six parallel micro-agents (e.g. planner, execution agent, diagnostic agent, memory agent, tool runner, reporter). This resulted in severe failure modes:
1. **High Turn Latency**: Passing context between 6 agents generated excessive serialization cycles and API hop overhead.
2. **Lock Contention & State Desynchronization**: Race conditions occurred when multiple agents attempted to mutate active session history simultaneously.
3. **Framework Soup**: Traceability broke down as execution jumped across dozens of abstractions, interface adapters, and event channels.

### Why Existing Approaches Were Insufficient
Distributed agent frameworks add exponential complexity without offering benefits for single-workspace coding tasks. A cohesive, single-process monolithic runtime provides immediate state consistency and straightforward debugging.

---

## 2. Architectural Decision (The What)

We establish a **3-Tier Monolithic Architecture** structured under `src/`:
1. `src/agents/`: High-level prompt execution and model coordination.
2. `src/sessions/`: In-memory context and turn history state management.
3. `src/tooling/`: Sensory breakdown into **Eyes** (perception), **Hands** (action), and **Ears** (listening), coordinated by a central registry.

### Hard Constraints
- **Strict Class Cap**: At most 3–5 orchestrating classes per tier directory.
- **Erasable TS Syntax**: Conforms strictly to Node strip-only mode (no `enum`, no `namespace`, no parameter properties).
- **Top-Level Imports Only**: No dynamic `await import()`.

---

## 3. Technical Implementation (The How)

### File Structure & Class Allocation

| Tier | Directory | Classes | File Paths |
|---|---|---|---|
| **Agents** | `src/agents/` | [AgentEngine](file:///Users/bozoegg/Desktop/LUMI-NEW/src/agents/agent-engine.ts#L18)<br>[AgentConfig](file:///Users/bozoegg/Desktop/LUMI-NEW/src/agents/agent-config.ts#L8) | [agent-engine.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/agents/agent-engine.ts)<br>[agent-config.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/agents/agent-config.ts) |
| **Sessions** | `src/sessions/` | [SessionContext](file:///Users/bozoegg/Desktop/LUMI-NEW/src/sessions/session-context.ts#L7)<br>[SessionStore](file:///Users/bozoegg/Desktop/LUMI-NEW/src/sessions/session-store.ts#L9) | [session-context.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/sessions/session-context.ts)<br>[session-store.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/sessions/session-store.ts) |
| **Tooling** | `src/tooling/` | [Eyes](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/eyes.ts#L14)<br>[Hands](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/hands.ts#L13)<br>[Ears](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/ears.ts#L12)<br>[ToolRegistry](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/tool-registry.ts#L11) | [eyes.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/eyes.ts)<br>[hands.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/hands.ts)<br>[ears.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/ears.ts)<br>[tool-registry.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/tool-registry.ts) |
| **Monolith Root** | `src/` | [LumiMonolith](file:///Users/bozoegg/Desktop/LUMI-NEW/src/index.ts#L18) | [index.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/index.ts) |

### Verification Commands

- `npm run check`: Type-check code without emitting JS.
- `npx tsx src/index.ts`: Run end-to-end monolithic execution test.

---

## 4. Consequences & Verification

### Positive Consequences
- Zero lock contentions or multi-agent messaging deadlocks.
- Clear separation of concerns (Agent logic vs. Session state vs. Tool sensory inputs).
- Fast execution with standard TypeScript ESM imports.

### Negative Consequences / Trade-offs
- Monolithic design requires disciplined class scope management so individual files do not balloon over time.
