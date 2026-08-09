import type { IToolRegistry, ToolDefinition } from "../contracts/tooling.contracts.js";
import type { Eyes } from "../../tooling/base/eyes.js";
import type { AbstractHands } from "./abstract-hands.js";
import type { AbstractEars } from "./abstract-ears.js";

export abstract class AbstractToolRegistry implements IToolRegistry {
  readonly eyes: Eyes;
  readonly hands: AbstractHands;
  readonly ears: AbstractEars;
  protected readonly tools: Map<string, ToolDefinition>;

  constructor(eyes: Eyes, hands: AbstractHands, ears: AbstractEars) {
    this.eyes = eyes;
    this.hands = hands;
    this.ears = ears;
    this.tools = new Map();
  }

  registerTool(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  listTools(): readonly ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  async executeTool(
    name: string,
    args: Record<string, unknown>,
    cwd: string
  ): Promise<unknown> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool standard target '${name}' not found in registry`);
    }
    this.ears.emit("tool_start", "AbstractToolRegistry", { name, args });
    try {
      const result = await tool.execute(args, cwd);
      this.ears.emit("tool_success", "AbstractToolRegistry", { name, result });
      return result;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.ears.emit("tool_error", "AbstractToolRegistry", { name, error: errorMessage });
      throw err;
    }
  }

  protected abstract registerBuiltins(): void;
}
