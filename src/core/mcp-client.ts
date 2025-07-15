import { MCPBridgeSettings, MCPServerConfig, MCPResponse } from '@/types/settings';

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
  private process?: any; // Node.js child process for stdio
  private websocket?: WebSocket; // For websocket connections
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
    if (!this.isConnected) {
      throw new Error(`Not connected to server: ${this.serverId}`);
    }

    // TODO: Implement actual MCP protocol tool call
    // This is a placeholder implementation
    return {
      id: Math.random().toString(36),
      result: {
        content: `Tool ${toolName} called with parameters: ${JSON.stringify(parameters)}`
      }
    };
  }

  async getResources(): Promise<any[]> {
    if (!this.isConnected) {
      throw new Error(`Not connected to server: ${this.serverId}`);
    }

    // TODO: Implement actual MCP protocol resource listing
    return [];
  }

  async search(query: string): Promise<any[]> {
    if (!this.isConnected) {
      throw new Error(`Not connected to server: ${this.serverId}`);
    }

    // TODO: Implement actual search functionality
    return [];
  }

  private async connectStdio(): Promise<void> {
    // TODO: Implement stdio connection using Node.js child_process
    console.log(`Connecting via stdio: ${this.config.command} ${this.config.args.join(' ')}`);
    
    // Placeholder - actual implementation would use child_process.spawn
    // and handle MCP protocol over stdin/stdout
  }

  private async connectWebSocket(): Promise<void> {
    if (!this.config.url) {
      throw new Error('WebSocket URL required for websocket connection');
    }

    console.log(`Connecting via WebSocket: ${this.config.url}`);
    
    // TODO: Implement WebSocket connection with MCP protocol
    // this.websocket = new WebSocket(this.config.url);
  }

  private async connectSSE(): Promise<void> {
    if (!this.config.url) {
      throw new Error('SSE URL required for SSE connection');
    }

    console.log(`Connecting via SSE: ${this.config.url}`);
    
    // TODO: Implement Server-Sent Events connection
  }
}
