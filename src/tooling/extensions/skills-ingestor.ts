import * as path from "node:path";
import { Eyes } from "../base/eyes.js";

export interface SkillManifest {
  name: string;
  description: string;
  filePath: string;
  instructions: string;
}

export class SkillsIngestor {
  readonly eyes: Eyes;

  constructor(eyes: Eyes) {
    this.eyes = eyes;
  }

  async discoverSkills(workspaceCwd: string): Promise<SkillManifest[]> {
    const candidateDirs = [
      path.join(workspaceCwd, ".agents", "skills"),
      path.join(workspaceCwd, "skills"),
    ];

    const discovered: SkillManifest[] = [];

    for (const dir of candidateDirs) {
      if (!(await this.eyes.exists(dir))) {
        continue;
      }
      const entries = await this.eyes.listDirectory(dir);
      for (const entry of entries) {
        if (!entry.endsWith("/")) continue;
        const skillName = entry.slice(0, -1);
        const skillFile = path.join(dir, skillName, "SKILL.md");

        if (await this.eyes.exists(skillFile)) {
          const fileData = await this.eyes.readFile(skillFile);
          const manifest = this.parseSkillContent(skillName, skillFile, fileData.content);
          discovered.push(manifest);
        }
      }
    }

    return discovered;
  }

  private parseSkillContent(name: string, filePath: string, rawContent: string): SkillManifest {
    let description = "Custom skill instructions";
    let instructions = rawContent;

    if (rawContent.startsWith("---")) {
      const parts = rawContent.split("---");
      if (parts.length >= 3) {
        const frontmatter = parts[1];
        instructions = parts.slice(2).join("---").trim();
        for (const line of frontmatter.split("\n")) {
          if (line.startsWith("description:")) {
            description = line.replace("description:", "").trim();
          }
        }
      }
    }

    return {
      name,
      description,
      filePath,
      instructions,
    };
  }
}
