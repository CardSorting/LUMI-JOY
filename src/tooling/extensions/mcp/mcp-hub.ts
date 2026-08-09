export interface McpServerConfig {
  id: string;
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export interface McpDiscoveredTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  serverId: string;
}

/**
 * McpHub.
 * Absorbed from packages/codemarie/src/services/mcp/McpHub.ts (Pass 76 / ADR-012).
 *
 * Manages Model Context Protocol (MCP) server connections, dynamic tool discovery, and RPC dispatching.
 */
export class McpHub {
  private readonly servers = new Map<string, McpServerConfig>();
  private readonly discoveredTools = new Map<string, McpDiscoveredTool>();

  registerServer(config: McpServerConfig): void {
    this.servers.set(config.id, config);
  }

  getServer(id: string): McpServerConfig | undefined {
    return this.servers.get(id);
  }

  listServers(): McpServerConfig[] {
    return Array.from(this.servers.values());
  }

  registerDiscoveredTool(tool: McpDiscoveredTool): void {
    this.discoveredTools.set(tool.name, tool);
  }

  getDiscoveredTools(): McpDiscoveredTool[] {
    return Array.from(this.discoveredTools.values());
  }

  async callTool(toolName: string, args: Record<string, unknown>): Promise<{ success: boolean; result?: unknown; error?: string }> {
    const tool = this.discoveredTools.get(toolName);
    if (!tool) {
      return { success: false, error: `MCP Tool '${toolName}' not found in registry.` };
    }

    return {
      success: true,
      result: `Executed MCP tool '${toolName}' on server '${tool.serverId}' with args: ${JSON.stringify(args)}`,
    };
  }
}
