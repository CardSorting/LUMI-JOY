export interface SessionContextOptions {
  sessionId: string;
  cwd: string;
  maxTurnHistory?: number;
}

export class SessionContext {
  readonly sessionId: string;
  cwd: string;
  turnCount: number;
  readonly maxTurnHistory: number;

  constructor(options: SessionContextOptions) {
    this.sessionId = options.sessionId;
    this.cwd = options.cwd;
    this.turnCount = 0;
    this.maxTurnHistory = options.maxTurnHistory ?? 100;
  }

  incrementTurn(): number {
    this.turnCount += 1;
    return this.turnCount;
  }

  setCwd(newCwd: string): void {
    this.cwd = newCwd;
  }
}
