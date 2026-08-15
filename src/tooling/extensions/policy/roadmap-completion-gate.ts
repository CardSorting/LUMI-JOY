import { createHash } from "crypto";

export type GateCriterionSeverity = "critical" | "high" | "medium" | "low" | "advisory";

export type GateCriterionCategory =
  | "integrity"
  | "safety"
  | "correctness"
  | "quality"
  | "performance"
  | "governance"
  | "admission";

export type GatePhase = "admission" | "in_flight" | "completion" | "postmortem";

export type EvaluationAggregationPolicy =
  | "all_required"
  | "weighted_threshold"
  | "short_circuit_on_critical";

export type RemediationStrategyType =
  | "PATCH_LOCAL"
  | "REWRITE_MODULE"
  | "PIVOT_APPROACH"
  | "EXPAND_CONTEXT"
  | "SIMPLIFY_SCOPE"
  | "ESCALATE_REASONING"
  | "RESTORE_CHECKPOINT";

export interface RemediationDirective {
  strategy: RemediationStrategyType;
  rootCause: string;
  priorityCriteria: string[];
  actionSteps: string[];
  promptPayload: string;
  isStagnantEscalation?: boolean;
}

export interface GateCriteria {
  id: string;
  description: string;
  required: boolean;
  evaluated: boolean;
  passed: boolean;
  severity?: GateCriterionSeverity;
  category?: GateCriterionCategory;
  phase?: GatePhase;
  weight?: number;
  detail?: string;
  evaluatedAt?: number;
  durationMs?: number;
}

export interface AttemptDiff {
  newlyPassing: string[];
  newlyFailing: string[];
  stagnantFailing: string[];
  improvedScore: boolean;
  scoreDelta: number;
  isDivergent?: boolean;
}

export interface AttemptFingerprint {
  responseHash: string;
  toolsHash: string;
  combinedHash: string;
  isZeroDeltaStagnant?: boolean;
}

export interface CompletionGateResult {
  allowedToProceed: boolean;
  gateId: string;
  criteriaResults: GateCriteria[];
  summary: string;
  blockingCriteria?: GateCriteria[];
  advisoryCriteria?: GateCriteria[];
  autonomousFeedback?: string;
  remediationDirective?: RemediationDirective;
  fingerprint?: AttemptFingerprint;
  evaluatedAt?: number;
  evaluationDurationMs?: number;
  passRate?: number;
  score?: number;
  maxScore?: number;
  diffFromPreviousAttempt?: AttemptDiff;
}

export interface AttemptGateEvaluationContext {
  gateId: string;
  attempt: number;
  maxAttempts: number;
  prompt: string;
  responseCandidate?: string;
  toolResults?: Array<{ name: string; output?: unknown; error?: string }>;
  errorMessage?: string;
  history?: Array<{
    attempt: number;
    gateResult: CompletionGateResult;
    feedbackSent?: string;
    durationMs?: number;
    fingerprint?: AttemptFingerprint;
  }>;
  metadata?: Record<string, unknown>;
  now?: () => number;
}

export type CriterionEvaluatorFn = (
  context: AttemptGateEvaluationContext
) =>
  | Promise<boolean | { passed: boolean; detail?: string; score?: number; metadata?: Record<string, unknown> }>
  | boolean
  | { passed: boolean; detail?: string; score?: number; metadata?: Record<string, unknown> };

export interface DynamicGateCriteria extends GateCriteria {
  evaluator?: CriterionEvaluatorFn;
}

export type BackoffStrategy = "none" | "linear" | "exponential" | "jittered";

export type CircuitBreakerStatus = "CLOSED" | "OPEN" | "HALF_OPEN";

export interface CircuitBreakerState {
  status: CircuitBreakerStatus;
  consecutiveFailures: number;
  trippedUntil: number;
  probeInFlight?: boolean;
}

export interface CircuitBreakerConfig {
  maxConsecutiveFailures?: number;
  cooldownMs?: number;
  enabled?: boolean;
}

export interface FlightEvent {
  timestamp: number;
  elapsedMs: number;
  type:
    | "attempt_started"
    | "evaluator_invoked"
    | "evaluator_completed"
    | "diff_computed"
    | "feedback_synthesized"
    | "directive_escalated"
    | "oscillation_guarded"
    | "stagnation_trapped"
    | "circuit_breaker_tripped"
    | "candidate_arbitrated"
    | "dag_step_executed"
    | "gate_completed";
  attempt: number;
  gateId: string;
  detail: string;
  metadata?: Record<string, unknown>;
}

export interface FlightLog {
  gateId: string;
  startedAt: number;
  completedAt?: number;
  totalDurationMs: number;
  attemptsCount: number;
  events: FlightEvent[];
  initialStrategy: RemediationStrategyType;
  finalStrategy: RemediationStrategyType;
  success: boolean;
}

export class AttemptFlightRecorder {
  private readonly events: FlightEvent[] = [];
  private readonly startedAt: number;
  private readonly gateId: string;
  private initialStrategy: RemediationStrategyType = "PATCH_LOCAL";
  private finalStrategy: RemediationStrategyType = "PATCH_LOCAL";
  private success = false;

  constructor(gateId: string) {
    this.gateId = gateId;
    this.startedAt = Date.now();
  }

  recordEvent(
    type: FlightEvent["type"],
    attempt: number,
    detail: string,
    metadata?: Record<string, unknown>
  ): void {
    this.events.push({
      timestamp: Date.now(),
      elapsedMs: Date.now() - this.startedAt,
      type,
      attempt,
      gateId: this.gateId,
      detail,
      metadata,
    });
  }

  setStrategyProgression(initial: RemediationStrategyType, final: RemediationStrategyType): void {
    this.initialStrategy = initial;
    this.finalStrategy = final;
  }

  setCompletion(success: boolean): void {
    this.success = success;
  }

  getEvents(): readonly FlightEvent[] {
    return [...this.events];
  }

  exportFlightLog(): FlightLog {
    return {
      gateId: this.gateId,
      startedAt: this.startedAt,
      completedAt: Date.now(),
      totalDurationMs: Date.now() - this.startedAt,
      attemptsCount: this.events.reduce((max, e) => Math.max(max, e.attempt), 1),
      events: [...this.events],
      initialStrategy: this.initialStrategy,
      finalStrategy: this.finalStrategy,
      success: this.success,
    };
  }

  generateFlightLogMarkdown(): string {
    const log = this.exportFlightLog();
    const rows = log.events.map(
      (e) => `| +${e.elapsedMs}ms | Attempt ${e.attempt} | \`${e.type}\` | ${e.detail} |`
    );

    return [
      `# 🛫 Flight Log: Completion Gate \`${log.gateId}\``,
      ``,
      `- **Status**: ${log.success ? "✅ PASSED" : "❌ FAILED"}`,
      `- **Total Duration**: ${log.totalDurationMs}ms`,
      `- **Attempts**: ${log.attemptsCount}`,
      `- **Strategy Progression**: \`${log.initialStrategy}\` ➔ \`${log.finalStrategy}\``,
      ``,
      `| Elapsed | Attempt | Event Type | Details |`,
      `|---|---|---|---|`,
      ...rows,
      ``,
    ].join("\n");
  }
}

export interface CriterionScoreResult {
  score: number;
  maxScore: number;
  passRate: number;
  passedCount: number;
  totalCount: number;
  blockingCount: number;
  passed: boolean;
  summary: string;
}

