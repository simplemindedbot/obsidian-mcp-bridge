# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this Obsidian MCP Bridge plugin repository.

## Quick Start Commands

### Essential Development Commands

```bash
# Development & Build
npm run dev              # Start development mode with esbuild watching
npm run build            # Build for production (includes type check)
npm run clean            # Remove build artifacts

# Testing & Quality Assurance  
npm test                 # Run tests with Vitest
npm run test:coverage    # Run tests with coverage reporting
npm run type-check       # Type check without emitting files
npm run lint             # Lint TypeScript files with security rules
npm run lint:fix         # Auto-fix linting issues
npm run format          # Format code with Prettier

# Security (REQUIRED before commits)
npm run security:scan    # Scan for secrets with gitleaks
npm run security:check   # Full security audit (npm audit + secret scan)
```

## Git Workflow & Security

### Branch Strategy
- **`develop`** - Active development branch (work here by default)
- **`main`** - Production/release branch (protected, requires PR)

### Development Workflow
```bash
# Standard workflow
git checkout develop && git pull origin develop
git add . && git commit -m "feat: description"
git push origin develop

# Feature branches (for major changes)
git checkout -b feature/feature-name
git push origin feature/feature-name
# Create PR to develop
```

### Security Protocol (MANDATORY)

**Before EVERY commit:**
```bash
npm run security:scan    # Must pass - no secrets detected
npm run lint            # Must pass - no security issues
```

**NEVER commit:**
- Real API keys, tokens, passwords
- Database connection strings
- Private keys or certificates  
- Production URLs or credentials

**Environment Variables:**
```bash
cp .env.example .env.local    # Use for development secrets
# .env.local is gitignored - never commit it
```

## Project Architecture

**Overview:** Obsidian plugin bridging the Model Context Protocol (MCP) with Obsidian for AI-powered knowledge management.

### Core Components

| Component | Location | Purpose |
|-----------|----------|---------|
| **Main Plugin** | `src/main.ts` | Entry point, lifecycle management, hotkey `Ctrl/Cmd+Shift+K` |
| **MCP Client** | `src/core/mcp-client.ts` | Multi-server connections (stdio/WebSocket/SSE), path resolution |
| **Knowledge Engine** | `src/knowledge/knowledge-engine.ts` | Content analysis and knowledge discovery |
| **Bridge Interface** | `src/bridge/bridge-interface.ts` | Obsidian ↔ MCP protocol translation |
| **Settings Migration** | `src/utils/settings-migration.ts` | Version-based settings upgrades |
| **Path Resolver** | `src/utils/path-resolver.ts` | Cross-platform executable discovery |
| **Logger System** | `src/utils/logger.ts` | Structured logging with API key redaction |
| **UI Components** | `src/ui/` | Settings tab, chat view (uses `@/` imports) |

### Key Features
- **Multi-transport MCP support** - stdio, WebSocket, SSE connections
- **Dynamic path resolution** - Solves ENOENT errors across platforms  
- **Settings migration system** - Automatic upgrades between versions
- **Security-first design** - Multiple layers of secret protection
- **Comprehensive testing** - 34+ unit tests with Vitest

### Integration Points
- Ribbon icon: `message-circle`
- Chat view: Right sidebar by default
- Command palette: Knowledge discovery commands
- Settings: MCP server configuration with working directories

### Reference Architecture
Based on [MCP-SuperAssistant](https://github.com/srbhptl39/MCP-SuperAssistant) patterns for event-driven MCP client implementation.

## Development Guidelines

### Security Requirements
1. **Never generate real secrets** - Use placeholders like `"your-api-key-here"`
2. **Run security scans** - `npm run security:scan` before every commit
3. **Validate all inputs** - Ensure proper sanitization and validation
4. **Follow existing patterns** - Check established security practices in codebase
5. **Use environment variables** - Reference `.env.example` for proper patterns

### Code Quality Standards
- Follow ESLint security rules (configured in `.eslintrc.js`)
- Write tests for new features using Vitest
- Use TypeScript strict mode - avoid `any` types when possible
- Include explanatory comments for security-sensitive code
- Follow established file naming and import patterns

### Important Files
| File | Purpose |
|------|---------|
| `SECURITY.md` | Comprehensive security guidelines |
| `BRANCHING.md` | Git workflow and branch management |
| `INSTALL.md` | User installation instructions |
| `.env.example` | Template for environment variables |
| `.gitleaksignore` | Exceptions for secret scanning |
| `.eslintrc.js` | Linting rules with security focus |

## Current Status

### ✅ Recently Completed (Latest)
- **Security Infrastructure** - ESLint configuration, code scanning fixes, GitHub Actions security workflow
- **Settings Migration System** - Version-based upgrades, working directory separation
- **Enhanced UI** - Individual argument inputs, dynamic add/remove functionality
- **Path Resolution** - Cross-platform executable discovery, ENOENT error fixes
- **Testing Coverage** - 34+ unit tests with Vitest, comprehensive error handling

### 🔄 Development Priorities
1. **Plugin Testing** - Verify in real Obsidian environment
2. **MCP Server Integration** - Test filesystem, web search, and git servers
3. **Performance Optimization** - Improve connection handling and error recovery

## Claude Code Instructions

### Mandatory Workflow
```bash
# Before every commit (REQUIRED)
npm run security:scan    # Must pass
npm run lint            # Must pass  
npm run build           # Must succeed

# Work on develop branch by default
git checkout develop
```

### Critical Rules
- **NEVER commit real secrets** - API keys, tokens, passwords, connection strings
- **ALWAYS use placeholders** - `"your-api-key-here"`, `"your-token-here"`
- **WORK on `develop` branch** - Unless explicitly told otherwise
- **EDIT existing files** - Don't create new files unless absolutely necessary
- **NO unsolicited documentation** - Don't create .md files unless requested

### Development Standards
- Run `npm run build` before testing changes
- Test settings migration after schema changes  
- Verify MCP server connections after config updates
- Follow existing code patterns and import styles
- Use `.env.local` for development secrets (gitignored)
