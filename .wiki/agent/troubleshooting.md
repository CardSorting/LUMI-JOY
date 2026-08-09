# Troubleshooting & Verification Guide

This guide provides troubleshooting steps and common fixes for issues encountered when developing or executing `/Users/bozoegg/Desktop/LUMI-NEW`.

---

## Common Verification Commands

### 1. TypeScript Type Verification

Run `tsc --noEmit` across all workspace modules (`src/core/`, `src/agents/`, `src/sessions/`, `src/tooling/`, `src/factories/`, `src/index.ts`):

```bash
npm run check
```

**Common Causes of Failure**:
- Using erasable TS violations (e.g. `enum`, `namespace`, parameter properties in constructors).
- Missing `type` keyword on interface imports under `verbatimModuleSyntax`.
- Dynamic inline imports (`await import()`). Use top-level imports only.

---

### 2. Runtime Game Engine Smoke Test

Run the game loop smoke test executing frame ticks, state snapshot capture, and frame-perfect rewind:

```bash
npx tsx src/index.ts
```

**Expected Output**:
```text
Initializing Deterministic Game Engine Monolith...

--- Subsystem Abstract Base Class Verification ---
lumi.agentEngine instanceof AbstractAgentEngine: true
lumi.sessionStore instanceof AbstractSessionStore: true
lumi.hands instanceof AbstractHands: true
lumi.ears instanceof AbstractEars: true
lumi.toolRegistry instanceof AbstractToolRegistry: true

Frame #1 Result: Persisted memory fact: engine = deterministic (0.85ms)
Created Snapshot ID: 'snapshot-frame-1-...' at Frame #1
Frame #2 Result: Read file content from package.json
Current message count before rewind: 4
Rewound frame index: 1
Message count after rewind: 2
```

---

## Known Pitfalls & Solutions

| Error | Root Cause | Solution |
|---|---|---|
| `TS2742: Inferred type of this node cannot be named without a reference to...` | Missing explicit return type on public method | Add explicit return type annotations to class methods |
| `TS2307: Cannot find module './...'` | Missing `.js` extension in ESM import | Include explicit `.js` extension in ESM import statements (e.g. `import { Eyes } from "./eyes.js"`) |
| `Line anchor hash mismatch at line X` | Target line content modified externally | Recalculate expected line hash using `AnchoredHands.computeLineHash(currentContent)` |
| `Tool argument schema validation failed` | Missing required parameter or invalid type | Pass required parameters matching tool schema defined in `ValidatingToolRegistry` |
