export interface EngineTickInput {
  prompt: string;
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
