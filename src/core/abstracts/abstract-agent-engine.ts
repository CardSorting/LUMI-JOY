import type { EngineTickInput, EngineTickResult, IAgentEngine } from "../contracts/agent.contracts.js";
import type { AgentConfig } from "../../agents/base/agent-config.js";
import type { SessionContext } from "../../sessions/base/session-context.js";
import type { AbstractSessionStore } from "./abstract-session-store.js";
import type { AbstractToolRegistry } from "./abstract-tool-registry.js";

/**
 * Template Method Abstract Base Class for Deterministic Agent Game Engine.
 * Enforces the deterministic frame tick lifecycle:
 * tick() -> preTick() -> executeTick() -> postTick() -> renderTelemetry() -> EngineTickResult
 */
export abstract class AbstractAgentEngine implements IAgentEngine {
  readonly config: AgentConfig;
  readonly sessionContext: SessionContext;
  readonly sessionStore: AbstractSessionStore;
  readonly toolRegistry: AbstractToolRegistry;

  constructor(
    config: AgentConfig,
    sessionContext: SessionContext,
    sessionStore: AbstractSessionStore,
    toolRegistry: AbstractToolRegistry
  ) {
    this.config = config;
    this.sessionContext = sessionContext;
    this.sessionStore = sessionStore;
    this.toolRegistry = toolRegistry;
  }

  async tick(input: EngineTickInput): Promise<EngineTickResult> {
    const timerLabel = `frame-${Date.now()}`;
    this.toolRegistry.ears.startTimer(timerLabel);

    // 1. Template Lifecycle Hook: Pre-Tick State Preparation
    await this.preTick(input);

    // 2. Template Lifecycle Hook: Core Deterministic Tick Execution
    const tickResult = await this.executeTick(input);

    const durationMs = this.toolRegistry.ears.endTimer(timerLabel);
    tickResult.durationMs = durationMs;

    // 3. Template Lifecycle Hook: Post-Tick Telemetry & State Audit
    await this.postTick(tickResult);

    return tickResult;
  }

  protected abstract preTick(input: EngineTickInput): Promise<void>;
  protected abstract executeTick(input: EngineTickInput): Promise<EngineTickResult>;
  protected abstract postTick(result: EngineTickResult): Promise<void>;
}
