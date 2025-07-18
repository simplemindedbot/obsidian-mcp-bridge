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

### Security

- `npm run security:scan` - Scan for secrets with gitleaks
- `npm run security:check` - Full security audit (npm audit + secret scan)

## Git Workflow

### Primary Branches

- **`develop`** - Active development branch (work here by default)
- **`main`** - Production/release branch (protected, requires PR)

### Standard Development Workflow

```bash
# Always start from develop
git checkout develop
git pull origin develop

# Make changes and commit
git add .
git commit -m "feat: add new feature"
git push origin develop

# For major features, create a branch
git checkout -b feature/feature-name
# work, commit, push
git push origin feature/feature-name
# Create PR to develop
```

### Security Procedures

**Before every commit:**

1. Run security scan: `npm run security:scan`
2. Check for secrets manually
3. Verify no API keys, tokens, or passwords in code

**Never commit:**

- Real API keys or tokens
- Database passwords or connection strings
- Private keys or certificates
- Production URLs or endpoints
- Personal information or credentials

**If you accidentally commit secrets:**

1. Stop immediately
2. Follow incident response in SECURITY.md
3. Rotate the compromised credentials
4. Clean git history if needed

### Environment Variables

Use `.env.local` for development secrets (never commit this file):

```bash
# Copy template
cp .env.example .env.local

# Edit with real values
BRAVE_API_KEY=your-actual-api-key
DATABASE_URL=your-actual-connection-string
```

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
- **NEW**: Dynamic path resolution via PathResolver to solve ENOENT errors

**Path Resolver** (`src/utils/path-resolver.ts`):

- Dynamically finds executable paths at runtime
- Solves "spawn npx ENOENT" errors without hardcoding paths
- Cross-platform compatibility with multiple discovery methods
- Comprehensive logging and caching for performance

**Knowledge Engine** (`src/knowledge/knowledge-engine.ts`):

- Analyzes content and discovers related information
- Coordinates with MCP servers for knowledge synthesis

**Bridge Interface** (`src/bridge/bridge-interface.ts`):

- Translates between Obsidian and MCP protocols
- Handles bidirectional communication

**Logger System** (`src/utils/logger.ts`):

- Comprehensive logging with file output and rotation
- Multiple log levels (error, warn, info, debug, trace)
- Automatic API key redaction for security
- Structured logs with timestamps and metadata

**UI Components** (`src/ui/`):

- Uses path aliases with `@/` prefix for clean imports

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
- **Security**: All secrets are protected via multiple layers (gitignore, scanning, documentation)
- **Testing**: Comprehensive unit test coverage with Vitest (34 tests)

### Reference Implementation

This project uses <https://github.com/srbhptl39/MCP-SuperAssistant> as a reference implementation for MCP client architecture. The SuperAssistant project provides excellent patterns for:

- Multi-transport MCP connections (stdio, WebSocket, SSE)
- Plugin-based architecture for different connection types
- Event-driven MCP client implementation
- Health monitoring and connection management

## Security Guidelines

### For Claude Code

When working on this codebase:

1. **Never generate real secrets** - Only use placeholder values like "your-api-key-here"
2. **Check existing patterns** - Follow established security practices in the codebase
3. **Run security scans** - Use `npm run security:scan` before completing work
4. **Validate inputs** - Ensure all user inputs are properly validated and sanitized
5. **Use environment variables** - Reference `.env.example` for proper patterns

### Documentation Standards

- All example API keys should use obvious placeholder formats
- Real credentials should never appear in documentation
- Security-sensitive code should include explanatory comments
- Follow the established patterns in SECURITY.md for guidance

## Important Files

- `SECURITY.md` - Comprehensive security guidelines
- `BRANCHING.md` - Git workflow and branch management
- `INSTALL.md` - User installation instructions
- `.env.example` - Template for environment variables
- `.gitleaksignore` - Exceptions for secret scanning

## Important Instruction Reminders

**CRITICAL SECURITY REMINDERS:**

- ALWAYS work on the `develop` branch
- NEVER commit real API keys, tokens, or secrets
- RUN `npm run security:scan` before commits
- USE `.env.local` for development secrets
- FOLLOW the git workflow in BRANCHING.md

Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
