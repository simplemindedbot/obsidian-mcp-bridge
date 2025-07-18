# Development Guide

This guide will help you get started with developing the Obsidian MCP Bridge plugin.

## Project Structure

``` txt
obsidian-mcp-bridge/
├── src/
│   ├── core/              # MCP protocol implementation
│   │   └── mcp-client.ts   # Main MCP client implementation
│   ├── bridge/            # Obsidian ↔ MCP translation layer
│   │   └── bridge-interface.ts # Query processing and routing
│   ├── ui/               # User interface components
│   │   ├── chat-view.ts   # Chat interface implementation
│   │   └── settings-tab.ts # Plugin settings UI
│   ├── knowledge/        # Knowledge discovery engine
│   │   └── knowledge-engine.ts # Content discovery and analysis
│   ├── types/           # TypeScript definitions
│   │   └── settings.ts   # Plugin settings and interfaces
│   ├── utils/           # Utility functions
│   └── main.ts          # Plugin entry point
├── docs/               # Documentation
│   ├── components/     # Component documentation
│   ├── DEVELOPMENT.md  # This development guide
│   └── *.md           # Other documentation
├── examples/          # Example configurations
├── tests/            # Test suite (34 tests, 100% pass rate)
│   ├── unit/          # Unit tests
│   ├── __mocks__/     # Mock implementations
│   └── vitest.config.ts # Test configuration
└── package.json      # Dependencies and scripts
```

## Development Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Obsidian installed
- Basic understanding of TypeScript and Obsidian plugin development

### Initial Setup

1. **Clone and Install Dependencies**

   ```bash
   cd /Users/scotcampbell/GitHub/obsidian-mcp-bridge
   npm install
   ```

2. **Development Build**

   ```bash
   npm run dev
   ```

   This will start the build process in watch mode, rebuilding when files change.

3. **Link to Obsidian Vault**

   Create a symbolic link to your Obsidian vault's plugins directory:

   ```bash
   # Replace with your vault path
   ln -s /Users/scotcampbell/GitHub/obsidian-mcp-bridge /path/to/your/vault/.obsidian/plugins/obsidian-mcp-bridge
   ```

   Or copy the files manually:

   ```bash
   cp main.js manifest.json styles.css /path/to/your/vault/.obsidian/plugins/obsidian-mcp-bridge/
   ```

4. **Enable Plugin in Obsidian**
   - Open Obsidian Settings
   - Go to Community Plugins
   - Enable "MCP Bridge"

## Development Workflow

### Building

- **Development build** (with watch): `npm run dev`
- **Production build**: `npm run build`
- **Type checking**: `npm run type-check`
- **Clean build files**: `npm run clean`

### Code Quality

- **Linting**: `npm run lint`
- **Auto-fix linting issues**: `npm run lint:fix`
- **Format code**: `npm run format`

### Testing

- **Run tests**: `npm test`
- **Run tests with coverage**: `npm test:coverage`
- **Run specific test file**: `npm test -- tests/unit/mcp-client.test.ts`
- **Run tests in watch mode**: `npm test -- --watch`

**Current Test Status**: ✅ 34/34 tests passing (100% pass rate)

- **MCP Client Tests**: 12 tests covering initialization, connection management, tool operations
- **Bridge Interface Tests**: 14 tests covering query processing, intent classification, error handling  
- **Knowledge Engine Tests**: 8 tests covering content discovery, vault search, relevance scoring

## Architecture Overview

### Core Components

1. **MCPClient** (`src/core/mcp-client.ts`)
   - Handles MCP protocol communication
   - Manages connections to multiple servers
   - Provides unified interface for tool calls and resource access

2. **KnowledgeEngine** (`src/knowledge/knowledge-engine.ts`)
   - Performs content discovery and analysis
   - Searches vault content and MCP servers
   - Calculates relevance scores

3. **BridgeInterface** (`src/bridge/bridge-interface.ts`)
   - Routes queries to appropriate handlers
   - Processes natural language commands
   - Manages content insertion into Obsidian

4. **ChatView** (`src/ui/chat-view.ts`)
   - Provides chat interface for user interaction
   - Handles message display and input
   - Integrates with BridgeInterface for query processing

### Data Flow

``` txt
User Input → BridgeInterface → MCPClient/KnowledgeEngine → MCP Servers → Response → UI Update
```

## Implementation Status

### ✅ Completed (Phase 1 - Foundation)

#### **Core Architecture**

- ✅ Production-ready plugin structure with TypeScript strict mode
- ✅ Comprehensive settings management with type-safe interfaces
- ✅ Optimized build system with hot-reload development
- ✅ Modular component architecture with clean separation of concerns
- ✅ Complete test coverage (34 tests) with 100% pass rate

