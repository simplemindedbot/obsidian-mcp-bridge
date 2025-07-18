# Advanced Integration Examples

This document provides advanced usage patterns and examples for extending the Obsidian MCP Bridge plugin and creating custom integrations.

## Custom MCP Server Integration

### Creating a Custom Server Adapter

```typescript
import { MCPConnection } from '../core/mcp-client';
import { CustomTransport } from '@modelcontextprotocol/sdk/client/custom';

class CustomMCPServer extends MCPConnection {
  private customTransport: CustomTransport;

  constructor(config: CustomServerConfig) {
    super(config);
    this.customTransport = new CustomTransport({
      // Custom transport configuration
      endpoint: config.endpoint,
      authentication: config.auth,
      compression: config.enableCompression
    });
  }

  async connect(): Promise<void> {
    try {
      await this.customTransport.connect();
      this.client = new Client(this.customTransport, {
        name: 'obsidian-mcp-bridge',
        version: '1.0.0'
      });
      
      await this.client.connect();
      this.status = 'connected';
      this.emit('connected');
    } catch (error) {
      this.status = 'error';
      this.emit('error', error);
      throw error;
    }
  }

  async callCustomTool(toolName: string, parameters: any): Promise<any> {
    if (this.status !== 'connected') {
      throw new Error('Server not connected');
    }

    // Add custom preprocessing
    const processedParams = this.preprocessParameters(parameters);
    
    const result = await this.client.callTool({
      name: toolName,
      arguments: processedParams
    });

    // Add custom postprocessing
    return this.postprocessResult(result);
  }

  private preprocessParameters(params: any): any {
    // Custom parameter preprocessing logic
    return {
      ...params,
      timestamp: Date.now(),
      source: 'obsidian-mcp-bridge'
    };
  }

  private postprocessResult(result: any): any {
    // Custom result postprocessing logic
    return {
      ...result,
      processed: true,
      processedAt: new Date().toISOString()
    };
  }
}
```

### Custom Knowledge Engine Extension

```typescript
import { KnowledgeEngine } from '../knowledge/knowledge-engine';
import { SemanticSearch } from './semantic-search';
import { VectorStore } from './vector-store';

class AdvancedKnowledgeEngine extends KnowledgeEngine {
  private semanticSearch: SemanticSearch;
  private vectorStore: VectorStore;

  constructor(app: App, mcpClient: MCPClient, settings: MCPBridgeSettings) {
    super(app, mcpClient, settings);
    this.semanticSearch = new SemanticSearch(settings.semanticSearch);
    this.vectorStore = new VectorStore(settings.vectorStore);
  }

  async discoverRelatedContentAdvanced(
    query: string,
    options: AdvancedDiscoveryOptions
  ): Promise<AdvancedDiscoveryResult> {
    const startTime = Date.now();

    // Parallel search across multiple dimensions
    const [
      keywordResults,
      semanticResults,
      vectorResults,
      mcpResults
    ] = await Promise.all([
      this.searchVaultKeywords(query, options),
      this.semanticSearch.search(query, options),
      this.vectorStore.search(query, options),
      this.searchMCPServers(query)
    ]);

    // Advanced result fusion
    const fusedResults = this.fuseSearchResults([
      keywordResults,
      semanticResults,
      vectorResults,
      mcpResults
    ], options);

    // Generate enhanced suggestions
    const suggestions = await this.generateEnhancedSuggestions(
      fusedResults,
      query,
      options
    );

    return {
      query,
      results: fusedResults,
      suggestions,
      metadata: {
        searchTime: Date.now() - startTime,
        algorithmUsed: 'advanced-fusion',
        confidence: this.calculateConfidence(fusedResults)
      }
    };
  }

  private fuseSearchResults(
    resultSets: SearchResult[][],
    options: AdvancedDiscoveryOptions
  ): SearchResult[] {
    // Implement advanced result fusion algorithm
    const fusedResults = new Map<string, SearchResult>();

    for (const resultSet of resultSets) {
      for (const result of resultSet) {
        const key = this.generateResultKey(result);
        
        if (fusedResults.has(key)) {
          // Merge results with score boosting
          const existing = fusedResults.get(key)!;
          existing.relevanceScore = this.combineScores(
            existing.relevanceScore,
            result.relevanceScore,
            options.fusionMethod
          );
          existing.sources.push(...result.sources);
        } else {
          fusedResults.set(key, result);
        }
      }
    }

    return Array.from(fusedResults.values())
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, options.maxResults);
  }

  async generateKnowledgeGraph(
    centerNode: string,
    depth: number = 2
  ): Promise<KnowledgeGraph> {
    const nodes = new Map<string, KnowledgeNode>();
    const edges = new Map<string, KnowledgeEdge>();

    // Build knowledge graph recursively
    await this.buildKnowledgeGraphRecursive(
      centerNode,
      depth,
      nodes,
      edges,
      new Set<string>()
    );

    return {
      nodes: Array.from(nodes.values()),
      edges: Array.from(edges.values()),
      centerNode,
      depth
    };
  }

  private async buildKnowledgeGraphRecursive(
    node: string,
    remainingDepth: number,
    nodes: Map<string, KnowledgeNode>,
    edges: Map<string, KnowledgeEdge>,
    visited: Set<string>
  ): Promise<void> {
    if (remainingDepth <= 0 || visited.has(node)) {
      return;
    }

    visited.add(node);

    // Find related content
    const relatedContent = await this.discoverRelatedContent(node);
    
    // Add node
    nodes.set(node, {
      id: node,
      label: node,
      type: this.inferNodeType(node),
      properties: await this.extractNodeProperties(node)
    });

    // Add edges and recurse
    for (const related of relatedContent.results) {
      const relatedId = this.generateNodeId(related);
      
      // Add edge
      const edgeId = `${node}->${relatedId}`;
      edges.set(edgeId, {
        id: edgeId,
        source: node,
        target: relatedId,
        weight: related.relevanceScore,
        type: this.inferEdgeType(node, relatedId)
      });

      // Recurse
      await this.buildKnowledgeGraphRecursive(
        relatedId,
        remainingDepth - 1,
        nodes,
        edges,
        visited
      );
    }
  }
}
```

