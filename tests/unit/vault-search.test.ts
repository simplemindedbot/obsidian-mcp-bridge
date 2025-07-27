import { describe, it, expect, beforeEach, vi, MockedFunction } from 'vitest';
import { VaultSearchService, VaultSearchResult } from '@/services/vault-search';
import { initializeLogger } from '@/utils/logger';

// Mock Obsidian
vi.mock('obsidian', () => ({
  TFile: vi.fn(),
  App: vi.fn(),
}));

// Mock app for logger
const mockApp = {
  vault: {
    configDir: '/tmp/test-config',
    getMarkdownFiles: vi.fn(),
    read: vi.fn(),
  },
  metadataCache: {
    getTags: vi.fn(),
  },
  plugins: {
    enabledPlugins: {
      has: vi.fn(),
    }
  }
} as any;

describe('VaultSearchService', () => {
  let vaultSearchService: VaultSearchService;
  let mockFiles: any[];

  beforeEach(() => {
    // Initialize logger for tests
    initializeLogger(mockApp);
    
    // Reset mocks
    vi.clearAllMocks();
    
    // Create mock files
    mockFiles = [
      {
        basename: 'Machine Learning Basics',
        path: 'notes/machine-learning-basics.md',
        stat: { size: 1024, mtime: Date.now() - 86400000 } // 1 day ago
      },
      {
        basename: 'TypeScript Guide', 
        path: 'programming/typescript-guide.md',
        stat: { size: 2048, mtime: Date.now() - 172800000 } // 2 days ago
      },
      {
        basename: 'Project Ideas',
        path: 'ideas/project-ideas.md', 
        stat: { size: 512, mtime: Date.now() - 3600000 } // 1 hour ago
      }
    ];

    mockApp.vault.getMarkdownFiles.mockReturnValue(mockFiles);
    mockApp.plugins.enabledPlugins.has.mockReturnValue(false);
    
    vaultSearchService = new VaultSearchService(mockApp);
  });

  describe('plugin detection', () => {
    it('should detect no plugins by default', () => {
      const integrations = vaultSearchService.getPluginIntegrations();
      
      expect(integrations.omnisearch).toBe(false);
      expect(integrations.restapi).toBe(false);
    });

    it('should detect Omnisearch plugin when available', () => {
      mockApp.plugins.enabledPlugins.has.mockImplementation((pluginId: string) => {
        return pluginId === 'omnisearch';
      });
      
      const service = new VaultSearchService(mockApp);
      const integrations = service.getPluginIntegrations();
      
      expect(integrations.omnisearch).toBe(true);
      expect(integrations.restapi).toBe(false);
    });
  });

  describe('native search', () => {
    beforeEach(() => {
      // Mock file content
      mockApp.vault.read.mockImplementation((file: any) => {
        switch (file.basename) {
          case 'Machine Learning Basics':
            return Promise.resolve('# Machine Learning Basics\n\nThis note covers machine learning algorithms and neural networks. #ml #ai');
          case 'TypeScript Guide':
            return Promise.resolve('# TypeScript Guide\n\nComplete guide to TypeScript programming language. #typescript #programming');
          case 'Project Ideas':
            return Promise.resolve('# Project Ideas\n\nCollection of project ideas for development. #projects #ideas');
          default:
            return Promise.resolve('');
        }
      });
    });

    it('should find notes by title match', async () => {
      const results = await vaultSearchService.search('machine learning');
      
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Machine Learning Basics');
      expect(results[0].relevanceScore).toBeGreaterThan(0);
    });

    it('should find notes by content match', async () => {
      const results = await vaultSearchService.search('typescript programming');
      
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('TypeScript Guide');
      expect(results[0].content).toContain('TypeScript programming language');
    });

    it('should find notes by tag match', async () => {
      const results = await vaultSearchService.search('projects');
      
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Project Ideas');
      expect(results[0].metadata.tags).toContain('projects');
    });

    it('should return multiple results sorted by relevance', async () => {
      const results = await vaultSearchService.search('programming');
      
      expect(results.length).toBeGreaterThan(0);
      // Results should be sorted by relevance score (descending)
      for (let i = 1; i < results.length; i++) {
        expect(results[i-1].relevanceScore).toBeGreaterThanOrEqual(results[i].relevanceScore);
      }
    });

    it('should return empty array for no matches', async () => {
      const results = await vaultSearchService.search('nonexistent query xyz');
      
      expect(results).toHaveLength(0);
    });

    it('should respect maxResults option', async () => {
      const results = await vaultSearchService.search('guide', { maxResults: 1 });
      
      expect(results).toHaveLength(1);
    });

    it('should respect minRelevanceScore option', async () => {
      // Use a query that won't match to test the filtering
      const results = await vaultSearchService.search('zyxwvutsrq', { 
        minRelevanceScore: 0.1
      });
      
      expect(results).toHaveLength(0);
    });

    it('should generate excerpts with context', async () => {
      const results = await vaultSearchService.search('machine learning');
      
      expect(results[0].excerpt).toContain('machine learning');
      expect(results[0].excerpt.length).toBeGreaterThan(0);
    });

    it('should find matches within content', async () => {
      const results = await vaultSearchService.search('algorithms');
      
      expect(results).toHaveLength(1);
      expect(results[0].matches.length).toBeGreaterThan(0);
      expect(results[0].matches[0].text).toContain('algorithms');
    });

    it('should extract tags from content', async () => {
      const results = await vaultSearchService.search('machine learning');
      
      expect(results[0].metadata.tags).toContain('ml');
      expect(results[0].metadata.tags).toContain('ai');
    });

    it('should include file metadata', async () => {
      const results = await vaultSearchService.search('machine learning');
      
      expect(results[0].metadata.path).toBe('notes/machine-learning-basics.md');
      expect(results[0].metadata.size).toBe(1024);
      expect(results[0].metadata.modified).toBeInstanceOf(Date);
    });
  });

  describe('search suggestions', () => {
    beforeEach(() => {
      mockApp.metadataCache.getTags = vi.fn().mockReturnValue({
        '#typescript': {},
        '#programming': {},
        '#ml': {},
        '#ai': {}
      });
    });

    it('should suggest file names', async () => {
      const suggestions = await vaultSearchService.getSearchSuggestions('machine');
      
      expect(suggestions).toContain('Machine Learning Basics');
    });

    it('should suggest tags', async () => {
      const suggestions = await vaultSearchService.getSearchSuggestions('type');
      
      expect(suggestions).toContain('#typescript');
    });

    it('should return empty array for very short queries', async () => {
      const suggestions = await vaultSearchService.getSearchSuggestions('a');
      
      expect(suggestions).toHaveLength(0);
    });

    it('should limit suggestions to 10 items', async () => {
      // Create many mock files
      const manyFiles = Array.from({ length: 20 }, (_, i) => ({
        basename: `Test File ${i}`,
        path: `test-${i}.md`,
        stat: { size: 100, mtime: Date.now() }
      }));
      
      mockApp.vault.getMarkdownFiles.mockReturnValue(manyFiles);
      
      const suggestions = await vaultSearchService.getSearchSuggestions('test');
      
      expect(suggestions.length).toBeLessThanOrEqual(10);
    });
  });

  describe('error handling', () => {
    it('should handle file read errors gracefully', async () => {
      mockApp.vault.read.mockRejectedValue(new Error('File read error'));
      
      const results = await vaultSearchService.search('any query');
      
      // Should not throw, but may return fewer results
      expect(results).toBeInstanceOf(Array);
    });

    it('should handle metadata cache errors gracefully', async () => {
      mockApp.metadataCache.getTags = vi.fn().mockImplementation(() => {
        throw new Error('Metadata error');
      });
      
      const suggestions = await vaultSearchService.getSearchSuggestions('test');
      
      // Should not throw
      expect(suggestions).toBeInstanceOf(Array);
    });
  });
});