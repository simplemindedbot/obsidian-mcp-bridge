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

### ✅ Recently Completed (v0.1.1-beta - 2025-01-24)

- **🚀 Public Beta Release** - First public release with comprehensive documentation
- **Multi-Server Dynamic Loading** - Enhanced system to load ALL servers from config, not just filesystem
- **Intelligent LLM Routing** - Context-aware query routing with OpenAI/Anthropic/OpenAI-compatible support
- **Enhanced Server Discovery** - Automatic cataloging of server capabilities and tools
- **Improved Fallback Logic** - Better heuristic routing for git, web search, filesystem, and database operations
- **Cross-Platform Compatibility** - Full Windows/macOS/Linux support with dynamic path resolution
- **Security Infrastructure** - Comprehensive secret protection, ESLint security rules, automated scanning
- **Professional Documentation** - Installation guides, security practices, API references, release notes

### 🔄 Development Priorities (v0.2.0)

1. **Beta Feedback Integration** - Address user reports and feedback from public beta
2. **Test Suite Improvements** - Fix timeout issues in mock scenarios
3. **Performance Optimization** - Reduce server discovery time and improve error handling
4. **Enhanced UI/UX** - Better user experience for server configuration and routing results

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
- **ENSURE CROSS-PLATFORM COMPATIBILITY** - No hardcoded system-specific paths, directories, or shortcuts

### Development Standards

- Run `npm run build` before testing changes
- Test settings migration after schema changes  
- Verify MCP server connections after config updates
- Follow existing code patterns and import styles
- Use `.env.local` for development secrets (gitignored)

### Cross-Platform Compatibility Requirements

- **Use `os.platform()` for platform detection** - Never hardcode `'win32'`, `'darwin'`, `'linux'`
- **Use environment variables for paths** - `process.env.HOME || process.env.USERPROFILE`
- **Handle path separators correctly** - `path.sep` or conditional `'\\' : '/'`
- **Use proper command resolution** - `where` on Windows, `which` on Unix
- **Include file extensions on Windows** - Add `.exe` for executables when needed
- **Test path logic across platforms** - Windows, macOS, Linux compatibility required
