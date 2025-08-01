# Release Notes

## v0.2.0 (2025-07-27) 🕸️

### 🎉 Note Connection Analysis System

This major release introduces sophisticated note connection analysis, transforming how you discover relationships between your knowledge.

### ✨ Major Features

#### 🕸️ **Comprehensive Note Connection Analysis**

- **Multi-type Connection Discovery**: Analyzes direct links, tag similarity, content overlap, and concept relationships
- **Network Visualization**: Identifies hubs, bridges, clusters, and isolated notes in your knowledge network  
- **Connection Strength Scoring**: Weighted relevance assessment for relationship quality
- **Actionable Insights**: Suggests missing links, MOC creation opportunities, and topic clustering

#### 🔍 **Enhanced Vault Search**

- **Plugin Integration**: Full support for Omnisearch and REST API plugins with intelligent fallback
- **Native Search**: Built-in search with relevance scoring when plugins aren't available
- **Rich Results**: Enhanced formatting with excerpts, tags, modification dates, and relevance scores
- **Performance Optimized**: Fast search across large vaults with smart caching

#### 🧠 **Context-Aware LLM Routing**

- **Intent Classification**: Distinguishes between vault search, note connections, and external queries
- **Enhanced Prompts**: Improved routing logic that understands note relationship queries
- **Fallback Analysis**: Robust heuristic routing when LLM services are unavailable
- **Multi-transport Support**: Seamless integration across all MCP connection types

### 🎯 **Usage Examples**

#### Note Connection Analysis
```
"connect notes on artificial intelligence"
"connect ideas about project management"
"show connections between my React notes"
```

#### Enhanced Vault Search
```
"find my notes about machine learning" 
"search my vault for TypeScript"
"what have I written about distributed systems?"
```

#### Rich Network Analysis
- **Network Overview**: Total notes, connections, key themes
- **Strongest Connections**: Top relationships with detailed explanations
- **Hub Notes**: Most connected notes in your network
- **Note Clusters**: Grouped topics with central themes
- **Connection Suggestions**: Recommendations for missing links, MOCs, etc.

### 🔧 **Technical Implementation**

- **NoteConnectionService**: Core connection analysis engine with sophisticated algorithms
- **VaultSearchService**: Enhanced vault search with plugin integration and fallback
- **Enhanced Bridge Interface**: New routing for vault search and note connections
- **Updated LLM Router**: Context-aware routing with improved prompts
- **Comprehensive Test Suite**: 40+ test cases ensuring reliability

### 📈 **Performance Improvements**

- **Fast Analysis**: Processes hundreds of notes in seconds
- **Memory Efficient**: Optimized algorithms for large vaults  
- **Cross-Platform**: Full Windows/macOS/Linux compatibility
- **Plugin Compatibility**: Works with or without Omnisearch/REST API plugins

### 💡 **Pro Tips**

1. **Install Omnisearch** for enhanced search capabilities with OCR and semantic search
2. **Use specific topics** in connection queries for better results ("AI" vs "artificial intelligence")
3. **Explore clusters** to discover unexpected knowledge patterns
4. **Follow suggestions** to improve your note network connectivity

### 🚀 **Getting Started**

1. **Update**: Download v0.2.0 from GitHub releases
2. **Install Omnisearch** (optional but recommended for enhanced search)
3. **Try Connections**: Use "connect notes on [topic]" to analyze your knowledge network
4. **Explore Results**: Follow suggestions to strengthen your note connections

### 📚 **Documentation Updates**

- [Installation Guide](INSTALL.md) - Updated with v0.2.0 capabilities
- [README](README.md) - Enhanced with note connection examples
- [Security Guidelines](SECURITY.md) - Latest security best practices

---

