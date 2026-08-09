import type { EngineTickInput, EngineTickResult } from "../../../core/contracts/agent.contracts.js";
import type { MonolithGatewayServer } from "../../../tooling/extensions/gateway/monolith-gateway-server.js";
import type { LumiMonolith } from "../../../index.js";

/**
 * RemoteSessionHandle.
 * Absorbed from packages/client/src/session-handle.ts (Pass 35 / ADR-012).
 *
 * Lightweight handle proxying engine tick requests to a remote LumiMonolith gateway server.
 */
export class RemoteSessionHandle {
  readonly remoteSessionId: string;
  private readonly gatewayServer: MonolithGatewayServer;
  private readonly targetMonolith: LumiMonolith;

  constructor(
    remoteSessionId: string,
    gatewayServer: MonolithGatewayServer,
    targetMonolith: LumiMonolith
  ) {
    this.remoteSessionId = remoteSessionId;
    this.gatewayServer = gatewayServer;
    this.targetMonolith = targetMonolith;
  }

  async tickRemote(input: EngineTickInput): Promise<EngineTickResult> {
    const jsonRpcReq = JSON.stringify({
      jsonrpc: "2.0",
      id: `tick-${Date.now()}`,
      method: "engine/tick",
      params: input,
    });

    const resRaw = await this.gatewayServer.handleJsonRpcRequest(jsonRpcReq, this.targetMonolith);
    const parsed = JSON.parse(resRaw);
    return parsed.result as EngineTickResult;
  }
}
