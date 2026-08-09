# LUMI-NEW: 3-Tier Monolithic Agent Framework

A lean, high-performance TypeScript agent framework built around a 3-tier monolithic architecture. LUMI-NEW eliminates the complexity, latency, and context desynchronization of multi-agent setups ("framework soup") by enforcing a strict cap of 2–4 orchestrating classes per tier.

```
                         ┌─────────────────────────────────┐
                         │          LumiMonolith           │
                         │          (src/index.ts)         │
                         └────────────────┬────────────────┘
                                          │
         ┌────────────────────────────────┼────────────────────────────────┐
         ▼                                ▼                                ▼
┌─────────────────┐              ┌─────────────────┐              ┌─────────────────┐
│   AGENTS TIER   │              │  SESSIONS TIER  │              │  TOOLING TIER   │
│  (src/agents/)  │              │ (src/sessions/) │              │  (src/tooling/) │
├─────────────────┤              ├─────────────────┤              ├─────────────────┤
│ AgentEngine     │              │ SessionContext  │              │ ToolRegistry    │
│ AgentConfig     │              │ SessionStore    │              │ Eyes (Perceive) │
│                 │              │                 │              │ Hands (Execute) │
│                 │              │                 │              │ Ears (Listen)   │
└─────────────────┘              └─────────────────┘              └─────────────────┘
```

---

## Key Features

- **3-Tier Separation**:
  - `agents/`: Core model execution & turn loop ([AgentEngine](file:///Users/bozoegg/Desktop/LUMI-NEW/src/agents/agent-engine.ts#L18)).
  - `sessions/`: Context bounds & turn persistence ([SessionContext](file:///Users/bozoegg/Desktop/LUMI-NEW/src/sessions/session-context.ts#L7), [SessionStore](file:///Users/bozoegg/Desktop/LUMI-NEW/src/sessions/session-store.ts#L9)).
  - `tooling/`: Sensory breakdown into [Eyes](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/eyes.ts#L14) (read), [Hands](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/hands.ts#L13) (write/exec), and [Ears](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/ears.ts#L12) (events).
- **Zero Framework Bloat**: Capped at 2–4 orchestrating classes per tier.
- **Node Strip-Only Mode Compliant**: Erasable TypeScript syntax only (no `enum`, no `namespace`, no constructor parameter properties).

---

## Quick Start

### Installation & Dependencies

```bash
# Hydrate dependencies cleanly without lifecycle scripts
npm install --ignore-scripts
```

### Build & Type Verification

```bash
# Verify type safety without emitting JS output
npm run check
```

### Running the Monolith

```bash
# Run the turn execution smoke test
npx tsx src/index.ts
```

---

## Programmatic Usage

```typescript
import { LumiMonolith } from "./src/index.js";

// Initialize the monolithic root
const lumi = new LumiMonolith({
  cwd: process.cwd(),
});

// Subscribe to real-time Ears notifications
lumi.ears.listen("turn_complete", (evt) => {
  console.log("Turn completed:", evt.payload);
});

// Execute a turn
const result = await lumi.runTurn("view: package.json");
console.log("Response:", result.response);
```

---

## Documentation & Wiki

Detailed architectural documentation, ADRs, and agent guidelines are available in the workspace wiki:

- [Wiki Home](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/index.md)
- [Agent Playbook](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/agent/playbook.md)
- [API Reference](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/agent/api-reference.md)
- [ADR-001: 3-Tier Monolithic Agent Architecture](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-001-3-tier-monolithic-agent-architecture.md)
