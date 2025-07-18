import { App, PluginSettingTab, Setting, Notice } from 'obsidian';
import MCPBridgePlugin from '@/main';
import { MCPServerConfig } from '@/types/settings';

export class MCPBridgeSettingTab extends PluginSettingTab {
  plugin: MCPBridgePlugin;

  constructor(app: App, plugin: MCPBridgePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'MCP Bridge Settings' });

    // Server Configuration Section
    this.addServerSection();

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

  private addServerSection(): void {
    const { containerEl } = this;

    containerEl.createEl('h3', { text: 'MCP Servers' });
    containerEl.createEl('p', { 
      text: 'Configure Model Context Protocol servers to connect with various AI services and data sources.' 
    });

    // Add servers
    Object.entries(this.plugin.settings.servers).forEach(([serverId, serverConfig]) => {
      this.addServerConfig(serverId, serverConfig);
    });

    // Add new server button
    new Setting(containerEl)
      .setName('Add New Server')
      .setDesc('Add a new MCP server configuration')
      .addButton(button => {
        button
          .setButtonText('Add Server')
          .onClick(() => {
            this.addNewServer();
          });
      });
  }

  private addServerConfig(serverId: string, config: MCPServerConfig): void {
    const { containerEl } = this;

    const serverContainer = containerEl.createEl('div', { cls: 'mcp-server-config' });
    serverContainer.createEl('h4', { text: config.name || serverId });

    new Setting(serverContainer)
      .setName('Enabled')
      .setDesc('Enable this MCP server')
      .addToggle(toggle => {
        toggle
          .setValue(config.enabled)
          .onChange(async (value) => {
            this.plugin.settings.servers[serverId].enabled = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(serverContainer)
      .setName('Name')
      .setDesc('Display name for this server')
      .addText(text => {
        text
          .setPlaceholder('Server name')
          .setValue(config.name)
          .onChange(async (value) => {
            this.plugin.settings.servers[serverId].name = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(serverContainer)
      .setName('Command')
      .setDesc('Command to start the MCP server')
      .addText(text => {
        text
          .setPlaceholder('npx')
          .setValue(config.command)
          .onChange(async (value) => {
            this.plugin.settings.servers[serverId].command = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(serverContainer)
      .setName('Arguments')
      .setDesc('Command line arguments (one per line)')
      .addTextArea(textArea => {
        textArea
          .setPlaceholder('-y\\n@modelcontextprotocol/server-filesystem\\n./')
          .setValue(config.args.join('\\n'))
          .onChange(async (value) => {
            this.plugin.settings.servers[serverId].args = value.split('\\n').filter(arg => arg.trim());
            await this.plugin.saveSettings();
          });
      });

    new Setting(serverContainer)
      .setName('Connection Type')
      .setDesc('Type of connection to use')
      .addDropdown(dropdown => {
        dropdown
          .addOption('stdio', 'STDIO')
          .addOption('websocket', 'WebSocket')
          .addOption('sse', 'Server-Sent Events')
          .setValue(config.type || 'stdio')
          .onChange(async (value) => {
            this.plugin.settings.servers[serverId].type = value as any;
            await this.plugin.saveSettings();
          });
      });

    new Setting(serverContainer)
      .setName('Remove Server')
      .setDesc('Remove this server configuration')
      .addButton(button => {
        button
          .setButtonText('Remove')
          .setWarning()
          .onClick(async () => {
            delete this.plugin.settings.servers[serverId];
            await this.plugin.saveSettings();
            this.display(); // Refresh the settings display
          });
      });
  }

  private addKnowledgeDiscoverySection(): void {
    const { containerEl } = this;

    containerEl.createEl('h3', { text: 'Knowledge Discovery' });

    new Setting(containerEl)
      .setName('Enable Auto Discovery')
      .setDesc('Automatically discover related content while writing')
      .addToggle(toggle => {
        toggle
          .setValue(this.plugin.settings.knowledgeDiscovery.enableAutoDiscovery)
          .onChange(async (value) => {
            this.plugin.settings.knowledgeDiscovery.enableAutoDiscovery = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName('Max Results')
      .setDesc('Maximum number of results to show in discovery')
      .addSlider(slider => {
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
      .setName('Include Vault Content')
      .setDesc('Include your vault content in discovery results')
      .addToggle(toggle => {
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

    containerEl.createEl('h3', { text: 'Chat Interface' });

    new Setting(containerEl)
      .setName('Enable Chat')
      .setDesc('Enable the chat interface for interacting with MCP servers')
      .addToggle(toggle => {
        toggle
          .setValue(this.plugin.settings.chatInterface.enableChat)
          .onChange(async (value) => {
            this.plugin.settings.chatInterface.enableChat = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName('Chat Position')
      .setDesc('Position of the chat interface')
      .addDropdown(dropdown => {
        dropdown
          .addOption('right', 'Right Sidebar')
          .addOption('left', 'Left Sidebar')
          .addOption('floating', 'Floating Window')
          .setValue(this.plugin.settings.chatInterface.chatPosition)
          .onChange(async (value) => {
            this.plugin.settings.chatInterface.chatPosition = value as any;
            await this.plugin.saveSettings();
          });
      });
  }

  private addContentProcessingSection(): void {
    const { containerEl } = this;

    containerEl.createEl('h3', { text: 'Content Processing' });

    new Setting(containerEl)
      .setName('Auto Link Generation')
      .setDesc('Automatically generate links between related content')
      .addToggle(toggle => {
        toggle
          .setValue(this.plugin.settings.contentProcessing.autoLinkGeneration)
          .onChange(async (value) => {
            this.plugin.settings.contentProcessing.autoLinkGeneration = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName('Content Sanitization')
      .setDesc('Sanitize external content before insertion')
      .addToggle(toggle => {
        toggle
          .setValue(this.plugin.settings.contentProcessing.contentSanitization)
          .onChange(async (value) => {
            this.plugin.settings.contentProcessing.contentSanitization = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName('Insertion Mode')
      .setDesc('How to insert content into notes')
      .addDropdown(dropdown => {
        dropdown
          .addOption('cursor', 'At Cursor')
          .addOption('end', 'At End of Note')
          .addOption('modal', 'Show in Modal')
          .setValue(this.plugin.settings.contentProcessing.insertionMode)
          .onChange(async (value) => {
            this.plugin.settings.contentProcessing.insertionMode = value as any;
            await this.plugin.saveSettings();
          });
      });
  }

  private addLoggingSection(): void {
    const { containerEl } = this;

    containerEl.createEl('h3', { text: 'Logging & Debugging' });

    new Setting(containerEl)
      .setName('Enable File Logging')
      .setDesc('Save logs to a file for debugging purposes')
      .addToggle(toggle => {
        toggle
          .setValue(this.plugin.settings.logging.enableFileLogging)
          .onChange(async (value) => {
            this.plugin.settings.logging.enableFileLogging = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName('Enable Console Logging')
      .setDesc('Show logs in the browser console')
      .addToggle(toggle => {
        toggle
          .setValue(this.plugin.settings.logging.enableConsoleLogging)
          .onChange(async (value) => {
            this.plugin.settings.logging.enableConsoleLogging = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName('Log Level')
      .setDesc('Set the minimum level for logging')
      .addDropdown(dropdown => {
        dropdown
          .addOption('error', 'Error')
          .addOption('warn', 'Warning')
          .addOption('info', 'Info')
          .addOption('debug', 'Debug')
          .addOption('trace', 'Trace')
          .setValue(this.plugin.settings.logging.logLevel)
          .onChange(async (value) => {
            this.plugin.settings.logging.logLevel = value as any;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName('Max Log File Size')
      .setDesc('Maximum size of log files in MB')
      .addSlider(slider => {
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
      .setName('View Log File')
      .setDesc('Open the current log file in a new note')
      .addButton(button => {
        button
          .setButtonText('View Logs')
          .onClick(async () => {
            const logger = await import('@/utils/logger').then(m => m.getLogger());
            const logContent = await logger.getLogContents();
            
            if (logContent) {
              const logFile = await this.app.vault.create(
                `MCP Bridge Logs ${new Date().toISOString().split('T')[0]}.md`,
                '```\n' + logContent + '\n```'
              );
              await this.app.workspace.openLinkText(logFile.path, '');
            } else {
              new Notice('No logs found');
            }
          });
      });

    new Setting(containerEl)
      .setName('Clear Logs')
      .setDesc('Delete all log files')
      .addButton(button => {
        button
          .setButtonText('Clear Logs')
          .setWarning()
          .onClick(async () => {
            const logger = await import('@/utils/logger').then(m => m.getLogger());
            await logger.clearLogs();
            new Notice('Logs cleared');
          });
      });
  }

  private addAdvancedSection(): void {
    const { containerEl } = this;

    containerEl.createEl('h3', { text: 'Advanced Settings' });

    new Setting(containerEl)
      .setName('Debug Mode')
      .setDesc('Enable debug logging (check console for output)')
      .addToggle(toggle => {
        toggle
          .setValue(this.plugin.settings.enableDebugMode)
          .onChange(async (value) => {
            this.plugin.settings.enableDebugMode = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName('Default Timeout')
      .setDesc('Default timeout for MCP server connections (seconds)')
      .addSlider(slider => {
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

  private addNewServer(): void {
    const serverId = `server-${Date.now()}`;
    this.plugin.settings.servers[serverId] = {
      name: 'New Server',
      command: 'npx',
      args: [],
      enabled: false,
      type: 'stdio'
    };
    
    this.plugin.saveSettings().then(() => {
      this.display(); // Refresh the settings display
    });
  }
}
