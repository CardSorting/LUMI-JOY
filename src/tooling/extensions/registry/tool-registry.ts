import { AbstractToolRegistry } from "../../../core/abstracts/abstract-tool-registry.js";
import type { SchemaValidationResult } from "../../../core/contracts/tooling.contracts.js";
import type { Eyes } from "../../base/eyes.js";
import type { AstPerceptionEyes } from "../perception/ast-eyes.js";
import type { AnchoredHands } from "../hashline/hands.js";
import type { ProtocolEars } from "../telemetry/ears.js";
import { SkillsIngestor } from "./skills-ingestor.js";
import type { SessionMemoryStore } from "../../../sessions/extensions/memory/session-memory-store.js";

import { BroccoliCircuitBreaker } from "../policy/broccoli-circuit-breaker.js";
import { ModuleDecomposer } from "../policy/module-decomposer.js";
import { StabilityDoctor } from "../../../sessions/extensions/integrity/stability-doctor.js";
import { BroccoliStreamingToolExecutor } from "./broccolidb-streaming-tool-executor.js";

export class ValidatingToolRegistry extends AbstractToolRegistry {
  readonly skillsIngestor: SkillsIngestor;
  readonly memoryStore?: SessionMemoryStore;
  readonly moduleDecomposer: ModuleDecomposer;
  readonly stabilityDoctor: StabilityDoctor;
  readonly circuitBreaker: BroccoliCircuitBreaker;
  readonly streamingExecutor: BroccoliStreamingToolExecutor;

  constructor(
    eyes: Eyes,
    hands: AnchoredHands,
    ears: ProtocolEars,
    skillsIngestor?: SkillsIngestor,
    memoryStore?: SessionMemoryStore
  ) {
    super(eyes, hands, ears);
    this.skillsIngestor = skillsIngestor ?? new SkillsIngestor(eyes);
    this.memoryStore = memoryStore;
    this.moduleDecomposer = new ModuleDecomposer();
    this.stabilityDoctor = new StabilityDoctor();
    this.circuitBreaker = new BroccoliCircuitBreaker();
    this.streamingExecutor = new BroccoliStreamingToolExecutor();
    this.registerBuiltins();
  }

