import { BroccoliVerificationPipeline } from "../../../agents/extensions/intelligence/broccolidb-verification-pipeline.js";
import { BroccoliContextDiagnosisService } from "./broccolidb-context-diagnosis.js";

export interface ExceptionRecord {
  id: string;
  timestamp: number;
  message: string;
  stack?: string;
  severity: "warning" | "error" | "fatal";
}

export interface PostmortemReport {
  generatedAt: number;
  totalExceptions: number;
  fatalCount: number;
  records: readonly ExceptionRecord[];
  healthy: boolean;
}

/**
 * Pass 88: Postmortem Diagnostic
 * Ingests crash diagnostic & exception reporting concepts from `packages/utils/src/postmortem.ts`.
 * Captures process exceptions, tracks system stability, and generates postmortem diagnostic reports.
 */
export class PostmortemDiagnostic {
  private records: ExceptionRecord[];
  private fatalCount: number;
  readonly verificationPipeline = new BroccoliVerificationPipeline();
  readonly contextDiagnosis = new BroccoliContextDiagnosisService();

  constructor() {
    this.records = [];
    this.fatalCount = 0;
  }

  recordException(
    err: Error | string,
    severity: "warning" | "error" | "fatal" = "error"
  ): ExceptionRecord {
    const message = typeof err === "string" ? err : err.message;
    const stack = typeof err === "string" ? undefined : err.stack;
    const id = `exp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const record: ExceptionRecord = {
      id,
      timestamp: Date.now(),
      message,
      stack,
      severity,
    };

    this.records.push(record);
    if (severity === "fatal") {
      this.fatalCount++;
    }

    return record;
  }

  generateReport(): PostmortemReport {
    return {
      generatedAt: Date.now(),
      totalExceptions: this.records.length,
      fatalCount: this.fatalCount,
      records: [...this.records],
      healthy: this.fatalCount === 0,
    };
  }

  hasFatalCrash(): boolean {
    return this.fatalCount > 0;
  }

  reset(): void {
    this.records = [];
    this.fatalCount = 0;
  }
}