## Custom UI Components

### Advanced Chat Interface

```typescript
import { ChatView } from '../ui/chat-view';
import { MarkdownRenderer } from 'obsidian';

class AdvancedChatView extends ChatView {
  private conversationHistory: ConversationHistory;
  private suggestionEngine: SuggestionEngine;
  private messageRenderer: AdvancedMessageRenderer;

  constructor(leaf: WorkspaceLeaf, bridgeInterface: BridgeInterface, settings: MCPBridgeSettings) {
    super(leaf, bridgeInterface, settings);
    this.conversationHistory = new ConversationHistory();
    this.suggestionEngine = new SuggestionEngine(settings);
    this.messageRenderer = new AdvancedMessageRenderer(this.app);
  }

  async onOpen(): Promise<void> {
    await super.onOpen();
    
    // Add advanced features
    this.addConversationSidebar();
    this.addKnowledgeGraphView();
    this.addRealTimeSuggestions();
    this.addVoiceInput();
  }

  private addConversationSidebar(): void {
    const sidebar = this.containerEl.createEl('div', {
      cls: 'mcp-chat-sidebar'
    });

    // Conversation history
    const historySection = sidebar.createEl('div', {
      cls: 'mcp-chat-history'
    });
    historySection.createEl('h3', { text: 'Conversation History' });
    
    this.conversationHistory.getRecentConversations().forEach(conv => {
      const historyItem = historySection.createEl('div', {
        cls: 'mcp-history-item',
        text: conv.summary
      });
      
      historyItem.onclick = () => this.loadConversation(conv.id);
    });

    // Active contexts
    const contextSection = sidebar.createEl('div', {
      cls: 'mcp-chat-contexts'
    });
    contextSection.createEl('h3', { text: 'Active Contexts' });
    
    this.displayActiveContexts(contextSection);
  }

  private addKnowledgeGraphView(): void {
    const graphContainer = this.containerEl.createEl('div', {
      cls: 'mcp-knowledge-graph'
    });

    // Initialize D3.js or similar for graph visualization
    this.initializeKnowledgeGraphVisualization(graphContainer);
  }

  private addRealTimeSuggestions(): void {
    const suggestionContainer = this.containerEl.createEl('div', {
      cls: 'mcp-realtime-suggestions'
    });

    // Listen for input changes
    this.inputElement.addEventListener('input', (event) => {
      const input = (event.target as HTMLInputElement).value;
      this.updateRealTimeSuggestions(input, suggestionContainer);
    });
  }

  private addVoiceInput(): void {
    if (!('webkitSpeechRecognition' in window)) {
      return; // Speech recognition not supported
    }

    const voiceButton = this.containerEl.createEl('button', {
      cls: 'mcp-voice-input-btn',
      text: '🎤'
    });

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      this.inputElement.value = transcript;
      this.inputElement.dispatchEvent(new Event('input'));
    };

    voiceButton.onclick = () => {
      recognition.start();
    };
  }

  async displayMessageAdvanced(message: ChatMessage): Promise<void> {
    const messageEl = this.messagesContainer.createEl('div', {
      cls: `mcp-message mcp-message-${message.type}`
    });

    // Add timestamp
    const timestampEl = messageEl.createEl('div', {
      cls: 'mcp-message-timestamp',
      text: this.formatTimestamp(message.timestamp)
    });

    // Add content with advanced rendering
    const contentEl = messageEl.createEl('div', {
      cls: 'mcp-message-content'
    });

    await this.messageRenderer.render(message, contentEl);

    // Add interactive elements
    if (message.type === 'assistant') {
      this.addMessageActions(messageEl, message);
    }

    this.scrollToBottom();
  }

  private addMessageActions(messageEl: HTMLElement, message: ChatMessage): void {
    const actionsEl = messageEl.createEl('div', {
      cls: 'mcp-message-actions'
    });

    // Copy to clipboard
    actionsEl.createEl('button', {
      cls: 'mcp-action-btn',
      text: '📋'
    }).onclick = () => navigator.clipboard.writeText(message.content);

    // Insert into current note
    actionsEl.createEl('button', {
      cls: 'mcp-action-btn',
      text: '📝'
    }).onclick = () => this.insertIntoCurrentNote(message.content);

    // Create new note
    actionsEl.createEl('button', {
      cls: 'mcp-action-btn',
      text: '📄'
    }).onclick = () => this.createNoteFromMessage(message);

    // Rate response
    const ratingEl = actionsEl.createEl('div', {
      cls: 'mcp-rating'
    });
    
    ['👍', '👎'].forEach(emoji => {
      ratingEl.createEl('button', {
        cls: 'mcp-rating-btn',
        text: emoji
      }).onclick = () => this.rateMessage(message, emoji === '👍');
    });
  }
}
```

