import { MCPClient } from './mcp-client';
import { MCPServerCatalog, MCPToolDefinition } from './llm-router';
import { getLogger } from '@/utils/logger';

interface RawTool {
  name: string;
  description?: string;
  inputSchema?: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * Service for discovering and cataloging available MCP servers and their capabilities
 */
export class MCPServerDiscovery {
  private logger = getLogger();
  private mcpClient: MCPClient;

  constructor(mcpClient: MCPClient) {
    this.mcpClient = mcpClient;
  }

  /**
   * Discover all available MCP servers and catalog their capabilities
   */
  async discoverAllServers(): Promise<MCPServerCatalog[]> {
    this.logger.info('MCPServerDiscovery', 'Starting discovery of all MCP servers');
    
    const connectedServers = this.mcpClient.getConnectedServers();
    const catalogs: MCPServerCatalog[] = [];

    for (const serverId of connectedServers) {
      try {
        const catalog = await this.discoverServer(serverId);
        catalogs.push(catalog);
        this.logger.info('MCPServerDiscovery', `Discovered server: ${serverId} with ${catalog.tools.length} tools`);
      } catch (error) {
        this.logger.error('MCPServerDiscovery', `Failed to discover server ${serverId}`, error instanceof Error ? error : new Error(String(error)));
        
        // Add server with error status
        catalogs.push({
          serverId,
          name: serverId,
          description: 'Server discovery failed',
          tools: [],
          resources: [],
          status: 'error',
          lastUpdated: new Date(),
        });
      }
    }

    this.logger.info('MCPServerDiscovery', `Discovery complete: ${catalogs.length} servers cataloged`);
    return catalogs;
  }

  /**
   * Discover capabilities of a specific MCP server
   */
  async discoverServer(serverId: string): Promise<MCPServerCatalog> {
    this.logger.debug('MCPServerDiscovery', `Discovering server: ${serverId}`);

    const isConnected = this.mcpClient.isServerConnected(serverId);
    if (!isConnected) {
      throw new Error(`Server ${serverId} is not connected`);
    }

    // Discover tools
    const tools = await this.discoverTools(serverId);
    
    // Discover resources (if available)
    let resources: Array<{ uri: string; name?: string; description?: string; mimeType?: string }> = [];
    try {
      resources = await this.mcpClient.getResources(serverId);
    } catch (error) {
      this.logger.debug('MCPServerDiscovery', `Could not get resources for ${serverId}: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Generate server description based on tools
    const description = this.generateServerDescription(serverId, tools);

    return {
      serverId,
      name: this.generateServerName(serverId),
      description,
      tools,
      resources,
      status: 'connected',
      lastUpdated: new Date(),
    };
  }

  /**
   * Discover available tools for a server
   */
  private async discoverTools(serverId: string): Promise<MCPToolDefinition[]> {
    try {
      // Call the MCP client to list tools
      // We need to add a listTools method to MCPClient
      const toolsResponse = await this.callServerMethod(serverId, 'tools/list', {});
      
      if (!toolsResponse.tools || !Array.isArray(toolsResponse.tools)) {
        this.logger.warn('MCPServerDiscovery', `Server ${serverId} returned invalid tools response`);
        return [];
      }

      const tools: MCPToolDefinition[] = toolsResponse.tools.map((tool: RawTool) => ({
        name: tool.name,
        description: tool.description || 'No description available',
        inputSchema: tool.inputSchema || { type: 'object', properties: {} },
        examples: this.generateToolExamples(tool.name, tool.description || 'No description available'),
        serverId,
      }));

      this.logger.debug('MCPServerDiscovery', `Found ${tools.length} tools for server ${serverId}`);
      return tools;
    } catch (error) {
      this.logger.error('MCPServerDiscovery', `Failed to discover tools for server ${serverId}`, error instanceof Error ? error : new Error(String(error)));
      return [];
    }
  }

  /**
   * Call a raw MCP method on a server
   */
  private async callServerMethod(serverId: string, method: string, params: any): Promise<any> {
    return this.mcpClient.callServerMethod(serverId, method, params);
  }

  /**
   * Generate a human-friendly server name
   */
  private generateServerName(serverId: string): string {
    const nameMap: Record<string, string> = {
      'filesystem': 'File System',
      'git': 'Git Repository',
      'web-search': 'Web Search',
      'brave-search': 'Brave Search',
      'memory': 'Memory & Knowledge',
      'sequential-thinking': 'Sequential Thinking',
    };

    return nameMap[serverId] || serverId.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  /**
   * Generate a description based on available tools
   */
  private generateServerDescription(serverId: string, tools: MCPToolDefinition[]): string {
    if (tools.length === 0) {
      return `MCP server with no available tools`;
    }

    const toolNames = tools.map(t => t.name);
    
    // Server-specific descriptions
    if (serverId === 'filesystem') {
      return `File system operations including ${toolNames.slice(0, 3).join(', ')}${toolNames.length > 3 ? ` and ${toolNames.length - 3} more` : ''}`;
    }

    if (serverId === 'git') {
      return `Git repository operations including ${toolNames.slice(0, 3).join(', ')}${toolNames.length > 3 ? ` and ${toolNames.length - 3} more` : ''}`;
    }

    // Generic description
    return `MCP server providing ${tools.length} tools: ${toolNames.slice(0, 3).join(', ')}${toolNames.length > 3 ? ` and ${toolNames.length - 3} more` : ''}`;
  }

  /**
   * Generate example usage for tools
   */
  private generateToolExamples(toolName: string, description: string): string[] {
    const examples: Record<string, string[]> = {
      'list_directory': ['list files', 'show directory contents', 'ls'],
      'read_file': ['read package.json', 'show file contents', 'cat readme.md'],
      'write_file': ['write hello.txt with "Hello World"', 'create new file', 'save content to file'],
      'search_files': ['find .ts files', 'search for "TODO"', 'locate specific files'],
      'create_directory': ['create folder', 'make directory', 'mkdir new-folder'],
      'move_file': ['move file to folder', 'rename file', 'relocate document'],
      'get_file_info': ['file info', 'file details', 'check file size'],
      'directory_tree': ['show file tree', 'directory structure', 'folder hierarchy'],
      
      // Git tools
      'git_status': ['git status', 'check git state', 'show changes'],
      'git_log': ['git history', 'commit log', 'recent commits'],
      'git_diff': ['show differences', 'git diff', 'compare changes'],
      
      // Search tools
      'web_search': ['search the web', 'find information online', 'google search'],
      'search': ['search for information', 'find content', 'lookup'],
    };

    // Return specific examples or generate generic ones
    return examples[toolName] || [
      `use ${toolName}`,
      `${toolName} operation`,
      description.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().slice(0, 20)
    ].filter(Boolean);
  }

  /**
   * Check if discovery is needed (servers changed, etc.)
   */
  async shouldRediscover(lastCatalog: MCPServerCatalog[]): Promise<boolean> {
    const currentServers = this.mcpClient.getConnectedServers();
    const catalogServers = lastCatalog.map(c => c.serverId);

    // Check if server list changed
    if (currentServers.length !== catalogServers.length) {
      return true;
    }

    for (const serverId of currentServers) {
      if (!catalogServers.includes(serverId)) {
        return true;
      }
    }

    // Check if any servers are older than 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return lastCatalog.some(catalog => catalog.lastUpdated < fiveMinutesAgo);
  }
}