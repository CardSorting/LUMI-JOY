import assert from "node:assert/strict";
import { ContextDslEngine } from "../src/agents/extensions/compaction/context-dsl-engine.js";
import { PromptComposer } from "../src/agents/extensions/compaction/prompt-composer.js";
import { SessionCompactor } from "../src/sessions/extensions/compaction/session-compactor.js";
import type { SessionMessage } from "../src/core/contracts/session.contracts.js";
import {
  RoadmapCompletionGate,
  AttemptCompletionGateStrategy,
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

