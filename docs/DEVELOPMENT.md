# Development Guide

This guide will help you get started with developing the Obsidian MCP Bridge plugin.

## Project Structure

```
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
│   ├── utils/           # Utility functions (to be added)
│   └── main.ts          # Plugin entry point
├── docs/               # Documentation
├── examples/          # Example configurations
├── tests/            # Test suite (to be added)
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

*Note: Test suite is not yet implemented. See [Contributing](#contributing) section.*

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

```
User Input → BridgeInterface → MCPClient/KnowledgeEngine → MCP Servers → Response → UI Update
```

## Implementation Status

### ✅ Completed (Foundation)
- Basic plugin structure
- Settings management
- TypeScript configuration
- Build system setup
- Core component architecture

### 🚧 In Progress (Phase 1)
- MCP protocol implementation
- Basic server connections
- Natural language interface
- Simple knowledge discovery

### ⏳ Planned (Phase 2+)
- Cross-server search
- Advanced knowledge synthesis
- Content recommendations
- Link discovery
- Spaced repetition integration

## Key Development Areas

### 1. MCP Protocol Implementation

The current MCP client is a stub. Priority areas:

- **STDIO connection handling** using Node.js `child_process`
- **JSON-RPC message formatting** according to MCP specification
- **WebSocket support** for remote servers
- **Error handling and reconnection logic**

Example MCP message structure:
```typescript
interface MCPRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: any;
}
```

### 2. Natural Language Processing

Current intent classification is basic keyword matching. Enhancements needed:

- **Better intent classification** using patterns or small ML models
- **Parameter extraction** from natural language
- **Context awareness** based on current note and vault

### 3. Knowledge Discovery

Areas for improvement:

- **Semantic search** using embeddings or TF-IDF
- **Relevance scoring** algorithms
- **Cross-reference discovery** between different content types
- **Temporal relevance** (recent vs. historical content)

### 4. User Interface

Current UI is functional but basic:

- **Enhanced chat interface** with better formatting
- **Discovery results display** with previews and actions
- **Content insertion modal** with editing capabilities
- **Server status indicators** and connection management

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

1. **MCP Protocol Implementation** - Help implement full MCP support
2. **Natural Language Processing** - Improve intent classification
3. **Knowledge Discovery Algorithms** - Better content discovery
4. **User Interface** - Enhanced chat and discovery interfaces
5. **Testing** - Comprehensive test suite
6. **Documentation** - Examples and tutorials

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
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## Getting Help

- **Issues**: Report bugs and request features on [GitHub Issues](https://github.com/simplemindedbot/obsidian-mcp-bridge/issues)
- **Discussions**: Join conversations on [GitHub Discussions](https://github.com/simplemindedbot/obsidian-mcp-bridge/discussions)
- **Discord**: Join the Obsidian community Discord for general plugin development help

---

Happy coding! 🚀
