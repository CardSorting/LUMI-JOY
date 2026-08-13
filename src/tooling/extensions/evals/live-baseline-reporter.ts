import * as fs from "node:fs";
import * as path from "node:path";
import type { GrandBenchmarkResult } from "./master-benchmark-orchestrator.js";
import type { RuntimeSmokeReport } from "./runtime-smoke-suite.js";
import type { GuardrailAuditReport } from "../policy/architecture-guardrail-gate.js";

export interface LiveBaselineInput {
  repositoryVersion: string;
  configuredModel: string;
  smoke: RuntimeSmokeReport;
  benchmark: GrandBenchmarkResult;
  guardrails: GuardrailAuditReport;
}

export interface LiveBaselineWriteResult {
  generatedAt: string;
  passed: boolean;
  files: string[];
}

interface SerializableBaseline {
  schemaVersion: 1;
  generatedAt: string;
  passed: boolean;
  repositoryVersion: string;
  runtime: {
    node: string;
    platform: NodeJS.Platform;
    architecture: string;
    configuredModel: string;
  };
  evolutionBaseline: RuntimeSmokeReport["baseline"];
  smoke: {
    passed: boolean;
    totalChecks: number;
    passedCount: number;
    failedCount: number;
    durationMs: number;
    componentCount: number;
    requiredComponentCount: number;
    composedRequiredComponentCount: number;
    missingComponents: string[];
    unexpectedComponents: string[];
    duplicateManifestComponents: string[];
    checks: Array<{
      id: string;
      category: string;
      name: string;
      passed: boolean;
      durationMs: number;
      detail: string;
    }>;
  };
  benchmark: {
    passed: boolean;
    totalTests: number;
    passedCount: number;
    failedCount: number;
    passRate: number;
    meanLatencyMs: number;
    totalDurationMs: number;
    throughputTps: number;
    throughputPerMinute: number;
    results: Array<{
      testName: string;
      passed: boolean;
      outcome: string;
      durationMs: number;
      assertions: Array<{
        name: string;
        passed: boolean;
        detail: string;
      }>;
    }>;
  };
  guardrails: {
    passed: boolean;
    totalChecks: number;
    passedCount: number;
    failedCount: number;
    results: Array<{
      ruleName: string;
      passed: boolean;
      measuredValue: string | number;
      threshold: string | number;
      details: string;
    }>;
  };
}

/** Atomically generates human- and machine-readable baselines from one live run. */
export class LiveBaselineReporter {
  write(outputRoot: string, input: LiveBaselineInput): LiveBaselineWriteResult {
    const generatedAt = new Date().toISOString();
    const passed = input.smoke.passed && input.benchmark.passed && input.guardrails.overallPassed;
    const baseline = this.toSerializableBaseline(generatedAt, passed, input);
    const docsDirectory = path.resolve(outputRoot, "docs");
    fs.mkdirSync(docsDirectory, { recursive: true });

    const outputs = new Map<string, string>([
      [path.join(docsDirectory, "LIVE_BASELINE.json"), `${JSON.stringify(baseline, null, 2)}\n`],
      [path.join(docsDirectory, "BENCHMARK_REPORT.md"), this.renderBenchmarkReport(baseline)],
      [path.join(docsDirectory, "GRAND_ARCHITECTURAL_AUDIT.md"), this.renderArchitecturalAudit(baseline)],
    ]);

    for (const [target, content] of outputs) {
      this.writeAtomic(target, content);
    }

    return {
      generatedAt,
      passed,
      files: [...outputs.keys()].map((file) => path.relative(outputRoot, file)),
    };
  }

