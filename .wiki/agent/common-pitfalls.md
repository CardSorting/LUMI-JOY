# Common Pitfalls for AI Agents

This document highlights common pitfalls and non-negotiable rules for AI agents operating in `/Users/bozoegg/Desktop/LUMI-NEW`.

---

## 🛑 Critical Restrictions & Strategy Directives

1. **Preserve the Deterministic Game Engine Strategy**:
   - Every user turn MUST be modeled as a frame tick (`tick()`).
   - State updates MUST remain snapshot-compatible (`GameStateSnapshot` and `rewindToSnapshot()`).
   - Tiers (`src/agents/`, `src/sessions/`, `src/tooling/`) can expand beyond initial class counts as needed, provided all new classes strictly model the Game Engine strategy.

2. **No Non-Erasable TypeScript Syntax**:
   - Node strip-only mode (`--experimental-strip-types`) strictly forbids:
     - `enum` (Use union string types: `"fact" | "rule" | "troubleshooting" | "ki"`)
     - `namespace` / `module`
     - Parameter properties in constructors (`constructor(public name: string)`)
     - `import =` / `export =`

3. **No Dynamic Inline Imports**:
   - Do NOT use `await import("...")` or `import("pkg").Type`. All imports must be top-level static imports.

4. **No Whole File Overwrites Without Staging**:
   - For targeted line modifications, use `AnchoredHands.applyAnchoredEdit()` (line-anchored hash verification) to prevent line drift errors.
   - For virtual file edits, stage changes via `SessionVfs` before committing.

5. **Always Preserve Single Composition Root**:
   - `src/index.ts` ([LumiMonolith](file:///Users/bozoegg/Desktop/LUMI-NEW/src/index.ts#L57)) backed by `MonolithFactory` in `src/factories/monolith-factory.ts` MUST remain the single parent composition root.
