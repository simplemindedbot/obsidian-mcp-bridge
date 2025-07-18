# Settings Types Documentation

This document describes the TypeScript type definitions for the MCP Bridge plugin settings and configuration.

## Location

**File**: `src/types/settings.ts`

## Main Types

### `MCPBridgeSettings`

The main settings interface for the plugin.

```typescript
interface MCPBridgeSettings {
  // General settings
  enableDebugMode: boolean;
  autoConnectOnStartup: boolean;
  defaultQueryTimeout: number;
  enableNotifications: boolean;
  
  // Server configurations
  servers: Record<string, MCPServerConfig>;
  
  // Knowledge engine settings
  knowledgeEngine: KnowledgeEngineSettings;
  
  // UI settings
  ui: UISettings;
  
  // Advanced settings
  advanced: AdvancedSettings;
}
```

### `MCPServerConfig`

Base configuration for MCP servers.

```typescript
interface MCPServerConfig {
  name: string;
  type: 'stdio' | 'websocket' | 'sse';
  enabled: boolean;
  timeout?: number;
  retryAttempts?: number;
  description?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}
```

### `StdioServerConfig`

Configuration for STDIO-based MCP servers.

```typescript
interface StdioServerConfig extends MCPServerConfig {
  type: 'stdio';
  command: string;
  args: string[];
  env?: Record<string, string>;
  cwd?: string;
}
```

### `WebSocketServerConfig`

Configuration for WebSocket-based MCP servers.

```typescript
interface WebSocketServerConfig extends MCPServerConfig {
  type: 'websocket';
  url: string;
  headers?: Record<string, string>;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}
```

### `SSEServerConfig`

Configuration for Server-Sent Events MCP servers.

```typescript
interface SSEServerConfig extends MCPServerConfig {
  type: 'sse';
  url: string;
  headers?: Record<string, string>;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}
```

### `KnowledgeEngineSettings`

Settings for the knowledge discovery engine.

```typescript
interface KnowledgeEngineSettings {
  enableVaultSearch: boolean;
  enableMCPSearch: boolean;
  relevanceThreshold: number;
  maxResults: number;
  enableCaching: boolean;
  cacheTimeout: number;
  enableSuggestions: boolean;
  suggestionTypes: SuggestionType[];
  searchAlgorithm: SearchAlgorithm;
  enableSemanticSearch: boolean;
  semanticSearchThreshold: number;
}
```

### `UISettings`

Settings for the user interface.

```typescript
interface UISettings {
  chatView: ChatViewSettings;
  theme: ThemeSettings;
  notifications: NotificationSettings;
  accessibility: AccessibilitySettings;
}
```

### `ChatViewSettings`

Settings specific to the chat view.

```typescript
interface ChatViewSettings {
  enableSuggestions: boolean;
  enableActions: boolean;
  maxMessages: number;
  autoScroll: boolean;
  enableKeyboardShortcuts: boolean;
  messageFormat: 'markdown' | 'plain' | 'rich';
  showTimestamps: boolean;
  enableMessageSearch: boolean;
}
```

### `ThemeSettings`

Theme customization settings.

```typescript
interface ThemeSettings {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  border: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  customCSS?: string;
}
```

### `NotificationSettings`

Settings for notifications.

```typescript
interface NotificationSettings {
  enableConnectionNotifications: boolean;
  enableErrorNotifications: boolean;
  enableSuccessNotifications: boolean;
  notificationDuration: number;
  enableSound: boolean;
  enableDesktopNotifications: boolean;
}
```

### `AccessibilitySettings`

Accessibility-related settings.

```typescript
interface AccessibilitySettings {
  enableHighContrast: boolean;
  enableReducedMotion: boolean;
  fontSize: 'small' | 'medium' | 'large';
  enableScreenReaderSupport: boolean;
  enableKeyboardNavigation: boolean;
}
```

### `AdvancedSettings`

Advanced plugin settings.

```typescript
interface AdvancedSettings {
  performance: PerformanceSettings;
  experimental: ExperimentalSettings;
  debugging: DebuggingSettings;
  security: SecuritySettings;
}
```

### `PerformanceSettings`

Performance-related settings.

```typescript
interface PerformanceSettings {
  maxConcurrentRequests: number;
  requestBatchSize: number;
  memoryLimit: number;
  enableLazyLoading: boolean;
  enableVirtualization: boolean;
  gcInterval: number;
}
```

### `ExperimentalSettings`

Experimental feature settings.

```typescript
interface ExperimentalSettings {
  enableBetaFeatures: boolean;
  enableExperimentalUI: boolean;
  enableAdvancedSearch: boolean;
  enableKnowledgeGraph: boolean;
  enableAIAssistant: boolean;
  features: Record<string, boolean>;
}
```

### `DebuggingSettings`

Debugging and logging settings.

```typescript
interface DebuggingSettings {
  logLevel: 'error' | 'warn' | 'info' | 'debug' | 'trace';
  enableConsoleLogging: boolean;
  enableFileLogging: boolean;
  logFilePath?: string;
  maxLogFileSize: number;
  enablePerformanceMonitoring: boolean;
  enableNetworkLogging: boolean;
}
```

### `SecuritySettings`

Security-related settings.

```typescript
interface SecuritySettings {
  enableSafeMode: boolean;
  allowedHosts: string[];
  blockedHosts: string[];
  enableCORS: boolean;
  enableCSP: boolean;
  maxRequestSize: number;
  enableRateLimiting: boolean;
  rateLimitRequests: number;
  rateLimitWindow: number;
}
```

## Utility Types

### `SuggestionType`

Types of content suggestions.

```typescript
type SuggestionType = 
  | 'link'
  | 'content'
  | 'question'
  | 'related'
  | 'tag'
  | 'template';
```

