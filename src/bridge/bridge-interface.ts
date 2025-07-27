import { App, MarkdownView } from "obsidian";
import { MCPClient, MCPToolParameters } from "@/core/mcp-client";
import { KnowledgeEngine } from "@/knowledge/knowledge-engine";
import { ChatMessage } from "@/types/settings";
import { LLMQueryRouter, LLMProviderConfig } from "@/core/llm-router";
import { MCPServerDiscovery } from "@/core/server-discovery";
import { VaultSearchService } from "@/services/vault-search";

export class BridgeInterface {
  private app: App;
  private mcpClient: MCPClient;
  private knowledgeEngine: KnowledgeEngine;
  private llmRouter?: LLMQueryRouter;
  private serverDiscovery: MCPServerDiscovery;
  private lastCatalogUpdate: Date = new Date(0);
  private vaultSearchService: VaultSearchService;

  constructor(
    app: App,
    mcpClient: MCPClient,
    knowledgeEngine: KnowledgeEngine,
    llmConfig?: LLMProviderConfig,
  ) {
    this.app = app;
    this.mcpClient = mcpClient;
    this.knowledgeEngine = knowledgeEngine;
    this.serverDiscovery = new MCPServerDiscovery(mcpClient);
    this.vaultSearchService = new VaultSearchService(app);
    
    if (llmConfig) {
      this.llmRouter = new LLMQueryRouter(llmConfig);
    }
  }

  async processQuery(query: string): Promise<ChatMessage> {
    console.log("Processing query:", query);

    const startTime = Date.now();

    try {
      // Use LLM router if available, otherwise fall back to static routing
      if (this.llmRouter) {
        return await this.processQueryWithLLM(query, startTime);
      } else {
        return await this.processQueryWithStaticRouting(query, startTime);
      }
    } catch (error) {
      console.error("Error processing query:", error);
      return {
        id: Math.random().toString(36),
        role: "assistant",
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : "Unknown error"}`,
        timestamp: new Date(),
        metadata: {
          processingTime: Date.now() - startTime,
          error: true,
        },
      };
    }
  }

  /**
   * Process query using intelligent LLM routing
   */
  private async processQueryWithLLM(query: string, startTime: number): Promise<ChatMessage> {
    if (this.mcpClient.getConnectedServers().length === 0) {
      return {
        id: Math.random().toString(36),
        role: "assistant",
        content: `I'm not sure how to help with that. \n\nAvailable servers: `,
        timestamp: new Date(),
        metadata: {
          processingTime: Date.now() - startTime,
          error: true,
        },
      };
    }
    // Update server catalog if needed
    await this.updateServerCatalogIfNeeded();

    // Get contextual information
    const contextInfo = this.getContextualInfo();

    // Analyze query with LLM including context
    if (!this.llmRouter) {
      throw new Error('LLM router not initialized');
    }
    const routingPlan = await this.llmRouter.analyzeQueryWithContext(query, contextInfo);

    if (routingPlan.confidence < 0.3) {
      return {
        id: Math.random().toString(36),
        role: "assistant",
        content: `I'm not sure how to help with that. ${routingPlan.reasoning}\n\nAvailable servers: ${this.mcpClient.getConnectedServers().join(", ")}`,
        timestamp: new Date(),
        metadata: {
          processingTime: Date.now() - startTime,
          routingPlan,
          lowConfidence: true,
        },
      };
    }

    if (routingPlan.selectedTool === 'knowledge-discovery') {
      const content = await this.handleKnowledgeDiscovery(query);
      return {
        id: Math.random().toString(36),
        role: "assistant",
        content,
        timestamp: new Date(),
        metadata: {
          processingTime: Date.now() - startTime,
          routingPlan,
          toolsCalled: [routingPlan.selectedTool],
          server: routingPlan.selectedServer,
        },
      };
    }

