# Contributing to Obsidian MCP Bridge

Thank you for your interest in contributing to the Obsidian MCP Bridge project! This guide will help you get started with contributing code, documentation, and other improvements.

## 🤝 Ways to Contribute

### 🐛 Bug Reports
- Report bugs via [GitHub Issues](https://github.com/simplemindedbot/obsidian-mcp-bridge/issues)
- Use the bug report template
- Include reproduction steps, system info, and error logs

### 💡 Feature Requests
- Suggest new features via [GitHub Issues](https://github.com/simplemindedbot/obsidian-mcp-bridge/issues)
- Use the feature request template
- Explain the use case and expected behavior

### 📝 Documentation
- Improve existing documentation
- Add usage examples and tutorials
- Fix typos and clarify instructions

### 💻 Code Contributions
- Bug fixes
- New features
- Performance improvements
- Test coverage improvements

### 🧪 Testing & QA
- Test beta releases
- Report compatibility issues
- Help with MCP server integration testing

## 🚀 Getting Started

### Prerequisites

**Required:**
- **Node.js** (v16 or higher)
- **npm** (comes with Node.js)
- **Git** for version control
- **Obsidian** (latest version recommended)

**Recommended:**
- **TypeScript** knowledge
- **Obsidian Plugin Development** experience
- **MCP Protocol** familiarity

### Development Setup

1. **Fork and Clone:**
   ```bash
   # Fork the repository on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/obsidian-mcp-bridge.git
   cd obsidian-mcp-bridge
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Set Up Development Environment:**
   ```bash
   # Copy environment template
   cp .env.example .env.local
   
   # Edit .env.local with your development settings
   # This file is gitignored and safe for local secrets
   ```

4. **Link to Obsidian:**
   ```bash
   # Create symbolic link to your Obsidian vault
   ln -s "$(pwd)" "/path/to/your/vault/.obsidian/plugins/obsidian-mcp-bridge"
   ```

5. **Start Development:**
   ```bash
   # Start development mode with hot-reload
   npm run dev
   ```

### Development Commands

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

## 🏗️ Development Workflow

### Branch Strategy

We use a simplified Git workflow:

- **`main`** - Production/release branch (protected)
- **`develop`** - Active development branch (default for PRs)
- **`feature/feature-name`** - Feature branches (for major changes)

### Standard Workflow

```bash
# 1. Start from develop branch
git checkout develop
git pull origin develop

# 2. Create feature branch (for major changes)
git checkout -b feature/your-feature-name

# 3. Make your changes
# ... edit files ...

# 4. REQUIRED: Run security and quality checks
npm run security:scan    # Must pass
npm run lint            # Must pass
npm run build           # Must succeed
npm test                # Should pass

# 5. Commit changes
git add .
git commit -m "feat: add your feature description"

# 6. Push to your fork
git push origin feature/your-feature-name

# 7. Create Pull Request on GitHub
```

### Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `test`: Test improvements
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `chore`: Build/tooling changes

**Examples:**
```bash
feat(connections): add note connection analysis system
fix(search): resolve Omnisearch integration issue
docs(readme): update installation instructions
test(vault): add comprehensive vault search tests
```

## 🧪 Testing Guidelines

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- vault-search.test.ts

# Run tests in watch mode
npm test -- --watch
```

### Writing Tests

**Test Structure:**
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ComponentName', () => {
  beforeEach(() => {
    // Setup mocks
    vi.clearAllMocks();
  });

  describe('method name', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test data';
      
      // Act
      const result = methodUnderTest(input);
      
      // Assert
      expect(result).toBe('expected output');
    });
  });
});
```

**Mock Guidelines:**
- Use Vitest mocking for external dependencies
- Mock Obsidian APIs consistently
- Avoid testing implementation details
- Focus on behavior and contracts

### Test Coverage

We aim for high test coverage:

- **New features**: Must include tests
- **Bug fixes**: Should include regression tests
- **Critical paths**: Must be thoroughly tested
- **Edge cases**: Should be covered

## 🔒 Security Guidelines

### Mandatory Security Checks

**Before EVERY commit:**
```bash
npm run security:scan    # Must pass - no secrets detected
npm run lint            # Must pass - no security issues
```

### Security Rules

**NEVER commit:**
- Real API keys, tokens, passwords
- Database connection strings
- Private keys or certificates
- Production URLs or credentials
- Personal information

**Use placeholders:**
```json
{
  "apiKey": "your-api-key-here",
  "token": "your-token-here",
  "password": "your-password-here"
}
```

**Environment Variables:**
```bash
# Use .env.local for development secrets
cp .env.example .env.local
# .env.local is gitignored - never commit it
```

### Security Best Practices

1. **Input Validation**: Validate all user inputs
2. **Output Sanitization**: Sanitize data before display
3. **Error Handling**: Don't expose sensitive info in errors
4. **API Key Management**: Use environment variables
5. **Dependency Security**: Keep dependencies updated

## 🎨 Code Style Guidelines

### TypeScript Standards

**Use strict TypeScript:**
```typescript
// Good
interface UserConfig {
  name: string;
  enabled: boolean;
}

