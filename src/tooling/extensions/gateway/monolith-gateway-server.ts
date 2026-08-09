import type { LumiMonolith } from "../../../index.js";
import type { JsonRpcNotification } from "../../../core/contracts/tooling.contracts.js";

export interface GatewayRequestEnvelope {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export interface GatewayResponseEnvelope {
  jsonrpc: "2.0";
  id: string | number;
  result?: unknown;
  error?: { code: number; message: string };
}

/**
 * MonolithGatewayServer.
 * Absorbed from packages/server (Pass 17 / ADR-012).
 *
 * Provides a remote JSON-RPC 2.0 RPC gateway for web applications, webviews, and external client tools.
 */
export class MonolithGatewayServer {
  async handleJsonRpcRequest(rawJson: string, monolith: LumiMonolith): Promise<string> {
    let req: GatewayRequestEnvelope;
    try {
      req = JSON.parse(rawJson);
    } catch {
      return JSON.stringify({
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "Parse error: Invalid JSON" },
      });
    }

    try {
      if (req.method === "engine/tick") {
        const prompt = String(req.params?.prompt ?? "");
        const tickResult = await monolith.tick({ prompt });
        return this.formatSuccess(req.id, tickResult);
      }

      if (req.method === "engine/snapshot") {
        const snapshot = monolith.createSnapshot();
        return this.formatSuccess(req.id, snapshot);
      }

      if (req.method === "engine/audit") {
        const cwd = String(req.params?.cwd ?? monolith.sessionContext.cwd);
        const audit = await monolith.stabilityDoctor.auditEnvironment(cwd, monolith.eyes);
        return this.formatSuccess(req.id, audit);
      }

      return JSON.stringify({
        jsonrpc: "2.0",
        id: req.id,
        error: { code: -32601, message: `Method '${req.method}' not found` },
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return JSON.stringify({
        jsonrpc: "2.0",
        id: req.id,
        error: { code: -32603, message: `Internal server error: ${errorMsg}` },
      });
    }
  }

  private formatSuccess(id: string | number, result: unknown): string {
    const res: GatewayResponseEnvelope = {
      jsonrpc: "2.0",
      id,
      result,
    };
    return JSON.stringify(res);
  }
}