**Download**: [GitHub Releases](https://github.com/simplemindedbot/obsidian-mcp-bridge/releases/tag/v0.2.0)  
**Support**: [GitHub Issues](https://github.com/simplemindedbot/obsidian-mcp-bridge/issues)  
**Discussions**: [GitHub Discussions](https://github.com/simplemindedbot/obsidian-mcp-bridge/discussions)

## v0.1.1-beta (2025-07-23) 🚀

### 🎉 First Public Beta Release

We're excited to announce the first public beta of Obsidian MCP Bridge! This release brings powerful Model Context Protocol integration to Obsidian with intelligent routing and multi-server support.

### ✨ Major Features

#### 🔗 **Dynamic Multi-Server Support**

- **Auto-Discovery**: Automatically loads all MCP servers from configuration
- **Multi-Transport**: Support for stdio, WebSocket, and SSE connections
- **Server Types**: File system, Git, web search, SQLite, and custom servers
- **Health Monitoring**: Real-time connection status and auto-reconnection

#### 🧠 **Intelligent LLM-Based Routing**

- **Smart Analysis**: Uses OpenAI, Anthropic, or OpenAI-compatible APIs to understand user intent
- **Context-Aware**: Routes queries to the most appropriate server and tool
- **Fallback Logic**: Graceful degradation to static routing when LLM is unavailable
- **Multi-Server Queries**: Handles complex requests across multiple data sources

#### 🔍 **Advanced Query Processing**

- **Natural Language**: "search the web for TypeScript tutorials" → routes to web search
- **File Operations**: "list files in current directory" → routes to filesystem server
- **Git Operations**: "show git status" → routes to git server
- **Database Queries**: "query user database" → routes to SQLite server

#### 🛡️ **Security & Quality**

- **Secret Protection**: API keys are redacted from logs and never committed
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Type Safety**: Full TypeScript implementation with strict mode
- **Comprehensive Documentation**: Installation guides, security best practices, and API docs

### 🔧 **Configuration**

The plugin now supports a flexible JSON configuration system:

```json
{
  "servers": {
    "filesystem": {
      "name": "File System",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem"],
      "enabled": true,
      "type": "stdio"
    },
    "git": {
      "name": "Git Repository", 
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-git"],
      "enabled": true,
      "type": "stdio"
    },
    "brave-search": {
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

### 🎯 **Usage Examples**

Once configured, you can use natural language queries:

- `"find my notes about machine learning"` → Searches vault and connected servers
- `"show me recent commits"` → Calls git log via git server  
- `"search for TypeScript documentation"` → Uses web search server
- `"list files in Documents folder"` → Uses filesystem server

### ⚠️ **Known Limitations (Beta)**

This is a beta release with some known limitations:

- **Test Suite**: Some unit tests have timeout issues in mock scenarios (core functionality works correctly)
- **LLM Routing**: Requires API keys for intelligent routing (falls back to static routing when disabled)
- **Performance**: Initial server discovery may take a few seconds on first load  
- **Error Handling**: Some edge case error messages could be more user-friendly

### 🚀 **Getting Started**

1. **Install**: Download from GitHub releases or clone the repository
2. **Configure**: Set up MCP servers in plugin settings
3. **API Keys**: Add LLM provider API keys for intelligent routing (optional)
4. **Use**: Open chat interface or use `Ctrl/Cmd + Shift + K` for discovery

### 📚 **Documentation**

- [Installation Guide](INSTALL.md)
- [Security Guidelines](SECURITY.md)
- [Configuration Examples](examples/configs/)
- [Component Documentation](docs/components/)

### 🤝 **Contributing**

We welcome contributions! Please see our [development setup](README.md#development-setup) and feel free to:

- Report bugs via GitHub Issues
- Submit feature requests
- Contribute code improvements
- Improve documentation

### 🙏 **Acknowledgments**

This project builds on excellent work from:

- [MCP-SuperAssistant](https://github.com/srbhptl39/MCP-SuperAssistant) for MCP client architecture patterns
- [Model Context Protocol](https://modelcontextprotocol.io/) by Anthropic
- The Obsidian community for inspiration and feedback

---

**Download**: [GitHub Releases](https://github.com/simplemindedbot/obsidian-mcp-bridge/releases/tag/v0.1.1-beta)  
**Support**: [GitHub Issues](https://github.com/simplemindedbot/obsidian-mcp-bridge/issues)  
**Discussions**: [GitHub Discussions](https://github.com/simplemindedbot/obsidian-mcp-bridge/discussions)

## Previous Releases

*This is the first public release of Obsidian MCP Bridge.*