export class CriterionScoreEvaluator {
  static evaluateScore(
    criteria: GateCriteria[],
    minScoreToPass = 100.0,
    policy: EvaluationAggregationPolicy = "all_required"
  ): CriterionScoreResult {
    const totalCount = criteria.length;
    if (totalCount === 0) {
      return {
        score: 0,
        maxScore: 0,
        passRate: 0,
        passedCount: 0,
        totalCount: 0,
        blockingCount: 0,
        passed: false,
        summary: "No criteria provided for evaluation.",
      };
    }

    const passedCriteria = criteria.filter((c) => c.evaluated && c.passed);
    const passedCount = passedCriteria.length;
    const passRate = totalCount > 0 ? Number((passedCount / totalCount).toFixed(4)) : 0;

    const maxScore = criteria.reduce((sum, c) => sum + (c.weight ?? 1.0), 0);
    const actualScore = passedCriteria.reduce((sum, c) => sum + (c.weight ?? 1.0), 0);
    const score = maxScore > 0 ? Number(((actualScore / maxScore) * 100).toFixed(2)) : 0;

    const requiredCriteria = criteria.filter((c) => c.required);
    const blockingCriteria = requiredCriteria.filter((c) => !c.evaluated || !c.passed);
    const blockingCount = blockingCriteria.length;

    let passed = false;
    if (policy === "weighted_threshold") {
      passed = score >= minScoreToPass && blockingCount === 0;
    } else {
      passed = requiredCriteria.length > 0 && blockingCount === 0;
    }

    const summary = passed
      ? `Criterion score evaluation passed with score ${score}% (${passedCount}/${totalCount} criteria satisfied).`
      : `Criterion score evaluation failed with score ${score}% (${blockingCount} blocking criteria).`;

    return {
      score,
      maxScore,
      passRate,
      passedCount,
      totalCount,
      blockingCount,
      passed,
      summary,
    };
  }
}

/**
 * Backward compatibility alias for direct criterion scoring without voting or quorum locks.
 */
export class ConsensusArbiter {
  static evaluateConsensus(
    votes: Array<{ evaluatorId: string; passed: boolean; score?: number; weight?: number; severity?: GateCriterionSeverity }>,
    config: { threshold?: string | number; minScoreToPass?: number } = {}
  ): CriterionScoreResult {
    let minScore = 50.0;
    if (typeof config.threshold === "number") {
      minScore = config.threshold;
    } else if (config.threshold === "unanimous") {
      minScore = 100.0;
    } else if (config.threshold === "supermajority_66") {
      minScore = 66.6;
    } else if (typeof config.minScoreToPass === "number") {
      minScore = config.minScoreToPass;
    }

    const criteria: GateCriteria[] = votes.map((v) => ({
      id: v.evaluatorId,
      description: v.evaluatorId,
      required: true,
      evaluated: true,
      passed: v.passed,
      weight: v.weight ?? 1.0,
      severity: v.severity,
    }));

    return CriterionScoreEvaluator.evaluateScore(criteria, minScore, "weighted_threshold");
  }
}

export interface CandidateBranchEvaluation<T = unknown> {
  candidateIndex: number;
  candidateValue?: T;
  responseCandidate?: string;
  gateResult: CompletionGateResult;
  score: number;
  criticalViolations: number;
  rank: number;
}

export interface CandidateArbitrationResult<T = unknown> {
  winningCandidateIndex: number;
  winningCandidate?: T;
  winningGateResult: CompletionGateResult;
  candidatesEvaluated: number;
  rankedEvaluations: CandidateBranchEvaluation<T>[];
  selectionReason: string;
}

export interface GateNode {
  gateId: string;
  dependencies: string[];
  shortCircuitOnFailure?: boolean;
}

export interface DagExecutionReport {
  success: boolean;
  totalDurationMs: number;
  executedGates: string[];
  skippedGates: string[];
  gateResults: Record<string, CompletionGateResult>;
  summary: string;
}

export class GatePipelineDag {
  private readonly nodes = new Map<string, GateNode>();

  addGateNode(gateId: string, dependencies: string[] = [], shortCircuitOnFailure = true): this {
    this.nodes.set(gateId, { gateId, dependencies, shortCircuitOnFailure });
    return this;
  }

  getExecutionOrder(): string[] {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const order: string[] = [];

    const visit = (nodeId: string) => {
      if (visiting.has(nodeId)) {
        throw new Error(`Cycle detected in GatePipelineDag at node '${nodeId}'`);
      }
      if (!visited.has(nodeId)) {
        visiting.add(nodeId);
        const node = this.nodes.get(nodeId);
        if (node) {
          for (const dep of node.dependencies) {
            visit(dep);
          }
        }
        visiting.delete(nodeId);
        visited.add(nodeId);
        order.push(nodeId);
      }
    };

    for (const nodeId of this.nodes.keys()) {
      if (!visited.has(nodeId)) {
        visit(nodeId);
      }
    }

    return order;
  }

  async executeDag(
    gateEngine: RoadmapCompletionGate,
    context: AttemptGateEvaluationContext
  ): Promise<DagExecutionReport> {
    const start = performance.now();
    const order = this.getExecutionOrder();
    const executedGates: string[] = [];
    const skippedGates: string[] = [];
    const gateResults: Record<string, CompletionGateResult> = {};

    let overallSuccess = true;
    let failureGate: string | undefined;

    for (const gateId of order) {
      const node = this.nodes.get(gateId);
      // Check if any upstream dependency failed
      const upstreamFailed = node?.dependencies.some((dep) => {
        const res = gateResults[dep];
        return res && !res.allowedToProceed;
      });

      if (upstreamFailed) {
        skippedGates.push(gateId);
        continue;
      }

      const res = await gateEngine.evaluateAttemptGate(gateId, { ...context, gateId });
      gateResults[gateId] = res;
      executedGates.push(gateId);

      if (!res.allowedToProceed) {
        overallSuccess = false;
        failureGate = gateId;
        if (node?.shortCircuitOnFailure !== false) {
          // Skip remaining gates
          const remainingIndex = order.indexOf(gateId) + 1;
          for (let i = remainingIndex; i < order.length; i++) {
            skippedGates.push(order[i]);
          }
          break;
        }
      }
    }

    const summary = overallSuccess
      ? `All ${executedGates.length} DAG gates passed successfully.`
      : `DAG execution blocked by gate '${failureGate}' (${skippedGates.length} downstream gates skipped).`;

    return {
      success: overallSuccess,
      totalDurationMs: Number((performance.now() - start).toFixed(3)),
      executedGates,
      skippedGates,
      gateResults,
      summary,
    };
  }
}

export interface DiagnosticMicroPatch {
  filePath?: string;
  line?: number;
  diagnosticCode?: string;
  message: string;
  suggestedAction: string;
}

