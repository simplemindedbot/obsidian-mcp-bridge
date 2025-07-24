import { App, MarkdownView } from "obsidian";
import { MCPClient, MCPToolParameters } from "@/core/mcp-client";
import { KnowledgeEngine } from "@/knowledge/knowledge-engine";
import { ChatMessage } from "@/types/settings";
import { LLMQueryRouter, LLMProviderConfig } from "@/core/llm-router";
import { MCPServerDiscovery } from "@/core/server-discovery";

export class BridgeInterface {
  private app: App;
  private mcpClient: MCPClient;
  private knowledgeEngine: KnowledgeEngine;
  private llmRouter?: LLMQueryRouter;
  private serverDiscovery: MCPServerDiscovery;
  private lastCatalogUpdate: Date = new Date(0);

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
    // Update server catalog if needed
    await this.updateServerCatalogIfNeeded();

    // Analyze query with LLM
    if (!this.llmRouter) {
      throw new Error('LLM router not initialized');
    }
    const routingPlan = await this.llmRouter.analyzeQuery(query);

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

    try {
      // Execute the routing plan
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
      case "knowledge-discovery":
        response = await this.handleKnowledgeDiscovery(query);
        toolsCalled.push("knowledge-discovery");
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

    if (queryLower.includes("find") || queryLower.includes("search")) {
      return "filesystem-search";
    }

    if (
      queryLower.includes("discover") ||
      queryLower.includes("related") ||
      queryLower.includes("connect")
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
