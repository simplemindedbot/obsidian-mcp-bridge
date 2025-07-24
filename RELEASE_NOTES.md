# Release Notes

## v0.1.1-beta (2025-01-24) 🚀

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