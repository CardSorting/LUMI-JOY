import { MonolithFactory, type MonolithFactoryOptions } from "./monolith-factory.js";

export const CURRENT_EVOLUTION_BASELINE = Object.freeze({
  highestRecordedPass: 192,
  label: "Pass 192 + runtime hardening",
  runtimeHardeningDecision: "ADR-082",
});

/** Exact composition contract for the current evolution baseline. */
export const CURRENT_REQUIRED_COMPONENTS = [
  "agentEngine",
  "argumentCoercer",
  "authStorageVault",
  "batchAnchorer",
  "benchmarkEvaluator",
  "broccoliApprovalPolicyEngine",
  "broccoliArchitectureProfiler",
  "broccoliAxiomVerifier",
  "broccoliBlastRadiusCalculator",
  "broccoliCASScratchpad",
  "broccoliCasCompactor",
  "broccoliCircuitBreaker",
  "broccoliCognitiveSuggestionEngine",
  "broccoliCommandDiagnostics",
  "broccoliCommandSanitizer",
  "broccoliContextDiagnosis",
  "broccoliContractVerifier",
  "broccoliDecisionLog",
  "broccoliEpistemicReasoningEngine",
  "broccoliExecutionTraceRecorder",
  "broccoliFencingMutexEngine",
  "broccoliIntegrityOptimizer",
  "broccoliIntegrityProtocol",
  "broccoliIntentTracer",
  "broccoliInterAgentMailbox",
  "broccoliJoyRideDiagnostics",
  "broccoliJoyZoningEngine",
  "broccoliJoyZoningGuard",
  "broccoliLspBridge",
  "broccoliModeController",
  "broccoliModuleDecomposer",
  "broccoliMutationPlanner",
  "broccoliOutputBuffer",
  "broccoliPlanEnforcer",
  "broccoliQueryLoop",
  "broccoliReactiveObserver",
  "broccoliRepairMutationExecutor",
  "broccoliRetentionCleanup",
  "broccoliRollbackCoordinator",
  "broccoliSemanticAxiom",
  "broccoliShellResolver",
  "broccoliSideQuery",
  "broccoliSimulation",
  "broccoliSpiderAuditEngine",
  "broccoliStabilityForensics",
  "broccoliStreamingToolExecutor",
  "broccoliStructuralDiscovery",
  "broccoliSubstrateStore",
  "broccoliSystemInvariantEngine",
  "broccoliTaskCoordinator",
  "broccoliTaskDagScheduler",
  "broccoliTaskStateEngine",
  "broccoliTokenEstimator",
  "broccoliTspPolicy",
  "broccoliUniversalGuard",
  "broccoliVerificationPipeline",
  "budgetCalculator",
  "centennialPassMarker",
  "checkpointDigest",
  "clipboardBridge",
  "codexOAuthManager",
  "codexProviderBridge",
  "commandPathResolver",
  "commitGenerator",
  "completionGate",
  "config",
  "connectionController",
  "convergenceEngine",
  "diffSynthesizer",
  "dynamicModelCache",
  "ears",
  "envKeyResolver",
  "eyes",
  "fileLockManager",
  "filePeeker",
  "frontmatterParser",
  "gatewayServer",
  "gatewaySessionRegistry",
  "gitIgnoreFilter",
  "hands",
  "httpDispatcher",
  "ignoreController",
  "imageModelRegistry",
  "intelligenceEngine",
  "interactiveController",
  "joyrideCache",
  "keybindingsController",
  "knowledgeGraph",
  "languageSyntaxParser",
  "lockAuthorityEngine",
  "loopHarness",
  "loopPhaseController",
  "masterBenchmarkOrchestrator",
  "mcpHub",
  "mentionResolver",
  "modelCatalog",
  "modelResolver",
  "mutationSubstrate",
  "permissionController",
  "postmortemDiagnostic",
  "processLifecycleManager",
  "promptComposer",
  "providerAttribution",
  "proxyGateway",
  "reasoningEffortController",
  "resilientFetchClient",
  "ringBuffer",
  "ripgrepSearchService",
  "schemaValidator",
  "semverComparator",
  "sessionCompactor",
  "sessionContext",
  "sessionMemoryStore",
  "sessionStore",
  "sessionVfs",
  "setupWizard",
  "skillsIngestor",
  "slashRouter",
  "snapcompactEngine",
  "snapshotLruCache",
  "snapshotStorageIndex",
  "snowflakeIdGenerator",
  "stabilityDoctor",
  "stalenessTracker",
  "stderrGuard",
  "streamFormatter",
  "swarmDispatcher",
  "systemDirectoryResolver",
  "systemHealthAggregator",
  "tabSpacingNormalizer",
  "telemetryTracer",
  "templateEngine",
  "textSanitizer",
  "timingBuffer",
  "tokenBucketRateGovernor",
  "tokenTruncator",
  "toolRegistry",
  "treeWalker",
  "ttsrCoordinator",
  "urlContentFetcher",
  "variableInjector",
  "writeCoalescer",
] as const satisfies readonly (keyof ReturnType<typeof MonolithFactory.createEngine>)[];

export interface CompositionVerification {
  baseline: typeof CURRENT_EVOLUTION_BASELINE;
  cohesionStatus: "OPTIMAL" | "DEGRADED";
  componentCount: number;
  requiredComponentCount: number;
  missingComponents: string[];
  unexpectedComponents: string[];
  duplicateManifestComponents: string[];
}

/** Verifies the current capability baseline rather than trusting a pass counter. */
export class GrandMonolithSynthesizer {
  static verifyComposition(components: object): CompositionVerification {
    const componentRecord = components as Record<string, unknown>;
    const missingComponents = CURRENT_REQUIRED_COMPONENTS.filter(
      (component) => !Object.hasOwn(components, component) || componentRecord[component] == null
    );
    const requiredComponents = new Set<string>();
    const duplicateManifestComponents: string[] = [];
    for (const component of CURRENT_REQUIRED_COMPONENTS) {
      if (requiredComponents.has(component)) duplicateManifestComponents.push(component);
      requiredComponents.add(component);
    }
    const unexpectedComponents = Object.keys(components).filter((component) => !requiredComponents.has(component));

    return {
      baseline: CURRENT_EVOLUTION_BASELINE,
      cohesionStatus: missingComponents.length === 0
        && unexpectedComponents.length === 0
        && duplicateManifestComponents.length === 0
        ? "OPTIMAL"
        : "DEGRADED",
      componentCount: Object.keys(components).length,
      requiredComponentCount: CURRENT_REQUIRED_COMPONENTS.length,
      missingComponents,
      unexpectedComponents,
      duplicateManifestComponents,
    };
  }

  /** @deprecated Prefer `verifyComposition()` with the active monolith components. */
  static verifyAllPasses(options: MonolithFactoryOptions = {}): CompositionVerification & { passCount: number } {
    const verification = this.verifyComposition(MonolithFactory.createEngine(options));
    return {
      ...verification,
      passCount: CURRENT_EVOLUTION_BASELINE.highestRecordedPass,
    };
  }
}
