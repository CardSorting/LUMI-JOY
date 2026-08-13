import type { AgentConfig } from "../../base/agent-config.js";
import type { SessionContext } from "../../../sessions/base/session-context.js";
import type { SessionMessage } from "../../../core/contracts/session.contracts.js";
import { BroccoliCognitiveSuggestionEngine } from "../intelligence/broccolidb-cognitive-suggestion.js";

export interface PromptComposerInput {
  config: AgentConfig;
  sessionContext: SessionContext;
  messages: SessionMessage[];
  skillsContext?: string;
  memoryContext?: string;
}

export class PromptComposer {
  readonly suggestionEngine = new BroccoliCognitiveSuggestionEngine();
  composeSystemPrompt(config: AgentConfig, skillsContext?: string, memoryContext?: string): string {
    let prompt = `You are LUMI, an intelligent AI pair programmer operating inside deterministic game engine monolith runtime.
Active Model: ${config.modelName}

## Instructions
- Be concise, direct, and technical.
- Proactively write high quality TypeScript code.`;

    if (skillsContext) {
      prompt += `\n\n## Available Skills\n${skillsContext}`;
    }

    if (memoryContext) {
      prompt += `\n\n## Long-Term Memory Fact Store\n${memoryContext}`;
    }

    return prompt;
  }

  compileTurnMessages(input: PromptComposerInput): SessionMessage[] {
    const systemContent = this.composeSystemPrompt(
      input.config,
      input.skillsContext,
      input.memoryContext
    );

    const systemMessage: SessionMessage = {
      role: "system",
      content: systemContent,
      timestamp: Date.now(),
    };

    return [systemMessage, ...input.messages];
  }
}
