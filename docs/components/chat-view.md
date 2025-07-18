# ChatView Component Documentation

The `ChatView` class provides the main user interface for interacting with the MCP Bridge plugin. It extends Obsidian's `ItemView` to create a chat-like interface for knowledge discovery and content generation.

## Class: ChatView

**Location**: `src/ui/chat-view.ts`

**Extends**: `ItemView`

### Constructor

```typescript
constructor(leaf: WorkspaceLeaf, bridgeInterface: BridgeInterface, settings: MCPBridgeSettings)
```

Creates a new ChatView instance.

**Parameters:**
- `leaf`: `WorkspaceLeaf` - The Obsidian workspace leaf
- `bridgeInterface`: `BridgeInterface` - The bridge interface for query processing
- `settings`: `MCPBridgeSettings` - Plugin settings

### Properties

#### `bridgeInterface: BridgeInterface`
The bridge interface for processing queries and managing content.

#### `settings: MCPBridgeSettings`
Current plugin settings.

#### `messagesContainer: HTMLElement`
Container element for chat messages.

#### `inputElement: HTMLInputElement`
Input element for user queries.

#### `isProcessing: boolean`
Flag indicating if a query is currently being processed.

### Methods

#### `getViewType(): string`

Returns the view type identifier.

**Returns:** `string` - Always returns `'mcp-bridge-chat'`

#### `getDisplayText(): string`

Returns the display text for the view.

**Returns:** `string` - Always returns `'MCP Bridge Chat'`

#### `getIcon(): string`

Returns the icon identifier for the view.

**Returns:** `string` - Always returns `'message-circle'`

#### `onOpen(): Promise<void>`

Called when the view is opened. Initializes the UI components.

**Returns:** `Promise<void>`

#### `onClose(): Promise<void>`

Called when the view is closed. Cleans up resources.

**Returns:** `Promise<void>`

#### `sendMessage(message: string): Promise<void>`

Sends a message/query to the bridge interface and displays the response.

**Parameters:**
- `message`: `string` - The user message or query

**Returns:** `Promise<void>`

**Example:**
```typescript
await chatView.sendMessage('find my notes about machine learning');
```

#### `displayMessage(message: ChatMessage): void`

Displays a message in the chat interface.

**Parameters:**
- `message`: `ChatMessage` - The message to display

**Example:**
```typescript
chatView.displayMessage({
  type: 'user',
  content: 'Hello, world!',
  timestamp: new Date()
});
```

#### `displayResults(results: QueryResult): void`

Displays query results in the chat interface.

**Parameters:**
- `results`: `QueryResult` - The query results to display

**Example:**
```typescript
chatView.displayResults(queryResult);
```

#### `displayError(error: Error): void`

Displays an error message in the chat interface.

**Parameters:**
- `error`: `Error` - The error to display

**Example:**
```typescript
chatView.displayError(new Error('Connection failed'));
```

#### `clearMessages(): void`

Clears all messages from the chat interface.

**Example:**
```typescript
chatView.clearMessages();
```

#### `focusInput(): void`

Focuses the input element.

**Example:**
```typescript
chatView.focusInput();
```

#### `setProcessing(processing: boolean): void`

Sets the processing state and updates the UI accordingly.

**Parameters:**
- `processing`: `boolean` - Whether processing is active

**Example:**
```typescript
chatView.setProcessing(true);
// ... perform operation
chatView.setProcessing(false);
```

#### `addSuggestionButtons(suggestions: ContentSuggestion[]): void`

Adds suggestion buttons to the chat interface.

**Parameters:**
- `suggestions`: `ContentSuggestion[]` - Array of content suggestions

**Example:**
```typescript
chatView.addSuggestionButtons(suggestions);
```

#### `addActionButtons(actions: QueryAction[]): void`

Adds action buttons to the chat interface.

**Parameters:**
- `actions`: `QueryAction[]` - Array of query actions

**Example:**
```typescript
chatView.addActionButtons(actions);
```

#### `scrollToBottom(): void`

Scrolls the chat container to the bottom.

**Example:**
```typescript
chatView.scrollToBottom();
```

#### `updateSettings(settings: MCPBridgeSettings): void`

Updates the view settings.

**Parameters:**
- `settings`: `MCPBridgeSettings` - New plugin settings

**Example:**
```typescript
chatView.updateSettings(newSettings);
```

