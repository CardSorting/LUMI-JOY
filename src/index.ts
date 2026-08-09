import { MonolithFactory, type MonolithFactoryOptions } from "./factories/monolith-factory.js";
import type { EngineTickInput, EngineTickResult, IAgentEngine } from "./core/contracts/agent.contracts.js";
import type { GameStateSnapshot } from "./core/contracts/session.contracts.js";
import { AbstractAgentEngine } from "./core/abstracts/abstract-agent-engine.js";
import { AbstractSessionStore } from "./core/abstracts/abstract-session-store.js";
import { AbstractHands } from "./core/abstracts/abstract-hands.js";
import { AbstractEars } from "./core/abstracts/abstract-ears.js";
import { AbstractToolRegistry } from "./core/abstracts/abstract-tool-registry.js";
import { AgentConfig } from "./agents/base/agent-config.js";
import { AgentEngine } from "./agents/extensions/execution/agent-engine.js";
import { PromptComposer } from "./agents/extensions/compaction/prompt-composer.js";
import { ModelResolver } from "./agents/extensions/resolution/model-resolver.js";
import { AgentSlashRouter } from "./agents/extensions/resolution/agent-slash-router.js";
import { MentionResolver } from "./agents/extensions/mentions/mention-resolver.js";
import { AgentSwarmDispatcher, type SwarmSubagentTaskResult } from "./agents/extensions/swarm/agent-swarm-dispatcher.js";
import { SessionContext } from "./sessions/base/session-context.js";
import { PersistentSessionStore, SessionStore } from "./sessions/extensions/persistence/session-store.js";
import { SessionCompactor } from "./sessions/extensions/compaction/session-compactor.js";
import { SessionVfs } from "./sessions/extensions/vfs/session-vfs.js";
import { SessionMemoryStore } from "./sessions/extensions/memory/session-memory-store.js";
import { Eyes } from "./tooling/base/eyes.js";
import { AstPerceptionEyes, type SymbolSearchResult } from "./tooling/extensions/perception/ast-eyes.js";
import { AnchoredHands, Hands } from "./tooling/extensions/hashline/hands.js";
import { ProtocolEars, Ears } from "./tooling/extensions/telemetry/ears.js";
import { ProgressStreamingEars, TerminalProgressRenderer } from "./tooling/extensions/progress/progress-ears.js";
import { SkillsIngestor } from "./tooling/extensions/registry/skills-ingestor.js";
import { ValidatingToolRegistry, ToolRegistry } from "./tooling/extensions/registry/tool-registry.js";
import { ModuleDecomposer } from "./tooling/extensions/policy/module-decomposer.js";

import { ArenaAllocator } from "./sessions/extensions/substrate/arena-allocator.js";

export type { EngineTickInput, EngineTickResult, IAgentEngine } from "./core/contracts/agent.contracts.js";
export type { GameStateSnapshot, SessionMessage, ISessionStore, SlabBufferSnapshot } from "./core/contracts/session.contracts.js";
export type { CommandResult, AnchoredEditResult, ToolingEvent, JsonRpcNotification, TerminalProgressFrame, IHands, IEars, IToolRegistry } from "./core/contracts/tooling.contracts.js";

export { AbstractAgentEngine } from "./core/abstracts/abstract-agent-engine.js";
export { AbstractSessionStore } from "./core/abstracts/abstract-session-store.js";
export { AbstractHands } from "./core/abstracts/abstract-hands.js";
export { AbstractEars } from "./core/abstracts/abstract-ears.js";
export { AbstractToolRegistry } from "./core/abstracts/abstract-tool-registry.js";