### Custom Settings Panel

```typescript
import { SettingsTab } from '../ui/settings-tab';
import { ColorPicker } from './color-picker';
import { HotkeysManager } from './hotkeys-manager';

class AdvancedSettingsTab extends SettingsTab {
  private colorPicker: ColorPicker;
  private hotkeysManager: HotkeysManager;

  constructor(app: App, plugin: MCPBridgePlugin) {
    super(app, plugin);
    this.colorPicker = new ColorPicker();
    this.hotkeysManager = new HotkeysManager(app);
  }

  display(): void {
    super.display();
    
    // Add advanced settings sections
    this.addPerformanceSettings();
    this.addSecuritySettings();
    this.addExperimentalSettings();
    this.addIntegrationSettings();
  }

  private addPerformanceSettings(): void {
    const section = this.containerEl.createEl('div', {
      cls: 'mcp-settings-section'
    });

    section.createEl('h2', { text: 'Performance Settings' });

    // Memory usage monitor
    const memorySection = section.createEl('div', {
      cls: 'mcp-memory-monitor'
    });
    this.displayMemoryUsage(memorySection);

    // Connection pool settings
    new Setting(section)
      .setName('Max concurrent connections')
      .setDesc('Maximum number of concurrent MCP connections')
      .addSlider(slider => slider
        .setLimits(1, 20, 1)
        .setValue(this.plugin.settings.advanced.performance.maxConcurrentRequests)
        .onChange(async (value) => {
          this.plugin.settings.advanced.performance.maxConcurrentRequests = value;
          await this.plugin.saveSettings();
        }));

    // Request batching
    new Setting(section)
      .setName('Request batch size')
      .setDesc('Number of requests to batch together')
      .addSlider(slider => slider
        .setLimits(1, 10, 1)
        .setValue(this.plugin.settings.advanced.performance.requestBatchSize)
        .onChange(async (value) => {
          this.plugin.settings.advanced.performance.requestBatchSize = value;
          await this.plugin.saveSettings();
        }));
  }

  private addSecuritySettings(): void {
    const section = this.containerEl.createEl('div', {
      cls: 'mcp-settings-section'
    });

    section.createEl('h2', { text: 'Security Settings' });

    // Safe mode
    new Setting(section)
      .setName('Enable safe mode')
      .setDesc('Restricts plugin to only safe operations')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.advanced.security.enableSafeMode)
        .onChange(async (value) => {
          this.plugin.settings.advanced.security.enableSafeMode = value;
          await this.plugin.saveSettings();
        }));

    // Allowed hosts
    new Setting(section)
      .setName('Allowed hosts')
      .setDesc('Whitelist of allowed hosts for connections')
      .addTextArea(text => text
        .setPlaceholder('localhost\nexample.com')
        .setValue(this.plugin.settings.advanced.security.allowedHosts.join('\n'))
        .onChange(async (value) => {
          this.plugin.settings.advanced.security.allowedHosts = 
            value.split('\n').filter(host => host.trim());
          await this.plugin.saveSettings();
        }));

    // Rate limiting
    new Setting(section)
      .setName('Enable rate limiting')
      .setDesc('Limits the number of requests per time window')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.advanced.security.enableRateLimiting)
        .onChange(async (value) => {
          this.plugin.settings.advanced.security.enableRateLimiting = value;
          await this.plugin.saveSettings();
        }));
  }

  private addExperimentalSettings(): void {
    const section = this.containerEl.createEl('div', {
      cls: 'mcp-settings-section'
    });

    section.createEl('h2', { text: 'Experimental Features' });

    // Beta features toggle
    new Setting(section)
      .setName('Enable beta features')
      .setDesc('Enables experimental features (may be unstable)')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.advanced.experimental.enableBetaFeatures)
        .onChange(async (value) => {
          this.plugin.settings.advanced.experimental.enableBetaFeatures = value;
          await this.plugin.saveSettings();
        }));

    // Individual feature toggles
    const features = [
      { key: 'knowledgeGraph', name: 'Knowledge Graph', desc: 'Visual knowledge graph interface' },
      { key: 'aiAssistant', name: 'AI Assistant', desc: 'Enhanced AI-powered assistance' },
      { key: 'advancedSearch', name: 'Advanced Search', desc: 'Semantic and vector search' }
    ];

    features.forEach(feature => {
      new Setting(section)
        .setName(feature.name)
        .setDesc(feature.desc)
        .addToggle(toggle => toggle
          .setValue(this.plugin.settings.advanced.experimental.features[feature.key] || false)
          .onChange(async (value) => {
            this.plugin.settings.advanced.experimental.features[feature.key] = value;
            await this.plugin.saveSettings();
          }));
    });
  }

  private addIntegrationSettings(): void {
    const section = this.containerEl.createEl('div', {
      cls: 'mcp-settings-section'
    });

    section.createEl('h2', { text: 'Integration Settings' });

    // Plugin integrations
    const plugins = this.getInstalledPlugins();
    plugins.forEach(plugin => {
      if (this.isCompatiblePlugin(plugin)) {
        new Setting(section)
          .setName(`${plugin.name} integration`)
          .setDesc(`Enable integration with ${plugin.name}`)
          .addToggle(toggle => toggle
            .setValue(this.plugin.settings.integrations?.[plugin.id] || false)
            .onChange(async (value) => {
              if (!this.plugin.settings.integrations) {
                this.plugin.settings.integrations = {};
              }
              this.plugin.settings.integrations[plugin.id] = value;
              await this.plugin.saveSettings();
            }));
      }
    });

    // External tool integrations
    this.addExternalToolSettings(section);
  }

  private displayMemoryUsage(container: HTMLElement): void {
    const updateMemoryUsage = () => {
      const memoryUsage = this.getMemoryUsage();
      container.innerHTML = `
        <div class="mcp-memory-usage">
          <div class="mcp-memory-bar">
            <div class="mcp-memory-used" style="width: ${memoryUsage.percentage}%"></div>
          </div>
          <div class="mcp-memory-text">
            ${memoryUsage.used} / ${memoryUsage.total} MB (${memoryUsage.percentage}%)
          </div>
        </div>
      `;
    };

    updateMemoryUsage();
    setInterval(updateMemoryUsage, 5000); // Update every 5 seconds
  }

  private getMemoryUsage(): { used: number; total: number; percentage: number } {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const used = Math.round(memory.usedJSHeapSize / 1024 / 1024);
      const total = Math.round(memory.totalJSHeapSize / 1024 / 1024);
      const percentage = Math.round((used / total) * 100);
      return { used, total, percentage };
    }
    return { used: 0, total: 0, percentage: 0 };
  }
}
```

