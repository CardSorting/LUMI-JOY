# Common Pitfalls & Anti-Patterns

## 1. Class Sprawl ("Framework Soup")
- **Pitfall**: Adding new sub-agent classes, handlers, or middleware wrappers every time a new feature is requested.
- **Rule**: Maintain a maximum of 3-5 orchestrating classes per tier directory (`src/agents/`, `src/sessions/`, `src/tooling/`). Keep logic inside the existing monolithic class structure ([AgentEngine](file:///Users/bozoegg/Desktop/LUMI-NEW/src/agents/agent-engine.ts#L18), [SessionStore](file:///Users/bozoegg/Desktop/LUMI-NEW/src/sessions/session-store.ts#L9), [ToolRegistry](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/tool-registry.ts#L11)).

## 2. Sensory Misplacement
- **Pitfall**: Putting perception logic (e.g. reading files) in `Hands` or process execution in `Eyes`.
- **Rule**: Respect sensory roles:
  - `Eyes`: Read-only, inspection, perception.
  - `Hands`: Write, edit, execute commands.
  - `Ears`: Listener, events, signals.

## 3. Dynamic Inline Imports
- **Pitfall**: Using `await import(...)` inside methods.
- **Rule**: All imports must be top-level ESM imports.
