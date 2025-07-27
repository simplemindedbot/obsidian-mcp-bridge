import { App, TFile } from "obsidian";
import { getLogger } from "@/utils/logger";

/**
 * Search result interface for vault search operations
 */
export interface VaultSearchResult {
  file: TFile;
  title: string;
  content: string;
  excerpt: string;
  relevanceScore: number;
  matches: SearchMatch[];
  metadata: {
    path: string;
    size: number;
    modified: Date;
    tags?: string[];
  };
}

/**
 * Individual search match within a file
 */
export interface SearchMatch {
  line: number;
  text: string;
  startIndex: number;
  endIndex: number;
}

/**
 * Plugin integration status
 */
export interface PluginIntegration {
  omnisearch: boolean;
  restapi: boolean;
}

/**
 * Search options and preferences
 */
export interface SearchOptions {
  maxResults?: number;
  minRelevanceScore?: number;
  includeContent?: boolean;
  searchTags?: boolean;
  searchPath?: boolean;
  contextLines?: number;
}

/**
 * Comprehensive vault search service that integrates with popular search plugins
 * and provides fallback to native Obsidian search capabilities
 */
export class VaultSearchService {
  private app: App;
  private logger = getLogger();
  private pluginIntegrations: PluginIntegration = {
    omnisearch: false,
    restapi: false
  };

  constructor(app: App) {
    this.app = app;
    this.detectPluginIntegrations();
  }

  /**
   * Detect available plugin integrations
   */
  private detectPluginIntegrations(): void {
    // Check for Omnisearch plugin
    const omnisearchPlugin = (this.app as any).plugins?.enabledPlugins?.has?.('omnisearch');
    this.pluginIntegrations.omnisearch = !!omnisearchPlugin;

    // Check for Local REST API plugin  
    const restApiPlugin = (this.app as any).plugins?.enabledPlugins?.has?.('obsidian-local-rest-api');
    this.pluginIntegrations.restapi = !!restApiPlugin;

    this.logger.info('VaultSearchService', `Plugin integrations detected: Omnisearch=${this.pluginIntegrations.omnisearch}, REST API=${this.pluginIntegrations.restapi}`);
  }

  /**
   * Get current plugin integration status
   */
  getPluginIntegrations(): PluginIntegration {
    return { ...this.pluginIntegrations };
  }

  /**
   * Main search method that automatically chooses the best available search method
   */
  async search(query: string, options: SearchOptions = {}): Promise<VaultSearchResult[]> {
    const startTime = Date.now();
    this.logger.info('VaultSearchService', `Searching for: "${query}"`);

    try {
      let results: VaultSearchResult[] = [];

      // Try Omnisearch first (most powerful)
      if (this.pluginIntegrations.omnisearch) {
        results = await this.searchWithOmnisearch(query, options);
      }
      // Fallback to native search
      else {
        results = await this.searchNative(query, options);
      }

      const processingTime = Date.now() - startTime;
      this.logger.info('VaultSearchService', `Found ${results.length} results in ${processingTime}ms`);

      return results;
    } catch (error) {
      this.logger.error('VaultSearchService', 'Search failed', error instanceof Error ? error : new Error(String(error)));
      // Fallback to native search on error
      return this.searchNative(query, options);
    }
  }

  /**
   * Search using Omnisearch plugin API
   */
  private async searchWithOmnisearch(query: string, options: SearchOptions): Promise<VaultSearchResult[]> {
    this.logger.debug('VaultSearchService', 'Using Omnisearch plugin');

    try {
      // Get Omnisearch plugin instance
      const omnisearchPlugin = (this.app as any).plugins?.plugins?.omnisearch;
      if (!omnisearchPlugin) {
        throw new Error('Omnisearch plugin not available');
      }

      // Use Omnisearch API to perform search
      const searchResults = await omnisearchPlugin.api?.search?.(query, {
        maxResults: options.maxResults || 50
      });

      if (!searchResults || !Array.isArray(searchResults)) {
        throw new Error('Invalid response from Omnisearch');
      }

      // Convert Omnisearch results to our format
      const results: VaultSearchResult[] = [];
      for (const result of searchResults) {
        const file = this.app.vault.getAbstractFileByPath(result.path);
        if (file instanceof TFile) {
          const content = options.includeContent !== false ? await this.app.vault.read(file) : '';
          const excerpt = this.generateExcerpt(content, query, options.contextLines || 2);
          
          results.push({
            file,
            title: file.basename,
            content,
            excerpt,
            relevanceScore: result.score || 0,
            matches: this.findMatches(content, query),
            metadata: {
              path: file.path,
              size: file.stat.size,
              modified: new Date(file.stat.mtime),
              tags: this.extractTags(content)
            }
          });
        }
      }

      return this.filterAndSortResults(results, options);
    } catch (error) {
      this.logger.warn('VaultSearchService', 'Omnisearch failed, falling back to native search');
      throw error;
    }
  }

