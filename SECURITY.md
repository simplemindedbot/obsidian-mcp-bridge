# Security Guide

This document outlines security best practices for developing, configuring, and deploying the Obsidian MCP Bridge plugin.

## 🔐 Secret Management

### For Developers

#### 1. Environment Variables
Use environment variables for all sensitive configuration:

```bash
# Create local environment file (never commit this)
cp .env.example .env.local

# Edit with your actual values
BRAVE_API_KEY=your-actual-api-key-here
GITHUB_TOKEN=ghp_your-actual-token
```

#### 2. Git Protection
The repository is configured to prevent accidental secret commits:

**Protected Files (automatically ignored):**
- `.env*` (except `.env.example`)
- `data.json`, `settings.json`
- `secrets/`, `.secrets/`
- `*.key`, `*.pem`, `*.p12`, `*.pfx`
- `api-keys.json`, `tokens.json`, `credentials.json`

#### 3. Pre-commit Hooks (Recommended)
Install git hooks to scan for secrets before commits:

```bash
# Install gitleaks (secret detection tool)
brew install gitleaks  # macOS
# or
curl -sSfL https://raw.githubusercontent.com/gitleaks/gitleaks/master/scripts/install.sh | sh

# Add pre-commit hook
echo '#!/bin/bash
gitleaks detect --source . --verbose' > .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

### For End Users

#### 1. Plugin Settings
Store sensitive data in Obsidian's encrypted settings:

**✅ Good:**
```json
{
  "servers": {
    "web-search": {
      "name": "Brave Search",
      "env": {
        "BRAVE_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

**❌ Never do:**
- Store secrets in notes or documentation
- Share vault data without reviewing plugin settings
- Use production APIs for testing

#### 2. MCP Server Configuration
When configuring MCP servers with authentication:

```json
{
  "name": "Database Server",
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-postgres"],
  "env": {
    "DATABASE_URL": "postgresql://user:password@localhost:5432/mydb"
  }
}
```

- Use environment variables in MCP server commands when possible
- Avoid hardcoding credentials in configuration files
- Use least-privilege database users for MCP connections

## 🛡️ Development Security

### Code Review Checklist

Before committing code, verify:

- [ ] No hardcoded API keys, tokens, or passwords
- [ ] No real server URLs or sensitive endpoints in examples
- [ ] Environment variables used for all external service configuration
- [ ] Secrets are properly sanitized in logs and error messages
- [ ] Test data doesn't contain real credentials

### Logging Security

The plugin includes secure logging practices:

```typescript
// ✅ Safe logging
logger.info('Connected to server', { serverId: 'web-search' });

// ❌ Unsafe logging
logger.info('Connected with API key', { apiKey: process.env.API_KEY });
```

**Built-in protections:**
- API keys are automatically redacted in logs
- Environment variables containing "KEY", "TOKEN", "SECRET", "PASSWORD" are masked
- Error stack traces are sanitized to remove sensitive data

### Testing Security

When writing tests:

```typescript
// ✅ Use mock credentials
const mockConfig = {
  env: { 'BRAVE_API_KEY': 'test-api-key-12345' }
};

// ❌ Don't use real credentials
const realConfig = {
  env: { 'BRAVE_API_KEY': process.env.BRAVE_API_KEY }
};
```

## 🔍 Secret Detection

### Automated Scanning

The repository supports automated secret detection:

#### GitHub Actions (Recommended)
Add to `.github/workflows/security.yml`:

```yaml
name: Security Scan
on: [push, pull_request]

jobs:
  secrets:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run gitleaks
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

#### Local Development
```bash
# Scan for secrets before committing
npm run security:scan

# Or manually with gitleaks
gitleaks detect --source . --verbose
```

### Manual Review

Regular security audits should check:

1. **Git History:** `git log --all --grep="password\|key\|secret\|token" -i`
2. **File Contents:** Use tools like `grep -r "api_key\|password\|secret" --exclude-dir=node_modules .`
3. **Dependencies:** `npm audit` for vulnerable packages

## 🚨 Incident Response

### If Secrets Are Accidentally Committed

1. **Immediate Action:**
   ```bash
   # Remove from working directory
   git rm --cached path/to/secret-file
   
   # Remove from history (use with caution)
   git filter-branch --force --index-filter \
     'git rm --cached --ignore-unmatch path/to/secret-file' \
     --prune-empty --tag-name-filter cat -- --all
   ```

2. **Rotate Compromised Secrets:**
   - Revoke the exposed API keys/tokens immediately
   - Generate new credentials
   - Update all affected systems

3. **Notify Team:**
   - Inform all collaborators
   - Document the incident
   - Review security procedures

### If Plugin is Compromised

1. **User Actions:**
   - Disable the plugin immediately
   - Review plugin settings for unauthorized changes
   - Check Obsidian logs for suspicious activity
   - Rotate any API keys used with MCP servers

2. **Developer Actions:**
   - Report security issues via [GitHub Security Advisories](https://github.com/simplemindedbot/obsidian-mcp-bridge/security/advisories)
   - Release patched version immediately
   - Notify community through appropriate channels

## 📝 Security Best Practices

### For Plugin Development

1. **Input Validation:**
   - Sanitize all user inputs
   - Validate MCP server responses
   - Use TypeScript for type safety

2. **Network Security:**
   - Use HTTPS for all external connections
   - Validate SSL certificates
   - Implement proper timeout handling

3. **Data Handling:**
   - Minimize data retention
   - Encrypt sensitive data at rest
   - Use secure communication protocols

### For Configuration

1. **MCP Server Security:**
   - Use isolated environments for MCP servers
   - Apply principle of least privilege
   - Regularly update MCP server packages

2. **Network Configuration:**
   - Use private networks when possible
   - Implement proper firewall rules
   - Monitor MCP server access logs

3. **Access Control:**
   - Limit plugin permissions to necessary features
   - Review plugin settings regularly
   - Use separate credentials for different environments

## 🔗 Security Resources

### Tools
- [gitleaks](https://github.com/gitleaks/gitleaks) - Secret detection
- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit) - Dependency scanning
- [Observatory](https://observatory.mozilla.org/) - Security assessment

### Documentation
- [OWASP Secure Coding Practices](https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

## 📞 Reporting Security Issues

If you discover a security vulnerability, please:

1. **Do not** create a public GitHub issue
2. **Do** report via [GitHub Security Advisories](https://github.com/simplemindedbot/obsidian-mcp-bridge/security/advisories)
3. Include detailed information about the vulnerability
4. Provide steps to reproduce if possible

We take security seriously and will respond to verified reports within 48 hours.

---

**Remember:** Security is everyone's responsibility. When in doubt, err on the side of caution and ask for a security review.