import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import ts from "typescript";
import {
  FlappyBirdProjectSynthesizer,
  type WrittenFlappyBirdProject,
} from "../../../agents/extensions/execution/flappy-bird-project-synthesizer.js";
import type { BenchmarkCaseExecution } from "./benchmark-evaluator.js";

export interface FlappyBirdBenchmarkCheck {
  name: string;
  passed: boolean;
  detail: string;
}

interface RuntimeGameSnapshot {
  phase: "ready" | "running" | "paused" | "gameover";
  bird: { y: number };
  pipes: Array<{ x: number; gapY: number }>;
  score: number;
  bestScore: number;
}

interface RuntimeFlappyBirdEngine {
  snapshot(): RuntimeGameSnapshot;
  flap(): RuntimeGameSnapshot;
  togglePause(): RuntimeGameSnapshot;
  restart(): RuntimeGameSnapshot;
  step(deltaSeconds: number): RuntimeGameSnapshot;
}

type RuntimeFlappyBirdEngineConstructor = new (
  overrides?: Record<string, number>
) => RuntimeFlappyBirdEngine;

/** Deep, temp-isolated benchmark for a complete generated React/Vite game project. */
export class FlappyBirdProjectBenchmark {
  private readonly synthesizer: FlappyBirdProjectSynthesizer;

  constructor(synthesizer = new FlappyBirdProjectSynthesizer()) {
    this.synthesizer = synthesizer;
  }

