# API Reference

Comprehensive class and interface reference for the LUMI-NEW Deterministic Game Engine Framework.

---

## Composition Root (`src/index.ts`)

### [LumiMonolith](file:///Users/bozoegg/Desktop/LUMI-NEW/src/index.ts#L57)
Deterministic Game Engine Monolith Composition Root implementing `IAgentEngine`.

- `tick(input: EngineTickInput): Promise<EngineTickResult>` [Primary Engine Tick Loop]
- `runTurn(prompt: string): Promise<EngineTickResult>` [Backward-compatible alias]
- `createSnapshot(): GameStateSnapshot` [Frame-perfect state snapshot capture]
- `rewindToSnapshot(snapshot: GameStateSnapshot): void` [State rewind/replay engine]
- `forkSession(newSessionId?: string): LumiMonolith` [Isolated engine instance forking]
- Properties: `config`, `sessionContext`, `sessionStore`, `sessionCompactor`, `sessionVfs`, `sessionMemoryStore`, `modelResolver`, `slashRouter`, `eyes`, `hands`, `ears`, `skillsIngestor`, `toolRegistry`, `promptComposer`, `agentEngine`.

---

## Core Contracts & Abstract Subsystems (`src/core/`)

### [AbstractAgentEngine](file:///Users/bozoegg/Desktop/LUMI-NEW/src/core/abstracts/abstract-agent-engine.ts#L12)
Template Method Abstract Base Class enforcing the deterministic frame tick lifecycle:
`tick() -> preTick() -> executeTick() -> postTick() -> renderTelemetry() -> EngineTickResult`

### [AbstractSessionStore](file:///Users/bozoegg/Desktop/LUMI-NEW/src/core/abstracts/abstract-session-store.ts#L7)
Abstract Base Class for session state stores with `createSnapshot()` and `rewindToSnapshot()` requirements.

### [AbstractHands](file:///Users/bozoegg/Desktop/LUMI-NEW/src/core/abstracts/abstract-hands.ts#L9)
Abstract Base Class for physics and mutation operations.

### [AbstractEars](file:///Users/bozoegg/Desktop/LUMI-NEW/src/core/abstracts/abstract-ears.ts#L4)
Abstract Base Class for audio and telemetry event outputs.

### [AbstractToolRegistry](file:///Users/bozoegg/Desktop/LUMI-NEW/src/core/abstracts/abstract-tool-registry.ts#L6)
Abstract Base Class for tool parameter validation and action dispatchers.

---

## Tier Subsystems (`src/agents/`, `src/sessions/`, `src/tooling/`)

### Agents (`src/agents/`)
- [AgentConfig](file:///Users/bozoegg/Desktop/LUMI-NEW/src/agents/base/agent-config.ts#L8): Model configuration.
- [AgentEngine](file:///Users/bozoegg/Desktop/LUMI-NEW/src/agents/extensions/agent-engine.ts#L18): Subclass of `AbstractAgentEngine`.
- [PromptComposer](file:///Users/bozoegg/Desktop/LUMI-NEW/src/agents/extensions/prompt-composer.ts#L14): System prompt composer.
- [ModelResolver](file:///Users/bozoegg/Desktop/LUMI-NEW/src/agents/extensions/model-resolver.ts#L13): Fallback model resolver.
- [AgentSlashRouter](file:///Users/bozoegg/Desktop/LUMI-NEW/src/agents/extensions/agent-slash-router.ts#L24): Interactive slash router.

### Sessions (`src/sessions/`)
- [SessionContext](file:///Users/bozoegg/Desktop/LUMI-NEW/src/sessions/base/session-context.ts#L7): Active session environment context.
- [PersistentSessionStore](file:///Users/bozoegg/Desktop/LUMI-NEW/src/sessions/extensions/session-store.ts#L14): Subclass of `AbstractSessionStore`.
- [SessionCompactor](file:///Users/bozoegg/Desktop/LUMI-NEW/src/sessions/extensions/session-compactor.ts#L8): History compactor.
- [SessionVfs](file:///Users/bozoegg/Desktop/LUMI-NEW/src/sessions/extensions/session-vfs.ts#L10): Virtual File System overlay manager.
- [SessionMemoryStore](file:///Users/bozoegg/Desktop/LUMI-NEW/src/sessions/extensions/session-memory-store.ts#L8): Long-term memory store.

### Tooling (`src/tooling/`)
- [Eyes](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/base/eyes.ts#L14): Perception subsystem.
- [AnchoredHands](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/hands.ts#L10): Subclass of `AbstractHands` with line-anchored edit support.
- [ProtocolEars](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/ears.ts#L4): Subclass of `AbstractEars` with JSON-RPC telemetry support.
- [SkillsIngestor](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/skills-ingestor.ts#L11): Skill discoverer.
- [ValidatingToolRegistry](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/extensions/tool-registry.ts#L9): Subclass of `AbstractToolRegistry` with schema parameter validation.

---

## Game Engine Container Factory (`src/factories/`)

### [MonolithFactory](file:///Users/bozoegg/Desktop/LUMI-NEW/src/factories/monolith-factory.ts#L18)
Factory pattern container for game engine initialization and snapshot restoration.
