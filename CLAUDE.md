# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build and Development
- `npm run dev` - Start development mode with esbuild watching
- `npm run build` - Build for production (runs type check first)
- `npm run clean` - Remove build artifacts (dist/, main.js, main.js.map, styles.css)

### Testing and Quality
- `npm test` - Run tests with Vitest
- `npm run test:coverage` - Run tests with coverage reporting
- `npm run type-check` - Type check without emitting files
- `npm run lint` - Lint TypeScript files in src/
- `npm run lint:fix` - Auto-fix linting issues
- `npm run format` - Format code with Prettier

## Architecture Overview

This is an Obsidian plugin that bridges the Model Context Protocol (MCP) with Obsidian for AI-powered knowledge management.

### Core Components

**Main Plugin Class** (`src/main.ts`):
- Entry point extending Obsidian's Plugin class
- Manages component lifecycle and initialization
- Registers commands, views, and settings
- Key hotkey: `Ctrl/Cmd + Shift + K` for knowledge discovery

**MCP Client** (`src/core/mcp-client.ts`):
- Handles connections to multiple MCP servers
- Supports stdio, WebSocket, and SSE connection types
- Manages server lifecycle and cross-server searches
- Implementation based on MCP-SuperAssistant reference architecture

**Knowledge Engine** (`src/knowledge/knowledge-engine.ts`):
- Analyzes content and discovers related information
- Coordinates with MCP servers for knowledge synthesis

**Bridge Interface** (`src/bridge/bridge-interface.ts`):
- Translates between Obsidian and MCP protocols
- Handles bidirectional communication

**UI Components** (`src/ui/`):
- `chat-view.ts` - Chat interface for natural language queries
- `settings-tab.ts` - Plugin configuration interface

### TypeScript Configuration

- Uses path aliases with `@/` prefix for clean imports
- Targets ES6 with ESNext modules
- Strict TypeScript configuration enabled
- Source maps inlined for development

### Plugin Integration

- Registers as `message-circle` ribbon icon
- Adds chat view to workspace (typically right sidebar)
- Provides command palette integration
- Manages MCP server connections via settings

### Development Notes

- Plugin follows Obsidian's standard plugin architecture
- Uses esbuild for bundling (config in `esbuild.config.mjs`)
- MCP protocol implementation based on MCP-SuperAssistant reference
- Settings stored in Obsidian's plugin data system
- Error handling includes user notices for connection failures

### Reference Implementation

This project uses https://github.com/srbhptl39/MCP-SuperAssistant as a reference implementation for MCP client architecture. The SuperAssistant project provides excellent patterns for:
- Multi-transport MCP connections (stdio, WebSocket, SSE)
- Plugin-based architecture for different connection types
- Event-driven MCP client implementation
- Health monitoring and connection management