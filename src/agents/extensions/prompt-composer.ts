import type { AgentConfig } from "../base/agent-config.js";
import type { SessionContext } from "../../sessions/base/session-context.js";
import type { ValidatingToolRegistry } from "../../tooling/extensions/tool-registry.js";
import type { SkillManifest } from "../../tooling/extensions/skills-ingestor.js";
import type { MemoryEntry } from "../../sessions/extensions/session-memory-store.js";
import type { ToolDefinition } from "../../core/contracts/tooling.contracts.js";

export interface SystemPromptContext {
  config: AgentConfig;
  sessionContext: SessionContext;
  toolRegistry: ValidatingToolRegistry;
  skills?: SkillManifest[];
  memories?: MemoryEntry[];
}

export class PromptComposer {
  composeSystemPrompt(context: SystemPromptContext): string {
    const { config, sessionContext, toolRegistry, skills = [], memories = [] } = context;

    const sections: string[] = [];

    sections.push(`${config.systemPrompt}`);
    sections.push(`Model: ${config.modelName} | Max Turns: ${config.maxTurns} | Temp: ${config.temperature}`);

    sections.push(`## Active Session Context\n- Session ID: ${sessionContext.sessionId}\n- CWD: ${sessionContext.cwd}\n- Current Frame/Turn: ${sessionContext.turnCount}`);

    const tools = toolRegistry.listTools();
    if (tools.length > 0) {
      const toolLines = tools.map((t: ToolDefinition) => `- **${t.name}**: ${t.description}`).join("\n");
      sections.push(`## Available Tool Capabilities\n${toolLines}`);
    }

    if (skills.length > 0) {
      const skillLines = skills.map((s: SkillManifest) => `- **${s.name}**: ${s.description}`).join("\n");
      sections.push(`## Workspace Skills Available\n${skillLines}`);
    }

    if (memories.length > 0) {
      const memoryLines = memories.map((m: MemoryEntry) => `- [${m.category.toUpperCase()}] **${m.key}**: ${m.value}`).join("\n");
      sections.push(`## Persistent Memory Facts & KIs\n${memoryLines}`);
    }

    return sections.join("\n\n");
  }
}
