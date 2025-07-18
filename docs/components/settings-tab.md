# SettingsTab Component Documentation

The `SettingsTab` class provides the configuration interface for the MCP Bridge plugin. It extends Obsidian's `PluginSettingTab` to create a comprehensive settings panel for managing MCP servers and plugin options.

## Class: SettingsTab

**Location**: `src/ui/settings-tab.ts`

**Extends**: `PluginSettingTab`

### Constructor

```typescript
constructor(app: App, plugin: MCPBridgePlugin)
```

Creates a new SettingsTab instance.

**Parameters:**
- `app`: `App` - The Obsidian App instance
- `plugin`: `MCPBridgePlugin` - The main plugin instance

### Properties

#### `plugin: MCPBridgePlugin`
Reference to the main plugin instance.

#### `serverListContainer: HTMLElement`
Container element for the server list.

#### `selectedServerId: string | null`
Currently selected server ID for editing.

### Methods

#### `display(): void`

Displays the settings interface by creating all UI elements.

**Returns:** `void`

#### `createGeneralSettings(): void`

Creates the general plugin settings section.

**Returns:** `void`

#### `createServerSettings(): void`

Creates the MCP server configuration section.

**Returns:** `void`

#### `createKnowledgeEngineSettings(): void`

Creates the knowledge engine configuration section.

**Returns:** `void`

#### `createAdvancedSettings(): void`

Creates the advanced settings section.

**Returns:** `void`

#### `refreshServerList(): void`

Refreshes the server list display.

**Returns:** `void`

#### `addServerConfiguration(serverId?: string): void`

Adds or edits a server configuration.

**Parameters:**
- `serverId`: `string` (optional) - Server ID to edit, or undefined for new server

**Returns:** `void`

#### `removeServerConfiguration(serverId: string): void`

Removes a server configuration.

**Parameters:**
- `serverId`: `string` - The server ID to remove

**Returns:** `void`

#### `testServerConnection(serverId: string): Promise<void>`

Tests the connection to a specific server.

**Parameters:**
- `serverId`: `string` - The server ID to test

**Returns:** `Promise<void>`

#### `exportSettings(): void`

Exports current settings to a JSON file.

**Returns:** `void`

#### `importSettings(): void`

Imports settings from a JSON file.

**Returns:** `void`

#### `resetSettings(): void`

Resets all settings to defaults.

**Returns:** `void`

#### `saveSettings(): Promise<void>`

Saves the current settings.

**Returns:** `Promise<void>`

## Settings Sections

### General Settings

#### Enable Debug Mode
- **Type**: Toggle
- **Default**: `false`
- **Description**: Enables debug logging for troubleshooting

#### Auto-connect on Startup
- **Type**: Toggle
- **Default**: `true`
- **Description**: Automatically connects to enabled servers on plugin load

#### Default Query Timeout
- **Type**: Number input
- **Default**: `30000` (30 seconds)
- **Description**: Default timeout for MCP queries in milliseconds

#### Enable Notifications
- **Type**: Toggle
- **Default**: `true`
- **Description**: Shows notifications for important events

### Server Settings

#### Server List
- **Type**: Custom component
- **Description**: List of configured MCP servers with status indicators

#### Add Server Button
- **Type**: Button
- **Description**: Opens dialog to add new server configuration

#### Server Configuration Fields
- **Server Name**: Human-readable name for the server
- **Server Type**: Dropdown (stdio, websocket, sse)
- **Connection Details**: Fields specific to connection type
- **Timeout**: Server-specific timeout override
- **Retry Attempts**: Number of retry attempts for connections
- **Enabled**: Toggle to enable/disable the server

### Knowledge Engine Settings

#### Enable Vault Search
- **Type**: Toggle
- **Default**: `true`
- **Description**: Enables searching within the Obsidian vault

#### Enable MCP Search
- **Type**: Toggle
- **Default**: `true`
- **Description**: Enables searching across MCP servers

#### Relevance Threshold
- **Type**: Number slider
- **Default**: `0.3`
- **Range**: `0.0` to `1.0`
- **Description**: Minimum relevance score for search results

#### Maximum Results
- **Type**: Number input
- **Default**: `50`
- **Description**: Maximum number of search results to return

#### Enable Caching
- **Type**: Toggle
- **Default**: `true`
- **Description**: Enables caching of search results

#### Cache Timeout
- **Type**: Number input
- **Default**: `300000` (5 minutes)
- **Description**: Cache timeout in milliseconds

### Advanced Settings

#### Custom Hotkeys
- **Type**: Hotkey configurator
- **Description**: Configure custom keyboard shortcuts

#### Theme Settings
- **Type**: Color pickers
- **Description**: Customize chat interface colors

