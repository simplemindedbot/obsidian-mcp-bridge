# MCPClient Component Documentation

The `MCPClient` class is the core component for managing MCP (Model Context Protocol) connections. It provides a unified interface for connecting to multiple MCP servers across different transport types.

## Class: MCPClient

**Location**: `src/core/mcp-client.ts`

### Constructor

```typescript
constructor(settings: MCPBridgeSettings)
```

Creates a new MCPClient instance with the provided settings.

**Parameters:**
- `settings`: `MCPBridgeSettings` - Plugin settings containing server configurations

### Properties

#### `connections: Map<string, MCPConnection>`
A map of active MCP connections indexed by server ID.

#### `settings: MCPBridgeSettings`
Current plugin settings.

### Methods

#### `initialize(): Promise<void>`

Initializes the MCP client and establishes connections to all enabled servers.

**Returns:** `Promise<void>`

**Throws:** `Error` if initialization fails

**Example:**
```typescript
const client = new MCPClient(settings);
await client.initialize();
```

#### `connect(serverId: string): Promise<void>`

Establishes a connection to a specific MCP server.

**Parameters:**
- `serverId`: `string` - The ID of the server to connect to

**Returns:** `Promise<void>`

**Throws:** `Error` if connection fails after all retry attempts

**Example:**
```typescript
await client.connect('filesystem-server');
```

#### `disconnect(serverId: string): Promise<void>`

Disconnects from a specific MCP server.

**Parameters:**
- `serverId`: `string` - The ID of the server to disconnect from

**Returns:** `Promise<void>`

**Example:**
```typescript
await client.disconnect('filesystem-server');
```

#### `disconnectAll(): Promise<void>`

Disconnects from all MCP servers.

**Returns:** `Promise<void>`

**Example:**
```typescript
await client.disconnectAll();
```

#### `callTool(serverId: string, toolName: string, parameters?: any): Promise<any>`

Calls a tool on a specific MCP server.

**Parameters:**
- `serverId`: `string` - The ID of the server hosting the tool
- `toolName`: `string` - The name of the tool to call
- `parameters`: `any` (optional) - Parameters to pass to the tool

**Returns:** `Promise<any>` - The result of the tool call

**Throws:** `Error` if the tool call fails or the server is not connected

**Example:**
```typescript
const result = await client.callTool('filesystem-server', 'read_file', {
  path: '/path/to/file.txt'
});
```

#### `listTools(serverId: string): Promise<any[]>`

Lists all available tools on a specific MCP server.

**Parameters:**
- `serverId`: `string` - The ID of the server to query

**Returns:** `Promise<any[]>` - Array of available tools

**Throws:** `Error` if the server is not connected

**Example:**
```typescript
const tools = await client.listTools('filesystem-server');
console.log('Available tools:', tools.map(t => t.name));
```

#### `getResource(serverId: string, resourceUri: string): Promise<any>`

Retrieves a resource from a specific MCP server.

**Parameters:**
- `serverId`: `string` - The ID of the server hosting the resource
- `resourceUri`: `string` - The URI of the resource to retrieve

**Returns:** `Promise<any>` - The resource data

**Throws:** `Error` if the resource retrieval fails or the server is not connected

**Example:**
```typescript
const resource = await client.getResource('filesystem-server', 'file:///path/to/file.txt');
```

#### `listResources(serverId: string): Promise<any[]>`

Lists all available resources on a specific MCP server.

**Parameters:**
- `serverId`: `string` - The ID of the server to query

**Returns:** `Promise<any[]>` - Array of available resources

**Throws:** `Error` if the server is not connected

**Example:**
```typescript
const resources = await client.listResources('filesystem-server');
console.log('Available resources:', resources.map(r => r.uri));
```

#### `getConnectionStatus(serverId: string): ConnectionStatus`

Gets the current connection status for a specific server.

**Parameters:**
- `serverId`: `string` - The ID of the server to check

