import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import * as readline from "node:readline";
import * as http from "node:http";
import * as url from "node:url";
import type { EnvironmentKeyResolver, ProviderKeyStatus } from "../resolution/environment-key-resolver.js";
import type { AuthStorageVault } from "../resolution/auth-storage-vault.js";
import { CodexOAuthManager, OPENAI_CODEX_OAUTH_CONFIG } from "../resolution/codex-oauth-manager.js";
import type { CodexProviderBridge } from "../resolution/codex-provider-bridge.js";
import type { LlmProxyGateway } from "../resolution/llm-proxy-gateway.js";

export interface ProviderAuditStatus {
  provider: string;
  configured: boolean;
  source: "environment" | "vault" | "disk-oauth" | "proxy" | "none";
  maskedValue?: string;
}

export interface SetupWizardOptions {
  envKeyResolver: EnvironmentKeyResolver;
  authStorageVault: AuthStorageVault;
  codexOAuthManager: CodexOAuthManager;
  codexProviderBridge: CodexProviderBridge;
  proxyGateway: LlmProxyGateway;
}

/**
 * SetupWizard.
 * Interactive configuration wizard for LLM Provider API Keys & OpenAI Codex OAuth PKCE flow.
 * Manages key entry, local OAuth callback HTTP server execution, disk persistence (~/.lumi/config.json & ~/.codex/auth.json),
 * and connection diagnostic testing.
 */
export class SetupWizard {
  private readonly envKeyResolver: EnvironmentKeyResolver;
  private readonly authStorageVault: AuthStorageVault;
  private readonly codexOAuthManager: CodexOAuthManager;
  private readonly codexProviderBridge: CodexProviderBridge;
  private readonly proxyGateway: LlmProxyGateway;

  constructor(options: SetupWizardOptions) {
    this.envKeyResolver = options.envKeyResolver;
    this.authStorageVault = options.authStorageVault;
    this.codexOAuthManager = options.codexOAuthManager;
    this.codexProviderBridge = options.codexProviderBridge;
    this.proxyGateway = options.proxyGateway;

    this.loadSavedConfig();
  }

  auditStatus(): ProviderAuditStatus[] {
    const statuses: ProviderAuditStatus[] = [];

    // 1. Env & Vault API Keys
    const envStatuses = this.envKeyResolver.getProviderStatuses();
    for (const status of envStatuses) {
      const vaultToken = this.authStorageVault.getToken(status.provider);
      let source: ProviderAuditStatus["source"] = "none";
      let masked: string | undefined = undefined;

      if (vaultToken) {
        source = "vault";
        masked = `${vaultToken.substring(0, 4)}...${vaultToken.slice(-4)}`;
      } else if (status.hasKey) {
        source = "environment";
        masked = status.maskedKey;
      }

      statuses.push({
        provider: status.provider,
        configured: source !== "none",
        source,
        maskedValue: masked,
      });
    }

    // 2. OpenAI Codex OAuth
    const codexCreds = this.codexOAuthManager.getCredentials();
    const hasCodexOAuth = codexCreds !== null && !this.codexOAuthManager.isTokenExpired();
    statuses.push({
      provider: "openai-codex (OAuth)",
      configured: hasCodexOAuth,
      source: hasCodexOAuth ? "disk-oauth" : "none",
      maskedValue: codexCreds ? `Account: ${codexCreds.accountId || "standard"} (${codexCreds.email || "OAuth User"})` : undefined,
    });

    // 3. Custom LLM Proxy Gateway
    const proxyConfig = this.proxyGateway.getProxyConfig();
    statuses.push({
      provider: "custom-llm-proxy",
      configured: Boolean(proxyConfig?.baseUrl),
      source: proxyConfig?.baseUrl ? "proxy" : "none",
      maskedValue: proxyConfig?.baseUrl,
    });

    return statuses;
  }

  displayAuditTable(): void {
    console.log("\n\x1b[1;36m--- LUMI Model Provider & OAuth Status Audit ---\x1b[0m");
    const statuses = this.auditStatus();
    for (const status of statuses) {
      const icon = status.configured ? "\x1b[32m[✓ ACTIVE]\x1b[0m" : "\x1b[31m[✗ UNCONFIGURED]\x1b[0m";
      const sourceStr = status.source !== "none" ? `(\x1b[33m${status.source}\x1b[0m)` : "";
      const details = status.maskedValue ? `- ${status.maskedValue}` : "";
      console.log(`  ${icon} ${status.provider.padEnd(22)} ${sourceStr} ${details}`);
    }
    console.log();
  }

