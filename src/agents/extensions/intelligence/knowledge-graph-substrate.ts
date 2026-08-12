/**
 * [LAYER: AGENTS EXTENSION]
 * Pass 110: Cognitive Knowledge Graph Substrate
 *
 * Provides typed knowledge nodes, directional edges, BFS graph traversal,
 * tag-based searching, and hub-score importance ranking for workspace understanding.
 */

import { randomUUID } from "node:crypto";
import { BroccoliEpistemicReasoningEngine, type ContradictionReport } from "./broccolidb-epistemic-reasoning.js";

export interface KnowledgeNode {
  id: string;
  type: string;
  content: string;
  tags: string[];
  confidence: number;
  hubScore: number;
  metadata?: Record<string, unknown>;
  createdAt: number;
}

export interface KnowledgeEdge {
  sourceId: string;
  targetId: string;
  type: string;
  weight: number;
  createdAt: number;
}

export interface GraphTraversalFilter {
  edgeTypes?: string[];
  minWeight?: number;
  direction?: "outbound" | "inbound" | "both";
  maxDepth?: number;
}

export class KnowledgeGraphSubstrate {
  private readonly nodes = new Map<string, KnowledgeNode>();
  private readonly edges: KnowledgeEdge[] = [];
  readonly reasoningEngine = new BroccoliEpistemicReasoningEngine();

  /**
   * Computes Epistemic PageRank scores across graph nodes.
   */
  public computeEpistemicPageRank(iterations: number = 10, dampingFactor: number = 0.85): Record<string, number> {
    const allNodes = Array.from(this.nodes.values());
    const ranks = this.reasoningEngine.calculateEpistemicPageRank(allNodes, this.edges, iterations, dampingFactor);
    for (const node of allNodes) {
      if (ranks[node.id] !== undefined) {
        node.confidence = Math.round(ranks[node.id] * 1000) / 1000;
      }
    }
    return ranks;
  }

  /**
   * Detects logical contradiction relations in the graph.
   */
  public detectContradictions(): ContradictionReport[] {
    return this.reasoningEngine.detectContradictions(Array.from(this.nodes.values()), this.edges);
  }

  /**
   * Adds a knowledge node to the graph.
   */
  public addNode(
    type: string,
    content: string,
    tags: string[] = [],
    confidence: number = 1.0,
    metadata?: Record<string, unknown>
  ): KnowledgeNode {
    const node: KnowledgeNode = {
      id: randomUUID(),
      type,
      content,
      tags,
      confidence,
      hubScore: 0,
      metadata,
      createdAt: Date.now(),
    };
    this.nodes.set(node.id, node);
    this.recalculateHubScores();
    return node;
  }

  /**
   * Adds a directional weighted edge between two nodes.
   */
  public addEdge(
    sourceId: string,
    targetId: string,
    type: string = "relates_to",
    weight: number = 1.0
  ): KnowledgeEdge | null {
    if (!this.nodes.has(sourceId) || !this.nodes.has(targetId)) {
      return null;
    }

    const edge: KnowledgeEdge = {
      sourceId,
      targetId,
      type,
      weight,
      createdAt: Date.now(),
    };
    this.edges.push(edge);
    this.recalculateHubScores();
    return edge;
  }

  /**
   * Recalculates node hub-scores based on degree centrality.
   */
  private recalculateHubScores(): void {
    const degreeMap = new Map<string, number>();
    for (const edge of this.edges) {
      degreeMap.set(edge.sourceId, (degreeMap.get(edge.sourceId) ?? 0) + edge.weight);
      degreeMap.set(edge.targetId, (degreeMap.get(edge.targetId) ?? 0) + edge.weight);
    }

    for (const [id, node] of this.nodes.entries()) {
      node.hubScore = degreeMap.get(id) ?? 0;
    }
  }

  /**
   * Retrieves nodes matching any of the specified tags.
   */
  public searchByTags(tags: string[]): KnowledgeNode[] {
    const lowerTags = tags.map((t) => t.toLowerCase());
    const results: KnowledgeNode[] = [];

    for (const node of this.nodes.values()) {
      if (node.tags.some((t) => lowerTags.includes(t.toLowerCase()))) {
        results.push(node);
      }
    }

    return results.sort((a, b) => b.hubScore - a.hubScore);
  }

  /**
   * Performs a breadth-first search (BFS) traversal starting from a given node.
   */
  public traverse(startNodeId: string, filter: GraphTraversalFilter = {}): KnowledgeNode[] {
    const startNode = this.nodes.get(startNodeId);
    if (!startNode) return [];

    const maxDepth = filter.maxDepth ?? 3;
    const direction = filter.direction ?? "both";
    const minWeight = filter.minWeight ?? 0;

    const visited = new Set<string>([startNodeId]);
    const queue: Array<{ id: string; depth: number }> = [{ id: startNodeId, depth: 0 }];
    const result: KnowledgeNode[] = [startNode];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.depth >= maxDepth) continue;

      for (const edge of this.edges) {
        if (edge.weight < minWeight) continue;
        if (filter.edgeTypes && !filter.edgeTypes.includes(edge.type)) continue;

        let nextId: string | null = null;
        if ((direction === "outbound" || direction === "both") && edge.sourceId === current.id) {
          nextId = edge.targetId;
        } else if ((direction === "inbound" || direction === "both") && edge.targetId === current.id) {
          nextId = edge.sourceId;
        }

        if (nextId && !visited.has(nextId)) {
          visited.add(nextId);
          const nextNode = this.nodes.get(nextId);
          if (nextNode) {
            result.push(nextNode);
            queue.push({ id: nextId, depth: current.depth + 1 });
          }
        }
      }
    }

    return result;
  }

  /**
   * Returns top hub nodes ordered by hub score.
   */
  public getTopHubNodes(limit: number = 10): KnowledgeNode[] {
    return Array.from(this.nodes.values())
      .sort((a, b) => b.hubScore - a.hubScore)
      .slice(0, limit);
  }

  /**
   * Returns graph summary metrics.
   */
  public getMetrics(): { nodeCount: number; edgeCount: number } {
    return {
      nodeCount: this.nodes.size,
      edgeCount: this.edges.length,
    };
  }

  /**
   * Clears the graph state.
   */
  public clear(): void {
    this.nodes.clear();
    this.edges.length = 0;
  }
}
