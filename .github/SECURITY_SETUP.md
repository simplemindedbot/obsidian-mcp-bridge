# Security Setup Guide

This document explains how to enable and configure security features for the Obsidian MCP Bridge repository.

## GitHub Code Scanning Setup

### Enable Code Scanning

1. **Navigate to Repository Settings**
   - Go to your GitHub repository
   - Click on "Settings" tab
   - Scroll down to "Security" section in left sidebar

2. **Enable Code Scanning**
   - Click on "Code scanning"
   - Click "Set up code scanning"
   - Choose "GitHub Actions" as the analysis method

3. **Configure CodeQL**
   - The repository includes a `.github/workflows/codeql.yml` workflow
   - This will automatically run CodeQL analysis on:
     - Push to `main` and `develop` branches
     - Pull requests to `main`
     - Weekly schedule (Mondays at 18:42 UTC)

### Enable Secret Scanning

1. **Navigate to Repository Settings**
   - Go to "Settings" → "Security" → "Secret scanning"
   - Enable "Secret scanning" 
   - Enable "Push protection" (recommended)

### Enable Dependency Scanning

1. **Navigate to Repository Settings**
   - Go to "Settings" → "Security" → "Dependency graph"
   - Enable "Dependency graph"
   - Enable "Dependabot alerts"
   - Enable "Dependabot security updates"

## Workflow Configuration

### Security Workflow (`.github/workflows/security.yml`)

This workflow runs:
- **Gitleaks**: Secret detection in git history
- **npm audit**: Dependency vulnerability scanning  
- **ESLint**: Code quality analysis with SARIF output

### CodeQL Workflow (`.github/workflows/codeql.yml`)

This workflow runs:
- **CodeQL Analysis**: Advanced semantic code analysis
- **TypeScript scanning**: Language-specific security analysis
- **SARIF upload**: Results integration with GitHub Security tab

## Local Development Security

### Pre-commit Hooks

The repository includes automatic security scanning:

```bash
# Security scan runs automatically before commits
git commit -m "your message"
# Will run: npm run security:scan

# Manual security check
npm run security:check
```

### Environment Variables

Use `.env.local` for development secrets:

```bash
# Copy template
cp .env.example .env.local

# Add your keys (never commit this file)
BRAVE_API_KEY=your-api-key-here
OPENAI_API_KEY=your-openai-key-here
```

## Security Best Practices

### For Contributors

1. **Never commit secrets**
   - API keys, tokens, passwords
   - Database connection strings
   - Private certificates or keys

2. **Use environment variables**
   - Store secrets in `.env.local` (gitignored)
   - Reference via `process.env.VARIABLE_NAME`

3. **Review security alerts**
   - Check GitHub Security tab regularly
   - Address Dependabot alerts promptly
   - Review CodeQL findings

### For Maintainers

1. **Repository Settings**
   - Enable branch protection on `main`
   - Require status checks to pass
   - Require up-to-date branches

2. **Security Monitoring**
   - Monitor security advisories
   - Review dependency updates
   - Respond to vulnerability reports

3. **Access Control**
   - Use principle of least privilege
   - Regular access reviews
   - Secure CI/CD secrets

## Troubleshooting

### "Code scanning is not enabled" Error

If you see this error in GitHub Actions:

1. **Enable in Repository Settings**
   - Go to Settings → Security → Code scanning
   - Click "Set up code scanning"
   - Choose "GitHub Actions"

2. **Wait for First Run**
   - CodeQL needs initial setup run
   - Subsequent runs will upload results properly

3. **Check Permissions**
   - Ensure workflow has `security-events: write` permission
   - Verify repository allows Actions to create security events

### SARIF Upload Issues

Common issues and solutions:

1. **Invalid SARIF format**
   - Ensure ESLint formatter generates valid SARIF
   - Check file exists before upload step

2. **Permission denied**
   - Verify `security-events: write` permission
   - Check if code scanning is enabled

3. **File size limits**
   - SARIF files must be under 10MB
   - Split large results if necessary

## References

- [GitHub Code Scanning Documentation](https://docs.github.com/en/code-security/code-scanning)
- [CodeQL Documentation](https://codeql.github.com/docs/)
- [SARIF Format Specification](https://docs.oasis-open.org/sarif/sarif/v2.1.0/sarif-v2.1.0.html)
- [Security Best Practices](https://docs.github.com/en/code-security)