export type LoopPhase = "idle" | "thinking" | "tool_execution" | "response_generation" | "compacting" | "failed";

export interface PhaseTransitionEvent {
  previousPhase: LoopPhase;
  currentPhase: LoopPhase;
  timestamp: number;
}

/**
 * LoopPhaseController.
 * Absorbed from packages/utils/src/loop-phase.ts (Pass 50 / ADR-012).
 *
 * Tracks and controls fine-grained phase transitions during agent loop execution.
 */
export class LoopPhaseController {
  private currentPhase: LoopPhase = "idle";
  private readonly history: PhaseTransitionEvent[] = [];

  setPhase(nextPhase: LoopPhase): void {
    if (this.currentPhase === nextPhase) return;

    const event: PhaseTransitionEvent = {
      previousPhase: this.currentPhase,
      currentPhase: nextPhase,
      timestamp: Date.now(),
    };

    this.history.push(event);
    this.currentPhase = nextPhase;
  }

  getPhase(): LoopPhase {
    return this.currentPhase;
  }

  getHistory(): readonly PhaseTransitionEvent[] {
    return this.history;
  }
}
