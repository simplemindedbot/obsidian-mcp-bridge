import { ItemView, WorkspaceLeaf } from 'obsidian';
import { BridgeInterface } from '@/bridge/bridge-interface';
import { ChatMessage } from '@/types/settings';

export const CHAT_VIEW_TYPE = 'mcp-bridge-chat';

export class ChatView extends ItemView {
  private bridgeInterface: BridgeInterface;
  private chatContainer!: HTMLElement;
  private inputContainer!: HTMLElement;
  private chatInput!: HTMLInputElement;
  private sendButton!: HTMLButtonElement;
  private messages: ChatMessage[] = [];

  constructor(leaf: WorkspaceLeaf, bridgeInterface: BridgeInterface) {
    super(leaf);
    this.bridgeInterface = bridgeInterface;
  }

  getViewType(): string {
    return CHAT_VIEW_TYPE;
  }

  getDisplayText(): string {
    return 'MCP Bridge Chat';
  }

  getIcon(): string {
    return 'message-circle';
  }

  async onOpen(): Promise<void> {
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass('mcp-bridge-chat-view');

    // Create chat header
    const header = container.createEl('div', { cls: 'mcp-bridge-chat-header' });
    header.createEl('h3', { text: 'MCP Bridge Chat' });

    // Create chat container
    this.chatContainer = container.createEl('div', { cls: 'mcp-bridge-chat-container' });

    // Create input container
    this.inputContainer = container.createEl('div', { cls: 'mcp-bridge-input-container' });
    
    this.chatInput = this.inputContainer.createEl('input', {
      type: 'text',
      placeholder: 'Ask me anything about your knowledge...',
      cls: 'mcp-bridge-chat-input'
    });

    this.sendButton = this.inputContainer.createEl('button', {
      text: 'Send',
      cls: 'mcp-bridge-send-button'
    });

    // Add event listeners
    this.chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    this.sendButton.addEventListener('click', () => {
      this.sendMessage();
    });

    // Add welcome message
    this.addMessage({
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I\'m your MCP Bridge assistant. I can help you search your vault, discover related content, and answer questions using connected MCP servers.\n\nTry asking:\n- "Find my notes about machine learning"\n- "What have I written about this topic?"\n- "Discover related content about distributed systems"',
      timestamp: new Date()
    });
  }

  async onClose(): Promise<void> {
    // Cleanup if needed
  }

  private async sendMessage(): Promise<void> {
    const query = this.chatInput.value.trim();
    if (!query) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Math.random().toString(36),
      role: 'user',
      content: query,
      timestamp: new Date()
    };

    this.addMessage(userMessage);
    this.chatInput.value = '';

    // Show typing indicator
    this.showTypingIndicator();

    try {
      // Process query through bridge interface
      const response = await this.bridgeInterface.processQuery(query);
      this.hideTypingIndicator();
      this.addMessage(response);
    } catch (error) {
      this.hideTypingIndicator();
      this.addMessage({
        id: Math.random().toString(36),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      });
    }
  }

  private addMessage(message: ChatMessage): void {
    this.messages.push(message);

    const messageEl = this.chatContainer.createEl('div', {
      cls: `mcp-bridge-message mcp-bridge-message-${message.role}`
    });

    const contentEl = messageEl.createEl('div', { cls: 'mcp-bridge-message-content' });
    
    // Simple markdown rendering (can be enhanced)
    contentEl.innerHTML = this.renderMarkdown(message.content);

    const metaEl = messageEl.createEl('div', { cls: 'mcp-bridge-message-meta' });
    metaEl.createEl('span', { 
      text: message.timestamp.toLocaleTimeString(),
      cls: 'mcp-bridge-message-time'
    });

    if (message.metadata?.processingTime) {
      metaEl.createEl('span', {
        text: ` (${message.metadata.processingTime}ms)`,
        cls: 'mcp-bridge-processing-time'
      });
    }

    // Scroll to bottom
    this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
  }

  private showTypingIndicator(): void {
    const indicator = this.chatContainer.createEl('div', {
      cls: 'mcp-bridge-typing-indicator'
    });
    indicator.createEl('span', { text: 'Assistant is thinking...' });
  }

  private hideTypingIndicator(): void {
    const indicator = this.chatContainer.querySelector('.mcp-bridge-typing-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  private renderMarkdown(content: string): string {
    // Simple markdown rendering - can be enhanced with a proper markdown parser
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }
}
