import { exec } from "child_process";
import { promisify } from "util";
import { getLogger } from "./logger";
import { platform } from "os";

const execAsync = promisify(exec);

export interface ExecutableInfo {
  command: string;
  fullPath: string;
  version?: string;
}

export class PathResolver {
  private static cache = new Map<string, string>();
  private static readonly COMMON_PATHS = PathResolver.getCommonPaths();

  private static getCommonPaths(): string[] {
    const isWindows = platform() === 'win32';
    const homeDir = process.env.HOME || process.env.USERPROFILE || '';
    
    if (isWindows) {
      return [
        process.env.ProgramFiles + "\\nodejs",
        process.env["ProgramFiles(x86)"] + "\\nodejs", 
        process.env.APPDATA + "\\npm",
        process.env.LOCALAPPDATA + "\\Microsoft\\WindowsApps",
        "C:\\Program Files\\nodejs",
        "C:\\Program Files (x86)\\nodejs",
        homeDir + "\\AppData\\Roaming\\npm",
        homeDir + "\\.npm-global",
      ].filter(Boolean);
    } else {
      return [
        "/usr/local/bin",
        "/opt/homebrew/bin",
        "/usr/bin", 
        "/bin",
        "/opt/local/bin",
        "/usr/local/opt/node/bin",
        homeDir + "/.nvm/current/bin",
        homeDir + "/.npm-global/bin",
        homeDir + "/node_modules/.bin",
      ].filter(Boolean);
    }
  }

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

    // Method 1: Try platform-specific command to find executable
    const isWindows = platform() === 'win32';
    try {
      const findCommand = isWindows ? `where ${command}` : `which ${command}`;
      const { stdout } = await execAsync(findCommand);
      const path = stdout.trim().split('\n')[0]; // Take first result on Windows
      if (path && path !== "") {
        this.cache.set(command, path);
        logger.info("PathResolver", `Found ${command} at: ${path}`);
        return path;
      }
    } catch (error) {
      logger.debug(
        "PathResolver",
        `Platform find command failed for ${command}`,
        { command, context: { type: 'platform_find_failed' } }
      );
    }

    // Method 2: Try 'whereis' command (Linux only)
    if (!isWindows) {
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
    }

    // Method 3: Check common paths manually
    for (const dir of this.COMMON_PATHS) {
      if (!dir) continue;

      try {
        const separator = isWindows ? '\\' : '/';
        const extension = isWindows && !command.includes('.') ? '.exe' : '';
        const fullPath = `${dir}${separator}${command}${extension}`;
        
        const testCommand = isWindows 
          ? `if exist "${fullPath}" echo found`
          : `test -f "${fullPath}" && test -x "${fullPath}"`;
          
        await execAsync(testCommand);
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
        const separator = isWindows ? '\\' : '/';
        const extension = isWindows && !command.includes('.') ? '.exe' : '';
        const fullPath = `${dir}${separator}${command}${extension}`;
        
        const testCommand = isWindows 
          ? `if exist "${fullPath}" echo found`
          : `test -f "${fullPath}" && test -x "${fullPath}"`;
          
        await execAsync(testCommand);
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
    const isWindows = platform() === 'win32';

    // Try to get PATH from environment
    try {
      const envPath = process.env.PATH || '';
      const separator = isWindows ? ';' : ':';
      const pathDirs = envPath.split(separator).filter((p) => p);
      paths.push(...pathDirs);
    } catch (error) {
      // Ignore if we can't get PATH
    }

    // Try npm global bin path
    try {
      const { stdout } = await execAsync("npm config get prefix");
      const npmPrefix = stdout.trim();
      if (npmPrefix) {
        const binDir = isWindows ? npmPrefix : `${npmPrefix}/bin`;
        paths.push(binDir);
      }
    } catch (error) {
      // Ignore if npm isn't available
    }

    // Try node version manager paths (Unix-like systems only)
    const homeDir = process.env.HOME || process.env.USERPROFILE;
    if (homeDir && !isWindows) {
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
    const isWindows = platform() === 'win32';

    // If it's already a full path, use it as-is
    const isFullPath = isWindows 
      ? (command.includes(':') || command.startsWith('\\\\'))  // Windows: C:\ or UNC path
      : command.startsWith('/');  // Unix: absolute path
    
    if (isFullPath) {
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