## Advanced Search Algorithms

### Semantic Search Implementation

```typescript
import { TfIdf } from 'natural';
import { cosineSimilarity } from 'ml-distance';

class SemanticSearch {
  private tfidf: TfIdf;
  private vectorizer: TextVectorizer;
  private embeddings: Map<string, number[]>;

  constructor(settings: SemanticSearchSettings) {
    this.tfidf = new TfIdf();
    this.vectorizer = new TextVectorizer(settings);
    this.embeddings = new Map();
  }

  async buildIndex(documents: Document[]): Promise<void> {
    // Build TF-IDF index
    documents.forEach(doc => {
      this.tfidf.addDocument(doc.content);
    });

    // Build vector embeddings
    for (const doc of documents) {
      const embedding = await this.vectorizer.vectorize(doc.content);
      this.embeddings.set(doc.id, embedding);
    }
  }

  async search(query: string, options: SearchOptions): Promise<SearchResult[]> {
    const queryVector = await this.vectorizer.vectorize(query);
    const results: SearchResult[] = [];

    // TF-IDF search
    const tfidfResults = this.searchTfIdf(query, options);
    
    // Vector similarity search
    const vectorResults = this.searchVector(queryVector, options);

    // Combine results
    const combinedResults = this.combineResults(tfidfResults, vectorResults, options);

    return combinedResults
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, options.maxResults);
  }

  private searchTfIdf(query: string, options: SearchOptions): SearchResult[] {
    const results: SearchResult[] = [];
    
    this.tfidf.tfidfs(query, (i, measure) => {
      if (measure > options.threshold) {
        results.push({
          docId: i.toString(),
          relevanceScore: measure,
          method: 'tfidf'
        });
      }
    });

    return results;
  }

  private searchVector(queryVector: number[], options: SearchOptions): SearchResult[] {
    const results: SearchResult[] = [];

    for (const [docId, docVector] of this.embeddings) {
      const similarity = cosineSimilarity(queryVector, docVector);
      
      if (similarity > options.threshold) {
        results.push({
          docId,
          relevanceScore: similarity,
          method: 'vector'
        });
      }
    }

    return results;
  }

  private combineResults(
    tfidfResults: SearchResult[],
    vectorResults: SearchResult[],
    options: SearchOptions
  ): SearchResult[] {
    const combinedMap = new Map<string, SearchResult>();

    // Add TF-IDF results
    tfidfResults.forEach(result => {
      combinedMap.set(result.docId, {
        ...result,
        tfidfScore: result.relevanceScore,
        vectorScore: 0
      });
    });

    // Add vector results
    vectorResults.forEach(result => {
      if (combinedMap.has(result.docId)) {
        const existing = combinedMap.get(result.docId)!;
        existing.vectorScore = result.relevanceScore;
        existing.relevanceScore = this.combineScores(
          existing.tfidfScore,
          result.relevanceScore,
          options.fusionMethod
        );
      } else {
        combinedMap.set(result.docId, {
          ...result,
          tfidfScore: 0,
          vectorScore: result.relevanceScore
        });
      }
    });

    return Array.from(combinedMap.values());
  }

  private combineScores(
    tfidfScore: number,
    vectorScore: number,
    method: 'average' | 'weighted' | 'max'
  ): number {
    switch (method) {
      case 'average':
        return (tfidfScore + vectorScore) / 2;
      case 'weighted':
        return (tfidfScore * 0.3) + (vectorScore * 0.7);
      case 'max':
        return Math.max(tfidfScore, vectorScore);
      default:
        return (tfidfScore + vectorScore) / 2;
    }
  }
}
```

