import * as fs from "node:fs";
import * as path from "node:path";

interface BaselineAssertion {
  name: string;
  passed: boolean;
  detail: string;
}

interface LiveBaseline {
  schemaVersion: number;
  generatedAt: string;
  passed: boolean;
  runtime: {
    node: string;
    platform: string;
    architecture: string;
  };
  evolutionBaseline: {
    highestRecordedPass: number;
    label: string;
  };
  smoke: {
    passed: boolean;
    totalChecks: number;
    passedCount: number;
    componentCount: number;
    requiredComponentCount: number;
  };
  benchmark: {
    passed: boolean;
    totalTests: number;
    passedCount: number;
    results: Array<{
      testName: string;
      passed: boolean;
      durationMs: number;
      assertions: BaselineAssertion[];
    }>;
  };
  guardrails: {
    passed: boolean;
    totalChecks: number;
    passedCount: number;
    results: Array<{
      ruleName: string;
      passed: boolean;
      measuredValue: string;
      threshold: string;
    }>;
  };
}

const repositoryRoot = process.cwd();
const failures: string[] = [];

function fail(message: string): void {
  failures.push(message);
}

function read(relativePath: string): string {
  const absolutePath = path.join(repositoryRoot, relativePath);
  if (!fs.existsSync(absolutePath)) {
    fail(`${relativePath}: required documentation artifact is missing`);
    return "";
  }
  return fs.readFileSync(absolutePath, "utf8");
}

function requireText(relativePath: string, text: string, description: string): void {
  if (!read(relativePath).includes(text)) {
    fail(`${relativePath}: missing ${description} (${JSON.stringify(text)})`);
  }
}

function collectMarkdownFiles(directory: string): string[] {
  const files: string[] = [];
  const ignoredDirectories = new Set([".git", "dist", "node_modules"]);

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...collectMarkdownFiles(absolutePath));
    if (entry.isFile() && entry.name.endsWith(".md")) files.push(absolutePath);
  }

  return files;
}

function validateMarkdownLinks(markdownFiles: string[]): void {
  const linkPattern = /!?\[[^\]]*\]\((<[^>]+>|[^\s)]+)(?:\s+["'][^"']*["'])?\)/g;
  const ignoredSchemes = /^(?:https?:|mailto:|data:|file:|tel:)/i;

  for (const markdownPath of markdownFiles) {
    const source = fs.readFileSync(markdownPath, "utf8");
    for (const match of source.matchAll(linkPattern)) {
      const rawTarget = match[1]?.replace(/^<|>$/g, "") ?? "";
      if (!rawTarget || rawTarget.startsWith("#") || ignoredSchemes.test(rawTarget)) continue;

      const pathOnly = rawTarget.split("#", 1)[0]?.split("?", 1)[0] ?? "";
      if (!pathOnly) continue;

      let decodedPath: string;
      try {
        decodedPath = decodeURIComponent(pathOnly);
      } catch {
        fail(`${path.relative(repositoryRoot, markdownPath)}: invalid URL encoding in ${rawTarget}`);
        continue;
      }

      const targetPath = decodedPath.startsWith("/")
        ? path.join(repositoryRoot, decodedPath.slice(1))
        : path.resolve(path.dirname(markdownPath), decodedPath);
      if (!fs.existsSync(targetPath)) {
        fail(`${path.relative(repositoryRoot, markdownPath)}: broken relative link ${rawTarget}`);
      }
    }
  }
}

function validateBaselineSchema(baseline: LiveBaseline): void {
  if (baseline.schemaVersion !== 1) fail("docs/LIVE_BASELINE.json: unsupported schema version");
  if (!baseline.passed || !baseline.smoke.passed || !baseline.benchmark.passed || !baseline.guardrails.passed) {
    fail("docs/LIVE_BASELINE.json: checked-in baseline is not fully passing");
  }
  if (!Number.isFinite(Date.parse(baseline.generatedAt))) {
    fail("docs/LIVE_BASELINE.json: generatedAt is not a valid timestamp");
  }
  if (baseline.smoke.passedCount !== baseline.smoke.totalChecks) {
    fail("docs/LIVE_BASELINE.json: smoke totals are internally inconsistent");
  }
  if (baseline.smoke.componentCount !== baseline.smoke.requiredComponentCount) {
    fail("docs/LIVE_BASELINE.json: exact composition totals are internally inconsistent");
  }
  if (baseline.benchmark.passedCount !== baseline.benchmark.totalTests) {
    fail("docs/LIVE_BASELINE.json: benchmark totals are internally inconsistent");
  }
  if (baseline.guardrails.passedCount !== baseline.guardrails.totalChecks) {
    fail("docs/LIVE_BASELINE.json: guardrail totals are internally inconsistent");
  }
}

