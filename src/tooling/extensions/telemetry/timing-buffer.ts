export interface TimingMeasurement {
  name: string;
  durationMs: number;
  timestamp: number;
}

/**
 * MicrosecondTimingBuffer.
 * Absorbed from packages/utils/src/timing-buffer.ts (Pass 53 / ADR-012).
 *
 * Microsecond precision timing buffer aggregating telemetry measurements.
 */
export class MicrosecondTimingBuffer {
  private readonly buffer: TimingMeasurement[] = [];
  private readonly maxBufferSize: number;

  constructor(maxBufferSize = 100) {
    this.maxBufferSize = maxBufferSize;
  }

  record(name: string, durationMs: number): void {
    if (this.buffer.length >= this.maxBufferSize) {
      this.buffer.shift(); // Evict oldest
    }
    this.buffer.push({
      name,
      durationMs,
      timestamp: Date.now(),
    });
  }

  flush(): TimingMeasurement[] {
    return this.buffer.splice(0, this.buffer.length);
  }

  getMeasurements(): readonly TimingMeasurement[] {
    return this.buffer;
  }
}
