import { App } from "obsidian";
import { MCPClient } from "@/core/mcp-client";
import { KnowledgeItem } from "@/types/settings";
import { NoteConnectionService, NoteNetwork } from "@/services/note-connections";

export class KnowledgeEngine {
  private app: App;
  private mcpClient: MCPClient;
  private noteConnectionService: NoteConnectionService;

  constructor(app: App, mcpClient: MCPClient) {
    this.app = app;
    this.mcpClient = mcpClient;
    this.noteConnectionService = new NoteConnectionService(app);
  }

  async discoverRelatedContent(context: string): Promise<KnowledgeItem[]> {
    console.log("Discovering related content for context:", context);

    const discoveries: KnowledgeItem[] = [];

    try {
      // Search vault content
      const vaultContent = await this.searchVault(context);
      discoveries.push(...vaultContent);

      // Search MCP servers
      const mcpResults = await this.mcpClient.searchAcrossServers(context);
      const mcpItems = mcpResults.map((result, index) => ({
        id: `mcp-${index}`,
        title: result.title || "MCP Result",
        content: result.content || JSON.stringify(result),
        source: result.source || "unknown",
        relevanceScore: result.score || 0.5,
        type: "resource" as const,
        metadata: result.metadata,
      }));
      discoveries.push(...mcpItems);
    } catch (error) {
      console.error("Error in knowledge discovery:", error);
    }

    // Sort by relevance score
    return discoveries.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  private async searchVault(query: string): Promise<KnowledgeItem[]> {
    const items: KnowledgeItem[] = [];

    // Search through vault files
    const files = this.app.vault.getMarkdownFiles();

    for (const file of files) {
      try {
        const content = await this.app.vault.read(file);
        const relevanceScore = this.calculateRelevance(query, content);

        if (relevanceScore > 0.3) {
          // Threshold for relevance
          items.push({
            id: file.path,
            title: file.basename,
            content: content.substring(0, 500) + "...", // Truncate for preview
            source: "vault",
            relevanceScore,
            type: "note",
            metadata: {
              path: file.path,
              size: file.stat.size,
              modified: new Date(file.stat.mtime),
            },
          });
        }
      } catch (error) {
        console.warn(`Error reading file ${file.path}:`, error);
      }
    }

    return items;
  }

  private calculateRelevance(query: string, content: string): number {
    // Simple relevance calculation - can be enhanced with better algorithms
    const queryWords = query.toLowerCase().split(/\s+/);
    const contentLower = content.toLowerCase();

    let matches = 0;
    for (const word of queryWords) {
      if (contentLower.includes(word)) {
        matches++;
      }
    }

    return matches / queryWords.length;
  }

  /**
   * Connect notes around a specific topic - creates a knowledge network
   */
  async connectNotesOnTopic(topic: string): Promise<NoteNetwork> {
    return this.noteConnectionService.connectNotesOnTopic(topic);
  }

  async generateSuggestions(_currentNote: string): Promise<string[]> {
    // TODO: Generate content suggestions based on current note
    return [];
  }

  async findRelatedNotes(_notePath: string): Promise<string[]> {
    // TODO: Find notes related to the given note
    return [];
  }
}