  private toSerializableBaseline(
    generatedAt: string,
    passed: boolean,
    input: LiveBaselineInput
  ): SerializableBaseline {
    return {
      schemaVersion: 1,
      generatedAt,
      passed,
      repositoryVersion: input.repositoryVersion,
      runtime: {
        node: process.version,
        platform: process.platform,
        architecture: process.arch,
        configuredModel: input.configuredModel,
      },
      evolutionBaseline: input.smoke.baseline,
      smoke: {
        passed: input.smoke.passed,
        totalChecks: input.smoke.totalChecks,
        passedCount: input.smoke.passedCount,
        failedCount: input.smoke.failedCount,
        durationMs: input.smoke.durationMs,
        componentCount: input.smoke.composition.componentCount,
        requiredComponentCount: input.smoke.composition.requiredComponentCount,
        composedRequiredComponentCount: input.smoke.composition.requiredComponentCount
          - input.smoke.composition.missingComponents.length,
        missingComponents: [...input.smoke.composition.missingComponents],
        unexpectedComponents: [...input.smoke.composition.unexpectedComponents],
        duplicateManifestComponents: [...input.smoke.composition.duplicateManifestComponents],
        checks: input.smoke.checks.map((check) => ({ ...check })),
      },
      benchmark: {
        passed: input.benchmark.passed,
        totalTests: input.benchmark.suiteResult.totalTests,
        passedCount: input.benchmark.suiteResult.passCount,
        failedCount: input.benchmark.suiteResult.failCount,
        passRate: input.benchmark.suiteResult.passRate,
        meanLatencyMs: input.benchmark.suiteResult.meanLatencyMs,
        totalDurationMs: input.benchmark.totalDurationMs,
        throughputTps: input.benchmark.throughputTps,
        throughputPerMinute: input.benchmark.throughputPerMinute,
        results: input.benchmark.suiteResult.results.map((result) => ({
          testName: result.testName,
          passed: result.passed,
          outcome: result.outcome,
          durationMs: result.durationMs,
          assertions: result.assertions.map((assertion) => ({ ...assertion })),
        })),
      },
      guardrails: {
        passed: input.guardrails.overallPassed,
        totalChecks: input.guardrails.totalChecks,
        passedCount: input.guardrails.passedCount,
        failedCount: input.guardrails.failedCount,
        results: input.guardrails.results.map((result) => ({ ...result })),
      },
    };
  }

  private renderBenchmarkReport(baseline: SerializableBaseline): string {
    const status = baseline.passed ? "PASSED" : "FAILED";
    const benchmarkStatus = baseline.benchmark.passed ? "PASSED" : "FAILED";
    const resultRows = baseline.benchmark.results.map((result, index) =>
      `| TC-${String(index + 1).padStart(2, "0")} | ${this.escapeCell(result.testName)} | ${result.outcome} | ${result.durationMs.toFixed(2)} ms | ${result.assertions.length > 0 ? `${result.assertions.filter((assertion) => assertion.passed).length}/${result.assertions.length}` : "—"} | ${result.passed ? "PASS" : "FAIL"} |`
    ).join("\n");
    const assertionSections = baseline.benchmark.results
      .filter((result) => result.assertions.length > 0)
      .map((result) => `### ${this.escapeCell(result.testName)}

| Assertion | Evidence | Status |
|---|---|---|
${result.assertions.map((assertion) => `| ${this.escapeCell(assertion.name)} | ${this.escapeCell(assertion.detail)} | ${assertion.passed ? "PASS" : "FAIL"} |`).join("\n")}`)
      .join("\n\n");

    return `# LUMI Live Benchmark Baseline

> **Live Baseline Status**: \`${status}\`
> **Generated At**: ${baseline.generatedAt}
> **Evolution Baseline**: ${baseline.evolutionBaseline.label}
> **Repository Version**: \`${baseline.repositoryVersion}\`
> **Runtime**: ${baseline.runtime.node} · ${baseline.runtime.platform}/${baseline.runtime.architecture}
> **Regenerate**: \`npm run baseline:update\`

This report is generated from the current worktree by \`lumi --baseline\`. Do not edit measured values manually; the machine-readable source is [\`LIVE_BASELINE.json\`](LIVE_BASELINE.json).

## Live Performance Summary

| Metric | Live Measurement | Status |
|---|---:|---|
| Benchmark cases | ${baseline.benchmark.passedCount}/${baseline.benchmark.totalTests} | ${benchmarkStatus} |
| Pass rate | ${baseline.benchmark.passRate.toFixed(1)}% | ${baseline.benchmark.passed ? "PASS" : "FAIL"} |
| Mean heterogeneous case latency | ${baseline.benchmark.meanLatencyMs.toFixed(2)} ms | observed |
| Total suite duration | ${baseline.benchmark.totalDurationMs.toFixed(2)} ms | observed |
| Workload throughput | ${baseline.benchmark.throughputTps.toFixed(2)} cases/sec | observed |
| Per-minute throughput | ${baseline.benchmark.throughputPerMinute.toFixed(0)} cases/min | observed |

## Test Cases

| ID | Case | Outcome | Latency | Assertions | Status |
|---|---|---|---:|---:|---|
${resultRows}

## Deep Case Evidence

${assertionSections || "No case-specific assertion evidence was reported."}

## Baseline Policy

- A case passes only when its assertion matches and \`EngineTickResult.outcome\` is \`completed\`.
- Aggregate case latency includes heterogeneous workloads such as strict TypeScript compilation; engine fast-path SLAs are measured separately by the architecture guardrails.
- Throughput and latency are environment-sensitive live observations, not permanent guarantees.
- The baseline command writes reports even on failure, then exits nonzero so the repository cannot silently bless a failing run.
`;
  }

