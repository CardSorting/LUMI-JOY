/**
 * FixedRingBuffer.
 * Absorbed from packages/utils/src/ring.ts (Pass 52 / ADR-012).
 *
 * Fixed-capacity circular ring buffer with O(1) push operations and zero array resizing.
 */
export class FixedRingBuffer<T> {
  private readonly capacity: number;
  private readonly buffer: (T | undefined)[];
  private head = 0;
  private tail = 0;
  private sizeCount = 0;

  constructor(capacity: number) {
    if (capacity <= 0) {
      throw new Error("Ring buffer capacity must be greater than zero");
    }
    this.capacity = capacity;
    this.buffer = new Array<T | undefined>(capacity);
  }

  push(item: T): void {
    this.buffer[this.tail] = item;
    this.tail = (this.tail + 1) % this.capacity;

    if (this.sizeCount < this.capacity) {
      this.sizeCount++;
    } else {
      this.head = (this.head + 1) % this.capacity; // Evict oldest entry
    }
  }

  pop(): T | undefined {
    if (this.sizeCount === 0) return undefined;

    const item = this.buffer[this.head];
    this.buffer[this.head] = undefined;
    this.head = (this.head + 1) % this.capacity;
    this.sizeCount--;
    return item;
  }

  toArray(): T[] {
    const result: T[] = [];
    let curr = this.head;
    for (let i = 0; i < this.sizeCount; i++) {
      result.push(this.buffer[curr] as T);
      curr = (curr + 1) % this.capacity;
    }
    return result;
  }

  size(): number {
    return this.sizeCount;
  }

  isFull(): boolean {
    return this.sizeCount === this.capacity;
  }

  clear(): void {
    this.buffer.fill(undefined);
    this.head = 0;
    this.tail = 0;
    this.sizeCount = 0;
  }
}
