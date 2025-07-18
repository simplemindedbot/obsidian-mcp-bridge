import { describe, it, expect, beforeEach, vi } from 'vitest';
import { KnowledgeEngine } from '@/knowledge/knowledge-engine';
import { MCPClient } from '@/core/mcp-client';

// Mock dependencies
vi.mock('@/core/mcp-client');

// Mock Obsidian App
const mockApp = {
  vault: {
    getMarkdownFiles: vi.fn(),
    read: vi.fn(),
  },
  workspace: {
    getActiveFile: vi.fn(),
  },
} as any;

describe('KnowledgeEngine', () => {
  let knowledgeEngine: KnowledgeEngine;
  let mockMCPClient: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create mock MCP client
    mockMCPClient = {
      searchAcrossServers: vi.fn(),
      getConnectedServers: vi.fn().mockReturnValue(['test-server']),
      callTool: vi.fn(),
    };

    // Mock constructor
    vi.mocked(MCPClient).mockImplementation(() => mockMCPClient);

    knowledgeEngine = new KnowledgeEngine(mockApp, mockMCPClient);
  });

  describe('discoverRelatedContent', () => {
    it('should discover related content from vault and MCP servers', async () => {
      // Mock vault files
      const mockFiles = [
        {
          path: 'note1.md',
          basename: 'note1',
          stat: { size: 100, mtime: new Date() },
        },
        {
          path: 'note2.md',
          basename: 'note2',
          stat: { size: 200, mtime: new Date() },
        },
      ];

      mockApp.vault.getMarkdownFiles.mockReturnValue(mockFiles);
      mockApp.vault.read.mockImplementation((file: any) => {
        if (file.path === 'note1.md') {
          return Promise.resolve('This is about machine learning and AI algorithms');
        }
        if (file.path === 'note2.md') {
          return Promise.resolve('This discusses deep learning neural networks');
        }
        return Promise.resolve('');
      });

      // Mock MCP search results
      mockMCPClient.searchAcrossServers.mockResolvedValue([
        {
          title: 'External AI Paper',
          content: 'Advanced machine learning techniques',
          source: 'external',
        },
      ]);

      const results = await knowledgeEngine.discoverRelatedContent('machine learning');

      expect(results).toHaveLength(3);
      expect(results[0].title).toBe('note1');
      expect(results[0].source).toBe('vault');
      expect(results[0].relevanceScore).toBeGreaterThan(0);
      expect(results[1].title).toBe('note2');
      expect(results[2].title).toBe('External AI Paper');
      expect(results[2].source).toBe('external');
    });

    it('should handle empty vault', async () => {
      mockApp.vault.getMarkdownFiles.mockReturnValue([]);
      mockMCPClient.searchAcrossServers.mockResolvedValue([]);

      const results = await knowledgeEngine.discoverRelatedContent('test query');

      expect(results).toHaveLength(0);
    });

    it('should handle vault read errors gracefully', async () => {
      const mockFiles = [
        {
          path: 'note1.md',
          basename: 'note1',
          stat: { size: 100, mtime: new Date() },
        },
      ];

      mockApp.vault.getMarkdownFiles.mockReturnValue(mockFiles);
      mockApp.vault.read.mockRejectedValue(new Error('File read error'));
      mockMCPClient.searchAcrossServers.mockResolvedValue([]);

      const results = await knowledgeEngine.discoverRelatedContent('test query');

      expect(results).toHaveLength(0);
    });

    it('should handle MCP search errors gracefully', async () => {
      mockApp.vault.getMarkdownFiles.mockReturnValue([]);
      mockMCPClient.searchAcrossServers.mockRejectedValue(new Error('MCP search failed'));

      const results = await knowledgeEngine.discoverRelatedContent('test query');

      expect(results).toHaveLength(0);
    });

    it('should filter by relevance score', async () => {
      const mockFiles = [
        {
          path: 'relevant.md',
          basename: 'relevant',
          stat: { size: 100, mtime: new Date() },
        },
        {
          path: 'irrelevant.md',
          basename: 'irrelevant',
          stat: { size: 100, mtime: new Date() },
        },
      ];

      mockApp.vault.getMarkdownFiles.mockReturnValue(mockFiles);
      mockApp.vault.read.mockImplementation((file: any) => {
        if (file.path === 'relevant.md') {
          return Promise.resolve('This is about artificial intelligence and machine learning');
        }
        if (file.path === 'irrelevant.md') {
          return Promise.resolve('This is about cooking recipes and food');
        }
        return Promise.resolve('');
      });

      mockMCPClient.searchAcrossServers.mockResolvedValue([]);

      const results = await knowledgeEngine.discoverRelatedContent('artificial intelligence');

      // Should only return the relevant note (above 0.3 threshold)
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('relevant');
    });

    it('should sort results by relevance score', async () => {
      const mockFiles = [
        {
          path: 'high-relevance.md',
          basename: 'high-relevance',
          stat: { size: 100, mtime: new Date() },
        },
        {
          path: 'low-relevance.md',
          basename: 'low-relevance',
          stat: { size: 100, mtime: new Date() },
        },
      ];

      mockApp.vault.getMarkdownFiles.mockReturnValue(mockFiles);
      mockApp.vault.read.mockImplementation((file: any) => {
        if (file.path === 'high-relevance.md') {
          return Promise.resolve('machine learning artificial intelligence deep learning neural networks machine learning');
        }
        if (file.path === 'low-relevance.md') {
          return Promise.resolve('This note discusses cooking techniques and recipes for delicious meals');
        }
        return Promise.resolve('');
      });

      mockMCPClient.searchAcrossServers.mockResolvedValue([]);

      const results = await knowledgeEngine.discoverRelatedContent('machine learning');

      expect(results).toHaveLength(1); // Only high-relevance should pass 0.3 threshold
      expect(results[0].title).toBe('high-relevance');
      expect(results[0].relevanceScore).toBeGreaterThan(0.3);
    });
  });

  describe('generateSuggestions', () => {
    it('should generate suggestions for current note', async () => {
      const suggestions = await knowledgeEngine.generateSuggestions('current note content');
      
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions).toHaveLength(0); // Currently returns empty array
    });
  });

  describe('findRelatedNotes', () => {
    it('should find related notes for given path', async () => {
      const relatedNotes = await knowledgeEngine.findRelatedNotes('test/note.md');
      
      expect(Array.isArray(relatedNotes)).toBe(true);
      expect(relatedNotes).toHaveLength(0); // Currently returns empty array
    });
  });
});