  async runInteractiveWizard(providedReadLine?: readline.Interface): Promise<void> {
    const isStandaloneRl = !providedReadLine;
    const rl = providedReadLine ?? readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    try {
      console.log("\n\x1b[1;35m============================================================\x1b[0m");
      console.log("\x1b[1;35m   LUMI Setup Wizard - Model Providers & OAuth Setup         \x1b[0m");
      console.log("\x1b[1;35m============================================================\x1b[0m");

      this.displayAuditTable();

      let exitWizard = false;
      while (!exitWizard) {
        console.log("\x1b[1;34mSetup Options:\x1b[0m");
        console.log("  [1] Configure API Keys (Anthropic, OpenAI, Gemini, DeepSeek)");
        console.log("  [2] Connect OpenAI Codex OAuth (PKCE Web Login)");
        console.log("  [3] Configure Custom LLM Proxy Endpoint");
        console.log("  [4] Test Connections & Verification Diagnostic");
        console.log("  [5] Display Status Audit Table");
        console.log("  [0] Save & Exit Setup Wizard\n");

        const choice = await this.askQuestion(rl, "\x1b[1;33mSelect option (0-5): \x1b[0m");
        switch (choice.trim()) {
          case "1":
            await this.configureApiKeys(rl);
            break;
          case "2":
            await this.configureCodexOAuth(rl);
            break;
          case "3":
            await this.configureProxyGateway(rl);
            break;
          case "4":
            await this.testConnections();
            break;
          case "5":
            this.displayAuditTable();
            break;
          case "0":
          case "exit":
          case "quit":
            exitWizard = true;
            console.log("\n\x1b[32m[✓] Setup wizard configuration saved successfully!\x1b[0m\n");
            break;
          default:
            console.log("\x1b[31mInvalid option, please choose 0 - 5.\x1b[0m\n");
            break;
        }
      }
    } finally {
      if (isStandaloneRl) {
        rl.close();
      }
    }
  }

  async configureApiKeys(rl: readline.Interface): Promise<void> {
    console.log("\n\x1b[1;36m--- Provider API Keys Setup ---\x1b[0m");
    const providers = [
      { name: "anthropic", label: "Anthropic API Key (sk-ant-...)", envVar: "ANTHROPIC_API_KEY" },
      { name: "openai", label: "OpenAI API Key (sk-...)", envVar: "OPENAI_API_KEY" },
      { name: "google", label: "Google Gemini API Key (AIzaSy...)", envVar: "GEMINI_API_KEY" },
      { name: "deepseek", label: "DeepSeek API Key (sk-...)", envVar: "DEEPSEEK_API_KEY" },
    ];

    for (const p of providers) {
      const existing = this.authStorageVault.getToken(p.name) || process.env[p.envVar];
      const masked = existing ? `${existing.substring(0, 4)}...${existing.slice(-4)}` : "not set";
      console.log(`\nCurrent ${p.name.toUpperCase()} status: \x1b[33m${masked}\x1b[0m`);

      const keyInput = await this.askQuestion(rl, `Enter new ${p.label} (Press Enter to keep current): `);
      const cleaned = keyInput.trim();

      if (cleaned.length > 0) {
        this.authStorageVault.setToken(p.name, cleaned);
        console.log(`\x1b[32m[✓] Updated ${p.name} API key in vault!\x1b[0m`);
      }
    }

    this.saveConfigToDisk();
    console.log("\n\x1b[32m[✓] All API key updates persisted.\x1b[0m\n");
  }

