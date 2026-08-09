import * as path from "node:path";
import type { Eyes } from "../../base/eyes.js";

export interface SkillManifest {
  name: string;
  description: string;
  location: string;
  body: string;
}

export class SkillsIngestor {
  private readonly eyes: Eyes;

  constructor(eyes: Eyes) {
    this.eyes = eyes;
  }

  async discoverSkills(workspaceRoot: string): Promise<SkillManifest[]> {
    const skillsDir = path.join(workspaceRoot, ".agents", "skills");
    const manifests: SkillManifest[] = [];

    const exists = await this.eyes.exists(skillsDir);
    if (!exists) {
      return manifests;
    }

    const skillFolders = await this.eyes.listDirectory(skillsDir);
    for (const folder of skillFolders) {
      const skillPath = path.join(skillsDir, folder.replace(/\/$/, ""), "SKILL.md");
      const fileExists = await this.eyes.exists(skillPath);
      if (fileExists) {
        try {
          const viewResult = await this.eyes.readFile(skillPath);
          const manifest = this.parseSkillMarkdown(folder.replace(/\/$/, ""), skillPath, viewResult.content);
          manifests.push(manifest);
        } catch {
          // ignore unreadable skills
        }
      }
    }

    return manifests;
  }

  parseSkillMarkdown(folderName: string, filePath: string, rawContent: string): SkillManifest {
    let name = folderName;
    let description = "Workspace Skill";
    let body = rawContent;

    const frontmatterMatch = rawContent.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (frontmatterMatch) {
      const yamlStr = frontmatterMatch[1];
      body = frontmatterMatch[2].trim();

      const nameMatch = yamlStr.match(/^name:\s*(.+)$/m);
      if (nameMatch) name = nameMatch[1].trim();

      const descMatch = yamlStr.match(/^description:\s*(.+)$/m);
      if (descMatch) description = descMatch[1].trim();
    }

    return {
      name,
      description,
      location: filePath,
      body,
    };
  }

  formatSkillsContext(manifests: SkillManifest[]): string {
    if (manifests.length === 0) return "";
    const formatted = manifests
      .map((m) => `### Skill: ${m.name}\n**Description**: ${m.description}\n**Path**: ${m.location}`)
      .join("\n\n");
    return formatted;
  }
}