export class DiagnosticPatchSynthesizer {
  static extractDiagnostics(
    errorMessage?: string,
    toolResults?: Array<{ name: string; output?: unknown; error?: string }>
  ): DiagnosticMicroPatch[] {
    const patches: DiagnosticMicroPatch[] = [];

    if (errorMessage) {
      // 1. File path and line extraction (e.g., src/index.ts:42:10)
      const fileLineMatch = errorMessage.match(/([a-zA-Z0-9_\-\.\/]+\.(?:ts|tsx|js|jsx|json|md)):(\d+)(?::(\d+))?/);
      const filePath = fileLineMatch?.[1];
      const line = fileLineMatch?.[2] ? parseInt(fileLineMatch[2], 10) : undefined;

      // 2. TypeScript diagnostics: TS\d+
      const tsMatch = errorMessage.match(/TS(\d+):\s*(.*)/);
      if (tsMatch) {
        patches.push({
          filePath,
          line,
          diagnosticCode: `TS${tsMatch[1]}`,
          message: tsMatch[2].trim(),
          suggestedAction: `Correct TypeScript type constraint violation for TS${tsMatch[1]}${filePath ? ` in ${filePath}` : ""}.`,
        });
      }

      // 3. Module / File resolution error
      const moduleMatch = errorMessage.match(/(?:Cannot find module|ENOENT: no such file or directory|Module not found: Error: Can't resolve)\s*['"]?([^'"\n]+)['"]?/i);
      if (moduleMatch) {
        patches.push({
          filePath,
          line,
          diagnosticCode: "ERR_MODULE_NOT_FOUND",
          message: `Cannot resolve module or file: '${moduleMatch[1]}'`,
          suggestedAction: `Verify import path and ensure file '${moduleMatch[1]}' exists.`,
        });
      }

      // 4. Permission / Lock error
      const permMatch = errorMessage.match(/(?:EACCES|permission denied|EEXIST|file already exists)/i);
      if (permMatch) {
        patches.push({
          filePath,
          line,
          diagnosticCode: "ERR_FS_PERMISSION",
          message: errorMessage,
          suggestedAction: "Check filesystem permissions, directory write access, and remove stale locks.",
        });
      }

      // 5. Non-zero exit code
      const exitMatch = errorMessage.match(/(?:Command failed with exit code|Process exited with code)\s*(\d+)/i);
      if (exitMatch) {
        patches.push({
          filePath,
          line,
          diagnosticCode: `EXIT_${exitMatch[1]}`,
          message: `Process terminated abnormally with exit code ${exitMatch[1]}`,
          suggestedAction: `Inspect stdout/stderr diagnostics and remediate non-zero exit code ${exitMatch[1]}.`,
        });
      }

      if (patches.length === 0) {
        patches.push({
          filePath,
          line,
          message: errorMessage,
          suggestedAction: "Resolve root-cause exception reported in runtime context.",
        });
      }
    }

    if (toolResults) {
      for (const t of toolResults) {
        if (t.error) {
          patches.push({
            message: `Tool '${t.name}' failure: ${t.error}`,
            suggestedAction: `Verify arguments and execution preconditions for tool '${t.name}'.`,
          });
        }
      }
    }

    return patches;
  }
}

export interface AttemptGateStrategyConfig {
  maxAttempts?: number;
  failClosedOnTimeout?: boolean;
  autoSynthesizeFeedback?: boolean;
  aggregationPolicy?: EvaluationAggregationPolicy;
  minScoreToPass?: number;
  backoffStrategy?: BackoffStrategy;
  initialBackoffMs?: number;
  maxBackoffMs?: number;
  detectOscillation?: boolean;
  oscillationThreshold?: number;
  circuitBreaker?: CircuitBreakerConfig;
  customFeedbackGenerator?: (result: CompletionGateResult, attempt: number, maxAttempts: number) => string;
  onAttemptEvaluated?: (attempt: number, result: CompletionGateResult) => void;
  onAttemptRetry?: (attempt: number, delayMs: number, reason: string) => void;
  onOscillationDetected?: (attempt: number, repeatedFailures: string[]) => void;
  onStrategyEscalated?: (
    attempt: number,
    oldStrategy: RemediationStrategyType,
    newStrategy: RemediationStrategyType
  ) => void;
  onStagnationDetected?: (attempt: number, fingerprint: AttemptFingerprint) => void;
}

export interface AutonomousAttemptExecutionResult<T = unknown> {
  success: boolean;
  attempts: number;
  finalResult?: T;
  gateResult: CompletionGateResult;
  attemptHistory: Array<{
    attempt: number;
    gateResult: CompletionGateResult;
    feedbackSent?: string;
    durationMs?: number;
    remediationDirective?: RemediationDirective;
    fingerprint?: AttemptFingerprint;
  }>;
  summary: string;
  totalDurationMs: number;
  oscillationDetected?: boolean;
  circuitBreakerTripped?: boolean;
  zeroDeltaStagnant?: boolean;
  activeRemediationStrategy?: RemediationStrategyType;
  flightLog?: FlightLog;
}

/**
 * RoadmapCompletionGate.
 * Absorbed from packages/codemarie/src/services/roadmap/RoadmapCompletionGate.ts (Pass 82 / ADR-012).
 * Upgraded with Pass 193 Apex / Sovereign Tier Attempt Completion Gate Strategy (ADR-084).
 *
 * Verifies quality gate requirements and completion criteria before phase execution transitions,
 * supporting dynamic evaluators, deterministic fingerprinting, zero-delta stagnation traps,
 * forensic flight recording, consensus arbitration, multi-branch candidate evaluation,
 * DAG pipelines, anti-oscillation guards, circuit breakers, and multi-attempt self-healing loops.
 */
export class RoadmapCompletionGate {
  private readonly gateCriteriaMap = new Map<string, GateCriteria[]>();
  private readonly gateEvaluatorMap = new Map<string, Map<string, CriterionEvaluatorFn>>();
  private readonly gateMetadataMap = new Map<string, Record<string, unknown>>();
  private readonly circuitBreakerStateMap = new Map<string, CircuitBreakerState>();

  registerGate(gateId: string, criteria: GateCriteria[]): void {
    if (gateId.trim().length === 0) throw new Error("Completion gate ID must not be empty");
    const criterionIds = new Set<string>();
    for (const criterion of criteria) {
      if (criterion.id.trim().length === 0) throw new Error("Completion criterion ID must not be empty");
      if (criterionIds.has(criterion.id)) {
        throw new Error(`Completion gate '${gateId}' has duplicate criterion '${criterion.id}'`);
      }
      criterionIds.add(criterion.id);
    }
    this.gateCriteriaMap.set(gateId, criteria.map((criterion) => ({ ...criterion })));
    this.gateEvaluatorMap.delete(gateId);
  }

  registerDynamicGate(gateId: string, criteria: DynamicGateCriteria[], metadata?: Record<string, unknown>): void {
    if (gateId.trim().length === 0) throw new Error("Completion gate ID must not be empty");
    const criterionIds = new Set<string>();
    const evaluators = new Map<string, CriterionEvaluatorFn>();

    for (const criterion of criteria) {
      if (criterion.id.trim().length === 0) throw new Error("Completion criterion ID must not be empty");
      if (criterionIds.has(criterion.id)) {
        throw new Error(`Completion gate '${gateId}' has duplicate criterion '${criterion.id}'`);
      }
      criterionIds.add(criterion.id);
      if (criterion.evaluator) {
        evaluators.set(criterion.id, criterion.evaluator);
      }
    }

    this.gateCriteriaMap.set(
      gateId,
      criteria.map((c) => ({
        id: c.id,
        description: c.description,
        required: c.required,
        evaluated: c.evaluated,
        passed: c.passed,
        severity: c.severity ?? (c.required ? "high" : "advisory"),
        category: c.category ?? "quality",
        phase: c.phase ?? "completion",
        weight: c.weight ?? (c.required ? 2.0 : 1.0),
        detail: c.detail,
        evaluatedAt: c.evaluatedAt,
        durationMs: c.durationMs,
      }))
    );
    this.gateEvaluatorMap.set(gateId, evaluators);
    if (metadata) {
      this.gateMetadataMap.set(gateId, { ...metadata });
    }
  }

  recordCriterionEvidence(
    gateId: string,
    criterionId: string,
    passed: boolean,
    detail?: string,
    metadata?: { durationMs?: number; category?: GateCriterionCategory; weight?: number }
  ): void {
    const criteria = this.gateCriteriaMap.get(gateId);
    if (!criteria) {
      throw new Error(`Cannot record evidence: Gate '${gateId}' is not registered`);
    }
    const target = criteria.find((c) => c.id === criterionId);
    if (!target) {
      throw new Error(`Cannot record evidence: Criterion '${criterionId}' not found in gate '${gateId}'`);
    }
    target.evaluated = true;
    target.passed = passed;
    target.evaluatedAt = Date.now();
    if (detail !== undefined) {
      target.detail = detail;
    }
    if (metadata?.durationMs !== undefined) {
      target.durationMs = metadata.durationMs;
    }
    if (metadata?.category !== undefined) {
      target.category = metadata.category;
    }
    if (metadata?.weight !== undefined) {
      target.weight = metadata.weight;
    }
  }

  batchRecordEvidence(
    gateId: string,
    evidence: Record<string, boolean | { passed: boolean; detail?: string; durationMs?: number; weight?: number }>
  ): void {
    for (const [criterionId, val] of Object.entries(evidence)) {
      if (typeof val === "boolean") {
        this.recordCriterionEvidence(gateId, criterionId, val);
      } else {
        this.recordCriterionEvidence(gateId, criterionId, val.passed, val.detail, {
          durationMs: val.durationMs,
          weight: val.weight,
        });
      }
    }
  }

  resetGateEvidence(gateId: string): void {
    const criteria = this.gateCriteriaMap.get(gateId);
    if (criteria) {
      for (const criterion of criteria) {
        criterion.evaluated = false;
        criterion.passed = false;
        delete criterion.detail;
        delete criterion.evaluatedAt;
        delete criterion.durationMs;
      }
    }
  }

