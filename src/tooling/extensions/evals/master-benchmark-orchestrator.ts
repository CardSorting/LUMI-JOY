import { MonolithBenchmarkEvaluator, type BenchmarkSuiteResult, type BenchmarkTestCase } from "./benchmark-evaluator.js";
import type { LumiMonolith } from "../../../index.js";

export interface GrandBenchmarkResult {
  suiteResult: BenchmarkSuiteResult;
  timestamp: number;
  passed: boolean;
  totalDurationMs: number;
  throughputTps: number;
  throughputPerMinute: number;
}

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

  async runGrandBenchmarkSuite(monolith: LumiMonolith, customCases?: BenchmarkTestCase[]): Promise<GrandBenchmarkResult> {
    const suiteResult = await this.benchmarkEvaluator.runBenchmarkSuite(monolith, customCases);
    const measuredDurationMs = suiteResult.totalDurationMs;
    const throughputTps = measuredDurationMs > 0 && suiteResult.totalTests > 0
      ? Number((suiteResult.totalTests / (measuredDurationMs / 1000)).toFixed(2))
      : 0;
    return {
      suiteResult,
      timestamp: Date.now(),
      passed: suiteResult.totalTests > 0 && suiteResult.failCount === 0,
      totalDurationMs: Number(measuredDurationMs.toFixed(2)),
      throughputTps,
      throughputPerMinute: Number((throughputTps * 60).toFixed(0)),
    };
  }
}
