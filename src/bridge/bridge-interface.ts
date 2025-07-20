import { App, MarkdownView } from "obsidian";
import { MCPClient } from "@/core/mcp-client";
import { KnowledgeEngine } from "@/knowledge/knowledge-engine";
import { ChatMessage } from "@/types/settings";

export class BridgeInterface {
  private app: App;
  private mcpClient: MCPClient;
  private knowledgeEngine: KnowledgeEngine;

  constructor(
    app: App,
    mcpClient: MCPClient,
    knowledgeEngine: KnowledgeEngine,
  ) {
    this.app = app;
    this.mcpClient = mcpClient;
    this.knowledgeEngine = knowledgeEngine;
  }

  async processQuery(query: string): Promise<ChatMessage> {
    console.log("Processing query:", query);

    const startTime = Date.now();

    try {
      // Determine intent and route to appropriate handler
      const intent = this.classifyIntent(query);
      let response: string;
      let toolsCalled: string[] = [];

      switch (intent) {
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

      const processingTime = Date.now() - startTime;

      return {
        id: Math.random().toString(36),
        role: "assistant",
        content: response,
        timestamp: new Date(),
        metadata: {
          processingTime,
          toolsCalled,
        },
      };
    } catch (error) {
      console.error("Error processing query:", error);
      return {
        id: Math.random().toString(36),
        role: "assistant",
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : "Unknown error"}`,
        timestamp: new Date(),
        metadata: {
          processingTime: Date.now() - startTime,
        },
      };
    }
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

    if (queryLower.includes("find") || queryLower.includes("search")) {
      return "search";
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
      const content = response.result?.content;
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