  getGateCriteria(gateId: string): readonly GateCriteria[] | undefined {
    return this.gateCriteriaMap.get(gateId)?.map((c) => ({ ...c }));
  }

  hasGate(gateId: string): boolean {
    return this.gateCriteriaMap.has(gateId);
  }

  cloneGate(sourceGateId: string, targetGateId: string): void {
    const sourceCriteria = this.gateCriteriaMap.get(sourceGateId);
    if (!sourceCriteria) {
      throw new Error(`Cannot clone: Source gate '${sourceGateId}' is not registered`);
    }
    const sourceEvaluators = this.gateEvaluatorMap.get(sourceGateId);
    const dynamicCriteria: DynamicGateCriteria[] = sourceCriteria.map((c) => ({
      ...c,
      evaluator: sourceEvaluators?.get(c.id),
    }));
    this.registerDynamicGate(targetGateId, dynamicCriteria, this.gateMetadataMap.get(sourceGateId));
  }

  pipeGates(newGateId: string, ...sourceGateIds: string[]): void {
    const combinedCriteria: DynamicGateCriteria[] = [];
    const seenIds = new Set<string>();

    for (const sId of sourceGateIds) {
      const sCriteria = this.gateCriteriaMap.get(sId);
      if (!sCriteria) {
        throw new Error(`Cannot pipe gates: Gate '${sId}' is not registered`);
      }
      const sEvaluators = this.gateEvaluatorMap.get(sId);
      for (const c of sCriteria) {
        const uniqueId = seenIds.has(c.id) ? `${sId}:${c.id}` : c.id;
        seenIds.add(uniqueId);
        combinedCriteria.push({
          ...c,
          id: uniqueId,
          evaluator: sEvaluators?.get(c.id),
        });
      }
    }

    this.registerDynamicGate(newGateId, combinedCriteria);
  }

  computeAttemptFingerprint(
    response?: string,
    toolResults?: Array<{ name: string; output?: unknown; error?: string }>,
    history?: Array<{ fingerprint?: AttemptFingerprint }>
  ): AttemptFingerprint {
    const respStr = response?.trim() ?? "";
    const responseHash = createHash("sha256").update(respStr).digest("hex").slice(0, 16);

    const toolStr = toolResults ? JSON.stringify(toolResults) : "";
    const toolsHash = createHash("sha256").update(toolStr).digest("hex").slice(0, 16);

    const combinedHash = createHash("sha256").update(`${responseHash}:${toolsHash}`).digest("hex").slice(0, 16);

    let isZeroDeltaStagnant = false;
    if (history && history.length > 0) {
      const prev = history[history.length - 1]?.fingerprint;
      if (prev && prev.combinedHash === combinedHash) {
        isZeroDeltaStagnant = true;
      }
    }

    return {
      responseHash,
      toolsHash,
      combinedHash,
      isZeroDeltaStagnant,
    };
  }

  evaluateGate(gateId: string): CompletionGateResult {
    const evalStartedAt = performance.now();
    const registered = this.gateCriteriaMap.has(gateId);
    const criteria = this.gateCriteriaMap.get(gateId)?.map((criterion) => ({ ...criterion })) ?? [];
    const requiredCriteria = criteria.filter((criterion) => criterion.required);
    const blockingCriteria = requiredCriteria.filter((criterion) => !criterion.evaluated || !criterion.passed);
    const advisoryCriteria = criteria.filter((criterion) => !criterion.required && (!criterion.evaluated || !criterion.passed));
    const allowedToProceed =
      registered && criteria.length > 0 && requiredCriteria.length > 0 && blockingCriteria.length === 0;

    const evaluatedCount = criteria.filter((c) => c.evaluated && c.passed).length;
    const passRate = criteria.length > 0 ? Number((evaluatedCount / criteria.length).toFixed(4)) : 0;

    const maxScore = criteria.reduce((sum, c) => sum + (c.weight ?? 1.0), 0);
    const actualScore = criteria.filter((c) => c.evaluated && c.passed).reduce((sum, c) => sum + (c.weight ?? 1.0), 0);
    const scorePercentage = maxScore > 0 ? Number(((actualScore / maxScore) * 100).toFixed(2)) : 0;

    let summary: string;
    if (!registered) {
      summary = `Gate '${gateId}' is not registered.`;
    } else if (criteria.length === 0) {
      summary = `Gate '${gateId}' has no completion criteria.`;
    } else if (requiredCriteria.length === 0) {
      summary = `Gate '${gateId}' has no required completion criteria.`;
    } else if (blockingCriteria.length > 0) {
      summary = `Gate '${gateId}' is blocked by required criteria: ${blockingCriteria.map((criterion) => criterion.id).join(", ")}.`;
    } else {
      summary = `Gate '${gateId}' passed all required evaluated completion criteria.`;
    }

    const autonomousFeedback =
      blockingCriteria.length > 0
        ? this.deriveAutonomousFeedback(
            { allowedToProceed, gateId, criteriaResults: criteria, summary, blockingCriteria, advisoryCriteria },
            1,
            1
          )
        : undefined;

    const remediationDirective =
      blockingCriteria.length > 0
        ? this.deriveRemediationDirective(
            { allowedToProceed, gateId, criteriaResults: criteria, summary, blockingCriteria, advisoryCriteria },
            1,
            1
          )
        : undefined;

    return {
      allowedToProceed,
      gateId,
      criteriaResults: criteria,
      summary,
      blockingCriteria,
      advisoryCriteria,
      autonomousFeedback,
      remediationDirective,
      evaluatedAt: Date.now(),
      evaluationDurationMs: Number((performance.now() - evalStartedAt).toFixed(3)),
      passRate,
      score: scorePercentage,
      maxScore,
    };
  }

