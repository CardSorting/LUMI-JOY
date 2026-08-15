/**
 * Zero-GC Slab Allocator & Arena Buffer Pooling for V8 Mechanical Sympathy.
 * Absorbed from packages/broccolidb (Pass 6).
 */
export class ArenaAllocator {
  private static readonly encoder = new TextEncoder();
  private static readonly decoder = new TextDecoder("utf-8");
  private readonly buffer: ArrayBuffer;
  private readonly uint32View: Uint32Array;
  private readonly uint8View: Uint8Array;
  private offset = 0;
  private resetCount = 0;

  constructor(sizeInBytes: number = 16 * 1024 * 1024) {
    this.buffer = new ArrayBuffer(sizeInBytes);
    this.uint32View = new Uint32Array(this.buffer);
    this.uint8View = new Uint8Array(this.buffer);
  }

  allocateNode(id: number, flags: number): number {
    const ptr = this.offset;
    if (ptr + 2 > this.uint32View.length) {
      throw new Error(`ArenaAllocator slab exhausted (capacity: ${this.uint32View.length * 4} bytes)`);
    }
    this.uint32View[ptr] = id;
    this.uint32View[ptr + 1] = flags;
    this.offset += 2;
    return ptr;
  }

  allocateRawBytes(byteLength: number): number {
    const byteOffset = this.offset * 4;
    const wordsNeeded = Math.ceil(byteLength / 4);
    if (this.offset + wordsNeeded > this.uint32View.length) {
      throw new Error("ArenaAllocator slab exhausted for raw bytes allocation");
    }
    this.offset += wordsNeeded;
    return byteOffset;
  }

  allocateString(str: string): number {
    const bytes = ArenaAllocator.encoder.encode(str);
    const byteOffset = this.allocateRawBytes(bytes.byteLength);
    this.uint8View.set(bytes, byteOffset);
    return byteOffset;
  }

  readString(byteOffset: number, byteLength: number): string {
    if (byteOffset < 0 || byteOffset + byteLength > this.uint8View.length) {
      throw new Error(`Out of bounds readString: offset ${byteOffset}, length ${byteLength}`);
    }
    return ArenaAllocator.decoder.decode(this.uint8View.subarray(byteOffset, byteOffset + byteLength));
  }

  getOffset(): number {
    return this.offset;
  }

  getCapacityBytes(): number {
    return this.buffer.byteLength;
  }

  getAllocatedBytes(): number {
    return this.offset * 4;
  }

  getResetCount(): number {
    return this.resetCount;
  }

  getUint32View(): Uint32Array {
    return this.uint32View;
  }

  getUint8View(): Uint8Array {
    return this.uint8View;
  }

  getBuffer(): ArrayBuffer {
    return this.buffer;
  }

  setOffset(offsetWords: number): void {
    if (offsetWords < 0 || offsetWords > this.uint32View.length) {
      throw new Error(`Invalid offsetWords ${offsetWords}`);
    }
    this.offset = offsetWords;
  }

  reset(): void {
    this.offset = 0;
    this.resetCount += 1;
  }
}