export { AgentConfig } from "./agents/base/agent-config.js";
export { AgentEngine } from "./agents/extensions/execution/agent-engine.js";
export { PromptComposer } from "./agents/extensions/compaction/prompt-composer.js";
export { ModelResolver } from "./agents/extensions/resolution/model-resolver.js";
export { AgentSlashRouter } from "./agents/extensions/resolution/agent-slash-router.js";
export { MentionResolver } from "./agents/extensions/mentions/mention-resolver.js";
export { AgentSwarmDispatcher } from "./agents/extensions/swarm/agent-swarm-dispatcher.js";
export type { SwarmSubagentTaskResult } from "./agents/extensions/swarm/agent-swarm-dispatcher.js";
export { SessionContext } from "./sessions/base/session-context.js";
export { PersistentSessionStore, SessionStore } from "./sessions/extensions/persistence/session-store.js";
export { ArenaAllocator } from "./sessions/extensions/substrate/arena-allocator.js";
export { SessionCompactor } from "./sessions/extensions/compaction/session-compactor.js";
export { SessionVfs } from "./sessions/extensions/vfs/session-vfs.js";
export { SessionMemoryStore } from "./sessions/extensions/memory/session-memory-store.js";
export type { SymbolSearchResult } from "./tooling/extensions/perception/ast-eyes.js";
export { Eyes } from "./tooling/base/eyes.js";
export { AstPerceptionEyes } from "./tooling/extensions/perception/ast-eyes.js";
export { AnchoredHands, Hands } from "./tooling/extensions/hashline/hands.js";
export { ProtocolEars, Ears } from "./tooling/extensions/telemetry/ears.js";
export { ProgressStreamingEars, TerminalProgressRenderer } from "./tooling/extensions/progress/progress-ears.js";
export { SkillsIngestor } from "./tooling/extensions/registry/skills-ingestor.js";
export { ValidatingToolRegistry, ToolRegistry } from "./tooling/extensions/registry/tool-registry.js";
export { ModuleDecomposer } from "./tooling/extensions/policy/module-decomposer.js";
export { MonolithFactory } from "./factories/monolith-factory.js";

/**
 * Deterministic Game Engine Monolith Composition Root.
 * Models agent interactions as frame ticks (`tick()`), state transitions as immutable snapshots (`GameStateSnapshot`),
 * and provides frame-perfect state rewind and replay.
 */
export class LumiMonolith implements IAgentEngine {
  readonly config: AgentConfig;
  readonly sessionContext: SessionContext;
  readonly sessionStore: PersistentSessionStore;
  readonly sessionCompactor: SessionCompactor;
  readonly sessionVfs: SessionVfs;
  readonly sessionMemoryStore: SessionMemoryStore;
  readonly modelResolver: ModelResolver;
  readonly slashRouter: AgentSlashRouter;
  readonly mentionResolver: MentionResolver;
  readonly swarmDispatcher: AgentSwarmDispatcher;
  readonly eyes: AstPerceptionEyes;
  readonly hands: AnchoredHands;
  readonly ears: ProgressStreamingEars;
  readonly skillsIngestor: SkillsIngestor;
  readonly toolRegistry: ValidatingToolRegistry;
  readonly promptComposer: PromptComposer;
  readonly agentEngine: AgentEngine;

  constructor(options: MonolithFactoryOptions = {}) {
    const components = MonolithFactory.createEngine(options);
    this.config = components.config;
    this.sessionContext = components.sessionContext;
    this.sessionStore = components.sessionStore;
    this.sessionCompactor = components.sessionCompactor;
    this.sessionVfs = components.sessionVfs;
    this.sessionMemoryStore = components.sessionMemoryStore;
    this.modelResolver = components.modelResolver;
    this.slashRouter = components.slashRouter;
    this.mentionResolver = components.mentionResolver;
    this.swarmDispatcher = components.swarmDispatcher;
    this.eyes = components.eyes;
    this.hands = components.hands;
    this.ears = components.ears;
    this.skillsIngestor = components.skillsIngestor;
    this.toolRegistry = components.toolRegistry;
    this.promptComposer = components.promptComposer;
    this.agentEngine = components.agentEngine;
  }

  /** Primary Game Engine Frame Step (Tick Loop) */
  async tick(input: EngineTickInput): Promise<EngineTickResult> {
    return this.agentEngine.tick(input);
  }

  /** Backward-compatible turn runner */
  async runTurn(prompt: string): Promise<EngineTickResult> {
    return this.tick({ prompt });
  }

  /** Creates an immutable frame-perfect snapshot of active game engine state */
  createSnapshot(): GameStateSnapshot {
    return this.sessionStore.createSnapshot(
      this.sessionContext.turnCount,
      this.sessionVfs,
      this.sessionMemoryStore,
      this.modelResolver
    );
  }

  /** Frame-perfect state rewind to a target snapshot */
  rewindToSnapshot(snapshot: GameStateSnapshot): void {
    this.sessionStore.rewindToSnapshot(snapshot);
    this.sessionContext.turnCount = snapshot.frameIndex;
  }

  /** Forks game engine state into a new isolated engine instance */
  forkSession(newSessionId?: string): LumiMonolith {
    const snapshot = this.createSnapshot();
    const forkedMonolith = new LumiMonolith({
      cwd: this.sessionContext.cwd,
      sessionId: newSessionId ?? `${this.sessionContext.sessionId}-fork-${Date.now()}`,
      config: this.config,
    });
    forkedMonolith.rewindToSnapshot(snapshot);
    return forkedMonolith;
  }
}

