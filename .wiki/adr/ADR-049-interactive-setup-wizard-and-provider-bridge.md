# ADR-049: Interactive Setup Wizard, Model Provider Resolution & OpenAI Codex OAuth

## Status
**Accepted**

## Context
As **LUMI-NEW** expanded to 105 evolutionary passes, managing authentication credentials across multiple LLM providers (Anthropic, OpenAI, Google Gemini, DeepSeek, Custom Proxies) and OpenAI Codex OAuth PKCE authentication required a unified, interactive setup interface. Users needed an easy CLI and REPL routine to audit, configure, exchange, and verify model credentials without manually editing JSON files or exporting shell environment variables.

## Decision
We implemented **SetupWizard** ([setup-wizard.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/agents/extensions/setup/setup-wizard.ts)) as a dedicated setup extension module, integrated directly into the `LUMI` CLI (`lumi --setup`) and interactive REPL session (`/setup` command).

### Key Architectural Components

1. **Provider Key & Credentials Audit**:
   - Audits active key status across system environment variables (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `DEEPSEEK_API_KEY`), `AuthStorageVault`, `CodexOAuthManager` disk state (`~/.codex/auth.json`), and custom LLM proxy config.
   - Outputs a colorized status audit table showing active sources and masked keys.

2. **OpenAI Codex OAuth PKCE Flow & Callback Server**:
   - Generates PKCE challenge and authorization URL (`https://auth.openai.com/oauth/authorize`).
   - Launches a temporary HTTP callback server on `http://localhost:1455/auth/callback` to automatically capture the OAuth redirect code.
   - Exchanges code for access & refresh tokens, extracts `ChatGPT-Account-Id`, updates `AuthStorageVault`, and saves credentials to disk (`~/.codex/auth.json` and `~/.lumi/config.json`).

3. **Live LLM Provider Dispatch & Dynamic Fallback**:
   - Wires `CodexProviderBridge` and `LlmProxyGateway` into `AgentEngine` ([agent-engine.ts](file:///Users/bozoegg/Desktop/LUMI-NEW/src/agents/extensions/execution/agent-engine.ts)).
   - Performs live LLM API dispatches when authenticated.
   - Generates standalone, interactive HTML5/JS applications (`index.html`) when creation prompts (such as `create a frogger game`) are executed offline or unauthenticated.

4. **Connection Verification Diagnostics**:
   - Evaluates header resolution across modern models (`gpt-5.6-terra`, `claude-3-5-sonnet`, `gpt-4o`, `gemini-1.5-pro`, `deepseek-v3`).

## Consequences

### Positive
- Zero manual JSON editing needed to configure API keys or OAuth credentials.
- Automates PKCE authorization code capture via local HTTP callback server.
- Live model dispatches and robust offline app creation fallback.

### Negative
- Local HTTP callback server requires port `1455` to be available during OAuth login.
