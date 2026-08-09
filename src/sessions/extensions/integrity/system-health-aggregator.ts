export interface SubsystemHealthStatus {
  subsystem: string;
  healthy: boolean;
  checkedAt: number;
  details?: string;
}

export interface AggregateHealthReport {
  timestamp: number;
  totalSubsystems: number;
  healthyCount: number;
  overallStatus: "OPTIMAL" | "DEGRADED" | "UNHEALTHY";
  statuses: SubsystemHealthStatus[];
}

/**
 * Pass 101: System Health Aggregator
 * Ingests subsystem diagnostic aggregation & multi-component integrity synthesis concepts from `packages/coding-agent/src/core/health.ts` and `packages/utils`.
 * Synthesizes health telemetry across agents, sessions, and tooling subsystems.
 */
export class SystemHealthAggregator {
  private healthCheckers: Map<string, () => boolean>;

  constructor() {
    this.healthCheckers = new Map();
    // Register default subsystem health checks
    this.registerHealthCheck("agents", () => true);
    this.registerHealthCheck("sessions", () => true);
    this.registerHealthCheck("tooling", () => true);
  }

  registerHealthCheck(subsystem: string, checkFn: () => boolean): void {
    this.healthCheckers.set(subsystem.toLowerCase(), checkFn);
  }

  aggregateHealth(): AggregateHealthReport {
    const statuses: SubsystemHealthStatus[] = [];
    let healthyCount = 0;

    for (const [subsystem, checkFn] of this.healthCheckers.entries()) {
      let isHealthy = false;
      try {
        isHealthy = checkFn();
      } catch {
        isHealthy = false;
      }

      if (isHealthy) {
        healthyCount++;
      }

      statuses.push({
        subsystem,
        healthy: isHealthy,
        checkedAt: Date.now(),
      });
    }

    const totalSubsystems = this.healthCheckers.size;
    let overallStatus: "OPTIMAL" | "DEGRADED" | "UNHEALTHY" = "OPTIMAL";

    if (healthyCount < totalSubsystems && healthyCount > 0) {
      overallStatus = "DEGRADED";
    } else if (healthyCount === 0 && totalSubsystems > 0) {
      overallStatus = "UNHEALTHY";
    }

    return {
      timestamp: Date.now(),
      totalSubsystems,
      healthyCount,
      overallStatus,
      statuses,
    };
  }

  getOverallStatus(): "OPTIMAL" | "DEGRADED" | "UNHEALTHY" {
    return this.aggregateHealth().overallStatus;
  }
}