function validateGeneratedViews(baseline: LiveBaseline): void {
  const benchmarkReport = read("docs/BENCHMARK_REPORT.md");
  const architecturalAudit = read("docs/GRAND_ARCHITECTURAL_AUDIT.md");
  const sharedGeneratedValues = [
    baseline.generatedAt,
    `${baseline.benchmark.passedCount}/${baseline.benchmark.totalTests}`,
  ];

  for (const value of sharedGeneratedValues) {
    if (!benchmarkReport.includes(value)) fail(`docs/BENCHMARK_REPORT.md: does not match live baseline value ${value}`);
    if (!architecturalAudit.includes(value)) fail(`docs/GRAND_ARCHITECTURAL_AUDIT.md: does not match live baseline value ${value}`);
  }

  const flappy = baseline.benchmark.results.find((result) => result.testName.includes("Flappy Bird"));
  if (!flappy || !flappy.passed || flappy.assertions.length !== 8 || flappy.assertions.some((assertion) => !assertion.passed)) {
    fail("docs/LIVE_BASELINE.json: complete Flappy Bird case must pass all eight assertion lanes");
  } else {
    for (const assertion of flappy.assertions) {
      if (!benchmarkReport.includes(assertion.name) || !benchmarkReport.includes(assertion.detail)) {
        fail(`docs/BENCHMARK_REPORT.md: missing Flappy evidence for ${assertion.name}`);
      }
    }
  }

  const auditValues = [
    `${baseline.smoke.passedCount}/${baseline.smoke.totalChecks}`,
    `${baseline.guardrails.passedCount}/${baseline.guardrails.totalChecks}`,
    `${baseline.smoke.componentCount}/${baseline.smoke.requiredComponentCount}`,
    ...baseline.guardrails.results.flatMap((result) => [result.measuredValue, result.threshold]),
  ];
  for (const value of auditValues) {
    if (!architecturalAudit.includes(value)) {
      fail(`docs/GRAND_ARCHITECTURAL_AUDIT.md: does not match live baseline value ${value}`);
    }
  }
}

function validateCurrentSummaries(baseline: LiveBaseline): void {
  const flappy = baseline.benchmark.results.find((result) => result.testName.includes("Flappy Bird"));
  const flappyAssertions = flappy?.assertions.length ?? 0;
  const summaryValues = [
    baseline.generatedAt,
    `${baseline.smoke.componentCount}/${baseline.smoke.requiredComponentCount}`,
    `${baseline.smoke.passedCount}/${baseline.smoke.totalChecks}`,
    `${baseline.benchmark.passedCount}/${baseline.benchmark.totalTests}`,
    `${flappyAssertions}/${flappyAssertions}`,
    `${baseline.guardrails.passedCount}/${baseline.guardrails.totalChecks}`,
  ];

  for (const relativePath of [
    "README.md",
    ".wiki/index.md",
    "CONTRIBUTING.md",
    ".wiki/roadmap/AUTOROLLING-ROADMAP.md",
  ]) {
    const source = read(relativePath);
    for (const value of summaryValues) {
      if (!source.includes(value)) fail(`${relativePath}: current summary does not match live baseline value ${value}`);
    }
  }

  const frameLatency = baseline.guardrails.results.find((result) => result.ruleName.includes("Turn Tick Latency"));
  const throughput = baseline.guardrails.results.find((result) => result.ruleName.includes("Execution Throughput"));
  const rewind = baseline.guardrails.results.find((result) => result.ruleName.includes("State Rewind Latency"));
  if (!frameLatency || !throughput || !rewind) {
    fail("docs/LIVE_BASELINE.json: required performance guardrails are missing");
    return;
  }

  const allPerformanceMeasurements = [frameLatency.measuredValue, throughput.measuredValue, rewind.measuredValue];
  const currentNarratives = new Map<string, string[]>([
    ["README.md", [throughput.measuredValue]],
    [".wiki/policy/CONTRIBUTOR-SECURITY-GUARDRAILS.md", allPerformanceMeasurements],
    [".wiki/philosophy/THE-NEXT-STEP-PHILOSOPHY.md", allPerformanceMeasurements],
    [".wiki/whitepaper/AKD-DSO-ACADEMIC-WHITEPAPER.md", allPerformanceMeasurements],
    [".wiki/adr/ADR-050-automated-benchmark-and-throughput-evaluation.md", allPerformanceMeasurements],
    [".wiki/adr/ADR-051-contributor-security-and-performance-guardrail-gate.md", allPerformanceMeasurements],
  ]);
  for (const [relativePath, measurements] of currentNarratives) {
    const source = read(relativePath).replaceAll(",", "");
    for (const value of measurements) {
      const numericMeasurement = value.match(/[\d.]+/)?.[0] ?? value;
      if (!source.includes(numericMeasurement)) {
        fail(`${relativePath}: current performance narrative does not match ${value}`);
      }
    }
  }

  if (flappy) {
    const measuredDuration = flappy.durationMs.toFixed(2);
    for (const relativePath of [
      ".wiki/philosophy/THE-NEXT-STEP-PHILOSOPHY.md",
      ".wiki/whitepaper/AKD-DSO-ACADEMIC-WHITEPAPER.md",
      ".wiki/adr/ADR-050-automated-benchmark-and-throughput-evaluation.md",
    ]) {
      if (!read(relativePath).includes(measuredDuration)) {
        fail(`${relativePath}: current Flappy Bird duration does not match ${measuredDuration} ms`);
      }
    }
  }
}

