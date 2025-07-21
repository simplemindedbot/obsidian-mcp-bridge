import { exec } from "child_process";
import { promisify } from "util";
import { getLogger } from "./logger";

const execAsync = promisify(exec);

export interface ExecutableInfo {
  command: string;
  fullPath: string;
  version?: string;
}

export class PathResolver {
  private static cache = new Map<string, string>();
  private static readonly COMMON_PATHS = [
    "/usr/local/bin",
    "/opt/homebrew/bin",
    "/usr/bin",
    "/bin",
    "/opt/local/bin",
    "/usr/local/opt/node/bin",
    process.env.HOME + "/.nvm/current/bin",
    process.env.HOME + "/.npm-global/bin",
    process.env.HOME + "/node_modules/.bin",
  ];

  /**
   * Find the full path to an executable
   */
  static async findExecutable(command: string): Promise<string | null> {
    const logger = getLogger();

    // Check cache first
    if (this.cache.has(command)) {
      const cachedPath = this.cache.get(command);
      if (cachedPath) {
        logger.debug(
          "PathResolver",
          `Using cached path for ${command}: ${cachedPath}`,
        );
        return cachedPath;
      }
    }

    logger.debug("PathResolver", `Searching for executable: ${command}`);

    // Method 1: Try 'which' command (most reliable)
    try {
      const { stdout } = await execAsync(`which ${command}`);
      const path = stdout.trim();
      if (path && path !== "") {
        this.cache.set(command, path);
        logger.info("PathResolver", `Found ${command} at: ${path}`);
        return path;
      }
    } catch (error) {
      logger.debug(
        "PathResolver",
        `'which' command failed for ${command}`,
        { command, context: { type: 'which_command_failed' } }
      );
    }

    // Method 2: Try 'whereis' command (Linux)
    try {
      const { stdout } = await execAsync(`whereis ${command}`);
      const parts = stdout.split(":")[1]?.trim().split(" ");
      if (parts && parts[0]) {
        const path = parts[0];
        this.cache.set(command, path);
        logger.info("PathResolver", `Found ${command} with whereis: ${path}`);
        return path;
      }
    } catch (error) {
      logger.debug(
        "PathResolver",
        `'whereis' command failed for ${command}`,
        { command, context: { type: 'whereis_command_failed' } }
      );
    }

    // Method 3: Check common paths manually
    for (const dir of this.COMMON_PATHS) {
      if (!dir) continue;

      try {
        const fullPath = `${dir}/${command}`;
        await execAsync(`test -f "${fullPath}" && test -x "${fullPath}"`);
        this.cache.set(command, fullPath);
        logger.info(
          "PathResolver",
          `Found ${command} in common paths: ${fullPath}`,
        );
        return fullPath;
      } catch (error) {
        // Path doesn't exist or isn't executable, continue searching
      }
    }

    // Method 4: Try environment-specific paths
    const envPaths = await this.getEnvironmentPaths();
    for (const dir of envPaths) {
      try {
        const fullPath = `${dir}/${command}`;
        await execAsync(`test -f "${fullPath}" && test -x "${fullPath}"`);
        this.cache.set(command, fullPath);
        logger.info(
          "PathResolver",
          `Found ${command} in environment paths: ${fullPath}`,
        );
        return fullPath;
      } catch (error) {
        // Path doesn't exist or isn't executable, continue searching
      }
    }

    logger.warn("PathResolver", `Could not find executable: ${command}`);
    return null;
  }

  /**
   * Get environment-specific paths
   */
  private static async getEnvironmentPaths(): Promise<string[]> {
    const paths: string[] = [];

    // Try to get PATH from shell
    try {
      const { stdout } = await execAsync("echo $PATH");
      const pathDirs = stdout
        .trim()
        .split(":")
        .filter((p) => p);
      paths.push(...pathDirs);
    } catch (error) {
      // Ignore if we can't get PATH
    }

    // Try npm global bin path
    try {
      const { stdout } = await execAsync("npm config get prefix");
      const npmPrefix = stdout.trim();
      if (npmPrefix) {
        paths.push(`${npmPrefix}/bin`);
      }
    } catch (error) {
      // Ignore if npm isn't available
    }

    // Try node version manager paths
    const homeDir = process.env.HOME;
    if (homeDir) {
      // nvm paths
      try {
        const { stdout } = await execAsync(
          "ls ~/.nvm/versions/node/*/bin 2>/dev/null | head -1",
        );
        const nvmPath = stdout.trim();
        if (nvmPath) {
          paths.push(nvmPath);
        }
      } catch (error) {
        // nvm not installed or no versions
      }

      // nodenv paths
      try {
        const { stdout } = await execAsync("nodenv which node 2>/dev/null");
        const nodenvNode = stdout.trim();
        if (nodenvNode) {
          const nodenvBin = nodenvNode.replace("/node", "");
          paths.push(nodenvBin);
        }
      } catch (error) {
        // nodenv not installed
      }
    }

    return [...new Set(paths)]; // Remove duplicates
  }