#### Performance Settings
- **Type**: Various inputs
- **Description**: Memory limits, batch sizes, etc.

#### Experimental Features
- **Type**: Toggle switches
- **Description**: Enable experimental or beta features

## Server Configuration Types

### STDIO Server Configuration

```typescript
interface StdioServerConfig {
  type: 'stdio';
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  cwd?: string;
  timeout?: number;
  retryAttempts?: number;
  enabled: boolean;
}
```

**UI Fields:**
- **Command**: Text input for the executable command
- **Arguments**: Text area for command arguments (one per line)
- **Environment Variables**: Key-value pairs for environment variables
- **Working Directory**: Directory picker for working directory

### WebSocket Server Configuration

```typescript
interface WebSocketServerConfig {
  type: 'websocket';
  name: string;
  url: string;
  headers?: Record<string, string>;
  timeout?: number;
  retryAttempts?: number;
  enabled: boolean;
}
```

**UI Fields:**
- **URL**: Text input for WebSocket URL
- **Headers**: Key-value pairs for connection headers

### SSE Server Configuration

```typescript
interface SSEServerConfig {
  type: 'sse';
  name: string;
  url: string;
  headers?: Record<string, string>;
  timeout?: number;
  retryAttempts?: number;
  enabled: boolean;
}
```

**UI Fields:**
- **URL**: Text input for SSE endpoint URL
- **Headers**: Key-value pairs for request headers

## UI Components

### Server List Component
- **Status Indicators**: Shows connection status for each server
- **Quick Actions**: Enable/disable, test connection, edit, delete
- **Drag & Drop**: Reorder servers by dragging
- **Bulk Actions**: Enable/disable multiple servers at once

### Server Configuration Modal
- **Dynamic Fields**: Shows relevant fields based on server type
- **Validation**: Real-time validation of configuration
- **Test Connection**: Button to test configuration before saving
- **Save/Cancel**: Standard modal actions

### Settings Import/Export
- **Export Button**: Downloads settings as JSON file
- **Import Button**: Uploads and applies settings from JSON file
- **Reset Button**: Resets to default settings with confirmation

## Validation

The SettingsTab includes comprehensive validation:

### Server Configuration Validation
- **Required Fields**: Ensures all required fields are filled
- **URL Validation**: Validates WebSocket and SSE URLs
- **Command Validation**: Checks if STDIO commands exist
- **Port Validation**: Ensures valid port numbers
- **Timeout Validation**: Checks timeout values are reasonable

### Settings Validation
- **Numeric Ranges**: Validates numeric inputs are within acceptable ranges
- **File Paths**: Validates file paths exist and are accessible
- **JSON Format**: Validates imported settings are proper JSON

## Error Handling

The SettingsTab provides clear error feedback:

- **Field-level Errors**: Shows validation errors next to relevant fields
- **Connection Errors**: Displays connection test results
- **Import Errors**: Shows detailed error messages for import failures
- **Save Errors**: Provides feedback when settings can't be saved

## Best Practices

1. **Test Connections**: Always test server connections before saving
2. **Backup Settings**: Export settings before making major changes
3. **Validate Inputs**: Check all inputs for valid formats
4. **Use Descriptive Names**: Give servers meaningful names
5. **Monitor Performance**: Adjust performance settings based on usage

## Example Usage

```typescript
// Create and display settings tab
const settingsTab = new SettingsTab(app, plugin);
settingsTab.display();

// Programmatically add a server
settingsTab.addServerConfiguration();

// Test a server connection
await settingsTab.testServerConnection('filesystem-server');

// Export current settings
settingsTab.exportSettings();
```

## Integration with Plugin

The SettingsTab integrates with the main plugin:

- **Settings Loading**: Loads settings from plugin data
- **Settings Saving**: Saves settings to plugin data
- **Live Updates**: Updates plugin components when settings change
- **Validation**: Ensures settings are valid before applying

## Styling

The SettingsTab uses Obsidian's standard styling:

```css
.mcp-bridge-settings {
  padding: 20px;
}

.mcp-server-list {
  border: 1px solid var(--background-modifier-border);
  border-radius: 8px;
  padding: 10px;
}

.mcp-server-item {
  display: flex;
  align-items: center;
  padding: 8px;
  border-bottom: 1px solid var(--background-modifier-border);
}

.mcp-server-status {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 8px;
}

.mcp-server-status.connected {
  background-color: var(--color-green);
}

.mcp-server-status.disconnected {
  background-color: var(--color-red);
}
```

## Accessibility

The SettingsTab includes accessibility features:

- **Keyboard Navigation**: All controls are keyboard accessible
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Focus Management**: Logical tab order and focus indicators
- **High Contrast**: Respects system high contrast settings