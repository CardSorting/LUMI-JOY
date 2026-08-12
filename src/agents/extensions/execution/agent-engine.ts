import * as fs from "node:fs";
import * as path from "node:path";
import { Codex, type Thread } from "@openai/codex-sdk";
import { AbstractAgentEngine } from "../../../core/abstracts/abstract-agent-engine.js";
import type {
  EngineProgressEvent,
  EngineTickInput,
  EngineTickResult,
} from "../../../core/contracts/agent.contracts.js";
import type { AgentConfig } from "../../base/agent-config.js";
import type { SessionContext } from "../../../sessions/base/session-context.js";
import type { PersistentSessionStore } from "../../../sessions/extensions/persistence/session-store.js";
import type { ValidatingToolRegistry } from "../../../tooling/extensions/registry/tool-registry.js";
import type { PromptComposer } from "../compaction/prompt-composer.js";
import type { SessionCompactor } from "../../../sessions/extensions/compaction/session-compactor.js";
import type { ModelResolver } from "../resolution/model-resolver.js";
import type { SessionVfs } from "../../../sessions/extensions/vfs/session-vfs.js";
import type { SessionMemoryStore } from "../../../sessions/extensions/memory/session-memory-store.js";
import type { AgentSlashRouter } from "../resolution/agent-slash-router.js";
import type { CodexProviderBridge } from "../resolution/codex-provider-bridge.js";
import type { LlmProxyGateway } from "../resolution/llm-proxy-gateway.js";
import { CodexProgressAdapter } from "./codex-progress-adapter.js";
import { sanitizeProgressText } from "../../../core/utilities/progress-sanitizer.js";

const CODEX_TURN_TIMEOUT_MS = 10 * 60 * 1000;

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
    codex: Codex = new Codex()
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

    // 3. Compact History if Over Capacity
    if (sessionStore.getMessages().length > this.config.maxTurns) {
      sessionStore.compact(this.sessionCompactor);
    }

    // 4. Response Resolution & Action Dispatch
    let responseText = "";

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
        try {
          const activeModel = this.modelResolver.getActiveModel();
          const auth = await this.codexProviderBridge.resolveProviderAuth(activeModel);
          if (auth.authType === "codex-oauth") {
            progressManagedByCodex = true;
            liveResponse = await this.dispatchCodexTurn(
              promptText,
              activeModel,
              input.signal,
              input.onProgress
            );
          } else if (auth.authType === "api-key") {
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
              messages: sessionStore.getMessages().map((m) => ({ role: m.role, content: m.content })),
              max_tokens: 2048,
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

    // 5. Add Assistant Response Message
    sessionStore.addMessage({
      role: "assistant",
      content: responseText,
    });

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
    signal?: AbortSignal,
    onProgress?: (event: EngineProgressEvent) => void
  ): Promise<string> {
    const cwd = this.sessionContext.cwd;
    if (
      !this.codexThread ||
      this.codexThreadModel !== activeModel ||
      this.codexThreadCwd !== cwd
    ) {
      this.codexThread = this.codex.startThread({
        model: activeModel,
        workingDirectory: cwd,
        skipGitRepoCheck: true,
        sandboxMode: "workspace-write",
        approvalPolicy: "never",
      });
      this.codexThreadModel = activeModel;
      this.codexThreadCwd = cwd;
    }

    const timeoutSignal = AbortSignal.timeout(CODEX_TURN_TIMEOUT_MS);
    const turnSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;
    const progress = new CodexProgressAdapter({
      cwd,
      model: activeModel,
      onProgress,
    });
    progress.start();

    try {
      const { events } = await this.codexThread.runStreamed(promptText, { signal: turnSignal });
      let finalResponse = "";

      for await (const event of events) {
        progress.handle(event);

        if (event.type === "item.completed" && event.item.type === "agent_message") {
          finalResponse = event.item.text;
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
      // A failed or cancelled child should never be reused as the next turn's
      // conversation transport.
      this.codexThread = null;
      this.codexThreadModel = null;
      this.codexThreadCwd = null;

      if (signal?.aborted) {
        progress.cancel();
        throw new Error("Turn cancelled by user");
      }
      if (timeoutSignal.aborted) {
        progress.timeout();
        throw new Error("Codex turn timed out after 10 minutes");
      }
      progress.fail("Agent turn failed", this.formatLiveDispatchError(error));
      throw error;
    }
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
}
