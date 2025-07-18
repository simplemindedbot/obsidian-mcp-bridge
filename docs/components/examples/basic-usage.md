# Basic Usage Examples

This document provides common usage patterns and examples for integrating with the Obsidian MCP Bridge plugin.

## Getting Started

### Initialize the Plugin Components

```typescript
import { App, Plugin } from 'obsidian';
import { MCPClient } from './core/mcp-client';
import { KnowledgeEngine } from './knowledge/knowledge-engine';
import { BridgeInterface } from './bridge/bridge-interface';
import { MCPBridgeSettings } from './types/settings';

class MyPlugin extends Plugin {
  private mcpClient: MCPClient;
  private knowledgeEngine: KnowledgeEngine;
  private bridgeInterface: BridgeInterface;

  async onload() {
    // Load settings
    const settings = await this.loadSettings();
    
    // Initialize components
    this.mcpClient = new MCPClient(settings);
    this.knowledgeEngine = new KnowledgeEngine(this.app, this.mcpClient, settings);
    this.bridgeInterface = new BridgeInterface(this.app, this.knowledgeEngine, settings);
    
    // Initialize MCP client
    await this.mcpClient.initialize();
  }
}
```

## Basic Server Configuration

### Configure a Filesystem Server

```typescript
const filesystemServer: StdioServerConfig = {
  name: 'Local Filesystem',
  type: 'stdio',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem', '/Users/john/Documents'],
  enabled: true,
  timeout: 10000,
  retryAttempts: 3
};

// Add to settings
settings.servers['filesystem'] = filesystemServer;
```

### Configure a WebSocket Server

```typescript
const webSocketServer: WebSocketServerConfig = {
  name: 'Remote API Server',
  type: 'websocket',
  url: 'ws://localhost:8080/mcp',
  enabled: true,
  headers: {
    'Authorization': 'Bearer your-token-here'
  },
  timeout: 15000,
  retryAttempts: 5
};

// Add to settings
settings.servers['remote-api'] = webSocketServer;
```

## Basic MCP Operations

### Connect to Servers

```typescript
// Connect to a specific server
await mcpClient.connect('filesystem');

// Connect to all enabled servers
await mcpClient.initialize();

// Check connection status
const status = mcpClient.getConnectionStatus('filesystem');
console.log(`Filesystem server status: ${status}`);
```

### List Available Tools

```typescript
// List tools for a specific server
const tools = await mcpClient.listTools('filesystem');
console.log('Available tools:', tools.map(t => t.name));

// List tools for all connected servers
const allStatuses = mcpClient.getAllConnectionStatuses();
for (const [serverId, status] of Object.entries(allStatuses)) {
  if (status === 'connected') {
    const serverTools = await mcpClient.listTools(serverId);
    console.log(`${serverId} tools:`, serverTools.map(t => t.name));
  }
}
```

### Call Tools

```typescript
// Read a file using the filesystem server
const fileContent = await mcpClient.callTool('filesystem', 'read_file', {
  path: '/path/to/file.txt'
});

// Write a file
await mcpClient.callTool('filesystem', 'write_file', {
  path: '/path/to/new-file.txt',
  content: 'Hello, world!'
});

// List directory contents
const dirContents = await mcpClient.callTool('filesystem', 'list_directory', {
  path: '/path/to/directory'
});
```

## Basic Knowledge Discovery

### Search the Vault

```typescript
// Search for notes about machine learning
const vaultResults = await knowledgeEngine.searchVault('machine learning', 10);

vaultResults.forEach(result => {
  console.log(`Found: ${result.file.name}`);
  console.log(`Relevance: ${result.relevanceScore}`);
  console.log(`Excerpt: ${result.excerpt}`);
});
```

### Search MCP Servers

```typescript
// Search across all connected MCP servers
const mcpResults = await knowledgeEngine.searchMCPServers('recent AI papers');

mcpResults.forEach(result => {
  console.log(`Server: ${result.serverId}`);
  console.log(`Title: ${result.title}`);
  console.log(`Content: ${result.content.substring(0, 100)}...`);
});
```

### Comprehensive Discovery

```typescript
// Discover related content from both vault and MCP servers
const discoveryResults = await knowledgeEngine.discoverRelatedContent(
  'machine learning algorithms',
  'Currently writing about neural networks'
);

console.log(`Found ${discoveryResults.vaultResults.length} vault matches`);
console.log(`Found ${discoveryResults.mcpResults.length} MCP matches`);
console.log(`Generated ${discoveryResults.suggestions.length} suggestions`);
```

## Basic Query Processing

### Process Natural Language Queries

```typescript
// Process a natural language query
const result = await bridgeInterface.processQuery(
  'find my notes about distributed systems'
);

console.log(`Intent: ${result.intent}`);
console.log(`Results: ${result.results.length}`);
console.log(`Suggestions: ${result.suggestions.length}`);
```

### Handle Different Query Types

```typescript
// Search query
const searchResult = await bridgeInterface.processQuery('search for machine learning papers');

// Create query
const createResult = await bridgeInterface.processQuery('create a note about neural networks');

// Link query
const linkResult = await bridgeInterface.processQuery('link this to my AI research');

// Analyze query
const analyzeResult = await bridgeInterface.processQuery('analyze this document for key concepts');
```

## Basic Content Operations

### Insert Content

