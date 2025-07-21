import {
  MCPBridgeSettings,
  MCPServerConfig,
  MCPResponse,
} from "@/types/settings";
import { ChildProcess } from "child_process";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { WebSocketClientTransport } from "@modelcontextprotocol/sdk/client/websocket.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { getLogger } from "@/utils/logger";
import { PathResolver } from "@/utils/path-resolver";
import { CustomStdioTransport } from "./custom-stdio-transport";

interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

interface ConnectionHealth {
  serverId: string;
  isConnected: boolean;
  lastError?: Error;
  retryCount: number;
  lastRetryTime?: Date;
}

// MCP-specific types for better type safety
export interface MCPToolParameters {
  [key: string]: string | number | boolean | object | null | undefined;
}

export interface MCPResource {
  uri: string;
  name?: string;
  description?: string;
  mimeType?: string;
}

export interface MCPSearchResultItem {
  title: string;
  content: string;
  uri?: string;
  name?: string;
  description?: string;
  relevance?: number;
  score?: number;
  source?: string;
  metadata?: Record<string, unknown>;
}

export class MCPClient {
  private settings: MCPBridgeSettings;
  private connections: Map<string, MCPConnection> = new Map();
  private isInitialized = false;
  private healthMonitor: Map<string, ConnectionHealth> = new Map();
  private retryOptions: RetryOptions = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffFactor: 2,
  };

  constructor(settings: MCPBridgeSettings) {
    this.settings = settings;
  }

  async initialize(): Promise<void> {
    console.log("Initializing MCP Client...");

    // Initialize connections for enabled servers
    for (const [serverId, serverConfig] of Object.entries(
      this.settings.servers,
    )) {
      if (serverConfig.enabled) {
        await this.initializeConnection(serverId, serverConfig);
      }
    }

    this.isInitialized = true;
  }

  private async initializeConnection(
    serverId: string,
    serverConfig: MCPServerConfig,
  ): Promise<void> {
    const maxRetries =
      serverConfig.retryAttempts || this.retryOptions.maxAttempts;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const connection = new MCPConnection(serverId, serverConfig);
        await connection.connect();
        this.connections.set(serverId, connection);

        // Update health monitor
        this.healthMonitor.set(serverId, {
          serverId,
          isConnected: true,
          retryCount: attempt - 1,
          lastRetryTime: attempt > 1 ? new Date() : undefined,
        });

        const logger = getLogger();
        logger.info(
          "MCPClient",
          `Connected to MCP server: ${serverId} (attempt ${attempt}/${maxRetries})`,
        );
        return;
      } catch (error) {
        const logger = getLogger();
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        logger.error(
          "MCPClient",
          `Failed to connect to MCP server ${serverId} (attempt ${attempt}/${maxRetries})`,
          error instanceof Error ? error : new Error(errorMessage),
        );

        // Update health monitor
        this.healthMonitor.set(serverId, {
          serverId,
          isConnected: false,
          lastError: error instanceof Error ? error : new Error(errorMessage),
          retryCount: attempt,
          lastRetryTime: new Date(),
        });

        // If this isn't the last attempt, wait before retrying
        if (attempt < maxRetries) {
          const delay = this.calculateBackoffDelay(attempt);
          console.log(`Retrying connection to ${serverId} in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    console.error(
      `Failed to connect to MCP server ${serverId} after ${maxRetries} attempts`,
    );
  }

  private calculateBackoffDelay(attempt: number): number {
    const delay =
      this.retryOptions.baseDelay *
      Math.pow(this.retryOptions.backoffFactor, attempt - 1);
    return Math.min(delay, this.retryOptions.maxDelay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async disconnect(): Promise<void> {
    console.log("Disconnecting MCP Client...");

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

  async callTool(
    serverId: string,
    toolName: string,
    parameters?: MCPToolParameters,
  ): Promise<MCPResponse> {
    const connection = this.connections.get(serverId);
    if (!connection) {
      throw new Error(`No connection to server: ${serverId}`);
    }

    try {
      const result = await connection.callTool(toolName, parameters);

      // Update health status on successful call
      const health = this.healthMonitor.get(serverId);
      if (health) {
        health.isConnected = true;
        health.lastError = undefined;
      }

      return result;
    } catch (error) {
      // Update health status on error
      const health = this.healthMonitor.get(serverId);
      if (health) {
        health.isConnected = false;
        health.lastError =
          error instanceof Error ? error : new Error("Unknown error");
        health.lastRetryTime = new Date();
      }

      console.error(`Tool call failed for server ${serverId}:`, error);
      throw error;
    }
  }

  async getResources(serverId: string): Promise<MCPResource[]> {
    const connection = this.connections.get(serverId);
    if (!connection) {
      throw new Error(`No connection to server: ${serverId}`);
    }

    return await connection.getResources();
  }

  async searchAcrossServers(query: string): Promise<MCPSearchResultItem[]> {
    const results: MCPSearchResultItem[] = [];

    for (const [serverId, connection] of this.connections) {
      try {
        const serverResults = await connection.search(query);
        results.push(
          ...serverResults.map((result: MCPSearchResultItem) => ({
            ...result,
            source: serverId,
          })),
        );
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

  getServerHealth(serverId: string): ConnectionHealth | undefined {
    return this.healthMonitor.get(serverId);
  }

  getAllServerHealth(): ConnectionHealth[] {
    return Array.from(this.healthMonitor.values());
  }

  async reconnectServer(serverId: string): Promise<boolean> {
    const serverConfig = this.settings.servers[serverId];
    if (!serverConfig || !serverConfig.enabled) {
      throw new Error(`Server ${serverId} not found or disabled`);
    }

    // Remove existing connection
    const existingConnection = this.connections.get(serverId);
    if (existingConnection) {
      await existingConnection.disconnect();
      this.connections.delete(serverId);
    }

    // Attempt to reconnect
    try {
      await this.initializeConnection(serverId, serverConfig);
      return this.connections.has(serverId);
    } catch (error) {
      console.error(`Failed to reconnect to server ${serverId}:`, error);
      return false;
    }
  }

  async healthCheck(): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();

    for (const [serverId, connection] of this.connections) {
      try {
        // Try to list tools as a basic health check
        await connection.getResources();
        results.set(serverId, true);

        // Update health monitor
        const health = this.healthMonitor.get(serverId);
        if (health) {
          health.isConnected = true;
          health.lastError = undefined;
        }
      } catch (error) {
        results.set(serverId, false);

        // Update health monitor
        const health = this.healthMonitor.get(serverId);
        if (health) {
          health.isConnected = false;
          health.lastError =
            error instanceof Error ? error : new Error("Health check failed");
          health.lastRetryTime = new Date();
        }
      }
    }

    return results;
  }
}

class MCPConnection {
  private serverId: string;
  private config: MCPServerConfig;
  private process?: ChildProcess; // Node.js child process for stdio
  private client?: Client; // MCP SDK client
  private transport?:
    | StdioClientTransport
    | WebSocketClientTransport
    | SSEClientTransport; // MCP transport
  private customTransport?: CustomStdioTransport; // Custom stdio transport
  private isConnected = false;

  constructor(serverId: string, config: MCPServerConfig) {
    this.serverId = serverId;
    this.config = config;
  }

  async connect(): Promise<void> {
    console.log(`Connecting to MCP server: ${this.serverId}`);

    const timeout = this.config.timeout || 10000; // Default 10 second timeout

    try {
      const connectPromise = this.performConnection();
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error(`Connection timeout after ${timeout}ms`)),
          timeout,
        );
      });

      await Promise.race([connectPromise, timeoutPromise]);
      this.isConnected = this.customTransport?.isConnected() ?? true;
    } catch (error) {
      // Cleanup on connection failure
      await this.disconnect();
      throw error;
    }
  }

  private async performConnection(): Promise<void> {
    switch (this.config.type) {
      case "stdio":
        await this.connectStdio();
        break;
      case "websocket":
        await this.connectWebSocket();
        break;
      case "sse":
        await this.connectSSE();
        break;
      default:
        throw new Error(`Unsupported connection type: ${this.config.type}`);
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) return;

    if (this.customTransport) {
      try {
        await this.customTransport.disconnect();
      } catch (error) {
        console.error(`Error closing custom transport for ${this.serverId}:`, error);
      }
      this.customTransport = undefined;
    }

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
        console.error(
          `Error closing MCP transport for ${this.serverId}:`,
          error,
        );
      }
      this.transport = undefined;
    }

    if (this.process) {
      this.process.kill();
      this.process = undefined;
    }

    this.isConnected = false;
  }

  async callTool(toolName: string, parameters?: MCPToolParameters): Promise<MCPResponse> {
    if (this.customTransport && this.customTransport.isConnected()) {
      try {
        // List available tools first to validate the tool exists
        const tools = await this.customTransport.listTools();
        const tool = tools.tools?.find((t: any) => t.name === toolName);

        if (!tool) {
          throw new Error(
            `Tool '${toolName}' not found on server '${this.serverId}'`,
          );
        }

        // Call the tool with the custom transport
        const result = await this.customTransport.callTool(toolName, parameters || {});

        return {
          id: Math.random().toString(36),
          result: {
            content: result.content || [],
            isError: result.isError || false,
          },
        };
      } catch (error) {
        console.error(
          `Error calling tool ${toolName} on server ${this.serverId} via custom transport:`,
          error,
        );
        throw error;
      }
    } else if (this.isConnected && this.client) {
      try {
        // List available tools first to validate the tool exists
        const tools = await this.client.listTools();
        const tool = tools.tools.find((t) => t.name === toolName);

        if (!tool) {
          throw new Error(
            `Tool '${toolName}' not found on server '${this.serverId}'`,
          );
        }

        // Call the tool with the MCP client
        const result = await this.client.callTool({
          name: toolName,
          arguments: parameters || {},
        });

        return {
          id: Math.random().toString(36),
          result: {
            content: result.content || [],
            isError: result.isError || false,
          },
        };
      } catch (error) {
        console.error(
          `Error calling tool ${toolName} on server ${this.serverId}:`,
          error,
        );
        throw error;
      }
    } else {
      throw new Error(`Not connected to server: ${this.serverId}`);
    }
  }

  async getResources(): Promise<MCPResource[]> {
    if (this.customTransport && this.customTransport.isConnected()) {
      try {
        // List available resources using the custom transport
        const resources = await this.customTransport.listResources();
        return (resources.resources || []).map((resource: any) => ({
          uri: resource.uri,
          name: resource.name,
          description: resource.description,
          mimeType: resource.mimeType,
        }));
      } catch (error) {
        console.error(
          `Error listing resources on server ${this.serverId} via custom transport:`,
          error,
        );
        throw error;
      }
    } else if (this.isConnected && this.client) {
      try {
        // List available resources using the MCP client
        const resources = await this.client.listResources();
        return (resources.resources || []).map(resource => ({
          uri: resource.uri,
          name: resource.name,
          description: resource.description,
          mimeType: resource.mimeType,
        }));
      } catch (error) {
        console.error(
          `Error listing resources on server ${this.serverId}:`,
          error,
        );
        throw error;
      }
    } else {
      throw new Error(`Not connected to server: ${this.serverId}`);
    }
  }

  async search(query: string): Promise<MCPSearchResultItem[]> {
    if (!this.isConnected || !this.client) {
      throw new Error(`Not connected to server: ${this.serverId}`);
    }

    try {
      // First, try to find a search tool
      const tools = await this.client.listTools();
      const searchTool = tools.tools.find(
        (t) =>
          t.name.toLowerCase().includes("search") ||
          t.name.toLowerCase().includes("find") ||
          t.name.toLowerCase().includes("query"),
      );

      if (searchTool) {
        // Use the search tool if available
        const result = await this.client.callTool({
          name: searchTool.name,
          arguments: { query },
        });
        const searchResults = Array.isArray(result.content)
          ? result.content
          : [result.content];
        
        return searchResults.map((item: unknown): MCPSearchResultItem => {
          const obj = item as Record<string, unknown>;
          return {
            title: (obj.title || obj.name || 'Unknown') as string,
            content: (obj.content || obj.text || '') as string,
            uri: obj.uri as string | undefined,
            name: obj.name as string | undefined,
            description: obj.description as string | undefined,
            relevance: obj.relevance as number | undefined,
          };
        });
      }

      // Fallback: search through resources
      const resources = await this.getResources();
      return resources
        .filter(
          (resource) =>
            resource.name?.toLowerCase().includes(query.toLowerCase()) ||
            resource.description?.toLowerCase().includes(query.toLowerCase()),
        )
        .map((resource): MCPSearchResultItem => ({
          title: resource.name || resource.uri,
          content: resource.description || '',
          uri: resource.uri,
          name: resource.name,
          description: resource.description,
        }));
    } catch (error) {
      console.error(`Error searching on server ${this.serverId}:`, error);
      return [];
    }
  }

  private async connectStdio(): Promise<void> {
    if (!this.config.command) {
      throw new Error("Command is required for stdio connection");
    }

    const logger = getLogger();
    logger.info(
      "MCPConnection",
      `Attempting stdio connection with custom transport: ${this.config.command} ${this.config.args?.join(" ") || ""}`,
    );

    try {
      // Resolve the command path dynamically to avoid ENOENT errors
      const resolvedCommand = await PathResolver.resolveCommand(
        this.config.command,
      );
      logger.debug(
        "MCPConnection",
        `Resolved command path: ${this.config.command} -> ${resolvedCommand}`,
      );

      // Add working directory to args if specified
      const args = [...(this.config.args || [])];
      if (this.config.workingDirectory) {
        args.push(this.config.workingDirectory);
      }

      console.log(`Connecting via custom stdio transport: ${resolvedCommand} ${args.join(" ")}`);

      // Create custom transport
      this.customTransport = new CustomStdioTransport({
        command: resolvedCommand,
        args: args,
        env: {
          ...Object.fromEntries(
            Object.entries(process.env).filter(([_, v]) => v !== undefined)
          ),
          ...(this.config.env || {}),
        } as Record<string, string>,
        workingDirectory: this.config.workingDirectory,
      });

      // Connect using custom transport
      await this.customTransport.connect();
      
      logger.info("MCPConnection", `Successfully connected to MCP server: ${this.serverId}`);
      console.log(`Successfully connected to MCP server: ${this.serverId}`);
    } catch (error) {
      console.error(`Failed to connect to MCP server ${this.serverId}:`, error);
      await this.disconnect();
      throw error;
    }
  }

  private async connectWebSocket(): Promise<void> {
    if (!this.config.url) {
      throw new Error("WebSocket URL required for websocket connection");
    }

    console.log(`Connecting via WebSocket: ${this.config.url}`);

    try {
      // Create WebSocket transport using the official MCP SDK
      this.transport = new WebSocketClientTransport(new URL(this.config.url));

      // Create MCP client
      this.client = new Client(
        {
          name: "obsidian-mcp-bridge",
          version: "0.1.0",
        },
        {
          capabilities: {
            tools: {},
            resources: {},
          },
        },
      );

      // Set up error handling
      this.transport.onerror = (error) => {
        console.error(`WebSocket error for ${this.serverId}:`, error);
        this.isConnected = false;
      };

      this.transport.onclose = () => {
        console.log(`WebSocket disconnected from ${this.serverId}`);
        this.isConnected = false;
      };

      // Connect to the MCP server
      await this.client.connect(this.transport);
      console.log(
        `Successfully connected to MCP server via WebSocket: ${this.serverId}`,
      );
    } catch (error) {
      console.error(
        `Failed to connect via WebSocket to ${this.serverId}:`,
        error,
      );
      await this.disconnect();
      throw error;
    }
  }

  private async connectSSE(): Promise<void> {
    if (!this.config.url) {
      throw new Error("SSE URL required for SSE connection");
    }

    console.log(`Connecting via SSE: ${this.config.url}`);

    try {
      // Create SSE transport using the official MCP SDK
      this.transport = new SSEClientTransport(new URL(this.config.url));

      // Create MCP client
      this.client = new Client(
        {
          name: "obsidian-mcp-bridge",
          version: "0.1.0",
        },
        {
          capabilities: {
            tools: {},
            resources: {},
          },
        },
      );

      // Set up error handling
      this.transport.onerror = (error) => {
        console.error(`SSE error for ${this.serverId}:`, error);
        this.isConnected = false;
      };

      this.transport.onclose = () => {
        console.log(`SSE disconnected from ${this.serverId}`);
        this.isConnected = false;
      };

      // Connect to the MCP server
      await this.client.connect(this.transport);
      console.log(
        `Successfully connected to MCP server via SSE: ${this.serverId}`,
      );
    } catch (error) {
      console.error(`Failed to connect via SSE to ${this.serverId}:`, error);
      await this.disconnect();
      throw error;
    }
  }
}