## Type Definitions

### `ChatMessage`

```typescript
interface ChatMessage {
  type: 'user' | 'assistant' | 'system' | 'error';
  content: string;
  timestamp: Date;
  metadata?: any;
}
```

### `MessageRenderer`

```typescript
interface MessageRenderer {
  render(message: ChatMessage): HTMLElement;
}
```

### `ChatTheme`

```typescript
interface ChatTheme {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  border: string;
  accent: string;
}
```

## UI Components

### Message Container
The main container for all chat messages with automatic scrolling.

### Input Area
- Text input field for user queries
- Send button
- Processing indicator
- Keyboard shortcuts (`Enter` to send, `Shift+Enter` for new line)

### Message Types
- **User Messages**: Displayed with user styling
- **Assistant Messages**: Formatted responses from the system
- **System Messages**: Informational messages
- **Error Messages**: Error notifications with retry options

### Action Buttons
- **Content Suggestions**: Clickable suggestions for content
- **Query Actions**: Buttons for quick actions (create, link, search)
- **Result Actions**: Actions specific to query results

## Styling

The ChatView uses CSS classes for styling:

```css
.mcp-bridge-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.mcp-chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.mcp-chat-input {
  border-top: 1px solid var(--background-modifier-border);
  padding: 10px;
}

.mcp-message {
  margin-bottom: 10px;
  padding: 8px 12px;
  border-radius: 8px;
}

.mcp-message-user {
  background-color: var(--interactive-accent);
  color: var(--text-on-accent);
  margin-left: 20%;
  text-align: right;
}

.mcp-message-assistant {
  background-color: var(--background-secondary);
  margin-right: 20%;
}

.mcp-message-error {
  background-color: var(--background-modifier-error);
  color: var(--text-error);
}
```

## Event Handling

The ChatView handles various user interactions:

### Input Events
- `keydown` on input field (Enter to send, Shift+Enter for new line)
- `input` events for real-time validation
- `paste` events for content processing

### Button Events
- Send button clicks
- Suggestion button clicks
- Action button clicks
- Result item clicks

### Custom Events
- `message-sent` - Fired when a message is sent
- `results-displayed` - Fired when results are displayed
- `error-occurred` - Fired when an error occurs

## Configuration

The ChatView can be configured through settings:

```typescript
{
  "chatView": {
    "enableSuggestions": true,
    "enableActions": true,
    "maxMessages": 100,
    "autoScroll": true,
    "enableKeyboardShortcuts": true,
    "theme": {
      "primary": "#007acc",
      "secondary": "#f0f0f0",
      "background": "#ffffff",
      "text": "#333333",
      "border": "#cccccc",
      "accent": "#007acc"
    }
  }
}
```

## Best Practices

1. **Message Formatting**: Use markdown for rich text formatting
2. **Error Handling**: Provide clear error messages with retry options
3. **Performance**: Limit message history to prevent memory issues
4. **Accessibility**: Ensure proper ARIA labels and keyboard navigation
5. **Responsive Design**: Adapt to different screen sizes

## Example Usage

```typescript
import { ChatView } from './ui/chat-view';

// Create and open chat view
const leaf = this.app.workspace.getLeaf();
const chatView = new ChatView(leaf, bridgeInterface, settings);
await leaf.setViewState({
  type: 'mcp-bridge-chat',
  active: true
});

// Send a message programmatically
await chatView.sendMessage('find my notes about machine learning');

// Display custom message
chatView.displayMessage({
  type: 'system',
  content: 'MCP Bridge is ready!',
  timestamp: new Date()
});

// Update settings
chatView.updateSettings(newSettings);
```

## Integration with Obsidian

The ChatView integrates seamlessly with Obsidian:

- **Workspace Integration**: Appears as a standard Obsidian view
- **Theme Support**: Respects Obsidian's theme system
- **Keyboard Shortcuts**: Uses Obsidian's hotkey system
- **Context Awareness**: Knows about current file and selection
- **Command Palette**: Accessible through Obsidian's command palette

## Performance Considerations

- **Message Limiting**: Automatically limits message history
- **Lazy Loading**: Loads older messages on demand
- **Debounced Input**: Prevents excessive processing
- **Efficient Rendering**: Uses document fragments for batch updates
- **Memory Management**: Cleans up event listeners on close