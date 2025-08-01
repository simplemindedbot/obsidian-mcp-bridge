import { Plugin, WorkspaceLeaf, Notice, Editor } from 'obsidian';
import { MCPBridgeSettings, DEFAULT_SETTINGS } from '@/types/settings';
import { MCPClient } from '@/core/mcp-client';
import { KnowledgeEngine } from '@/knowledge/knowledge-engine';
import { BridgeInterface } from '@/bridge/bridge-interface';
import { LLMProviderConfig } from '@/core/llm-router';
import { MCPBridgeSettingTab } from '@/ui/settings-tab';
import { ChatView, CHAT_VIEW_TYPE } from '@/ui/chat-view';
import { initializeLogger, getLogger, LogLevel } from '@/utils/logger';
import { SettingsMigration } from '@/utils/settings-migration';
import { ConfigManager } from '@/utils/config-manager';

export default class MCPBridgePlugin extends Plugin {
  settings!: MCPBridgeSettings;
  mcpClient!: MCPClient;
  knowledgeEngine!: KnowledgeEngine;
  bridgeInterface!: BridgeInterface;
  configManager!: ConfigManager;
  private loggerInitialized = false;

  async onload() {
    console.log('Loading MCP Bridge plugin...');

    // Initialize logger first with default settings
    const logger = initializeLogger(this.app);
    this.loggerInitialized = true;

    // Initialize config manager
    this.configManager = new ConfigManager(this.app);

    // Load settings
    await this.loadSettings();

    // Configure logger with loaded settings
    logger.configure({
      enableFileLogging: this.settings.logging.enableFileLogging,
      enableConsoleLogging: this.settings.logging.enableConsoleLogging,
      logLevel: this.logLevelToEnum(this.settings.logging.logLevel),
      logFilePath: this.settings.logging.logFilePath,
      maxLogFileSize: this.settings.logging.maxLogFileSize
    });

    logger.info('Plugin', 'MCP Bridge plugin loading...');

    try {
      // Initialize core components
      this.mcpClient = new MCPClient(this.settings);
      this.knowledgeEngine = new KnowledgeEngine(this.app, this.mcpClient);
      
      // Create LLM config if intelligent routing is enabled
      const llmConfig = this.createLLMConfig();
      this.bridgeInterface = new BridgeInterface(this.app, this.mcpClient, this.knowledgeEngine, llmConfig);

      logger.info('Plugin', 'Core components initialized successfully');
    } catch (error) {
      logger.error('Plugin', 'Failed to initialize core components', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }

    // Register chat view
    this.registerView(
      CHAT_VIEW_TYPE,
      (leaf: WorkspaceLeaf) => new ChatView(leaf, this.bridgeInterface)
    );

    // Add ribbon icon
    this.addRibbonIcon('message-circle', 'MCP Bridge Chat', () => {
      this.activateChatView();
    });

    // Register commands
    this.addCommand({
      id: 'open-mcp-chat',
      name: 'Open MCP Chat',
      callback: () => {
        this.activateChatView();
      }
    });

    this.addCommand({
      id: 'discover-knowledge',
      name: 'Discover related knowledge',
      hotkeys: [{ modifiers: ['Mod', 'Shift'], key: 'k' }],
      editorCallback: async (editor) => {
        const context = this.getCurrentContext(editor);
        
        try {
          const discoveries = await this.knowledgeEngine.discoverRelatedContent(context);
          // Show discovery results in a modal or sidebar
          new Notice(`Found ${discoveries.length} related items`);
        } catch (error) {
          new Notice('Error discovering knowledge: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
      }
    });

    // Add settings tab
    this.addSettingTab(new MCPBridgeSettingTab(this.app, this));

    // Initialize connections
    await this.initializeMCPConnections();

    console.log('MCP Bridge plugin loaded successfully');
  }

  async onunload() {
    console.log('Unloading MCP Bridge plugin...');
    
    // Safe logger access - only use if initialized
    if (this.loggerInitialized) {
      try {
        const logger = getLogger();
        logger.info('Plugin', 'MCP Bridge plugin unloading...');
        
        // Cleanup logger
        logger.destroy();
      } catch (error) {
        console.log('MCP Bridge: Logger cleanup failed:', error);
      }
    } else {
      console.log('MCP Bridge: Plugin unloading (logger not available)');
    }
    
    // Cleanup connections
    if (this.mcpClient) {
      await this.mcpClient.disconnect();
    }

    // Detach views
    this.app.workspace.detachLeavesOfType(CHAT_VIEW_TYPE);
  }

  async loadSettings() {
    // Load settings using ConfigManager
    const rawSettings = await this.configManager.loadSettings();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, rawSettings);
    
    // Run settings migration if needed
    const migration = new SettingsMigration(this.app);
    const migratedSettings = await migration.migrateSettings(this.settings);
    
    // If settings were migrated, save them
    if (migratedSettings.version !== this.settings.version) {
      this.settings = migratedSettings;
      await this.configManager.saveSettings(this.settings);
      console.log('MCP Bridge: Settings migrated and saved successfully');
    } else {
      this.settings = migratedSettings;
    }
  }

  async saveSettings() {
    await this.configManager.saveSettings(this.settings);
    
    // Update logger configuration (only if initialized)
    if (this.loggerInitialized) {
      try {
        const logger = getLogger();
        logger.configure({
          enableFileLogging: this.settings.logging.enableFileLogging,
          enableConsoleLogging: this.settings.logging.enableConsoleLogging,
          logLevel: this.logLevelToEnum(this.settings.logging.logLevel),
          logFilePath: this.settings.logging.logFilePath,
          maxLogFileSize: this.settings.logging.maxLogFileSize
        });
      } catch (error) {
        console.log('MCP Bridge: Failed to update logger configuration:', error);
      }
    }
    
    // Reinitialize connections if settings changed
    if (this.mcpClient) {
      await this.mcpClient.updateSettings(this.settings);
    }
    
    // Update LLM configuration if enabled
    if (this.bridgeInterface) {
      const llmConfig = this.createLLMConfig();
      if (llmConfig) {
        this.bridgeInterface.configureLLM(llmConfig);
      }
    }
  }

  private createLLMConfig(): LLMProviderConfig | undefined {
    if (!this.settings.llm.enableIntelligentRouting || this.settings.llm.provider === 'disabled') {
      return undefined;
    }

    const apiKey = this.settings.apiKeys[this.settings.llm.provider];
    
    return {
      provider: this.settings.llm.provider,
      apiKey,
      model: this.settings.llm.model,
      baseUrl: this.settings.llm.baseUrl,
      maxTokens: this.settings.llm.maxTokens,
      temperature: this.settings.llm.temperature,
    };
  }

  private logLevelToEnum(level: string): LogLevel {
    switch (level) {
      case 'error': return LogLevel.ERROR;
      case 'warn': return LogLevel.WARN;
      case 'info': return LogLevel.INFO;
      case 'debug': return LogLevel.DEBUG;
      case 'trace': return LogLevel.TRACE;
      default: return LogLevel.INFO;
    }
  }

  async activateChatView() {
    const { workspace } = this.app;

    let leaf: WorkspaceLeaf | null = null;
    const leaves = workspace.getLeavesOfType(CHAT_VIEW_TYPE);

    if (leaves.length > 0) {
      // A chat view already exists, use the first one
      leaf = leaves[0];
    } else {
      // Create new chat view in the right sidebar
      leaf = workspace.getRightLeaf(false);
      if (leaf) {
        await leaf.setViewState({ type: CHAT_VIEW_TYPE, active: true });
      }
    }

    // Reveal and focus the chat view
    if (leaf) {
      workspace.revealLeaf(leaf);
    }
  }

  private async initializeMCPConnections() {
    try {
      await this.mcpClient.initialize();
      new Notice('MCP servers connected successfully');
    } catch (error) {
      console.error('Failed to initialize MCP connections:', error);
      new Notice('Failed to connect to MCP servers. Check your settings.');
    }
  }

  private getCurrentContext(editor: Editor): string {
    const cursor = editor.getCursor();
    const currentLine = editor.getLine(cursor.line);
    const previousLines = [];
    
    // Get context from surrounding lines
    for (let i = Math.max(0, cursor.line - 5); i < cursor.line; i++) {
      previousLines.push(editor.getLine(i));
    }

    return [...previousLines, currentLine].join('\n').trim();
  }
}
