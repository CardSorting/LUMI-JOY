import type { LumiMonolith } from "../../../index.js";
import { AbstractAgentEngine } from "../../../core/abstracts/abstract-agent-engine.js";
import { AbstractSessionStore } from "../../../core/abstracts/abstract-session-store.js";
import { AbstractHands } from "../../../core/abstracts/abstract-hands.js";
import { AbstractEars } from "../../../core/abstracts/abstract-ears.js";
import { AbstractToolRegistry } from "../../../core/abstracts/abstract-tool-registry.js";
import {
  CURRENT_EVOLUTION_BASELINE,
  GrandMonolithSynthesizer,
  type CompositionVerification,
} from "../../../factories/grand-monolith-synthesizer.js";

export interface RuntimeSmokeCheckResult {
  id: string;
  category: string;
  name: string;
  passed: boolean;
  durationMs: number;
  detail: string;
}

export interface RuntimeSmokeReport {
  baseline: typeof CURRENT_EVOLUTION_BASELINE;
  passed: boolean;
  totalChecks: number;
  passedCount: number;
  failedCount: number;
  durationMs: number;
  composition: CompositionVerification;
  checks: RuntimeSmokeCheckResult[];
}

interface SmokeCheckDefinition {
  id: string;
  category: string;
  name: string;
  run: () => Promise<string> | string;
}

