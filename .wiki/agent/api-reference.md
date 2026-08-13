# API Reference

Public contracts and operational entry points for the LUMI-NEW deterministic agent runtime.

## Composition root

### `LumiMonolith`

Source: [`src/index.ts`](../../src/index.ts)

- `tick(input: EngineTickInput): Promise<EngineTickResult>` executes one deterministic frame.
- `runTurn(prompt: string): Promise<EngineTickResult>` is the compatibility alias for a text-only turn.
- `setModel(modelName: string): void` changes the active model and persists it to `~/.lumi/config.json`.
- `createSnapshot(): GameStateSnapshot` captures a rewindable state snapshot.
- `rewindToSnapshot(snapshot: GameStateSnapshot): void` restores a snapshot.
- `forkSession(newSessionId?: string): LumiMonolith` creates an isolated engine instance.

## Turn and progress contracts

Source: [`src/core/contracts/agent.contracts.ts`](../../src/core/contracts/agent.contracts.ts)

```ts
type EngineProgressPhase =
  | "connecting"
  | "thinking"
  | "planning"
  | "tool"
  | "writing"
  | "verifying"
  | "responding"
  | "completed"
  | "failed"
  | "cancelled";

type EngineProgressStatus =
  | "started"
  | "in_progress"
  | "completed"
  | "failed"
  | "cancelled";

interface EngineTickInput {
  prompt: string;
  signal?: AbortSignal;
  onProgress?: (event: EngineProgressEvent) => void;
}

interface EngineProgressEvent {
  activityId: string;
  phase: EngineProgressPhase;
  status: EngineProgressStatus;
  message: string;
  detail?: string;
  timestamp: number;
  elapsedMs?: number;
  sequence: number;
  metadata?: EngineProgressMetadata;
}
```

`activityId` is stable for one logical activity. Consumers must update an existing row when that ID reappears, not append a duplicate. `sequence` increases within one turn and allows consumers to ignore stale updates. `phase` describes the kind of work; `status` describes its lifecycle state.

`metadata` may include `source`, `itemType`, safe workspace-relative `files`, `exitCode`, plan counts, and token usage. It must not contain credentials, raw command output, tool payloads, full model output, or hidden chain-of-thought.

```ts
const controller = new AbortController();
const activities = new Map<string, EngineProgressEvent>();

const result = await lumi.tick({
  prompt: "make a racing game",
  signal: controller.signal,
  onProgress(event) {
    const current = activities.get(event.activityId);
    if (!current || event.sequence >= current.sequence) {
      activities.set(event.activityId, event);
    }
  },
});
```

The callback is observational and best-effort. The engine contains callback exceptions so a renderer cannot terminate a model turn. The caller owns the `AbortController`; aborting the signal cancels the active local provider turn.

See [Agent Activity Streaming Strategy](streaming-activity-strategy.md) and [ADR-082](../adr/ADR-082-structured-agent-activity-streaming.md) for the complete lifecycle, security, and provider-fidelity rules.

## Provider activity adapter

### `CodexProgressAdapter`

Source: [`src/agents/extensions/execution/codex-progress-adapter.ts`](../../src/agents/extensions/execution/codex-progress-adapter.ts)

Converts `@openai/codex-sdk` thread events into `EngineProgressEvent` values.

- `start()` emits the initial connection activity.
- `handle(event: ThreadEvent)` maps thread, turn, and item lifecycle events.
- `cancel(message?)`, `timeout(message?)`, and `fail(message, detail?)` emit explicit terminal outcomes.

SDK item IDs become stable activity IDs. Started, updated, and completed events therefore occupy one timeline row. Supported item types include reasoning summaries, todo lists, commands, file changes, MCP tool calls, web searches, agent messages, and errors.

The adapter sanitizes and bounds all displayed text, reduces paths to workspace-relative names, deduplicates identical updates, and treats `item.completed` as authoritative. It never forwards command output or model response bodies through progress events.

## Interactive activity timeline

### `AgentActivityTimeline`

