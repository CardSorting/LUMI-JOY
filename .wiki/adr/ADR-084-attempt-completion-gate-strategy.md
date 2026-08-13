# ADR-084: Attempt Completion Gate Strategy & Autonomous Turn Progression

- **Status**: Accepted
- **Date**: 2026-08-13
- **Scope**: Autonomous multi-attempt turn execution, dynamic quality gate evaluation, structured corrective feedback synthesis, and self-healing loops without manual user feedback

## Context

In complex multi-step coding agent environments, turns often encounter transient provider anomalies, recoverable tool failures, missing output segments, or incomplete file mutations. When an agent loop halts immediately upon encountering such non-terminal issues and prompts the user for manual feedback or next steps, it breaks the flow of autonomy, creating unnecessary friction and cognitive load for the user.

Previously, `RoadmapCompletionGate` validated only static, pre-evaluated boolean criteria lists and lacked dynamic context evaluators, incremental evidence collection, autonomous corrective feedback generation, and multi-attempt retry execution.

## Decision

LUMI adopts a zenith-tier, industry-standard **Attempt Completion Gate Strategy** across the engine, tooling, and test harnesses:

1. **Phased Evaluation Taxonomy & Categorization**:
   Gates support multi-phase lifecycle checkpoints (`admission`, `in_flight`, `completion`, `postmortem`) and severity classifications (`critical`, `high`, `medium`, `low`, `advisory`) across core dimensions (`integrity`, `safety`, `correctness`, `quality`, `performance`, `governance`, `admission`).

2. **Dynamic Gate Criteria with Evaluators**:
   `RoadmapCompletionGate` supports dynamic asynchronous and synchronous criteria evaluators (`DynamicGateCriteria` and `CriterionEvaluatorFn`) capable of inspecting the full attempt execution context (`AttemptGateEvaluationContext`), including prompt text, response candidates, tool call inputs and outputs, execution error messages, and execution metadata.

3. **Fail-Closed Evidence Integrity & Incremental Recording**:
   Gates remain fail-closed: an execution gate is allowed to proceed only when it is registered, has defined required criteria, and all required criteria are explicitly evaluated and passed. Evidence can be recorded incrementally (`recordCriterionEvidence`, `batchRecordEvidence`) or reset across passes (`resetGateEvidence`).

4. **Multi-Attempt Autonomous Execution Loop**:
   `executeAutonomousAttemptLoop` orchestrates automatic attempt iteration up to `maxAttempts`. When attempt $N$ fails quality gates, synthesized feedback and cognitive directives are injected into attempt $N+1$, allowing the agent to self-correct without user intervention.

5. **Differential Attempt Analysis & Regression Detection**:
   `computeAttemptDiff` compares successive attempts to compute exact delta metrics (`newlyPassing`, `newlyFailing`, `stagnantFailing`, `scoreDelta`), identifying whether an attempt made progress or introduced regressions.

6. **Cognitive Remediation Directives & Strategy Escalation**:
   `deriveRemediationDirective` synthesizes structured remediation plans (`RemediationDirective`), dynamically escalating strategies (`PATCH_LOCAL` -> `REWRITE_MODULE` -> `PIVOT_APPROACH` -> `EXPAND_CONTEXT`) based on root causes, repeated failures, and regression history.

7. **Anti-Oscillation Guard & Anti-Flapping**:
   If an agent repeatedly encounters identical criteria failures across attempts, `deriveAutonomousFeedback` automatically flags `[ANTI_OSCILLATION_GUARD]` and instructs the agent to pivot from local patching to fundamental structural remediation.

8. **Circuit Breakers & Adaptive Backoff Policies**:
   - `CircuitBreakerConfig` prevents runaway token burn by tripping after consecutive failures.
   - Configurable retry policies (`none`, `linear`, `exponential`, `jittered`) govern execution backoff with lifecycle hooks (`onAttemptRetry`, `onOscillationDetected`, `onStrategyEscalated`, `onAttemptEvaluated`).

9. **Composable Gate Pipelines**:
   Gates can be dynamically cloned (`cloneGate`) or piped into composite multi-stage pipelines (`pipeGates`), enabling layered verification across admission, compilation, execution, and security stages.

10. **Standard Strategy Factories**:
    `AttemptCompletionGateStrategy` provides turnkey gate definitions:
    - `createAdmissionGate`: validates pre-flight token budgets and registered tool availability.
    - `createResponseVerificationGate`: ensures non-empty content and zero unhandled errors.
    - `createAutonomousRepairGate`: ensures file repair mutation was staged/written and syntax diagnostics are clean.
    - `createTriadAuditGate`: ensures Architect, Critic, and SRE triad perspectives are present with severity & category taxonomy.
    - `createBenchmarkWorkloadGate`: ensures workload completion and assertion satisfaction.
    - `createSecurityGuardrailGate`: ensures command safety verification and credential containment.

11. **Harness & Engine Integration**:
    `AgentLoopHarness` implements `runAutonomousGatedTurn` to verify multi-attempt progression and self-recovery with structured timeline events (`gate_evaluation`, `autonomous_feedback`, `auto_retry`). `AgentEngine` integrates `RoadmapCompletionGate` into live provider dispatch loops for verified turn completion.

## Consequences

- **Autonomous Self-Correction**: Minor errors, tool failures, and incomplete responses are resolved internally in attempt $N+1$ without user intervention.
- **Anti-Flapping & Regression Protection**: Differential analysis prevents regressions and breaks infinite repair loops.
- **Circuit Breaker Safety**: Prevents runaway token consumption during systemic provider or environment failures.
- **Fail-Closed Safety**: Incomplete or failing attempts cannot masquerade as successful completions.
- **Zero Overhead**: Normal successful turns pass gates on attempt 1 in sub-millisecond evaluation time without added latency.
- **Full Traceability**: All attempts, gate evaluation results, per-criterion duration metrics, attempt diffs, and injected feedbacks are retained in attempt history and telemetry events.
