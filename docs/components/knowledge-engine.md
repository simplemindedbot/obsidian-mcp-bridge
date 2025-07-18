# KnowledgeEngine Component Documentation

The `KnowledgeEngine` class is responsible for content discovery, analysis, and intelligent recommendations. It coordinates with both the Obsidian vault and MCP servers to provide AI-powered knowledge synthesis.

## Class: KnowledgeEngine

**Location**: `src/knowledge/knowledge-engine.ts`

### Constructor

```typescript
constructor(app: App, mcpClient: MCPClient, settings: MCPBridgeSettings)
```

Creates a new KnowledgeEngine instance.

**Parameters:**
- `app`: `App` - The Obsidian App instance
- `mcpClient`: `MCPClient` - The MCP client for server communication
- `settings`: `MCPBridgeSettings` - Plugin settings

### Properties

#### `app: App`
The Obsidian App instance for vault operations.

#### `mcpClient: MCPClient`
The MCP client for communicating with external servers.

#### `settings: MCPBridgeSettings`
Current plugin settings.

### Methods

#### `discoverRelatedContent(query: string, context?: string): Promise<KnowledgeDiscoveryResult>`

Discovers content related to a search query across both the vault and MCP servers.

**Parameters:**
- `query`: `string` - The search query or topic
- `context`: `string` (optional) - Additional context for the search

**Returns:** `Promise<KnowledgeDiscoveryResult>` - Comprehensive discovery results

**Example:**
```typescript
const results = await engine.discoverRelatedContent('machine learning', 'current note context');
console.log(`Found ${results.vaultResults.length} vault matches`);
console.log(`Found ${results.mcpResults.length} external results`);
```

#### `searchVault(query: string, limit?: number): Promise<VaultSearchResult[]>`

Searches the Obsidian vault for content matching the query.

**Parameters:**
- `query`: `string` - The search query
- `limit`: `number` (optional) - Maximum number of results to return (default: 10)

**Returns:** `Promise<VaultSearchResult[]>` - Array of vault search results

**Example:**
```typescript
const vaultResults = await engine.searchVault('distributed systems', 5);
vaultResults.forEach(result => {
  console.log(`${result.file.name}: ${result.relevanceScore}`);
});
```

#### `searchMCPServers(query: string): Promise<MCPSearchResult[]>`

Searches all connected MCP servers for content matching the query.

**Parameters:**
- `query`: `string` - The search query

**Returns:** `Promise<MCPSearchResult[]>` - Array of MCP search results

**Example:**
```typescript
const mcpResults = await engine.searchMCPServers('recent AI papers');
mcpResults.forEach(result => {
  console.log(`${result.serverId}: ${result.title}`);
});
```

#### `calculateRelevanceScore(content: string, query: string): number`

Calculates a relevance score for content based on the search query.

**Parameters:**
- `content`: `string` - The content to analyze
- `query`: `string` - The search query

**Returns:** `number` - Relevance score between 0 and 1

**Example:**
```typescript
const score = engine.calculateRelevanceScore('This is about machine learning', 'AI research');
console.log(`Relevance score: ${score}`);
```

#### `generateContentSuggestions(currentNote: string, context?: string): Promise<ContentSuggestion[]>`

Generates intelligent content suggestions based on the current note and context.

**Parameters:**
- `currentNote`: `string` - Content of the current note
- `context`: `string` (optional) - Additional context

**Returns:** `Promise<ContentSuggestion[]>` - Array of content suggestions

**Example:**
```typescript
const suggestions = await engine.generateContentSuggestions(currentNoteContent);
suggestions.forEach(suggestion => {
  console.log(`Suggestion: ${suggestion.title} (${suggestion.type})`);
});
```

#### `findRelatedNotes(note: TFile, threshold?: number): Promise<RelatedNote[]>`

Finds notes in the vault that are related to the given note.

**Parameters:**
- `note`: `TFile` - The reference note
- `threshold`: `number` (optional) - Minimum relevance threshold (default: 0.3)

**Returns:** `Promise<RelatedNote[]>` - Array of related notes

**Example:**
```typescript
const relatedNotes = await engine.findRelatedNotes(currentFile, 0.4);
relatedNotes.forEach(note => {
  console.log(`Related: ${note.file.name} (${note.relevanceScore})`);
});
```

#### `synthesizeContent(sources: ContentSource[]): Promise<string>`

Synthesizes content from multiple sources into a coherent summary.

**Parameters:**
- `sources`: `ContentSource[]` - Array of content sources to synthesize

**Returns:** `Promise<string>` - Synthesized content

**Example:**
```typescript
const sources = [
  { content: 'First source content', source: 'vault' },
  { content: 'Second source content', source: 'mcp-server' }
];
const synthesis = await engine.synthesizeContent(sources);
```

#### `extractKeywords(content: string): string[]`

Extracts key terms and phrases from content.

**Parameters:**
- `content`: `string` - The content to analyze

**Returns:** `string[]` - Array of extracted keywords