#### **MCP Protocol Implementation**

- ✅ Full MCP protocol support with official SDK integration
- ✅ **STDIO transport** - Complete implementation with process management
- ✅ **WebSocket transport** - Production-ready with official MCP WebSocket client
- ✅ **SSE transport** - Full Server-Sent Events support with EventSource
- ✅ Multi-server connection management with health monitoring
- ✅ Tool calling and resource management with parameter validation

#### **Error Handling & Reliability**

- ✅ Comprehensive error handling with graceful degradation
- ✅ Exponential backoff retry logic with configurable attempts
- ✅ Connection health monitoring and automatic reconnection
- ✅ Timeout handling and connection cleanup
- ✅ Server health dashboard and manual reconnection capabilities

#### **Knowledge Discovery Engine**

- ✅ Cross-server search across multiple MCP servers
- ✅ Vault integration with AI-powered relevance scoring
- ✅ Natural language interface with intent classification
- ✅ Content synthesis and intelligent recommendations
- ✅ Direct content insertion into Obsidian notes

### 🔄 In Progress (Phase 2 - Advanced Features)

- **Advanced Link Discovery** - Automatic connection finding between ideas
- **Smart Content Insertion** - Context-aware content suggestions while writing
- **Integration Tests** - End-to-end testing of MCP server connections

### ⏳ Planned (Phase 3 - Premium Features)

- **Knowledge Graph Integration** - Visual representation of content relationships
- **Advanced AI Features** - Multi-step reasoning and complex query handling
- **Workflow Automation** - Automated content processing and organization
- **Plugin SDK** - Extensible architecture for custom integrations

## Component Documentation

For detailed component documentation, see the [Component Documentation](components/README.md) directory:

- **[Core Components](components/README.md)** - Overview of all components
- **[MCPClient](components/mcp-client.md)** - MCP protocol client
- **[KnowledgeEngine](components/knowledge-engine.md)** - Knowledge discovery engine
- **[BridgeInterface](components/bridge-interface.md)** - Obsidian ↔ MCP translation layer
- **[ChatView](components/chat-view.md)** - Chat interface component
- **[SettingsTab](components/settings-tab.md)** - Settings configuration
- **[Type Definitions](components/types/settings.md)** - TypeScript interfaces
- **[Usage Examples](components/examples/basic-usage.md)** - Common usage patterns
- **[Advanced Integration](components/examples/advanced-integration.md)** - Extension patterns

## Key Development Areas

### 1. MCP Protocol Implementation ✅