  async configureCodexOAuth(rl: readline.Interface): Promise<void> {
    console.log("\n\x1b[1;36m--- OpenAI Codex OAuth PKCE Connection Setup ---\x1b[0m");

    const authDetails = this.codexOAuthManager.generateAuthUrl();
    console.log("\n\x1b[1;33mStep 1: Open the following URL in your browser to authenticate:\x1b[0m");
    console.log(`\x1b[4;36m${authDetails.url}\x1b[0m\n`);

    // Launch temporary OAuth callback HTTP redirect listener on port 1455
    let receivedCode: string | null = null;
    let callbackServer: http.Server | null = null;

    const serverPromise = new Promise<string | null>((resolve) => {
      try {
        callbackServer = http.createServer((req, res) => {
          if (!req.url) {
            res.end("Invalid callback");
            return;
          }
          const parsed = url.parse(req.url, true);
          if (parsed.pathname === "/auth/callback" || parsed.query.code) {
            const code = parsed.query.code as string;
            if (code) {
              res.writeHead(200, { "Content-Type": "text/html" });
              res.end(`
                <html>
                  <body style="font-family: system-ui; text-align: center; padding: 40px; background: #0f172a; color: #f8fafc;">
                    <h1 style="color: #38bdf8;">Authorization Successful!</h1>
                    <p style="font-size: 18px;">LUMI Agent OAuth authentication code received.</p>
                    <p style="color: #94a3b8;">You may close this tab and return to your terminal.</p>
                  </body>
                </html>
              `);
              resolve(code);
              return;
            }
          }
          res.writeHead(400);
          res.end("No authorization code found");
        });

        callbackServer.listen(OPENAI_CODEX_OAUTH_CONFIG.callbackPort, () => {
          console.log(`\x1b[90mListening for OAuth redirect callback on http://localhost:${OPENAI_CODEX_OAUTH_CONFIG.callbackPort}/auth/callback...\x1b[0m`);
        });

        callbackServer.on("error", () => {
          // Port in use or bound, fall back gracefully to manual input
          resolve(null);
        });
      } catch {
        resolve(null);
      }
    });

    console.log("\x1b[1;34mStep 2:\x1b[0m Waiting for browser login redirect OR paste code/URL manually below.");
    
    // Prompt user in parallel (race auto callback vs manual paste)
    const manualInputPromise = this.askQuestion(rl, "Paste authorization code or full callback URL (or press Enter if auto-captured): ");

    const inputResult = await Promise.race([
      serverPromise,
      manualInputPromise.then((text) => text.trim()),
    ]);

    if (callbackServer) {
      try {
        (callbackServer as http.Server).close();
      } catch {
        // Ignored
      }
    }

    let codeToExchange: string | null = null;
    if (inputResult && inputResult.length > 0) {
      if (inputResult.includes("code=")) {
        try {
          const parsed = new URL(inputResult.startsWith("http") ? inputResult : `http://localhost?${inputResult}`);
          codeToExchange = parsed.searchParams.get("code");
        } catch {
          codeToExchange = inputResult;
        }
      } else {
        codeToExchange = inputResult;
      }
    }

    if (!codeToExchange) {
      console.log("\x1b[31m[!] No authorization code received. OAuth setup cancelled.\x1b[0m\n");
      return;
    }

    console.log("\n\x1b[33mExchanging authorization code for OpenAI Codex OAuth tokens...\x1b[0m");
    try {
      const creds = await this.codexOAuthManager.exchangeCodeForTokens(codeToExchange, authDetails.codeVerifier);
      this.saveCodexCredentialsToDisk(creds);

      console.log("\x1b[1;32m[✓] OpenAI Codex OAuth Authentication Successful!\x1b[0m");
      console.log(`  Account ID: \x1b[36m${creds.accountId || "standard"}\x1b[0m`);
      if (creds.email) console.log(`  User Email: \x1b[36m${creds.email}\x1b[0m`);
      console.log(`  Expires In: \x1b[36m${Math.round((creds.expires - Date.now()) / 60000)} minutes\x1b[0m`);
      console.log(`  Saved to:   \x1b[90m~/.codex/auth.json & ~/.lumi/config.json\x1b[0m\n`);
    } catch (err: any) {
      console.error(`\x1b[31m[✗] Codex OAuth Token Exchange Failed:\x1b[0m`, err?.message || err);
    }
  }

  async configureProxyGateway(rl: readline.Interface): Promise<void> {
    console.log("\n\x1b[1;36m--- Custom LLM Proxy Gateway Setup ---\x1b[0m");
    const currentProxy = this.proxyGateway.getProxyConfig();
    console.log(`Current Proxy Base URL: \x1b[33m${currentProxy?.baseUrl || "none"}\x1b[0m`);

    const newUrl = await this.askQuestion(rl, "Enter Custom LLM Proxy Base URL (e.g. http://localhost:8080/v1, or press Enter to clear): ");
    const cleaned = newUrl.trim();

    if (cleaned.length === 0) {
      this.proxyGateway.configureProxy(null);
      console.log("\x1b[32m[✓] Custom LLM Proxy cleared.\x1b[0m\n");
    } else {
      const apiKey = await this.askQuestion(rl, "Enter Proxy Bearer Token / API Key (optional): ");
      this.proxyGateway.configureProxy({
        baseUrl: cleaned,
        apiKey: apiKey.trim() || undefined,
      });
      console.log("\x1b[32m[✓] Custom LLM Proxy configured successfully!\x1b[0m\n");
    }

    this.saveConfigToDisk();
  }

