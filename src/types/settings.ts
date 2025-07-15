export interface MCPServerConfig {
  name: string;
  command: string;
  args: string[];
  enabled: boolean;
  env?: Record<string, string>;
  timeout?: number;
  retryAttempts?: number;
  type?: 'stdio' | 'websocket' | 'sse';
  url?: string; // For websocket/sse servers
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
  chatPosition: 'right' | 'left' | 'floating';
  autoSubmit: boolean;
  showTypingIndicator: boolean;
  messageHistory: number;
}

export interface ContentProcessingSettings {
  autoLinkGeneration: boolean;
  contentSanitization: boolean;
  markdownConversion: boolean;
  preserveFormatting: boolean;
  insertionMode: 'cursor' | 'end' | 'modal';
}

export interface MCPBridgeSettings {
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
  
  // Advanced Settings
  enableDebugMode: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  enableAnalytics: boolean;
  
  // API Keys and Credentials
  apiKeys: Record<string, string>;
}

export const DEFAULT_SETTINGS: MCPBridgeSettings = {
  servers: {
    'filesystem': {
      name: 'File System',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', './'],
      enabled: false,
      timeout: 30000,
      retryAttempts: 3,
      type: 'stdio'
    },
    'git': {
      name: 'Git Repository',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-git', './'],
      enabled: false,
      timeout: 30000,
      retryAttempts: 3,
      type: 'stdio'
    },
    'web-search': {
      name: 'Web Search',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-brave-search'],
      enabled: false,
      timeout: 30000,
      retryAttempts: 3,
      type: 'stdio'
    }
  },
  defaultTimeout: 30000,
  maxConcurrentConnections: 5,
  
  knowledgeDiscovery: {
    enableAutoDiscovery: true,
    discoveryHotkey: 'Mod+Shift+K',
    maxResults: 10,
    includeVaultContent: true,
    includeWebSearch: false,
    semanticSearchThreshold: 0.7
  },
  
  chatInterface: {
    enableChat: true,
    chatPosition: 'right',
    autoSubmit: false,
    showTypingIndicator: true,
    messageHistory: 100
  },
  
  contentProcessing: {
    autoLinkGeneration: true,
    contentSanitization: true,
    markdownConversion: true,
    preserveFormatting: true,
    insertionMode: 'cursor'
  },
  
  enableDebugMode: false,
  logLevel: 'info',
  enableAnalytics: false,
  
  apiKeys: {}
};

export interface MCPResponse {
  id: string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  source: string;
  relevanceScore: number;
  type: 'note' | 'web' | 'code' | 'resource';
  metadata?: Record<string, any>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    serverUsed?: string;
    toolsCalled?: string[];
    processingTime?: number;
  };
}
