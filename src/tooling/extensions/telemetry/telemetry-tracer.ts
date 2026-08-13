import { BroccoliExecutionTraceRecorder } from "./broccolidb-execution-trace.js";

export interface ActiveSpan {
  name: string;
  startTime: number;
  attributes: Record<string, unknown>;
  events: Array<{ name: string; timestamp: number; attributes?: Record<string, unknown> }>;
  status: "ok" | "error";
}

/**
 * TelemetryTracer.
 * Absorbed from packages/telemetry (Pass 19 / ADR-012).
 *
 * Provides OpenTelemetry-compatible tracing spans, microsecond timing metrics,
 * and span attribute tagging for agent frame ticks.
 */
export class TelemetryTracer {
  private readonly activeSpans: ActiveSpan[] = [];
  readonly traceRecorder = new BroccoliExecutionTraceRecorder();

  async startSpan<T>(
    spanName: string,
    callback: (span: ActiveSpan) => Promise<T> | T,
    initialAttributes: Record<string, unknown> = {}
  ): Promise<T> {
    const span: ActiveSpan = {
      name: spanName,
      startTime: performance.now(),
      attributes: { ...initialAttributes },
      events: [],
      status: "ok",
    };

    this.activeSpans.push(span);

    try {
      const result = await callback(span);
      return result;
    } catch (err) {
      span.status = "error";
      span.attributes["error.message"] = String(err);
      throw err;
    }
  }

  addEvent(span: ActiveSpan, name: string, attributes?: Record<string, unknown>): void {
    span.events.push({
      name,
      timestamp: performance.now(),
      attributes,
    });
  }

  getCompletedSpans(): readonly ActiveSpan[] {
    return this.activeSpans;
  }
}
