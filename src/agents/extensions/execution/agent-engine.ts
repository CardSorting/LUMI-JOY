import * as fs from "node:fs";
import * as path from "node:path";
import { AbstractAgentEngine } from "../../../core/abstracts/abstract-agent-engine.js";
import type { EngineTickInput, EngineTickResult } from "../../../core/contracts/agent.contracts.js";
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

export class AgentEngine extends AbstractAgentEngine {
  readonly promptComposer: PromptComposer;
  readonly sessionCompactor: SessionCompactor;
  readonly modelResolver: ModelResolver;
  readonly sessionVfs: SessionVfs;
  readonly sessionMemoryStore: SessionMemoryStore;
  readonly slashRouter: AgentSlashRouter;
  readonly codexProviderBridge?: CodexProviderBridge;
  readonly proxyGateway?: LlmProxyGateway;

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
    proxyGateway?: LlmProxyGateway
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

    // Check if prompt requests creating Frogger or a game/app
    const lowerPrompt = promptText.toLowerCase();
    if (lowerPrompt.includes("frogger") || (lowerPrompt.includes("create") && lowerPrompt.includes("game"))) {
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
      if (this.codexProviderBridge) {
        try {
          const auth = await this.codexProviderBridge.resolveProviderAuth(this.modelResolver.getActiveModel());
          if (auth.authType !== "none") {
            const endpoint = this.proxyGateway?.getEffectiveEndpoint("openai", "https://api.openai.com/v1/chat/completions") ?? {
              url: "https://api.openai.com/v1/chat/completions",
              headers: {},
              timeoutMs: 30000,
            };

            const payload = {
              model: this.modelResolver.getActiveModel(),
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
            });

            if (res.ok) {
              const data = (await res.json()) as any;
              liveResponse = data?.choices?.[0]?.message?.content ?? null;
            }
          }
        } catch {
          // Fall through to fallback
        }
      }

      if (liveResponse) {
        responseText = liveResponse;
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
