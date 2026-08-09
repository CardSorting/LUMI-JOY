# Contributing to LUMI-NEW

Thank you for your interest in contributing to **LUMI-NEW**! We welcome contributions from the community. Please review this guide to ensure your contributions align with our architectural standards and workflow.

---

## Architectural Principles & Rules

### 1. 3-Tier Monolith & Class Limits
- Code is divided strictly across **3 Tiers**: `src/agents/`, `src/sessions/`, and `src/tooling/`.
- **Strict Cap**: Each tier directory MUST maintain a maximum of **5 orchestrating classes**.

### 2. Deterministic Game Engine Architecture
- Agent execution is modeled as a deterministic tick loop (`tick()`).
- All state updates must be snapshot-compatible via `GameStateSnapshot` and `rewindToSnapshot()`.
- Top-level composition is wired via `MonolithFactory` in `src/factories/monolith-factory.ts`.

### 3. Object-Oriented Class Extension (`extends`)
- Pure base parent contracts reside in `src/core/contracts/` and `src/core/abstracts/` (`AbstractAgentEngine`, `AbstractSessionStore`, `AbstractHands`, `AbstractEars`, `AbstractToolRegistry`).
- Specialized capabilities inherit downward (`class Child extends Parent`) in `src/*/extensions/`.

### 4. Erasable TypeScript Syntax (Node Strip-Only Mode)
- **Forbidden**: `enum`, `namespace`, parameter properties in constructors (`constructor(public x: string)`), `import =`, `export =`.
- **Imports**: Use explicit `import type { ... }` for interface and type imports under `verbatimModuleSyntax`.
- **No Dynamic Inline Imports**: Use top-level imports only (`import ... from "..."`).

---

## Development & Verification Workflow

### 1. Install Dependencies

```bash
npm install --ignore-scripts
```

### 2. Type-Checking

Run full TypeScript compilation check without emitting JS files:

```bash
npm run check
```

### 3. Run Deterministic Engine Test

Execute the runtime smoke test verifying deterministic tick execution, snapshot capture, and frame rewind:

```bash
npx tsx src/index.ts
```

---

## Git Commit Guidelines

Commit messages must follow the conventional commit format:

```text
{feat,fix,docs}[(ai,tui,agent,coding-agent)]: <commit message>
```

Examples:
- `feat(agent): add frame snapshot rewind support`
- `fix(tooling): correct line-anchored hash verification in hands`
- `docs(agent): update API reference guide in wiki`