```typescript
// Insert content at the cursor position
await bridgeInterface.insertContent(
  '## Related Research\n\n- Paper 1\n- Paper 2\n- Paper 3',
  { position: 'cursor', format: 'markdown' }
);

// Insert content at the end of the document
await bridgeInterface.insertContent(
  '\n\n## References\n\n[1] Important Paper',
  { position: 'end', format: 'markdown' }
);
```

### Create New Notes

```typescript
// Create a new note
const newNote = await bridgeInterface.createNewNote(
  'Machine Learning Research',
  '# Machine Learning Research\n\nThis note contains research on ML algorithms.'
);

console.log(`Created note: ${newNote.path}`);
```

### Generate Content Suggestions

```typescript
// Get content suggestions for the current note
const suggestions = await knowledgeEngine.generateContentSuggestions(
  currentNoteContent,
  'Currently writing about deep learning'
);

suggestions.forEach(suggestion => {
  console.log(`Suggestion: ${suggestion.title}`);
  console.log(`Type: ${suggestion.type}`);
  console.log(`Content: ${suggestion.content}`);
});
```

## Error Handling

### Handle Connection Errors

```typescript
try {
  await mcpClient.connect('filesystem');
} catch (error) {
  console.error('Failed to connect to filesystem server:', error);
  // Show user notification
  new Notice('Failed to connect to filesystem server');
}
```

### Handle Query Errors

```typescript
try {
  const result = await bridgeInterface.processQuery('complex query');
} catch (error) {
  console.error('Query processing failed:', error);
  // Provide fallback response
  const fallbackResult = {
    intent: 'search',
    results: [],
    suggestions: [{ title: 'Try a simpler query', type: 'help' }],
    actions: []
  };
}
```

### Handle Tool Call Errors

```typescript
try {
  const result = await mcpClient.callTool('filesystem', 'read_file', {
    path: '/nonexistent/file.txt'
  });
} catch (error) {
  console.error('Tool call failed:', error);
  // Handle specific error types
  if (error.message.includes('not found')) {
    console.log('File does not exist');
  }
}
```

## Event Handling

### Listen for Connection Events

```typescript
mcpClient.on('connected', (serverId: string) => {
  console.log(`Connected to ${serverId}`);
  new Notice(`Connected to ${serverId}`, 3000);
});

mcpClient.on('disconnected', (serverId: string) => {
  console.log(`Disconnected from ${serverId}`);
  new Notice(`Disconnected from ${serverId}`, 3000);
});

mcpClient.on('error', (serverId: string, error: Error) => {
  console.error(`Error with ${serverId}:`, error);
  new Notice(`Error with ${serverId}: ${error.message}`, 5000);
});
```

## Settings Management

### Load and Save Settings

```typescript
// Load settings with defaults
async loadSettings(): Promise<MCPBridgeSettings> {
  const savedSettings = await this.loadData();
  return { ...DEFAULT_SETTINGS, ...savedSettings };
}

// Save settings
async saveSettings(settings: MCPBridgeSettings): Promise<void> {
  await this.saveData(settings);
  
  // Update components with new settings
  this.mcpClient.updateSettings(settings);
  this.knowledgeEngine.updateSettings(settings);
  this.bridgeInterface.updateSettings(settings);
}
```

### Update Settings at Runtime

```typescript
// Update a specific setting
settings.knowledgeEngine.relevanceThreshold = 0.5;
await this.saveSettings(settings);

// Add a new server
const newServer: StdioServerConfig = {
  name: 'Git Server',
  type: 'stdio',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-git', '/path/to/repo'],
  enabled: true
};

settings.servers['git'] = newServer;
await this.saveSettings(settings);
```

## Common Patterns

### Batch Operations

```typescript
// Process multiple queries in parallel
const queries = [
  'find notes about AI',
  'search for papers on ML',
  'show related content'
];

const results = await Promise.all(
  queries.map(query => bridgeInterface.processQuery(query))
);
```

### Connection Health Monitoring

```typescript
// Periodically check connection health
setInterval(() => {
  const statuses = mcpClient.getAllConnectionStatuses();
  const disconnectedServers = Object.entries(statuses)
    .filter(([_, status]) => status === 'disconnected')
    .map(([serverId, _]) => serverId);
  
  if (disconnectedServers.length > 0) {
    console.log('Disconnected servers:', disconnectedServers);
    // Attempt to reconnect
    disconnectedServers.forEach(serverId => {
      mcpClient.reconnect(serverId);
    });
  }
}, 30000); // Check every 30 seconds
```

### Debounced Search

```typescript
// Debounce search queries to avoid excessive API calls
let searchTimeout: NodeJS.Timeout;

function debouncedSearch(query: string) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(async () => {
    const results = await knowledgeEngine.discoverRelatedContent(query);
    // Handle results
  }, 300); // 300ms debounce
}
```

## Best Practices

1. **Always Handle Errors**: Wrap MCP operations in try-catch blocks
2. **Check Connection Status**: Verify servers are connected before calling tools
3. **Use Context**: Provide context when available for better results
4. **Validate Inputs**: Sanitize and validate user inputs
5. **Monitor Performance**: Track query times and optimize as needed
6. **Cache Results**: Cache frequently accessed results for better performance
7. **Provide Fallbacks**: Always have fallback behavior for failed operations