  async evaluateAttemptGate(
    gateId: string,
    context: AttemptGateEvaluationContext,
    aggregationPolicy: EvaluationAggregationPolicy = "all_required",
    minScoreToPass = 100.0
  ): Promise<CompletionGateResult> {
    const evalStartedAt = performance.now();
    const registered = this.gateCriteriaMap.has(gateId);
    if (!registered) {
      return {
        allowedToProceed: false,
        gateId,
        criteriaResults: [],
        summary: `Gate '${gateId}' is not registered.`,
        blockingCriteria: [],
        advisoryCriteria: [],
        autonomousFeedback: `[AUTONOMOUS_GATE_ERROR] Completion gate '${gateId}' is not registered in the system.`,
        evaluatedAt: Date.now(),
        evaluationDurationMs: Number((performance.now() - evalStartedAt).toFixed(3)),
        passRate: 0,
        score: 0,
      };
    }

    const criteria = this.gateCriteriaMap.get(gateId)!;
    const evaluators = this.gateEvaluatorMap.get(gateId);

    // Compute deterministic state fingerprint
    const fingerprint = this.computeAttemptFingerprint(
      context.responseCandidate,
      context.toolResults,
      context.history
    );

    // Run dynamic evaluators where attached
    if (evaluators) {
      for (const criterion of criteria) {
        const evaluator = evaluators.get(criterion.id);
        if (evaluator) {
          const criterionStart = performance.now();
          try {
            const evalResult = await evaluator(context);
            criterion.durationMs = Number((performance.now() - criterionStart).toFixed(3));
            criterion.evaluatedAt = Date.now();

            if (typeof evalResult === "boolean") {
              criterion.evaluated = true;
              criterion.passed = evalResult;
              if (!evalResult && context.errorMessage) {
                criterion.detail = context.errorMessage;
              }
            } else {
              criterion.evaluated = true;
              criterion.passed = evalResult.passed;
              if (evalResult.detail) {
                criterion.detail = evalResult.detail;
              }
            }

            // Short-circuit on critical failure if policy is short_circuit_on_critical
            if (
              aggregationPolicy === "short_circuit_on_critical" &&
              criterion.severity === "critical" &&
              criterion.evaluated &&
              !criterion.passed
            ) {
              break;
            }
          } catch (err) {
            criterion.evaluated = true;
            criterion.passed = false;
            criterion.evaluatedAt = Date.now();
            criterion.durationMs = Number((performance.now() - criterionStart).toFixed(3));
            criterion.detail = `Evaluator threw exception: ${err instanceof Error ? err.message : String(err)}`;
            if (aggregationPolicy === "short_circuit_on_critical" && criterion.severity === "critical") {
              break;
            }
          }
        }
      }
    }

    const clonedCriteria = criteria.map((c) => ({ ...c }));
    const requiredCriteria = clonedCriteria.filter((c) => c.required);
    const blockingCriteria = clonedCriteria.filter((c) => !c.evaluated || !c.passed);
    const advisoryCriteria = clonedCriteria.filter((c) => !c.required && (!c.evaluated || !c.passed));

    const maxScore = clonedCriteria.reduce((sum, c) => sum + (c.weight ?? 1.0), 0);
    const actualScore = clonedCriteria
      .filter((c) => c.evaluated && c.passed)
      .reduce((sum, c) => sum + (c.weight ?? 1.0), 0);
    const scorePercentage = maxScore > 0 ? Number(((actualScore / maxScore) * 100).toFixed(2)) : 0;

    let allowedToProceed = false;
    if (aggregationPolicy === "weighted_threshold") {
      allowedToProceed =
        clonedCriteria.length > 0 && scorePercentage >= minScoreToPass && blockingCriteria.length === 0;
    } else {
      allowedToProceed = clonedCriteria.length > 0 && requiredCriteria.length > 0 && blockingCriteria.length === 0;
    }

    const evaluatedCount = clonedCriteria.filter((c) => c.evaluated && c.passed).length;
    const passRate = clonedCriteria.length > 0 ? Number((evaluatedCount / clonedCriteria.length).toFixed(4)) : 0;

    let summary: string;
    if (clonedCriteria.length === 0) {
      summary = `Gate '${gateId}' has no completion criteria.`;
    } else if (requiredCriteria.length === 0) {
      summary = `Gate '${gateId}' has no required completion criteria.`;
    } else if (blockingCriteria.length > 0) {
      summary = `Gate '${gateId}' is blocked by required criteria: ${blockingCriteria.map((c) => c.id).join(", ")}.`;
    } else {
      summary = `Gate '${gateId}' passed all required evaluated completion criteria on attempt ${context.attempt}/${context.maxAttempts}.`;
    }

    const diff = this.computeAttemptDiff(clonedCriteria, scorePercentage, context.history);

    const autonomousFeedback =
      blockingCriteria.length > 0
        ? this.deriveAutonomousFeedback(
            { allowedToProceed, gateId, criteriaResults: clonedCriteria, summary, blockingCriteria, advisoryCriteria, fingerprint },
            context.attempt,
            context.maxAttempts,
            context.history,
            diff
          )
        : undefined;

    const remediationDirective =
      blockingCriteria.length > 0
        ? this.deriveRemediationDirective(
            { allowedToProceed, gateId, criteriaResults: clonedCriteria, summary, blockingCriteria, advisoryCriteria, fingerprint },
            context.attempt,
            context.maxAttempts,
            context.history,
            diff
          )
        : undefined;

    return {
      allowedToProceed,
      gateId,
      criteriaResults: clonedCriteria,
      summary,
      blockingCriteria,
      advisoryCriteria,
      autonomousFeedback,
      remediationDirective,
      fingerprint,
      evaluatedAt: Date.now(),
      evaluationDurationMs: Number((performance.now() - evalStartedAt).toFixed(3)),
      passRate,
      score: scorePercentage,
      maxScore,
      diffFromPreviousAttempt: diff,
    };
  }

  computeAttemptDiff(
    currentCriteria: GateCriteria[],
    currentScore: number,
    history?: Array<{ attempt: number; gateResult: CompletionGateResult; feedbackSent?: string }>
  ): AttemptDiff | undefined {
    if (!history || history.length === 0) return undefined;
    const previous = history[history.length - 1]?.gateResult;
    if (!previous) return undefined;

    const prevPassed = new Set(
      previous.criteriaResults.filter((c) => c.evaluated && c.passed).map((c) => c.id)
    );
    const prevFailed = new Set(
      previous.criteriaResults.filter((c) => !c.evaluated || !c.passed).map((c) => c.id)
    );

    const currentPassed = new Set(currentCriteria.filter((c) => c.evaluated && c.passed).map((c) => c.id));
    const currentFailed = new Set(currentCriteria.filter((c) => !c.evaluated || !c.passed).map((c) => c.id));

    const newlyPassing = Array.from(currentPassed).filter((id) => prevFailed.has(id));
    const newlyFailing = Array.from(currentFailed).filter((id) => prevPassed.has(id));
    const stagnantFailing = Array.from(currentFailed).filter((id) => prevFailed.has(id));

    const prevScore = previous.score ?? 0;
    const scoreDelta = Number((currentScore - prevScore).toFixed(2));
    const isDivergent = scoreDelta <= -20 || newlyFailing.length >= 2;

    return {
      newlyPassing,
      newlyFailing,
      stagnantFailing,
      improvedScore: scoreDelta > 0,
      scoreDelta,
      isDivergent,
    };
  }

  deriveRemediationDirective(
    result: CompletionGateResult,
    attempt: number,
    maxAttempts: number,
    history?: Array<{ attempt: number; gateResult: CompletionGateResult; feedbackSent?: string }>,
    diff?: AttemptDiff
  ): RemediationDirective {
    const blocking = result.blockingCriteria ?? [];
    const repeatedFailures = this.detectRepeatedFailures(blocking, history);
    const isStagnant = Boolean(result.fingerprint?.isZeroDeltaStagnant);

    let strategy: RemediationStrategyType = "PATCH_LOCAL";
    if (diff?.isDivergent) {
      strategy = "RESTORE_CHECKPOINT";
    } else if (isStagnant) {
      strategy = attempt >= 3 ? "SIMPLIFY_SCOPE" : "PIVOT_APPROACH";
    } else if (repeatedFailures.length > 0 || (diff && diff.stagnantFailing.length >= 2)) {
      strategy = attempt >= 3 ? "PIVOT_APPROACH" : "REWRITE_MODULE";
    } else if (blocking.some((c) => c.category === "safety" || c.severity === "critical")) {
      strategy = "REWRITE_MODULE";
    } else if (blocking.some((c) => c.category === "admission" || c.id.includes("context"))) {
      strategy = "EXPAND_CONTEXT";
    }

    const rootCauses = blocking
      .map((c) => `${c.id} (${c.category ?? "quality"}/${c.severity ?? "high"}): ${c.detail ?? c.description}`)
      .join("; ");

    const actionSteps: string[] = [];
    if (diff?.isDivergent) {
      actionSteps.push(
        `UNWIND REGRESSION: Attempt ${attempt} caused divergence (Score delta: ${diff.scoreDelta}%). Revert breaking edits before retrying.`
      );
    }
    if (isStagnant) {
      actionSteps.push("BREAK STAGNATION: Attempt produced zero delta; discard previous edit pattern completely.");
    }
    if (diff?.newlyFailing.length && !diff.isDivergent) {
      actionSteps.push(`Revert regressions introduced in attempt ${attempt - 1}: [${diff.newlyFailing.join(", ")}].`);
    }
    for (const c of blocking) {
      actionSteps.push(`Remediate criterion '${c.id}': ${c.description}${c.detail ? ` (${c.detail})` : ""}.`);
    }

    const promptPayload = [
      `[AUTONOMOUS_REMEDIATION_DIRECTIVE: Strategy = ${strategy}]`,
      isStagnant ? `[ZERO_DELTA_STAGNATION_DETECTED: Previous attempt produced identical state hash]` : "",
      `Root Cause: ${rootCauses}`,
      `Action Steps:`,
      ...actionSteps.filter(Boolean).map((s, i) => `  ${i + 1}. ${s}`),
      `Execute these steps autonomously to satisfy quality gates on attempt ${attempt + 1}/${maxAttempts}.`,
    ]
      .filter(Boolean)
      .join("\n");

    return {
      strategy,
      rootCause: rootCauses,
      priorityCriteria: blocking.map((c) => c.id),
      actionSteps,
      promptPayload,
      isStagnantEscalation: isStagnant,
    };
  }

