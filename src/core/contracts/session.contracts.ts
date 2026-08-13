export interface SessionMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolCallId?: string;
  name?: string;
  timestamp: number;
}

export interface SlabBufferSnapshot {
  capacityBytes: number;
  offsetWords: number;
  allocatedBytes: number;
  resetCount: number;
}

export interface GameStateSnapshot {
  snapshotId: string;
  frameIndex: number;
  timestamp: number;
  messages: SessionMessage[];
  /** Durable, uncompacted conversation log. Optional for snapshot compatibility. */
  transcript?: SessionMessage[];
  stagedFiles: Array<{ path: string; originalContent: string; stagedContent: string; isNew: boolean }>;
  memories: Array<{ key: string; value: string; category: string; timestamp: number }>;
  modelMetrics: { totalTurns: number; totalTokensEstimated: number; fallbackTriggeredCount: number };
  slabSnapshot?: SlabBufferSnapshot;
}

export interface ISessionStore {
  addMessage(message: Omit<SessionMessage, "timestamp">): SessionMessage;
  getMessages(): readonly SessionMessage[];
  clear(): void;
}
