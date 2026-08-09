export interface ProcessHandle {
  pid: number;
  name: string;
  command: string;
  startedAt: number;
  active: boolean;
}

/**
 * Pass 89: Process Lifecycle Manager
 * Ingests sub-process management and process tree lifecycle concepts from `packages/utils/src/procmgr.ts`.
 * Tracks spawned child processes and manages graceful/forced process termination.
 */
export class ProcessLifecycleManager {
  private processes: Map<number, ProcessHandle>;

  constructor() {
    this.processes = new Map();
  }

  registerProcess(pid: number, name: string, command = ""): ProcessHandle {
    const handle: ProcessHandle = {
      pid,
      name,
      command,
      startedAt: Date.now(),
      active: true,
    };
    this.processes.set(pid, handle);
    return handle;
  }

  terminateProcess(pid: number): boolean {
    const handle = this.processes.get(pid);
    if (!handle || !handle.active) {
      return false;
    }
    handle.active = false;
    return true;
  }

  getActiveProcesses(): readonly ProcessHandle[] {
    return Array.from(this.processes.values()).filter((p) => p.active);
  }

  killAll(): number {
    let count = 0;
    for (const handle of this.processes.values()) {
      if (handle.active) {
        handle.active = false;
        count++;
      }
    }
    return count;
  }
}
