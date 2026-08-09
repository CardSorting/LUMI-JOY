import { MonolithBenchmarkEvaluator, type BenchmarkSuiteResult, type BenchmarkTestCase } from "./benchmark-evaluator.js";
import type { LumiMonolith } from "../../../index.js";

/**
 * MasterBenchmarkOrchestrator.
 * Absorbed in Pass 73 (ADR-038 / ADR-012).
 *
 * Runs comprehensive multi-phase benchmark suites across engine execution, memory, VFS, and tooling.
 */
export class MasterBenchmarkOrchestrator {
  private readonly benchmarkEvaluator: MonolithBenchmarkEvaluator;

  constructor(benchmarkEvaluator = new MonolithBenchmarkEvaluator()) {
    this.benchmarkEvaluator = benchmarkEvaluator;
  }

  async runGrandBenchmarkSuite(monolith: LumiMonolith, customCases?: BenchmarkTestCase[]): Promise<{
    suiteResult: BenchmarkSuiteResult;
    timestamp: number;
    passed: boolean;
  }> {
    const suiteResult = await this.benchmarkEvaluator.runBenchmarkSuite(monolith, customCases);
    return {
      suiteResult,
      timestamp: Date.now(),
      passed: suiteResult.failCount === 0,
    };
  }
}
