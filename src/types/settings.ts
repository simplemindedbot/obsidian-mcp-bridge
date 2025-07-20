export interface MCPServerConfig {
  name: string;
  command: string;
  args: string[];
  enabled: boolean;
  env?: Record<string, string>;
  timeout?: number;
  retryAttempts?: number;
  type?: "stdio" | "websocket" | "sse";
  url?: string; // For websocket/sse servers
  workingDirectory?: string; // Working directory for the server
}

export interface KnowledgeDiscoverySettings {
  enableAutoDiscovery: boolean;
  discoveryHotkey: string;
  maxResults: number;
  includeVaultContent: boolean;
  includeWebSearch: boolean;
  semanticSearchThreshold: number;
}

export interface ChatInterfaceSettings {
  enableChat: boolean;
  chatPosition: "right" | "left" | "floating";
  autoSubmit: boolean;
  showTypingIndicator: boolean;
  messageHistory: number;
}

export interface ContentProcessingSettings {
  autoLinkGeneration: boolean;
  contentSanitization: boolean;
  markdownConversion: boolean;
  preserveFormatting: boolean;
  insertionMode: "cursor" | "end" | "modal";
}

export interface LoggingSettings {
  enableFileLogging: boolean;
  enableConsoleLogging: boolean;
  logLevel: "error" | "warn" | "info" | "debug" | "trace";
  logFilePath?: string;
  maxLogFileSize: number;
  maxLogFiles: number;
  enablePerformanceLogging: boolean;
  enableNetworkLogging: boolean;
}

export interface MCPBridgeSettings {
  // Version for data migration
  version?: string;

  // Server Configuration
  servers: Record<string, MCPServerConfig>;
  defaultTimeout: number;
  maxConcurrentConnections: number;

  // Knowledge Discovery
  knowledgeDiscovery: KnowledgeDiscoverySettings;

  // Chat Interface
  chatInterface: ChatInterfaceSettings;

  // Content Processing
  contentProcessing: ContentProcessingSettings;

  // Logging Configuration
  logging: LoggingSettings;

  // Advanced Settings
  enableDebugMode: boolean;
  logLevel: "error" | "warn" | "info" | "debug";
  enableAnalytics: boolean;

  // API Keys and Credentials
  apiKeys: Record<string, string>;
}

// Current plugin version for migration tracking
export const CURRENT_SETTINGS_VERSION = "0.2.0";

export const DEFAULT_SETTINGS: MCPBridgeSettings = {
  version: CURRENT_SETTINGS_VERSION,
  servers: {
    filesystem: {
      name: "File System",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem"],
      workingDirectory: "", // Will be set to vault path at runtime
      enabled: false,
      timeout: 30000,
      retryAttempts: 3,
      type: "stdio",
    },
    git: {
      name: "Git Repository",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-git", "./"],
      enabled: false,
      timeout: 30000,
      retryAttempts: 3,
      type: "stdio",
    },
    "web-search": {
      name: "Web Search",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-brave-search"],
      enabled: false,
      timeout: 30000,
      retryAttempts: 3,
      type: "stdio",
    },
  },
  defaultTimeout: 30000,
  maxConcurrentConnections: 5,

  knowledgeDiscovery: {
    enableAutoDiscovery: true,
    discoveryHotkey: "Mod+Shift+K",
    maxResults: 10,
    includeVaultContent: true,
    includeWebSearch: false,
    semanticSearchThreshold: 0.7,
  },

  chatInterface: {
    enableChat: true,
    chatPosition: "right",
    autoSubmit: false,
    showTypingIndicator: true,
    messageHistory: 100,
  },

  contentProcessing: {
    autoLinkGeneration: true,
    contentSanitization: true,
    markdownConversion: true,
    preserveFormatting: true,
    insertionMode: "cursor",
  },

  logging: {
    enableFileLogging: true,
    enableConsoleLogging: true,
    logLevel: "info",
    maxLogFileSize: 10 * 1024 * 1024, // 10MB
    maxLogFiles: 5,
    enablePerformanceLogging: false,
    enableNetworkLogging: false,
  },

  enableDebugMode: false,
  logLevel: "info",
  enableAnalytics: false,

  apiKeys: {},
};

// MCP Protocol Response Types
export interface MCPToolResult {
  content: Array<{
    type: "text" | "image" | "resource";
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

export interface MCPResourceResult {
  uri: string;
  name?: string;
  description?: string;
  mimeType?: string;
  contents: string;
  content?: Array<{
    type: "text" | "image" | "resource";
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
}

export interface MCPSearchResult {
  content?: Array<{
    type: "text" | "image" | "resource";
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  results: Array<{
    title: string;
    content: string;
    uri?: string;
    relevance?: number;
  }>;
}

export interface MCPErrorData {
  type?: string;
  details?: string;
  stack?: string;
  code?: string;
}

export type MCPResultData = MCPToolResult | MCPResourceResult | MCPSearchResult | Record<string, unknown>;

export interface MCPResponse {
  id: string;
  result?: MCPResultData;
  error?: {
    code: number;
    message: string;
    data?: MCPErrorData;
  };
}

export interface KnowledgeItemMetadata {
  // File-based metadata
  filePath?: string;
  path?: string;
  fileSize?: number;
  size?: number;
  lastModified?: Date;
  modified?: Date;
  tags?: string[];
  
  // Web-based metadata
  url?: string;
  domain?: string;
  author?: string;
  publishDate?: Date;
  
  // MCP server metadata
  serverId?: string;
  serverName?: string;
  toolUsed?: string;
  
  // Content metadata
  wordCount?: number;
  language?: string;
  contentType?: string;
  
  // Discovery metadata
  searchQuery?: string;
  discoveryMethod?: "vault" | "mcp" | "web" | "manual";
  processingTime?: number;
  score?: number;
}

export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  source: string;
  relevanceScore: number;
  type: "note" | "web" | "code" | "resource";
  metadata?: KnowledgeItemMetadata;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  metadata?: {
    serverUsed?: string;
    toolsCalled?: string[];
    processingTime?: number;
  };
}
