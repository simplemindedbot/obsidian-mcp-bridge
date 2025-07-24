# Installation Guide

This guide will help you install and set up the Obsidian MCP Bridge plugin.

> **🚧 Beta Release v0.1.1** - This is a public beta release. Please report any issues you encounter!

## 📥 Quick Start

### Option 1: Download Beta Release (Recommended)

**Download the latest beta release:**

1. Go to [GitHub Releases](https://github.com/simplemindedbot/obsidian-mcp-bridge/releases/tag/v0.1.1-beta)
2. Download `main.js` and `manifest.json`
3. Follow [Method 1](#method-1-manual-installation-recommended-for-users) below

### Option 2: Build from Source

**Clone the repository:**

```bash
git clone https://github.com/simplemindedbot/obsidian-mcp-bridge.git
cd obsidian-mcp-bridge
```

## 📋 Prerequisites

### Required Software

- **Obsidian** (latest version recommended)
- **Node.js** (v16 or higher) - Only needed for building from source
- **Git** - For cloning the repository

### Optional but Recommended

- **MCP Servers** - To connect to external data sources
- **Terminal/Command Line** - For running build commands

## 🚀 Installation Methods

### Method 1: Manual Installation (Recommended for Users)

This is the most straightforward method for end users.

#### Step 1: Get the Plugin Files

**Option A: Download Beta Release (Easiest)**
1. Go to [GitHub Releases](https://github.com/simplemindedbot/obsidian-mcp-bridge/releases/tag/v0.1.1-beta)
2. Download `main.js` and `manifest.json`

**Option B: Build from Source**
```bash
# From the cloned repository directory
npm install

# Build the plugin
npm run build
```

#### Step 2: Find Your Obsidian Plugins Directory

Your Obsidian vault's plugins directory is located at:

```bash
# On macOS/Linux
/path/to/your/vault/.obsidian/plugins/

# On Windows
C:\path\to\your\vault\.obsidian\plugins\

# Example paths
~/Documents/MyVault/.obsidian/plugins/
/Users/username/Obsidian/MyVault/.obsidian/plugins/
```

#### Step 3: Install the Plugin

```bash
# Create the plugin directory
mkdir -p "/path/to/your/vault/.obsidian/plugins/obsidian-mcp-bridge"

# Copy the plugin files (downloaded or built)
cp main.js "/path/to/your/vault/.obsidian/plugins/obsidian-mcp-bridge/"
cp manifest.json "/path/to/your/vault/.obsidian/plugins/obsidian-mcp-bridge/"

# Note: styles.css is only needed if built from source
# cp styles.css "/path/to/your/vault/.obsidian/plugins/obsidian-mcp-bridge/"
```

### Method 2: Symbolic Link (For Developers)

This method is ideal if you plan to modify the plugin or want automatic updates during development.

```bash
# From the cloned repository directory
npm install

# Create symbolic link instead of copying
ln -s "$(pwd)" "/path/to/your/vault/.obsidian/plugins/obsidian-mcp-bridge"

# Start development mode (rebuilds on file changes)
npm run dev
```

### Method 3: BRAT Plugin (Beta Testing)

BRAT (Beta Reviewers Auto-update Tool) allows you to install plugins directly from GitHub.

1. **Install BRAT:**
   - Open Obsidian Settings
   - Go to Community Plugins
   - Search for "BRAT" and install it
   - Enable BRAT

2. **Add MCP Bridge:**
   - Open BRAT settings
   - Click "Add Beta Plugin"
   - Enter: `https://github.com/simplemindedbot/obsidian-mcp-bridge`
   - Click "Add Plugin"

3. **BRAT will automatically:**
   - Download and install the plugin
   - Keep it updated with the latest commits

## 🔧 Enable the Plugin in Obsidian

After installation, you need to enable the plugin:

1. **Open Obsidian Settings** (Ctrl/Cmd + ,)
2. **Navigate to Community Plugins**
3. **Turn off Safe Mode** (if not already disabled)
4. **Find "MCP Bridge"** in the installed plugins list
5. **Toggle the switch to ON**

You should see a message-circle icon appear in the ribbon (left sidebar).

## 🎯 Initial Setup

### Step 1: Open Plugin Settings

1. **Open Obsidian Settings** (Ctrl/Cmd + ,)
2. **Go to Community Plugins**
3. **Click on "MCP Bridge"** in the installed plugins list
4. **Click the gear icon** or "Options" button

### Step 2: Configure Your First MCP Server

Configure MCP servers by editing the plugin's configuration file directly at:

```bash
<vault>/.obsidian/plugins/obsidian-mcp-bridge/obsidian-mcp-bridge-config.json
```

Here are some example configurations to add to the "servers" section:

**Note**: After editing the configuration file, restart Obsidian to apply the changes.

#### Local Filesystem Server

```json
{
  "name": "Local Filesystem",
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/documents"],
  "enabled": true,
  "timeout": 10000,
  "retryAttempts": 3
}
```

#### Git Repository Server

```json
{
  "name": "Git Repository",
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-git", "/path/to/your/repo"],
  "enabled": true,
  "timeout": 10000,
  "retryAttempts": 3
}
```

#### Web Search Server (requires API key)

```json
{
  "name": "Web Search",
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-brave-search"],
  "enabled": true,
  "timeout": 15000,
  "retryAttempts": 3,
  "env": {
    "BRAVE_API_KEY": "your-api-key-here"
  }
}
```

### Step 3: Install MCP Servers

Install the MCP servers you want to use:

```bash
# Filesystem server
npm install -g @modelcontextprotocol/server-filesystem

# Git repository server
npm install -g @modelcontextprotocol/server-git

# Web search server (requires Brave API key)
npm install -g @modelcontextprotocol/server-brave-search

# SQLite database server
npm install -g @modelcontextprotocol/server-sqlite

# Postgres database server
npm install -g @modelcontextprotocol/server-postgres
```

## 🚀 Test Your Installation

### Basic Functionality Test

1. **Open the Chat Interface:**
   - Click the message-circle icon in the ribbon
   - Or use Command Palette: "MCP Bridge: Open Chat"

2. **Try a Natural Language Query:**

   ```
   "find my notes about productivity"
   "search for recent files"
   "what have I written about AI?"
   ```

3. **Use the Knowledge Discovery Hotkey:**
   - Press `Ctrl/Cmd + Shift + K` while editing a note
   - This will discover related content based on your current context

### Advanced Testing

1. **Check Server Status:**
   - Open plugin settings
   - Look for green indicators next to enabled servers
   - Red indicators mean connection issues

2. **Test MCP Server Integration:**

   ```
   "list files in my documents folder"
   "show me recent git commits"
   "search the web for machine learning papers"
   ```

3. **Test Content Insertion:**
   - Use the chat interface to get suggestions
   - Click "Insert" buttons to add content to your notes

## 📋 Logging and Debugging

The plugin includes comprehensive logging capabilities to help diagnose issues:

### **Log Files**

- **Location**: `.obsidian/plugins/obsidian-mcp-bridge/logs/`
- **Format**: Structured logs with timestamps, components, and error details
- **Rotation**: Automatic log rotation when files exceed size limits
- **Retention**: Configurable number of historical log files

### **Log Levels**

- **Error**: Critical errors that prevent functionality
- **Warning**: Non-critical issues that may affect performance
- **Info**: General information about plugin operations
- **Debug**: Detailed information for troubleshooting
- **Trace**: Extremely detailed information for development

### **Managing Logs**

1. **View Logs**: Use the "View Logs" button in settings to create a note with current logs
2. **Clear Logs**: Use the "Clear Logs" button to delete all log files
3. **Configure Logging**: Adjust log levels and file sizes in "Logging & Debugging" settings

### **Log File Analysis**

Each log entry contains:

- **Timestamp**: When the event occurred
- **Level**: Severity of the message
- **Component**: Which part of the plugin generated the log
- **Message**: Description of the event
- **Error Details**: Stack traces and error information (if applicable)
- **Metadata**: Additional context information

## 🔧 Troubleshooting

### Common Issues

#### Plugin Not Appearing

1. **Check file permissions:**

   ```bash
   ls -la "/path/to/your/vault/.obsidian/plugins/obsidian-mcp-bridge/"
   ```

2. **Verify all required files are present:**
   - `main.js`
   - `manifest.json`
   - `styles.css`

3. **Restart Obsidian** after installation

#### MCP Server Connection Issues

1. **"spawn npx ENOENT" Error:**
   This error occurs when Obsidian can't find the `npx` command. The plugin automatically resolves executable paths, but if you continue to see this error:

   ```bash
   # Verify npx is available in your shell
   which npx
   
   # If npx is not found, ensure Node.js is properly installed
   node --version  # Should be v16 or higher
   npm --version   # Should be available
   ```

   **Solution:** The plugin includes automatic path resolution that finds executables in common locations. If you're still having issues, check the logs in plugin settings for detailed path resolution information.

2. **Test MCP servers independently:**

   ```bash
   # Test filesystem server
   npx @modelcontextprotocol/server-filesystem /path/to/test
   
   # Test with specific path
   npx @modelcontextprotocol/server-filesystem ~/Documents
   ```

3. **Check server paths:**
   - Ensure paths in configuration exist
   - Use absolute paths (not relative)
   - Check file/directory permissions

4. **Verify Node.js installation:**

   ```bash
   node --version  # Should be v16 or higher
   npm --version   # Should be available
   npx --version   # Should be available
   ```

#### Plugin Errors

1. **Enable Debug Mode:**
   - Open plugin settings
   - Go to "Logging & Debugging" section
   - Turn on "Enable File Logging"
   - Set "Log Level" to "Debug" or "Trace"
   - Check browser console (Ctrl/Cmd + Shift + I)

2. **Check Log Files:**
   - In plugin settings, go to "Logging & Debugging"
   - Click "View Logs" to see detailed error information
   - Log files are saved to: `.obsidian/plugins/obsidian-mcp-bridge/logs/`

3. **Check Console for Errors:**
   - Open Developer Tools (Ctrl/Cmd + Shift + I)
   - Look for error messages in the Console tab
   - Copy error messages for troubleshooting

4. **Reset Plugin Settings:**
   - Go to plugin settings
   - Click "Reset to Defaults"
   - Reconfigure your servers

### Performance Issues

1. **Reduce Concurrent Connections:**
   - Go to Advanced Settings
   - Lower "Max Concurrent Requests"
   - Increase timeout values

2. **Optimize Search Settings:**
   - Adjust "Relevance Threshold"
   - Reduce "Max Results"
   - Enable caching if disabled

3. **Monitor Memory Usage:**
   - Check plugin settings for memory usage display
   - Restart Obsidian if memory usage is high

## 📚 Getting Help

### Documentation

- **[Component Documentation](docs/components/README.md)** - Technical details
- **[Development Guide](docs/DEVELOPMENT.md)** - For developers
- **[Project Status](PROJECT_STATUS.md)** - Current features and roadmap

### Community Support

- **[GitHub Issues](https://github.com/simplemindedbot/obsidian-mcp-bridge/issues)** - Bug reports and feature requests
- **[GitHub Discussions](https://github.com/simplemindedbot/obsidian-mcp-bridge/discussions)** - Community discussions
- **[Obsidian Community](https://obsidian.md/community)** - General Obsidian support

### Reporting Issues

When reporting issues, please include:

1. **System Information:**
   - Operating system and version
   - Obsidian version
   - Node.js version
   - Plugin version

2. **Error Details:**
   - Console error messages
   - Steps to reproduce
   - Expected vs actual behavior

3. **Configuration:**
   - MCP server configurations (remove sensitive data)
   - Plugin settings (if relevant)

## 🔄 Updates

### Manual Updates

1. **Pull latest changes:**

   ```bash
   cd /path/to/obsidian-mcp-bridge
   git pull origin main
   npm install
   npm run build
   ```

2. **Copy updated files:**

   ```bash
   cp main.js "/path/to/your/vault/.obsidian/plugins/obsidian-mcp-bridge/"
   cp manifest.json "/path/to/your/vault/.obsidian/plugins/obsidian-mcp-bridge/"
   cp styles.css "/path/to/your/vault/.obsidian/plugins/obsidian-mcp-bridge/"
   ```

3. **Restart Obsidian**

### BRAT Updates

If you installed via BRAT, updates are automatic:

1. **Check for updates:**
   - Open BRAT settings
   - Click "Check for Updates"

2. **Manual update:**
   - Click "Update" next to MCP Bridge
   - Restart Obsidian

## 🎉 You're Ready

Congratulations! You've successfully installed the Obsidian MCP Bridge plugin.

### Next Steps

1. **Explore the Features:**
   - Try different natural language queries
   - Experiment with the knowledge discovery hotkey
   - Configure additional MCP servers

2. **Customize Your Setup:**
   - Adjust relevance thresholds
   - Configure hotkeys
   - Set up templates

3. **Join the Community:**
   - Star the repository on GitHub
   - Share your use cases and feedback
   - Contribute to the project

Happy knowledge discovering! 🚀

---

**Need help?** Check the [troubleshooting section](#-troubleshooting) or [open an issue](https://github.com/simplemindedbot/obsidian-mcp-bridge/issues) on GitHub.
