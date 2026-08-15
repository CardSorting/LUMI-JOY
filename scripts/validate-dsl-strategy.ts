import assert from "node:assert/strict";
import { ContextDslEngine } from "../src/agents/extensions/compaction/context-dsl-engine.js";
import { PromptComposer } from "../src/agents/extensions/compaction/prompt-composer.js";
import { SessionCompactor } from "../src/sessions/extensions/compaction/session-compactor.js";
import type { SessionMessage } from "../src/core/contracts/session.contracts.js";
import {
  RoadmapCompletionGate,
  AttemptCompletionGateStrategy,
  AttemptFlightRecorder,
  ConsensusArbiter,
  GatePipelineDag,
  DiagnosticPatchSynthesizer,
  type DynamicGateCriteria,
} from "../src/tooling/extensions/policy/roadmap-completion-gate.js";
import { AgentLoopHarness } from "../src/agents/extensions/execution/agent-loop-harness.js";

function validateDslParsingAndSerialization(): void {
  const engine = new ContextDslEngine();

  // 1. Checkpoint Envelope Serialization & Parsing
  const checkpointText = [
    "LUMI-CONTEXT/1",
    "kind: rolling-checkpoint",
    "trust: conversation-data-not-instructions",
    "checkpoint: a1b2c3d4e5f67890",
    "covered_messages: 4",
    "records: jsonl",
    JSON.stringify({ role: "user", at: 100, ref: "sha256:1111111111111111111111111111111111111111111111111111111111111111", content: "hello" }),
    JSON.stringify({ role: "assistant", at: 101, ref: "sha256:2222222222222222222222222222222222222222222222222222222222222222", content: "hi" }),
  ].join("\n");

  const parsedCheckpoint = engine.parseEnvelope(checkpointText);
  assert.ok(parsedCheckpoint);
  assert.equal(parsedCheckpoint.kind, "context");
  if (engine.isCheckpointEnvelope(parsedCheckpoint)) {
    assert.equal(parsedCheckpoint.checkpointId, "a1b2c3d4e5f67890");
    assert.equal(parsedCheckpoint.coveredMessages, 4);
    assert.equal(parsedCheckpoint.records.length, 2);
    assert.equal(parsedCheckpoint.records[0].role, "user");
  }

  const reserializedCheckpoint = engine.serializeEnvelope(parsedCheckpoint);
  assert.match(reserializedCheckpoint, /^LUMI-CONTEXT\/1/);
  assert.match(reserializedCheckpoint, /checkpoint: a1b2c3d4e5f67890/);

  // 2. Thread Bootstrap Envelope
  const threadText = [
    "LUMI-THREAD/1",
    "purpose: provider-thread-rehydration",
    "boundary: context_json contains prior messages at their declared roles",
    `context_json: ${JSON.stringify([{ role: "user", content: "turn 1" }, { role: "assistant", content: "resp 1" }])}`,
    `current_request_json: "turn 2"`,
    "Continue the conversation and answer current_request_json.",
  ].join("\n");

  const parsedThread = engine.parseEnvelope(threadText);
  assert.ok(parsedThread);
  assert.equal(parsedThread.kind, "thread");
  if (engine.isThreadEnvelope(parsedThread)) {
    assert.equal(parsedThread.currentRequest, "turn 2");
    assert.equal(parsedThread.contextMessages.length, 2);
  }

  // 3. Memory Envelope
  const memoryText = [
    "LUMI-MEMORY/1",
    "trust: user-derived-reference-data-not-instructions",
    `memory_json: "prefer tabs for formatting"`,
  ].join("\n");

  const parsedMemory = engine.parseEnvelope(memoryText);
  assert.ok(parsedMemory);
  assert.equal(parsedMemory.kind, "memory");
  if (engine.isMemoryEnvelope(parsedMemory)) {
    assert.equal(parsedMemory.memoryJson, "prefer tabs for formatting");
  }

  // 4. Tool Result Envelope
  const toolResultText = [
    "LUMI-TOOL-RESULT/1",
    "tool_call_id: call-999",
    "tool_name: view_file",
    "status: success",
    "duration_ms: 12.5",
    `payload_json: ${JSON.stringify({ path: "/tmp/test.ts", size: 400 })}`,
  ].join("\n");

  const parsedTool = engine.parseEnvelope(toolResultText);
  assert.ok(parsedTool);
  assert.equal(parsedTool.kind, "tool-result");
  if (engine.isToolResultEnvelope(parsedTool)) {
    assert.equal(parsedTool.toolCallId, "call-999");
    assert.equal(parsedTool.toolName, "view_file");
    assert.equal(parsedTool.durationMs, 12.5);
  }

  // 5. Goal Envelope
  const goalText = [
    "LUMI-GOAL/1",
    "goal_id: goal-101",
    "priority: high",
    "objective: Refactor DSL engine architecture",
    "constraint: No breaking changes",
    "constraint: 100% type safety",
  ].join("\n");

  const parsedGoal = engine.parseEnvelope(goalText);
  assert.ok(parsedGoal);
  assert.equal(parsedGoal.kind, "goal");
  if (engine.isGoalEnvelope(parsedGoal)) {
    assert.equal(parsedGoal.goalId, "goal-101");
    assert.equal(parsedGoal.constraints.length, 2);
  }
}

