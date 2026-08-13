import type { LumiMonolith } from "../../../index.js";

export interface BenchmarkTestCase {
  name: string;
  prompt: string;
  expectedKeywords: string[];
}

export interface BenchmarkTestResult {
  testName: string;
  durationMs: number;
  passed: boolean;
  actualResponse: string;
}

export interface BenchmarkSuiteResult {
  totalTests: number;
  passCount: number;
  failCount: number;
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

    // Warm-up tick to complete V8 JIT compilation and eliminate cold-start latency spike
    await monolith.tick({ prompt: "ping" });

    let totalDuration = 0;
    let passCount = 0;

    for (const tc of testCases) {
      const startTime = performance.now();
      const tickResult = await monolith.tick({ prompt: tc.prompt });
      const durationMs = Number((performance.now() - startTime).toFixed(2));

      totalDuration += durationMs;

      const passed = tc.expectedKeywords.every((kw) =>
        tickResult.response.toLowerCase().includes(kw.toLowerCase())
      );

      if (passed) passCount += 1;

      results.push({
        testName: tc.name,
        durationMs,
        passed,
        actualResponse: tickResult.response,
      });
    }

    const totalTests = testCases.length;
    const failCount = totalTests - passCount;
    const meanLatencyMs = totalTests > 0 ? Number((totalDuration / totalTests).toFixed(2)) : 0;
    const passRate = totalTests > 0 ? Number(((passCount / totalTests) * 100).toFixed(1)) : 100;

    return {
      totalTests,
      passCount,
      failCount,
      meanLatencyMs,
      passRate,
      results,
    };
  }
}
