import * as path from "node:path";
import * as os from "node:os";

export interface SystemDirectories {
  homeDir: string;
  configDir: string;
  appDataDir: string;
  cacheDir: string;
  tempDir: string;
}

/**
 * SystemDirectoryResolver.
 * Absorbed from packages/utils/src/dirs.ts (Pass 46 / ADR-012).
 *
 * Resolves standard system configuration, app data, cache, and temporary directories cross-platform.
 */
export class SystemDirectoryResolver {
  private readonly appName: string;

  constructor(appName = "lumi") {
    this.appName = appName;
  }

  getDirectories(): SystemDirectories {
    const homeDir = os.homedir();
    const tempDir = os.tmpdir();

    let configDir = process.env.XDG_CONFIG_HOME;
    if (!configDir) {
      configDir = process.platform === "darwin"
        ? path.join(homeDir, "Library", "Application Support", this.appName)
        : path.join(homeDir, ".config", this.appName);
    }

    let cacheDir = process.env.XDG_CACHE_HOME;
    if (!cacheDir) {
      cacheDir = process.platform === "darwin"
        ? path.join(homeDir, "Library", "Caches", this.appName)
        : path.join(homeDir, ".cache", this.appName);
    }

    const appDataDir = path.join(homeDir, `.${this.appName}`);

    return {
      homeDir,
      configDir,
      appDataDir,
      cacheDir,
      tempDir,
    };
  }
}
