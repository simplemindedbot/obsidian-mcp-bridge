import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BridgeInterface } from '@/bridge/bridge-interface';
import { MCPClient } from '@/core/mcp-client';
import { KnowledgeEngine } from '@/knowledge/knowledge-engine';
import { initializeLogger } from '@/utils/logger';

// Mock dependencies
vi.mock('@/core/mcp-client');
vi.mock('@/knowledge/knowledge-engine');

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
    // Initialize logger for tests
    initializeLogger(mockApp);
    
    // Reset mocks
    vi.clearAllMocks();
    
    // Create mock instances
    mockMCPClient = {
      searchAcrossServers: vi.fn(),
      callTool: vi.fn(),
      getConnectedServers: vi.fn().mockReturnValue(['test-server']),
    };

    mockKnowledgeEngine = {
      discoverRelatedContent: vi.fn(),
    };

    // Mock constructors
    vi.mocked(MCPClient).mockImplementation(() => mockMCPClient);
    vi.mocked(KnowledgeEngine).mockImplementation(() => mockKnowledgeEngine);

    bridgeInterface = new BridgeInterface(mockApp, mockMCPClient, mockKnowledgeEngine);
  });

  describe('processQuery', () => {
    it('should process search queries', async () => {
      // Mock search results
      mockMCPClient.searchAcrossServers.mockResolvedValue([
        { title: 'Test Result', content: 'Test content' },
        { title: 'Another Result', content: 'More content' },
      ]);

      const result = await bridgeInterface.processQuery('find test documents');

      expect(mockMCPClient.searchAcrossServers).toHaveBeenCalledWith('test documents');
      expect(result.role).toBe('assistant');
      expect(result.content).toContain('Found 2 results');
      expect(result.content).toContain('Test Result');
      expect(result.metadata?.toolsCalled).toContain('search');
    });

    it('should process knowledge discovery queries', async () => {
      // Mock knowledge discovery results
      mockKnowledgeEngine.discoverRelatedContent.mockResolvedValue([
        { 
          title: 'Related Note', 
          content: 'Related content', 
          source: 'vault',
          relevanceScore: 0.8,
        },
      ]);

      const result = await bridgeInterface.processQuery('discover related content about AI');

      expect(mockKnowledgeEngine.discoverRelatedContent).toHaveBeenCalledWith('discover related content about AI');
      expect(result.role).toBe('assistant');
      expect(result.content).toContain('Found 1 related items');
      expect(result.content).toContain('Related Note');
      expect(result.metadata?.toolsCalled).toContain('knowledge-discovery');
    });

    it('should process general queries', async () => {
      // Mock general query response
      mockMCPClient.callTool.mockResolvedValue({
        result: { content: 'General response' },
      });

      const result = await bridgeInterface.processQuery('what is the weather?');

      expect(mockMCPClient.callTool).toHaveBeenCalledWith('test-server', 'chat', { message: 'what is the weather?' });
      expect(result.role).toBe('assistant');
      expect(result.content).toBe('General response');
    });

    it('should handle empty search results', async () => {
      mockMCPClient.searchAcrossServers.mockResolvedValue([]);

      const result = await bridgeInterface.processQuery('find nonexistent documents');

      expect(result.content).toBe('No results found for "nonexistent documents"');
    });

    it('should handle empty knowledge discovery results', async () => {
      mockKnowledgeEngine.discoverRelatedContent.mockResolvedValue([]);

      const result = await bridgeInterface.processQuery('discover related content about nothing');

      expect(result.content).toBe('No related content found.');
    });

    it('should handle errors gracefully', async () => {
      mockMCPClient.searchAcrossServers.mockRejectedValue(new Error('Search failed'));

      const result = await bridgeInterface.processQuery('find test documents');

      expect(result.role).toBe('assistant');
      expect(result.content).toContain('Sorry, I encountered an error: Search failed');
      expect(result.metadata?.processingTime).toBeDefined();
    });

    it('should handle unknown errors', async () => {
      mockMCPClient.searchAcrossServers.mockRejectedValue('Unknown error');

      const result = await bridgeInterface.processQuery('find test documents');

      expect(result.content).toContain('Sorry, I encountered an error: Unknown error');
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
      mockMCPClient.searchAcrossServers.mockResolvedValue([]);

      await bridgeInterface.processQuery('find my notes');
      expect(mockMCPClient.searchAcrossServers).toHaveBeenCalled();

      await bridgeInterface.processQuery('search for documents');
      expect(mockMCPClient.searchAcrossServers).toHaveBeenCalledTimes(2);
    });

    it('should classify knowledge discovery intents correctly', async () => {
      mockKnowledgeEngine.discoverRelatedContent.mockResolvedValue([]);

      await bridgeInterface.processQuery('discover related notes');
      expect(mockKnowledgeEngine.discoverRelatedContent).toHaveBeenCalled();

      await bridgeInterface.processQuery('connect ideas about AI');
      expect(mockKnowledgeEngine.discoverRelatedContent).toHaveBeenCalledTimes(2);
    });

    it('should handle general queries when no servers connected', async () => {
      mockMCPClient.getConnectedServers.mockReturnValue([]);

      const result = await bridgeInterface.processQuery('general question');

      expect(result.content).toBe('No MCP servers are currently connected. Please check your settings.');
    });

    it('should handle general query tool call failures', async () => {
      mockMCPClient.callTool.mockRejectedValue(new Error('Tool call failed'));

      const result = await bridgeInterface.processQuery('general question');

      expect(result.content).toBe('I\'m not sure how to help with that. Connected servers: test-server');
    });
  });

  describe('context capture', () => {
    it('should capture current note context', () => {
      const mockActiveView = {
        file: {
          basename: 'test-note',
          path: 'test-note.md'
        },
        editor: {
          getValue: vi.fn().mockReturnValue('# Test Note\n\nThis is test content.')
        }
      };
      
      mockApp.workspace.getActiveViewOfType.mockReturnValue(mockActiveView);
      
      const context = bridgeInterface.getCurrentNoteContext();
      
      expect(context).toEqual({
        content: '# Test Note\n\nThis is test content.',
        title: 'test-note',
        path: 'test-note.md'
      });
    });

    it('should return null when no active note', () => {
      mockApp.workspace.getActiveViewOfType.mockReturnValue(null);
      
      const context = bridgeInterface.getCurrentNoteContext();
      
      expect(context).toBeNull();
    });

    it('should capture selected text', () => {
      const mockActiveView = {
        editor: {
          getSelection: vi.fn().mockReturnValue('selected text content')
        }
      };
      
      mockApp.workspace.getActiveViewOfType.mockReturnValue(mockActiveView);
      
      const selectedText = bridgeInterface.getSelectedText();
      
      expect(selectedText).toBe('selected text content');
    });

    it('should return null when no text selected', () => {
      const mockActiveView = {
        editor: {
          getSelection: vi.fn().mockReturnValue('')
        }
      };
      
      mockApp.workspace.getActiveViewOfType.mockReturnValue(mockActiveView);
      
      const selectedText = bridgeInterface.getSelectedText();
      
      expect(selectedText).toBeNull();
    });

    it('should get contextual information', () => {
      const mockActiveView = {
        file: {
          basename: 'test-note',
          path: 'test-note.md'
        },
        editor: {
          getValue: vi.fn().mockReturnValue('# Test Note\n\nContent here.'),
          getSelection: vi.fn().mockReturnValue('selected content'),
          getCursor: vi.fn().mockReturnValue({ line: 2, ch: 5 }),
          getLine: vi.fn().mockImplementation((line) => {
            const lines = ['# Test Note', '', 'Content here.', 'More content.'];
            return lines[line] || '';
          }),
          lastLine: vi.fn().mockReturnValue(3)
        }
      };
      
      mockApp.workspace.getActiveViewOfType.mockReturnValue(mockActiveView);
      
      const contextInfo = bridgeInterface.getContextualInfo();
      
      expect(contextInfo.currentNote).toEqual({
        content: '# Test Note\n\nContent here.',
        title: 'test-note',
        path: 'test-note.md'
      });
      expect(contextInfo.selectedText).toBe('selected content');
      expect(contextInfo.cursorContext).toContain('Content here.');
    });
  });
});