## Custom Plugin Extensions

### Plugin SDK

```typescript
// SDK for creating MCP Bridge extensions
export class MCPBridgeExtension {
  protected plugin: MCPBridgePlugin;
  protected app: App;
  protected settings: any;

  constructor(plugin: MCPBridgePlugin) {
    this.plugin = plugin;
    this.app = plugin.app;
    this.settings = plugin.settings;
  }

  // Override these methods in your extension
  async onLoad(): Promise<void> {}
  async onUnload(): Promise<void> {}
  async onSettingsChanged(settings: any): Promise<void> {}

  // Utility methods for extensions
  protected registerCommand(command: Command): void {
    this.plugin.addCommand(command);
  }

  protected registerView(viewType: string, viewCreator: ViewCreator): void {
    this.plugin.registerView(viewType, viewCreator);
  }

  protected addSettingsTab(tab: PluginSettingTab): void {
    this.plugin.addSettingTab(tab);
  }

  protected getKnowledgeEngine(): KnowledgeEngine {
    return this.plugin.knowledgeEngine;
  }

  protected getMCPClient(): MCPClient {
    return this.plugin.mcpClient;
  }

  protected getBridgeInterface(): BridgeInterface {
    return this.plugin.bridgeInterface;
  }
}

// Example extension
export class AIAssistantExtension extends MCPBridgeExtension {
  private aiModel: AIModel;
  private conversationManager: ConversationManager;

  async onLoad(): Promise<void> {
    this.aiModel = new AIModel(this.settings.aiAssistant);
    this.conversationManager = new ConversationManager();

    // Register AI assistant commands
    this.registerCommand({
      id: 'ai-assistant-chat',
      name: 'Open AI Assistant',
      callback: () => this.openAIAssistant()
    });

    this.registerCommand({
      id: 'ai-assistant-analyze',
      name: 'Analyze Current Note',
      callback: () => this.analyzeCurrentNote()
    });

    // Register AI assistant view
    this.registerView('ai-assistant', (leaf) => 
      new AIAssistantView(leaf, this.aiModel, this.conversationManager)
    );
  }

  private async openAIAssistant(): Promise<void> {
    const leaf = this.app.workspace.getLeaf();
    await leaf.setViewState({
      type: 'ai-assistant',
      active: true
    });
  }

  private async analyzeCurrentNote(): Promise<void> {
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) return;

    const content = await this.app.vault.read(activeFile);
    const analysis = await this.aiModel.analyzeContent(content);
    
    // Display analysis results
    new Notice(`Analysis complete: ${analysis.summary}`);
  }
}
```

