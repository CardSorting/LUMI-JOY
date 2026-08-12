# Troubleshooting & Verification Guide

Use this guide for provider setup, model selection, live activity, cancellation, and repository verification problems.

## Quick diagnostic path

1. Run `/health` or `/status` in the interactive shell.
2. Confirm the header shows the model you intended to use.
3. Run `/setup`, select the provider, and either keep existing valid credentials or reconnect.
4. Submit a small prompt and watch the persistent **Agent activity** card.
5. Press `Esc` if the request must be cancelled.

The model name in the header and `[OPERATIONAL]` process health do not, by themselves, prove that the selected model has usable credentials. The provider audit is authoritative for auth resolution.

## OAuth browser did not open

The fullscreen setup makes a best-effort operating-system browser launch. It also renders the same OpenAI authorization URL as a Markdown link and copyable text so browser-launch restrictions cannot block setup.

- Press `O` in the Codex OAuth configuration screen to retry the browser launch.
- Click **Open OpenAI sign-in** if the terminal supports links.
- Otherwise copy the displayed `https://auth.openai.com/...` URL into a browser.
- Complete login and return to the terminal. LUMI listens on `http://localhost:1455/auth/callback`.
- If automatic capture is unavailable, paste the authorization code or the complete callback URL into the input.

The standalone `lumi --setup` flow prints the URL and supports automatic callback capture or manual paste. It does not depend on a clickable terminal hyperlink.

If port `1455` is busy, close the other listener or use manual callback paste. LUMI reports that automatic capture is unavailable instead of leaving the setup screen silent.

## Codex is already authenticated, but LUMI says to run setup

This usually means authentication and active-model selection are out of sync.

1. Open `/setup` and inspect **OpenAI Codex OAuth**. LUMI can load valid Codex credentials from `~/.codex/auth.json`, `~/.pi/auth.json`, or `~/.lumi/config.json`.
2. If it is marked active, select it and submit an empty field. This keeps the existing login and makes the Codex default model active.
3. Confirm the header changed to the expected Codex model, then run `/health`.
4. If another process created or refreshed `~/.codex/auth.json` after LUMI started, restart LUMI so its in-memory auth manager reloads disk state.
5. If the credential is expired and cannot refresh, reconnect through `/setup`.

Model selection is persisted to `~/.lumi/config.json`. LUMI setup does not overwrite existing Codex CLI authentication.

## The request appears frozen on “Thinking”

The fullscreen shell now shows a persistent activity timeline with elapsed time and concrete lifecycle rows such as connecting, analyzing, running commands, applying files, and preparing the response. A changing elapsed timer means the event loop is still responsive even if the provider has not produced a new item event.

- Press `Esc` or `Ctrl+C` once to cancel the active turn. Cancellation is forwarded through `AbortSignal` and ends with a visible cancelled state.
- Run `/health` after cancellation to check provider resolution.
- Retry with a narrower prompt if the provider timed out.
- Codex SDK turns have a 10-minute ceiling. API-key HTTP routes use the configured proxy timeout, 30 seconds by default.
- A failed or cancelled Codex thread is discarded; the next request starts a clean thread.

Do not kill the process merely because no new activity row appeared for a short interval. Providers may spend time between lifecycle events. If elapsed time stops updating and cancellation does not respond, capture the terminal and logs as a UI event-loop defect.

## Activity row stays active after failure or cancellation

The terminal event must be one of `completed`, `failed`, or `cancelled`. `AgentActivityTimeline` settles any still-running child rows when it receives a turn-level cancellation or failure.

For custom consumers:

- Upsert events by `activityId`.
- Ignore an update whose `sequence` is lower than the stored event.
- Treat turn-level terminal events as authoritative.
- In your own `finally` block, stop timers and detach listeners.

If a custom `onProgress` handler throws, LUMI contains that error and continues the turn. Fix the handler, but do not expect it to cancel provider work.

## Live request fails after auth succeeds

LUMI distinguishes missing credentials from a live provider failure:

- **Live model is not connected** means no credentials resolved for the active model.
- **Model request failed** means authentication was found, but dispatch or the provider failed.
- **Model request timed out** means the configured deadline aborted the route.
- **Agent turn cancelled** means the local caller aborted it.

Run `/health`, confirm the selected model/provider pair, and reconnect only when the audit shows the credential is missing or expired. Provider error details are sanitized and bounded before display; consult local debug logs for deeper transport diagnostics without adding raw bodies to progress events.

## Progress integration rules

`EngineTickInput.onProgress` receives safe lifecycle metadata, not response streaming. Never expect it to contain full assistant messages, raw command output, tool arguments/results, credentials, or hidden chain-of-thought. Obtain the final answer from `EngineTickResult.response`.

See [Agent Activity Streaming Strategy](streaming-activity-strategy.md) for the complete contract and [API Reference](api-reference.md) for integration examples.

## Repository verification

Run the full local gate after changing provider dispatch, activity mapping, TUI behavior, or setup:

```bash
npm run check
npm test
npm run build
```

For a manual authenticated test:

1. Launch `lumi`.
2. Select a Codex OAuth model through `/setup` or `/settings`.
3. Submit a prompt that requires multiple actions.
4. Verify rows update in place and end terminally.
5. Start another prompt and press `Esc`; verify it becomes cancelled and the next prompt still runs.

## TypeScript and workspace errors

| Error | Root cause | Resolution |
|---|---|---|
| `TS2742: Inferred type ... cannot be named` | Public method lacks a portable explicit return type | Add an explicit return type |
| `TS2307: Cannot find module './...'` | ESM import omitted the `.js` suffix | Use explicit `.js` in TypeScript import specifiers |
| Erasable syntax failure | `enum`, `namespace`, parameter property, or another strip-only violation | Replace it with erasable TypeScript syntax |
| `Line anchor hash mismatch` | The target changed after its hash was computed | Re-read the file and recompute the line hash |
| Tool schema validation failed | Required or typed arguments do not match the registry schema | Correct the arguments before execution |
