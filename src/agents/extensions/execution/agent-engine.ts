import * as fs from "node:fs";
import * as path from "node:path";
import { createHash } from "node:crypto";
import { Codex, type Thread } from "@openai/codex-sdk";
import { AbstractAgentEngine } from "../../../core/abstracts/abstract-agent-engine.js";
import type {
  EngineProgressEvent,
  EngineTickInput,
  EngineTickResult,
} from "../../../core/contracts/agent.contracts.js";
import type { SessionMessage } from "../../../core/contracts/session.contracts.js";
import type { AgentConfig } from "../../base/agent-config.js";
import type { SessionContext } from "../../../sessions/base/session-context.js";
import type { PersistentSessionStore } from "../../../sessions/extensions/persistence/session-store.js";
import type { ValidatingToolRegistry } from "../../../tooling/extensions/registry/tool-registry.js";
import type { PromptComposer } from "../compaction/prompt-composer.js";
import type { SessionCompactor } from "../../../sessions/extensions/compaction/session-compactor.js";
import { ContextBudgetCalculator, type ContextBudgetInfo } from "../compaction/context-budget-calculator.js";
import { TokenTruncator } from "../compaction/token-truncator.js";
import type { ModelResolver } from "../resolution/model-resolver.js";
import { ModelCatalog } from "../resolution/model-catalog.js";
import type { SessionVfs } from "../../../sessions/extensions/vfs/session-vfs.js";
import type { SessionMemoryStore } from "../../../sessions/extensions/memory/session-memory-store.js";
import type { AgentSlashRouter } from "../resolution/agent-slash-router.js";
import type { CodexProviderBridge } from "../resolution/codex-provider-bridge.js";
import type { LlmProxyGateway } from "../resolution/llm-proxy-gateway.js";
import { CodexProgressAdapter } from "./codex-progress-adapter.js";
import { sanitizeProgressText } from "../../../core/utilities/progress-sanitizer.js";

const CODEX_TURN_TIMEOUT_MS = 10 * 60 * 1000;

interface PreparedProviderContext {
  messages: SessionMessage[];
  currentPrompt: string;
  budget: ContextBudgetInfo;
}

export interface AgentContextServices {
  modelCatalog?: ModelCatalog;
  budgetCalculator?: ContextBudgetCalculator;
  tokenTruncator?: TokenTruncator;
}

export class AgentEngine extends AbstractAgentEngine {
  readonly promptComposer: PromptComposer;
  readonly sessionCompactor: SessionCompactor;
  readonly modelResolver: ModelResolver;
  readonly sessionVfs: SessionVfs;
  readonly sessionMemoryStore: SessionMemoryStore;
  readonly slashRouter: AgentSlashRouter;
  readonly codexProviderBridge?: CodexProviderBridge;
  readonly proxyGateway?: LlmProxyGateway;
  private readonly codex: Codex;
  private codexThread: Thread | null = null;
  private codexThreadModel: string | null = null;
  private codexThreadCwd: string | null = null;
  private codexThreadContextGeneration = -1;
  private codexThreadPinnedContextKey: string | null = null;
  private codexThreadTranscriptLength = -1;
  private readonly runtimeModelCatalog: ModelCatalog;
  private readonly runtimeBudgetCalculator: ContextBudgetCalculator;
  private readonly runtimeTokenTruncator: TokenTruncator;
  private turnQueue: Promise<void> = Promise.resolve();

  constructor(
    config: AgentConfig,
    sessionContext: SessionContext,
    sessionStore: PersistentSessionStore,
    toolRegistry: ValidatingToolRegistry,
    promptComposer: PromptComposer,
    sessionCompactor: SessionCompactor,
    modelResolver: ModelResolver,
    sessionVfs: SessionVfs,
    sessionMemoryStore: SessionMemoryStore,
    slashRouter: AgentSlashRouter,
    codexProviderBridge?: CodexProviderBridge,
    proxyGateway?: LlmProxyGateway,
    codex: Codex = new Codex(),
    contextServices: AgentContextServices = {}
  ) {
    super(config, sessionContext, sessionStore, toolRegistry);
    this.promptComposer = promptComposer;
    this.sessionCompactor = sessionCompactor;
    this.modelResolver = modelResolver;
    this.sessionVfs = sessionVfs;
    this.sessionMemoryStore = sessionMemoryStore;
    this.slashRouter = slashRouter;
    this.codexProviderBridge = codexProviderBridge;
    this.proxyGateway = proxyGateway;
    this.codex = codex;
    this.runtimeModelCatalog = contextServices.modelCatalog ?? new ModelCatalog();
    this.runtimeBudgetCalculator = contextServices.budgetCalculator ?? new ContextBudgetCalculator();
    this.runtimeTokenTruncator = contextServices.tokenTruncator ?? new TokenTruncator();
  }

  /** Serialize mutations and stateful provider calls for deterministic turn order. */
  override async tick(input: EngineTickInput): Promise<EngineTickResult> {
    const predecessor = this.turnQueue;
    let releaseTurn: () => void = () => undefined;
    this.turnQueue = new Promise<void>((resolve) => {
      releaseTurn = resolve;
    });

    await predecessor;
    try {
      if (input.signal?.aborted) {
        throw new Error("Turn cancelled before execution");
      }
      return await super.tick(input);
    } finally {
      releaseTurn();
    }
  }

  protected async preTick(input: EngineTickInput): Promise<void> {
    this.sessionContext.incrementTurn();
  }

