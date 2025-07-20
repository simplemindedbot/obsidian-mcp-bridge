import { App, PluginSettingTab, Setting, Notice } from "obsidian";
import MCPBridgePlugin from "@/main";

export class MCPBridgeSettingTab extends PluginSettingTab {
  plugin: MCPBridgePlugin;

  constructor(app: App, plugin: MCPBridgePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "MCP Bridge Settings" });

    // Server Configuration Section
    this.addServerInfoSection();

    // Knowledge Discovery Section
    this.addKnowledgeDiscoverySection();

    // Chat Interface Section
    this.addChatInterfaceSection();

    // Content Processing Section
    this.addContentProcessingSection();

    // Logging Section
    this.addLoggingSection();

    // Advanced Settings Section
    this.addAdvancedSection();
  }

  private addServerInfoSection(): void {
    const { containerEl } = this;

    containerEl.createEl("h3", { text: "MCP Servers" });
    containerEl.createEl("p", {
      text: "MCP servers are configured via JSON file for maximum flexibility and version control.",
    });

    // Server status display
    const statusContainer = containerEl.createEl("div", {
      cls: "mcp-server-status",
    });
    
    const serverCount = Object.keys(this.plugin.settings.servers).length;
    const enabledCount = Object.values(this.plugin.settings.servers).filter(s => s.enabled).length;
    
    statusContainer.createEl("p", {
      text: `📊 Configured servers: ${serverCount} (${enabledCount} enabled)`,
      cls: "mcp-server-count",
    });

    // Configuration instructions
    const instructionsContainer = containerEl.createEl("div", {
      cls: "mcp-config-instructions",
    });
    
    instructionsContainer.createEl("h4", { text: "Configuration" });
    instructionsContainer.createEl("p", {
      text: "Edit your MCP server configuration by modifying the plugin's configuration file:",
    });
    
    const configPath = `${this.app.vault.configDir}/plugins/obsidian-mcp-bridge/obsidian-mcp-bridge-config.json`;
    const codeBlock = instructionsContainer.createEl("pre", {
      cls: "mcp-config-path",
    });
    codeBlock.createEl("code", {
      text: configPath,
    });
    
    // Example configuration
    const exampleContainer = instructionsContainer.createEl("details", {
      cls: "mcp-config-example",
    });
    exampleContainer.createEl("summary", { text: "📖 Example Configuration" });
    
    const exampleCode = exampleContainer.createEl("pre");
    exampleCode.createEl("code", {
      text: JSON.stringify({
        servers: {
          filesystem: {
            name: "Local Filesystem",
            command: "npx",
            args: ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/documents"],
            enabled: true,
            timeout: 30000,
            retryAttempts: 3,
            type: "stdio"
          },
          "web-search": {
            name: "Web Search",
            command: "npx", 
            args: ["-y", "@modelcontextprotocol/server-brave-search"],
            enabled: false,
            timeout: 30000,
            retryAttempts: 3,
            type: "stdio",
            env: {
              "BRAVE_API_KEY": "your-api-key-here"
            }
          }
        }
      }, null, 2),
    });
    
    instructionsContainer.createEl("p", {
      text: "After editing the configuration, restart Obsidian or reload the plugin to apply changes.",
      cls: "mcp-config-note",
    });

    // Quick actions
    new Setting(containerEl)
      .setName("Open Configuration Folder")
      .setDesc("Open the plugin configuration folder in your file manager")
      .addButton((button) => {
        button.setButtonText("Open Folder").onClick(async () => {
          try {
            // Try to open the folder using the system's default file manager
            const configDir = `${this.app.vault.configDir}/plugins/obsidian-mcp-bridge`;
            await (window as any).electron?.shell?.openPath?.(configDir);
          } catch (error) {
            new Notice("Could not open folder automatically. Please navigate to: " + configPath);
          }
        });
      });

    new Setting(containerEl)
      .setName("Reload Plugin")
      .setDesc("Reload the plugin to apply configuration changes")
      .addButton((button) => {
        button.setButtonText("Reload").onClick(async () => {
          new Notice("Please use Ctrl/Cmd+R to reload Obsidian and apply changes");
        });
      });

    // Check for legacy config file
    this.addLegacyConfigSection();
  }

  private async addLegacyConfigSection(): Promise<void> {
    const hasLegacy = await (this.plugin as any).configManager?.hasLegacyConfig();
    
    if (hasLegacy) {
      const { containerEl } = this;
      
      const legacyContainer = containerEl.createEl("div", {
        cls: "mcp-legacy-config",
      });
      
      legacyContainer.createEl("h4", { text: "⚠️ Legacy Configuration Detected" });
      legacyContainer.createEl("p", {
        text: "An old data.json configuration file was found. The plugin has migrated your settings to the new configuration file format.",
      });
      
      new Setting(legacyContainer)
        .setName("Clean Up Legacy File")
        .setDesc("Remove the old data.json file (it will be backed up as data.json.backup)")
        .addButton((button) => {
          button.setButtonText("Clean Up").onClick(async () => {
            try {
              await (this.plugin as any).configManager?.cleanupLegacyConfig();
              new Notice("Legacy configuration file cleaned up successfully");
              this.display(); // Refresh to hide this section
            } catch (error) {
              new Notice("Error cleaning up legacy file: " + (error as Error).message);
            }
          });
        });
    }
  }




  private addKnowledgeDiscoverySection(): void {
    const { containerEl } = this;

    containerEl.createEl("h3", { text: "Knowledge Discovery" });

    new Setting(containerEl)
      .setName("Enable Auto Discovery")
      .setDesc("Automatically discover related content while writing")
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.knowledgeDiscovery.enableAutoDiscovery)
          .onChange(async (value) => {
            this.plugin.settings.knowledgeDiscovery.enableAutoDiscovery = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Max Results")
      .setDesc("Maximum number of results to show in discovery")
      .addSlider((slider) => {
        slider
          .setLimits(5, 50, 5)
          .setValue(this.plugin.settings.knowledgeDiscovery.maxResults)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.knowledgeDiscovery.maxResults = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Include Vault Content")
      .setDesc("Include your vault content in discovery results")
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.knowledgeDiscovery.includeVaultContent)
          .onChange(async (value) => {
            this.plugin.settings.knowledgeDiscovery.includeVaultContent = value;
            await this.plugin.saveSettings();
          });
      });
  }

  private addChatInterfaceSection(): void {
    const { containerEl } = this;

    containerEl.createEl("h3", { text: "Chat Interface" });

    new Setting(containerEl)
      .setName("Enable Chat")
      .setDesc("Enable the chat interface for interacting with MCP servers")
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.chatInterface.enableChat)
          .onChange(async (value) => {
            this.plugin.settings.chatInterface.enableChat = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Chat Position")
      .setDesc("Position of the chat interface")
      .addDropdown((dropdown) => {
        dropdown
          .addOption("right", "Right Sidebar")
          .addOption("left", "Left Sidebar")
          .addOption("floating", "Floating Window")
          .setValue(this.plugin.settings.chatInterface.chatPosition)
          .onChange(async (value) => {
            this.plugin.settings.chatInterface.chatPosition = value as any;
            await this.plugin.saveSettings();
          });
      });
  }

  private addContentProcessingSection(): void {
    const { containerEl } = this;

    containerEl.createEl("h3", { text: "Content Processing" });

    new Setting(containerEl)
      .setName("Auto Link Generation")
      .setDesc("Automatically generate links between related content")
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.contentProcessing.autoLinkGeneration)
          .onChange(async (value) => {
            this.plugin.settings.contentProcessing.autoLinkGeneration = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Content Sanitization")
      .setDesc("Sanitize external content before insertion")
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.contentProcessing.contentSanitization)
          .onChange(async (value) => {
            this.plugin.settings.contentProcessing.contentSanitization = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Insertion Mode")
      .setDesc("How to insert content into notes")
      .addDropdown((dropdown) => {
        dropdown
          .addOption("cursor", "At Cursor")
          .addOption("end", "At End of Note")
          .addOption("modal", "Show in Modal")
          .setValue(this.plugin.settings.contentProcessing.insertionMode)
          .onChange(async (value) => {
            this.plugin.settings.contentProcessing.insertionMode = value as any;
            await this.plugin.saveSettings();
          });
      });
  }

  private addLoggingSection(): void {
    const { containerEl } = this;

    containerEl.createEl("h3", { text: "Logging & Debugging" });

    new Setting(containerEl)
      .setName("Enable File Logging")
      .setDesc("Save logs to a file for debugging purposes")
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.logging.enableFileLogging)
          .onChange(async (value) => {
            this.plugin.settings.logging.enableFileLogging = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Enable Console Logging")
      .setDesc("Show logs in the browser console")
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.logging.enableConsoleLogging)
          .onChange(async (value) => {
            this.plugin.settings.logging.enableConsoleLogging = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Log Level")
      .setDesc("Set the minimum level for logging")
      .addDropdown((dropdown) => {
        dropdown
          .addOption("error", "Error")
          .addOption("warn", "Warning")
          .addOption("info", "Info")
          .addOption("debug", "Debug")
          .addOption("trace", "Trace")
          .setValue(this.plugin.settings.logging.logLevel)
          .onChange(async (value) => {
            this.plugin.settings.logging.logLevel = value as any;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Max Log File Size")
      .setDesc("Maximum size of log files in MB")
      .addSlider((slider) => {
        slider
          .setLimits(1, 100, 1)
          .setValue(this.plugin.settings.logging.maxLogFileSize / (1024 * 1024))
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.logging.maxLogFileSize = value * 1024 * 1024;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("View Log File")
      .setDesc("Open the current log file in a new note")
      .addButton((button) => {
        button.setButtonText("View Logs").onClick(async () => {
          const logger = await import("@/utils/logger").then((m) =>
            m.getLogger(),
          );
          const logContent = await logger.getLogContents();

          if (logContent) {
            const logFile = await this.app.vault.create(
              `MCP Bridge Logs ${new Date().toISOString().split("T")[0]}.md`,
              "```\n" + logContent + "\n```",
            );
            await this.app.workspace.openLinkText(logFile.path, "");
          } else {
            new Notice("No logs found");
          }
        });
      });

    new Setting(containerEl)
      .setName("Clear Logs")
      .setDesc("Delete all log files")
      .addButton((button) => {
        button
          .setButtonText("Clear Logs")
          .setWarning()
          .onClick(async () => {
            const logger = await import("@/utils/logger").then((m) =>
              m.getLogger(),
            );
            await logger.clearLogs();
            new Notice("Logs cleared");
          });
      });
  }

  private addAdvancedSection(): void {
    const { containerEl } = this;

    containerEl.createEl("h3", { text: "Advanced Settings" });

    new Setting(containerEl)
      .setName("Debug Mode")
      .setDesc("Enable debug logging (check console for output)")
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.enableDebugMode)
          .onChange(async (value) => {
            this.plugin.settings.enableDebugMode = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Default Timeout")
      .setDesc("Default timeout for MCP server connections (seconds)")
      .addSlider((slider) => {
        slider
          .setLimits(10, 120, 10)
          .setValue(this.plugin.settings.defaultTimeout / 1000)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.defaultTimeout = value * 1000;
            await this.plugin.saveSettings();
          });
      });
  }

}
