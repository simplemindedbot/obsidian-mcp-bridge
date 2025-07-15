import { MCPBridgeSettings, MCPServerConfig, MCPResponse } from '@/types/settings';
import { ChildProcess } from 'child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

export class MCPClient {
  private settings: MCPBridgeSettings;
  private connections: Map<string, MCPConnection> = new Map();
  private isInitialized = false;

  constructor(settings: MCPBridgeSettings) {
    this.settings = settings;
  }

  async initialize(): Promise<void> {
    console.log('Initializing MCP Client...');
    
    // Initialize connections for enabled servers
    for (const [serverId, serverConfig] of Object.entries(this.settings.servers)) {
      if (serverConfig.enabled) {
        try {
          const connection = new MCPConnection(serverId, serverConfig);
          await connection.connect();
          this.connections.set(serverId, connection);
          console.log(`Connected to MCP server: ${serverId}`);
        } catch (error) {
          console.error(`Failed to connect to MCP server ${serverId}:`, error);
        }
      }
    }

    this.isInitialized = true;
  }

  async disconnect(): Promise<void> {
    console.log('Disconnecting MCP Client...');
    
    for (const [serverId, connection] of this.connections) {
      try {
        await connection.disconnect();
        console.log(`Disconnected from MCP server: ${serverId}`);
      } catch (error) {
        console.error(`Error disconnecting from server ${serverId}:`, error);
      }
    }

    this.connections.clear();
    this.isInitialized = false;
  }

  async updateSettings(newSettings: MCPBridgeSettings): Promise<void> {
    this.settings = newSettings;
    
    // Reinitialize connections
    await this.disconnect();
    await this.initialize();
  }

  async callTool(serverId: string, toolName: string, parameters?: any): Promise<MCPResponse> {
    const connection = this.connections.get(serverId);
    if (!connection) {
      throw new Error(`No connection to server: ${serverId}`);
    }

    return await connection.callTool(toolName, parameters);
  }

  async getResources(serverId: string): Promise<any[]> {
    const connection = this.connections.get(serverId);
    if (!connection) {
      throw new Error(`No connection to server: ${serverId}`);
    }

    return await connection.getResources();
  }

  async searchAcrossServers(query: string): Promise<any[]> {
    const results: any[] = [];
    
    for (const [serverId, connection] of this.connections) {
      try {
        const serverResults = await connection.search(query);
        results.push(...serverResults.map((result: any) => ({
          ...result,
          source: serverId
        })));
      } catch (error) {
        console.warn(`Search failed for server ${serverId}:`, error);
      }
    }

    return results;
  }

  getConnectedServers(): string[] {
    return Array.from(this.connections.keys());
  }

  isServerConnected(serverId: string): boolean {
    return this.connections.has(serverId);
  }
}

class MCPConnection {
  private serverId: string;
  private config: MCPServerConfig;
  private process?: ChildProcess; // Node.js child process for stdio
  private websocket?: WebSocket; // For websocket connections
  private client?: Client; // MCP SDK client
  private transport?: StdioClientTransport; // MCP transport
  private isConnected = false;

  constructor(serverId: string, config: MCPServerConfig) {
    this.serverId = serverId;
    this.config = config;
  }

  async connect(): Promise<void> {
    console.log(`Connecting to MCP server: ${this.serverId}`);
    
    switch (this.config.type) {
      case 'stdio':
        await this.connectStdio();
        break;
      case 'websocket':
        await this.connectWebSocket();
        break;
      case 'sse':
        await this.connectSSE();
        break;
      default:
        throw new Error(`Unsupported connection type: ${this.config.type}`);
    }

    this.isConnected = true;
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) return;

    if (this.client) {
      try {
        await this.client.close();
      } catch (error) {
        console.error(`Error closing MCP client for ${this.serverId}:`, error);
      }
      this.client = undefined;
    }

    if (this.transport) {
      try {
        await this.transport.close();
      } catch (error) {
        console.error(`Error closing MCP transport for ${this.serverId}:`, error);
      }
      this.transport = undefined;
    }

    if (this.process) {
      this.process.kill();
      this.process = undefined;
    }

    if (this.websocket) {
      this.websocket.close();
      this.websocket = undefined;
    }