  deriveAutonomousFeedback(
    result: CompletionGateResult,
    attempt: number,
    maxAttempts: number,
    history?: Array<{ attempt: number; gateResult: CompletionGateResult; feedbackSent?: string }>,
    diff?: AttemptDiff
  ): string {
    const blocking = result.blockingCriteria ?? [];
    if (blocking.length === 0) return "";

    const repeatedFailures = this.detectRepeatedFailures(blocking, history);
    const isStagnant = Boolean(result.fingerprint?.isZeroDeltaStagnant);

    const blockingDescriptions = blocking
      .map((c) => {
        const status = !c.evaluated ? "UNEVALUATED" : "FAILED";
        const severity = c.severity ? `[${c.severity.toUpperCase()}] ` : "";
        const category = c.category ? `[${c.category.toUpperCase()}] ` : "";
        const reason = c.detail ? ` -> Reason: ${c.detail}` : "";
        return `• ${severity}${category}[${status}] ${c.id}: ${c.description}${reason}`;
      })
      .join("\n");

    const feedbackLines = [
      `[AUTONOMOUS_GATE_REPAIR: Attempt ${attempt}/${maxAttempts}]`,
      `Quality completion gate '${result.gateId}' blocked turn progression.`,
      `Blocking required criteria:`,
      blockingDescriptions,
    ];

    if (isStagnant) {
      feedbackLines.push(
        `\n[ZERO_DELTA_STAGNATION_TRAP]: Attempt ${attempt} generated an identical state fingerprint to the previous attempt without resolving blocking criteria.`,
        `Mandatory Action: Do NOT repeat the previous candidate response or tool mutations. Pivot strategy immediately.`
      );
    }

    if (diff && (diff.newlyPassing.length > 0 || diff.newlyFailing.length > 0)) {
      feedbackLines.push(`\n[ATTEMPT_DELTA_ANALYSIS]:`);
      if (diff.newlyPassing.length > 0) {
        feedbackLines.push(`  ✓ Progress: Newly satisfied criteria: ${diff.newlyPassing.join(", ")}`);
      }
      if (diff.newlyFailing.length > 0) {
        feedbackLines.push(`  ⚠ Regression: Criteria that broke in this attempt: ${diff.newlyFailing.join(", ")}`);
      }
    }

    if (repeatedFailures.length > 0) {
      feedbackLines.push(
        `\n[ANTI_OSCILLATION_GUARD]: Criteria '${repeatedFailures.join(", ")}' have failed consecutively across attempts.`,
        `Recommendation: Switch repair approach to fundamental structural remediation rather than localized patching.`
      );
    }

    feedbackLines.push(
      `\nAction required: Automatically remediate the failing criteria in this next attempt without requesting manual user feedback.`
    );

    return feedbackLines.join("\n");
  }

  private detectRepeatedFailures(
    currentBlocking: GateCriteria[],
    history?: Array<{ attempt: number; gateResult: CompletionGateResult; feedbackSent?: string }>
  ): string[] {
    if (!history || history.length === 0) return [];
    const currentBlockingIds = new Set(currentBlocking.map((c) => c.id));
    const previousFailures = history.flatMap((h) => (h.gateResult.blockingCriteria ?? []).map((c) => c.id));
    const repeated = new Set<string>();

    for (const id of currentBlockingIds) {
      if (previousFailures.filter((pId) => pId === id).length >= 1) {
        repeated.add(id);
      }
    }
    return Array.from(repeated);
  }

  async evaluateAttemptCandidates<T = unknown>(
    gateId: string,
    candidates: Array<{ candidateValue?: T; response?: string; toolResults?: Array<{ name: string; output?: unknown; error?: string }> }>,
    baseContextOptions: Partial<AttemptGateEvaluationContext> = {}
  ): Promise<CandidateArbitrationResult<T>> {
    if (candidates.length === 0) {
      throw new Error(`Cannot arbitrate candidates: Zero candidates provided for gate '${gateId}'`);
    }

    const branchEvaluations: CandidateBranchEvaluation<T>[] = [];

    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      const context: AttemptGateEvaluationContext = {
        gateId,
        attempt: 1,
        maxAttempts: 1,
        prompt: baseContextOptions.prompt ?? "Candidate evaluation",
        responseCandidate: candidate.response,
        toolResults: candidate.toolResults,
        metadata: baseContextOptions.metadata,
      };

      const gateRes = await this.evaluateAttemptGate(gateId, context);
      const criticalCount = (gateRes.blockingCriteria ?? []).filter((c) => c.severity === "critical").length;

      branchEvaluations.push({
        candidateIndex: i,
        candidateValue: candidate.candidateValue,
        responseCandidate: candidate.response,
        gateResult: gateRes,
        score: gateRes.score ?? 0,
        criticalViolations: criticalCount,
        rank: 0,
      });
    }

    // Sort: allowedToProceed (true first) -> criticalViolations (ascending) -> score (descending)
    branchEvaluations.sort((a, b) => {
      if (a.gateResult.allowedToProceed !== b.gateResult.allowedToProceed) {
        return a.gateResult.allowedToProceed ? -1 : 1;
      }
      if (a.criticalViolations !== b.criticalViolations) {
        return a.criticalViolations - b.criticalViolations;
      }
      return b.score - a.score;
    });

    branchEvaluations.forEach((evalItem, idx) => {
      evalItem.rank = idx + 1;
    });

    const winner = branchEvaluations[0];
    const selectionReason = winner.gateResult.allowedToProceed
      ? `Candidate #${winner.candidateIndex + 1} selected with score ${winner.score}% and zero blocking criteria.`
      : `Candidate #${winner.candidateIndex + 1} selected as best-effort with score ${winner.score}% (${winner.criticalViolations} critical violations).`;

    return {
      winningCandidateIndex: winner.candidateIndex,
      winningCandidate: winner.candidateValue,
      winningGateResult: winner.gateResult,
      candidatesEvaluated: candidates.length,
      rankedEvaluations: branchEvaluations,
      selectionReason,
    };
  }