  protected async executeTick(input: EngineTickInput): Promise<EngineTickResult> {
    const sessionStore = this.sessionStore as PersistentSessionStore;
    const promptText = input.prompt?.trim() ?? "";

    // 1. Handle Slash Commands
    if (promptText) {
      const slashResult = await this.slashRouter.handleSlashCommand(promptText, {
        sessionContext: this.sessionContext,
        sessionStore,
        sessionCompactor: this.sessionCompactor,
        sessionVfs: this.sessionVfs,
        sessionMemoryStore: this.sessionMemoryStore,
        modelResolver: this.modelResolver,
        toolRegistry: this.toolRegistry as ValidatingToolRegistry,
      });

      if (slashResult.handled) {
        return {
          frameIndex: this.sessionContext.turnCount,
          activeModel: this.modelResolver.getActiveModel(),
          isFallbackModel: false,
          isSlashCommand: true,
          composedPrompt: promptText,
          response: slashResult.output ?? "Slash command executed.",
          toolResults: [],
        };
      }
    }

    // 2. Add User Message
    if (promptText) {
      sessionStore.addMessage({
        role: "user",
        content: promptText,
      });
    }

    // 3. Response Resolution & Action Dispatch. Provider-bound paths prepare
    // and compact context immediately before authentication/dispatch.
    let responseText = "";
    let responseUsedCodexThread = false;

    // Keep the built-in Frogger demo available without hijacking other game requests.
    const lowerPrompt = promptText.toLowerCase();
    if (lowerPrompt.includes("frogger")) {
      const gameFilePath = path.join(this.sessionContext.cwd, "index.html");
      const froggerHtml = this.generateFroggerHtml();
      fs.writeFileSync(gameFilePath, froggerHtml, "utf-8");

      this.sessionVfs.stageWrite("index.html", froggerHtml);

      responseText = `\x1b[1;32m[✓] Created Frogger Arcade Game!\x1b[0m\n` +
        `  File location: \x1b[36m${gameFilePath}\x1b[0m\n` +
        `  Features: Canvas 60FPS renderer, Frog player, Car obstacles, Floating river logs, Score & Lives system.\n` +
        `  To play: Open \x1b[33m${gameFilePath}\x1b[0m in any web browser!`;
    } else if (lowerPrompt.includes("racing") || lowerPrompt.includes("race game") || lowerPrompt.includes("racing game") || lowerPrompt.includes("car game")) {
      const gameFilePath = path.join(this.sessionContext.cwd, "index.html");
      const racingHtml = this.generateRacingGameHtml();
      fs.writeFileSync(gameFilePath, racingHtml, "utf-8");

      this.sessionVfs.stageWrite("index.html", racingHtml);

      responseText = `\x1b[1;32m[✓] Created Cyberpunk Turbo Racing Arcade Game!\x1b[0m\n` +
        `  File location: \x1b[36m${gameFilePath}\x1b[0m\n` +
        `  Features: Canvas 60FPS Pseudo-3D Engine, WASD/Arrow Steering, Turbo Nitro Boost, AI Traffic Cars, Speedometer HUD & Web Audio SFX.\n` +
        `  To play: Open \x1b[33m${gameFilePath}\x1b[0m in any web browser!`;
    } else if (promptText.startsWith("remember:")) {
      const fact = promptText.substring(9).trim();
      this.sessionMemoryStore.saveMemory("user_fact", fact, "fact");
      responseText = `Persisted memory fact: ${fact}`;
    } else if (promptText.startsWith("view:")) {
      const targetPath = promptText.substring(5).trim();
      responseText = `Read file content from ${targetPath}`;
    } else {
      // Attempt live LLM Dispatch if provider auth is available
      let liveResponse: string | null = null;
      let liveError: string | null = null;
      let liveFailureKind: "cancelled" | "timeout" | "provider" | null = null;
      let liveProgressActivityId = "provider:turn";
      let liveProgressSequence = 0;
      const liveStartedAt = Date.now();
      let progressManagedByCodex = false;
      let providerTimeoutSignal: AbortSignal | null = null;
      if (this.codexProviderBridge) {
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            progressManagedByCodex = false;
            const activeModel = this.modelResolver.getActiveModel();
            const preparedContext = this.prepareProviderContext(activeModel, promptText);
            const auth = await this.codexProviderBridge.resolveProviderAuth(activeModel);
            if (auth.authType === "codex-oauth") {
              progressManagedByCodex = true;
              liveResponse = await this.dispatchCodexTurn(
                preparedContext.currentPrompt,
                activeModel,
                preparedContext.messages,
                input.signal,
                input.onProgress
              );
              responseUsedCodexThread = liveResponse !== null;
            } else if (auth.authType === "api-key") {
              // A stateless API turn is invisible to an existing SDK thread.
              // Rehydrate from the canonical local context before any later SDK turn.
              this.resetCodexThread();
              liveProgressActivityId = "openai:turn";
              const requestStartedAt = Date.now();
              const timeoutSignal = AbortSignal.timeout(
                this.proxyGateway?.getEffectiveEndpoint("openai", "https://api.openai.com/v1/chat/completions").timeoutMs ?? 30000
              );
              providerTimeoutSignal = timeoutSignal;
              const requestSignal = input.signal
                ? AbortSignal.any([input.signal, timeoutSignal])
                : timeoutSignal;
              this.reportProgress(input.onProgress, {
                activityId: liveProgressActivityId,
                phase: "connecting",
                status: "started",
                message: `Connecting to ${activeModel}`,
                detail: "Sending authenticated model request",
                timestamp: requestStartedAt,
                sequence: ++liveProgressSequence,
                metadata: { source: "openai-api" },
              });
              const endpoint = this.proxyGateway?.getEffectiveEndpoint("openai", "https://api.openai.com/v1/chat/completions") ?? {
                url: "https://api.openai.com/v1/chat/completions",
                headers: {},
                timeoutMs: 30000,
              };

              const payload = {
                model: activeModel,
                messages: preparedContext.messages.map((message) => ({
                  role: message.role,
                  content: message.content,
                  ...(message.name ? { name: message.name } : {}),
                  ...(message.toolCallId ? { tool_call_id: message.toolCallId } : {}),
                })),
                max_tokens: preparedContext.budget.reservedOutputTokens,
              };

              const res = await fetch(endpoint.url, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  ...endpoint.headers,
                  ...auth.headers,
                },
                body: JSON.stringify(payload),
                signal: requestSignal,
              });

              if (!res.ok) {
                const errorBody = await res.text();
                throw new Error(`HTTP ${res.status}: ${errorBody.slice(0, 500)}`);
              }

              const data = (await res.json()) as {
                choices?: Array<{ message?: { content?: string } }>;
              };
              liveResponse = data.choices?.[0]?.message?.content?.trim() || null;
              this.reportProgress(input.onProgress, {
                activityId: liveProgressActivityId,
                phase: "completed",
                status: "completed",
                message: "Model response received",
                detail: activeModel,
                timestamp: Date.now(),
                elapsedMs: Date.now() - requestStartedAt,
                sequence: ++liveProgressSequence,
                metadata: { source: "openai-api" },
              });
            } else {
              this.reportProgress(input.onProgress, {
                activityId: liveProgressActivityId,
                phase: "failed",
                status: "failed",
                message: "Live model is not connected",
                detail: `No credentials are available for ${activeModel}`,
                timestamp: Date.now(),
                elapsedMs: Date.now() - liveStartedAt,
                sequence: ++liveProgressSequence,
                metadata: { source: "lumi" },
              });
            }
            if (liveResponse) break;
          } catch (error) {
            liveError = this.formatLiveDispatchError(error);
            liveFailureKind = input.signal?.aborted
              ? "cancelled"
              : providerTimeoutSignal?.aborted || liveError.toLowerCase().includes("timed out after")
                ? "timeout"
                : "provider";
            if (liveFailureKind === "timeout" && !liveError.toLowerCase().includes("timed out")) {
              liveError = "Provider request timed out before a response was received";
            }
            if (liveFailureKind === "provider" && !input.signal?.aborted && attempt < 1) {
              const previousModel = this.modelResolver.getActiveModel();
              const fallbackModel = this.modelResolver.triggerFallback(liveError);
              this.reportProgress(input.onProgress, {
                activityId: liveProgressActivityId,
                phase: "connecting",
                status: "in_progress",
                message: `Connection failover from ${previousModel}`,
                detail: `Failing over to ${fallbackModel}...`,
                timestamp: Date.now(),
                sequence: ++liveProgressSequence,
                metadata: { source: "lumi" },
              });
              liveError = null;
              continue;
            }
            if (!progressManagedByCodex) {
              const terminalStatus = liveFailureKind === "cancelled" ? "cancelled" : "failed";
              this.reportProgress(input.onProgress, {
                activityId: liveProgressActivityId,
                phase: terminalStatus,
                status: terminalStatus,
                message: terminalStatus === "cancelled"
                  ? "Agent turn cancelled"
                  : liveFailureKind === "timeout"
                    ? "Model request timed out"
                    : "Model request failed",
                detail: liveError,
                timestamp: Date.now(),
                elapsedMs: Date.now() - liveStartedAt,
                sequence: ++liveProgressSequence,
                metadata: { source: "openai-api" },
              });
            }
            break;
          }
        }
      }

      if (liveResponse) {
        responseText = liveResponse;
      } else if (liveFailureKind === "cancelled") {
        responseText = "[Cancelled] Agent turn cancelled by user.";
      } else if (liveFailureKind === "timeout") {
        responseText = `[Timed out] ${liveError}. You can retry with a narrower request.`;
      } else if (liveError) {
        responseText = `Live model request failed for ${this.modelResolver.getActiveModel()}: ${liveError}\n` +
          `[Authentication is configured. Run \x1b[33m/health\x1b[0m for diagnostics or \x1b[33m/setup\x1b[0m to reconnect.]`;
      } else {
        responseText = `Processed turn prompt: "${promptText}".\n` +
          `[Note: Run \x1b[33mlumi --setup\x1b[0m or \x1b[33m/setup\x1b[0m to connect API keys or OpenAI Codex OAuth for full live AI responses.]`;
      }
    }

    // 4. Add Assistant Response Message
    sessionStore.addMessage({
      role: "assistant",
      content: responseText,
    });

    const maintenanceCompaction = sessionStore.getMessages().length > this.config.maxTurns
      ? sessionStore.compact(this.sessionCompactor, { maxMessages: this.config.maxTurns })
      : undefined;

    if (maintenanceCompaction?.compacted) {
      this.resetCodexThread();
    } else if (responseUsedCodexThread) {
      this.codexThreadTranscriptLength = sessionStore.getTranscript().length;
    } else {
      // Local/demo, memory, API-key, and failed turns are not present in the
      // stateful SDK transcript. Force an exact local rehydration next time.
      this.resetCodexThread();
    }

    this.modelResolver.recordTurnExecution(
      promptText.length,
      responseText.length
    );

    return {
      frameIndex: this.sessionContext.turnCount,
      activeModel: this.modelResolver.getActiveModel(),
      isFallbackModel: false,
      isSlashCommand: false,
      composedPrompt: promptText,
      response: responseText,
      toolResults: [],
    };
  }

  protected async postTick(_result: EngineTickResult): Promise<void> {
    // Post-tick state audit hook
  }

  private async dispatchCodexTurn(
    promptText: string,
    activeModel: string,
    contextMessages: readonly SessionMessage[],
    signal?: AbortSignal,
    onProgress?: (event: EngineProgressEvent) => void
  ): Promise<string> {
    const cwd = this.sessionContext.cwd;
    const sessionStore = this.sessionStore as PersistentSessionStore;
    const contextGeneration = sessionStore.getContextGeneration();
    const pinnedContextKey = this.fingerprintPinnedContext(contextMessages);
    const transcriptLength = sessionStore.getTranscript().length;
    const hasUnexpectedTranscriptMutation =
      this.codexThreadTranscriptLength >= 0 &&
      transcriptLength !== this.codexThreadTranscriptLength + 1;
    let requiresBootstrap = false;
    if (
      !this.codexThread ||
      this.codexThreadModel !== activeModel ||
      this.codexThreadCwd !== cwd ||
      this.codexThreadContextGeneration !== contextGeneration ||
      this.codexThreadPinnedContextKey !== pinnedContextKey ||
      hasUnexpectedTranscriptMutation
    ) {
      this.resetCodexThread();
      this.codexThread = this.codex.startThread({
        model: activeModel,
        workingDirectory: cwd,
        skipGitRepoCheck: true,
        sandboxMode: "workspace-write",
        approvalPolicy: "never",
      });
      this.codexThreadModel = activeModel;
      this.codexThreadCwd = cwd;
      this.codexThreadContextGeneration = contextGeneration;
      this.codexThreadPinnedContextKey = pinnedContextKey;
      requiresBootstrap = true;
    }

    const timeoutSignal = AbortSignal.timeout(CODEX_TURN_TIMEOUT_MS);
    const watchdogAbort = new AbortController();
    const turnSignal = signal
      ? AbortSignal.any([signal, timeoutSignal, watchdogAbort.signal])
      : AbortSignal.any([timeoutSignal, watchdogAbort.signal]);

    const progress = new CodexProgressAdapter({
      cwd,
      model: activeModel,
      onProgress,
    });
    progress.start();

    let lastEventAt = Date.now();
    let finalResponse = "";
    let turnCompleted = false;
    const activeTools = new Set<string>();

    const watchdogInterval = setInterval(() => {
      if (turnCompleted || watchdogAbort.signal.aborted) return;
      const idleMs = Date.now() - lastEventAt;

      // Watchdog Rule A: Response message ready, no tools actively running, stream idle for 5s
      if (activeTools.size === 0 && finalResponse.trim().length > 0 && idleMs > 5_000) {
        watchdogAbort.abort(new Error("inactivity_watchdog_response_ready"));
      } else if (idleMs > 45_000) {
        // Watchdog Rule B: Entire stream frozen for 45s without any events
        watchdogAbort.abort(new Error("inactivity_watchdog_stream_frozen"));
      }
    }, 500);
    watchdogInterval.unref?.();

    try {
      const providerPrompt = requiresBootstrap
        ? this.promptComposer.composeThreadBootstrap(contextMessages, promptText)
        : promptText;
      const { events } = await this.codexThread.runStreamed(providerPrompt, { signal: turnSignal });

      for await (const event of events) {
        lastEventAt = Date.now();
        progress.handle(event);

        if (event.type === "item.started" || event.type === "item.updated" || event.type === "item.completed") {
          if (event.item.type === "agent_message" && event.item.text) {
            finalResponse = event.item.text;
          } else if (
            event.item.type === "command_execution" ||
            event.item.type === "mcp_tool_call" ||
            event.item.type === "web_search"
          ) {
            if (event.type === "item.completed") {
              activeTools.delete(event.item.id);
            } else {
              activeTools.add(event.item.id);
            }
          }
        }

        if (event.type === "turn.completed") {
          turnCompleted = true;
          break;
        } else if (event.type === "turn.failed") {
          throw new Error(event.error.message);
        } else if (event.type === "error") {
          throw new Error(event.message);
        }
      }

      const response = finalResponse.trim();
      if (!response) {
        throw new Error("Codex completed the turn without a final response");
      }
      return response;
    } catch (error) {
      if (watchdogAbort.signal.aborted && finalResponse.trim().length > 0) {
        progress.completeTurnFallback(finalResponse.trim().length);
        return finalResponse.trim();
      }

      // A failed or cancelled child should never be reused as the next turn's transport.
      this.resetCodexThread();

      if (signal?.aborted) {
        progress.cancel();
        throw new Error("Turn cancelled by user");
      }
      if (timeoutSignal.aborted) {
        progress.timeout();
        throw new Error("Codex turn timed out");
      }
      if (watchdogAbort.signal.aborted) {
        progress.fail("Agent turn stalled", "Stream became inactive before turn completion");
        throw new Error("Codex turn stalled before receiving final response");
      }
      progress.fail("Agent turn failed", this.formatLiveDispatchError(error));
      throw error;
    } finally {
      clearInterval(watchdogInterval);
    }
  }

  private prepareProviderContext(activeModel: string, requestedPrompt = ""): PreparedProviderContext {
    const sessionStore = this.sessionStore as PersistentSessionStore;
    const model = this.runtimeModelCatalog.getModelInfo(activeModel);
    const requestedOutputTokens = Math.min(8_192, model.maxOutputTokens);
    const budget = this.runtimeBudgetCalculator.calculateBudget(
      activeModel,
      requestedOutputTokens,
      { contextWindowTokens: model.contextWindowTokens }
    );
    const memoryContext = this.sessionMemoryStore.formatMemoryContext();
    const promptConfig = activeModel === this.config.modelName
      ? this.config
      : { ...this.config, modelName: activeModel };
    const pinnedMessages = this.promptComposer.compileTurnMessages({
      config: promptConfig,
      sessionContext: this.sessionContext,
      messages: [],
      memoryContext,
    });
    const reservedTokens = this.runtimeTokenTruncator.estimateMessages(pinnedMessages);

    sessionStore.compact(this.sessionCompactor, {
      maxInputTokens: budget.availableInputTokens,
      triggerInputTokens: budget.compactionTriggerTokens,
      targetInputTokens: budget.targetInputTokens,
      reservedTokens,
      preserveRecentTurns: 4,
    });

    const compiled = this.promptComposer.compileTurnMessages({
      config: promptConfig,
      sessionContext: this.sessionContext,
      messages: [...sessionStore.getMessages()],
      memoryContext,
    });
    const guarded = this.runtimeTokenTruncator.truncateToTokenBudget(
      compiled,
      budget.availableInputTokens,
      { preserveRecentTurns: 1 }
    );
    const currentPrompt = requestedPrompt
      ? [...guarded].reverse().find((message) => message.role === "user")?.content ?? requestedPrompt
      : "";

    return {
      messages: guarded,
      currentPrompt,
      budget,
    };
  }

  private resetCodexThread(): void {
    this.codexThread = null;
    this.codexThreadModel = null;
    this.codexThreadCwd = null;
    this.codexThreadContextGeneration = -1;
    this.codexThreadPinnedContextKey = null;
    this.codexThreadTranscriptLength = -1;
  }

  private fingerprintPinnedContext(messages: readonly SessionMessage[]): string {
    const content = messages
      .filter(
        (message) =>
          message.role === "system" ||
          message.content.startsWith("LUMI-MEMORY/1")
      )
      .map((message) => `${message.role}\u0000${message.content}`)
      .join("\u0001");
    return createHash("sha256").update(content).digest("hex");
  }

  private reportProgress(
    onProgress: ((event: EngineProgressEvent) => void) | undefined,
    event: EngineProgressEvent
  ): void {
    try {
      onProgress?.({
        ...event,
        message: sanitizeProgressText(event.message, 160),
        ...(event.detail
          ? {
              detail: sanitizeProgressText(event.detail, 240),
            }
          : {}),
      });
    } catch {
      // Rendering progress is best-effort and must not interrupt the model turn.
    }
  }

  private formatLiveDispatchError(error: unknown): string {
    const message = error instanceof Error ? error.message : String(error);
    return sanitizeProgressText(message, 700) || "Unknown provider error";
  }

  private generateFroggerHtml(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LUMI Frogger Game</title>
  <style>
    body {
      background-color: #0f172a;
      color: #f8fafc;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
    }
    h1 {
      margin-bottom: 10px;
      color: #4ade80;
      text-shadow: 0 0 10px rgba(74, 222, 128, 0.4);
    }
    #game-container {
      position: relative;
      border: 4px solid #334155;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    }
    canvas {
      background: #000;
      display: block;
    }
    #score-board {
      margin-top: 15px;
      display: flex;
      gap: 30px;
      font-size: 18px;
      font-weight: bold;
    }
    .instructions {
      margin-top: 15px;
      color: #94a3b8;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <h1>🐸 LUMI Frogger Arcade 🐸</h1>
  <div id="game-container">
    <canvas id="gameCanvas" width="440" height="480"></canvas>
  </div>
  <div id="score-board">
    <div>SCORE: <span id="score">0</span></div>
    <div>LIVES: <span id="lives">3</span></div>
  </div>
  <div class="instructions">Use Arrow Keys (Up, Down, Left, Right) to guide the frog across the road and river!</div>

  <script>
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    const GRID = 40;
    let score = 0;
    let lives = 3;
    let gameOver = false;

    let frog = { x: 5 * GRID + 5, y: 11 * GRID + 5, width: 30, height: 30 };

    const obstacles = [
      { y: 10 * GRID, speed: 2, width: 50, color: '#ef4444', type: 'car' },
      { y: 9 * GRID, speed: -3, width: 60, color: '#f59e0b', type: 'car' },
      { y: 8 * GRID, speed: 2.5, width: 50, color: '#ec4899', type: 'car' },
      { y: 7 * GRID, speed: -4, width: 70, color: '#8b5cf6', type: 'car' },
      { y: 5 * GRID, speed: 1.5, width: 120, color: '#78350f', type: 'log' },
      { y: 4 * GRID, speed: -2, width: 90, color: '#0284c7', type: 'log' },
      { y: 3 * GRID, speed: 2.5, width: 140, color: '#78350f', type: 'log' },
      { y: 2 * GRID, speed: -1.8, width: 100, color: '#0284c7', type: 'log' },
      { y: 1 * GRID, speed: 3, width: 110, color: '#78350f', type: 'log' },
    ];

    let itemInstances = [];
    obstacles.forEach((ob, idx) => {
      for (let i = 0; i < 3; i++) {
        itemInstances.push({
          x: i * 160 + (idx % 2 * 40),
          y: ob.y,
          speed: ob.speed,
          width: ob.width,
          color: ob.color,
          type: ob.type
        });
      }
    });

    function resetFrog() {
      frog.x = 5 * GRID + 5;
      frog.y = 11 * GRID + 5;
    }

    document.addEventListener('keydown', (e) => {
      if (gameOver) return;
      if (e.key === 'ArrowUp' && frog.y > 0) frog.y -= GRID;
      if (e.key === 'ArrowDown' && frog.y < 11 * GRID) frog.y += GRID;
      if (e.key === 'ArrowLeft' && frog.x > 0) frog.x -= GRID;
      if (e.key === 'ArrowRight' && frog.x < 10 * GRID) frog.x += GRID;

      if (frog.y < GRID) {
        score += 100;
        document.getElementById('score').innerText = score;
        resetFrog();
      }
    });

    function update() {
      if (gameOver) return;

      itemInstances.forEach(item => {
        item.x += item.speed;
        if (item.speed > 0 && item.x > canvas.width) item.x = -item.width;
        if (item.speed < 0 && item.x < -item.width) item.x = canvas.width;
      });

      const frogRow = Math.floor(frog.y / GRID);

      if (frogRow >= 7 && frogRow <= 10) {
        itemInstances.filter(i => i.type === 'car').forEach(car => {
          if (Math.abs(car.y - frog.y) < 10 &&
              frog.x < car.x + car.width &&
              frog.x + frog.width > car.x) {
            handleDeath();
          }
        });
      }

      if (frogRow >= 1 && frogRow <= 5) {
        let onLog = false;
        itemInstances.filter(i => i.type === 'log').forEach(log => {
          if (Math.abs(log.y - frog.y) < 10 &&
              frog.x + frog.width / 2 >= log.x &&
              frog.x + frog.width / 2 <= log.x + log.width) {
            onLog = true;
            frog.x += log.speed;
          }
        });
        if (!onLog) {
          handleDeath();
        }
      }
    }

    function handleDeath() {
      lives--;
      document.getElementById('lives').innerText = lives;
      if (lives <= 0) {
        gameOver = true;
        alert('Game Over! Final Score: ' + score);
      } else {
        resetFrog();
      }
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#15803d';
      ctx.fillRect(0, 0, canvas.width, GRID);

      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(0, GRID, canvas.width, 5 * GRID);

      ctx.fillStyle = '#15803d';
      ctx.fillRect(0, 6 * GRID, canvas.width, GRID);

      ctx.fillStyle = '#334155';
      ctx.fillRect(0, 7 * GRID, canvas.width, 4 * GRID);

      ctx.fillStyle = '#15803d';
      ctx.fillRect(0, 11 * GRID, canvas.width, GRID);

      itemInstances.forEach(item => {
        ctx.fillStyle = item.color;
        ctx.fillRect(item.x, item.y + 5, item.width, GRID - 10);
      });

      ctx.fillStyle = '#22c55e';
      ctx.fillRect(frog.x, frog.y, frog.width, frog.height);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(frog.x + 4, frog.y + 4, 6, 6);
      ctx.fillRect(frog.x + 20, frog.y + 4, 6, 6);
      ctx.fillStyle = '#000000';
      ctx.fillRect(frog.x + 6, frog.y + 6, 3, 3);
      ctx.fillRect(frog.x + 22, frog.y + 6, 3, 3);
    }

    function loop() {
      update();
      draw();
      requestAnimationFrame(loop);
    }

    loop();
  </script>
</body>
</html>`;
  }

  private generateRacingGameHtml(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>⚡ LUMI Cyberpunk Turbo Racing ⚡</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #090a0f;
      color: #f1f5f9;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      overflow: hidden;
    }
    h1 {
      font-size: 24px;
      margin-bottom: 12px;
      color: #00f0ff;
      text-shadow: 0 0 12px rgba(0, 240, 255, 0.6);
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    #game-card {
      position: relative;
      border: 3px solid #1e293b;
      border-radius: 12px;
      box-shadow: 0 20px 50px rgba(0, 240, 255, 0.15), 0 0 20px rgba(255, 0, 127, 0.15);
      background: #020617;
      overflow: hidden;
    }
    canvas {
      display: block;
      background: #000;
    }
    .hud {
      position: absolute;
      top: 15px;
      left: 15px;
      right: 15px;
      display: flex;
      justify-content: space-between;
      pointer-events: none;
      font-family: monospace;
      font-weight: bold;
    }
    .hud-box {
      background: rgba(15, 23, 42, 0.8);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(0, 240, 255, 0.3);
      padding: 8px 16px;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    }
    .speed-val { font-size: 24px; color: #ff007f; text-shadow: 0 0 8px #ff007f; }
    .nitro-bar-container {
      width: 110px; height: 10px; background: #334155; border-radius: 5px; margin-top: 4px; overflow: hidden;
    }
    .nitro-bar-fill { height: 100%; width: 100%; background: linear-gradient(90deg, #00f0ff, #ff007f); transition: width 0.1s; }
    .controls-hint {
      margin-top: 14px;
      color: #94a3b8;
      font-size: 13px;
      display: flex;
      gap: 16px;
    }
    .badge {
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid #334155;
      padding: 4px 10px;
      border-radius: 4px;
      color: #e2e8f0;
    }
    #overlay {
      position: absolute;
      inset: 0;
      background: rgba(9, 10, 15, 0.85);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 10;
    }
    #overlay h2 { font-size: 32px; color: #ff007f; text-shadow: 0 0 15px #ff007f; margin-bottom: 10px; }
    #overlay button {
      margin-top: 20px;
      padding: 12px 28px;
      font-size: 16px;
      font-weight: bold;
      color: #090a0f;
      background: #00f0ff;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      box-shadow: 0 0 15px #00f0ff;
      transition: transform 0.1s;
    }
    #overlay button:hover { transform: scale(1.05); }
  </style>
</head>
<body>
  <h1>🏎️ LUMI CYBERPUNK TURBO RACER ⚡</h1>
  <div id="game-card">
    <canvas id="canvas" width="640" height="480"></canvas>
    <div class="hud">
      <div class="hud-box">
        <div>SPEED: <span class="speed-val" id="speed">0</span> <span style="font-size:12px;color:#94a3b8">MPH</span></div>
        <div style="font-size:10px;color:#94a3b8;margin-top:2px">NITRO BOOST</div>
        <div class="nitro-bar-container"><div class="nitro-bar-fill" id="nitroFill"></div></div>
      </div>
      <div class="hud-box" style="text-align:right">
        <div style="color:#00f0ff">LAP: <span id="lap">1</span> / 3</div>
        <div style="color:#ff007f;margin-top:4px">TIME: <span id="time">0.00</span>s</div>
      </div>
    </div>
    <div id="overlay">
      <h2 id="overlayTitle">CYBERPUNK TURBO RACER</h2>
      <p id="overlaySub" style="color: #94a3b8; font-size: 15px;">Complete 3 Laps in record time without crashing!</p>
      <button id="startBtn" onclick="startGame()">START RACE</button>
    </div>
  </div>
  <div class="controls-hint">
    <span class="badge">⬆️ W / UP : Accelerate</span>
    <span class="badge">⬇️ S / DOWN : Brake</span>
    <span class="badge">⬅️➡️ A/D : Steer</span>
    <span class="badge">⚡ SPACE : Nitro Boost</span>
  </div>

  <script>
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    let audioCtx = null;

    function initAudio() {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
    }

    function playBeep(freq, type = 'sine', duration = 0.1) {
      if (!audioCtx) return;
      try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
      } catch (e) {}
    }

    const FPS = 60;
    const SEGMENT_LENGTH = 200;
    const RUMBLE_LENGTH = 3;
    const CAMERA_HEIGHT = 1000;
    const CAMERA_DEPTH = 0.8;
    const ROAD_WIDTH = 2000;
    const TOTAL_LAPS = 3;

    let speed = 0;
    let maxSpeed = 160;
    let accel = 0.8;
    let decel = 0.4;
    let playerX = 0;
    let playerZ = 0;
    let nitroAmount = 100;
    let isNitro = false;

    let lap = 1;
    let lapStartTime = 0;
    let totalTime = 0;
    let gameState = 'title'; // title, playing, ended

    const keys = { up: false, down: false, left: false, right: false, nitro: false };

    window.addEventListener('keydown', e => {
      initAudio();
      if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.up = true;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.down = true;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = true;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = true;
      if (e.code === 'Space') keys.nitro = true;
    });

    window.addEventListener('keyup', e => {
      if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.up = false;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.down = false;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = false;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = false;
      if (e.code === 'Space') keys.nitro = false;
    });

    // Track generation
    const segments = [];
    const TRACK_SEGMENTS = 500;

    for (let i = 0; i < TRACK_SEGMENTS; i++) {
      let curve = 0;
      let hill = 0;
      if (i > 50 && i < 150) curve = 2.5;
      if (i > 180 && i < 260) curve = -3;
      if (i > 300 && i < 400) hill = Math.sin(i / 10) * 1500;

      segments.push({
        index: i,
        p1: { world: { y: hill, z: i * SEGMENT_LENGTH }, camera: {}, screen: {} },
        p2: { world: { y: hill, z: (i + 1) * SEGMENT_LENGTH }, camera: {}, screen: {} },
        curve: curve,
        color: Math.floor(i / RUMBLE_LENGTH) % 2 === 0
          ? { grass: '#090a0f', rumble: '#00f0ff', road: '#1e1b4b' }
          : { grass: '#090a0f', rumble: '#ff007f', road: '#0f172a' }
      });
    }

    const trackLength = segments.length * SEGMENT_LENGTH;

    // Traffic cars
    const traffic = [];
    const trafficColors = ['#f59e0b', '#ec4899', '#10b981', '#a855f7'];
    for (let i = 0; i < 15; i++) {
      traffic.push({
        z: Math.random() * trackLength,
        x: (Math.random() - 0.5) * 1.5,
        speed: 60 + Math.random() * 40,
        color: trafficColors[i % trafficColors.length]
      });
    }

    function project(p, cameraX, cameraY, cameraZ, cameraDepth, width, height, roadWidth) {
      p.camera.x = (p.world.x || 0) - cameraX;
      p.camera.y = (p.world.y || 0) - cameraY;
      p.camera.z = (p.world.z || 0) - cameraZ;
      const scale = cameraDepth / p.camera.z;
      p.screen.x = Math.round((width / 2) + (scale * p.camera.x * width / 2));
      p.screen.y = Math.round((height / 2) - (scale * p.camera.y * height / 2));
      p.screen.w = Math.round(scale * roadWidth * width / 2);
    }

    function startGame() {
      initAudio();
      document.getElementById('overlay').style.display = 'none';
      speed = 0;
      playerX = 0;
      playerZ = 0;
      lap = 1;
      totalTime = 0;
      nitroAmount = 100;
      lapStartTime = Date.now();
      gameState = 'playing';
      playBeep(440, 'sine', 0.2);
    }

    function updateGame() {
      if (gameState !== 'playing') return;

      const dt = 1 / FPS;
      totalTime = (Date.now() - lapStartTime) / 1000;
      document.getElementById('time').innerText = totalTime.toFixed(2);
      document.getElementById('lap').innerText = lap;

      isNitro = keys.nitro && nitroAmount > 5;
      let effectiveMaxSpeed = isNitro ? 210 : maxSpeed;

      if (isNitro) {
        nitroAmount = Math.max(0, nitroAmount - dt * 25);
        if (Math.random() < 0.2) playBeep(200 + Math.random() * 400, 'sawtooth', 0.05);
      } else {
        nitroAmount = Math.min(100, nitroAmount + dt * 10);
      }
      document.getElementById('nitroFill').style.width = nitroAmount + '%';

      if (keys.up) speed = Math.min(effectiveMaxSpeed, speed + accel);
      else if (keys.down) speed = Math.max(-30, speed - decel * 2);
      else speed = Math.max(0, speed - decel);

      const dx = (speed / maxSpeed) * 0.04;
      if (keys.left) playerX -= dx;
      if (keys.right) playerX += dx;

      playerX = Math.max(-1.8, Math.min(1.8, playerX));

      playerZ += speed * 2;
      if (playerZ >= trackLength) {
        playerZ -= trackLength;
        lap++;
        playBeep(880, 'sine', 0.3);
        if (lap > TOTAL_LAPS) {
          gameState = 'ended';
          document.getElementById('overlayTitle').innerText = '🏆 RACE COMPLETED!';
          document.getElementById('overlaySub').innerText = 'Final Time: ' + totalTime.toFixed(2) + 's';
          document.getElementById('startBtn').innerText = 'PLAY AGAIN';
          document.getElementById('overlay').style.display = 'flex';
          return;
        }
      }

      const currentSegmentIndex = Math.floor(playerZ / SEGMENT_LENGTH) % segments.length;
      const currentSegment = segments[currentSegmentIndex];
      playerX -= (speed / maxSpeed) * currentSegment.curve * 0.005;

      // Off-road penalty
      if (Math.abs(playerX) > 1) {
        speed = Math.max(20, speed - 2);
      }

      // Traffic collision check
      traffic.forEach(t => {
        t.z = (t.z + t.speed * 1.5) % trackLength;
        if (Math.abs(t.z - playerZ) < SEGMENT_LENGTH && Math.abs(t.x - playerX) < 0.4) {
          speed = 20;
          playBeep(120, 'square', 0.2);
        }
      });

      document.getElementById('speed').innerText = Math.round(speed);
    }

    function renderGame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height / 2);
      skyGrad.addColorStop(0, '#090a0f');
      skyGrad.addColorStop(0.5, '#2e1065');
      skyGrad.addColorStop(1, '#ff007f');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height / 2);

      // Neon Sun
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2 - 20, 50, 0, Math.PI * 2);
      ctx.fill();

      // Horizon line
      ctx.fillStyle = '#090a0f';
      ctx.fillRect(0, canvas.height / 2, canvas.width, canvas.height / 2);

      const baseSegmentIndex = Math.floor(playerZ / SEGMENT_LENGTH);
      let dx = 0;
      let camY = CAMERA_HEIGHT + (segments[baseSegmentIndex % segments.length].p1.world.y || 0);

      for (let n = 0; n < 100; n++) {
        const seg = segments[(baseSegmentIndex + n) % segments.length];
        const loopOffset = (baseSegmentIndex + n >= segments.length) ? trackLength : 0;

        project(seg.p1, playerX * ROAD_WIDTH - dx, camY, playerZ - loopOffset, CAMERA_DEPTH, canvas.width, canvas.height, ROAD_WIDTH);
        project(seg.p2, playerX * ROAD_WIDTH - dx, camY, playerZ - loopOffset, CAMERA_DEPTH, canvas.width, canvas.height, ROAD_WIDTH);

        dx += seg.curve;

        if (seg.p1.camera.z <= CAMERA_DEPTH || seg.p2.screen.y >= seg.p1.screen.y) continue;

        const p1 = seg.p1.screen;
        const p2 = seg.p2.screen;

        // Road
        ctx.fillStyle = seg.color.road;
        ctx.beginPath();
        ctx.moveTo(p1.x - p1.w, p1.y);
        ctx.lineTo(p1.x + p1.w, p1.y);
        ctx.lineTo(p2.x + p2.w, p2.y);
        ctx.lineTo(p2.x - p2.w, p2.y);
        ctx.fill();

        // Rumbles
        const r1 = p1.w * 0.15;
        const r2 = p2.w * 0.15;
        ctx.fillStyle = seg.color.rumble;
        ctx.fillRect(p1.x - p1.w - r1, p1.y - 1, r1, 2);
        ctx.fillRect(p1.x + p1.w, p1.y - 1, r1, 2);
      }

      // Draw Traffic Cars
      traffic.forEach(t => {
        const relZ = (t.z - playerZ + trackLength) % trackLength;
        if (relZ > 0 && relZ < 20000) {
          const scale = CAMERA_DEPTH / relZ;
          const sx = (canvas.width / 2) + (scale * (t.x * ROAD_WIDTH - playerX * ROAD_WIDTH) * canvas.width / 2);
          const sy = (canvas.height / 2) - (scale * CAMERA_HEIGHT * canvas.height / 2);
          const size = scale * 1200 * canvas.width / 2;
          if (sy > canvas.height / 2 && size > 5) {
            ctx.fillStyle = t.color;
            ctx.fillRect(sx - size / 2, sy - size / 2, size, size * 0.6);
          }
        }
      });

      // Draw Player Supercar
      const playerCamX = canvas.width / 2;
      const playerCamY = canvas.height - 70;

      // Exhaust Nitro Flame
      if (isNitro && gameState === 'playing') {
        ctx.fillStyle = '#00f0ff';
        ctx.beginPath();
        ctx.arc(playerCamX - 15, playerCamY + 25, 8 + Math.random() * 4, 0, Math.PI * 2);
        ctx.arc(playerCamX + 15, playerCamY + 25, 8 + Math.random() * 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Car body
      ctx.fillStyle = '#ff007f';
      ctx.beginPath();
      ctx.roundRect(playerCamX - 45, playerCamY - 20, 90, 40, 8);
      ctx.fill();

      // Windshield & lights
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(playerCamX - 35, playerCamY - 15, 70, 12);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(playerCamX - 38, playerCamY + 12, 16, 6);
      ctx.fillRect(playerCamX + 22, playerCamY + 12, 16, 6);
    }

    function gameLoop() {
      updateGame();
      renderGame();
      requestAnimationFrame(gameLoop);
    }

    gameLoop();
  </script>
</body>
</html>`;
  }
}
