export interface TTSRMeasurement {
  turnId: string;
  startTime: number;
  firstByteTime?: number;
  secondResponseTime?: number;
  ttfbMs?: number;
  ttsrMs?: number;
}

/**
 * Pass 98: TTSR Coordinator
 * Ingests Time-To-Second-Response (TTSR) telemetry coordination concepts from `packages/coding-agent/src/core/ttsr-coordinator.ts`.
 * Tracks stream latency milestones (TTFB & TTSR) to measure provider response responsiveness.
 */
export class TTSRCoordinator {
  private measurements: Map<string, TTSRMeasurement>;

  constructor() {
    this.measurements = new Map();
  }

  markStart(turnId: string): TTSRMeasurement {
    const measurement: TTSRMeasurement = {
      turnId,
      startTime: Date.now(),
    };
    this.measurements.set(turnId, measurement);
    return measurement;
  }

  markFirstByte(turnId: string): number | undefined {
    const item = this.measurements.get(turnId);
    if (!item) return undefined;
    item.firstByteTime = Date.now();
    item.ttfbMs = item.firstByteTime - item.startTime;
    return item.ttfbMs;
  }

  markSecondResponse(turnId: string): number | undefined {
    const item = this.measurements.get(turnId);
    if (!item) return undefined;
    item.secondResponseTime = Date.now();
    item.ttsrMs = item.secondResponseTime - item.startTime;
    return item.ttsrMs;
  }

  getLatencyStats(turnId: string): TTSRMeasurement | undefined {
    return this.measurements.get(turnId);
  }
}
