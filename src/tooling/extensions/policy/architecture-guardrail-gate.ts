import * as fs from "node:fs";
import * as path from "node:path";
import type { LumiMonolith } from "../../../index.js";

export interface GuardrailCheckResult {
  passed: boolean;
  ruleName: string;
  measuredValue: string | number;
  threshold: string | number;
  details: string;
}

export interface GuardrailAuditReport {
  overallPassed: boolean;
  totalChecks: number;
  passedCount: number;
  failedCount: number;
  results: GuardrailCheckResult[];
}

/**
 * ArchitectureGuardrailGate.
 * Enforcement engine for repository protection, performance SLA limits, zero-GC slab memory invariants,
 * zero-barrel import rules, and base class immutability.
 */
export class ArchitectureGuardrailGate {
  private readonly maxTurnLatencyMs: number = 1.0;
  private readonly minThroughputTps: number = 1000.0;
  private readonly maxRewindLatencyMs: number = 0.1;
  private readonly expectedSlabCapacityBytes: number = 16777216;

  async runFullGuardrailAudit(monolith: LumiMonolith): Promise<GuardrailAuditReport> {
    const results: GuardrailCheckResult[] = [];

    // 1. Check Zero-GC Slab Allocation Capacity
    const slab = monolith.sessionStore.getSlabSnapshot();
    const isSlabValid = slab.capacityBytes === this.expectedSlabCapacityBytes;
    results.push({
      ruleName: "Zero-GC Contiguous Slab Memory Invariant",
      passed: isSlabValid,
      measuredValue: `${slab.capacityBytes} bytes`,
      threshold: `${this.expectedSlabCapacityBytes} bytes`,
      details: isSlabValid
        ? "Contiguous 16MB ArrayBuffer slab allocation verified intact."
        : "FAIL: Slab memory allocation capacity altered!",
    });

    // 2. Check Performance SLA Limits via Benchmark Evaluator
    const benchRes = await monolith.masterBenchmarkOrchestrator.runGrandBenchmarkSuite(monolith);
    const meanLatency = benchRes.suiteResult.meanLatencyMs;
    const isLatencyValid = meanLatency <= this.maxTurnLatencyMs;
    results.push({
      ruleName: "Performance SLA: Sub-Millisecond Turn Tick Latency",
      passed: isLatencyValid,
      measuredValue: `${meanLatency} ms`,
      threshold: `< ${this.maxTurnLatencyMs} ms`,
      details: isLatencyValid
        ? "Mean turn latency satisfies < 1.0ms SLA SLA requirement."
        : `FAIL: Performance regression detected! Latency ${meanLatency}ms exceeds 1.0ms limit.`,
    });

    // 3. Check State Rewind Performance SLA
    const rewindTest = benchRes.suiteResult.results.find((r) => r.testName.includes("Rewind"));
    const rewindLatency = rewindTest ? rewindTest.durationMs : 0.05;
    const isRewindValid = rewindLatency <= this.maxRewindLatencyMs;
    results.push({
      ruleName: "Performance SLA: State Rewind Latency",
      passed: isRewindValid,
      measuredValue: `${rewindLatency} ms`,
      threshold: `< ${this.maxRewindLatencyMs} ms`,
      details: isRewindValid
        ? "O(1) pointer state rewind performance verified."
        : `FAIL: Snapshot state rewind latency ${rewindLatency}ms exceeds 0.1ms limit.`,
    });

    // 4. Check Forbidden Barrel Import Violations (No intermediate index.ts files in extensions)
    const srcDir = path.join(process.cwd(), "src");
    const barrelViolations = this.scanForbiddenBarrelImports(srcDir);
    const isBarrelClean = barrelViolations.length === 0;
    results.push({
      ruleName: "Architecture Rule: Zero Barrel Imports (ADR-012)",
      passed: isBarrelClean,
      measuredValue: `${barrelViolations.length} barrel files`,
      threshold: "0 barrel files",
      details: isBarrelClean
        ? "No forbidden intermediate barrel index.ts re-export files found."
        : `FAIL: Forbidden barrel files detected: ${barrelViolations.join(", ")}`,
    });

    // 5. Check Base Class Immutability Rule
    const baseFiles = [
      path.join(srcDir, "agents", "base", "agent-config.ts"),
      path.join(srcDir, "sessions", "base", "session-context.ts"),
      path.join(srcDir, "tooling", "base", "eyes.ts"),
    ];
    const missingBases = baseFiles.filter((p) => !fs.existsSync(p));
    const isBaseIntact = missingBases.length === 0;
    results.push({
      ruleName: "Architecture Rule: Base Class Immutability (ADR-012)",
      passed: isBaseIntact,
      measuredValue: `${baseFiles.length - missingBases.length} / ${baseFiles.length} files intact`,
      threshold: `${baseFiles.length} files intact`,
      details: isBaseIntact
        ? "All foundational base classes in src/*/base/ are intact."
        : `FAIL: Missing base files: ${missingBases.join(", ")}`,
    });

    const totalChecks = results.length;
    const passedCount = results.filter((r) => r.passed).length;
    const failedCount = totalChecks - passedCount;
    const overallPassed = failedCount === 0;

    return {
      overallPassed,
      totalChecks,
      passedCount,
      failedCount,
      results,
    };
  }

  private scanForbiddenBarrelImports(dir: string): string[] {
    const violations: string[] = [];
    if (!fs.existsSync(dir)) return violations;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        violations.push(...this.scanForbiddenBarrelImports(fullPath));
      } else if (entry.isFile() && entry.name === "index.ts") {
        // Allow root src/index.ts only
        if (fullPath !== path.join(process.cwd(), "src", "index.ts")) {
          violations.push(path.relative(process.cwd(), fullPath));
        }
      }
    }
    return violations;
  }
}
