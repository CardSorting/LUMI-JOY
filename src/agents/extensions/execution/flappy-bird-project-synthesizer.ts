import * as fs from "node:fs";
import * as path from "node:path";

export const FLAPPY_BIRD_PROJECT_DIRECTORY = "flappy-bird-react-vite";

export interface SynthesizedProjectFile {
  path: string;
  content: string;
}

export interface SynthesizedFlappyBirdProject {
  directoryName: typeof FLAPPY_BIRD_PROJECT_DIRECTORY;
  files: readonly SynthesizedProjectFile[];
}

export interface WrittenFlappyBirdProject extends SynthesizedFlappyBirdProject {
  outputDirectory: string;
  writtenFiles: string[];
}

/** Generates a complete, deterministic React + TypeScript + Vite Flappy Bird project. */
export class FlappyBirdProjectSynthesizer {
  synthesize(): SynthesizedFlappyBirdProject {
    const files: SynthesizedProjectFile[] = [
      { path: "package.json", content: this.packageJson() },
      { path: "index.html", content: this.indexHtml() },
      { path: "tsconfig.json", content: this.rootTsconfig() },
      { path: "tsconfig.app.json", content: this.appTsconfig() },
      { path: "tsconfig.node.json", content: this.nodeTsconfig() },
      { path: "vite.config.ts", content: this.viteConfig() },
      { path: "src/vite-env.d.ts", content: "/// <reference types=\"vite/client\" />\n" },
      { path: "src/main.tsx", content: this.mainTsx() },
      { path: "src/game-engine.ts", content: this.gameEngineTs() },
      { path: "src/App.tsx", content: this.appTsx() },
      { path: "src/styles.css", content: this.stylesCss() },
      { path: "README.md", content: this.readme() },
    ];

    return {
      directoryName: FLAPPY_BIRD_PROJECT_DIRECTORY,
      files: Object.freeze(files.map((file) => Object.freeze({ ...file }))),
    };
  }

  writeProject(parentDirectory: string): WrittenFlappyBirdProject {
    const project = this.synthesize();
    const outputDirectory = path.resolve(parentDirectory, project.directoryName);
    const writtenFiles: string[] = [];

    for (const file of project.files) {
      const target = path.resolve(outputDirectory, file.path);
      const relativeTarget = path.relative(outputDirectory, target);
      if (relativeTarget.startsWith("..") || path.isAbsolute(relativeTarget)) {
        throw new Error(`Refusing to write generated file outside project root: ${file.path}`);
      }
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, file.content, "utf8");
      writtenFiles.push(target);
    }