## Performance Optimization

### Connection Pooling

```typescript
class MCPConnectionPool {
  private pools: Map<string, ConnectionPool>;
  private maxPoolSize: number;
  private idleTimeout: number;

  constructor(maxPoolSize: number = 5, idleTimeout: number = 300000) {
    this.pools = new Map();
    this.maxPoolSize = maxPoolSize;
    this.idleTimeout = idleTimeout;
  }

  async getConnection(serverId: string): Promise<MCPConnection> {
    let pool = this.pools.get(serverId);
    
    if (!pool) {
      pool = new ConnectionPool(serverId, this.maxPoolSize, this.idleTimeout);
      this.pools.set(serverId, pool);
    }

    return pool.getConnection();
  }

  async releaseConnection(serverId: string, connection: MCPConnection): Promise<void> {
    const pool = this.pools.get(serverId);
    if (pool) {
      await pool.releaseConnection(connection);
    }
  }

  async closeAllPools(): Promise<void> {
    for (const pool of this.pools.values()) {
      await pool.close();
    }
    this.pools.clear();
  }
}

class ConnectionPool {
  private serverId: string;
  private maxSize: number;
  private idleTimeout: number;
  private activeConnections: Set<MCPConnection>;
  private idleConnections: MCPConnection[];
  private waitingQueue: Array<{
    resolve: (connection: MCPConnection) => void;
    reject: (error: Error) => void;
  }>;

  constructor(serverId: string, maxSize: number, idleTimeout: number) {
    this.serverId = serverId;
    this.maxSize = maxSize;
    this.idleTimeout = idleTimeout;
    this.activeConnections = new Set();
    this.idleConnections = [];
    this.waitingQueue = [];
  }

  async getConnection(): Promise<MCPConnection> {
    // Try to get an idle connection
    const idleConnection = this.idleConnections.pop();
    if (idleConnection && idleConnection.isHealthy()) {
      this.activeConnections.add(idleConnection);
      return idleConnection;
    }

    // Create new connection if under limit
    if (this.activeConnections.size < this.maxSize) {
      const connection = await this.createConnection();
      this.activeConnections.add(connection);
      return connection;
    }

    // Wait for connection to become available
    return new Promise((resolve, reject) => {
      this.waitingQueue.push({ resolve, reject });
    });
  }

  async releaseConnection(connection: MCPConnection): Promise<void> {
    this.activeConnections.delete(connection);

    // Serve waiting requests first
    if (this.waitingQueue.length > 0) {
      const { resolve } = this.waitingQueue.shift()!;
      this.activeConnections.add(connection);
      resolve(connection);
      return;
    }

    // Add to idle pool
    this.idleConnections.push(connection);
    
    // Set idle timeout
    setTimeout(() => {
      const index = this.idleConnections.indexOf(connection);
      if (index !== -1) {
        this.idleConnections.splice(index, 1);
        connection.disconnect();
      }
    }, this.idleTimeout);
  }

  private async createConnection(): Promise<MCPConnection> {
    const serverConfig = this.getServerConfig(this.serverId);
    const connection = new MCPConnection(serverConfig);
    await connection.connect();
    return connection;
  }

  async close(): Promise<void> {
    // Close all active connections
    for (const connection of this.activeConnections) {
      await connection.disconnect();
    }

    // Close all idle connections
    for (const connection of this.idleConnections) {
      await connection.disconnect();
    }

    // Reject all waiting requests
    this.waitingQueue.forEach(({ reject }) => {
      reject(new Error('Connection pool closed'));
    });

    this.activeConnections.clear();
    this.idleConnections.length = 0;
    this.waitingQueue.length = 0;
  }
}
```

