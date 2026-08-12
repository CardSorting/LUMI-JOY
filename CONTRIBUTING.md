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

### 5. Agent Activity Streaming Contract (`ADR-082`)

- Preserve stable `activityId` values across started, updated, and completed notifications; renderers must upsert rather than append duplicates.
- Treat `item.completed` as authoritative and use monotonically increasing `sequence` values to reject stale updates.
- Keep `phase` (what kind of work) separate from `status` (where it is in its lifecycle).
- Never place raw chain-of-thought, command output, MCP arguments/results, credentials, or full assistant responses in progress events.
- Sanitize and bound every user/provider-derived label through `sanitizeProgressText()` even if an upstream adapter already sanitized it.
- Cancellation, timeout, provider failure, and missing credentials must emit explicit terminal activities and settle active child rows.
- Keep `AbortSignal` and callbacks local; do not serialize them through `RemoteSessionHandle` without a dedicated protocol contract.

Read the [Agent Activity Streaming Strategy](.wiki/agent/streaming-activity-strategy.md) before changing provider streaming, progress types, or terminal rendering.

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

### 5. Streaming Regression Checklist

Changes to `EngineProgressEvent`, `AgentEngine`, the Codex adapter, cancellation, or the TUI require interactive coverage in addition to the standard commands:

1. Authenticated completion with visible connection, analysis, response, and usage states.
2. Tool execution with one identity-updated row and no command output leakage.
3. `Esc` cancellation of a long-running command with no orphan child process.
4. Provider failure, missing credentials, and timeout terminal states.
5. Credential-redaction cases covering headers, keys, JWTs, URLs, query strings, environment assignments, and CLI flags.

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