    return { ...project, outputDirectory, writtenFiles };
  }

  private packageJson(): string {
    return `${JSON.stringify({
      name: "lumi-flappy-bird",
      private: true,
      version: "1.0.0",
      type: "module",
      scripts: {
        dev: "vite",
        build: "tsc -b && vite build",
        typecheck: "tsc -b",
        preview: "vite preview",
      },
      dependencies: {
        react: "19.2.8",
        "react-dom": "19.2.8",
      },
      devDependencies: {
        "@types/react": "19.2.17",
        "@types/react-dom": "19.2.3",
        "@vitejs/plugin-react": "6.0.4",
        typescript: "5.9.3",
        vite: "8.2.0",
      },
    }, null, 2)}\n`;
  }

  private indexHtml(): string {
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#67d5ff" />
    <meta name="description" content="A complete canvas Flappy Bird game built with React, TypeScript, and Vite." />
    <title>Skybound Bird</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
  }

  private rootTsconfig(): string {
    return `{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
`;
  }

  private appTsconfig(): string {
    return `{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "Bundler",
    "allowImportingTsExtensions": false,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
`;
  }

  private nodeTsconfig(): string {
    return `{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
`;
  }

  private viteConfig(): string {
    return `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 4173, strictPort: true },
  preview: { port: 4174, strictPort: true },
});
`;
  }

  private mainTsx(): string {
    return `import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("Root element was not found");

createRoot(root).render(<App />);
`;
  }

  private gameEngineTs(): string {
    return `export type GamePhase = "ready" | "running" | "paused" | "gameover";

export interface BirdState {
  x: number;
  y: number;
  velocityY: number;
  rotation: number;
  radius: number;
}

export interface PipeState {
  id: number;
  x: number;
  gapY: number;
  passed: boolean;
}

export interface GameSnapshot {
  phase: GamePhase;
  bird: BirdState;
  pipes: PipeState[];
  score: number;
  bestScore: number;
  elapsedSeconds: number;
}

export interface FlappyBirdConfig {
  width: number;
  height: number;
  birdX: number;
  birdRadius: number;
  gravity: number;
  flapVelocity: number;
  pipeWidth: number;
  pipeGap: number;
  pipeSpeed: number;
  pipeSpacing: number;
  spawnInterval: number;
  seed: number;
  initialBestScore: number;
}

const DEFAULT_CONFIG: FlappyBirdConfig = {
  width: 480,
  height: 640,
  birdX: 120,
  birdRadius: 17,
  gravity: 1_400,
  flapVelocity: -430,
  pipeWidth: 76,
  pipeGap: 168,
  pipeSpeed: 190,
  pipeSpacing: 250,
  spawnInterval: 1.32,
  seed: 0x5f3759df,
  initialBestScore: 0,
};

export class FlappyBirdEngine {
  readonly config: FlappyBirdConfig;
  private state: GameSnapshot;
  private randomState: number;
  private spawnClock = 0;
  private nextPipeId = 1;

  constructor(overrides: Partial<FlappyBirdConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...overrides };
    this.randomState = this.config.seed >>> 0;
    this.state = this.createInitialState(this.config.initialBestScore);
  }

  snapshot(): GameSnapshot {
    return {
      ...this.state,
      bird: { ...this.state.bird },
      pipes: this.state.pipes.map((pipe) => ({ ...pipe })),
    };
  }

  flap(): GameSnapshot {
    if (this.state.phase === "gameover") this.restart();
    if (this.state.phase === "ready") this.state.phase = "running";
    if (this.state.phase === "running") this.state.bird.velocityY = this.config.flapVelocity;
    return this.snapshot();
  }

  togglePause(): GameSnapshot {
    if (this.state.phase === "running") this.state.phase = "paused";
    else if (this.state.phase === "paused") this.state.phase = "running";
    return this.snapshot();
  }

  restart(): GameSnapshot {
    const bestScore = Math.max(this.state.bestScore, this.state.score);
    this.randomState = this.config.seed >>> 0;
    this.spawnClock = 0;
    this.nextPipeId = 1;
    this.state = this.createInitialState(bestScore);
    return this.snapshot();
  }

  step(deltaSeconds: number): GameSnapshot {
    if (this.state.phase !== "running") return this.snapshot();
    const dt = Math.max(0, Math.min(deltaSeconds, 0.05));
    if (dt === 0) return this.snapshot();

    this.state.elapsedSeconds += dt;
    this.spawnClock += dt;
    this.state.bird.velocityY += this.config.gravity * dt;
    this.state.bird.y += this.state.bird.velocityY * dt;
    this.state.bird.rotation = Math.max(-0.55, Math.min(1.2, this.state.bird.velocityY / 520));

    while (this.spawnClock >= this.config.spawnInterval) {
      this.spawnClock -= this.config.spawnInterval;
      const rightmost = this.state.pipes.reduce(
        (maximum, pipe) => Math.max(maximum, pipe.x),
        this.config.width
      );
      this.state.pipes.push(this.createPipe(Math.max(this.config.width + 80, rightmost + this.config.pipeSpacing)));
    }

    let score = this.state.score;
    this.state.pipes = this.state.pipes
      .map((pipe) => {
        const moved = { ...pipe, x: pipe.x - this.config.pipeSpeed * dt };
        if (!moved.passed && moved.x + this.config.pipeWidth < this.state.bird.x) {
          moved.passed = true;
          score += 1;
        }
        return moved;
      })
      .filter((pipe) => pipe.x + this.config.pipeWidth > -20);
    this.state.score = score;

    if (this.collided()) {
      this.state.phase = "gameover";
      this.state.bestScore = Math.max(this.state.bestScore, this.state.score);
    }

    return this.snapshot();
  }

  private createInitialState(bestScore: number): GameSnapshot {
    const firstX = this.config.width + 160;
    return {
      phase: "ready",
      bird: {
        x: this.config.birdX,
        y: this.config.height * 0.45,
        velocityY: 0,
        rotation: 0,
        radius: this.config.birdRadius,
      },
      pipes: [
        this.createPipe(firstX),
        this.createPipe(firstX + this.config.pipeSpacing),
        this.createPipe(firstX + this.config.pipeSpacing * 2),
      ],
      score: 0,
      bestScore,
      elapsedSeconds: 0,
    };
  }

  private createPipe(x: number): PipeState {
    const safeMargin = this.config.pipeGap / 2 + 48;
    const range = Math.max(0, this.config.height - safeMargin * 2);
    return {
      id: this.nextPipeId++,
      x,
      gapY: safeMargin + this.nextRandom() * range,
      passed: false,
    };
  }

  private nextRandom(): number {
    this.randomState = (Math.imul(1_664_525, this.randomState) + 1_013_904_223) >>> 0;
    return this.randomState / 4_294_967_296;
  }

  private collided(): boolean {
    const bird = this.state.bird;
    if (bird.y - bird.radius <= 0 || bird.y + bird.radius >= this.config.height) return true;

    return this.state.pipes.some((pipe) => {
      const overlapsX = bird.x + bird.radius > pipe.x
        && bird.x - bird.radius < pipe.x + this.config.pipeWidth;
      if (!overlapsX) return false;
      const gapTop = pipe.gapY - this.config.pipeGap / 2;
      const gapBottom = pipe.gapY + this.config.pipeGap / 2;
      return bird.y - bird.radius < gapTop || bird.y + bird.radius > gapBottom;
    });
  }
}
`;
  }

  private appTsx(): string {
    return `import { useEffect, useRef, useState } from "react";
import { FlappyBirdEngine, type GameSnapshot } from "./game-engine";

const WIDTH = 480;
const HEIGHT = 640;

function drawScene(context: CanvasRenderingContext2D, state: GameSnapshot): void {
  const gradient = context.createLinearGradient(0, 0, 0, HEIGHT);
  gradient.addColorStop(0, "#67d5ff");
  gradient.addColorStop(0.72, "#d8f5ff");
  gradient.addColorStop(1, "#fff1ae");
  context.fillStyle = gradient;
  context.fillRect(0, 0, WIDTH, HEIGHT);

  context.fillStyle = "rgba(255, 255, 255, 0.72)";
  for (let index = 0; index < 5; index += 1) {
    const x = (index * 127 - state.elapsedSeconds * 18) % (WIDTH + 120) - 40;
    const y = 74 + (index % 3) * 70;
    context.beginPath();
    context.ellipse(x, y, 46, 18, 0, 0, Math.PI * 2);
    context.ellipse(x + 36, y + 3, 31, 14, 0, 0, Math.PI * 2);
    context.fill();
  }

  for (const pipe of state.pipes) {
    const gapTop = pipe.gapY - 84;
    const gapBottom = pipe.gapY + 84;
    context.fillStyle = "#49a942";
    context.fillRect(pipe.x, 0, 76, gapTop);
    context.fillRect(pipe.x, gapBottom, 76, HEIGHT - gapBottom);
    context.fillStyle = "#75cf58";
    context.fillRect(pipe.x - 7, gapTop - 28, 90, 28);
    context.fillRect(pipe.x - 7, gapBottom, 90, 28);
    context.fillStyle = "rgba(255,255,255,0.24)";
    context.fillRect(pipe.x + 9, 0, 10, Math.max(0, gapTop - 28));
    context.fillRect(pipe.x + 9, gapBottom + 28, 10, Math.max(0, HEIGHT - gapBottom - 28));
  }

  context.save();
  context.translate(state.bird.x, state.bird.y);
  context.rotate(state.bird.rotation);
  context.fillStyle = "#ffd83d";
  context.beginPath();
  context.arc(0, 0, state.bird.radius, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#ff8c32";
  context.beginPath();
  context.moveTo(12, -3);
  context.lineTo(31, 3);
  context.lineTo(12, 8);
  context.closePath();
  context.fill();
  context.fillStyle = "white";
  context.beginPath();
  context.arc(7, -7, 6, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#15212e";
  context.beginPath();
  context.arc(9, -7, 2.5, 0, Math.PI * 2);
  context.fill();
  context.restore();

  if (state.phase !== "running") {
    context.fillStyle = "rgba(9, 24, 39, 0.42)";
    context.fillRect(0, 0, WIDTH, HEIGHT);
    context.fillStyle = "white";
    context.textAlign = "center";
    context.font = "700 34px system-ui";
    const label = state.phase === "ready" ? "Tap to fly" : state.phase === "paused" ? "Paused" : "Game over";
    context.fillText(label, WIDTH / 2, HEIGHT / 2 - 12);
    context.font = "500 17px system-ui";
    context.fillText(state.phase === "gameover" ? "Tap or press Space to try again" : "Space / click / tap", WIDTH / 2, HEIGHT / 2 + 24);
  }
}

export function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<FlappyBirdEngine | null>(null);
  if (!engineRef.current) engineRef.current = new FlappyBirdEngine();
  const engine = engineRef.current;
  const [snapshot, setSnapshot] = useState<GameSnapshot>(() => engine.snapshot());

  useEffect(() => {
    let animationFrame = 0;
    let previousTime = performance.now();
    const frame = (time: number) => {
      const deltaSeconds = (time - previousTime) / 1000;
      previousTime = time;
      setSnapshot(engine.step(deltaSeconds));
      animationFrame = requestAnimationFrame(frame);
    };
    animationFrame = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animationFrame);
  }, [engine]);

  useEffect(() => {
    const context = canvasRef.current?.getContext("2d");
    if (context) drawScene(context, snapshot);
  }, [snapshot]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space" || event.code === "ArrowUp") {
        event.preventDefault();
        setSnapshot(engine.flap());
      } else if (event.code === "KeyP") {
        setSnapshot(engine.togglePause());
      } else if (event.code === "KeyR") {
        setSnapshot(engine.restart());
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [engine]);

  const flap = () => setSnapshot(engine.flap());
  const pause = () => setSnapshot(engine.togglePause());
  const restart = () => setSnapshot(engine.restart());

  return (
    <main className="app-shell">
      <section className="game-card" aria-label="Skybound Bird game">
        <header className="scoreboard" aria-live="polite">
          <div><span>Score</span><strong>{snapshot.score}</strong></div>
          <h1>Skybound Bird</h1>
          <div><span>Best</span><strong>{snapshot.bestScore}</strong></div>
        </header>
        <button className="canvas-button" type="button" onPointerDown={flap} aria-label="Flap bird">
          <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} />
        </button>
        <footer className="controls">
          <button type="button" onClick={flap}>Flap</button>
          <button type="button" onClick={pause} disabled={snapshot.phase === "ready" || snapshot.phase === "gameover"}>
            {snapshot.phase === "paused" ? "Resume" : "Pause"}
          </button>
          <button type="button" onClick={restart}>Restart</button>
        </footer>
        <p className="instructions">Space or ↑ to flap · P to pause · R to restart</p>
      </section>
    </main>
  );
}
`;
  }

  private stylesCss(): string {
    return `:root {
  color: #f8fbff;
  background: #091827;
  font-family: Inter, ui-rounded, "SF Pro Rounded", system-ui, sans-serif;
  font-synthesis: none;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  background:
    radial-gradient(circle at 20% 10%, rgba(64, 199, 255, 0.22), transparent 34rem),
    linear-gradient(145deg, #07131f, #10283e);
}

button { font: inherit; }

.app-shell {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
}

.game-card {
  width: min(100%, 520px);
  padding: 18px;
  border: 1px solid rgba(255,255,255,0.13);
  border-radius: 26px;
  background: rgba(9, 24, 39, 0.88);
  box-shadow: 0 28px 80px rgba(0,0,0,0.46);
  backdrop-filter: blur(18px);
}

.scoreboard {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 16px;
  margin-bottom: 14px;
}

.scoreboard h1 { margin: 0; font-size: clamp(1.3rem, 5vw, 1.8rem); }
.scoreboard div { display: grid; text-align: center; }
.scoreboard div:last-child { justify-self: end; }
.scoreboard span { color: #9dc0d8; font-size: 0.72rem; letter-spacing: 0.12em; text-transform: uppercase; }
.scoreboard strong { font-size: 1.45rem; }

.canvas-button {
  display: block;
  width: 100%;
  padding: 0;
  overflow: hidden;
  border: 0;
  border-radius: 18px;
  background: transparent;
  cursor: pointer;
  touch-action: manipulation;
}

canvas { display: block; width: 100%; height: auto; aspect-ratio: 3 / 4; }

.controls { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 14px; }
.controls button {
  min-height: 44px;
  border: 1px solid rgba(255,255,255,0.16);
  border-radius: 12px;
  color: white;
  background: #183a56;
  cursor: pointer;
}
.controls button:hover:not(:disabled) { background: #215174; }
.controls button:focus-visible, .canvas-button:focus-visible { outline: 3px solid #ffd83d; outline-offset: 3px; }
.controls button:disabled { cursor: not-allowed; opacity: 0.45; }
.instructions { margin: 13px 0 0; color: #9dc0d8; font-size: 0.84rem; text-align: center; }

@media (max-width: 560px) {
  .app-shell { padding: 0; }
  .game-card { min-height: 100vh; border: 0; border-radius: 0; display: grid; align-content: center; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; transition-duration: 0.01ms !important; }
}
`;
  }

  private readme(): string {
    return `# Skybound Bird

A complete, deterministic Flappy Bird-style game generated by LUMI with React, TypeScript, Vite, and the Canvas 2D API.

## Run

\`\`\`bash
npm install
npm run dev
\`\`\`

Use Space, Arrow Up, click, or tap to flap. Press P to pause and R to restart. The game includes deterministic seeded pipes, collision detection, scoring, best-score retention, pause/resume, responsive controls, keyboard support, and accessible status text.
`;
  }
}
