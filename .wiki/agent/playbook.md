# LUMI-NEW Agent Playbook

This playbook serves as the primary orientation document for AI agents working in `/Users/bozoegg/Desktop/LUMI-NEW`.

## Current System Snapshot

LUMI-NEW is a greenfield 3-tier monolithic agent framework built in TypeScript for Node.js (ESM). It is structured around the architectural design of a **Deterministic Game Engine**, where turns execute as frame ticks (`tick()`), state transitions are captured in immutable snapshots (`GameStateSnapshot`), and the runtime supports frame-perfect state rewind and replay.

Tiers expand organically as needed to support specialized subsystem features, with the primary constraint being strict alignment with the Deterministic Game Engine Strategy.

### Deterministic Game Engine Subsystems

- **Core Contracts & Abstracts (`src/core/`)**
  - Contracts: `agent.contracts.ts`, `session.contracts.ts`, `tooling.contracts.ts`
  - Abstracts: `AbstractAgentEngine`, `AbstractSessionStore`, `AbstractHands`, `AbstractEars`, `AbstractToolRegistry`
- **Tier 1: Agents (`src/agents/`)**
  - `base/agent-config.ts`: AgentConfig
  - `extensions/`: PromptComposer, ModelResolver, AgentSlashRouter, AgentEngine (`extends AbstractAgentEngine`)
- **Tier 2: Sessions (`src/sessions/`)**
  - `base/session-context.ts`: SessionContext
  - `extensions/`: SessionCompactor, SessionVfs, SessionMemoryStore, PersistentSessionStore (`extends AbstractSessionStore`)
- **Tier 3: Tooling (`src/tooling/`)**
  - `base/eyes.ts`: Eyes
  - `extensions/`: SkillsIngestor, AnchoredHands (`extends AbstractHands`), ProtocolEars (`extends AbstractEars`), ValidatingToolRegistry (`extends AbstractToolRegistry`)
- **Container Factory & Composition Root**:
  - `src/factories/monolith-factory.ts`: MonolithFactory
  - `src/index.ts`: LumiMonolith (`IAgentEngine`)

## Validation & Execution Commands

```bash
# Type-check code without emitting JS
npm run check

# Launch interactive Setup Wizard (Model Providers & Codex OAuth)
lumi --setup

# Run automated engine benchmark & throughput evaluation suite
lumi --benchmark

# Execute 105-pass monolithic agent smoke test suite
lumi --smoke

# Run interactive REPL session
lumi
```

## Key Documentation & Strategy Links

- [Benchmark Performance Field Note](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/field-notes/BENCHMARK-PERFORMANCE-FIELD-NOTE.md)
- [The Osmosis Learning Methodology & Strategy Guide](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/agent/osmosis-methodology.md)
- [ADR-001: 3-Tier Monolithic Agent Architecture](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-001-3-tier-monolithic-agent-architecture.md)
- [ADR-049: Interactive Setup Wizard & Provider Bridge](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-049-interactive-setup-wizard-and-provider-bridge.md)
- [ADR-050: Automated Benchmark & Throughput Evaluation](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-050-automated-benchmark-and-throughput-evaluation.md)
- [API Reference](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/agent/api-reference.md)
- [Agent Memory & Constraints](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/agent/agent-memory.md)