**Example:**
```typescript
const keywords = engine.extractKeywords('This is a document about machine learning algorithms');
console.log('Keywords:', keywords);
```

#### `categorizeContent(content: string): ContentCategory`

Categorizes content into predefined categories.

**Parameters:**
- `content`: `string` - The content to categorize

**Returns:** `ContentCategory` - The detected category

**Example:**
```typescript
const category = engine.categorizeContent('This is a research paper about neural networks');
console.log('Category:', category);
```

#### `getRecentDiscoveries(limit?: number): Promise<DiscoveryHistory[]>`

Gets recent content discoveries from the history.

**Parameters:**
- `limit`: `number` (optional) - Maximum number of discoveries to return (default: 20)

**Returns:** `Promise<DiscoveryHistory[]>` - Array of recent discoveries

**Example:**
```typescript
const recentDiscoveries = await engine.getRecentDiscoveries(10);
recentDiscoveries.forEach(discovery => {
  console.log(`${discovery.timestamp}: ${discovery.query}`);
});
```

#### `updateSettings(settings: MCPBridgeSettings): void`

Updates the engine settings.

**Parameters:**
- `settings`: `MCPBridgeSettings` - New plugin settings

**Example:**
```typescript
engine.updateSettings(newSettings);
```

## Type Definitions

### `KnowledgeDiscoveryResult`

```typescript
interface KnowledgeDiscoveryResult {
  query: string;
  vaultResults: VaultSearchResult[];
  mcpResults: MCPSearchResult[];
  suggestions: ContentSuggestion[];
  totalResults: number;
  searchTime: number;
}
```

### `VaultSearchResult`

```typescript
interface VaultSearchResult {
  file: TFile;
  content: string;
  relevanceScore: number;
  matchedKeywords: string[];
  excerpt: string;
}
```

### `MCPSearchResult`

```typescript
interface MCPSearchResult {
  serverId: string;
  title: string;
  content: string;
  relevanceScore: number;
  source: string;
  metadata: any;
}
```

### `ContentSuggestion`

```typescript
interface ContentSuggestion {
  title: string;
  type: 'link' | 'content' | 'question' | 'related';
  content: string;
  source: string;
  relevanceScore: number;
  action?: string;
}
```

### `RelatedNote`

```typescript
interface RelatedNote {
  file: TFile;
  relevanceScore: number;
  commonKeywords: string[];
  relationshipType: 'similar' | 'referenced' | 'linked';
}
```

### `ContentSource`

```typescript
interface ContentSource {
  content: string;
  source: string;
  metadata?: any;
}
```

### `ContentCategory`

```typescript
type ContentCategory = 
  | 'research'
  | 'documentation'
  | 'personal'
  | 'project'
  | 'reference'
  | 'idea'
  | 'todo'
  | 'other';
```

### `DiscoveryHistory`

```typescript
interface DiscoveryHistory {
  timestamp: Date;
  query: string;
  resultCount: number;
  context?: string;
}
```

## Search Algorithms

The KnowledgeEngine uses several algorithms for content discovery:

### Relevance Scoring
- **Keyword Matching**: Direct term matching with weight
- **Semantic Similarity**: Context-aware content analysis
- **Recency Bias**: Recent content gets higher scores
- **User Behavior**: Learns from user interactions

### Vault Search
- **Full-text Search**: Searches all note content
- **Metadata Search**: Includes frontmatter and tags
- **Link Analysis**: Considers note relationships
- **Path Analysis**: Includes folder structure

### MCP Integration
- **Multi-server Search**: Queries all connected servers
- **Result Aggregation**: Combines and ranks results
- **Caching**: Optimizes repeated queries
- **Error Handling**: Graceful degradation

## Configuration

The KnowledgeEngine can be configured through plugin settings:

```typescript
{
  "knowledgeEngine": {
    "enableVaultSearch": true,
    "enableMCPSearch": true,
    "relevanceThreshold": 0.3,
    "maxResults": 50,
    "enableCaching": true,
    "cacheTimeout": 300000,
    "enableSuggestions": true,
    "suggestionTypes": ["link", "content", "related"]
  }
}
```

## Best Practices

1. **Use Context**: Provide context when available for better results
2. **Filter Results**: Use relevance thresholds to improve quality
3. **Cache Aggressively**: Enable caching for better performance
4. **Monitor Performance**: Track search times and optimize queries
5. **Handle Errors**: Implement fallbacks for MCP server failures

## Example Usage

```typescript
import { KnowledgeEngine } from './knowledge/knowledge-engine';

// Initialize engine
const engine = new KnowledgeEngine(app, mcpClient, settings);

// Discover related content
const results = await engine.discoverRelatedContent('machine learning');

// Generate suggestions for current note
const suggestions = await engine.generateContentSuggestions(currentNoteContent);

// Find related notes
const relatedNotes = await engine.findRelatedNotes(currentFile);

// Synthesize content from multiple sources
const synthesis = await engine.synthesizeContent(contentSources);
```