    this.isConnected = false;
  }

  async callTool(toolName: string, parameters?: any): Promise<MCPResponse> {
    if (!this.isConnected || !this.client) {
      throw new Error(`Not connected to server: ${this.serverId}`);
    }

    try {
      // List available tools first to validate the tool exists
      const tools = await this.client.listTools();
      const tool = tools.tools.find(t => t.name === toolName);
      
      if (!tool) {
        throw new Error(`Tool '${toolName}' not found on server '${this.serverId}'`);
      }

      // Call the tool with the MCP client
      const result = await this.client.callTool({
        name: toolName,
        arguments: parameters || {}
      });

      return {
        id: Math.random().toString(36),
        result: {
          content: result.content || [],
          isError: result.isError || false
        }
      };
    } catch (error) {
      console.error(`Error calling tool ${toolName} on server ${this.serverId}:`, error);
      throw error;
    }
  }

  async getResources(): Promise<any[]> {
    if (!this.isConnected || !this.client) {
      throw new Error(`Not connected to server: ${this.serverId}`);
    }

    try {
      // List available resources using the MCP client
      const resources = await this.client.listResources();
      return resources.resources || [];
    } catch (error) {
      console.error(`Error listing resources on server ${this.serverId}:`, error);
      throw error;
    }
  }

  async search(query: string): Promise<any[]> {
    if (!this.isConnected || !this.client) {
      throw new Error(`Not connected to server: ${this.serverId}`);
    }

    try {
      // First, try to find a search tool
      const tools = await this.client.listTools();
      const searchTool = tools.tools.find(t => 
        t.name.toLowerCase().includes('search') || 
        t.name.toLowerCase().includes('find') ||
        t.name.toLowerCase().includes('query')
      );

      if (searchTool) {
        // Use the search tool if available
        const result = await this.client.callTool({
          name: searchTool.name,
          arguments: { query }
        });
        return Array.isArray(result.content) ? result.content : [result.content];
      }

      // Fallback: search through resources
      const resources = await this.getResources();
      return resources.filter(resource => 
        resource.name?.toLowerCase().includes(query.toLowerCase()) ||
        resource.description?.toLowerCase().includes(query.toLowerCase())
      );
    } catch (error) {
      console.error(`Error searching on server ${this.serverId}:`, error);
      return [];
    }
  }

  private async connectStdio(): Promise<void> {
    if (!this.config.command) {
      throw new Error('Command is required for stdio connection');
    }

    console.log(`Connecting via stdio: ${this.config.command} ${this.config.args?.join(' ') || ''}`);
    
    try {
      // Create MCP transport - this handles process spawning internally
      this.transport = new StdioClientTransport({
        command: this.config.command,
        args: this.config.args || [],
        env: this.config.env || {}
      });

      // Create MCP client
      this.client = new Client({
        name: 'obsidian-mcp-bridge',
        version: '0.1.0'
      }, {
        capabilities: {
          tools: {},
          resources: {}
        }
      });

      // Connect to the MCP server
      await this.client.connect(this.transport);
      console.log(`Successfully connected to MCP server: ${this.serverId}`);
    } catch (error) {
      console.error(`Failed to connect to MCP server ${this.serverId}:`, error);
      await this.disconnect();
      throw error;
    }
  }

  private async connectWebSocket(): Promise<void> {
    if (!this.config.url) {
      throw new Error('WebSocket URL required for websocket connection');
    }

    console.log(`Connecting via WebSocket: ${this.config.url}`);
    
    try {
      // Create WebSocket connection
      this.websocket = new WebSocket(this.config.url);
      
      // Wait for connection to open
      await new Promise<void>((resolve, reject) => {
        this.websocket!.onopen = () => {
          console.log(`WebSocket connected to ${this.serverId}`);
          resolve();
        };
        
        this.websocket!.onerror = (error) => {
          console.error(`WebSocket error for ${this.serverId}:`, error);
          reject(new Error(`WebSocket connection failed: ${error}`));
        };
        
        this.websocket!.onclose = () => {
          console.log(`WebSocket disconnected from ${this.serverId}`);
          this.isConnected = false;
        };
      });

      // Create MCP client with WebSocket transport
      this.client = new Client({
        name: 'obsidian-mcp-bridge',
        version: '0.1.0'
      }, {
        capabilities: {
          tools: {},
          resources: {}
        }
      });

      // Note: WebSocket transport would need to be implemented
      // For now, throw an error to indicate this needs more work
      throw new Error('WebSocket transport not yet implemented - use stdio for now');
    } catch (error) {
      console.error(`Failed to connect via WebSocket to ${this.serverId}:`, error);
      if (this.websocket) {
        this.websocket.close();
        this.websocket = undefined;
      }
      throw error;
    }
  }

  private async connectSSE(): Promise<void> {
    if (!this.config.url) {
      throw new Error('SSE URL required for SSE connection');
    }

    console.log(`Connecting via SSE: ${this.config.url}`);
    
    try {
      // Create MCP client for SSE
      this.client = new Client({
        name: 'obsidian-mcp-bridge',
        version: '0.1.0'
      }, {
        capabilities: {
          tools: {},
          resources: {}
        }
      });

      // Note: SSE transport would need to be implemented
      // For now, throw an error to indicate this needs more work
      throw new Error('SSE transport not yet implemented - use stdio for now');
    } catch (error) {
      console.error(`Failed to connect via SSE to ${this.serverId}:`, error);
      throw error;
    }
  }
}