## Testing Advanced Features

### Integration Tests

```typescript
describe('Advanced MCP Bridge Integration', () => {
  let plugin: MCPBridgePlugin;
  let testApp: App;
  let mockVault: MockVault;

  beforeEach(async () => {
    testApp = new MockApp();
    mockVault = new MockVault();
    plugin = new MCPBridgePlugin(testApp, mockVault);
    
    // Setup test environment
    await plugin.onload();
  });

  afterEach(async () => {
    await plugin.onunload();
  });

  describe('Advanced Knowledge Discovery', () => {
    it('should perform semantic search', async () => {
      // Setup semantic search with test data
      const engine = plugin.knowledgeEngine as AdvancedKnowledgeEngine;
      await engine.buildSemanticIndex([
        { id: '1', content: 'Machine learning algorithms and neural networks' },
        { id: '2', content: 'Deep learning and artificial intelligence' },
        { id: '3', content: 'Data science and statistical analysis' }
      ]);

      const results = await engine.discoverRelatedContentAdvanced(
        'AI and neural networks',
        { searchType: 'semantic', maxResults: 10 }
      );

      expect(results.results).toHaveLength(2);
      expect(results.results[0].relevanceScore).toBeGreaterThan(0.7);
    });

    it('should generate knowledge graph', async () => {
      const engine = plugin.knowledgeEngine as AdvancedKnowledgeEngine;
      
      const graph = await engine.generateKnowledgeGraph('machine learning', 2);
      
      expect(graph.nodes.length).toBeGreaterThan(0);
      expect(graph.edges.length).toBeGreaterThan(0);
      expect(graph.centerNode).toBe('machine learning');
    });
  });

  describe('Custom MCP Server Integration', () => {
    it('should connect to custom server', async () => {
      const customServer = new CustomMCPServer({
        name: 'Test Custom Server',
        type: 'custom',
        endpoint: 'http://localhost:3000/mcp',
        auth: { token: 'test-token' }
      });

      await customServer.connect();
      expect(customServer.status).toBe('connected');

      const result = await customServer.callCustomTool('test-tool', { param: 'value' });
      expect(result.processed).toBe(true);
    });
  });

  describe('Performance Optimization', () => {
    it('should use connection pooling', async () => {
      const pool = new MCPConnectionPool(3, 10000);
      
      // Get multiple connections
      const conn1 = await pool.getConnection('test-server');
      const conn2 = await pool.getConnection('test-server');
      const conn3 = await pool.getConnection('test-server');

      expect(conn1).toBeDefined();
      expect(conn2).toBeDefined();
      expect(conn3).toBeDefined();

      // Release connections
      await pool.releaseConnection('test-server', conn1);
      await pool.releaseConnection('test-server', conn2);
      await pool.releaseConnection('test-server', conn3);

      await pool.closeAllPools();
    });

    it('should handle concurrent requests efficiently', async () => {
      const startTime = Date.now();
      
      // Make multiple concurrent requests
      const promises = Array.from({ length: 10 }, (_, i) => 
        plugin.bridgeInterface.processQuery(`test query ${i}`)
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(results).toHaveLength(10);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});
```

This advanced integration guide provides comprehensive examples for extending the MCP Bridge plugin with custom functionality, advanced algorithms, and performance optimizations. These patterns can be adapted and extended based on specific requirements.