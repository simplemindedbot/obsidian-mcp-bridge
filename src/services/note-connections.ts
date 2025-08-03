import { App, TFile, MetadataCache } from "obsidian";
import { getLogger } from "@/utils/logger";

/**
 * Represents a connection between two notes
 */
export interface NoteConnection {
  sourceNote: {
    title: string;
    path: string;
    file: TFile;
  };
  targetNote: {
    title: string;
    path: string;
    file: TFile;
  };
  connectionType: ConnectionType;
  strength: number; // 0-1 strength of connection
  reason: string; // Human-readable explanation
  details: ConnectionDetails;
}

/**
 * Types of connections between notes
 */
export enum ConnectionType {
  DIRECT_LINK = "direct_link",           // [[Note]] links
  BACKLINK = "backlink",                 // Referenced by other notes
  TAG_SIMILARITY = "tag_similarity",     // Shared tags
  CONTENT_SIMILARITY = "content_similarity", // Similar content/topics
  CONCEPT_OVERLAP = "concept_overlap",   // Shared concepts/entities
  SEQUENTIAL = "sequential",             // Related in sequence (MOCs, indexes)
  HIERARCHICAL = "hierarchical"          // Parent-child relationship
}

/**
 * Detailed information about a connection
 */
export interface ConnectionDetails {
  sharedTags?: string[];
  sharedConcepts?: string[];
  linkText?: string;
  contextSnippet?: string;
  similarity?: number;
  matchedTerms?: string[];
}

/**
 * A network of connected notes around a topic
 */
export interface NoteNetwork {
  centerTopic: string;
  nodes: NoteNode[];
  connections: NoteConnection[];
  clusters: NoteCluster[];
  summary: NetworkSummary;
}

/**
 * A node in the note network
 */
export interface NoteNode {
  file: TFile;
  title: string;
  path: string;
  relevanceToTopic: number;
  connectionCount: number;
  nodeType: 'hub' | 'bridge' | 'leaf' | 'isolated';
  concepts: string[];
  tags: string[];
  preview: string;
}

/**
 * A cluster of related notes
 */
export interface NoteCluster {
  id: string;
  theme: string;
  notes: NoteNode[];
  centralConcepts: string[];
  strength: number;
}

/**
 * Summary of the note network
 */
export interface NetworkSummary {
  totalNotes: number;
  totalConnections: number;
  strongestConnections: NoteConnection[];
  keyThemes: string[];
  suggestions: ConnectionSuggestion[];
}

/**
 * Suggestion for new connections
 */
export interface ConnectionSuggestion {
  type: 'missing_link' | 'merge_similar' | 'create_moc' | 'split_topic';
  description: string;
  notes: TFile[];
  reason: string;
  confidence: number;
}

/**
 * Service for discovering and analyzing connections between notes
 */
export class NoteConnectionService {
  private app: App;
  private logger: any;
  private metadataCache: MetadataCache;
  private fileContentCache: Map<string, { content: string; mtime: number }> = new Map();

  constructor(app: App) {
    this.app = app;
    this.metadataCache = app.metadataCache;
    try {
      this.logger = getLogger();
    } catch (error) {
      this.logger = {
        info: () => {},
        debug: () => {},
        warn: () => {},
        error: () => {}
      };
    }
  }

  /**
   * Get file content from cache or read from disk
   */
  private async getCachedFileContent(file: TFile): Promise<string> {
    const cacheKey = file.path;
    const cached = this.fileContentCache.get(cacheKey);
    
    if (cached && cached.mtime === file.stat.mtime) {
      this.logger.debug('NoteConnectionService', `Cache hit for ${file.path}`);
      return cached.content;
    }
    
    this.logger.debug('NoteConnectionService', `Cache miss for ${file.path}, reading from disk`);
    const content = await this.app.vault.read(file);
    this.fileContentCache.set(cacheKey, {
      content,
      mtime: file.stat.mtime
    });
    
    if (this.fileContentCache.size > 100) {
      const firstKey = this.fileContentCache.keys().next().value;
      this.fileContentCache.delete(firstKey);
      this.logger.debug('NoteConnectionService', `Cache evicted entry: ${firstKey}`);
    }
    
    return content;
  }

  /**
   * Clear cache entry for a specific file
   */
  private clearCacheEntry(filePath: string): void {
    this.fileContentCache.delete(filePath);
  }

