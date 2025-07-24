# Component Documentation

> **📅 Updated for v0.1.1-beta** - Documentation reflects the current public beta release with multi-server dynamic loading and LLM-based routing.

This directory contains comprehensive documentation for the Obsidian MCP Bridge plugin core components.

## Core Components

### [MCPClient](./mcp-client.md)
The main MCP protocol client that handles connections to MCP servers across all transport types (stdio, WebSocket, SSE).

### [KnowledgeEngine](./knowledge-engine.md)
The knowledge discovery engine that analyzes content, searches the vault, and coordinates with MCP servers for intelligent recommendations.

### [BridgeInterface](./bridge-interface.md)
The translation layer between Obsidian and MCP protocols, handling query processing and content insertion.

### [ChatView](./chat-view.md)
The main UI component providing the chat interface for interacting with the knowledge discovery system.

### [SettingsTab](./settings-tab.md)
The settings interface for configuring MCP servers and plugin options.

## Type Definitions

### [Settings Types](./types/settings.md)
Complete type definitions for plugin settings and MCP server configurations.

## Usage Examples

### [Basic Usage](./examples/basic-usage.md)
Common usage patterns and examples for working with the plugin components.

### [Advanced Integration](./examples/advanced-integration.md)
Advanced usage patterns for extending the plugin or creating custom integrations.

## Architecture Overview

The plugin follows a modular architecture with clear separation of concerns:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   ChatView      │    │ BridgeInterface │    │   MCPClient     │
│   (UI Layer)    │◄──►│ (Translation)   │◄──►│ (Protocol)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌─────────────────┐              │
         └─────────────►│ KnowledgeEngine │◄─────────────┘
                        │   (Discovery)   │
                        └─────────────────┘
```

## Getting Started

1. **Read the [MCPClient](./mcp-client.md) documentation** to understand MCP protocol integration
2. **Check [KnowledgeEngine](./knowledge-engine.md)** for content discovery patterns
3. **Review [BridgeInterface](./bridge-interface.md)** for query processing
4. **Explore [Examples](./examples/)** for practical usage patterns

## Contributing

When adding new component methods or modifying existing ones, please:

1. Update the relevant component documentation file
2. Add JSDoc comments to the source code
3. Include usage examples where appropriate
4. Update the changelog in the component's documentation