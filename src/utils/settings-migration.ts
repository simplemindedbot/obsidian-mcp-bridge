import { MCPBridgeSettings, CURRENT_SETTINGS_VERSION } from "../types/settings";
import { App } from "obsidian";

export class SettingsMigration {
  private app: App;

  constructor(app: App) {
    this.app = app;
  }

  /**
   * Migrate settings from older versions to current format
   */
  async migrateSettings(
    settings: MCPBridgeSettings,
  ): Promise<MCPBridgeSettings> {
    const currentVersion = settings.version || "0.1.0";

    // If already at current version, no migration needed
    if (currentVersion === CURRENT_SETTINGS_VERSION) {
      return settings;
    }

    console.log(
      `MCP Bridge: Migrating settings from ${currentVersion} to ${CURRENT_SETTINGS_VERSION}`,
    );

    let migratedSettings = { ...settings };

    // Migration from 0.1.x to 0.2.0: Move directory from args to workingDirectory
    if (this.isVersionLessThan(currentVersion, "0.2.0")) {
      migratedSettings = await this.migrateToV0_2_0(migratedSettings);
    }

    // Update version to current
    migratedSettings.version = CURRENT_SETTINGS_VERSION;

    console.log("MCP Bridge: Settings migration completed successfully");
    return migratedSettings;
  }

  /**
   * Migration to version 0.2.0: Separate working directory from args
   */
  private async migrateToV0_2_0(
    settings: MCPBridgeSettings,
  ): Promise<MCPBridgeSettings> {
    console.log(
      "MCP Bridge: Running migration to v0.2.0 (workingDirectory support)",
    );

    // Migrate filesystem server configuration
    if (settings.servers?.filesystem) {
      const config = settings.servers.filesystem;

      // Check if args contains a directory path (legacy format)
      if (config.args && config.args.length > 0) {
        const lastArg = config.args[config.args.length - 1];
        if (
          lastArg === "./" ||
          lastArg.startsWith("/") ||
          lastArg.startsWith("~") ||
          lastArg.includes("/")
        ) {
          // Move directory from args to workingDirectory
          config.workingDirectory = lastArg;
          config.args = config.args.slice(0, -1); // Remove last arg
          console.log(
            `MCP Bridge: Moved directory '${lastArg}' from args to workingDirectory`,
          );
        }
      }

      // Set default working directory to vault path if not set
      if (!config.workingDirectory) {
        try {
          // @ts-ignore - basePath exists on FileSystemAdapter
          const vaultPath = this.app.vault.adapter.basePath || "/";
          config.workingDirectory = vaultPath;
          console.log(
            `MCP Bridge: Set default workingDirectory to vault path: ${vaultPath}`,
          );
        } catch (error) {
          console.warn(
            "MCP Bridge: Could not determine vault path, using fallback",
          );
          config.workingDirectory = "/";
        }
      }
    }

    // Migrate other servers that might have directory in args
    for (const [serverId, serverConfig] of Object.entries(
      settings.servers || {},
    )) {
      if (serverId !== "filesystem" && serverConfig.args) {
        const lastArg = serverConfig.args[serverConfig.args.length - 1];
        if (
          lastArg &&
          (lastArg.startsWith("/") ||
            lastArg.startsWith("~") ||
            lastArg === "./")
        ) {
          serverConfig.workingDirectory = lastArg;
          serverConfig.args = serverConfig.args.slice(0, -1);
          console.log(
            `MCP Bridge: Migrated ${serverId} server workingDirectory`,
          );
        }
      }
    }

    return settings;
  }

  /**
   * Compare version strings (simple semver comparison)
   */
  private isVersionLessThan(version1: string, version2: string): boolean {
    const v1Parts = version1.split(".").map(Number);
    const v2Parts = version2.split(".").map(Number);

    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;

      if (v1Part < v2Part) return true;
      if (v1Part > v2Part) return false;
    }

    return false;
  }
}