/** Capability-based smoke verification for the current runtime baseline. */
export class RuntimeSmokeSuite {
  async run(monolith: LumiMonolith): Promise<RuntimeSmokeReport> {
    const suiteStartedAt = performance.now();
    const composition = GrandMonolithSynthesizer.verifyComposition(monolith.components);
    const checks: RuntimeSmokeCheckResult[] = [];

    const definitions: SmokeCheckDefinition[] = [
      {
        id: "composition.current",
        category: "composition",
        name: "Current evolution capabilities are composed",
        run: () => {
          this.assert(
            composition.cohesionStatus === "OPTIMAL",
            `Missing: ${composition.missingComponents.join(", ") || "none"}; unexpected: ${composition.unexpectedComponents.join(", ") || "none"}; duplicate manifest entries: ${composition.duplicateManifestComponents.join(", ") || "none"}`
          );
          return `${composition.requiredComponentCount} required capabilities across ${composition.componentCount} components`;
        },
      },
      {
        id: "contracts.inheritance",
        category: "architecture",
        name: "Core abstract contracts remain connected",
        run: () => {
          const valid = monolith.agentEngine instanceof AbstractAgentEngine
            && monolith.sessionStore instanceof AbstractSessionStore
            && monolith.hands instanceof AbstractHands
            && monolith.ears instanceof AbstractEars
            && monolith.toolRegistry instanceof AbstractToolRegistry;
          this.assert(valid, "One or more core runtime contracts are disconnected");
          return "agent, session, hands, ears, and tool-registry contracts verified";
        },
      },
      {
        id: "frame.outcome",
        category: "execution",
        name: "Local frame commits an explicit successful outcome",
        run: async () => {
          const result = await monolith.tick({ prompt: "remember: smoke_baseline = modern" });
          this.assert(result.outcome === "completed", `Expected completed outcome, received ${result.outcome}`);
          this.assert(result.response.includes("modern"), "Frame response did not preserve the local fact value");
          return `frame ${result.frameIndex} completed in ${result.durationMs} ms`;
        },
      },
      {
        id: "state.rewind",
        category: "state",
        name: "Snapshot rewind restores frame and message state",
        run: async () => {
          const snapshot = monolith.createSnapshot();
          try {
            const changed = await monolith.tick({ prompt: "remember: smoke_rewind = changed" });
            this.assert(changed.outcome === "completed", "Mutation frame did not complete before rewind");
          } finally {
            monolith.rewindToSnapshot(snapshot);
          }
          this.assert(monolith.sessionContext.turnCount === snapshot.frameIndex, "Frame index did not rewind");
          this.assert(monolith.sessionStore.getMessages().length === snapshot.messages.length, "Message projection did not rewind");
          return `restored frame ${snapshot.frameIndex} with ${snapshot.messages.length} messages`;
        },
      },
      {
        id: "roadmap.gate",
        category: "governance",
        name: "Completion gate fails closed without evaluated evidence",
        run: () => {
          const missing = monolith.completionGate.evaluateGate("runtime-smoke-unregistered");
          monolith.completionGate.registerGate("runtime-smoke-empty", []);
          const empty = monolith.completionGate.evaluateGate("runtime-smoke-empty");
          monolith.completionGate.registerGate("runtime-smoke-optional", [
            { id: "note", description: "optional note", required: false, evaluated: true, passed: true },
          ]);
          const optionalOnly = monolith.completionGate.evaluateGate("runtime-smoke-optional");
          const incompleteGateId = "runtime-smoke-incomplete";
          monolith.completionGate.registerGate(incompleteGateId, [
            { id: "implementation", description: "implementation present", required: true, evaluated: false, passed: true },
          ]);
          const incomplete = monolith.completionGate.evaluateGate(incompleteGateId);
          monolith.completionGate.registerGate("runtime-smoke-failed", [
            { id: "verification", description: "verification failed", required: true, evaluated: true, passed: false },
          ]);
          const failed = monolith.completionGate.evaluateGate("runtime-smoke-failed");

          const completeGateId = "runtime-smoke-complete";
          monolith.completionGate.registerGate(completeGateId, [
            { id: "implementation", description: "implementation present", required: true, evaluated: true, passed: true },
            { id: "verification", description: "verification present", required: true, evaluated: true, passed: true },
          ]);
          const complete = monolith.completionGate.evaluateGate(completeGateId);
          this.assert(!missing.allowedToProceed, "Unregistered completion gate was accepted");
          this.assert(!empty.allowedToProceed, "Empty completion gate was accepted");
          this.assert(!optionalOnly.allowedToProceed, "Gate without required criteria was accepted");
          this.assert(!incomplete.allowedToProceed, "Unevaluated required criterion was accepted");
          this.assert(!failed.allowedToProceed, "Failed required criterion was accepted");
          this.assert(complete.allowedToProceed, complete.summary);
          return "5 fail-closed states rejected; 2/2 evaluated required criteria accepted";
        },
      },
      {
        id: "security.command",
        category: "safety",
        name: "Modern command safety and diagnostics are active",
        run: () => {
          const blocked = monolith.components.broccoliCommandSanitizer.validateCommand("nano");
          const diagnostic = monolith.components.broccoliCommandDiagnostics.analyzeCommandFailure(
            "node server.js",
            1,
            "Error: listen EADDRINUSE: address already in use :::3000"
          );
          this.assert(!blocked.valid && blocked.isInteractiveBlocked === true, "Interactive editor was not blocked");
          this.assert(diagnostic.suggestion?.includes("3000") === true, "Port collision diagnostic was not actionable");
          return "interactive editor blocking and port-collision guidance verified";
        },
      },
      {
        id: "output.bounded",
        category: "observability",
        name: "Command output summaries remain bounded",
        run: () => {
          const buffer = monolith.components.broccoliOutputBuffer;
          buffer.clear();
          buffer.appendChunk("one\ntwo\nthree\nfour\nfive");
          const summary = buffer.getFormattedSummary({ maxLines: 3, summaryLinesToKeep: 1 });
          buffer.clear();
          this.assert(summary.includes("lines truncated"), "Oversized output was not summarized");
          this.assert(summary.includes("one") && summary.includes("five"), "Bounded summary did not preserve head and tail");
          return "head/tail output retention verified";
        },
      },
      {
        id: "integrity.triad",
        category: "governance",
        name: "Strategic integrity audit contract is complete",
        run: () => {
          const template = monolith.components.broccoliIntegrityProtocol.constructor;
          const content = ["### The Architect", "### The Critic", "### The SRE"].join("\n");
          const result = monolith.components.broccoliIntegrityProtocol.evaluateAudit(content);
          this.assert(typeof template === "function" && result.complete, "TRIAD audit sections were not recognized");
          return "architect, critic, and SRE review sections verified";
        },
      },
      {
        id: "health.aggregate",
        category: "health",
        name: "Subsystem health aggregation remains optimal",
        run: () => {
          const health = monolith.systemHealthAggregator.aggregateHealth();
          this.assert(health.overallStatus === "OPTIMAL", `Health status is ${health.overallStatus}`);
          return `${health.healthyCount}/${health.totalSubsystems} registered subsystems healthy`;
        },
      },
    ];

    for (const definition of definitions) {
      checks.push(await this.executeCheck(definition));
    }

    const passedCount = checks.filter((check) => check.passed).length;
    const failedCount = checks.length - passedCount;
    return {
      baseline: CURRENT_EVOLUTION_BASELINE,
      passed: failedCount === 0,
      totalChecks: checks.length,
      passedCount,
      failedCount,
      durationMs: Number((performance.now() - suiteStartedAt).toFixed(2)),
      composition,
      checks,
    };
  }

  private async executeCheck(definition: SmokeCheckDefinition): Promise<RuntimeSmokeCheckResult> {
    const startedAt = performance.now();
    try {
      const detail = await definition.run();
      return {
        id: definition.id,
        category: definition.category,
        name: definition.name,
        passed: true,
        durationMs: Number((performance.now() - startedAt).toFixed(2)),
        detail,
      };
    } catch (error) {
      return {
        id: definition.id,
        category: definition.category,
        name: definition.name,
        passed: false,
        durationMs: Number((performance.now() - startedAt).toFixed(2)),
        detail: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private assert(condition: boolean, message: string): asserts condition {
    if (!condition) throw new Error(message);
  }
}
