export type EngineProgressPhase =
  | "connecting"
  | "thinking"
  | "planning"
  | "tool"
  | "writing"
  | "verifying"
  | "responding"
  | "completed"
  | "failed"
  | "cancelled";

export type EngineProgressStatus =
  | "started"
  | "in_progress"
  | "completed"
  | "failed"
  | "cancelled";

export interface EngineProgressMetadata {
  source?: "codex-sdk" | "openai-api" | "lumi";
  itemType?: string;
  files?: readonly string[];
  exitCode?: number;
  completedSteps?: number;
  totalSteps?: number;
  inputTokens?: number;
  outputTokens?: number;
}

export interface EngineProgressEvent {
  /** Stable identity used by renderers to update an activity in place. */
  activityId: string;
  phase: EngineProgressPhase;
  status: EngineProgressStatus;
  message: string;
  /** Optional safe, user-facing context. Never contains tool output or secrets. */
  detail?: string;
  timestamp: number;
  /** Time spent in this activity or in the overall turn. */
  elapsedMs?: number;
  /** Monotonically increasing sequence number within a turn. */
  sequence: number;
  metadata?: EngineProgressMetadata;
}

export interface EngineTickInput {
  prompt: string;
  /** Cancels an in-flight local provider turn. */
  signal?: AbortSignal;
  /** Receives structured lifecycle updates without exposing raw model reasoning. */
  onProgress?: (event: EngineProgressEvent) => void;
}

export interface EngineTickResult {
  frameIndex: number;
  activeModel: string;
  isFallbackModel: boolean;
  isSlashCommand?: boolean;
  composedPrompt: string;
  response: string;
  toolResults: Array<{ name: string; output: unknown }>;
  durationMs?: number;
}

export interface IAgentEngine {
  tick(input: EngineTickInput): Promise<EngineTickResult>;
}
