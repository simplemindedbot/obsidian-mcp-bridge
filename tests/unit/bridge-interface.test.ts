import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BridgeInterface } from '@/bridge/bridge-interface';
import { MCPClient } from '@/core/mcp-client';
import { KnowledgeEngine } from '@/knowledge/knowledge-engine';
import { initializeLogger } from '@/utils/logger';

// Mock dependencies
vi.mock('@/utils/logger', async () => {
  const actual = await vi.importActual('@/utils/logger');
  return {
    ...actual,
    initializeLogger: vi.fn(),
    getLogger: vi.fn().mockReturnValue({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    }),
  };
});

vi.mock('@/core/llm-router', () => {
  return {
    LLMQueryRouter: vi.fn().mockImplementation(() => {
      return {
        analyzeQuery: vi.fn(),
      };
    }),
  };
});

// Mock obsidian module
vi.mock('obsidian', () => ({
  App: vi.fn(),
  MarkdownView: vi.fn(),
}));

// Mock Obsidian App
const mockApp = {
  workspace: {
    getActiveViewOfType: vi.fn(),
  },
  vault: {
    create: vi.fn(),
  },
} as any;

describe('BridgeInterface', () => {
  let bridgeInterface: BridgeInterface;
  let mockMCPClient: any;
  let mockKnowledgeEngine: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    initializeLogger({
      appName: "MCP Bridge Test",
      logLevel: "silent",
      enableConsoleLogging: false,
      enableFileLogging: false,
    });
    // Create mock instances
    mockMCPClient = new (vi.fn(() => ({
      searchAcrossServers: vi.fn(),
      callTool: vi.fn(),
      getConnectedServers: vi.fn().mockReturnValue(['test-server']),
    })))();

    mockKnowledgeEngine = new (vi.fn(() => ({
      discoverRelatedContent: vi.fn(),
    })))();

    bridgeInterface = new BridgeInterface(mockApp, mockMCPClient, mockKnowledgeEngine, { provider: 'openai', apiKey: 'test-key' });
  });

  describe('processQuery', () => {
    it('should process search queries', async () => {
      // Mock search results
      const llmRouter = bridgeInterface['llmRouter']!;
      (llmRouter.analyzeQuery as any).mockResolvedValue({
        confidence: 0.9,
        selectedServer: 'test-server',
        selectedTool: 'search',
        parameters: { query: 'test documents' },
        reasoning: 'test reasoning',
      });
      mockMCPClient.callTool.mockResolvedValue({
        result: {
          content: [
            { type: 'text', text: 'Test Result' },
            { type: 'text', text: 'Another Result' },
          ],
        },
      });

      const result = await bridgeInterface.processQuery('find test documents');

      expect(llmRouter.analyzeQuery).toHaveBeenCalledWith('find test documents');
      expect(mockMCPClient.callTool).toHaveBeenCalledWith('test-server', 'search', { query: 'test documents' });
      expect(result.role).toBe('assistant');
      expect(result.content).toContain('Test Result');
      expect(result.content).toContain('Another Result');
    });

    it('should process knowledge discovery queries', async () => {
      // Mock knowledge discovery results
      const llmRouter = bridgeInterface['llmRouter']!;
      (llmRouter.analyzeQuery as any).mockResolvedValue({
        confidence: 0.9,
        selectedServer: 'test-server',
        selectedTool: 'knowledge-discovery',
        parameters: { query: 'discover related content about AI' },
        reasoning: 'test reasoning',
      });
      mockKnowledgeEngine.discoverRelatedContent.mockResolvedValue([
        { 
          title: 'Related Note', 
          content: 'Related content', 
          source: 'vault',
          relevanceScore: 0.8,
        },
      ]);

      const result = await bridgeInterface.processQuery('discover related content about AI');

      expect(llmRouter.analyzeQuery).toHaveBeenCalledWith('discover related content about AI');
      expect(mockKnowledgeEngine.discoverRelatedContent).toHaveBeenCalledWith('discover related content about AI');
      expect(result.role).toBe('assistant');
      expect(result.content).toContain('Found 1 related items');
      expect(result.content).toContain('Related Note');
      expect(result.metadata?.toolsCalled).toContain('knowledge-discovery');
    });

    it('should process general queries', async () => {
      // Mock general query response
      const llmRouter = bridgeInterface['llmRouter']!;
      (llmRouter.analyzeQuery as any).mockResolvedValue({
        confidence: 0.9,
        selectedServer: 'test-server',
        selectedTool: 'chat',
        parameters: { message: 'what is the weather?' },
        reasoning: 'test reasoning',
      });
      mockMCPClient.callTool.mockResolvedValue({
        result: { content: 'General response' },
      });

      const result = await bridgeInterface.processQuery('what is the weather?');

      expect(llmRouter.analyzeQuery).toHaveBeenCalledWith('what is the weather?');
      expect(mockMCPClient.callTool).toHaveBeenCalledWith('test-server', 'chat', { message: 'what is the weather?' });
      expect(result.role).toBe('assistant');
      expect(result.content).toBe('General response');
    });

    it('should handle empty search results', async () => {
      const llmRouter = bridgeInterface['llmRouter']!;
      (llmRouter.analyzeQuery as any).mockResolvedValue({
        confidence: 0.9,
        selectedServer: 'test-server',
        selectedTool: 'search',
        parameters: { query: 'nonexistent documents' },
        reasoning: 'test reasoning',
      });
      mockMCPClient.callTool.mockResolvedValue({ result: { content: [] } });

      const result = await bridgeInterface.processQuery('find nonexistent documents');

      expect(result.content).toBe('');
    });

    it('should handle empty knowledge discovery results', async () => {
      const llmRouter = bridgeInterface['llmRouter']!;
      (llmRouter.analyzeQuery as any).mockResolvedValue({
        confidence: 0.9,
        selectedServer: 'test-server',
        selectedTool: 'knowledge-discovery',
        parameters: { query: 'discover related content about nothing' },
        reasoning: 'test reasoning',
      });
      mockKnowledgeEngine.discoverRelatedContent.mockResolvedValue([]);

      const result = await bridgeInterface.processQuery('discover related content about nothing');

      expect(result.content).toBe('No related content found.');
    });

    it('should handle errors gracefully', async () => {
      const llmRouter = bridgeInterface['llmRouter']!;
      (llmRouter.analyzeQuery as any).mockResolvedValue({
        confidence: 0.9,
        selectedServer: 'test-server',
        selectedTool: 'search',
        parameters: { query: 'test documents' },
        reasoning: 'test reasoning',
      });
      mockMCPClient.callTool.mockRejectedValue(new Error('Search failed'));

      const result = await bridgeInterface.processQuery('find test documents');

      expect(result.role).toBe('assistant');
      expect(result.content).toContain('Failed to execute search on test-server: Search failed');
      expect(result.metadata?.processingTime).toBeDefined();
    });

    it('should handle unknown errors', async () => {
      const llmRouter = bridgeInterface['llmRouter']!;
      (llmRouter.analyzeQuery as any).mockResolvedValue({
        confidence: 0.9,
        selectedServer: 'test-server',
        selectedTool: 'search',
        parameters: { query: 'test documents' },
        reasoning: 'test reasoning',
      });
      mockMCPClient.callTool.mockRejectedValue('Unknown error');

      const result = await bridgeInterface.processQuery('find test documents');

      expect(result.content).toContain('Failed to execute search on test-server: Unknown error');
    });
  });

  describe('insertContentAtCursor', () => {
    it('should insert content at cursor position', async () => {
      const mockEditor = {
        getCursor: vi.fn().mockReturnValue({ line: 1, ch: 5 }),
        replaceRange: vi.fn(),
      };

      const mockMarkdownView = {
        editor: mockEditor,
      };

      mockApp.workspace.getActiveViewOfType.mockReturnValue(mockMarkdownView);

      await bridgeInterface.insertContentAtCursor('Test content');

      expect(mockEditor.replaceRange).toHaveBeenCalledWith('Test content', { line: 1, ch: 5 });
    });

    it('should throw error when no active markdown view', async () => {
      mockApp.workspace.getActiveViewOfType.mockReturnValue(null);

      await expect(bridgeInterface.insertContentAtCursor('Test content'))
        .rejects.toThrow('No active markdown view found');
    });
  });

  describe('createNewNote', () => {
    it('should create a new note with given title and content', async () => {
      mockApp.vault.create.mockResolvedValue(undefined);

      await bridgeInterface.createNewNote('Test Note', 'Test content');

      expect(mockApp.vault.create).toHaveBeenCalledWith('Test Note.md', 'Test content');
    });
  });

  describe('intent classification', () => {
    it('should classify search intents correctly', async () => {
      const llmRouter = bridgeInterface['llmRouter']!;
      (llmRouter.analyzeQuery as any).mockResolvedValue({
        confidence: 0.9,
        selectedServer: 'test-server',
        selectedTool: 'search',
        parameters: { query: 'my notes' },
        reasoning: 'test reasoning',
      });
      await bridgeInterface.processQuery('find my notes');
      expect(mockMCPClient.callTool).toHaveBeenCalledWith('test-server', 'search', { query: 'my notes' });
    });

    it('should classify knowledge discovery intents correctly', async () => {
      const llmRouter = bridgeInterface['llmRouter']!;
      (llmRouter.analyzeQuery as any).mockResolvedValue({
        confidence: 0.9,
        selectedServer: 'test-server',
        selectedTool: 'knowledge-discovery',
        parameters: { query: 'related notes' },
        reasoning: 'test reasoning',
      });
      await bridgeInterface.processQuery('discover related notes');
      expect(mockKnowledgeEngine.discoverRelatedContent).toHaveBeenCalledWith('discover related notes');
    });

    it('should handle general queries when no servers connected', async () => {
      mockMCPClient.getConnectedServers.mockReturnValue([]);

      const result = await bridgeInterface.processQuery('general question');

      expect(result.content).toBe('I\'m not sure how to help with that. \n\nAvailable servers: ');
    });

    it('should handle general query tool call failures', async () => {
      const llmRouter = bridgeInterface['llmRouter']!;
      (llmRouter.analyzeQuery as any).mockResolvedValue({
        confidence: 0.9,
        selectedServer: 'test-server',
        selectedTool: 'chat',
        parameters: { message: 'general question' },
        reasoning: 'test reasoning',
      });
      mockMCPClient.callTool.mockRejectedValue(new Error('Tool call failed'));

      const result = await bridgeInterface.processQuery('general question');

      expect(result.content).toBe('Failed to execute chat on test-server: Tool call failed');
    });
  });
});