    try {
      // Handle vault search locally (not via MCP)
      if (routingPlan.selectedTool === 'vault_search' || routingPlan.selectedServer === 'vault') {
        const content = await this.handleVaultSearch(query);
        return {
          id: Math.random().toString(36),
          role: "assistant",
          content,
          timestamp: new Date(),
          metadata: {
            processingTime: Date.now() - startTime,
            routingPlan,
            toolsCalled: [routingPlan.selectedTool],
            server: 'vault',
          },
        };
      }

      // Handle note connections locally (not via MCP)
      if (routingPlan.selectedTool === 'note_connection' || routingPlan.selectedServer === 'note_connection') {
        const content = await this.handleNoteConnection(query);
        return {
          id: Math.random().toString(36),
          role: "assistant",
          content,
          timestamp: new Date(),
          metadata: {
            processingTime: Date.now() - startTime,
            routingPlan,
            toolsCalled: [routingPlan.selectedTool],
            server: 'note_connection',
          },
        };
      }

      // Execute the routing plan via MCP
      const response = await this.mcpClient.callTool(
        routingPlan.selectedServer,
        routingPlan.selectedTool,
        routingPlan.parameters as MCPToolParameters
      );

      // Format response content
      let content = '';
      const result = response.result as any;
      if (result?.content) {
        if (Array.isArray(result.content)) {
          content = result.content.map((item: any) => item.text || item.content || String(item)).join('\n');
        } else {
          content = String(result.content);
        }
      } else {
        content = JSON.stringify(response.result, null, 2);
      }

      return {
        id: Math.random().toString(36),
        role: "assistant",
        content,
        timestamp: new Date(),
        metadata: {
          processingTime: Date.now() - startTime,
          routingPlan,
          toolsCalled: [routingPlan.selectedTool],
          server: routingPlan.selectedServer,
        },
      };
    } catch (error) {
      return {
        id: Math.random().toString(36),
        role: "assistant",
        content: `Failed to execute ${routingPlan.selectedTool} on ${routingPlan.selectedServer}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        metadata: {
          processingTime: Date.now() - startTime,
          routingPlan,
          error: true,
        },
      };
    }
  }

  /**
   * Process query using static regex-based routing (fallback)
   */
  private async processQueryWithStaticRouting(query: string, startTime: number): Promise<ChatMessage> {
    // Determine intent and route to appropriate handler
    const intent = this.classifyIntent(query);
    let response: string;
    let toolsCalled: string[] = [];

    switch (intent) {
      case "filesystem-list":
        response = await this.handleFilesystemList(query);
        toolsCalled.push("list_directory");
        break;
      case "filesystem-read":
        response = await this.handleFilesystemRead(query);
        toolsCalled.push("read_file");
        break;
      case "filesystem-write":
        response = await this.handleFilesystemWrite(query);
        toolsCalled.push("write_file");
        break;
      case "filesystem-search":
        response = await this.handleFilesystemSearch(query);
        toolsCalled.push("search_files");
        break;
      case "search":
        response = await this.handleSearch(query);
        toolsCalled.push("search");
        break;
      case "vault-search":
        response = await this.handleVaultSearch(query);
        toolsCalled.push("vault_search");
        break;
      case "knowledge-discovery":
        response = await this.handleKnowledgeDiscovery(query);
        toolsCalled.push("knowledge-discovery");
        break;
      case "note-connection":
        response = await this.handleNoteConnection(query);
        toolsCalled.push("note-connection");
        break;
      default:
        response = await this.handleGeneral(query);
        break;
    }

    return {
      id: Math.random().toString(36),
      role: "assistant",
      content: response,
      timestamp: new Date(),
      metadata: {
        processingTime: Date.now() - startTime,
        toolsCalled,
        intent,
        routingMethod: 'static',
      },
    };
  }

  /**
   * Update server catalog if needed
   */
  private async updateServerCatalogIfNeeded(): Promise<void> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    if (this.lastCatalogUpdate < fiveMinutesAgo) {
      try {
        console.log('Updating server catalog for LLM routing...');
        const catalog = await this.serverDiscovery.discoverAllServers();
        console.log(`Discovered ${catalog.length} servers:`, catalog.map(c => `${c.serverId} (${c.tools.length} tools)`));
        
        if (this.llmRouter) {
          await this.llmRouter.updateServerCatalog(catalog);
          console.log('Server catalog updated for LLM routing');
        }
        this.lastCatalogUpdate = new Date();
      } catch (error) {
        console.error('Failed to update server catalog:', error);
      }
    }
  }

  /**
   * Configure LLM provider
   */
  configureLLM(config: LLMProviderConfig): void {
    this.llmRouter = new LLMQueryRouter(config);
    // Force catalog update on next query
    this.lastCatalogUpdate = new Date(0);
    console.log('LLM routing configured with provider:', config.provider);
  }

  /**
   * Check if LLM routing is available
   */
  hasLLMRouting(): boolean {
    return !!this.llmRouter;
  }

  async insertContentAtCursor(content: string): Promise<void> {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeView) {
      throw new Error("No active markdown view found");
    }

    const editor = activeView.editor;
    const cursor = editor.getCursor();
    editor.replaceRange(content, cursor);
  }

  /**
   * Get the current note's content and metadata
   */
  getCurrentNoteContext(): { content: string; title: string; path: string } | null {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeView) {
      return null;
    }

    const file = activeView.file;
    if (!file) {
      return null;
    }

    return {
      content: activeView.editor.getValue(),
      title: file.basename,
      path: file.path,
    };
  }

  /**
   * Get the currently selected text
   */
  getSelectedText(): string | null {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeView) {
      return null;
    }

    const selection = activeView.editor.getSelection();
    return selection.length > 0 ? selection : null;
  }

  /**
   * Get contextual information for MCP routing
   */
  getContextualInfo(): {
    currentNote?: { content: string; title: string; path: string };
    selectedText?: string;
    cursorContext?: string;
  } {
    const result: {
      currentNote?: { content: string; title: string; path: string };
      selectedText?: string;
      cursorContext?: string;
    } = {};

    // Get current note
    const noteContext = this.getCurrentNoteContext();
    if (noteContext) {
      result.currentNote = noteContext;
    }

    // Get selected text
    const selectedText = this.getSelectedText();
    if (selectedText) {
      result.selectedText = selectedText;
    }

    // Get cursor context (lines around cursor)
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (activeView) {
      const editor = activeView.editor;
      const cursor = editor.getCursor();
      const contextLines: string[] = [];
      
      // Get 3 lines before and after cursor for context
      for (let i = Math.max(0, cursor.line - 3); i <= Math.min(editor.lastLine(), cursor.line + 3); i++) {
        contextLines.push(editor.getLine(i));
      }
      
      result.cursorContext = contextLines.join('\n').trim();
    }

    return result;
  }

  async createNewNote(title: string, content: string): Promise<void> {
    const fileName = `${title}.md`;
    await this.app.vault.create(fileName, content);
  }

  private classifyIntent(query: string): string {
    const queryLower = query.toLowerCase();

    // File system operations
    if (
      queryLower.includes("list") ||
      queryLower.includes("directory") ||
      queryLower.includes("folder") ||
      queryLower.includes("files") ||
      queryLower.includes("ls") ||
      queryLower.includes("dir")
    ) {
      return "filesystem-list";
    }

    if (
      queryLower.includes("read") ||
      queryLower.includes("open") ||
      queryLower.includes("show") ||
      queryLower.includes("cat") ||
      queryLower.includes("content")
    ) {
      return "filesystem-read";
    }

    if (
      queryLower.includes("write") ||
      queryLower.includes("create") ||
      queryLower.includes("save")
    ) {
      return "filesystem-write";
    }

    // Vault search (notes, content, tags)
    if (
      (queryLower.includes("find") || queryLower.includes("search")) &&
      (queryLower.includes("notes") || queryLower.includes("note") ||
       queryLower.includes("vault") || queryLower.includes("my") ||
       queryLower.includes("written") || queryLower.includes("about"))
    ) {
      return "vault-search";
    }

    // Filesystem search (files, directories)
    if (queryLower.includes("find") || queryLower.includes("search")) {
      return "filesystem-search";
    }

    // Note connection (more specific than discovery)
    if (
      queryLower.includes("connect") &&
      (queryLower.includes("notes") || queryLower.includes("ideas") || 
       queryLower.includes("on") || queryLower.includes("about"))
    ) {
      return "note-connection";
    }

    // General knowledge discovery
    if (
      queryLower.includes("discover") ||
      queryLower.includes("related")
    ) {
      return "knowledge-discovery";
    }

    return "general";
  }

  private async handleSearch(query: string): Promise<string> {
    // Extract search terms from query
    const searchTerms = query.replace(/^(find|search)\s+/i, "");

    // Search across MCP servers
    const results = await this.mcpClient.searchAcrossServers(searchTerms);

    if (results.length === 0) {
      return `No results found for "${searchTerms}"`;
    }

    return (
      `Found ${results.length} results for "${searchTerms}":\n\n` +
      results
        .slice(0, 5)
        .map(
          (result, index) =>
            `${index + 1}. ${result.title || "Untitled"}\n   ${result.content || "No content available"}\n`,
        )
        .join("\n")
    );
  }

  private async handleVaultSearch(query: string): Promise<string> {
    // Extract search terms from query
    const searchTerms = query.replace(/^(find|search)\s+(my\s+)?(notes?\s+)?(about\s+|on\s+)?/i, "").trim();
    
    if (!searchTerms) {
      return "Please specify what you'd like to search for in your vault.";
    }

    try {
      // Get plugin integration status for user feedback
      const integrations = this.vaultSearchService.getPluginIntegrations();
      
      // Perform vault search
      const results = await this.vaultSearchService.search(searchTerms, {
        maxResults: 10,
        minRelevanceScore: 0.1,
        includeContent: true,
        contextLines: 2
      });

      if (results.length === 0) {
        let message = `No notes found for "${searchTerms}".`;
        
        // Suggest plugin integrations for better search
        if (!integrations.omnisearch && !integrations.restapi) {
          message += "\n\n💡 **Tip**: Install the Omnisearch plugin for more powerful search capabilities, including OCR and semantic search.";
        }
        
        return message;
      }

      // Format results
      let response = `Found ${results.length} notes about "${searchTerms}":\n\n`;
      
      results.slice(0, 8).forEach((result, index) => {
        const relevancePercent = Math.round(result.relevanceScore * 100);
        response += `**${index + 1}. ${result.title}** (${relevancePercent}% match)\n`;
        response += `📄 ${result.metadata.path}\n`;
        
        if (result.excerpt) {
          // Clean up excerpt and limit length
          const cleanExcerpt = result.excerpt.replace(/\n+/g, ' ').trim();
          const limitedExcerpt = cleanExcerpt.length > 200 
            ? cleanExcerpt.substring(0, 200) + '...' 
            : cleanExcerpt;
          response += `💬 "${limitedExcerpt}"\n`;
        }
        
        if (result.metadata.tags && result.metadata.tags.length > 0) {
          response += `🏷️ ${result.metadata.tags.slice(0, 3).map(tag => `#${tag}`).join(' ')}\n`;
        }
        
        response += `📅 Modified: ${result.metadata.modified.toLocaleDateString()}\n\n`;
      });

      // Add search enhancement info
      if (integrations.omnisearch) {
        response += "🔍 *Enhanced by Omnisearch plugin*";
      } else if (results.length >= 8) {
        response += "\n💡 *Install Omnisearch plugin for even better search results with OCR and semantic search*";
      }

      return response;
      
    } catch (error) {
      console.error('Vault search error:', error);
      return `Error searching vault: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  private async handleKnowledgeDiscovery(query: string): Promise<string> {
    const discoveries =
      await this.knowledgeEngine.discoverRelatedContent(query);

    if (discoveries.length === 0) {
      return "No related content found.";
    }

    return (
      `Found ${discoveries.length} related items:\n\n` +
      discoveries
        .slice(0, 5)
        .map(
          (item, index) =>
            `${index + 1}. **${item.title}** (${item.source})\n   ${item.content.substring(0, 200)}...\n   *Relevance: ${(item.relevanceScore * 100).toFixed(1)}%*\n`,
        )
        .join("\n")
    );
  }

  private async handleNoteConnection(query: string): Promise<string> {
    // Extract topic from query
    const topicMatch = query.match(/(?:connect|connection).*?(?:on|about|for)\s+(.+?)(?:\?|$)/i);
    const topic = topicMatch ? topicMatch[1].trim() : query.replace(/^(connect|connection)\s+/i, '').trim();
    
    if (!topic || topic.length < 2) {
      return "Please specify a topic to connect notes about. For example: 'Connect notes on artificial intelligence'";
    }

    try {
      const network = await this.knowledgeEngine.connectNotesOnTopic(topic);
      
      if (network.nodes.length === 0) {
        return `No notes found related to "${topic}". Try searching with different keywords.`;
      }

      // Format the network analysis response
      let response = `## 🕸️ Note Network: "${topic}"\n\n`;
      
      // Summary
      response += `**Network Overview:**\n`;
      response += `- 📝 ${network.summary.totalNotes} related notes\n`;
      response += `- 🔗 ${network.summary.totalConnections} connections discovered\n`;
      
      if (network.summary.keyThemes.length > 0) {
        response += `- 🎯 Key themes: ${network.summary.keyThemes.join(', ')}\n`;
      }
      response += `\n`;

      // Strongest connections
      if (network.summary.strongestConnections.length > 0) {
        response += `**🔥 Strongest Connections:**\n`;
        network.summary.strongestConnections.slice(0, 3).forEach((conn, index) => {
          const strength = Math.round(conn.strength * 100);
          response += `${index + 1}. **${conn.sourceNote.title}** ↔️ **${conn.targetNote.title}** (${strength}%)\n`;
          response += `   *${conn.reason}*\n\n`;
        });
      }

      // Node analysis
      const hubNodes = network.nodes.filter(node => node.nodeType === 'hub').slice(0, 3);
      if (hubNodes.length > 0) {
        response += `**🌟 Hub Notes (most connected):**\n`;
        hubNodes.forEach((node, index) => {
          response += `${index + 1}. **${node.title}** (${node.connectionCount} connections)\n`;
        });
        response += `\n`;
      }

      // Clusters
      if (network.clusters.length > 0) {
        response += `**📚 Note Clusters:**\n`;
        network.clusters.slice(0, 3).forEach((cluster, index) => {
          response += `${index + 1}. **${cluster.theme}** - ${cluster.notes.length} notes\n`;
          cluster.notes.slice(0, 3).forEach(note => {
            response += `   • ${note.title}\n`;
          });
          if (cluster.notes.length > 3) {
            response += `   • ...and ${cluster.notes.length - 3} more\n`;
          }
          response += `\n`;
        });
      }

      // Suggestions
      if (network.summary.suggestions.length > 0) {
        response += `**💡 Connection Suggestions:**\n`;
        network.summary.suggestions.forEach((suggestion, index) => {
          response += `${index + 1}. ${suggestion.description}\n`;
          response += `   *${suggestion.reason}*\n\n`;
        });
      }

      // Note: Could add visualization here if needed
      response += `*Use the graph view or install a graph visualization plugin to see these connections visually.*`;
      
      return response;
      
    } catch (error) {
      console.error('Note connection error:', error);
      return `Error analyzing note connections for "${topic}": ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  private async handleFilesystemList(query: string): Promise<string> {
    const connectedServers = this.mcpClient.getConnectedServers();
    const filesystemServer = connectedServers.find(server => server === 'filesystem');
    
    if (!filesystemServer) {
      return "Filesystem server is not connected. Please check your settings.";
    }

    // Extract path from query or use current directory
    let path = ".";
    
    // Handle common phrases that should use current directory
    const currentDirPhrases = [
      /^list\s+(?:the\s+)?(?:current\s+)?directory$/i,
      /^list\s+(?:the\s+)?(?:current\s+)?folder$/i,
      /^list\s+files$/i,
      /^list$/i,
      /^ls$/i
    ];
    
    const isCurrentDir = currentDirPhrases.some(pattern => pattern.test(query.trim()));
    
    if (!isCurrentDir) {
      // Try to extract specific path
      const pathMatch = query.match(/(?:list|ls|show)\s+(?:directory\s+|folder\s+)?(.+)/i);
      if (pathMatch) {
        const extractedPath = pathMatch[1].trim();
        // Don't use common words as paths
        if (!['directory', 'current', 'the', 'files', 'folder'].includes(extractedPath.toLowerCase())) {
          path = extractedPath;
        }
      }
    }

    try {
      const response = await this.mcpClient.callTool(filesystemServer, "list_directory", { path });
      const content = (response.result as any)?.content;
      
      if (Array.isArray(content)) {
        return content.map(item => item.text || '').join('\n');
      } else if (typeof content === 'string') {
        return content;
      }
      
      return `Directory listing for: ${path}\n${JSON.stringify(content, null, 2)}`;
    } catch (error) {
      return `Failed to list directory: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  private async handleFilesystemRead(query: string): Promise<string> {
    const connectedServers = this.mcpClient.getConnectedServers();
    const filesystemServer = connectedServers.find(server => server === 'filesystem');
    
    if (!filesystemServer) {
      return "Filesystem server is not connected. Please check your settings.";
    }

    // Extract file path from query
    const pathMatch = query.match(/(?:read|open|show|cat)\s+(.+)/i);
    if (!pathMatch) {
      return "Please specify a file path to read.";
    }

    const path = pathMatch[1].trim();

    try {
      const response = await this.mcpClient.callTool(filesystemServer, "read_file", { path });
      const content = (response.result as any)?.content;
      
      if (Array.isArray(content)) {
        return content.map(item => item.text || '').join('\n');
      } else if (typeof content === 'string') {
        return content;
      }
      
      return `File contents of ${path}:\n${JSON.stringify(content, null, 2)}`;
    } catch (error) {
      return `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  private async handleFilesystemWrite(query: string): Promise<string> {
    const connectedServers = this.mcpClient.getConnectedServers();
    const filesystemServer = connectedServers.find(server => server === 'filesystem');
    
    if (!filesystemServer) {
      return "Filesystem server is not connected. Please check your settings.";
    }

    // Extract file path and content from query
    const writeMatch = query.match(/(?:write|create|save)\s+(.+)\s+with\s+(.+)/i);
    if (!writeMatch) {
      return "Please specify: write <file_path> with <content>";
    }

    const path = writeMatch[1].trim();
    const content = writeMatch[2].trim();

    try {
      await this.mcpClient.callTool(filesystemServer, "write_file", { path, content });
      return `Successfully wrote to ${path}`;
    } catch (error) {
      return `Failed to write file: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  private async handleFilesystemSearch(query: string): Promise<string> {
    const connectedServers = this.mcpClient.getConnectedServers();
    const filesystemServer = connectedServers.find(server => server === 'filesystem');
    
    if (!filesystemServer) {
      return "Filesystem server is not connected. Please check your settings.";
    }

    // Extract search pattern from query
    const searchMatch = query.match(/(?:find|search)\s+(.+)/i);
    if (!searchMatch) {
      return "Please specify a search pattern.";
    }

    const pattern = searchMatch[1].trim();

    try {
      const response = await this.mcpClient.callTool(filesystemServer, "search_files", { 
        path: ".", 
        pattern 
      });
      const content = (response.result as any)?.content;
      
      if (Array.isArray(content)) {
        return content.map(item => item.text || '').join('\n');
      } else if (typeof content === 'string') {
        return content;
      }
      
      return `Search results for "${pattern}":\n${JSON.stringify(content, null, 2)}`;
    } catch (error) {
      return `Failed to search files: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  private async handleGeneral(query: string): Promise<string> {
    // For general queries, try to route to the most appropriate MCP server
    const connectedServers = this.mcpClient.getConnectedServers();

    if (connectedServers.length === 0) {
      return "No MCP servers are currently connected. Please check your settings.";
    }

    // Try to use the first available server for general queries
    try {
      const response = await this.mcpClient.callTool(
        connectedServers[0],
        "chat",
        { message: query },
      );
      const content = (response.result as any)?.content;
      if (typeof content === 'string') {
        return content;
      } else if (Array.isArray(content)) {
        return content.map(item => item.text || '').join('\\n');
      } else if (content && typeof content === 'object') {
        return JSON.stringify(content);
      }
      return "No response from server";
    } catch (error) {
      return `I'm not sure how to help with that. Connected servers: ${connectedServers.join(", ")}`;
    }
  }
}