  async testConnections(): Promise<void> {
    console.log("\n\x1b[1;36m--- Connection Verification Diagnostic ---\x1b[0m");

    const testModels = [
      { name: "gpt-5.6-terra", provider: "OpenAI Codex OAuth" },
      { name: "claude-3-5-sonnet", provider: "Anthropic" },
      { name: "gpt-4o", provider: "OpenAI" },
      { name: "gemini-1.5-pro", provider: "Google Gemini" },
      { name: "deepseek-v3", provider: "DeepSeek" },
    ];

    for (const item of testModels) {
      const resolvedAuth = await this.codexProviderBridge.resolveProviderAuth(item.name);
      const hasAuth = resolvedAuth.authType !== "none";
      const statusIcon = hasAuth ? "\x1b[32m[PASS]\x1b[0m" : "\x1b[31m[FAIL]\x1b[0m";
      const authTypeStr = `Auth Type: \x1b[33m${resolvedAuth.authType}\x1b[0m`;
      const headerCount = Object.keys(resolvedAuth.headers).length;
      console.log(`  ${statusIcon} Model: ${item.name.padEnd(20)} (${item.provider.padEnd(20)}) -> ${authTypeStr} (${headerCount} headers resolved)`);
    }

    console.log("\n\x1b[32mDiagnostic completed.\x1b[0m\n");
  }

  private saveConfigToDisk(): void {
    try {
      const configDir = path.join(os.homedir(), ".lumi");
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      const configPath = path.join(configDir, "config.json");
      const tokens: Record<string, string> = {};
      for (const provider of this.authStorageVault.listProviders()) {
        const t = this.authStorageVault.getToken(provider);
        if (t) tokens[provider] = t;
      }

      const proxy = this.proxyGateway.getProxyConfig();

      const data = {
        tokens,
        proxy,
        updatedAt: Date.now(),
      };

      fs.writeFileSync(configPath, JSON.stringify(data, null, 2), "utf-8");
    } catch {
      // Ignore write errors
    }
  }

  private loadSavedConfig(): void {
    try {
      const configPath = path.join(os.homedir(), ".lumi", "config.json");
      if (fs.existsSync(configPath)) {
        const raw = fs.readFileSync(configPath, "utf-8");
        const data = JSON.parse(raw) as {
          tokens?: Record<string, string>;
          proxy?: { baseUrl?: string; apiKey?: string };
        };

        if (data.tokens) {
          for (const [provider, token] of Object.entries(data.tokens)) {
            if (token) {
              this.authStorageVault.setToken(provider, token);
            }
          }
        }

        if (data.proxy && data.proxy.baseUrl) {
          this.proxyGateway.configureProxy({
            baseUrl: data.proxy.baseUrl,
            apiKey: data.proxy.apiKey,
          });
        }
      }
    } catch {
      // Ignore load errors
    }
  }

  private saveCodexCredentialsToDisk(creds: any): void {
    try {
      const codexDir = path.join(os.homedir(), ".codex");
      if (!fs.existsSync(codexDir)) {
        fs.mkdirSync(codexDir, { recursive: true });
      }
      const codexPath = path.join(codexDir, "auth.json");
      const data = {
        type: "openai-codex",
        tokens: {
          access_token: creds.access_token,
          refresh_token: creds.refresh_token,
          account_id: creds.accountId,
          expires_in: Math.round((creds.expires - Date.now()) / 1000),
        },
        email: creds.email,
        updatedAt: Date.now(),
      };
      fs.writeFileSync(codexPath, JSON.stringify(data, null, 2), "utf-8");
    } catch {
      // Ignore write errors
    }

    this.saveConfigToDisk();
  }

  private askQuestion(rl: readline.Interface, promptText: string): Promise<string> {
    return new Promise((resolve) => {
      rl.question(promptText, (answer) => {
        resolve(answer);
      });
    });
  }
}