  /**
   * Native Obsidian vault search implementation
   */
  private async searchNative(query: string, options: SearchOptions): Promise<VaultSearchResult[]> {
    this.logger.debug('VaultSearchService', 'Using native vault search');

    const results: VaultSearchResult[] = [];
    const files = this.app.vault.getMarkdownFiles();
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(word => word.length > 0);

    for (const file of files) {
      try {
        const content = options.includeContent !== false ? await this.app.vault.read(file) : '';
        const relevanceScore = this.calculateRelevanceScore(file, content, queryWords, options);

        if (relevanceScore >= (options.minRelevanceScore || 0.1)) {
          const excerpt = this.generateExcerpt(content, query, options.contextLines || 2);
          
          results.push({
            file,
            title: file.basename,
            content,
            excerpt,
            relevanceScore,
            matches: this.findMatches(content, query),
            metadata: {
              path: file.path,
              size: file.stat.size,
              modified: new Date(file.stat.mtime),
              tags: this.extractTags(content)
            }
          });
        }
      } catch (error) {
        this.logger.warn('VaultSearchService', `Failed to read file ${file.path}`);
      }
    }

    return this.filterAndSortResults(results, options);
  }

  /**
   * Calculate relevance score for native search
   */
  private calculateRelevanceScore(file: TFile, content: string, queryWords: string[], options: SearchOptions): number {
    let score = 0;
    const contentLower = content.toLowerCase();
    const titleLower = file.basename.toLowerCase();
    const pathLower = file.path.toLowerCase();

    // Title matches (highest weight)
    for (const word of queryWords) {
      if (titleLower.includes(word)) {
        score += 3.0;
      }
    }

    // Path matches (medium weight) 
    if (options.searchPath !== false) {
      for (const word of queryWords) {
        if (pathLower.includes(word)) {
          score += 1.5;
        }
      }
    }

    // Content matches (base weight)
    for (const word of queryWords) {
      const matches = (contentLower.match(new RegExp(word, 'g')) || []).length;
      score += matches * 1.0;
    }

    // Tag matches (medium weight)
    if (options.searchTags !== false) {
      const tags = this.extractTags(content);
      for (const tag of tags) {
        for (const word of queryWords) {
          if (tag.toLowerCase().includes(word)) {
            score += 2.0;
          }
        }
      }
    }

    // Normalize by content length to prefer more focused matches
    const normalizedScore = score / Math.max(1, Math.log(content.length + 1));
    
    return Math.min(1.0, normalizedScore / queryWords.length);
  }

  /**
   * Generate excerpt around search matches
   */
  private generateExcerpt(content: string, query: string, contextLines: number = 2): string {
    const lines = content.split('\n');
    const queryWords = query.toLowerCase().split(/\s+/);
    const matchedLines: number[] = [];

    // Find lines with matches
    lines.forEach((line, index) => {
      const lineLower = line.toLowerCase();
      for (const word of queryWords) {
        if (lineLower.includes(word)) {
          matchedLines.push(index);
          break;
        }
      }
    });

    if (matchedLines.length === 0) {
      return content.substring(0, 200) + '...';
    }

    // Get context around first match
    const firstMatch = matchedLines[0];
    const startLine = Math.max(0, firstMatch - contextLines);
    const endLine = Math.min(lines.length - 1, firstMatch + contextLines);
    
    const excerpt = lines.slice(startLine, endLine + 1).join('\n');
    return excerpt.length > 300 ? excerpt.substring(0, 300) + '...' : excerpt;
  }

  /**
   * Find specific matches within content
   */
  private findMatches(content: string, query: string): SearchMatch[] {
    const matches: SearchMatch[] = [];
    const lines = content.split('\n');
    const queryWords = query.toLowerCase().split(/\s+/);

    lines.forEach((line, lineIndex) => {
      const lineLower = line.toLowerCase();
      for (const word of queryWords) {
        let startIndex = 0;
        let index = lineLower.indexOf(word, startIndex);
        
        while (index !== -1) {
          matches.push({
            line: lineIndex,
            text: line,
            startIndex: index,
            endIndex: index + word.length
          });
          
          startIndex = index + 1;
          index = lineLower.indexOf(word, startIndex);
        }
      }
    });

    return matches;
  }

  /**
   * Extract tags from content
   */
  private extractTags(content: string): string[] {
    const tagRegex = /#[\w\-_]+/g;
    const matches = content.match(tagRegex) || [];
    return matches.map(tag => tag.substring(1)); // Remove # prefix
  }

  /**
   * Filter and sort search results
   */
  private filterAndSortResults(results: VaultSearchResult[], options: SearchOptions): VaultSearchResult[] {
    let filtered = results.filter(result => 
      result.relevanceScore >= (options.minRelevanceScore || 0.1)
    );

    // Sort by relevance score (descending)
    filtered.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Limit results
    if (options.maxResults && filtered.length > options.maxResults) {
      filtered = filtered.slice(0, options.maxResults);
    }

    return filtered;
  }

  /**
   * Get search suggestions based on vault content
   */
  async getSearchSuggestions(partialQuery: string): Promise<string[]> {
    const suggestions: Set<string> = new Set();
    
    if (partialQuery.length < 2) {
      return [];
    }

    const files = this.app.vault.getMarkdownFiles();
    const queryLower = partialQuery.toLowerCase();

    // Suggest file names
    for (const file of files.slice(0, 100)) { // Limit for performance
      if (file.basename.toLowerCase().includes(queryLower)) {
        suggestions.add(file.basename);
      }
    }

    // Suggest tags
    try {
      // Get all tags from metadata cache
      const allTags = Object.keys((this.app.metadataCache as any).getTags?.() || {});
      for (const tag of allTags) {
        if (tag.toLowerCase().includes(queryLower)) {
          suggestions.add(tag);
        }
      }
    } catch (error) {
      this.logger.debug('VaultSearchService', 'Failed to get tag suggestions');
    }

    return Array.from(suggestions).slice(0, 10);
  }
}