  async executeAutonomousAttemptLoop<T>(
    gateId: string,
    attemptExecutor: (
      attempt: number,
      feedback?: string,
      directive?: RemediationDirective
    ) => Promise<{
      response?: string;
      toolResults?: Array<{ name: string; output?: unknown; error?: string }>;
      error?: string;
      value?: T;
    }>,
    options: AttemptGateStrategyConfig = {}
  ): Promise<AutonomousAttemptExecutionResult<T>> {
    const loopStartedAt = performance.now();
    const maxAttempts = Math.max(1, options.maxAttempts ?? 3);
    const flightRecorder = new AttemptFlightRecorder(gateId);
    const attemptHistory: Array<{
      attempt: number;
      gateResult: CompletionGateResult;
      feedbackSent?: string;
      durationMs?: number;
      remediationDirective?: RemediationDirective;
      fingerprint?: AttemptFingerprint;
    }> = [];

    let currentFeedback: string | undefined;
    let currentDirective: RemediationDirective | undefined;
    let finalResult: T | undefined;
    let lastGateResult: CompletionGateResult | undefined;
    let oscillationDetected = false;
    let zeroDeltaStagnant = false;
    let circuitBreakerTripped = false;
    let activeRemediationStrategy: RemediationStrategyType = "PATCH_LOCAL";

    // Check circuit breaker
    if (options.circuitBreaker?.enabled !== false && this.isCircuitBreakerOpen(gateId)) {
      const summary = `Gate '${gateId}' execution blocked by open circuit breaker.`;
      flightRecorder.recordEvent("circuit_breaker_tripped", 0, summary);
      flightRecorder.setCompletion(false);
      return {
        success: false,
        attempts: 0,
        gateResult: {
          allowedToProceed: false,
          gateId,
          criteriaResults: [],
          summary,
        },
        attemptHistory: [],
        summary,
        totalDurationMs: 0,
        circuitBreakerTripped: true,
        flightLog: flightRecorder.exportFlightLog(),
      };
    }

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const attemptStart = performance.now();
      flightRecorder.recordEvent("attempt_started", attempt, `Attempt ${attempt}/${maxAttempts} started`);

      let executionOutput: {
        response?: string;
        toolResults?: Array<{ name: string; output?: unknown; error?: string }>;
        error?: string;
        value?: T;
      };

      try {
        executionOutput = await attemptExecutor(attempt, currentFeedback, currentDirective);
      } catch (err) {
        executionOutput = {
          error: err instanceof Error ? err.message : String(err),
        };
      }

      finalResult = executionOutput.value;

      const evalContext: AttemptGateEvaluationContext = {
        gateId,
        attempt,
        maxAttempts,
        prompt: `Autonomous execution for gate ${gateId}`,
        responseCandidate: executionOutput.response,
        toolResults: executionOutput.toolResults,
        errorMessage: executionOutput.error,
        history: [...attemptHistory],
      };

      flightRecorder.recordEvent("evaluator_invoked", attempt, `Evaluating gate criteria for attempt ${attempt}`);

      const gateResult = await this.evaluateAttemptGate(
        gateId,
        evalContext,
        options.aggregationPolicy ?? "all_required",
        options.minScoreToPass ?? 100.0
      );

      lastGateResult = gateResult;
      options.onAttemptEvaluated?.(attempt, gateResult);

      const attemptDuration = Number((performance.now() - attemptStart).toFixed(3));
      flightRecorder.recordEvent(
        "evaluator_completed",
        attempt,
        `Evaluation finished in ${attemptDuration}ms. Pass: ${gateResult.allowedToProceed}, Score: ${gateResult.score}%`
      );

      if (gateResult.fingerprint?.isZeroDeltaStagnant) {
        zeroDeltaStagnant = true;
        flightRecorder.recordEvent(
          "stagnation_trapped",
          attempt,
          `Zero-delta stagnation trap detected (Hash: ${gateResult.fingerprint.combinedHash})`
        );
        options.onStagnationDetected?.(attempt, gateResult.fingerprint);
      }

      currentDirective = gateResult.remediationDirective;
      if (currentDirective) {
        if (currentDirective.strategy !== activeRemediationStrategy) {
          flightRecorder.recordEvent(
            "directive_escalated",
            attempt,
            `Remediation strategy escalated from ${activeRemediationStrategy} to ${currentDirective.strategy}`
          );
          options.onStrategyEscalated?.(attempt, activeRemediationStrategy, currentDirective.strategy);
          activeRemediationStrategy = currentDirective.strategy;
        }
      }

      attemptHistory.push({
        attempt,
        gateResult,
        feedbackSent: currentFeedback,
        durationMs: attemptDuration,
        remediationDirective: currentDirective,
        fingerprint: gateResult.fingerprint,
      });

      if (gateResult.allowedToProceed) {
        this.resetCircuitBreaker(gateId);
        flightRecorder.recordEvent("gate_completed", attempt, `Gate passed on attempt ${attempt}`);
        flightRecorder.setStrategyProgression("PATCH_LOCAL", activeRemediationStrategy);
        flightRecorder.setCompletion(true);
        return {
          success: true,
          attempts: attempt,
          finalResult,
          gateResult,
          attemptHistory,
          summary: `Gate '${gateId}' passed autonomously on attempt ${attempt}/${maxAttempts}.`,
          totalDurationMs: Number((performance.now() - loopStartedAt).toFixed(3)),
          oscillationDetected,
          circuitBreakerTripped: false,
          zeroDeltaStagnant,
          activeRemediationStrategy,
          flightLog: flightRecorder.exportFlightLog(),
        };
      }

      // Record failure on circuit breaker for this attempt
      this.recordCircuitBreakerTrip(gateId, options.circuitBreaker);

      // Check for oscillation
      if (options.detectOscillation !== false && attempt > 1) {
        const repeated = this.detectRepeatedFailures(gateResult.blockingCriteria ?? [], attemptHistory.slice(0, -1));
        if (repeated.length >= (options.oscillationThreshold ?? 1)) {
          oscillationDetected = true;
          flightRecorder.recordEvent(
            "oscillation_guarded",
            attempt,
            `Repeated criteria failure detected: ${repeated.join(", ")}`
          );
          options.onOscillationDetected?.(attempt, repeated);
        }
      }

      // If more attempts remain, apply backoff delay if configured and synthesize feedback
      if (attempt < maxAttempts) {
        const backoffMs = this.calculateBackoff(attempt, options);
        if (backoffMs > 0) {
          options.onAttemptRetry?.(attempt, backoffMs, gateResult.summary);
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
        }

        currentFeedback = options.customFeedbackGenerator
          ? options.customFeedbackGenerator(gateResult, attempt, maxAttempts)
          : gateResult.autonomousFeedback ??
            this.deriveAutonomousFeedback(
              gateResult,
              attempt,
              maxAttempts,
              attemptHistory,
              gateResult.diffFromPreviousAttempt
            );
        flightRecorder.recordEvent("feedback_synthesized", attempt, `Synthesized corrective feedback for attempt ${attempt + 1}`);
      }
    }

    const finalSummary = lastGateResult
      ? `Gate '${gateId}' failed after ${maxAttempts} autonomous attempts: ${lastGateResult.summary}`
      : `Gate '${gateId}' failed without evaluation.`;

    flightRecorder.recordEvent("gate_completed", maxAttempts, finalSummary);
    flightRecorder.setStrategyProgression("PATCH_LOCAL", activeRemediationStrategy);
    flightRecorder.setCompletion(false);

    return {
      success: false,
      attempts: maxAttempts,
      finalResult,
      gateResult: lastGateResult ?? {
        allowedToProceed: false,
        gateId,
        criteriaResults: [],
        summary: finalSummary,
      },
      attemptHistory,
      summary: finalSummary,
      totalDurationMs: Number((performance.now() - loopStartedAt).toFixed(3)),
      oscillationDetected,
      circuitBreakerTripped,
      zeroDeltaStagnant,
      activeRemediationStrategy,
      flightLog: flightRecorder.exportFlightLog(),
    };
  }

  getCircuitBreakerStatus(gateId: string): CircuitBreakerStatus {
    const state = this.circuitBreakerStateMap.get(gateId);
    if (!state) return "CLOSED";
    if (state.status === "OPEN" && Date.now() >= state.trippedUntil) {
      return "HALF_OPEN";
    }
    return state.status;
  }

  private isCircuitBreakerOpen(gateId: string): boolean {
    const state = this.circuitBreakerStateMap.get(gateId);
    if (!state) return false;
    if (state.status === "OPEN") {
      if (Date.now() < state.trippedUntil) {
        return true;
      }
      // Cooldown expired -> transition to HALF_OPEN to allow canary probe
      state.status = "HALF_OPEN";
      state.probeInFlight = true;
      return false;
    }
    if (state.status === "HALF_OPEN") {
      if (state.probeInFlight) {
        // A canary probe is already in flight; block concurrent attempts
        return true;
      }
      state.probeInFlight = true;
      return false;
    }
    return false;
  }

  private recordCircuitBreakerTrip(gateId: string, config?: CircuitBreakerConfig): void {
    const maxFailures = config?.maxConsecutiveFailures ?? 5;
    const cooldown = config?.cooldownMs ?? 10000;
    const current = this.circuitBreakerStateMap.get(gateId) ?? {
      status: "CLOSED",
      consecutiveFailures: 0,
      trippedUntil: 0,
    };

    if (current.status === "HALF_OPEN") {
      // Canary probe failed -> immediately trip to OPEN with full cooldown
      current.status = "OPEN";
      current.probeInFlight = false;
      current.trippedUntil = Date.now() + cooldown;
    } else {
      current.consecutiveFailures++;
      if (current.consecutiveFailures >= maxFailures) {
        current.status = "OPEN";
        current.trippedUntil = Date.now() + cooldown;
      }
    }
    this.circuitBreakerStateMap.set(gateId, current);
  }

  resetCircuitBreaker(gateId: string): void {
    this.circuitBreakerStateMap.delete(gateId);
  }

  private calculateBackoff(attempt: number, options: AttemptGateStrategyConfig): number {
    const strategy = options.backoffStrategy ?? "none";
    if (strategy === "none") return 0;

    const initial = options.initialBackoffMs ?? 100;
    const max = options.maxBackoffMs ?? 2000;

    switch (strategy) {
      case "linear":
        return Math.min(initial * attempt, max);
      case "exponential":
        return Math.min(initial * Math.pow(2, attempt - 1), max);
      case "jittered": {
        const base = Math.min(initial * Math.pow(2, attempt - 1), max);
        return Math.floor(base * (0.5 + Math.random() * 0.5));
      }
      default:
        return 0;
    }
  }
}