// Smoke test entrypoint when run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("Initializing Deterministic Game Engine Monolith...");
  const lumi = new LumiMonolith();

  // Verify Abstract Base Class Subsystem Extensions via instanceof
  console.log("\n--- Subsystem Abstract Base Class Verification ---");
  console.log("lumi.agentEngine instanceof AbstractAgentEngine:", lumi.agentEngine instanceof AbstractAgentEngine);
  console.log("lumi.sessionStore instanceof AbstractSessionStore:", lumi.sessionStore instanceof AbstractSessionStore);
  console.log("lumi.hands instanceof AbstractHands:", lumi.hands instanceof AbstractHands);
  console.log("lumi.ears instanceof AbstractEars:", lumi.ears instanceof AbstractEars);
  console.log("lumi.toolRegistry instanceof AbstractToolRegistry:", lumi.toolRegistry instanceof AbstractToolRegistry);

  (async () => {
    // 1. Frame Tick 1
    const frame1 = await lumi.tick({ prompt: "remember: engine = deterministic" });
    console.log(`\nFrame #${frame1.frameIndex} Result:`, frame1.response, `(${frame1.durationMs}ms)`);

    // 2. Create Frame-Perfect Snapshot
    const snapshot = lumi.createSnapshot();
    console.log(`Created Snapshot ID: '${snapshot.snapshotId}' at Frame #${snapshot.frameIndex}`);
    console.log("Zero-GC Slab Memory Snapshot:", snapshot.slabSnapshot);

    // 3. Frame Tick 2
    const frame2 = await lumi.tick({ prompt: "view: package.json" });
    console.log(`Frame #${frame2.frameIndex} Result:`, frame2.response);
    console.log("Current message count before rewind:", lumi.sessionStore.getMessages().length);
    console.log("Slab allocated bytes before rewind:", lumi.sessionStore.getSlabSnapshot().allocatedBytes);

    // 4. Rewind to Snapshot 1
    lumi.rewindToSnapshot(snapshot);
    console.log("Rewound frame index:", lumi.sessionContext.turnCount);
    console.log("Message count after rewind:", lumi.sessionStore.getMessages().length);
    console.log("Slab allocated bytes after rewind:", lumi.sessionStore.getSlabSnapshot().allocatedBytes);

    // 5. AST Symbol Perception Search (Pass 7)
    const symbolResults = await lumi.eyes.searchSymbols(process.cwd(), "LumiMonolith");
    console.log(`\nAST Symbol Perception Search ('LumiMonolith'): Found ${symbolResults.length} matches`);
    if (symbolResults.length > 0) {
      console.log(`  First match: [${symbolResults[0].kind}] ${symbolResults[0].symbol} @ line ${symbolResults[0].line}`);
    }

    // 6. Terminal Progress Renderer & JSON-RPC Stream (Pass 8)
    const progressNotification = lumi.ears.emitProgress("Executing Pass 8 Frame Tick", 75);
    console.log("\nTerminal Progress Renderer JSON-RPC Notification:", JSON.stringify(progressNotification, null, 2));

    // 7. Workspace Mention Resolution (Pass 9)
    const mentionResult = await lumi.mentionResolver.resolveMentions(
      "inspect @file:package.json and find @symbol:LumiMonolith",
      process.cwd(),
      lumi.eyes,
      lumi.hands
    );
    console.log("\nWorkspace Mention Resolution (Pass 9):");
    console.log("  Parsed Prompt:", mentionResult.parsedPrompt);
    console.log("  Resolved Mentions:", mentionResult.resolvedMentions);
    console.log("  Context Blocks Generated:", mentionResult.expandedContextBlocks.length);

    // 8. Zombie Symbol & Module Decomposition (Pass 10)
    const decomposer = lumi.toolRegistry.moduleDecomposer;
    const report = decomposer.analyzeModule("src/index.ts", "export class LumiMonolith {}");
    console.log("\nModule Decomposition Audit (Pass 10):");
    console.log("  Integrity Score:", report.integrityScore);
    console.log("  Coupling Score:", report.couplingScore);

    // 9. Swarm Subagent Task Delegation (Pass 11)
    const swarmTask = await lumi.swarmDispatcher.delegateSubagentTask("view: package.json", lumi);
    console.log("\nSwarm Subagent Task Delegation (Pass 11):");
    console.log("  Task ID:", swarmTask.taskId);
    console.log("  Child Session ID:", swarmTask.childSessionId);
    console.log("  Subagent Response:", swarmTask.tickResult.response);
  })().catch((err) => {
    console.error("Deterministic Game Engine execution failed:", err);
  });
}