  /**
   * Connect notes around a specific topic - main entry point
   */
  async connectNotesOnTopic(topic: string): Promise<NoteNetwork> {
    this.logger.info('NoteConnectionService', `Connecting notes on topic: "${topic}"`);
    const startTime = Date.now();
    let cacheHits = 0;
    let cacheMisses = 0;

    try {
      // 1. Find all notes related to the topic
      const relatedNotes = await this.findNotesRelatedToTopic(topic);
      this.logger.debug('NoteConnectionService', `Found ${relatedNotes.length} related notes`);

      // 2. Discover connections between these notes
      const connections = await this.discoverConnections(relatedNotes);
      this.logger.debug('NoteConnectionService', `Discovered ${connections.length} connections`);

      // 3. Build note nodes with connection metadata
      const nodes = this.buildNoteNodes(relatedNotes, connections, topic);

      // 4. Identify clusters of related notes
      const clusters = this.identifyClusters(nodes, connections);

      // 5. Generate network summary and suggestions
      const summary = this.generateNetworkSummary(nodes, connections, clusters);

      const processingTime = Date.now() - startTime;
      const cacheEfficiency = this.fileContentCache.size > 0 ? 
        `Cache: ${this.fileContentCache.size} entries` : 'No cache data';
      this.logger.info('NoteConnectionService', `Built note network in ${processingTime}ms. ${cacheEfficiency}`);

      return {
        centerTopic: topic,
        nodes,
        connections,
        clusters,
        summary
      };
    } catch (error) {
      this.logger.error('NoteConnectionService', 'Failed to connect notes', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Find notes related to a specific topic
   */
  private async findNotesRelatedToTopic(topic: string): Promise<TFile[]> {
    const relatedNotes: TFile[] = [];
    const files = this.app.vault.getMarkdownFiles();
    const topicWords = topic.toLowerCase().split(/\s+/);

    for (const file of files) {
      try {
        const content = await this.getCachedFileContent(file);
        const relevance = this.calculateTopicRelevance(content, file, topicWords);
        
        if (relevance > 0.2) { // Threshold for topic relevance
          relatedNotes.push(file);
        }
      } catch (error) {
        this.logger.warn('NoteConnectionService', `Failed to read file ${file.path}`);
      }
    }

    return relatedNotes.sort((a, b) => {
      // Sort by title relevance first, then by modification date
      const aRelevance = this.titleRelevance(a.basename, topicWords);
      const bRelevance = this.titleRelevance(b.basename, topicWords);
      if (aRelevance !== bRelevance) return bRelevance - aRelevance;
      return b.stat.mtime - a.stat.mtime;
    });
  }

  /**
   * Calculate how relevant a note is to the topic
   */
  private calculateTopicRelevance(content: string, file: TFile, topicWords: string[]): number {
    const contentLower = content.toLowerCase();
    const titleLower = file.basename.toLowerCase();
    let score = 0;

    // Title matches (highest weight)
    for (const word of topicWords) {
      if (titleLower.includes(word)) {
        score += 3.0;
      }
    }

    // Content frequency
    for (const word of topicWords) {
      const matches = (contentLower.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
      score += matches * 0.5;
    }

    // Tag matches
    const tags = this.extractTags(content);
    for (const tag of tags) {
      for (const word of topicWords) {
        if (tag.toLowerCase().includes(word)) {
          score += 2.0;
        }
      }
    }

    // Normalize by content length
    const normalizedScore = score / Math.max(1, Math.log(content.length + 1));
    return Math.min(1.0, normalizedScore / topicWords.length);
  }

  /**
   * Calculate title relevance to topic words
   */
  private titleRelevance(title: string, topicWords: string[]): number {
    const titleLower = title.toLowerCase();
    let matches = 0;
    
    for (const word of topicWords) {
      if (titleLower.includes(word)) {
        matches++;
      }
    }
    
    return matches / topicWords.length;
  }

  /**
   * Discover all connections between a set of notes
   */
  private async discoverConnections(notes: TFile[]): Promise<NoteConnection[]> {
    const connections: NoteConnection[] = [];

    // Check each pair of notes for connections
    for (let i = 0; i < notes.length; i++) {
      for (let j = i + 1; j < notes.length; j++) {
        const noteA = notes[i];
        const noteB = notes[j];
        
        const connectionTypes = await this.analyzeNoteConnectionTypes(noteA, noteB);
        connections.push(...connectionTypes);
      }
    }

    // Sort by connection strength
    return connections.sort((a, b) => b.strength - a.strength);
  }

  /**
   * Analyze connection types between two specific notes
   */
  private async analyzeNoteConnectionTypes(noteA: TFile, noteB: TFile): Promise<NoteConnection[]> {
    const connections: NoteConnection[] = [];

    try {
      const contentA = await this.getCachedFileContent(noteA);
      const contentB = await this.getCachedFileContent(noteB);

      // 1. Direct links
      const directLinks = this.findDirectLinks(noteA, noteB, contentA, contentB);
      connections.push(...directLinks);

      // 2. Tag similarity
      const tagSimilarity = this.findTagSimilarity(noteA, noteB, contentA, contentB);
      if (tagSimilarity) connections.push(tagSimilarity);

      // 3. Content similarity
      const contentSimilarity = this.findContentSimilarity(noteA, noteB, contentA, contentB);
      if (contentSimilarity) connections.push(contentSimilarity);

      // 4. Concept overlap
      const conceptOverlap = this.findConceptOverlap(noteA, noteB, contentA, contentB);
      if (conceptOverlap) connections.push(conceptOverlap);

    } catch (error) {
      this.logger.warn('NoteConnectionService', `Failed to analyze connection between ${noteA.path} and ${noteB.path}`);
    }

    return connections;
  }

  /**
   * Find direct [[links]] between notes
   */
  private findDirectLinks(noteA: TFile, noteB: TFile, contentA: string, contentB: string): NoteConnection[] {
    const connections: NoteConnection[] = [];

    // Check if A links to B
    const linkPattern = new RegExp(`\\[\\[${noteB.basename}(\\|[^\\]]*)?\\]\\]`, 'gi');
    const aToB = contentA.match(linkPattern);
    if (aToB) {
      connections.push({
        sourceNote: { title: noteA.basename, path: noteA.path, file: noteA },
        targetNote: { title: noteB.basename, path: noteB.path, file: noteB },
        connectionType: ConnectionType.DIRECT_LINK,
        strength: 0.9,
        reason: `"${noteA.basename}" directly links to "${noteB.basename}"`,
        details: { linkText: aToB[0] }
      });
    }

    // Check if B links to A
    const linkPatternReverse = new RegExp(`\\[\\[${noteA.basename}(\\|[^\\]]*)?\\]\\]`, 'gi');
    const bToA = contentB.match(linkPatternReverse);
    if (bToA) {
      connections.push({
        sourceNote: { title: noteB.basename, path: noteB.path, file: noteB },
        targetNote: { title: noteA.basename, path: noteA.path, file: noteA },
        connectionType: ConnectionType.DIRECT_LINK,
        strength: 0.9,
        reason: `"${noteB.basename}" directly links to "${noteA.basename}"`,
        details: { linkText: bToA[0] }
      });
    }

    return connections;
  }

  /**
   * Find tag-based similarity between notes
   */
  private findTagSimilarity(noteA: TFile, noteB: TFile, contentA: string, contentB: string): NoteConnection | null {
    const tagsA = this.extractTags(contentA);
    const tagsB = this.extractTags(contentB);

    if (tagsA.length === 0 || tagsB.length === 0) return null;

    const sharedTags = tagsA.filter(tag => tagsB.includes(tag));
    if (sharedTags.length === 0) return null;

    const similarity = sharedTags.length / Math.max(tagsA.length, tagsB.length);
    const strength = Math.min(0.8, similarity * 0.7 + sharedTags.length * 0.1);

    return {
      sourceNote: { title: noteA.basename, path: noteA.path, file: noteA },
      targetNote: { title: noteB.basename, path: noteB.path, file: noteB },
      connectionType: ConnectionType.TAG_SIMILARITY,
      strength,
      reason: `Share ${sharedTags.length} common tag${sharedTags.length > 1 ? 's' : ''}: ${sharedTags.slice(0, 3).map(t => `#${t}`).join(', ')}`,
      details: { sharedTags, similarity }
    };
  }

  /**
   * Find content-based similarity between notes
   */
  private findContentSimilarity(noteA: TFile, noteB: TFile, contentA: string, contentB: string): NoteConnection | null {
    const wordsA = this.extractSignificantWords(contentA);
    const wordsB = this.extractSignificantWords(contentB);

    if (wordsA.length === 0 || wordsB.length === 0) return null;

    const commonWords = wordsA.filter(word => wordsB.includes(word));
    if (commonWords.length < 3) return null; // Need at least 3 common significant words

    const similarity = commonWords.length / Math.max(wordsA.length, wordsB.length);
    const strength = Math.min(0.7, similarity * 0.6 + commonWords.length * 0.02);

    if (strength < 0.3) return null;

    return {
      sourceNote: { title: noteA.basename, path: noteA.path, file: noteA },
      targetNote: { title: noteB.basename, path: noteB.path, file: noteB },
      connectionType: ConnectionType.CONTENT_SIMILARITY,
      strength,
      reason: `Share similar content and concepts`,
      details: { matchedTerms: commonWords.slice(0, 5), similarity }
    };
  }

  /**
   * Find concept overlap between notes
   */
  private findConceptOverlap(noteA: TFile, noteB: TFile, contentA: string, contentB: string): NoteConnection | null {
    const conceptsA = this.extractConcepts(contentA);
    const conceptsB = this.extractConcepts(contentB);

    if (conceptsA.length === 0 || conceptsB.length === 0) return null;

    const sharedConcepts = conceptsA.filter(concept => conceptsB.includes(concept));
    if (sharedConcepts.length === 0) return null;

    const strength = Math.min(0.6, sharedConcepts.length * 0.15 + sharedConcepts.length / Math.max(conceptsA.length, conceptsB.length) * 0.3);

    return {
      sourceNote: { title: noteA.basename, path: noteA.path, file: noteA },
      targetNote: { title: noteB.basename, path: noteB.path, file: noteB },
      connectionType: ConnectionType.CONCEPT_OVERLAP,
      strength,
      reason: `Discuss related concepts: ${sharedConcepts.slice(0, 3).join(', ')}`,
      details: { sharedConcepts }
    };
  }

  /**
   * Extract tags from content
   */
  private extractTags(content: string): string[] {
    const tagRegex = /#[\w\-_]+/g;
    const matches = content.match(tagRegex) || [];
    return matches.map(tag => tag.substring(1)).filter((tag, index, arr) => arr.indexOf(tag) === index);
  }

  /**
   * Extract significant words (filtering out common words)
   */
  private extractSignificantWords(content: string): string[] {
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they']);
    
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word));

    // Count frequency and return most common significant words
    const wordCount = new Map<string, number>();
    words.forEach(word => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });

    return Array.from(wordCount.entries())
      .filter(([_word, count]) => count >= 2) // Must appear at least twice
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word]) => word);
  }

  /**
   * Extract key concepts (capitalized terms, technical terms)
   */
  private extractConcepts(content: string): string[] {
    // Extract capitalized terms (potential proper nouns/concepts)
    const conceptRegex = /\b[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]+)*\b/g;
    const matches = content.match(conceptRegex) || [];
    
    return matches
      .filter(concept => concept.length > 2)
      .filter((concept, index, arr) => arr.indexOf(concept) === index)
      .slice(0, 15);
  }

  /**
   * Build note nodes with connection metadata
   */
  private buildNoteNodes(notes: TFile[], connections: NoteConnection[], topic: string): NoteNode[] {
    return notes.map(file => {
      const nodeConnections = connections.filter(conn => 
        conn.sourceNote.file === file || conn.targetNote.file === file
      );

      return {
        file,
        title: file.basename,
        path: file.path,
        relevanceToTopic: this.calculateNodeRelevance(file, topic),
        connectionCount: nodeConnections.length,
        nodeType: this.determineNodeType(file, nodeConnections, notes.length),
        concepts: [], // Will be populated async if needed
        tags: [], // Will be populated async if needed
        preview: file.basename // Simplified for now
      };
    });
  }

  /**
   * Calculate node relevance to the main topic
   */
  private calculateNodeRelevance(file: TFile, topic: string): number {
    const topicWords = topic.toLowerCase().split(/\s+/);
    return this.titleRelevance(file.basename, topicWords);
  }

  /**
   * Determine the type of node based on connections
   */
  private determineNodeType(file: TFile, connections: NoteConnection[], totalNotes: number): 'hub' | 'bridge' | 'leaf' | 'isolated' {
    const connectionCount = connections.length;
    const connectionRatio = connectionCount / Math.max(1, totalNotes - 1);

    if (connectionCount === 0) return 'isolated';
    if (connectionRatio > 0.6) return 'hub';
    if (connectionRatio > 0.3) return 'bridge';
    return 'leaf';
  }

  /**
   * Identify clusters of related notes
   */
  private identifyClusters(nodes: NoteNode[], connections: NoteConnection[]): NoteCluster[] {
    // Simple clustering based on connection density
    // This could be enhanced with more sophisticated algorithms
    const clusters: NoteCluster[] = [];
    const visited = new Set<string>();

    for (const node of nodes) {
      if (visited.has(node.path)) continue;

      const cluster = this.buildCluster(node, nodes, connections, visited);
      if (cluster.notes.length > 1) {
        clusters.push(cluster);
      }
    }

    return clusters;
  }

  /**
   * Build a cluster starting from a node
   */
  private buildCluster(startNode: NoteNode, allNodes: NoteNode[], connections: NoteConnection[], visited: Set<string>): NoteCluster {
    const clusterNodes: NoteNode[] = [startNode];
    const queue = [startNode];
    visited.add(startNode.path);

    while (queue.length > 0) {
      const currentNode = queue.shift()!;
      
      // Find directly connected nodes
      const connectedNodes = connections
        .filter(conn => {
          const isSource = conn.sourceNote.path === currentNode.path;
          const isTarget = conn.targetNote.path === currentNode.path;
          return (isSource || isTarget) && conn.strength > 0.4; // Strong connections only
        })
        .map(conn => {
          const otherPath = conn.sourceNote.path === currentNode.path 
            ? conn.targetNote.path 
            : conn.sourceNote.path;
          return allNodes.find(node => node.path === otherPath);
        })
        .filter(node => node && !visited.has(node.path)) as NoteNode[];

      for (const connectedNode of connectedNodes) {
        visited.add(connectedNode.path);
        clusterNodes.push(connectedNode);
        queue.push(connectedNode);
      }
    }

    return {
      id: `cluster-${startNode.file.basename.toLowerCase().replace(/\s+/g, '-')}`,
      theme: this.inferClusterTheme(clusterNodes),
      notes: clusterNodes,
      centralConcepts: [],
      strength: this.calculateClusterStrength(clusterNodes, connections)
    };
  }

  /**
   * Infer the main theme of a cluster
   */
  private inferClusterTheme(nodes: NoteNode[]): string {
    // Simple heuristic: use the most common word in titles
    const words = nodes.flatMap(node => 
      node.title.toLowerCase().split(/\s+/).filter(word => word.length > 3)
    );
    
    const wordCount = new Map<string, number>();
    words.forEach(word => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });

    const mostCommon = Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])[0];

    return mostCommon ? mostCommon[0] : 'Mixed Topics';
  }

  /**
   * Calculate cluster strength based on internal connections
   */
  private calculateClusterStrength(nodes: NoteNode[], connections: NoteConnection[]): number {
    const nodePaths = new Set(nodes.map(node => node.path));
    const internalConnections = connections.filter(conn => 
      nodePaths.has(conn.sourceNote.path) && nodePaths.has(conn.targetNote.path)
    );

    const maxPossibleConnections = (nodes.length * (nodes.length - 1)) / 2;
    return internalConnections.length / Math.max(1, maxPossibleConnections);
  }

  /**
   * Generate network summary and suggestions
   */
  private generateNetworkSummary(nodes: NoteNode[], connections: NoteConnection[], clusters: NoteCluster[]): NetworkSummary {
    const strongConnections = connections
      .filter(conn => conn.strength > 0.7)
      .slice(0, 5);

    const keyThemes = clusters
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 3)
      .map(cluster => cluster.theme);

    const suggestions = this.generateConnectionSuggestions(nodes, connections, clusters);

    return {
      totalNotes: nodes.length,
      totalConnections: connections.length,
      strongestConnections: strongConnections,
      keyThemes,
      suggestions
    };
  }

  /**
   * Generate suggestions for improving connections
   */
  private generateConnectionSuggestions(nodes: NoteNode[], connections: NoteConnection[], clusters: NoteCluster[]): ConnectionSuggestion[] {
    const suggestions: ConnectionSuggestion[] = [];

    // Suggest creating links between closely related but unconnected notes
    const isolatedNodes = nodes.filter(node => node.connectionCount === 0);
    if (isolatedNodes.length > 0) {
      suggestions.push({
        type: 'missing_link',
        description: `Connect ${isolatedNodes.length} isolated notes to the network`,
        notes: isolatedNodes.map(node => node.file),
        reason: 'These notes are relevant to the topic but not connected to other notes',
        confidence: 0.7
      });
    }

    // Suggest creating a MOC for large clusters
    const largeClusters = clusters.filter(cluster => cluster.notes.length > 5);
    for (const cluster of largeClusters) {
      suggestions.push({
        type: 'create_moc',
        description: `Create a Map of Content (MOC) for ${cluster.theme}`,
        notes: cluster.notes.map(node => node.file),
        reason: `The ${cluster.theme} cluster has ${cluster.notes.length} notes that could benefit from a central index`,
        confidence: 0.8
      });
    }

    return suggestions.slice(0, 3); // Limit to top 3 suggestions
  }
}