### `SearchAlgorithm`

Available search algorithms.

```typescript
type SearchAlgorithm = 
  | 'keyword'
  | 'fuzzy'
  | 'semantic'
  | 'hybrid';
```

### `ConnectionStatus`

Status of MCP server connections.

```typescript
type ConnectionStatus = 
  | 'connected'
  | 'connecting'
  | 'disconnected'
  | 'error'
  | 'timeout';
```

### `LogLevel`

Logging levels for debugging.

```typescript
type LogLevel = 
  | 'error'
  | 'warn'
  | 'info'
  | 'debug'
  | 'trace';
```

## Default Settings

### `DEFAULT_SETTINGS`

Default configuration values.

```typescript
const DEFAULT_SETTINGS: MCPBridgeSettings = {
  enableDebugMode: false,
  autoConnectOnStartup: true,
  defaultQueryTimeout: 30000,
  enableNotifications: true,
  
  servers: {},
  
  knowledgeEngine: {
    enableVaultSearch: true,
    enableMCPSearch: true,
    relevanceThreshold: 0.3,
    maxResults: 50,
    enableCaching: true,
    cacheTimeout: 300000,
    enableSuggestions: true,
    suggestionTypes: ['link', 'content', 'related'],
    searchAlgorithm: 'hybrid',
    enableSemanticSearch: false,
    semanticSearchThreshold: 0.7
  },
  
  ui: {
    chatView: {
      enableSuggestions: true,
      enableActions: true,
      maxMessages: 100,
      autoScroll: true,
      enableKeyboardShortcuts: true,
      messageFormat: 'markdown',
      showTimestamps: true,
      enableMessageSearch: true
    },
    theme: {
      primary: '#007acc',
      secondary: '#f0f0f0',
      background: '#ffffff',
      text: '#333333',
      border: '#cccccc',
      accent: '#007acc',
      success: '#28a745',
      warning: '#ffc107',
      error: '#dc3545'
    },
    notifications: {
      enableConnectionNotifications: true,
      enableErrorNotifications: true,
      enableSuccessNotifications: true,
      notificationDuration: 5000,
      enableSound: false,
      enableDesktopNotifications: false
    },
    accessibility: {
      enableHighContrast: false,
      enableReducedMotion: false,
      fontSize: 'medium',
      enableScreenReaderSupport: true,
      enableKeyboardNavigation: true
    }
  },
  
  advanced: {
    performance: {
      maxConcurrentRequests: 10,
      requestBatchSize: 5,
      memoryLimit: 100 * 1024 * 1024, // 100MB
      enableLazyLoading: true,
      enableVirtualization: true,
      gcInterval: 60000
    },
    experimental: {
      enableBetaFeatures: false,
      enableExperimentalUI: false,
      enableAdvancedSearch: false,
      enableKnowledgeGraph: false,
      enableAIAssistant: false,
      features: {}
    },
    debugging: {
      logLevel: 'info',
      enableConsoleLogging: true,
      enableFileLogging: false,
      maxLogFileSize: 10 * 1024 * 1024, // 10MB
      enablePerformanceMonitoring: false,
      enableNetworkLogging: false
    },
    security: {
      enableSafeMode: false,
      allowedHosts: [],
      blockedHosts: [],
      enableCORS: true,
      enableCSP: true,
      maxRequestSize: 10 * 1024 * 1024, // 10MB
      enableRateLimiting: false,
      rateLimitRequests: 100,
      rateLimitWindow: 60000
    }
  }
};
```

## Validation

### `validateSettings(settings: Partial<MCPBridgeSettings>): ValidationResult`

Validates settings configuration.

```typescript
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}
```

### `validateServerConfig(config: MCPServerConfig): ValidationResult`

Validates individual server configuration.

## Migration

### `migrateSettings(oldSettings: any, version: string): MCPBridgeSettings`

Migrates settings from older plugin versions.

```typescript
interface MigrationResult {
  settings: MCPBridgeSettings;
  migrated: boolean;
  changes: MigrationChange[];
}

interface MigrationChange {
  field: string;
  oldValue: any;
  newValue: any;
  reason: string;
}
```

## Usage Examples

### Creating Default Settings

```typescript
import { DEFAULT_SETTINGS } from './types/settings';

const settings: MCPBridgeSettings = { ...DEFAULT_SETTINGS };
```

### Server Configuration

```typescript
const stdioServer: StdioServerConfig = {
  name: 'Filesystem Server',
  type: 'stdio',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem', '/path'],
  enabled: true,
  timeout: 10000,
  retryAttempts: 3
};

const websocketServer: WebSocketServerConfig = {
  name: 'Remote API',
  type: 'websocket',
  url: 'ws://localhost:8080/mcp',
  enabled: true,
  headers: {
    'Authorization': 'Bearer token'
  }
};
```

### Settings Validation

```typescript
import { validateSettings } from './types/settings';

const result = validateSettings(userSettings);
if (!result.valid) {
  console.error('Settings validation failed:', result.errors);
}
```

## Type Guards

### `isStdioServerConfig(config: MCPServerConfig): config is StdioServerConfig`

Type guard for STDIO server configuration.

### `isWebSocketServerConfig(config: MCPServerConfig): config is WebSocketServerConfig`

Type guard for WebSocket server configuration.

### `isSSEServerConfig(config: MCPServerConfig): config is SSEServerConfig`

Type guard for SSE server configuration.

## Best Practices

1. **Use Type Guards**: Always use type guards when working with server configurations
2. **Validate Settings**: Always validate settings before using them
3. **Provide Defaults**: Use default values for optional settings
4. **Document Changes**: Document any changes to settings structure
5. **Version Migration**: Implement migration for breaking changes