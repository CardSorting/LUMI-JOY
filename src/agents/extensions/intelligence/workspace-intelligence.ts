import * as path from "node:path";
import type { Eyes } from "../../../tooling/base/eyes.js";

export interface WorkspaceCognitiveModel {
  packageName: string;
  packageVersion: string;
  cwd: string;
  architecturalSurfaces: string[];
  manifests: string[];
  topologyNodeCount: number;
  lastIndexedAt: number;
}

/**
 * WorkspaceIntelligenceEngine.
 * Absorbed from packages/codemarie/src/core/workspace-intelligence (Pass 13 / ADR-012).
 *
 * Maintains a persistent cognitive graph model of workspace package identity,
 * file structure topology, and architectural surfaces.
 */
export class WorkspaceIntelligenceEngine {
  private cognitiveModel: WorkspaceCognitiveModel | null = null;

  async buildCognitiveModel(cwd: string, eyes: Eyes): Promise<WorkspaceCognitiveModel> {
    let packageName = "unknown";
    let packageVersion = "0.0.0";
    const manifests: string[] = [];

    try {
      const pkgData = await eyes.readFile(path.join(cwd, "package.json"));
      manifests.push("package.json");
      const parsed = JSON.parse(pkgData.content);
      if (typeof parsed.name === "string") packageName = parsed.name;
      if (typeof parsed.version === "string") packageVersion = parsed.version;
    } catch {
      // Manifest unreadable
    }

    const architecturalSurfaces: string[] = [];
    let topologyNodeCount = 0;

    try {
      const entries = await eyes.listDirectory(cwd);
      topologyNodeCount = entries.length;

      for (const surface of ["src", "packages", ".wiki", ".agents", "docs"]) {
        if (entries.includes(surface)) {
          architecturalSurfaces.push(surface);
        }
      }
    } catch {
      // Directory listing fallback
    }

    const model: WorkspaceCognitiveModel = {
      packageName,
      packageVersion,
      cwd,
      architecturalSurfaces,
      manifests,
      topologyNodeCount,
      lastIndexedAt: Date.now(),
    };

    this.cognitiveModel = model;
    return model;
  }

  getCognitiveModel(): WorkspaceCognitiveModel | null {
    return this.cognitiveModel;
  }
}