Source: [`src/tui/components/agent-activity-timeline.ts`](../../src/tui/components/agent-activity-timeline.ts)

The fullscreen terminal UI renders a persistent activity card rather than a single transient spinner.

- `update(event)` upserts by `activityId` and rejects lower-sequence stale events.
- `setElapsed(elapsedMs)` refreshes the visible duration while work is active.
- `completeIfNeeded(elapsedMs)` supplies a local completion terminal if a provider has no native lifecycle.
- `failIfNeeded(message, elapsedMs)` supplies a safe failure terminal.
- `isTerminal()` reports whether the turn has completed, failed, or been cancelled.

The timeline keeps a bounded number of visible rows, preserves terminal history, and settles any still-running rows after cancellation or failure.

## Provider dispatch behavior

Source: [`src/agents/extensions/execution/agent-engine.ts`](../../src/agents/extensions/execution/agent-engine.ts)

| Authentication route | Dispatch | Activity fidelity |
|---|---|---|
| OpenAI Codex OAuth | `@openai/codex-sdk` thread `runStreamed()` | Full thread, turn, item, usage, failure, and cancellation lifecycle |
| Provider API key | Provider HTTP endpoint | Coarse request started/completed/failed lifecycle |
| No matching credentials | No live provider call | Setup guidance is returned immediately |

The built-in Frogger generator is an explicit demo shortcut only: it activates when the prompt contains `frogger`. It is not the generic unauthenticated fallback for other creation prompts.

## Context and compaction

### `PersistentSessionStore`

Source: [`src/sessions/extensions/persistence/session-store.ts`](../../src/sessions/extensions/persistence/session-store.ts)

- `getMessages()` / `getActiveMessages()` return the bounded provider projection.
- `getTranscript()` returns defensive copies of the full-fidelity conversation.
- `resolveTranscriptReference(reference)` resolves a checkpoint SHA-256 address in constant expected time.
- `compact(compactor, policy?)` updates only the active projection and returns a `ContextCompactionReport`.
- JSONL export persists the durable transcript; import validates all records before replacing state.

### `ContextDslEngine`

Source: [`src/agents/extensions/compaction/context-dsl-engine.ts`](../../src/agents/extensions/compaction/context-dsl-engine.ts)

- `parseEnvelope(text)` parses the primary DSL context envelope into AST nodes (`context`, `thread`, `memory`, `tool-result`, `goal`).
- `parseAllEnvelopes(text)` extracts all embedded envelopes from a multi-line string.
- `serializeEnvelope(envelope)` generates canonical spec-compliant string formats.
- `validateIntegrity(content)` verifies structural completeness and SHA-256 transcript references.
- `computeMetrics(envelope)` calculates line count, byte size, token estimates, and record counts.

### `PromptTemplateEngine`

Source: [`src/agents/extensions/compaction/prompt-template-engine.ts`](../../src/agents/extensions/compaction/prompt-template-engine.ts)

- `render(template, variables)` compiles system prompt templates supporting `{{var}}` placeholders, `{{#if key}}...{{/if}}` conditional blocks, and `{{#unless key}}...{{/unless}}` negative blocks.

### `SessionCompactor`

Source: [`src/sessions/extensions/compaction/session-compactor.ts`](../../src/sessions/extensions/compaction/session-compactor.ts)

`compactWithReport(messages, policy?, sourceMessages?)` supports message and token triggers, target utilization, pinned-token reservation, recent-turn preference, bounded checkpoint size, and forced manual compaction. Delegates envelope serialization and parsing to `ContextDslEngine`. Reports include reason, estimated token deltas, summarized messages, preserved turns, checkpoint ID, and an explicit `overBudget` signal.

### `ContextBudgetCalculator` and `TokenTruncator`

Sources: [`context-budget-calculator.ts`](../../src/agents/extensions/compaction/context-budget-calculator.ts), [`token-truncator.ts`](../../src/agents/extensions/compaction/token-truncator.ts)

The calculator derives usable input, safety, proactive trigger, and post-compaction target budgets from a model specification. The truncator supplies conservative token estimation and the final turn-aware provider admission guard. See [ADR-083](../adr/ADR-083-token-aware-multi-turn-context-lifecycle.md).

