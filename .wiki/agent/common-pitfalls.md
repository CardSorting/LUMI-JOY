# Common Pitfalls for AI Agents

This document highlights common pitfalls and non-negotiable rules for AI agents operating in `/Users/bozoegg/Desktop/LUMI-NEW`.

---

## 🛑 Critical Restrictions

1. **Do NOT Exceed 5 Classes Per Tier Directory**:
   - `src/agents/`: Max 5 classes (`AgentConfig`, `PromptComposer`, `ModelResolver`, `AgentSlashRouter`, `AgentEngine`).
   - `src/sessions/`: Max 5 classes (`SessionContext`, `SessionCompactor`, `SessionVfs`, `SessionMemoryStore`, `PersistentSessionStore`).
   - `src/tooling/`: Max 5 classes (`Eyes`, `SkillsIngestor`, `AnchoredHands`, `ProtocolEars`, `ValidatingToolRegistry`).
   - Creating 6+ classes per tier converts the monolith back into "framework soup".

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