  /**
   * Get information about an executable
   */
  static async getExecutableInfo(
    command: string,
  ): Promise<ExecutableInfo | null> {
    const logger = getLogger();

    const fullPath = await this.findExecutable(command);
    if (!fullPath) {
      return null;
    }

    try {
      // Try to get version
      let version: string | undefined;
      try {
        const { stdout } = await execAsync(`"${fullPath}" --version`);
        version = stdout.trim().split("\n")[0];
      } catch (error) {
        // Some commands don't support --version
        logger.debug(
          "PathResolver",
          `Could not get version for ${command}`,
          { command, context: { type: 'version_check_failed' } }
        );
      }

      return {
        command,
        fullPath,
        version,
      };
    } catch (error) {
      logger.error(
        "PathResolver",
        `Error getting info for ${command}`,
        error as Error,
      );
      return {
        command,
        fullPath,
      };
    }
  }

  /**
   * Verify that Node.js and npm ecosystem is available
   */
  static async verifyNodeEnvironment(): Promise<{
    node: ExecutableInfo | null;
    npm: ExecutableInfo | null;
    npx: ExecutableInfo | null;
    isValid: boolean;
    issues: string[];
  }> {
    const logger = getLogger();
    logger.info("PathResolver", "Verifying Node.js environment...");

    const [node, npm, npx] = await Promise.all([
      this.getExecutableInfo("node"),
      this.getExecutableInfo("npm"),
      this.getExecutableInfo("npx"),
    ]);

    const issues: string[] = [];

    if (!node) {
      issues.push(
        "Node.js not found. Please install Node.js from https://nodejs.org/",
      );
    }

    if (!npm) {
      issues.push("npm not found. Please ensure npm is installed with Node.js");
    }

    if (!npx) {
      issues.push(
        "npx not found. Please ensure npx is installed (usually comes with npm 5.2+)",
      );
    }

    const isValid = node !== null && npm !== null && npx !== null;

    logger.info(
      "PathResolver",
      `Node.js environment verification: ${isValid ? "PASSED" : "FAILED"}`,
      {
        context: {
          nodeFound: node !== null,
          npmFound: npm !== null,
          npxFound: npx !== null,
          nodeVersion: node?.version,
          npmVersion: npm?.version,
          npxVersion: npx?.version,
        },
        tags: isValid ? ['environment_check_passed'] : ['environment_check_failed'],
      },
    );

    return {
      node,
      npm,
      npx,
      isValid,
      issues,
    };
  }

  /**
   * Resolve command for MCP server configuration
   */
  static async resolveCommand(command: string): Promise<string> {
    const logger = getLogger();

    // If it's already a full path, use it as-is
    if (command.startsWith("/")) {
      logger.debug("PathResolver", `Using provided full path: ${command}`);
      return command;
    }

    // Try to resolve the command
    const fullPath = await this.findExecutable(command);
    if (fullPath) {
      logger.info("PathResolver", `Resolved ${command} to: ${fullPath}`);
      return fullPath;
    }

    // If we can't find it, return the original command and let the system try
    logger.warn(
      "PathResolver",
      `Could not resolve ${command}, using original command`,
    );
    return command;
  }

  /**
   * Clear the path cache
   */
  static clearCache(): void {
    this.cache.clear();
    getLogger().debug("PathResolver", "Path cache cleared");
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): {
    size: number;
    entries: Array<{ command: string; path: string }>;
  } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.entries()).map(([command, path]) => ({
        command,
        path,
      })),
    };
  }
}