  private renderArchitecturalAudit(baseline: SerializableBaseline): string {
    const status = baseline.passed ? "PASSED" : "FAILED";
    const smokeRows = baseline.smoke.checks.map((check) =>
      `| ${this.escapeCell(check.category)} | ${this.escapeCell(check.name)} | ${check.durationMs.toFixed(2)} ms | ${check.passed ? "PASS" : "FAIL"} | ${this.escapeCell(check.detail)} |`
    ).join("\n");
    const guardrailRows = baseline.guardrails.results.map((check) =>
      `| ${this.escapeCell(check.ruleName)} | ${this.escapeCell(String(check.measuredValue))} | ${this.escapeCell(String(check.threshold))} | ${check.passed ? "PASS" : "FAIL"} |`
    ).join("\n");

    return `# LUMI Live Architectural Audit

> **Live Baseline Status**: \`${status}\`
> **Generated At**: ${baseline.generatedAt}
> **Evolution Baseline**: ${baseline.evolutionBaseline.label} (${baseline.evolutionBaseline.runtimeHardeningDecision})
> **Configured Model**: \`${baseline.runtime.configuredModel}\`
> **Regenerate**: \`npm run baseline:update\`

This audit and [the benchmark report](BENCHMARK_REPORT.md) are generated atomically from the same live run. [\`LIVE_BASELINE.json\`](LIVE_BASELINE.json) is the machine-readable source of truth.

## Verification Summary

| Verification Lane | Live Result | Status |
|---|---:|---|
| Runtime smoke checks | ${baseline.smoke.passedCount}/${baseline.smoke.totalChecks} | ${baseline.smoke.passed ? "PASS" : "FAIL"} |
| Architecture and performance guardrails | ${baseline.guardrails.passedCount}/${baseline.guardrails.totalChecks} | ${baseline.guardrails.passed ? "PASS" : "FAIL"} |
| Required current capabilities | ${baseline.smoke.composedRequiredComponentCount}/${baseline.smoke.requiredComponentCount} | ${baseline.smoke.composedRequiredComponentCount === baseline.smoke.requiredComponentCount ? "PASS" : "FAIL"} |
| Composed runtime components | ${baseline.smoke.componentCount} | observed |
| Benchmark cases | ${baseline.benchmark.passedCount}/${baseline.benchmark.totalTests} | ${baseline.benchmark.passed ? "PASS" : "FAIL"} |
| Mean heterogeneous case latency | ${baseline.benchmark.meanLatencyMs.toFixed(2)} ms | observed |
| Workload throughput | ${baseline.benchmark.throughputTps.toFixed(2)} cases/sec | observed |

## Runtime Smoke Evidence

| Category | Capability | Duration | Status | Evidence |
|---|---|---:|---|---|
${smokeRows}

## Architecture and Performance Guardrails

| Rule | Live Measurement | Required Threshold | Status |
|---|---:|---:|---|
${guardrailRows}

## Completion Semantics

- A completed provider item is not a completed logical turn.
- Retriable attempt failures remain activity-scoped while fallback is active.
- Public frame success requires \`EngineTickResult.outcome === "completed"\`.
- The first turn-scoped terminal is immutable.

## Reproduction

\`\`\`bash
npm run baseline:update
npm run check
npm test
npm run build
git diff --check
\`\`\`
`;
  }

  private escapeCell(value: string): string {
    return value.replace(/\|/g, "\\|").replace(/[\r\n]+/g, " ").trim();
  }

  private writeAtomic(target: string, content: string): void {
    const temporary = `${target}.${process.pid}.tmp`;
    try {
      fs.writeFileSync(temporary, content, "utf8");
      fs.renameSync(temporary, target);
    } catch (error) {
      if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
      throw error;
    }
  }
}
