import { Plugin, TFile, WorkspaceLeaf, Notice } from 'obsidian';
import { MCPBridgeSettings, DEFAULT_SETTINGS } from '@/types/settings';
import { MCPClient } from '@/core/mcp-client';
import { KnowledgeEngine } from '@/knowledge/knowledge-engine';
import { BridgeInterface } from '@/bridge/bridge-interface';
import { MCPBridgeSettingTab } from '@/ui/settings-tab';
import { ChatView, CHAT_VIEW_TYPE } from '@/ui/chat-view';

export default class MCPBridgePlugin extends Plugin {
  settings: MCPBridgeSettings;
  mcpClient: MCPClient;
  knowledgeEngine: KnowledgeEngine;
  bridgeInterface: BridgeInterface;

  async onload() {
    console.log('Loading MCP Bridge plugin...');

    // Load settings
    await this.loadSettings();

    // Initialize core components
    this.mcpClient = new MCPClient(this.settings);
    this.knowledgeEngine = new KnowledgeEngine(this.app, this.mcpClient);
    this.bridgeInterface = new BridgeInterface(this.app, this.mcpClient, this.knowledgeEngine);

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
        const cursor = editor.getCursor();
        const context = this.getCurrentContext(editor);
        
        try {
          const discoveries = await this.knowledgeEngine.discoverRelatedContent(context);
          // Show discovery results in a modal or sidebar
          new Notice(`Found ${discoveries.length} related items`);
        } catch (error) {
          new Notice('Error discovering knowledge: ' + error.message);
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
    
    // Cleanup connections
    if (this.mcpClient) {
      await this.mcpClient.disconnect();
    }

    // Detach views
    this.app.workspace.detachLeavesOfType(CHAT_VIEW_TYPE);
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
    
    // Reinitialize connections if settings changed
    if (this.mcpClient) {
      await this.mcpClient.updateSettings(this.settings);
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
      await leaf.setViewState({ type: CHAT_VIEW_TYPE, active: true });
    }

    // Reveal and focus the chat view
    workspace.revealLeaf(leaf);
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

  private getCurrentContext(editor: any): string {
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
