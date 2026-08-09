export interface GateCriteria {
  id: string;
  description: string;
  required: boolean;
  evaluated: boolean;
  passed: boolean;
}

export interface CompletionGateResult {
  allowedToProceed: boolean;
  gateId: string;
  criteriaResults: GateCriteria[];
  summary: string;
}

/**
 * RoadmapCompletionGate.
 * Absorbed from packages/codemarie/src/services/roadmap/RoadmapCompletionGate.ts (Pass 82 / ADR-012).
 *
 * Verifies quality gate requirements and completion criteria before phase execution transitions.
 */
export class RoadmapCompletionGate {
  private readonly gateCriteriaMap = new Map<string, GateCriteria[]>();

  registerGate(gateId: string, criteria: GateCriteria[]): void {
    this.gateCriteriaMap.set(gateId, criteria);
  }

  evaluateGate(gateId: string): CompletionGateResult {
    const criteria = this.gateCriteriaMap.get(gateId) ?? [];
    const allRequiredPassed = criteria
      .filter((c) => c.required)
      .every((c) => c.passed);

    return {
      allowedToProceed: allRequiredPassed,
      gateId,
      criteriaResults: criteria,
      summary: allRequiredPassed
        ? `Gate '${gateId}' passed all required completion criteria.`
        : `Gate '${gateId}' failed one or more required completion criteria.`,
    };
  }
}