The MCP client implementation is **complete** and production-ready, based on patterns from [MCP-SuperAssistant](https://github.com/srbhptl39/MCP-SuperAssistant):

#### **Completed Features**

- ✅ **STDIO connection handling** using official MCP SDK `StdioClientTransport`
- ✅ **WebSocket support** with official MCP SDK `WebSocketClientTransport`  
- ✅ **SSE support** with official MCP SDK `SSEClientTransport`
- ✅ **Multi-transport architecture** supporting all three connection types
- ✅ **Event-driven client management** with proper lifecycle handling
- ✅ **Health monitoring and reconnection logic** with exponential backoff
- ✅ **Connection timeouts** and cleanup mechanisms
- ✅ **Server health dashboard** for monitoring all connections

#### **Current Implementation**

The MCP client uses the official `@modelcontextprotocol/sdk` for all transports:

```typescript
// Example transport initialization
switch (config.type) {
  case 'stdio':
    this.transport = new StdioClientTransport({
      command: config.command,
      args: config.args,
      env: config.env
    });
    break;
  case 'websocket':
    this.transport = new WebSocketClientTransport(new URL(config.url));
    break;
  case 'sse':
    this.transport = new SSEClientTransport(new URL(config.url));
    break;
}
```

### 2. Natural Language Processing ✅

Current implementation includes:

- ✅ **Intent classification** with keyword matching and pattern recognition
- ✅ **Parameter extraction** from natural language queries
- ✅ **Context awareness** based on current note and vault state

**Future enhancements:**

- **Advanced intent classification** using ML models
- **Semantic parameter extraction** for complex queries
- **Multi-turn conversation** context handling

### 3. Knowledge Discovery ✅

Current implementation includes:

- ✅ **Cross-server search** across multiple MCP servers
- ✅ **Vault integration** with AI-powered relevance scoring
- ✅ **Content synthesis** and intelligent recommendations
- ✅ **Real-time discovery** while writing

**Future enhancements:**

- **Semantic search** using embeddings or TF-IDF
- **Advanced relevance scoring** algorithms
- **Cross-reference discovery** between different content types
- **Temporal relevance** (recent vs. historical content)

### 4. User Interface ✅

Current implementation includes:

- ✅ **Chat interface** with markdown support and message history
- ✅ **Discovery results** with previews and actions
- ✅ **Content insertion** with multiple location options
- ✅ **Server status indicators** and connection management

**Future enhancements:**

- **Enhanced chat interface** with rich formatting and interactive elements
- **Visual discovery results** with knowledge graph visualization
- **Advanced content insertion** with context-aware suggestions
- **Real-time collaboration** features

## Configuration

### MCP Server Examples

The plugin supports various MCP server types. Example configurations:

```json
{
  "servers": {
    "filesystem": {
      "name": "Local Files",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "./Documents"],
      "enabled": true,
      "type": "stdio"
    },
    "git": {
      "name": "Git Repository", 
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-git", "./my-project"],
      "enabled": true,
      "type": "stdio"
    },
    "web-search": {
      "name": "Web Search",
      "command": "npx", 
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "enabled": false,
      "type": "stdio",
      "env": {
        "BRAVE_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### Development Settings

For development, you may want to enable debug mode:

```json
{
  "enableDebugMode": true,
  "logLevel": "debug"
}
```

## Common Development Tasks

### Adding a New MCP Server Type

1. Update the `MCPServerConfig` interface in `src/types/settings.ts`
2. Add connection logic in `MCPConnection.connect()`
3. Update the settings UI in `src/ui/settings-tab.ts`
4. Add configuration examples to documentation

### Adding a New Command

1. Add command definition in `main.ts` `onload()` method
2. Implement handler function
3. Update command palette and/or UI elements
4. Add keyboard shortcuts if appropriate

### Implementing a New Discovery Algorithm

1. Add method to `KnowledgeEngine` class
2. Update the `discoverRelatedContent()` method to use new algorithm
3. Add configuration options to settings
4. Update UI to display new types of discoveries

## Debugging

### Console Logging

Enable debug mode in plugin settings to see detailed logs:

```typescript
if (this.settings.enableDebugMode) {
  console.log('MCP Bridge Debug:', data);
}
```

### Obsidian Developer Tools

- Open Obsidian with `--enable-developer-tools` flag
- Use browser developer tools for debugging
- Check console for error messages and logs

### Testing MCP Servers

Test MCP server connections outside of Obsidian:

```bash
# Test a local MCP server
npx @modelcontextprotocol/server-filesystem ./
```

## Contributing

We welcome contributions! Priority areas:

1. **Advanced Features** - Knowledge graph integration and advanced AI features
2. **Natural Language Processing** - Improve intent classification and semantic search
3. **Knowledge Discovery Algorithms** - Enhanced content discovery and relevance scoring
4. **User Interface** - Enhanced chat and discovery interfaces
5. **Integration Tests** - End-to-end testing of MCP server connections
6. **Plugin Extensions** - Custom integrations and plugin SDK

### Contribution Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make changes and test thoroughly
4. Commit changes: `git commit -m 'Add amazing feature'`
5. Push to branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Code Style

- Use TypeScript with strict mode
- Follow existing code style and patterns
- Add JSDoc comments for public methods
- Use meaningful variable and function names
- Keep functions focused and single-purpose

## Resources

- [Obsidian Plugin API](https://github.com/obsidianmd/obsidian-api)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP Server Examples](https://github.com/modelcontextprotocol/servers)
- [MCP-SuperAssistant](https://github.com/srbhptl39/MCP-SuperAssistant) - Reference implementation for MCP client patterns
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## Reference Implementation

This project uses **[MCP-SuperAssistant](https://github.com/srbhptl39/MCP-SuperAssistant)** as a reference implementation for MCP client architecture. The SuperAssistant project provides excellent patterns for:

- **Plugin-based transport system** with support for stdio, WebSocket, and SSE connections
- **Event-driven MCP client** with proper lifecycle management
- **Health monitoring** and automatic reconnection handling
- **Tool calling and resource management** with caching and error handling
- **Modular architecture** that can be adapted for different environments

Key files to reference from MCP-SuperAssistant:

- `chrome-extension/src/mcpclient/core/McpClient.ts` - Main client implementation
- `chrome-extension/src/mcpclient/plugins/` - Transport plugin implementations
- `chrome-extension/src/mcpclient/types/` - Type definitions and interfaces

The architectural patterns from SuperAssistant have been adapted for Obsidian's plugin system while maintaining the core MCP client functionality.

## Getting Help

- **Issues**: Report bugs and request features on [GitHub Issues](https://github.com/simplemindedbot/obsidian-mcp-bridge/issues)
- **Discussions**: Join conversations on [GitHub Discussions](https://github.com/simplemindedbot/obsidian-mcp-bridge/discussions)
- **Discord**: Join the Obsidian community Discord for general plugin development help

---

Happy coding! 🚀
