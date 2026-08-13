import type { LumiMonolith } from "../../../index.js";
import type { EngineTickOutcome } from "../../../core/contracts/agent.contracts.js";

export interface BenchmarkTestCase {
  name: string;
  prompt?: string;
  expectedKeywords?: string[];
  execute?: (monolith: LumiMonolith) => Promise<BenchmarkCaseExecution> | BenchmarkCaseExecution;
}

export interface BenchmarkCaseExecution {
  outcome: EngineTickOutcome;
  response: string;
  assertionPassed?: boolean;
  assertions?: BenchmarkAssertionResult[];
}

export interface BenchmarkAssertionResult {
  name: string;
  passed: boolean;
  detail: string;
}

export interface BenchmarkTestResult {
  testName: string;
  durationMs: number;
  passed: boolean;
  outcome: EngineTickOutcome;
  actualResponse: string;
  assertions: BenchmarkAssertionResult[];
}

export interface BenchmarkSuiteResult {
  totalTests: number;
  passCount: number;
  failCount: number;
  totalDurationMs: number;
  meanLatencyMs: number;
  passRate: number;
  results: BenchmarkTestResult[];
}

/**
 * MonolithBenchmarkEvaluator.
 * Absorbed from packages/evals (Pass 18 / ADR-012).
 *
 * Runs automated evaluation suites, measures turn tick latency, and validates frame assertions.
 */
export class MonolithBenchmarkEvaluator {
  private readonly defaultCases: BenchmarkTestCase[] = [
    {
      name: "Memory Fact Storage",
      prompt: "remember: engine = deterministic",
      expectedKeywords: ["deterministic"],
    },
    {
      name: "File View Perception",
      prompt: "view: package.json",
      expectedKeywords: ["package.json"],
    },
  ];

  async runBenchmarkSuite(monolith: LumiMonolith, customCases?: BenchmarkTestCase[]): Promise<BenchmarkSuiteResult> {
    const testCases = customCases ?? this.defaultCases;
    const results: BenchmarkTestResult[] = [];

    // Use a deterministic local route for JIT warm-up. A generic prompt could
    // dispatch to a live provider and make repository baselines auth/network-dependent.
    await monolith.tick({ prompt: "/stats" });

    let totalDuration = 0;
    let passCount = 0;

    for (const tc of testCases) {
      const startTime = performance.now();
      let execution: BenchmarkCaseExecution;
      try {
        if (tc.execute) {
          execution = await tc.execute(monolith);
        } else if (tc.prompt) {
          execution = await monolith.tick({ prompt: tc.prompt });
        } else {
          throw new Error(`Benchmark case '${tc.name}' has neither a prompt nor an execute callback`);
        }
      } catch (error) {
        execution = {
          outcome: "failed",
          response: error instanceof Error ? error.message : String(error),
          assertionPassed: false,
        };
      }
      const rawDurationMs = performance.now() - startTime;
      const durationMs = Number(rawDurationMs.toFixed(2));

      totalDuration += rawDurationMs;

      const expectedKeywords = tc.expectedKeywords ?? [];
      const assertions = execution.assertions ?? [];
      const passed = execution.outcome === "completed"
        && execution.assertionPassed !== false
        && assertions.every((assertion) => assertion.passed)
        && expectedKeywords.every((kw) =>
        execution.response.toLowerCase().includes(kw.toLowerCase())
      );

      if (passed) passCount += 1;

      results.push({
        testName: tc.name,
        durationMs,
        passed,
        outcome: execution.outcome,
        actualResponse: execution.response,
        assertions: assertions.map((assertion) => ({ ...assertion })),
      });
    }

    const totalTests = testCases.length;
    const failCount = totalTests - passCount;
    const meanLatencyMs = totalTests > 0 ? Number((totalDuration / totalTests).toFixed(2)) : 0;
    const passRate = totalTests > 0 ? Number(((passCount / totalTests) * 100).toFixed(1)) : 0;

    return {
      totalTests,
      passCount,
      failCount,
      totalDurationMs: totalDuration,
      meanLatencyMs,
      passRate,
      results,
    };
  }
}