**Returns:** `ConnectionStatus` - Current connection status

**Possible values:**
- `'connected'` - Server is connected and healthy
- `'connecting'` - Connection attempt in progress
- `'disconnected'` - Server is not connected
- `'error'` - Connection failed

**Example:**
```typescript
const status = client.getConnectionStatus('filesystem-server');
if (status === 'connected') {
  console.log('Server is ready');
}
```

#### `getAllConnectionStatuses(): Record<string, ConnectionStatus>`

Gets the connection status for all configured servers.

**Returns:** `Record<string, ConnectionStatus>` - Object mapping server IDs to their status

**Example:**
```typescript
const statuses = client.getAllConnectionStatuses();
Object.entries(statuses).forEach(([serverId, status]) => {
  console.log(`${serverId}: ${status}`);
});
```

#### `searchAllServers(query: string): Promise<any[]>`

Searches across all connected MCP servers for content matching the query.

**Parameters:**
- `query`: `string` - The search query

**Returns:** `Promise<any[]>` - Array of search results from all servers

**Example:**
```typescript
const results = await client.searchAllServers('machine learning');
console.log(`Found ${results.length} results across all servers`);
```

#### `reconnect(serverId: string): Promise<void>`

Manually reconnects to a specific MCP server.

**Parameters:**
- `serverId`: `string` - The ID of the server to reconnect

**Returns:** `Promise<void>`

**Example:**
```typescript
await client.reconnect('filesystem-server');
```

#### `updateSettings(settings: MCPBridgeSettings): Promise<void>`

Updates the client settings and reinitializes connections as needed.

**Parameters:**
- `settings`: `MCPBridgeSettings` - New plugin settings

**Returns:** `Promise<void>`

**Example:**
```typescript
await client.updateSettings(newSettings);
```

## Transport Types

The MCPClient supports three transport types:

### STDIO Transport
For local processes that communicate via stdin/stdout.

**Configuration:**
```typescript
{
  type: 'stdio',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem', '/path'],
  env: { /* environment variables */ }
}
```

### WebSocket Transport
For remote services accessible via WebSocket.

**Configuration:**
```typescript
{
  type: 'websocket',
  url: 'ws://localhost:8080/mcp'
}
```

### SSE Transport
For HTTP-based Server-Sent Events.

**Configuration:**
```typescript
{
  type: 'sse',
  url: 'https://api.example.com/mcp'
}
```

## Error Handling

The MCPClient implements comprehensive error handling:

- **Retry Logic**: Exponential backoff with configurable retry attempts
- **Connection Monitoring**: Health checks with automatic reconnection
- **Graceful Degradation**: Continues operating with partial connectivity
- **Timeout Management**: Configurable timeouts for all operations

## Events

The MCPClient emits events for connection state changes:

```typescript
// Listen for connection events
client.on('connected', (serverId: string) => {
  console.log(`Connected to ${serverId}`);
});

client.on('disconnected', (serverId: string) => {
  console.log(`Disconnected from ${serverId}`);
});

client.on('error', (serverId: string, error: Error) => {
  console.error(`Error with ${serverId}:`, error);
});
```

## Best Practices

1. **Always check connection status** before calling server methods
2. **Handle errors gracefully** with appropriate fallbacks
3. **Use connection pooling** for multiple operations
4. **Monitor connection health** for production deployments
5. **Configure appropriate timeouts** based on your use case

## Example Usage

```typescript
import { MCPClient } from './core/mcp-client';

// Initialize client
const client = new MCPClient(settings);
await client.initialize();

// Check server status
const status = client.getConnectionStatus('filesystem-server');
if (status === 'connected') {
  // Call a tool
  const result = await client.callTool('filesystem-server', 'read_file', {
    path: '/path/to/file.txt'
  });
  
  // Search across all servers
  const searchResults = await client.searchAllServers('important documents');
}

// Clean up
await client.disconnectAll();
```