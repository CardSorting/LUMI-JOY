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
    if (gateId.trim().length === 0) throw new Error("Completion gate ID must not be empty");
    const criterionIds = new Set<string>();
    for (const criterion of criteria) {
      if (criterion.id.trim().length === 0) throw new Error("Completion criterion ID must not be empty");
      if (criterionIds.has(criterion.id)) {
        throw new Error(`Completion gate '${gateId}' has duplicate criterion '${criterion.id}'`);
      }
      criterionIds.add(criterion.id);
    }
    this.gateCriteriaMap.set(gateId, criteria.map((criterion) => ({ ...criterion })));
  }

  evaluateGate(gateId: string): CompletionGateResult {
    const registered = this.gateCriteriaMap.has(gateId);
    const criteria = this.gateCriteriaMap.get(gateId)?.map((criterion) => ({ ...criterion })) ?? [];
    const requiredCriteria = criteria.filter((criterion) => criterion.required);
    const blockingCriteria = requiredCriteria.filter((criterion) => !criterion.evaluated || !criterion.passed);
    const allowedToProceed = registered
      && criteria.length > 0
      && requiredCriteria.length > 0
      && blockingCriteria.length === 0;

    let summary: string;
    if (!registered) {
      summary = `Gate '${gateId}' is not registered.`;
    } else if (criteria.length === 0) {
      summary = `Gate '${gateId}' has no completion criteria.`;
    } else if (requiredCriteria.length === 0) {
      summary = `Gate '${gateId}' has no required completion criteria.`;
    } else if (blockingCriteria.length > 0) {
      summary = `Gate '${gateId}' is blocked by required criteria: ${blockingCriteria.map((criterion) => criterion.id).join(", ")}.`;
    } else {
      summary = `Gate '${gateId}' passed all required evaluated completion criteria.`;
    }

    return {
      allowedToProceed,
      gateId,
      criteriaResults: criteria,
      summary,
    };
  }
}