/**
 * Standard industry-standard factory templates for common attempt completion gate strategies.
 */
export class AttemptCompletionGateStrategy {
  static createResponseVerificationGate(gateId = "response-verification-gate"): DynamicGateCriteria[] {
    return [
      {
        id: "non_empty_content",
        description: "Response candidate must contain non-empty, meaningful content",
        required: true,
        evaluated: false,
        passed: false,
        severity: "critical",
        category: "correctness",
        phase: "completion",
        weight: 3.0,
        evaluator: (ctx) => {
          const content = ctx.responseCandidate?.trim() ?? "";
          if (content.length === 0) {
            return { passed: false, detail: "Response content is empty or whitespace" };
          }
          return { passed: true, detail: `Received ${content.length} characters` };
        },
      },
      {
        id: "no_unhandled_errors",
        description: "Execution context must not contain unhandled runtime or tool exceptions",
        required: true,
        evaluated: false,
        passed: false,
        severity: "critical",
        category: "safety",
        phase: "completion",
        weight: 3.0,
        evaluator: (ctx) => {
          if (ctx.errorMessage) {
            return { passed: false, detail: ctx.errorMessage };
          }
          const failedTool = ctx.toolResults?.find((t) => t.error);
          if (failedTool) {
            return { passed: false, detail: `Tool '${failedTool.name}' failed: ${failedTool.error}` };
          }
          return { passed: true, detail: "Zero unhandled errors detected" };
        },
      },
    ];
  }

  static createAutonomousRepairGate(gateId = "code-repair-gate"): DynamicGateCriteria[] {
    return [
      {
        id: "repair_mutation_applied",
        description: "Code repair mutation must be staged or written",
        required: true,
        evaluated: false,
        passed: false,
        severity: "high",
        category: "integrity",
        phase: "completion",
        weight: 2.5,
        evaluator: (ctx) => {
          const wrote = ctx.toolResults?.some(
            (t) => t.name === "write_file" || t.name === "edit_file_anchored" || t.name === "repair_executor"
          );
          if (!wrote) {
            return { passed: false, detail: "No repair mutation tool was recorded in this attempt" };
          }
          return { passed: true, detail: "Repair mutation verified" };
        },
      },
      {
        id: "diagnostics_clean",
        description: "Diagnostics and syntax validation must pass without fatal errors",
        required: true,
        evaluated: false,
        passed: false,
        severity: "high",
        category: "correctness",
        phase: "completion",
        weight: 2.5,
        evaluator: (ctx) => {
          if (ctx.errorMessage?.toLowerCase().includes("syntaxerror")) {
            return { passed: false, detail: ctx.errorMessage };
          }
          return { passed: true, detail: "Diagnostics clean" };
        },
      },
    ];
  }

  static createTriadAuditGate(gateId = "triad-audit-gate"): DynamicGateCriteria[] {
    return [
      {
        id: "architect_review",
        description: "Architectural design and boundary alignment documented",
        required: true,
        evaluated: false,
        passed: false,
        severity: "medium",
        category: "governance",
        phase: "postmortem",
        weight: 1.0,
        evaluator: (ctx) => {
          const content = ctx.responseCandidate ?? "";
          const passed = content.includes("Architect") || Boolean(ctx.metadata?.hasArchitect);
          return { passed, detail: passed ? "Architect audit present" : "Missing Architect evaluation" };
        },
      },
      {
        id: "critic_review",
        description: "Critic edge cases and failure mode analysis documented",
        required: true,
        evaluated: false,
        passed: false,
        severity: "medium",
        category: "governance",
        phase: "postmortem",
        weight: 1.0,
        evaluator: (ctx) => {
          const content = ctx.responseCandidate ?? "";
          const passed = content.includes("Critic") || Boolean(ctx.metadata?.hasCritic);
          return { passed, detail: passed ? "Critic audit present" : "Missing Critic evaluation" };
        },
      },
      {
        id: "sre_review",
        description: "SRE operational resilience and rollback readiness documented",
        required: true,
        evaluated: false,
        passed: false,
        severity: "medium",
        category: "governance",
        phase: "postmortem",
        weight: 1.0,
        evaluator: (ctx) => {
          const content = ctx.responseCandidate ?? "";
          const passed = content.includes("SRE") || Boolean(ctx.metadata?.hasSRE);
          return { passed, detail: passed ? "SRE audit present" : "Missing SRE evaluation" };
        },
      },
    ];
  }

  static createBenchmarkWorkloadGate(gateId = "benchmark-workload-gate"): DynamicGateCriteria[] {
    return [
      {
        id: "workload_completed",
        description: "Benchmark workload executed to completion",
        required: true,
        evaluated: false,
        passed: false,
        severity: "critical",
        category: "performance",
        phase: "completion",
        weight: 3.0,
        evaluator: (ctx) => {
          const passed = !ctx.errorMessage && Boolean(ctx.responseCandidate);
          return { passed, detail: passed ? "Workload execution completed" : "Workload incomplete" };
        },
      },
      {
        id: "assertions_satisfied",
        description: "All functional and semantic assertions passed",
        required: true,
        evaluated: false,
        passed: false,
        severity: "critical",
        category: "correctness",
        phase: "completion",
        weight: 3.0,
        evaluator: (ctx) => {
          const passed = Boolean(ctx.metadata?.assertionsPassed !== false) && !ctx.errorMessage;
          return { passed, detail: passed ? "All assertions satisfied" : "Assertions failed" };
        },
      },
    ];
  }

  static createSecurityGuardrailGate(gateId = "security-guardrail-gate"): DynamicGateCriteria[] {
    return [
      {
        id: "command_safety_verified",
        description: "Command execution payload verified against interactive editor blocking rules",
        required: true,
        evaluated: false,
        passed: false,
        severity: "critical",
        category: "safety",
        phase: "admission",
        weight: 3.0,
        evaluator: (ctx) => {
          const blocked = Boolean(ctx.metadata?.isInteractiveBlocked);
          return {
            passed: !blocked,
            detail: blocked ? "Interactive process execution blocked" : "Command safety verified",
          };
        },
      },
      {
        id: "credential_containment_verified",
        description: "Zero credential leaks or secret exposure in stdout/stderr payload",
        required: true,
        evaluated: false,
        passed: false,
        severity: "critical",
        category: "safety",
        phase: "completion",
        weight: 3.0,
        evaluator: (ctx) => {
          const leak = Boolean(ctx.metadata?.credentialLeaked);
          return {
            passed: !leak,
            detail: leak ? "Credential leak detected in output payload" : "Credential containment verified",
          };
        },
      },
    ];
  }

  static createAdmissionGate(gateId = "admission-gate"): DynamicGateCriteria[] {
    return [
      {
        id: "token_budget_admissible",
        description: "Request context fits safely within model input token budget",
        required: true,
        evaluated: false,
        passed: false,
        severity: "critical",
        category: "admission",
        phase: "admission",
        weight: 2.0,
        evaluator: (ctx) => {
          const promptLen = ctx.prompt?.length ?? 0;
          const passed = promptLen < 500000;
          return {
            passed,
            detail: passed ? `Prompt length ${promptLen} chars within budget` : "Prompt exceeds token admission budget",
          };
        },
      },
      {
        id: "tools_registered",
        description: "All requested tools are actively registered in the tool registry",
        required: true,
        evaluated: false,
        passed: false,
        severity: "high",
        category: "admission",
        phase: "admission",
        weight: 2.0,
        evaluator: (ctx) => {
          const unavail = Boolean(ctx.metadata?.hasUnregisteredTools);
          return {
            passed: !unavail,
            detail: unavail ? "Unregistered tool reference encountered" : "Tools registered and validated",
          };
        },
      },
    ];
  }
}



