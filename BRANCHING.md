# Branching Strategy

This document outlines the git branching strategy for the Obsidian MCP Bridge project.

## 🌳 Branch Structure

### Main Branches

**`main`** - Production/Release Branch
- Always deployable and stable
- Contains latest released version
- Protected branch with required PR reviews
- Automatic security scanning and CI/CD

**`develop`** - Development Integration Branch  
- Integration branch for features
- Contains latest development changes
- Where feature branches merge into
- Regular testing and quality checks

### Supporting Branches

**Feature Branches** - `feature/description` or `feature/issue-number`
- Created from `develop`
- Merged back into `develop` via PR
- Deleted after successful merge

**Bugfix Branches** - `bugfix/description` or `bugfix/issue-number`
- Created from `develop` (or `main` for hotfixes)
- Merged back into source branch via PR

**Hotfix Branches** - `hotfix/description`
- Created from `main` for critical production fixes
- Merged into both `main` and `develop`
- Tagged with version number

## 🚀 Workflow

### For New Features

```bash
# Start from develop
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/path-resolver-integration

# Work on feature...
# Commit changes
git add .
git commit -m "feat: implement dynamic path resolution for MCP servers"

# Push feature branch
git push origin feature/path-resolver-integration

# Create PR to develop branch
gh pr create --base develop --title "feat: Dynamic Path Resolution" --body "..."
```

### For Bug Fixes

```bash
# Start from develop
git checkout develop  
git pull origin develop

# Create bugfix branch
git checkout -b bugfix/mcp-connection-timeout

# Fix the bug...
git add .
git commit -m "fix: increase MCP connection timeout for slow servers"

# Push and create PR
git push origin bugfix/mcp-connection-timeout
gh pr create --base develop --title "fix: MCP Connection Timeout" --body "..."
```

### For Releases

```bash
# Create release branch from develop
git checkout develop
git pull origin develop
git checkout -b release/0.2.0

# Update version numbers, changelog, docs
npm version minor  # Updates package.json
git add .
git commit -m "chore: prepare release 0.2.0"

# Push release branch
git push origin release/0.2.0

# Create PR to main
gh pr create --base main --title "Release 0.2.0" --body "..."

# After merge, tag the release
git checkout main
git pull origin main
git tag -a v0.2.0 -m "Release version 0.2.0"
git push origin v0.2.0

# Merge back to develop
git checkout develop
git merge main
git push origin develop
```

### For Hotfixes

```bash
# Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/security-patch

# Apply critical fix
git add .
git commit -m "fix: patch security vulnerability in path resolution"

# Push hotfix
git push origin hotfix/security-patch

# Create PR to main
gh pr create --base main --title "Hotfix: Security Patch" --body "..."

# After merge to main, also merge to develop
gh pr create --base develop --title "Hotfix: Security Patch" --body "..."
```

## 🔒 Branch Protection

### Main Branch Protection
- Require PR reviews (at least 1 reviewer)
- Require status checks to pass
- Require branches to be up to date
- Require conversation resolution
- Dismiss stale reviews on new commits
- Restrict force pushes

### Develop Branch Protection  
- Require status checks to pass
- Require branches to be up to date
- Allow force pushes (for rebasing)

## 🏷️ Commit Conventions

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types
- **feat**: New features
- **fix**: Bug fixes  
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks
- **security**: Security improvements
- **perf**: Performance improvements

### Examples
```bash
feat(mcp): add dynamic path resolution for executable discovery
fix(ui): resolve chat interface memory leak
docs: update installation guide with security requirements
security: implement API key redaction in logging system
test: add comprehensive path resolver test coverage
```

## 🔄 Current Development State

**Active Branch**: `develop`
- Latest changes: PathResolver integration, Security framework
- Ready for: Feature development and testing
- Next: Merge completed features to main when stable

**Recommended Workflow**:
1. Work on `develop` for ongoing development
2. Create feature branches for major new features
3. Use PRs even for small changes to maintain history
4. Regular merges to `main` when `develop` is stable

## 🛠️ Branch Management Commands

```bash
# Switch to develop
git checkout develop

# Create new feature branch
git checkout -b feature/your-feature-name

# Push current branch
git push origin $(git branch --show-current)

# Clean up merged branches
git branch --merged develop | grep -v "develop\|main" | xargs -n 1 git branch -d

# Update develop from main
git checkout develop
git pull origin main
```

## 📋 PR Templates

### Feature PR Template
```markdown
## Feature Description
Brief description of the feature

## Changes Made
- [ ] Implementation details
- [ ] Tests added/updated
- [ ] Documentation updated

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Security Review
- [ ] No secrets in code
- [ ] Input validation implemented
- [ ] Error handling reviewed
```

This branching strategy ensures code quality, security, and maintainability while supporting collaborative development.