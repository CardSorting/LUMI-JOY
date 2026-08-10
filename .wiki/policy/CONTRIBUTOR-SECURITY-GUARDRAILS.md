# 🛡️ Policy: Contributor Security & Performance Guardrail Governance

**Document ID**: `POL-2026-08-09-SECURITY-01`  
**Target Scope**: All contributors, automated PR bots, and agent mutations in `LUMI-NEW`  

---

## 📌 Executive Statement

Following the optimization milestone achieving **$0.22\text{ ms}$ turn tick latency** and **$4,132.2\text{ turns/second}$**, **LUMI-NEW** enforces strict automated repository protection rules. Any pull request or commit that causes performance regression ($> 1.0\text{ ms}$ latency), alters zero-GC slab memory invariants, introduces forbidden barrel imports, or mutates base parent contracts will be automatically blocked by CI.

---

## 🛡️ Mandated Contributor Guardrails

### Rule 1: Sub-Millisecond Turn Tick Latency SLA ($< 1.0\text{ ms}$)
- **Requirement**: Mean turn tick latency across the benchmark suite MUST remain under **$1.0\text{ ms}$**.
- **Enforcement**: Measured automatically by `ArchitectureGuardrailGate` during `npm test`.

### Rule 2: Zero-GC Contiguous Slab Memory Invariant
- **Requirement**: `PersistentSessionStore` slab allocation capacity MUST remain exactly **$16,777,216\text{ bytes}$** ($16\text{ MB}$).
- **Enforcement**: Verified via `slabSnapshot.capacityBytes` assertion. No standard Node.js heap garbage sweeping allowed during turn ticks.

### Rule 3: Zero-Barrel Import Rule (`ADR-012`)
- **Requirement**: Intermediate `index.ts` re-export barrel files inside `src/*/extensions/` are strictly prohibited.
- **Enforcement**: Direct deep imports required (e.g. `import { ModelResolver } from "../resolution/model-resolver.js"`).

### Rule 4: Foundational Base Class Immutability (`ADR-012`)
- **Requirement**: Base parent classes in `src/*/base/` (`AgentConfig`, `SessionContext`, `Eyes`) are foundational and immutable.
- **Enforcement**: All feature mutations and evolutionary extensions MUST inherit downward (`class Child extends Parent`) in domain-scoped subdirectories inside `src/*/extensions/<domain>/`.

---

## 🛠️ Contributor Verification Checklist

Before submitting a Pull Request, contributors MUST run:

```bash
# 1. Type-check TypeScript codebase
npm run check

# 2. Run repository protection audit & SLA verification
npm test
```
