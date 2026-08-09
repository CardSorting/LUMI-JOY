# LUMI-NEW Agent Playbook

This playbook serves as the primary orientation document for AI agents working in `/Users/bozoegg/Desktop/LUMI-NEW`.

## Current System Snapshot

LUMI-NEW is a greenfield 3-tier monolithic agent framework built in TypeScript for Node.js (ESM). It is structured around the architectural design of a **Deterministic Game Engine**, where turns execute as frame ticks (`tick()`), state transitions are captured in immutable snapshots (`GameStateSnapshot`), and the runtime supports frame-perfect state rewind and replay.

The framework evolves continuously through **The Osmosis Learning Methodology**, absorbing core features from the teacher model (`/Users/bozoegg/Downloads/pi-main`) and reinferring them cleanly into the 3-tier monolith.

### Deterministic Game Engine Subsystems

- **Core Contracts & Abstracts (`src/core/`)**
  - Contracts: `agent.contracts.ts`, `session.contracts.ts`, `tooling.contracts.ts`
  - Abstracts: `AbstractAgentEngine`, `AbstractSessionStore`, `AbstractHands`, `AbstractEars`, `AbstractToolRegistry`
- **Tier 1: Agents (`src/agents/`)** [5 classes - MAX CAP]
  - `base/agent-config.ts`: AgentConfig
  - `extensions/`: PromptComposer, ModelResolver, AgentSlashRouter, AgentEngine (`extends AbstractAgentEngine`)
- **Tier 2: Sessions (`src/sessions/`)** [5 classes - MAX CAP]
  - `base/session-context.ts`: SessionContext
  - `extensions/`: SessionCompactor, SessionVfs, SessionMemoryStore, PersistentSessionStore (`extends AbstractSessionStore`)
- **Tier 3: Tooling (`src/tooling/`)** [5 classes - MAX CAP]
  - `base/eyes.ts`: Eyes
  - `extensions/`: SkillsIngestor, AnchoredHands (`extends AbstractHands`), ProtocolEars (`extends AbstractEars`), ValidatingToolRegistry (`extends AbstractToolRegistry`)
- **Container Factory & Composition Root**:
  - `src/factories/monolith-factory.ts`: MonolithFactory
  - `src/index.ts`: LumiMonolith (`IAgentEngine`)

## Validation Commands

```bash
# Type-check code without emitting JS
npm run check

# Execute monolithic agent turn loop smoke test
npx tsx src/index.ts
```

## Key Documentation & Strategy Links

- [The Osmosis Learning Methodology & Strategy Guide](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/agent/osmosis-methodology.md)
- [ADR-001: 3-Tier Monolithic Agent Architecture](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-001-3-tier-monolithic-agent-architecture.md)
- [ADR-007: Explicit OOP Class Extension Hierarchy](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-007-oop-class-extension-hierarchy.md)
- [ADR-008: Deterministic Game Engine Architecture](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-008-deterministic-game-engine-architecture.md)
- [API Reference](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/agent/api-reference.md)
- [Agent Memory & Constraints](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/agent/agent-memory.md)