  validateToolArgs(name: string, args: Record<string, unknown>): SchemaValidationResult {
    const tool = this.tools.get(name);
    if (!tool) {
      return { valid: false, errors: [`Tool '${name}' not found`] };
    }

    if (!tool.parameters) {
      return { valid: true, errors: [] };
    }

    const errors: string[] = [];
    for (const [paramName, schema] of Object.entries(tool.parameters)) {
      const val = args[paramName];
      if (schema.required && (val === undefined || val === null || val === "")) {
        errors.push(`Missing required parameter '${paramName}'`);
        continue;
      }
      if (val !== undefined && val !== null) {
        const actualType = typeof val;
        if (actualType !== schema.type) {
          errors.push(`Parameter '${paramName}' must be of type '${schema.type}', got '${actualType}'`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  override async executeTool(
    name: string,
    args: Record<string, unknown>,
    cwd: string
  ): Promise<unknown> {
    if (!this.circuitBreaker.canExecute(name)) {
      throw new Error(`Circuit Breaker OPEN: Execution of tool '${name}' is temporarily blocked due to repeated failures.`);
    }

    const validation = this.validateToolArgs(name, args);
    if (!validation.valid) {
      this.circuitBreaker.recordFailure(name);
      throw new Error(`Tool '${name}' argument schema validation failed: ${validation.errors.join("; ")}`);
    }

    try {
      const result = await super.executeTool(name, args, cwd);
      this.circuitBreaker.recordSuccess(name);
      return result;
    } catch (err) {
      this.circuitBreaker.recordFailure(name);
      throw err;
    }
  }

  protected registerBuiltins(): void {
    const hands = this.hands as AnchoredHands;

    this.registerTool({
      name: "view_file",
      description: "Read contents of a file (Eyes)",
      parameters: {
        path: { type: "string", required: true, description: "Absolute or relative file path" },
      },
      execute: async (args) => {
        const filePath = String(args.path);
        const startLine = typeof args.startLine === "number" ? args.startLine : undefined;
        const endLine = typeof args.endLine === "number" ? args.endLine : undefined;
        return this.eyes.readFile(filePath, { startLine, endLine });
      },
    });

    this.registerTool({
      name: "write_file",
      description: "Write content to a file (Hands)",
      parameters: {
        path: { type: "string", required: true, description: "Target file path" },
        content: { type: "string", required: true, description: "Content string" },
      },
      execute: async (args) => {
        const filePath = String(args.path);
        const content = String(args.content);
        await hands.writeFile(filePath, content);
        return { success: true, path: filePath };
      },
    });

    this.registerTool({
      name: "edit_file_anchored",
      description: "Apply hash-anchored line edit to a file (Hands - hashline)",
      parameters: {
        path: { type: "string", required: true },
        line: { type: "number", required: true },
        hash: { type: "string", required: true },
        replacement: { type: "string", required: true },
      },
      execute: async (args) => {
        const filePath = String(args.path);
        const line = Number(args.line);
        const hash = String(args.hash);
        const replacement = String(args.replacement);
        return hands.applyAnchoredEdit(filePath, line, hash, replacement);
      },
    });

    this.registerTool({
      name: "run_command",
      description: "Execute a shell command (Hands)",
      parameters: {
        command: { type: "string", required: true, description: "Shell command string" },
      },
      execute: async (args, cwd) => {
        const command = String(args.command);
        const effectiveCwd = typeof args.cwd === "string" ? args.cwd : cwd;
        return hands.runCommand(command, effectiveCwd);
      },
    });

    this.registerTool({
      name: "list_skills",
      description: "Discover available workspace skill manifests (SkillsIngestor)",
      execute: async (_args, cwd) => {
        return this.skillsIngestor.discoverSkills(cwd);
      },
    });

    this.registerTool({
      name: "search_memory",
      description: "Search long-term agent memories & Knowledge Items (SessionMemoryStore)",
      parameters: {
        query: { type: "string", required: true },
      },
      execute: async (args) => {
        if (!this.memoryStore) return [];
        const query = String(args.query ?? "");
        return this.memoryStore.searchMemories(query);
      },
    });

    this.registerTool({
      name: "save_memory",
      description: "Save a persistent fact or Knowledge Item (SessionMemoryStore)",
      parameters: {
        key: { type: "string", required: true },
        value: { type: "string", required: true },
      },
      execute: async (args) => {
        if (!this.memoryStore) return { success: false, reason: "No memory store configured" };
        const key = String(args.key);
        const value = String(args.value);
        const category = (args.category as "fact" | "rule" | "troubleshooting" | "ki") ?? "fact";
        const entry = this.memoryStore.saveMemory(key, value, category);
        return { success: true, entry };
      },
    });

    this.registerTool({
      name: "search_symbols",
      description: "Search AST code symbols (classes, functions, interfaces, types) in workspace (Eyes)",
      parameters: {
        query: { type: "string", required: true, description: "Symbol name or substring to match" },
      },
      execute: async (args, cwd) => {
        const query = String(args.query);
        const searchPath = typeof args.path === "string" ? args.path : cwd;
        const astEyes = this.eyes as AstPerceptionEyes;
        return astEyes.searchSymbols ? astEyes.searchSymbols(searchPath, query) : [];
      },
    });

    this.registerTool({
      name: "audit_symbols",
      description: "Audit workspace orphan zombie symbols and module coupling metrics (ModuleDecomposer)",
      execute: async (_args, cwd) => {
        return this.moduleDecomposer.auditZombieSymbols(cwd, this.eyes);
      },
    });

    this.registerTool({
      name: "audit_integrity",
      description: "Audit workspace environmental leases, write access, and forensic healing (StabilityDoctor)",
      execute: async (_args, cwd) => {
        return this.stabilityDoctor.auditEnvironment(cwd, this.eyes);
      },
    });
  }
}

export { ValidatingToolRegistry as ToolRegistry };
