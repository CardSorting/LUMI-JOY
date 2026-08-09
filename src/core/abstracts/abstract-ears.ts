import { EventEmitter } from "node:events";
import type { IEars, ToolingEvent } from "../contracts/tooling.contracts.js";

export abstract class AbstractEars implements IEars {
  protected readonly emitter: EventEmitter;
  protected readonly eventLog: ToolingEvent[];

  constructor() {
    this.emitter = new EventEmitter();
    this.eventLog = [];
  }

  listen(eventType: string, callback: (event: ToolingEvent) => void): void {
    this.emitter.on(eventType, callback);
  }

  off(eventType: string, callback: (event: ToolingEvent) => void): void {
    this.emitter.off(eventType, callback);
  }

  emit(eventType: string, source: string, payload: Record<string, unknown>, durationMs?: number): void {
    const event: ToolingEvent = {
      type: eventType,
      source,
      payload,
      timestamp: Date.now(),
      durationMs,
    };
    this.eventLog.push(event);
    this.emitter.emit(eventType, event);
  }

  getEventLog(): readonly ToolingEvent[] {
    return this.eventLog;
  }

  clearLog(): void {
    this.eventLog.length = 0;
  }

  abstract startTimer(label: string): void;
  abstract endTimer(label: string): number;
}
