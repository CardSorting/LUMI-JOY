# ADR-051: Contributor Security & Performance Guardrail Protection Gate

## Status
**Accepted**

## Context
With **LUMI-NEW** reaching **$0.22\text{ ms}$ turn tick latency** and **$4,132.2\text{ turns/sec}$** execution throughput, protecting the codebase against accidental performance regressions, microservice bloat, or architectural drift from future contributors became a top priority. Manual code review alone is insufficient to guarantee hardware bus-level performance SLAs and zero-GC memory invariants.

## Decision
We implemented an automated, multi-layer repository protection gate centered around `ArchitectureGuardrailGate` ([architecture-guardrail-gate.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/policy/architecture-guardrail-gate.ts)), `scripts/validate-repo.ts` (`npm test`), and GitHub Actions CI workflow ([repo-protection-ci.yml](file:///Users/bozoegg/Desktop/LUMI-NEW/.github/workflows/repo-protection-ci.yml)).

### Key Protection Rules Enforced

1. **Performance SLA Guardrail**: Turn tick latency must remain $< 1.0\text{ ms}$ and state rewind latency $< 0.1\text{ ms}$.
2. **Zero-GC Contiguous Slab Invariant**: Pre-allocated 16MB ArrayBuffer slab capacity must remain intact (`16,777,216 bytes`).
3. **Zero-Barrel Import Enforcement**: Prohibition of intermediate `index.ts` re-export files (`ADR-012`).
4. **Base Class Immutability**: Prohibition of destructive mutations in `src/*/base/`.
5. **Agent Activity Security Boundary**: Stable lifecycle identity, explicit terminal settlement, bounded sanitization, secret/output exclusion, and process-local cancellation controls according to `ADR-082`.

## Consequences

### Positive
- Pull requests violating performance SLAs or architectural invariants are automatically blocked.
- Guarantees $100\%$ zero-drift state rewind and zero-GC slab invariants across all future PRs.
- `npm test` provides instant pre-commit verification.

### Negative
- PR authors must fix any latency regressions or forbidden barrel imports before code can be merged.

## Current Refinement: Streaming Regression Gate

Changes to provider dispatch, `EngineProgressEvent`, the Codex adapter, cancellation, or terminal activity rendering require interactive authenticated completion and cancellation coverage in addition to `npm run check`, `npm test`, and `npm run build`. See [ADR-082](ADR-082-structured-agent-activity-streaming.md) and the [streaming strategy](../agent/streaming-activity-strategy.md).
