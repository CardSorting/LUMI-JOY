import { BroccoliRepairMutationExecutor } from "./broccolidb-repair-executor.js";
import {
  RoadmapCompletionGate,
  AttemptCompletionGateStrategy,
  type DynamicGateCriteria,
  type CompletionGateResult,
} from "../../../tooling/extensions/policy/roadmap-completion-gate.js";

export interface HarnessStepEvent {
  stepIndex: number;
  type:
    | "user_input"
    | "model_thought"
    | "tool_call"
    | "tool_result"
    | "gate_evaluation"
    | "autonomous_feedback"
    | "auto_retry"
    | "final_response";
  content: string;
  timestamp: number;
  attempt?: number;
  gateResult?: CompletionGateResult;
}

export interface HarnessExecutionResult {
  status: "success" | "failure";
  totalSteps: number;
  durationMs: number;
  events: readonly HarnessStepEvent[];
  finalOutput: string;
}

export interface AutonomousHarnessOptions {
  maxAttempts?: number;
  gateId?: string;
  mockToolResultsPerAttempt?: Record<number, Record<string, string>>;
  simulateAttemptFailures?: number;
  customCriteria?: DynamicGateCriteria[];
  autoRepairOnFailure?: boolean;
}

/**
 * Pass 86 & Pass 193: Agent Loop Harness
 * Ingests test harness and turn loop control concepts from `packages/agent`.
 * Provides deterministic simulation of agent turns with mock tool invocation traces,
 * integrated with Attempt Completion Gate Strategy for fully autonomous multi-attempt execution.
 */
export class AgentLoopHarness {
  private events: HarnessStepEvent[];
  readonly repairExecutor: BroccoliRepairMutationExecutor;
  readonly completionGate: RoadmapCompletionGate;

  constructor(workspaceRoot: string = process.cwd()) {
    this.events = [];
    this.repairExecutor = new BroccoliRepairMutationExecutor(workspaceRoot);
    this.completionGate = new RoadmapCompletionGate();
  }

  async runHarnessTurn(
    prompt: string,
    mockToolResults: Record<string, string> = {}
  ): Promise<HarnessExecutionResult> {
    const startTime = Date.now();
    this.events = [];

    // Step 1: User input
    this.events.push({
      stepIndex: 1,
      type: "user_input",
      content: prompt,
      timestamp: Date.now(),
    });

    // Step 2: Simulated model thought
    this.events.push({
      stepIndex: 2,
      type: "model_thought",
      content: `Analyzed prompt: "${prompt}"`,
      timestamp: Date.now(),
    });

    // Step 3: Optional mock tool calls & responses
    let stepCounter = 3;
    for (const [toolName, mockOutput] of Object.entries(mockToolResults)) {
      this.events.push({
        stepIndex: stepCounter++,
        type: "tool_call",
        content: `Executing tool '${toolName}'`,
        timestamp: Date.now(),
      });

      this.events.push({
        stepIndex: stepCounter++,
        type: "tool_result",
        content: mockOutput,
        timestamp: Date.now(),
      });
    }

    // Final response step
    const finalOutput = `Harness completed turn for prompt: "${prompt}" with ${Object.keys(mockToolResults).length} tool calls.`;
    this.events.push({
      stepIndex: stepCounter,
      type: "final_response",
      content: finalOutput,
      timestamp: Date.now(),
    });

    return {
      status: "success",
      totalSteps: this.events.length,
      durationMs: Date.now() - startTime,
      events: [...this.events],
      finalOutput,
    };
  }

  async runResilientHarnessTurn(
    prompt: string,
    mockToolResults: Record<string, string> = {},
    simulateBrittleDropCount = 1
  ): Promise<HarnessExecutionResult & { retryAttempts: number; connectionRecovered: boolean }> {
    let attempts = 0;
    let recovered = false;
    while (attempts < simulateBrittleDropCount) {
      attempts++;
      recovered = true;
    }
    const result = await this.runHarnessTurn(prompt, mockToolResults);
    return {
      ...result,
      retryAttempts: attempts,
      connectionRecovered: recovered,
    };
  }

