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
  - `extensions/execution/`: AgentEngine, InteractiveModeController, CodexProgressAdapter
  - `extensions/resolution/`: ModelResolver, AgentSlashRouter, OAuth/provider resolution
  - `extensions/setup/`: SetupWizard
- **Tier 2: Sessions (`src/sessions/`)**
  - `base/session-context.ts`: SessionContext
  - `extensions/`: SessionCompactor, SessionVfs, SessionMemoryStore, PersistentSessionStore (`extends AbstractSessionStore`)
- **Tier 3: Tooling (`src/tooling/`)**
  - `base/eyes.ts`: Eyes
  - `extensions/`: SkillsIngestor, AnchoredHands (`extends AbstractHands`), ProtocolEars (`extends AbstractEars`), ValidatingToolRegistry (`extends AbstractToolRegistry`)
- **Terminal UI (`src/tui/`)**
  - `components/agent-activity-timeline.ts`: identity-based, persistent provider activity rendering
  - `components/guided-setup-walkthrough-modal.ts`: credential setup, browser fallback, and model activation
- **Container Factory & Composition Root**:
  - `src/factories/monolith-factory.ts`: MonolithFactory
  - `src/index.ts`: LumiMonolith (`IAgentEngine`)

## Validation & Execution Commands

```bash
# Type-check code without emitting JS
npm run check

# Run repository policy and regression validation
npm test

# Compile distributable JavaScript
npm run build

# Launch interactive Setup Wizard (Model Providers & Codex OAuth)
lumi --setup

# Run automated engine benchmark & throughput evaluation suite
lumi --benchmark

# Execute 105-pass monolithic agent smoke test suite
lumi --smoke

# Run interactive REPL session
lumi
```

## Live model turn checklist

When changing model dispatch or the interactive shell:

1. Preserve `EngineTickInput.signal` and `onProgress` through every local call boundary.
2. Map provider events to stable `activityId` values; upsert started/updated/completed states rather than appending duplicates.
3. Sanitize every message and detail. Progress must not contain raw output, credentials, tool payloads, or hidden reasoning.
4. Emit or synthesize exactly one turn terminal: `completed`, `failed`, or `cancelled`.
5. Clear elapsed timers and active abort-controller references in `finally`.
6. Verify a successful authenticated prompt, an `Esc` cancellation, and a subsequent prompt in the same session.

Provider fidelity is intentionally asymmetric: Codex OAuth is dispatched through `@openai/codex-sdk` and provides full lifecycle events, while API-key HTTP routes provide coarse request status. Do not manufacture detailed tool activity for a route that does not expose it.

## Key Documentation & Strategy Links

- [Benchmark Performance Field Note](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/field-notes/BENCHMARK-PERFORMANCE-FIELD-NOTE.md)
- [The Osmosis Learning Methodology & Strategy Guide](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/agent/osmosis-methodology.md)
- [ADR-001: 3-Tier Monolithic Agent Architecture](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-001-3-tier-monolithic-agent-architecture.md)
- [ADR-049: Interactive Setup Wizard & Provider Bridge](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-049-interactive-setup-wizard-and-provider-bridge.md)
- [ADR-082: Structured Agent Activity Streaming](../adr/ADR-082-structured-agent-activity-streaming.md)
- [ADR-050: Automated Benchmark & Throughput Evaluation](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/adr/ADR-050-automated-benchmark-and-throughput-evaluation.md)
- [API Reference](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/agent/api-reference.md)
- [Agent Activity Streaming Strategy](streaming-activity-strategy.md)
- [Troubleshooting & Verification](troubleshooting.md)
- [Agent Memory & Constraints](file:///Users/bozoegg/Desktop/LUMI-NEW/.wiki/agent/agent-memory.md)
