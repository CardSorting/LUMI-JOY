# ADR-048: Phase 31 OpenAI Codex OAuth Integration & Provider Bridge (Passes 103–105)

- **Status**: Accepted
- **Date**: 2026-08-09
- **Domain**: Phase 31 OpenAI Codex OAuth & Multi-Provider Resolution
- **Authors**: AI Pair Programmer (Osmosis Strategy)

---

## 1. Context & Rationale

In Phase 31 (Passes 103–105), **LUMI-NEW** ingested OpenAI Codex OAuth authentication flow, PKCE token exchange, automatic token refreshing, JWT ChatGPT Account ID extraction, and Codex provider header bridge capabilities from `pi-main/packages/codemarie/src/integrations/openai-codex/oauth.ts`.

These capabilities are absorbed into single-responsibility monolithic extension classes (`CodexOAuthManager` and `CodexProviderBridge`), enabling LUMI-NEW to support OpenAI Codex OAuth models alongside standard API key providers cleanly without external monorepo dependencies.

---

## 2. Decision Specifications

### Pass 103: OpenAI Codex OAuth Manager (`CodexOAuthManager`)
- **Location**: `src/agents/extensions/resolution/codex-oauth-manager.ts`
- **Responsibilities**: Generates PKCE code verifiers & challenges (`generateAuthUrl()`), exchanges authorization codes for access/refresh tokens (`exchangeCodeForTokens()`), parses JWT claims for `ChatGPT-Account-Id`, handles token expiration buffering & automatic refreshing (`getValidAccessToken()`), and persists credentials into `AuthStorageVault`.

### Pass 104: Codex Provider Bridge (`CodexProviderBridge`)
- **Location**: `src/agents/extensions/resolution/codex-provider-bridge.ts`
- **Responsibilities**: Identifies Codex model provider families (`isCodexProvider()`), injects `Authorization: Bearer <token>` and `ChatGPT-Account-Id` headers (`createCodexFetchHeaders()`), and resolves request headers dynamically across Codex OAuth and API key providers (`resolveProviderAuth()`).

### Pass 105: Phase 31 Grand Subsystem Synthesis & Verification
- **Location**: `src/factories/grand-monolith-synthesizer.ts` & `src/index.ts`
- **Responsibilities**: Verifies end-to-end integration and cohesion across all 105 evolutionary passes.

---

## 3. Verification & Compliance

- **TypeScript Type Safety**: Verified with `npm run check` (0 errors).
- **Runtime Execution**: Verified via `npx tsx src/index.ts` (105 passes verified cleanly).

---

## Current Refinement: Authenticated Codex Dispatch

Credential resolution remains the bridge's responsibility. Once it resolves `codex-oauth`, live turns use `@openai/codex-sdk`: `AgentEngine` creates/reuses a model-and-workspace-specific thread and calls `runStreamed(prompt, { signal })`. `CodexProgressAdapter` maps official thread, turn, and item events into the public safe lifecycle. Failed or cancelled threads are discarded before the next turn. See [ADR-082](ADR-082-structured-agent-activity-streaming.md) and the [streaming strategy](../agent/streaming-activity-strategy.md).
