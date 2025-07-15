# Obsidian MCP Bridge

🔗 A powerful bridge connecting Model Context Protocol (MCP) servers with Obsidian for enhanced knowledge discovery, AI-powered workflows, and intelligent content synthesis.

## ✨ Features

- **🚀 Natural Language Interface**: Chat with your vault using natural language commands
- **🔍 Cross-Server Knowledge Discovery**: Search across multiple MCP servers simultaneously 
- **🧠 AI-Enhanced Knowledge Synthesis**: Intelligent content suggestions and connections
- **📝 Seamless Note Integration**: Insert AI-generated content directly into your notes
- **🔗 Dynamic Link Discovery**: Automatically discover connections between ideas
- **⚡ Real-time Processing**: Fast, responsive AI interactions within Obsidian

## 🛠️ Installation

### From Obsidian Community Plugins (Coming Soon)

1. Open Obsidian Settings
2. Go to Community Plugins
3. Search for "MCP Bridge"
4. Install and enable

### Manual Installation

1. Download the latest release from GitHub
2. Extract to your vault's `.obsidian/plugins/obsidian-mcp-bridge/` directory
3. Enable in Obsidian Settings → Community Plugins

## 🚀 Quick Start

### 1. Configure MCP Servers

```json
{
  "servers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/documents"],
      "enabled": true
    },
    "git": {
      "command": "npx", 
      "args": ["-y", "@modelcontextprotocol/server-git", "/path/to/repository"],
      "enabled": true
    },
    "web-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "enabled": true,
      "env": {
        "BRAVE_API_KEY": "your-api-key"
      }
    }
  }
}
```

### 2. Start Using

- **Command Palette**: `Ctrl/Cmd + P` → "MCP Bridge: Open Chat"
- **Natural Language**: Type "find my notes about machine learning"
- **Discovery Hotkey**: `Ctrl/Cmd + Shift + K` while writing
- **Auto-suggestions**: Get contextual content while editing

## 📖 User Guide

### Natural Language Commands

```
"find my notes about distributed systems"
"search for recent papers on AI safety" 
"show me code examples for rate limiting"
"what have I written about this topic?"
"get the latest news on cryptocurrency"
```

### Discovery Workflows

1. **While Writing**: Hit `Ctrl/Cmd + Shift + K` to discover related content
2. **Research Mode**: Use the chat interface for complex queries
3. **Auto-linking**: Let the plugin suggest connections as you write
4. **Content Enhancement**: Insert AI-generated summaries and analysis

## 🔧 Configuration

### Server Management

Configure MCP servers in the plugin settings:

- **Local Servers**: File system, Git repositories, databases
- **Remote Services**: Web search, APIs, cloud services  
- **Custom Servers**: Your own MCP implementations

### Workflow Customization

- **Hotkeys**: Customize keyboard shortcuts
- **Templates**: Set up content templates
- **Auto-actions**: Configure automatic processing rules

## 🏗️ Architecture

```
Obsidian Vault ←→ MCP Bridge ←→ MCP Servers ←→ AI Services
     ↑                ↑              ↑           ↑
Knowledge Base    Protocol      External      Language
 Management       Translation    Resources      Models
```

### Core Components

- **MCP Client**: Protocol-compliant communication layer
- **Knowledge Engine**: Content analysis and synthesis
- **Bridge Interface**: Obsidian ↔ MCP translation
- **UI Components**: Chat, discovery, and settings interfaces

## 🛣️ Roadmap

### Phase 1: Foundation (Current)
- [x] Basic MCP protocol implementation
- [x] Simple server connections
- [ ] Natural language interface
- [ ] Core plugin architecture

### Phase 2: Knowledge Discovery
- [ ] Cross-server search
- [ ] Content recommendations  
- [ ] Link discovery
- [ ] Smart insertions

### Phase 3: Advanced Features
- [ ] Knowledge graph integration
- [ ] Spaced repetition
- [ ] Workflow automation
- [ ] Advanced AI interactions

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](docs/CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/simplemindedbot/obsidian-mcp-bridge.git
cd obsidian-mcp-bridge

# Install dependencies
npm install

# Start development
npm run dev

# Run tests
npm test
```

### Project Structure

```
src/
├── core/           # MCP protocol implementation
├── bridge/         # Obsidian ↔ MCP translation layer  
├── ui/            # User interface components
├── knowledge/     # Knowledge discovery engine
├── types/         # TypeScript definitions
└── utils/         # Utility functions
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙋 Support

- **Issues**: Report bugs on [GitHub Issues](https://github.com/simplemindedbot/obsidian-mcp-bridge/issues)
- **Discussions**: Join the conversation in [GitHub Discussions](https://github.com/simplemindedbot/obsidian-mcp-bridge/discussions)
- **Documentation**: Full docs at [docs/](docs/)

## 🔗 Related Projects

- [Model Context Protocol](https://modelcontextprotocol.io/) - The underlying protocol
- [MCP Servers](https://github.com/modelcontextprotocol/servers) - Official MCP server implementations
- [MCP-SuperAssistant](https://github.com/srbhptl39/MCP-SuperAssistant) - Reference implementation for MCP client architecture
- [Obsidian](https://obsidian.md/) - The knowledge management platform

## 🙏 Acknowledgments

This project is built with inspiration and reference from:

- **[MCP-SuperAssistant](https://github.com/srbhptl39/MCP-SuperAssistant)** by [@srbhptl39](https://github.com/srbhptl39) - An excellent Chrome extension that demonstrates production-ready MCP client implementation patterns. We've used their architectural patterns for multi-transport connections, plugin-based design, and event-driven MCP client management.

- **[Model Context Protocol](https://modelcontextprotocol.io/)** by Anthropic - The foundational protocol that enables AI assistants to connect to data sources

- **[Obsidian](https://obsidian.md/)** - The powerful knowledge management platform this plugin extends

---

**Made with ❤️ for the Obsidian and MCP communities**