// Avoid
const config: any = { ... };
```

**Prefer explicit types:**
```typescript
// Good
function processQuery(query: string): Promise<QueryResult> {
  // ...
}

// Avoid
function processQuery(query) {
  // ...
}
```

### File Organization

```
src/
├── core/           # Core MCP functionality
├── bridge/         # Obsidian ↔ MCP translation
├── knowledge/      # Knowledge discovery and analysis
├── services/       # Business logic services
├── ui/            # User interface components
├── utils/         # Shared utilities
└── types/         # TypeScript type definitions
```

### Import Conventions

```typescript
// 1. Node modules
import { requestUrl } from 'obsidian';

// 2. Internal modules (use @ alias)
import { MCPClient } from '@/core/mcp-client';
import { getLogger } from '@/utils/logger';

// 3. Relative imports (avoid when possible)
import { LocalHelper } from './local-helper';
```

### Error Handling

```typescript
// Use structured error handling
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  this.logger.error('OperationFailed', 'Operation description failed', error);
  throw new Error('User-friendly error message');
}
```

## 📋 Pull Request Guidelines

### Before Submitting

**Checklist:**
- [ ] Code follows style guidelines
- [ ] Tests are included and passing
- [ ] Security scan passes
- [ ] Linting passes
- [ ] Build succeeds
- [ ] Documentation is updated
- [ ] No breaking changes (or clearly marked)

### PR Description Template

```markdown
## Summary
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring
- [ ] Performance improvement

## Testing
- [ ] Unit tests added/updated
- [ ] Manual testing completed
- [ ] Integration tests pass

## Security
- [ ] No secrets committed
- [ ] Security scan passes
- [ ] Input validation implemented

## Documentation
- [ ] README updated (if needed)
- [ ] API docs updated (if needed)
- [ ] Comments added for complex logic
```

### Review Process

1. **Automated Checks**: All CI checks must pass
2. **Code Review**: At least one maintainer review required
3. **Testing**: Manual testing by reviewer
4. **Security Review**: Security implications considered
5. **Documentation**: Docs updated if needed

## 🏛️ Architecture Guidelines

### Core Principles

1. **Separation of Concerns**: Clear boundaries between components
2. **Dependency Injection**: Use constructor injection for dependencies
3. **Error Boundaries**: Handle errors at appropriate levels
4. **Type Safety**: Leverage TypeScript for compile-time safety
5. **Testability**: Design for easy testing

### Component Responsibilities

**MCP Client** (`src/core/mcp-client.ts`):
- Protocol implementation
- Server connection management
- Health monitoring

**Bridge Interface** (`src/bridge/bridge-interface.ts`):
- Query routing and processing
- Obsidian ↔ MCP translation
- Context management

**Knowledge Engine** (`src/knowledge/knowledge-engine.ts`):
- Content discovery algorithms
- Relevance scoring
- Knowledge synthesis

**Services** (`src/services/`):
- Business logic implementation
- Domain-specific functionality
- Data processing

### Adding New Features

1. **Design First**: Consider architecture and interfaces
2. **Create Types**: Define TypeScript interfaces
3. **Implement Service**: Create business logic
4. **Add Integration**: Wire into bridge interface
5. **Create UI**: Add user interface if needed
6. **Write Tests**: Comprehensive test coverage
7. **Update Docs**: Document new functionality

## 📚 Documentation Standards

### Code Documentation

**JSDoc for public APIs:**
```typescript
/**
 * Analyzes note connections for a specific topic
 * @param topic - The topic to analyze connections for
 * @returns Promise resolving to note network analysis
 * @throws {Error} When topic is invalid or analysis fails
 */
