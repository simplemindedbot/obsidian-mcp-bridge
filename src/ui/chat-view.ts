import { ItemView, WorkspaceLeaf } from "obsidian";
import { BridgeInterface } from "@/bridge/bridge-interface";
import { ChatMessage } from "@/types/settings";

export const CHAT_VIEW_TYPE = "mcp-bridge-chat";

export class ChatView extends ItemView {
  private bridgeInterface: BridgeInterface;
  private chatContainer!: HTMLElement;
  private inputContainer!: HTMLElement;
  private chatInput!: HTMLInputElement;
  private sendButton!: HTMLButtonElement;
  private messages: ChatMessage[] = [];
  private contextMode: "none" | "currentNote" | "selection" = "none";

  constructor(leaf: WorkspaceLeaf, bridgeInterface: BridgeInterface) {
    super(leaf);
    this.bridgeInterface = bridgeInterface;
  }

  getViewType(): string {
    return CHAT_VIEW_TYPE;
  }

  getDisplayText(): string {
    return "MCP Bridge Chat";
  }

  getIcon(): string {
    return "message-circle";
  }

  async onOpen(): Promise<void> {
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass("mcp-bridge-chat-view");

    // Create chat header
    const header = container.createEl("div", { cls: "mcp-bridge-chat-header" });
    header.createEl("h3", { text: "MCP Bridge Chat" });

    // Create context controls
    const contextControls = container.createEl("div", { cls: "mcp-bridge-context-controls" });
    
    // Context status display
    const contextStatus = contextControls.createEl("div", { cls: "mcp-bridge-context-status" });
    this.updateContextStatus(contextStatus);
    
    // Context action buttons
    const contextActions = contextControls.createEl("div", { cls: "mcp-bridge-context-actions" });
    
    const useCurrentNoteBtn = contextActions.createEl("button", {
      text: "📄 Use Current Note",
      cls: "mcp-bridge-context-btn",
      title: "Include current note as context for queries"
    });
    
    const useSelectionBtn = contextActions.createEl("button", {
      text: "✂️ Use Selection",
      cls: "mcp-bridge-context-btn",
      title: "Include selected text as context for queries"
    });
    
    const clearContextBtn = contextActions.createEl("button", {
      text: "🗑️ Clear Context",
      cls: "mcp-bridge-context-btn mcp-bridge-context-btn-secondary",
      title: "Clear all context"
    });

    // Add event listeners for context buttons
    useCurrentNoteBtn.addEventListener("click", () => {
      this.setContextMode("currentNote");
      this.updateContextStatus(contextStatus);
    });

    useSelectionBtn.addEventListener("click", () => {
      this.setContextMode("selection");
      this.updateContextStatus(contextStatus);
    });

    clearContextBtn.addEventListener("click", () => {
      this.setContextMode("none");
      this.updateContextStatus(contextStatus);
    });

    // Create chat container
    this.chatContainer = container.createEl("div", {
      cls: "mcp-bridge-chat-container",
    });

    // Create input container
    this.inputContainer = container.createEl("div", {
      cls: "mcp-bridge-input-container",
    });

    this.chatInput = this.inputContainer.createEl("input", {
      type: "text",
      placeholder: "Ask me anything about your knowledge...",
      cls: "mcp-bridge-chat-input",
    });

    this.sendButton = this.inputContainer.createEl("button", {
      text: "Send",
      cls: "mcp-bridge-send-button",
    });

    // Add event listeners
    this.chatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    this.sendButton.addEventListener("click", () => {
      this.sendMessage();
    });

    // Add welcome message
    this.addMessage({
      id: "welcome",
      role: "assistant",
      content:
        'Hello! I\'m your MCP Bridge assistant. I can help you search your vault, discover related content, and answer questions using connected MCP servers.\n\n🔍 **Vault Search Examples:**\n- "Find my notes about machine learning"\n- "Search my vault for TypeScript"\n- "What have I written about distributed systems?"\n\n🕸️ **Note Connection Analysis:**\n- "Connect notes on artificial intelligence"\n- "Connect ideas about project management"\n- "Show connections between my React notes"\n\n🧠 **Knowledge Discovery:**\n- "Discover related content about this topic"\n- "Find patterns in my knowledge base"\n\n💡 **Tip:** Install the Omnisearch plugin for enhanced search with OCR and semantic capabilities!',
      timestamp: new Date(),
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
      role: "user",
      content: query,
      timestamp: new Date(),
    };

    this.addMessage(userMessage);
    this.chatInput.value = "";

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
        role: "assistant",
        content: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        timestamp: new Date(),
      });
    }
  }

  private addMessage(message: ChatMessage): void {
    this.messages.push(message);

    const messageEl = this.chatContainer.createEl("div", {
      cls: `mcp-bridge-message mcp-bridge-message-${message.role}`,
    });

    const contentEl = messageEl.createEl("div", {
      cls: "mcp-bridge-message-content",
    });

    // Simple markdown rendering (can be enhanced)
    contentEl.innerHTML = this.renderMarkdown(message.content);

    const metaEl = messageEl.createEl("div", {
      cls: "mcp-bridge-message-meta",
    });
    metaEl.createEl("span", {
      text: message.timestamp.toLocaleTimeString(),
      cls: "mcp-bridge-message-time",
    });

    if (message.metadata?.processingTime) {
      metaEl.createEl("span", {
        text: ` (${message.metadata.processingTime}ms)`,
        cls: "mcp-bridge-processing-time",
      });
    }

    // Scroll to bottom
    this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
  }

  private showTypingIndicator(): void {
    const indicator = this.chatContainer.createEl("div", {
      cls: "mcp-bridge-typing-indicator",
    });
    indicator.createEl("span", { text: "Assistant is thinking..." });
  }

  private hideTypingIndicator(): void {
    const indicator = this.chatContainer.querySelector(
      ".mcp-bridge-typing-indicator",
    );
    if (indicator) {
      indicator.remove();
    }
  }

  private renderMarkdown(content: string): string {
    // Simple markdown rendering - can be enhanced with a proper markdown parser
    return content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`(.*?)`/g, "<code>$1</code>")
      .replace(/\n/g, "<br>");
  }

  private setContextMode(mode: "none" | "currentNote" | "selection"): void {
    this.contextMode = mode;
  }

  private updateContextStatus(statusEl: HTMLElement): void {
    statusEl.empty();
    
    const statusIcon = statusEl.createEl("span", { cls: "mcp-bridge-context-icon" });
    const statusText = statusEl.createEl("span", { cls: "mcp-bridge-context-text" });
    
    switch (this.contextMode) {
      case "currentNote": {
        const noteContext = this.bridgeInterface.getCurrentNoteContext();
        if (noteContext) {
          statusIcon.textContent = "📄";
          statusText.textContent = `Using current note: ${noteContext.title}`;
          statusEl.addClass("mcp-bridge-context-active");
        } else {
          statusIcon.textContent = "❌";
          statusText.textContent = "No active note found";
          statusEl.addClass("mcp-bridge-context-error");
        }
        break;
      }
        
      case "selection": {
        const selectedText = this.bridgeInterface.getSelectedText();
        if (selectedText) {
          statusIcon.textContent = "✂️";
          const preview = selectedText.length > 50 
            ? selectedText.substring(0, 50) + "..." 
            : selectedText;
          statusText.textContent = `Using selection: "${preview}"`;
          statusEl.addClass("mcp-bridge-context-active");
        } else {
          statusIcon.textContent = "❌";
          statusText.textContent = "No text selected";
          statusEl.addClass("mcp-bridge-context-error");
        }
        break;
      }
        
      case "none":
      default:
        statusIcon.textContent = "🔄";
        statusText.textContent = "Auto-detecting context";
        statusEl.addClass("mcp-bridge-context-auto");
        break;
    }
  }
}
