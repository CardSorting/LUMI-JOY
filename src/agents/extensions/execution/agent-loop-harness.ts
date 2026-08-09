export interface HarnessStepEvent {
  stepIndex: number;
  type: "user_input" | "model_thought" | "tool_call" | "tool_result" | "final_response";
  content: string;
  timestamp: number;
}

export interface HarnessExecutionResult {
  status: "success" | "failure";
  totalSteps: number;
  durationMs: number;
  events: readonly HarnessStepEvent[];
  finalOutput: string;
}

/**
 * Pass 86: Agent Loop Harness
 * Ingests test harness and turn loop control concepts from `packages/agent`.
 * Provides deterministic simulation of agent turns with mock tool invocation traces.
 */
export class AgentLoopHarness {
  private events: HarnessStepEvent[];

  constructor() {
    this.events = [];
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

  getEventHistory(): readonly HarnessStepEvent[] {
    return [...this.events];
  }
}