  execute(): BenchmarkCaseExecution {
    const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "lumi-flappy-benchmark-"));
    const checks: FlappyBirdBenchmarkCheck[] = [];

    try {
      const project = this.synthesizer.writeProject(temporaryRoot);
      const fileMap = new Map(project.files.map((file) => [file.path, file.content]));

      checks.push(this.check("complete project manifest", () => this.verifyProjectManifest(project)));
      checks.push(this.check("pinned React, TypeScript, and Vite contract", () => this.verifyPackageContract(fileMap)));
      checks.push(this.check("strict Vite and TypeScript configuration", () => this.verifyConfiguration(fileMap)));
      checks.push(this.check("semantic TypeScript/TSX compilation", () => this.verifyCompilation(project, temporaryRoot)));
      checks.push(this.check("gameplay state-machine simulation", () => this.verifyGameplay(fileMap)));
      checks.push(this.check("deterministic seeded simulation", () => this.verifyDeterminism(fileMap)));
      checks.push(this.check("React animation, controls, and accessibility", () => this.verifyReactApplication(fileMap)));
      checks.push(this.check("temp-root isolation and materialization", () => this.verifyMaterialization(project, temporaryRoot)));

      const failed = checks.filter((check) => !check.passed);
      const response = [
        `Generated ${project.files.length}-file Flappy Bird React + TypeScript + Vite project`,
        ...checks.map((check) => `${check.passed ? "PASS" : "FAIL"}: ${check.name} — ${check.detail}`),
      ].join("\n");

      return {
        outcome: failed.length === 0 ? "completed" : "failed",
        response,
        assertionPassed: failed.length === 0,
        assertions: checks.map((check) => ({ ...check })),
      };
    } catch (error) {
      return {
        outcome: "failed",
        response: error instanceof Error ? error.message : String(error),
        assertionPassed: false,
      };
    } finally {
      fs.rmSync(temporaryRoot, { recursive: true, force: true });
    }
  }

  private check(name: string, verification: () => string): FlappyBirdBenchmarkCheck {
    try {
      return { name, passed: true, detail: verification() };
    } catch (error) {
      return {
        name,
        passed: false,
        detail: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private verifyProjectManifest(project: WrittenFlappyBirdProject): string {
    const expectedPaths = [
      "README.md",
      "index.html",
      "package.json",
      "src/App.tsx",
      "src/game-engine.ts",
      "src/main.tsx",
      "src/styles.css",
      "src/vite-env.d.ts",
      "tsconfig.app.json",
      "tsconfig.json",
      "tsconfig.node.json",
      "vite.config.ts",
    ];
    const actualPaths = project.files.map((file) => file.path).sort();
    this.assert(new Set(actualPaths).size === actualPaths.length, "manifest contains duplicate paths");
    this.assert(JSON.stringify(actualPaths) === JSON.stringify(expectedPaths), "manifest does not match the complete 12-file contract");
    this.assert(project.files.every((file) => file.content.trim().length > 0), "manifest contains an empty file");
    return `${actualPaths.length}/${expectedPaths.length} required files are unique and non-empty`;
  }

  private verifyPackageContract(fileMap: Map<string, string>): string {
    const parsed = JSON.parse(this.requiredFile(fileMap, "package.json")) as {
      private?: boolean;
      scripts?: Record<string, string>;
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    this.assert(parsed.private === true, "generated application must be private");
    this.assert(parsed.scripts?.["dev"] === "vite", "Vite development script is missing");
    this.assert(parsed.scripts?.["build"] === "tsc -b && vite build", "production typecheck/build script is incomplete");
    this.assert(parsed.scripts?.["typecheck"] === "tsc -b", "standalone typecheck script is missing");
    this.assert(parsed.dependencies?.["react"] === "19.2.8", "React is not pinned to the validated version");
    this.assert(parsed.dependencies?.["react-dom"] === "19.2.8", "React DOM is not version-aligned with React");
    this.assert(parsed.devDependencies?.["vite"] === "8.2.0", "Vite is not pinned to the validated version");
    this.assert(parsed.devDependencies?.["@vitejs/plugin-react"] === "6.0.4", "Vite React plugin is missing or stale");
    this.assert(parsed.devDependencies?.["typescript"] === "5.9.3", "TypeScript compiler contract is missing");
    return "install, dev, typecheck, production build, and preview dependencies are pinned";
  }

  private verifyConfiguration(fileMap: Map<string, string>): string {
    const root = JSON.parse(this.requiredFile(fileMap, "tsconfig.json")) as { references?: unknown[] };
    const app = JSON.parse(this.requiredFile(fileMap, "tsconfig.app.json")) as {
      compilerOptions?: Record<string, unknown>;
    };
    const node = JSON.parse(this.requiredFile(fileMap, "tsconfig.node.json")) as {
      compilerOptions?: Record<string, unknown>;
    };
    const vite = this.requiredFile(fileMap, "vite.config.ts");
    this.assert(root.references?.length === 2, "solution-style TypeScript project references are missing");
    this.assert(app.compilerOptions?.["strict"] === true, "application TypeScript strict mode is disabled");
    this.assert(app.compilerOptions?.["jsx"] === "react-jsx", "modern React JSX transform is not configured");
    this.assert(app.compilerOptions?.["moduleResolution"] === "Bundler", "application does not use bundler module resolution");
    this.assert(node.compilerOptions?.["moduleResolution"] === "Bundler", "Vite config does not use bundler module resolution");
    this.assert(vite.includes("react()") && vite.includes("strictPort: true"), "Vite React plugin or deterministic port policy is missing");
    return "strict project references, bundler resolution, React JSX, and deterministic Vite ports verified";
  }

  private verifyCompilation(project: WrittenFlappyBirdProject, temporaryRoot: string): string {
    const shimPath = path.join(temporaryRoot, "benchmark-react-shim.d.ts");
    fs.writeFileSync(shimPath, this.reactTypeShim(), "utf8");
    const sourceFiles = [
      "src/game-engine.ts",
      "src/App.tsx",
      "src/main.tsx",
      "vite.config.ts",
    ].map((file) => path.join(project.outputDirectory, file));

    const program = ts.createProgram({
      rootNames: [...sourceFiles, shimPath],
      options: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        jsx: ts.JsxEmit.ReactJSX,
        strict: true,
        noEmit: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        skipLibCheck: true,
        lib: ["lib.es2022.d.ts", "lib.dom.d.ts", "lib.dom.iterable.d.ts"],
        types: [],
      },
    });
    const diagnostics = ts.getPreEmitDiagnostics(program);
    this.assert(
      diagnostics.length === 0,
      diagnostics.slice(0, 4).map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, " ")).join(" | ")
    );
    return `${sourceFiles.length} application/configuration modules compiled with zero strict diagnostics`;
  }

  private verifyGameplay(fileMap: Map<string, string>): string {
    const Engine = this.loadGeneratedEngine(this.requiredFile(fileMap, "src/game-engine.ts"));
    const scoringEngine = new Engine({
      gravity: 0,
      flapVelocity: 0,
      pipeGap: 500,
      pipeSpeed: 400,
      spawnInterval: 100,
    });
    this.assert(scoringEngine.snapshot().phase === "ready", "engine does not begin in ready state");
    this.assert(scoringEngine.flap().phase === "running", "flap does not start the game");
    let scored = scoringEngine.snapshot();
    for (let frame = 0; frame < 100; frame += 1) scored = scoringEngine.step(0.05);
    this.assert(scored.phase === "running" && scored.score >= 1, "pipe traversal did not increment score");

    const paused = scoringEngine.togglePause();
    const pausedX = paused.pipes[0]?.x;
    const afterPausedStep = scoringEngine.step(0.05);
    this.assert(afterPausedStep.phase === "paused" && afterPausedStep.pipes[0]?.x === pausedX, "paused simulation continued moving");
    this.assert(scoringEngine.togglePause().phase === "running", "paused simulation did not resume");

    const collisionEngine = new Engine();
    collisionEngine.flap();
    let collision = collisionEngine.snapshot();
    for (let frame = 0; frame < 300 && collision.phase !== "gameover"; frame += 1) {
      collision = collisionEngine.step(0.05);
    }
    this.assert(collision.phase === "gameover", "gravity/boundary collision did not terminate the run");
    const restarted = collisionEngine.restart();
    this.assert(restarted.phase === "ready" && restarted.score === 0 && restarted.pipes.length === 3, "restart did not reset gameplay state");
    this.assert(collisionEngine.flap().phase === "running", "game could not start after restart");
    return "ready, flap, scoring, pause/resume, collision, game-over, and restart transitions passed";
  }

  private verifyDeterminism(fileMap: Map<string, string>): string {
    const Engine = this.loadGeneratedEngine(this.requiredFile(fileMap, "src/game-engine.ts"));
    const first = new Engine({ seed: 12345 });
    const second = new Engine({ seed: 12345 });
    first.flap();
    second.flap();
    for (let frame = 0; frame < 20; frame += 1) {
      first.step(1 / 60);
      second.step(1 / 60);
    }
    this.assert(JSON.stringify(first.snapshot()) === JSON.stringify(second.snapshot()), "identical seeds and inputs diverged");
    return "two seeded 20-frame simulations remained byte-for-byte identical";
  }

  private verifyReactApplication(fileMap: Map<string, string>): string {
    const app = this.requiredFile(fileMap, "src/App.tsx");
    const styles = this.requiredFile(fileMap, "src/styles.css");
    const requiredSignals = [
      "requestAnimationFrame",
      "cancelAnimationFrame",
      "addEventListener(\"keydown\"",
      "removeEventListener(\"keydown\"",
      "onPointerDown={flap}",
      "aria-live=\"polite\"",
      "aria-label=\"Flap bird\"",
      "engine.togglePause()",
      "engine.restart()",
      "getContext(\"2d\")",
    ];
    for (const signal of requiredSignals) this.assert(app.includes(signal), `React application is missing '${signal}'`);
    this.assert(styles.includes("@media (max-width: 560px)"), "responsive mobile layout is missing");
    this.assert(styles.includes("prefers-reduced-motion"), "reduced-motion accessibility policy is missing");
    this.assert(styles.includes(":focus-visible"), "keyboard focus treatment is missing");
    return "animation cleanup, keyboard/pointer input, pause/restart, canvas rendering, and accessibility verified";
  }

  private verifyMaterialization(project: WrittenFlappyBirdProject, temporaryRoot: string): string {
    const relativeOutput = path.relative(temporaryRoot, project.outputDirectory);
    this.assert(!relativeOutput.startsWith("..") && !path.isAbsolute(relativeOutput), "project escaped the benchmark temp root");
    this.assert(project.writtenFiles.length === project.files.length, "not every manifest file was materialized");
    this.assert(project.writtenFiles.every((file) => fs.existsSync(file)), "one or more generated files are absent on disk");
    const totalBytes = project.writtenFiles.reduce((sum, file) => sum + fs.statSync(file).size, 0);
    this.assert(totalBytes >= 16_000, `generated project is unexpectedly shallow (${totalBytes} bytes)`);
    return `${project.writtenFiles.length} files and ${totalBytes} bytes remained inside an isolated temporary root`;
  }

  private loadGeneratedEngine(source: string): RuntimeFlappyBirdEngineConstructor {
    const transpiled = ts.transpileModule(source, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
        strict: true,
      },
      reportDiagnostics: true,
      fileName: "game-engine.ts",
    });
    const diagnostics = transpiled.diagnostics ?? [];
    this.assert(diagnostics.length === 0, "generated gameplay engine has TypeScript syntax diagnostics");
    const moduleRecord: { exports: Record<string, unknown> } = { exports: {} };
    const executeModule = new Function("exports", "module", transpiled.outputText) as (
      exports: Record<string, unknown>,
      module: { exports: Record<string, unknown> }
    ) => void;
    executeModule(moduleRecord.exports, moduleRecord);
    const Engine = moduleRecord.exports["FlappyBirdEngine"];
    this.assert(typeof Engine === "function", "compiled gameplay module does not export FlappyBirdEngine");
    return Engine as RuntimeFlappyBirdEngineConstructor;
  }

  private reactTypeShim(): string {
    return `declare namespace JSX {
  interface IntrinsicElements { [elementName: string]: unknown; }
}
declare module "react" {
  interface MutableRefObject<T> { current: T; }
  type SetStateAction<T> = T | ((previous: T) => T);
  type Dispatch<T> = (value: T) => void;
  export function useRef<T>(initialValue: T): MutableRefObject<T>;
  export function useState<T>(initialValue: T | (() => T)): [T, Dispatch<SetStateAction<T>>];
  export function useEffect(effect: () => void | (() => void), dependencies?: readonly unknown[]): void;
}
declare module "react/jsx-runtime" {
  namespace JSX { interface IntrinsicElements { [elementName: string]: unknown; } }
  export function jsx(type: unknown, props: unknown, key?: unknown): unknown;
  export function jsxs(type: unknown, props: unknown, key?: unknown): unknown;
  export const Fragment: unknown;
}
declare module "react-dom/client" {
  export function createRoot(container: Element | DocumentFragment): { render(node: unknown): void };
}
declare module "vite" { export function defineConfig<T>(config: T): T; }
declare module "@vitejs/plugin-react" { export default function react(): unknown; }
declare module "*.css" { const content: string; export default content; }
`;
  }

  private requiredFile(fileMap: Map<string, string>, filePath: string): string {
    const content = fileMap.get(filePath);
    this.assert(content !== undefined, `required generated file is missing: ${filePath}`);
    return content;
  }

  private assert(condition: boolean, message: string): asserts condition {
    if (!condition) throw new Error(message);
  }
}