## Setup and model selection

### `SetupWizard`

Source: [`src/agents/extensions/setup/setup-wizard.ts`](../../src/agents/extensions/setup/setup-wizard.ts)

- `auditStatus()` reports environment, vault, OAuth-disk, proxy, or unconfigured status.
- `configureProviderApiKey(provider, apiKey)` validates and persists a provider key.
- `setSavedModel(modelName)` persists the selected model.
- `beginCodexOAuthFlow()` creates PKCE data and starts the `localhost:1455` callback listener.
- `openCodexOAuthLogin(url)` launches only validated `https://auth.openai.com` URLs with the operating-system browser command.
- `completeCodexOAuthFlow(response, verifier)` accepts either an authorization code or a full callback URL, exchanges it, and persists LUMI credentials.
- `testConnections()` verifies auth resolution without exposing credential contents.

In the fullscreen guided setup, choosing Codex OAuth starts the callback listener, displays a clickable Markdown link and copyable URL, and attempts to open the system browser. Press `O` to retry. If the callback cannot be captured, paste the authorization code or full callback URL. If valid Codex credentials already exist, submit an empty field to keep them, select Codex, and persist its default model.

The standalone `lumi --setup` flow always prints the authorization URL and accepts either automatic callback capture or manual paste. Existing Codex CLI auth at `~/.codex/auth.json` is read when available and is never overwritten by LUMI setup; LUMI-managed configuration is stored in `~/.lumi/config.json`.

## Authentication resolution

### `CodexOAuthManager`

Source: [`src/agents/extensions/resolution/codex-oauth-manager.ts`](../../src/agents/extensions/resolution/codex-oauth-manager.ts)

- Generates S256 PKCE authorization URLs.
- Exchanges and refreshes access tokens.
- extracts `ChatGPT-Account-Id` from supported JWT claims.
- Loads credentials from explicit paths, `~/.codex/auth.json`, `~/.pi/auth.json`, and LUMI configuration.

### `CodexProviderBridge`

Source: [`src/agents/extensions/resolution/codex-provider-bridge.ts`](../../src/agents/extensions/resolution/codex-provider-bridge.ts)

Resolves OAuth, API-key, or unauthenticated mode for the selected model. Codex model families use the OAuth path when valid credentials are available.

## CLI and interactive commands

| Command | Purpose |
|---|---|
| `lumi` | Launch the fullscreen interactive shell; falls back to readline when necessary |
| `lumi --setup` | Launch standalone provider and OAuth setup |
| `lumi --benchmark` / `-b` | Run the benchmark suite |
| `lumi --smoke` / `-s` | Run the empirical smoke suite |
| `lumi "prompt"` | Execute a single prompt turn |
| `/setup` | Open guided provider setup in the interactive shell |
| `/settings` | Open settings and model selection |
| `/health` or `/status` | Audit runtime and provider health |
| `/clear` | Reset interactive history and frame state |
| `Esc` during a turn | Cancel the active fullscreen request |
| `Ctrl+C` | Cancel active work first; exit when no turn is active |

## Other core subsystems

- [`AbstractAgentEngine`](../../src/core/abstracts/abstract-agent-engine.ts) enforces `preTick -> executeTick -> postTick`.
- [`PersistentSessionStore`](../../src/sessions/extensions/persistence/session-store.ts) owns snapshot-compatible session persistence.
- [`SessionVfs`](../../src/sessions/extensions/vfs/session-vfs.ts) owns staged workspace overlays.
- [`ProtocolEars`](../../src/tooling/extensions/telemetry/ears.ts) owns protocol telemetry; it does not replace the user-facing progress contract.
- [`BroccoliStreamingToolExecutor`](../../src/tooling/extensions/registry/broccolidb-streaming-tool-executor.ts) owns an individual tool execution lifecycle; it is a separate layer from provider turn activity.
- [`MonolithFactory`](../../src/factories/monolith-factory.ts) is the composition factory.