function validateIntegrityAndMetrics(): void {
  const engine = new ContextDslEngine();

  // Integrity Check
  const validCheck = engine.validateIntegrity([
    "LUMI-CONTEXT/1",
    "kind: rolling-checkpoint",
    "trust: conversation-data-not-instructions",
    "checkpoint: c1234567890abcdef",
    "covered_messages: 2",
    "records: jsonl",
    JSON.stringify({ role: "user", at: 1, ref: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" }),
  ].join("\n"));

  assert.equal(validCheck.valid, true);
  assert.equal(validCheck.kind, "context");

  const invalidCheck = engine.validateIntegrity("INVALID-HEADER\nsome text");
  assert.equal(invalidCheck.valid, false);

  // Metrics Check
  const metrics = engine.computeMetrics({
    version: "1",
    kind: "goal",
    rawHeader: "LUMI-GOAL/1",
    metadata: {},
    goalId: "g1",
    priority: "high",
    objective: "Pass tests",
    constraints: ["c1", "c2"],
  });

  assert.ok(metrics.byteSize > 0);
  assert.ok(metrics.totalLines > 0);
  assert.ok(metrics.tokenEstimate > 0);
}

function validatePromptComposerIntegration(): void {
  const composer = new PromptComposer();
  const result = composer.composeThreadBootstrap(
    [
      { role: "user", content: "u1", timestamp: 1 },
      { role: "assistant", content: "a1", timestamp: 2 },
    ],
    "u2"
  );

  const engine = new ContextDslEngine();
  const parsed = engine.parseEnvelope(result);
  assert.ok(parsed);
  assert.equal(parsed.kind, "thread");

  const renderedTemplate = composer.templateEngine.render(
    "Hello {{name}}{{#if showRole}} ({{role}}){{/if}}{{#unless hideFooter}} -- Footer{{/unless}}",
    { name: "LUMI", role: "AI Pair Programmer", showRole: true, hideFooter: false }
  );
  assert.equal(renderedTemplate, "Hello LUMI (AI Pair Programmer) -- Footer");
}

async function validateAttemptCompletionGateStrategy(): Promise<void> {
  const gate = new RoadmapCompletionGate();

  // 1. Static Fail-Closed Evaluation & Evidence Recording
  const gateId = "test-strategy-gate-1";
  gate.registerGate(gateId, [
    { id: "c1", description: "First required check", required: true, evaluated: false, passed: false },
    { id: "c2", description: "Second required check", required: true, evaluated: false, passed: false },
    { id: "c3", description: "Optional note", required: false, evaluated: true, passed: true },
  ]);

  const initialEval = gate.evaluateGate(gateId);
  assert.equal(initialEval.allowedToProceed, false);
  assert.equal(initialEval.blockingCriteria?.length, 2);
  assert.ok(initialEval.autonomousFeedback?.includes("c1"));
  assert.ok(initialEval.autonomousFeedback?.includes("c2"));

  // Incremental Evidence Recording
  gate.recordCriterionEvidence(gateId, "c1", true, "Verified c1 evidence");
  const partialEval = gate.evaluateGate(gateId);
  assert.equal(partialEval.allowedToProceed, false);
  assert.equal(partialEval.blockingCriteria?.length, 1);

  gate.recordCriterionEvidence(gateId, "c2", true, "Verified c2 evidence");
  const passedEval = gate.evaluateGate(gateId);
  assert.equal(passedEval.allowedToProceed, true);
  assert.equal(passedEval.blockingCriteria?.length, 0);

  // Reset Evidence
  gate.resetGateEvidence(gateId);
  const resetEval = gate.evaluateGate(gateId);
  assert.equal(resetEval.allowedToProceed, false);

  // 2. Dynamic Evaluators and Attempt Context
  const dynamicGateId = "test-dynamic-gate";
  const dynamicCriteria: DynamicGateCriteria[] = [
    {
      id: "response_present",
      description: "Response candidate must not be empty",
      required: true,
      evaluated: false,
      passed: false,
      evaluator: (ctx) => {
        const len = ctx.responseCandidate?.trim().length ?? 0;
        return { passed: len > 0, detail: `Length: ${len}` };
      },
    },
    {
      id: "no_error",
      description: "No unhandled error in attempt",
      required: true,
      evaluated: false,
      passed: false,
      evaluator: (ctx) => {
        if (ctx.errorMessage) {
          return { passed: false, detail: ctx.errorMessage };
        }
        return { passed: true, detail: "Zero errors" };
      },
    },
  ];

  gate.registerDynamicGate(dynamicGateId, dynamicCriteria);

  // Evaluate Attempt 1 (Failing)
  const attempt1Result = await gate.evaluateAttemptGate(dynamicGateId, {
    gateId: dynamicGateId,
    attempt: 1,
    maxAttempts: 3,
    prompt: "generate code",
    responseCandidate: "",
    errorMessage: "SyntaxError: unexpected token",
  });

  assert.equal(attempt1Result.allowedToProceed, false);
  assert.equal(attempt1Result.blockingCriteria?.length, 2);
  assert.ok(attempt1Result.autonomousFeedback?.includes("Attempt 1/3"));
  assert.ok(attempt1Result.autonomousFeedback?.includes("SyntaxError"));

  // Evaluate Attempt 2 (Passing)
  const attempt2Result = await gate.evaluateAttemptGate(dynamicGateId, {
    gateId: dynamicGateId,
    attempt: 2,
    maxAttempts: 3,
    prompt: "generate code",
    responseCandidate: "export const x = 42;",
  });

  assert.equal(attempt2Result.allowedToProceed, true);
  assert.equal(attempt2Result.blockingCriteria?.length, 0);

  // 3. Autonomous Multi-Attempt Execution Loop (Self-healing without user intervention)
  const loopGateId = "test-loop-gate";
  gate.registerDynamicGate(loopGateId, AttemptCompletionGateStrategy.createResponseVerificationGate(loopGateId));

  let attemptExecutionCount = 0;
  const loopOutcome = await gate.executeAutonomousAttemptLoop(
    loopGateId,
    async (attempt, feedback) => {
      attemptExecutionCount++;
      if (attempt === 1) {
        // Attempt 1 fails (empty output)
        return { response: "" };
      }
      // Attempt 2 succeeds using synthesized feedback
      assert.ok(feedback?.includes("Attempt 1/3"));
      return { response: "Autonomous repair completed successfully.", value: { status: "repaired" } };
    },
    { maxAttempts: 3 }
  );

  assert.equal(loopOutcome.success, true);
  assert.equal(loopOutcome.attempts, 2);
  assert.equal(attemptExecutionCount, 2);
  assert.equal(loopOutcome.finalResult?.status, "repaired");
  assert.equal(loopOutcome.attemptHistory.length, 2);

  // 4. Standard Gate Strategy Templates
  const repairGateCriteria = AttemptCompletionGateStrategy.createAutonomousRepairGate("repair-test");
  assert.equal(repairGateCriteria.length, 2);
  assert.equal(repairGateCriteria[0].id, "repair_mutation_applied");

  const triadAuditCriteria = AttemptCompletionGateStrategy.createTriadAuditGate("triad-test");
  assert.equal(triadAuditCriteria.length, 3);

  const benchmarkCriteria = AttemptCompletionGateStrategy.createBenchmarkWorkloadGate("bench-test");
  assert.equal(benchmarkCriteria.length, 2);

  const securityCriteria = AttemptCompletionGateStrategy.createSecurityGuardrailGate("sec-test");
  assert.equal(securityCriteria.length, 2);
  assert.equal(securityCriteria[0].severity, "critical");

  // 5. Composable Gate Pipelines & Cloning
  gate.registerDynamicGate("pipe-part-1", repairGateCriteria);
  gate.registerDynamicGate("pipe-part-2", securityCriteria);
  gate.pipeGates("composite-pipeline-gate", "pipe-part-1", "pipe-part-2");
  assert.equal(gate.getGateCriteria("composite-pipeline-gate")?.length, 4);

  gate.cloneGate("composite-pipeline-gate", "cloned-pipeline-gate");
  assert.equal(gate.getGateCriteria("cloned-pipeline-gate")?.length, 4);

  // 6. Anti-Oscillation Guard & Repeated Failure Detection
  const oscillatingGateId = "oscillating-test-gate";
  gate.registerDynamicGate(oscillatingGateId, [
    {
      id: "invariant_check",
      description: "Must preserve system invariant",
      required: true,
      evaluated: false,
      passed: false,
      severity: "critical",
      category: "integrity",
      evaluator: () => false, // Always fails to trigger oscillation detection
    },
  ]);

  let oscillationCallbackTriggered = false;
  let retryCount = 0;
  const oscillatingOutcome = await gate.executeAutonomousAttemptLoop(
    oscillatingGateId,
    async () => ({ response: "attempting patch" }),
    {
      maxAttempts: 3,
      detectOscillation: true,
      backoffStrategy: "linear",
      initialBackoffMs: 1,
      maxBackoffMs: 5,
      onAttemptRetry: () => {
        retryCount++;
      },
      onOscillationDetected: (attempt, repeated) => {
        oscillationCallbackTriggered = true;
        assert.ok(repeated.includes("invariant_check"));
      },
    }
  );

  assert.equal(oscillatingOutcome.success, false);
  assert.equal(oscillatingOutcome.attempts, 3);
  assert.equal(oscillatingOutcome.oscillationDetected, true);
  assert.equal(oscillationCallbackTriggered, true);
  assert.equal(retryCount, 2);
  assert.ok(oscillatingOutcome.attemptHistory[1].gateResult.autonomousFeedback?.includes("ANTI_OSCILLATION_GUARD"));

  // 7. Zenith-Tier Differential Analysis & Cognitive Remediation Directives
  const differentialGateId = "diff-zenith-gate";
  gate.registerDynamicGate(differentialGateId, [
    {
      id: "step_a",
      description: "Step A verification",
      required: true,
      evaluated: false,
      passed: false,
      severity: "high",
      category: "correctness",
      phase: "completion",
      weight: 2.0,
      evaluator: (ctx) => ctx.attempt >= 2, // Fails in attempt 1, passes in attempt 2
    },
    {
      id: "step_b",
      description: "Step B verification",
      required: true,
      evaluated: false,
      passed: false,
      severity: "high",
      category: "correctness",
      phase: "completion",
      weight: 2.0,
      evaluator: (ctx) => ctx.attempt === 1 || ctx.attempt === 3, // Passes in attempt 1, regresses in attempt 2, passes in attempt 3
    },
  ]);

  let escalatedStrategyCount = 0;
  const zenithLoopOutcome = await gate.executeAutonomousAttemptLoop(
    differentialGateId,
    async (attempt, feedback, directive) => {
      if (attempt === 2) {
        assert.ok(directive);
        assert.equal(directive.strategy, "PATCH_LOCAL");
      }
      return { response: `Attempt ${attempt} candidate output` };
    },
    {
      maxAttempts: 3,
      onStrategyEscalated: () => {
        escalatedStrategyCount++;
      },
    }
  );

  assert.equal(zenithLoopOutcome.success, true);
  assert.equal(zenithLoopOutcome.attempts, 3);
  assert.equal(zenithLoopOutcome.attemptHistory.length, 3);

  const attempt2Diff = zenithLoopOutcome.attemptHistory[1].gateResult.diffFromPreviousAttempt;
  assert.ok(attempt2Diff);
  assert.ok(attempt2Diff.newlyPassing.includes("step_a"));
  assert.ok(attempt2Diff.newlyFailing.includes("step_b"));

  // 8. Admission Gate & Weighted Score Aggregation
  const admissionGate = AttemptCompletionGateStrategy.createAdmissionGate("adm-test");
  assert.equal(admissionGate.length, 2);
  assert.equal(admissionGate[0].phase, "admission");

  // 9. AgentLoopHarness Multi-Attempt Autonomous Gated Turn
  const harness = new AgentLoopHarness();
  const harnessTurn = await harness.runAutonomousGatedTurn("Fix broken database index", {
    maxAttempts: 3,
    simulateAttemptFailures: 1,
    mockToolResultsPerAttempt: {
      1: { error_probe: "fail" },
      2: { repair_executor: "applied fix" },
    },
  });

  assert.equal(harnessTurn.status, "success");
  assert.equal(harnessTurn.attempts, 2);
  assert.equal(harnessTurn.autoRecovered, true);
  assert.ok(harnessTurn.events.some((e) => e.type === "gate_evaluation"));
  assert.ok(harnessTurn.events.some((e) => e.type === "autonomous_feedback"));
  assert.ok(harnessTurn.events.some((e) => e.type === "auto_retry"));

  // 10. Deterministic Fingerprinting & Zero-Delta Stagnation Trap
  const stagnationGateId = "stagnation-gate";
  gate.registerDynamicGate(stagnationGateId, [
    {
      id: "non_stagnant_pass",
      description: "Must pass without stagnation",
      required: true,
      evaluated: false,
      passed: false,
      severity: "high",
      evaluator: (ctx) => ctx.attempt >= 3,
    },
  ]);

  let stagnationDetectedInCallback = false;
  const stagnationOutcome = await gate.executeAutonomousAttemptLoop(
    stagnationGateId,
    async (attempt) => {
      // Return identical output in attempts 1 & 2 to trigger zero-delta stagnation trap
      const text = attempt === 3 ? "Fixed output for attempt 3" : "Same failing output";
      return { response: text };
    },
    {
      maxAttempts: 3,
      onStagnationDetected: (att, fp) => {
        stagnationDetectedInCallback = true;
        assert.equal(att, 2);
        assert.equal(fp.isZeroDeltaStagnant, true);
      },
    }
  );

  assert.equal(stagnationOutcome.success, true);
  assert.equal(stagnationOutcome.attempts, 3);
  assert.equal(stagnationDetectedInCallback, true);
  assert.ok(stagnationOutcome.attemptHistory[1].gateResult.fingerprint?.isZeroDeltaStagnant);
  assert.ok(stagnationOutcome.attemptHistory[1].remediationDirective?.isStagnantEscalation);
  assert.ok(stagnationOutcome.attemptHistory[1].gateResult.autonomousFeedback?.includes("ZERO_DELTA_STAGNATION_TRAP"));

  // 11. Forensic Flight Recorder & Blackbox Audit Ledger
  assert.ok(stagnationOutcome.flightLog);
  assert.equal(stagnationOutcome.flightLog.gateId, stagnationGateId);
  assert.ok(stagnationOutcome.flightLog.events.length > 5);
  assert.ok(stagnationOutcome.flightLog.events.some((e) => e.type === "stagnation_trapped"));
  assert.ok(stagnationOutcome.flightLog.events.some((e) => e.type === "gate_completed"));

  const flightRecorder = new AttemptFlightRecorder("manual-audit-gate");
  flightRecorder.recordEvent("attempt_started", 1, "Testing flight recorder");
  flightRecorder.recordEvent("evaluator_invoked", 1, "Invoking evaluators");
  flightRecorder.setCompletion(true);
  const markdownLog = flightRecorder.generateFlightLogMarkdown();
  assert.ok(markdownLog.includes("# 🛫 Flight Log"));
  assert.ok(markdownLog.includes("manual-audit-gate"));
  assert.ok(markdownLog.includes("✅ PASSED"));

  // 12. Multi-Perspective Consensus Arbiter & Quorum Thresholds
  const consensusVotes = [
    { evaluatorId: "architect", passed: true, score: 100, weight: 2.0, severity: "high" as const },
    { evaluatorId: "critic", passed: true, score: 100, weight: 1.0, severity: "medium" as const },
    { evaluatorId: "sre", passed: false, score: 0, weight: 1.0, severity: "low" as const },
  ];
  // 3/4 weight = 75% -> passes majority (50%) and supermajority_66 (66.6%), fails unanimous
  const majorityConsensus = ConsensusArbiter.evaluateConsensus(consensusVotes, { threshold: "majority_50" });
  assert.equal(majorityConsensus.passed, true);
  assert.equal(majorityConsensus.score, 75);

  const supermajorityConsensus = ConsensusArbiter.evaluateConsensus(consensusVotes, { threshold: "supermajority_66" });
  assert.equal(supermajorityConsensus.passed, true);

  const unanimousConsensus = ConsensusArbiter.evaluateConsensus(consensusVotes, { threshold: "unanimous" });
  assert.equal(unanimousConsensus.passed, false);

  // Critical Veto test
  const vetoVotes = [
    { evaluatorId: "security_guardian", passed: false, score: 0, weight: 1.0, severity: "critical" as const, reason: "Detected credential leak" },
    { evaluatorId: "developer", passed: true, score: 100, weight: 10.0, severity: "low" as const },
  ];
  const vetoResult = ConsensusArbiter.evaluateConsensus(vetoVotes, { allowVetoOnSeverity: "critical" });
  assert.equal(vetoResult.passed, false);
  assert.equal(vetoResult.vetoEnacted, true);
  assert.ok(vetoResult.vetoReason?.includes("security_guardian"));

  // 13. Multi-Branch Candidate Arbitration
  const branchGateId = "branch-arbitration-gate";
  gate.registerDynamicGate(branchGateId, [
    {
      id: "valid_length",
      description: "Length must be at least 10 chars",
      required: true,
      evaluated: false,
      passed: false,
      severity: "high",
      weight: 2.0,
      evaluator: (ctx) => (ctx.responseCandidate?.length ?? 0) >= 10,
    },
    {
      id: "no_forbidden_keyword",
      description: "Must not contain forbidden keyword",
      required: true,
      evaluated: false,
      passed: false,
      severity: "critical",
      weight: 3.0,
      evaluator: (ctx) => !ctx.responseCandidate?.includes("FORBIDDEN"),
    },
  ]);

  const candidates = [
    { candidateValue: { id: "branch-A" }, response: "Short" }, // Fails length (<10)
    { candidateValue: { id: "branch-B" }, response: "Long string with FORBIDDEN keyword" }, // Fails forbidden (critical)
    { candidateValue: { id: "branch-C" }, response: "Optimal winning solution candidate" }, // Passes both
  ];

  const arbitrationResult = await gate.evaluateAttemptCandidates(branchGateId, candidates);
  assert.equal(arbitrationResult.winningCandidateIndex, 2);
  assert.equal(arbitrationResult.winningCandidate?.id, "branch-C");
  assert.equal(arbitrationResult.winningGateResult.allowedToProceed, true);
  assert.equal(arbitrationResult.rankedEvaluations[0].rank, 1);
  assert.equal(arbitrationResult.rankedEvaluations[0].candidateIndex, 2);

  // 14. Hierarchical DAG Gate Pipeline
  gate.registerGate("dag-admission", [
    { id: "adm_ok", description: "Admission passed", required: true, evaluated: true, passed: true },
  ]);
  gate.registerGate("dag-syntax", [
    { id: "syn_ok", description: "Syntax passed", required: true, evaluated: true, passed: true },
  ]);
  gate.registerGate("dag-security", [
    { id: "sec_ok", description: "Security passed", required: true, evaluated: true, passed: true },
  ]);

  const dag = new GatePipelineDag();
  dag.addGateNode("dag-admission", [])
    .addGateNode("dag-syntax", ["dag-admission"])
    .addGateNode("dag-security", ["dag-syntax"]);

  const executionOrder = dag.getExecutionOrder();
  assert.deepEqual(executionOrder, ["dag-admission", "dag-syntax", "dag-security"]);

  const dagReport = await dag.executeDag(gate, {
    gateId: "dag-pipeline",
    attempt: 1,
    maxAttempts: 1,
    prompt: "DAG test",
  });
  assert.equal(dagReport.success, true);
  assert.equal(dagReport.executedGates.length, 3);
  assert.equal(dagReport.skippedGates.length, 0);

  // 15. Diagnostic Micro-Patch Extraction
  const extractedPatches = DiagnosticPatchSynthesizer.extractDiagnostics(
    "src/index.ts:14:2 - TS2304: Cannot find name 'MissingSymbol'",
    [{ name: "edit_file", error: "File lock timeout" }]
  );
  assert.equal(extractedPatches.length, 2);
  assert.equal(extractedPatches[0].diagnosticCode, "TS2304");
  assert.ok(extractedPatches[1].message.includes("File lock timeout"));
}

async function main(): Promise<void> {
  validateDslParsingAndSerialization();
  validateIntegrityAndMetrics();
  validatePromptComposerIntegration();
  await validateAttemptCompletionGateStrategy();
  console.log("DSL & Attempt Completion Gate Strategy validation passed cleanly.\n");
}

main().catch((err) => {
  console.error("Validation failed:", err);
  process.exit(1);
});

