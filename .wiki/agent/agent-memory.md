# Agent Memory & Workspace Constraints

This document defines non-negotiable architectural and syntax constraints for all agents working in `/Users/bozoegg/Desktop/LUMI-NEW`.

## Mandatory Constraints

1. **Erasable TypeScript Syntax Only (Node strip-only mode)**:
   - NO `enum` declarations (use union string literals or const objects).
   - NO `namespace` or `module` keywords.
   - NO constructor parameter properties (e.g. `constructor(public foo: string)` is forbidden). Use explicit field declarations and constructor assignments.
   - NO `import =` or `export =`.

2. **Top-Level Imports Only**:
   - NO dynamic inline imports (`await import()`, `import("pkg").Type`).
   - Top-level ESM imports only.

3. **No `any`**:
   - Explicit types or `unknown` with runtime type narrowing.

4. **3-Tier Monolith Class Limit**:
   - Maximum of 3–5 orchestrating classes per tier directory (`src/agents/`, `src/sessions/`, `src/tooling/`).
   - Avoid creating micro-helpers or extra wrapper files that fragment the monolithic composition root.

5. **Tooling Classification (Eyes, Hands, Ears)**:
   - Perception logic MUST reside in [Eyes](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/eyes.ts#L14).
   - Action/mutation logic MUST reside in [Hands](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/hands.ts#L13).
   - Event listening/streaming logic MUST reside in [Ears](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/ears.ts#L12).
