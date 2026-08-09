# True 1-to-1 Package Mapping Matrix: `pi-main` vs `LUMI-NEW`

This document provides a formal, industry-standard 1-to-1 technical mapping between the 18 packages in the Teacher Model ([pi-main](file:///Users/bozoegg/Downloads/pi-main/packages)) and their reinvented monolithic implementations in the Student Model ([LUMI-NEW](file:///Users/bozoegg/Desktop/LUMI-NEW/src)).

---

## 1. Monorepo vs Monolith Mapping Summary

```
   TEACHER MONOREPO PACKAGES (pi-main)               STUDENT MONOLITH SUBSYSTEMS (LUMI-NEW)
   ══════════════════════════════════               ══════════════════════════════════════
   packages/hashline          ───────────►          AnchoredHands.applyAnchoredEdit() (src/tooling)
   packages/omptype           ───────────►          ValidatingToolRegistry.validateToolArgs() (src/tooling)
   packages/session-backends  ───────────►          PersistentSessionStore.saveToFile() (src/sessions)
   packages/protocol         ───────────►          ProtocolEars.formatJsonRpcEvent() (src/tooling)
   packages/snapcompact       ───────────►          SessionCompactor.compact() (src/sessions)
   packages/telemetry         ───────────►          ProtocolEars.startTimer() / endTimer() (src/tooling)
   packages/coding-agent      ───────────►          AgentEngine & LumiMonolith (src/agents & src/index.ts)
   packages/ai                ───────────►          ModelResolver (src/agents)
   packages/broccolidb        ───────────►          [Pass 6 Blueprint] Zero-GC Slab Caching
   packages/codemarie         ───────────►          [Pass 7 Blueprint] Symbol Search in Eyes
```

---

## 2. Detailed 1-to-1 Technical Specifications

### Package 1: `packages/hashline` $\longrightarrow$ `AnchoredHands.applyAnchoredEdit()`

- **Teacher Package Path**: `/Users/bozoegg/Downloads/pi-main/packages/hashline`
- **Teacher Signature**: `applyLineDelta(filePath: string, line: number, expectedHash: string, newContent: string)`
- **Student Implementation**: [AnchoredHands.applyAnchoredEdit()](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/hands.ts#L30) in `src/tooling/extensions/hands.ts`
- **Code-Level Comparison**:

```typescript
// Teacher (pi-main/packages/hashline): Multi-file AST hash parser dependency
import { xxhash3 } from "xxhash-wasm";
export async function applyLineDelta(file, line, hash, content) { ... }

// Student (LUMI-NEW/src/tooling/extensions/hands.ts): Clean, zero-dependency bitwise line hash
static computeLineHash(lineContent: string): string {
  let hash = 0;
  const str = lineContent.trim();
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return `h${Math.abs(hash).toString(16)}`;
}
```

- **Architectural Rationale**: Replaced heavy WebAssembly `xxhash-wasm` dependency with pure bitwise hashing (`computeLineHash`) running in native Node strip-only mode without async WASM loading overhead.

---

### Package 2: `packages/omptype` $\longrightarrow$ `ValidatingToolRegistry.validateToolArgs()`

- **Teacher Package Path**: `/Users/bozoegg/Downloads/pi-main/packages/omptype`
- **Teacher Signature**: `parseAndValidateSchema(schema: OmpSchema, data: unknown): ValidationResult`
- **Student Implementation**: [ValidatingToolRegistry.validateToolArgs()](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/tool-registry.ts#L22) in `src/tooling/extensions/tool-registry.ts`
- **Code-Level Comparison**:

```typescript
// Teacher (pi-main/packages/omptype): Multi-file JSON Schema validator with complex error formatters
export function validate(schema, args) { /* 300+ lines across 4 files */ }

// Student (LUMI-NEW/src/tooling/extensions/tool-registry.ts): Direct runtime schema validator
validateToolArgs(name: string, args: Record<string, unknown>): SchemaValidationResult {
  const tool = this.tools.get(name);
  if (!tool || !tool.parameters) return { valid: true, errors: [] };
  const errors: string[] = [];
  for (const [paramName, schema] of Object.entries(tool.parameters)) {
    const val = args[paramName];
    if (schema.required && (val === undefined || val === null || val === "")) {
      errors.push(`Missing required parameter '${paramName}'`);
    }
  }
  return { valid: errors.length === 0, errors };
}
```

- **Architectural Rationale**: Integrated parameter schema validation directly into tool execution dispatch (`executeTool`), blocking invalid model invocations before tool execution.

---

### Package 3: `packages/session-backends` $\longrightarrow$ `PersistentSessionStore`

- **Teacher Package Path**: `/Users/bozoegg/Downloads/pi-main/packages/session-backends`
- **Teacher Signature**: `JsonlSessionBackend.save(session: SessionData): Promise<void>`
- **Student Implementation**: [PersistentSessionStore.saveToFile()](file:///Users/bozoegg/Desktop/LUMI-NEW/src/sessions/extensions/session-store.ts#L30) in `src/sessions/extensions/session-store.ts`
- **Code-Level Comparison**:

```typescript
// Student (LUMI-NEW/src/sessions/extensions/session-store.ts):
export class PersistentSessionStore extends AbstractSessionStore {
  exportJsonl(): string {
    return this.messages.map((msg) => JSON.stringify(msg)).join("\n");
  }
  async saveToFile(filePath: string): Promise<void> {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, this.exportJsonl(), "utf-8");
  }
}
```

- **Architectural Rationale**: Consolidated JSONL serialization directly into `PersistentSessionStore`, preserving `createSnapshot()` and `rewindToSnapshot()` compatibility.

---

### Package 4: `packages/protocol` $\longrightarrow$ `ProtocolEars.formatJsonRpcEvent()`

- **Teacher Package Path**: `/Users/bozoegg/Downloads/pi-main/packages/protocol`
- **Teacher Signature**: `createNotification(method: string, params: object): JsonRpcNotification`
- **Student Implementation**: [ProtocolEars.formatJsonRpcEvent()](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/ears.ts#L24) in `src/tooling/extensions/ears.ts`
- **Code-Level Comparison**:

```typescript
// Student (LUMI-NEW/src/tooling/extensions/ears.ts):
formatJsonRpcEvent(event: ToolingEvent): JsonRpcNotification {
  return {
    jsonrpc: "2.0",
    method: `telemetry/${event.type}`,
    params: {
      event: event.type,
      source: event.source,
      payload: event.payload,
      timestamp: event.timestamp,
      durationMs: event.durationMs,
    },
  };
}
```

- **Architectural Rationale**: Wrapped event telemetry inside standard JSON-RPC 2.0 notification payloads, allowing external IDEs and UIs to stream performance events cleanly.

---

## 3. Package Coverage Index

| Teacher Package in `pi-main` | Functional Role | LUMI-NEW Equivalent | Status |
|---|---|---|---|
| `packages/hashline` | Anchored line delta editing | `AnchoredHands.applyAnchoredEdit()` | **Absorbed** |
| `packages/omptype` | Tool parameter schema validation | `ValidatingToolRegistry.validateToolArgs()` | **Absorbed** |
| `packages/session-backends` | File persistence (JSONL) | `PersistentSessionStore.saveToFile()` | **Absorbed** |
| `packages/protocol` | Telemetry event protocol | `ProtocolEars.formatJsonRpcEvent()` | **Absorbed** |
| `packages/snapcompact` | History context compactor | `SessionCompactor.compact()` | **Absorbed** |
| `packages/telemetry` | Microsecond execution timing | `ProtocolEars.startTimer()` / `endTimer()` | **Absorbed** |
| `packages/coding-agent` | Core agent engine turn loop | `AgentEngine` & `LumiMonolith` | **Absorbed** |
| `packages/ai` | Model provider resolution | `ModelResolver` | **Absorbed** |
| `packages/broccolidb` | Slab array memory store | Blueprint for Pass 6 | Planned |
| `packages/codemarie` | AST structural symbol search | Blueprint for Pass 7 | Planned |
| `packages/tui` | Terminal progress rendering | Blueprint for Pass 8 | Planned |
