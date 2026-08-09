import type { AnchoredEditResult } from "../../../core/contracts/tooling.contracts.js";
import { AnchoredHands } from "./hands.js";

export interface BatchEditTask {
  filePath: string;
  targetLine: number;
  expectedHash: string;
  replacementContent: string;
}

/**
 * BatchEditAnchorer.
 * Absorbed in Pass 64 (ADR-035 / ADR-012).
 *
 * Applies multi-file line-anchored edits atomically.
 */
export class BatchEditAnchorer {
  private readonly hands: AnchoredHands;

  constructor(hands: AnchoredHands) {
    this.hands = hands;
  }

  async applyBatch(tasks: BatchEditTask[]): Promise<AnchoredEditResult[]> {
    const results: AnchoredEditResult[] = [];

    for (const task of tasks) {
      const res = await this.hands.applyAnchoredEdit(
        task.filePath,
        task.targetLine,
        task.expectedHash,
        task.replacementContent
      );
      results.push(res);
      if (!res.success) {
        break; // Stop batch execution on failure
      }
    }

    return results;
  }
}
