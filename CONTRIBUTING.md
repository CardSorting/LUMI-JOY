# Contributing to LUMI-NEW

Thank you for your interest in contributing to **LUMI-NEW**! We welcome contributions from the community. Please review this guide to ensure your contributions align with our architectural standards and workflow.

---

## Architectural Principles & Rules

### 1. 3-Tier Monolith Architecture
- Code is divided strictly across **3 Operational Tiers**: `src/agents/`, `src/sessions/`, and `src/tooling/`.
- Tiers can expand organically with specialized classes as needed, provided every class strictly models the **Deterministic Game Engine Strategy**.

### 2. Deterministic Game Engine Strategy
- Agent execution is modeled as a deterministic tick loop (`tick()`).
- All state updates must be snapshot-compatible via `GameStateSnapshot` and `rewindToSnapshot()`.
- Top-level composition is wired via `MonolithFactory` in `src/factories/monolith-factory.ts`.

### 3. Object-Oriented Class Extension (`extends`)
- Pure base parent contracts reside in `src/core/contracts/` and `src/core/abstracts/` (`AbstractAgentEngine`, `AbstractSessionStore`, `AbstractHands`, `AbstractEars`, `AbstractToolRegistry`).
- Specialized capabilities inherit downward (`class Child extends Parent`) in `src/*/extensions/`.

### 4. Mandatory Performance SLAs & Security Guardrails (`ADR-051`)
- **Sub-Millisecond Latency SLA**: Mean turn tick latency MUST remain **$< 1.0\text{ ms}$** (current baseline: **$0.22\text{ ms}$**).
- **Zero-GC Slab Memory Invariant**: `PersistentSessionStore` slab allocation MUST remain fixed at **$16\text{ MB}$** (`16,777,216 bytes`).
- **Zero-Barrel Imports (`ADR-012`)**: Intermediate `index.ts` re-export barrel files inside `src/*/extensions/` are strictly prohibited.
- **Erasable TypeScript Syntax**: Forbidden syntax includes `enum`, `namespace`, parameter properties in constructors (`constructor(public x: string)`), `import =`, `export =`. Use `verbatimModuleSyntax` with top-level explicit type imports.

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

### 3. Run Automated Repository Guardrail Audit & Performance Test

Execute the mandatory pre-commit protection audit verifying type safety, performance SLAs ($< 1.0\text{ ms}$ latency), zero-GC slab memory invariants, and zero-barrel import compliance:

```bash
npm test
```

### 4. Interactive Tools & Benchmarks

```bash
# Launch interactive setup wizard (Model Providers & Codex OAuth)
lumi --setup

# Run engine benchmark & throughput evaluation suite
lumi --benchmark

# Execute 105-pass empirical smoke test suite
lumi --smoke
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