function validateHistoricalProvenance(): void {
  const provenanceRequirements = new Map<string, string>([
    [".wiki/field-notes/BENCHMARK-PERFORMANCE-FIELD-NOTE.md", "archival comparison"],
    [".wiki/whitepaper/AKD-DSO-ACADEMIC-WHITEPAPER.md", "Historical Dataset"],
    [".wiki/philosophy/THE-NEXT-STEP-PHILOSOPHY.md", "historical rationale"],
    [".wiki/ip/INVENTION-DISCLOSURE-AND-PRIOR-ART.md", "Measurement provenance"],
    [".wiki/ip/DEFENSIVE-PRIOR-ART-CLAIMS.md", "Measurement provenance"],
    [".wiki/adr/README.md", "decision-time context"],
  ]);
  for (const [relativePath, marker] of provenanceRequirements) {
    requireText(relativePath, marker, "historical measurement provenance marker");
    requireText(relativePath, "LIVE_BASELINE.json", "current baseline reference");
  }

  const phaseAdrDirectory = path.join(repositoryRoot, ".wiki", "adr");
  const phaseAdrs = fs.readdirSync(phaseAdrDirectory)
    .filter((name) => /^ADR-(?:05[3-9]|06\d|07\d|08[01])-phase-/.test(name));
  if (phaseAdrs.length !== 29) {
    fail(`.wiki/adr: expected 29 Pass 32-60 phase ADRs, found ${phaseAdrs.length}`);
  }
  for (const name of phaseAdrs) {
    const source = read(path.join(".wiki", "adr", name));
    if (!source.includes("npm run benchmark") || !source.includes("docs/LIVE_BASELINE.json")) {
      fail(`.wiki/adr/${name}: stale benchmark reproduction guidance`);
    }
    if (source.includes("High-throughput execution verified via `npx tsx src/index.ts --benchmark`")) {
      fail(`.wiki/adr/${name}: acceptance-time benchmark command is presented as current`);
    }
  }
}

function main(): void {
  const baselineSource = read("docs/LIVE_BASELINE.json");
  let baseline: LiveBaseline;
  try {
    baseline = JSON.parse(baselineSource) as LiveBaseline;
  } catch (error) {
    fail(`docs/LIVE_BASELINE.json: invalid JSON (${error instanceof Error ? error.message : String(error)})`);
    baseline = {} as LiveBaseline;
  }

  if (baselineSource) {
    try {
      validateBaselineSchema(baseline);
      validateGeneratedViews(baseline);
      validateCurrentSummaries(baseline);
    } catch (error) {
      fail(`docs/LIVE_BASELINE.json: incomplete schema (${error instanceof Error ? error.message : String(error)})`);
    }
  }
  validateHistoricalProvenance();

  const markdownFiles = collectMarkdownFiles(repositoryRoot);
  validateMarkdownLinks(markdownFiles);

  if (failures.length > 0) {
    console.error(`Documentation validation failed with ${failures.length} issue(s):`);
    for (const failure of failures) console.error(`- ${failure}`);
    process.exitCode = 1;
    return;
  }

  console.log(`Documentation validation passed (${markdownFiles.length} Markdown files, synchronized live results, generated views, links, and historical provenance).\n`);
}

main();
