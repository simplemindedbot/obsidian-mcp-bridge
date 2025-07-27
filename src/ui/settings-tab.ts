import { App, PluginSettingTab, Setting, Notice } from "obsidian";
import MCPBridgePlugin from "@/main";

// Type definitions for Electron integration
interface ElectronShell {
  openPath(path: string): Promise<string>;
}

interface ElectronAPI {
  shell?: ElectronShell;
}

interface WindowWithElectron extends Window {
  electron?: ElectronAPI;
}

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

    // LLM Integration Section
    this.addLLMSection();

    // Knowledge Discovery Section
    this.addKnowledgeDiscoverySection();

    // Chat Interface Section
    this.addChatInterfaceSection();

    // Content Processing Section
    this.addContentProcessingSection();

    // Logging Section
    this.addLoggingSection();
  }

  private addServerInfoSection(): void {
    const { containerEl } = this;

    containerEl.createEl("h3", { text: "MCP Servers" });
    const desc = containerEl.createEl("p");
    desc.innerHTML = `
      MCP servers are configured by editing the
      <code>obsidian-mcp-bridge-config.json</code> file.
      This approach allows for flexible and version-controllable server setups.
      See the <a href="https://github.com/simplemindedbot/obsidian-mcp-bridge#example-configuration">README</a> for examples.
    `;

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

    new Setting(containerEl)
      .setName("Edit Configuration")
      .setDesc("Click to open the configuration file in Obsidian.")
      .addButton((button) => {
        button.setButtonText("Open Config File").onClick(async () => {
          await this.app.workspace.openLinkText(configPath, "", false);
        });
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

    new Setting(containerEl)
      .setName("Reload Plugin")
      .setDesc("Reload the plugin to apply configuration changes")
      .addButton((button) => {
        button.setButtonText("Reload").onClick(async () => {
          const obsidianApp = this.app as any;
          await obsidianApp.plugins.reloadPlugin(this.plugin.manifest.id);
          new Notice("Plugin reloaded successfully!");
        });
      });

    // The legacy config check is no longer needed, so this is empty.
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
            this.plugin.settings.chatInterface.chatPosition = value as "right" | "left" | "floating";
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
            this.plugin.settings.contentProcessing.insertionMode = value as "cursor" | "end" | "modal";
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
            this.plugin.settings.logging.logLevel = value as "error" | "warn" | "info" | "debug" | "trace";
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

  private addLLMSection(): void {
    const { containerEl } = this;

    containerEl.createEl("h3", { text: "LLM Integration" });
    containerEl.createEl("p", {
      text: "Configure AI language models for intelligent query routing and interpretation.",
    });

    // Enable intelligent routing
    new Setting(containerEl)
      .setName("Enable Intelligent Routing")
      .setDesc("Use AI language models to analyze queries and route them to appropriate MCP servers")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.llm.enableIntelligentRouting)
          .onChange(async (value) => {
            this.plugin.settings.llm.enableIntelligentRouting = value;
            await this.plugin.saveSettings();
            this.display(); // Refresh to show/hide LLM settings
          }),
      );

    // Only show LLM settings if intelligent routing is enabled
    if (this.plugin.settings.llm.enableIntelligentRouting) {
      // LLM Provider
      new Setting(containerEl)
        .setName("LLM Provider")
        .setDesc("Choose the language model provider for query analysis")
        .addDropdown((dropdown) =>
          dropdown
            .addOption("disabled", "Disabled")
            .addOption("openai", "OpenAI")
            .addOption("openai-compatible", "OpenAI Compatible (OpenRouter, etc.)")
            .addOption("anthropic", "Anthropic")
            .addOption("local", "Local (coming soon)")
            .setValue(this.plugin.settings.llm.provider)
            .onChange(async (value) => {
              this.plugin.settings.llm.provider = value as "openai" | "anthropic" | "openai-compatible" | "local" | "disabled";
              await this.plugin.saveSettings();
              this.display(); // Refresh to show provider-specific settings
            }),
        );

      // Show provider-specific settings
      if (this.plugin.settings.llm.provider !== "disabled") {
        // Model selection
        new Setting(containerEl)
          .setName("Model")
          .setDesc("Specific model to use for query analysis")
          .addText((text) =>
            text
              .setPlaceholder(this.getDefaultModel(this.plugin.settings.llm.provider))
              .setValue(this.plugin.settings.llm.model)
              .onChange(async (value) => {
                this.plugin.settings.llm.model = value || this.getDefaultModel(this.plugin.settings.llm.provider);
                await this.plugin.saveSettings();
              }),
          );

        // API Key
        if (this.plugin.settings.llm.provider !== "local") {
          const keyPlaceholder = this.plugin.settings.llm.provider === "openai-compatible" ? 
            "sk-or-... (OpenRouter) or provider-specific key" : "sk-...";
          new Setting(containerEl)
            .setName("API Key")
            .setDesc(`Enter your ${this.plugin.settings.llm.provider === "openai-compatible" ? "OpenAI-compatible service" : this.plugin.settings.llm.provider} API key`)
            .addText((text) =>
              text
                .setPlaceholder(keyPlaceholder)
                .setValue(this.plugin.settings.apiKeys[this.plugin.settings.llm.provider] || "")
                .onChange(async (value) => {
                  this.plugin.settings.apiKeys[this.plugin.settings.llm.provider] = value;
                  await this.plugin.saveSettings();
                }),
            );
        }

        // Base URL (for local/custom endpoints and OpenAI-compatible services)
        if (this.plugin.settings.llm.provider === "local" || this.plugin.settings.llm.provider === "openai-compatible") {
          const isOpenRouter = this.plugin.settings.llm.provider === "openai-compatible";
          new Setting(containerEl)
            .setName("Base URL")
            .setDesc(isOpenRouter ? 
              "API endpoint URL (e.g., https://openrouter.ai/api/v1 for OpenRouter)" : 
              "URL for local LLM API endpoint")
            .addText((text) =>
              text
                .setPlaceholder(isOpenRouter ? "https://openrouter.ai/api/v1" : "http://localhost:11434")
                .setValue(this.plugin.settings.llm.baseUrl || "")
                .onChange(async (value) => {
                  this.plugin.settings.llm.baseUrl = value;
                  await this.plugin.saveSettings();
                }),
            );
        }

        // Advanced LLM settings
        new Setting(containerEl)
          .setName("Max Tokens")
          .setDesc("Maximum tokens for LLM responses (100-4000)")
          .addSlider((slider) =>
            slider
              .setLimits(100, 4000, 100)
              .setValue(this.plugin.settings.llm.maxTokens)
              .setDynamicTooltip()
              .onChange(async (value) => {
                this.plugin.settings.llm.maxTokens = value;
                await this.plugin.saveSettings();
              }),
          );

        new Setting(containerEl)
          .setName("Temperature")
          .setDesc("Creativity level for LLM responses (0.0-1.0)")
          .addSlider((slider) =>
            slider
              .setLimits(0, 1, 0.1)
              .setValue(this.plugin.settings.llm.temperature)
              .setDynamicTooltip()
              .onChange(async (value) => {
                this.plugin.settings.llm.temperature = value;
                await this.plugin.saveSettings();
              }),
          );

        // Fallback setting
        new Setting(containerEl)
          .setName("Fallback to Static Routing")
          .setDesc("Use traditional regex-based routing when LLM analysis fails")
          .addToggle((toggle) =>
            toggle
              .setValue(this.plugin.settings.llm.fallbackToStaticRouting)
              .onChange(async (value) => {
                this.plugin.settings.llm.fallbackToStaticRouting = value;
                await this.plugin.saveSettings();
              }),
          );
      }
    }
  }

  private getDefaultModel(provider: string): string {
    switch (provider) {
      case "openai": return "gpt-4";
      case "openai-compatible": return "gpt-3.5-turbo";
      case "anthropic": return "claude-3-sonnet-20240229";
      case "local": return "llama2";
      default: return "gpt-4";
    }
  }

}