async connectNotesOnTopic(topic: string): Promise<NoteNetwork> {
  // Implementation
}
```

**Comments for complex logic:**
```typescript
// Calculate relevance score using TF-IDF algorithm
// Higher scores indicate stronger topical relevance
const relevanceScore = this.calculateTFIDF(content, queryTerms);
```

### README Updates

When adding features, update:
- Feature list
- Usage examples
- Configuration options
- Installation requirements

### API Documentation

For new services or major changes:
- Create component documentation in `docs/components/`
- Include usage examples
- Document configuration options
- Explain integration points

## 🚀 Release Process

### Version Strategy

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (x.0.0): Breaking changes
- **MINOR** (0.x.0): New features, backward compatible
- **PATCH** (0.0.x): Bug fixes, backward compatible

### Release Checklist

1. **Update Version**: `package.json`, `manifest.json`, `versions.json`
2. **Update Docs**: Release notes, README, changelog
3. **Security Scan**: Final security check
4. **Build Test**: Ensure clean production build
5. **Create Release**: GitHub release with detailed notes
6. **Community Update**: Announce in discussions

## 🔧 Troubleshooting Development

### Common Issues

**Build Errors:**
```bash
# Clear and reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Clean build artifacts
npm run clean
npm run build
```

**Test Failures:**
```bash
# Run specific test file
npm test -- --reporter=verbose vault-search.test.ts

# Run with debugging
npm test -- --inspect-brk
```

**Linting Issues:**
```bash
# Auto-fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Getting Help

1. **Check Documentation**: [docs/](.) and [README.md](../README.md)
2. **Search Issues**: [GitHub Issues](https://github.com/simplemindedbot/obsidian-mcp-bridge/issues)
3. **Ask Questions**: [GitHub Discussions](https://github.com/simplemindedbot/obsidian-mcp-bridge/discussions)
4. **Review Examples**: [examples/](../examples/) directory

## 📞 Community & Support

### Communication

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Questions and community chat
- **Pull Requests**: Code contributions and reviews

### Code of Conduct

We're committed to providing a welcoming and inclusive environment:

- **Be Respectful**: Treat everyone with respect and kindness
- **Be Constructive**: Provide helpful feedback and suggestions
- **Be Patient**: Remember that everyone is learning
- **Be Inclusive**: Welcome contributors of all backgrounds and skill levels

### Recognition

Contributors are recognized in:
- Release notes
- README acknowledgments
- Git commit attribution
- Community discussions

## 🙏 Thank You

Thank you for contributing to Obsidian MCP Bridge! Your contributions help make knowledge discovery and AI-powered workflows better for everyone.

Whether you're fixing a bug, adding a feature, improving documentation, or helping other users, every contribution matters and is appreciated.

Happy coding! 🚀

---

**Questions?** Feel free to ask in [GitHub Discussions](https://github.com/simplemindedbot/obsidian-mcp-bridge/discussions) or open an issue for clarification.