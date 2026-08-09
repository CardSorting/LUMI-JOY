/**
 * SnowflakeIdGenerator.
 * Absorbed from packages/utils/src/snowflake.ts (Pass 41 / ADR-012).
 *
 * Generates 64-bit time-ordered Snowflake identifiers for collision-free event and snapshot tracking.
 */
export class SnowflakeIdGenerator {
  private readonly workerId: number;
  private sequence = 0;
  private lastTimestamp = -1;

  constructor(workerId = 1) {
    this.workerId = workerId & 0x1f; // 5 bits worker ID
  }

  nextId(): string {
    let timestamp = Date.now();

    if (timestamp === this.lastTimestamp) {
      this.sequence = (this.sequence + 1) & 0xfff; // 12 bits sequence
      if (this.sequence === 0) {
        // Sequence overflow in same millisecond, wait until next ms
        while (timestamp <= this.lastTimestamp) {
          timestamp = Date.now();
        }
      }
    } else {
      this.sequence = 0;
    }

    this.lastTimestamp = timestamp;

    const epochOffset = 1704067200000; // 2024-01-01 epoch
    const timeComponent = BigInt(timestamp - epochOffset) << 22n;
    const workerComponent = BigInt(this.workerId) << 12n;
    const seqComponent = BigInt(this.sequence);

    const snowflake = timeComponent | workerComponent | seqComponent;
    return snowflake.toString();
  }
}
