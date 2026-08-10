import { LumiMonolith } from "../src/index.js";
import { ArchitectureGuardrailGate } from "../src/tooling/extensions/policy/architecture-guardrail-gate.js";
import { execSync } from "node:child_process";

async function main() {
  console.log("\x1b[1;36m================================================================\x1b[0m");
  console.log("\x1b[1;36m   LUMI Repository Protection & Guardrail Enforcement Audit     \x1b[0m");
  console.log("\x1b[1;36m================================================================\x1b[0m\n");

  // Step 1: TypeScript Type Safety Check
  console.log("\x1b[1;34m[Step 1/3] Verifying TypeScript Type Safety (tsc --noEmit)...\x1b[0m");
  try {
    execSync("npx tsc --noEmit", { stdio: "inherit" });
    console.log("\x1b[32m[✓] TypeScript Type Check PASSED cleanly (0 errors).\x1b[0m\n");
  } catch (err) {
    console.error("\x1b[31m[✗] TypeScript Type Check FAILED!\x1b[0m");
    process.exit(1);
  }

  // Step 2: Initialize Engine Monolith & Run Guardrail Audit
  console.log("\x1b[1;34m[Step 2/3] Initializing Monolith & Running Architecture Guardrails...\x1b[0m");
  const lumi = new LumiMonolith();
  const gate = new ArchitectureGuardrailGate();
  const auditReport = await gate.runFullGuardrailAudit(lumi);

  console.log("\x1b[1;36m--- Architecture & Performance Guardrail Results ---\x1b[0m");
  for (const check of auditReport.results) {
    const icon = check.passed ? "\x1b[32m[PASS]\x1b[0m" : "\x1b[31m[FAIL]\x1b[0m";
    const ruleStr = check.ruleName.padEnd(52);
    console.log(`  ${icon} ${ruleStr} (Value: \x1b[33m${check.measuredValue}\x1b[0m | SLA: ${check.threshold})`);
  }
  console.log();

  // Step 3: Check Final Audit Verdict
  console.log("\x1b[1;34m[Step 3/3] Evaluating Repository Protection Verdict...\x1b[0m");
  if (!auditReport.overallPassed) {
    console.error(`\x1b[1;31m[✗] REPOSITORY GUARDRAIL VIOLATION! ${auditReport.failedCount} rule(s) failed SLA or architecture rules.\x1b[0m`);
    console.error("\x1b[31mPull request / commit BLOCKED to protect repository performance and stability.\x1b[0m\n");
    process.exit(1);
  }

  console.log(`\x1b[1;32m[✓] ALL ${auditReport.totalChecks} ARCHITECTURAL & PERFORMANCE GUARDRAILS PASSED 100% CLEANLY!\x1b[0m`);
  console.log("\x1b[32mRepository is protected. Safe to commit and deploy.\x1b[0m\n");
}

main().catch((err) => {
  console.error("Guardrail check encountered fatal error:", err);
  process.exit(1);
});