  /**
   * Executes a turn under the Attempt Completion Gate Strategy, autonomously evaluating gate criteria
   * and auto-correcting across multiple attempts without requiring user intervention or feedback.
   */
  async runAutonomousGatedTurn(
    prompt: string,
    options: AutonomousHarnessOptions = {}
  ): Promise<
    HarnessExecutionResult & {
      attempts: number;
      gateResult: CompletionGateResult;
      autoRecovered: boolean;
    }
  > {
    const startTime = Date.now();
    this.events = [];
    const maxAttempts = Math.max(1, options.maxAttempts ?? 3);
    const gateId = options.gateId ?? `harness:turn:${Date.now()}`;
    const simulateFailures = options.simulateAttemptFailures ?? 0;

    const criteria = options.customCriteria ?? AttemptCompletionGateStrategy.createResponseVerificationGate(gateId);
    this.completionGate.registerDynamicGate(gateId, criteria);

    let stepCounter = 1;
    let finalGateResult: CompletionGateResult | undefined;
    let finalOutput = "";
    let autoRecovered = false;
    let succeededAttempt = 0;

    // Step 1: User input
    this.events.push({
      stepIndex: stepCounter++,
      type: "user_input",
      content: prompt,
      timestamp: Date.now(),
    });

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const isSimulatedFailingAttempt = attempt <= simulateFailures;

      // Model Thought for current attempt
      this.events.push({
        stepIndex: stepCounter++,
        type: "model_thought",
        content: `[Attempt ${attempt}/${maxAttempts}] Reasoning approach for prompt: "${prompt}"`,
        timestamp: Date.now(),
        attempt,
      });

      // Tool calls for current attempt
      const attemptToolResults = options.mockToolResultsPerAttempt?.[attempt] ?? {};
      const toolResultsList: Array<{ name: string; output: unknown; error?: string }> = [];

      for (const [toolName, mockOutput] of Object.entries(attemptToolResults)) {
        this.events.push({
          stepIndex: stepCounter++,
          type: "tool_call",
          content: `Executing tool '${toolName}'`,
          timestamp: Date.now(),
          attempt,
        });

        const isToolError = isSimulatedFailingAttempt && toolName.includes("error");
        const output = isToolError ? `Error: Tool execution failed` : mockOutput;

        this.events.push({
          stepIndex: stepCounter++,
          type: "tool_result",
          content: output,
          timestamp: Date.now(),
          attempt,
        });

        toolResultsList.push({
          name: toolName,
          output,
          ...(isToolError ? { error: output } : {}),
        });
      }

      const candidateResponse = isSimulatedFailingAttempt
        ? ""
        : `Autonomous execution completed successfully on attempt ${attempt} for prompt: "${prompt}".`;

      // Evaluate Attempt Completion Gate
      const gateResult = await this.completionGate.evaluateAttemptGate(gateId, {
        gateId,
        attempt,
        maxAttempts,
        prompt,
        responseCandidate: candidateResponse,
        toolResults: toolResultsList,
        errorMessage: isSimulatedFailingAttempt ? "Simulated attempt failure" : undefined,
      });

      finalGateResult = gateResult;

      this.events.push({
        stepIndex: stepCounter++,
        type: "gate_evaluation",
        content: `Gate '${gateId}' evaluation: ${gateResult.allowedToProceed ? "PASS" : "FAIL"} (${gateResult.summary})`,
        timestamp: Date.now(),
        attempt,
        gateResult,
      });

      if (gateResult.allowedToProceed) {
        succeededAttempt = attempt;
        finalOutput = candidateResponse;
        if (attempt > 1) {
          autoRecovered = true;
        }
        break;
      }

      // If failed and attempts remain, synthesize autonomous feedback and auto-retry
      if (attempt < maxAttempts) {
        const feedback = gateResult.autonomousFeedback ?? this.completionGate.deriveAutonomousFeedback(gateResult, attempt, maxAttempts);

        this.events.push({
          stepIndex: stepCounter++,
          type: "autonomous_feedback",
          content: feedback,
          timestamp: Date.now(),
          attempt,
        });

        this.events.push({
          stepIndex: stepCounter++,
          type: "auto_retry",
          content: `Automatically transitioning to attempt ${attempt + 1}/${maxAttempts} with corrective guidance.`,
          timestamp: Date.now(),
          attempt: attempt + 1,
        });
      }
    }

    const isSuccess = Boolean(finalGateResult?.allowedToProceed);

    // Final Response Step
    this.events.push({
      stepIndex: stepCounter,
      type: "final_response",
      content: isSuccess ? finalOutput : `Failed after ${maxAttempts} attempts: ${finalGateResult?.summary}`,
      timestamp: Date.now(),
      attempt: succeededAttempt || maxAttempts,
    });

    return {
      status: isSuccess ? "success" : "failure",
      totalSteps: this.events.length,
      durationMs: Date.now() - startTime,
      events: [...this.events],
      finalOutput: isSuccess ? finalOutput : `Failed: ${finalGateResult?.summary}`,
      attempts: succeededAttempt || maxAttempts,
      gateResult: finalGateResult!,
      autoRecovered,
    };
  }

  getEventHistory(): readonly HarnessStepEvent[] {
    return [...this.events];
  }
}

