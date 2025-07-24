import { getLogger } from '@/utils/logger';
import { requestUrl, RequestUrlParam } from 'obsidian';

/**
 * Represents a discovered MCP tool with its capabilities
 */
export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
  examples?: string[];
  serverId: string;
}

/**
 * Represents an available MCP server and its capabilities
 */
export interface MCPServerCatalog {
  serverId: string;
  name: string;
  description: string;
  tools: MCPToolDefinition[];
  resources: MCPResourceInfo[];
  status: 'connected' | 'disconnected' | 'error';
  lastUpdated: Date;
}

interface MCPResourceInfo {
  uri: string;
  name?: string;
  description?: string;
  mimeType?: string;
}

/**
 * Represents the LLM's analysis and routing decision
 */
export interface QueryRoutingPlan {
  intent: string;
  selectedServer: string;
  selectedTool: string;
  parameters: Record<string, unknown>;
  reasoning: string;
  confidence: number;
  fallbackOptions?: QueryRoutingPlan[];
}

/**
 * Configuration for LLM providers
 */
export interface LLMProviderConfig {
  provider: 'openai' | 'anthropic' | 'openai-compatible' | 'local';
  apiKey?: string;
  model: string;
  baseUrl?: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Intelligent LLM-based query router that understands MCP servers and tools
 * and routes user queries to the appropriate server/tool combination
 */
export class LLMQueryRouter {
  private logger = getLogger();
  private serverCatalog: Map<string, MCPServerCatalog> = new Map();
  private llmConfig: LLMProviderConfig;

  constructor(llmConfig: LLMProviderConfig) {
    this.llmConfig = llmConfig;
  }

  /**
   * Update the catalog with information about available MCP servers and tools
   */
  async updateServerCatalog(servers: MCPServerCatalog[]): Promise<void> {
    this.logger.info('LLMQueryRouter', `Updating server catalog with ${servers.length} servers`);
    
    this.serverCatalog.clear();
    for (const server of servers) {
      this.serverCatalog.set(server.serverId, {
        ...server,
        lastUpdated: new Date()
      });
    }

    this.logger.debug('LLMQueryRouter', `Catalog updated: ${Array.from(this.serverCatalog.keys()).join(', ')}`);
  }

  /**
   * Analyze a user query and determine the best routing plan
   */
  async analyzeQuery(query: string): Promise<QueryRoutingPlan> {
    this.logger.info('LLMQueryRouter', `Analyzing query: "${query}"`);

    // Build context about available servers and tools
    const availableCapabilities = this.buildCapabilitiesContext();
    
    // Create LLM prompt for query analysis
    const prompt = this.buildAnalysisPrompt(query, availableCapabilities);
    
    try {
      // Send to LLM for analysis
      const llmResponse = await this.callLLM(prompt);
      
      // Parse LLM response into routing plan
      const routingPlan = this.parseLLMResponse(llmResponse);
      
      this.logger.info('LLMQueryRouter', `Routed to ${routingPlan.selectedServer}:${routingPlan.selectedTool} (confidence: ${routingPlan.confidence})`);
      
      return routingPlan;
    } catch (error) {
      this.logger.error('LLMQueryRouter', 'Failed to analyze query', error instanceof Error ? error : new Error(String(error)));
      
      // Fallback to basic analysis
      return this.fallbackAnalysis(query);
    }
  }

  /**
   * Get information about available servers and tools
   */
  getAvailableCapabilities(): MCPServerCatalog[] {
    return Array.from(this.serverCatalog.values());
  }

  /**
   * Build context string describing available MCP capabilities
   */
  private buildCapabilitiesContext(): string {
    const capabilities: string[] = [];
    
    for (const server of this.serverCatalog.values()) {
      if (server.status !== 'connected') continue;
      
      const serverSection = [
        `Server: ${server.name} (${server.serverId})`,
        `Description: ${server.description}`,
        `Tools:`
      ];
      
      for (const tool of server.tools) {
        serverSection.push(`  - ${tool.name}: ${tool.description}`);
        if (tool.examples && tool.examples.length > 0) {
          serverSection.push(`    Examples: ${tool.examples.join(', ')}`);
        }
      }
      
      capabilities.push(serverSection.join('\\n'));
    }
    
    return capabilities.join('\\n\\n');
  }

  /**
   * Build the LLM prompt for query analysis
   */
  private buildAnalysisPrompt(query: string, capabilities: string): string {
    const connectedCount = this.serverCatalog.size;
    const availableServers = Array.from(this.serverCatalog.keys());
    
    return `You are an intelligent query router for MCP (Model Context Protocol) servers. Your job is to analyze user queries and determine which MCP server and tool should handle the request.

Currently Connected Servers: ${connectedCount} (${availableServers.join(', ')})

Available MCP Capabilities:
${capabilities}

User Query: "${query}"

Analyze this query and respond with a JSON object containing:
{
  "intent": "Brief description of what the user wants to do",
  "selectedServer": "The server ID that should handle this request", 
  "selectedTool": "The specific tool name to use",
  "parameters": "Object with parameters to pass to the tool",
  "reasoning": "Explanation of why you chose this server/tool",
  "confidence": "Number between 0-1 indicating confidence in this routing decision"
}

Important guidelines:
- Only use servers and tools that are listed in the available capabilities above
- Extract specific parameters from the query (file paths, search terms, etc.)
- If the query is ambiguous, choose the most likely interpretation
- If no good match exists, set confidence to 0 and explain in reasoning
- For file operations, prefer filesystem servers  
- For Git operations, prefer git servers
- For web search operations, prefer brave-search or web-search servers
- For database operations, prefer sqlite servers
- Consider the specific tools each server provides when making routing decisions

Server Routing Preferences:
- filesystem: file/directory operations (list_directory, read_file, write_file, search_files)
- git: version control operations (git_status, git_log, git_diff, git_commit)
- brave-search/web-search: web searches and online information lookup
- sqlite: database queries and data operations

Respond with only valid JSON.`;
  }

  /**
   * Call the configured LLM provider
   */
  private async callLLM(prompt: string): Promise<string> {
    switch (this.llmConfig.provider) {
      case 'openai':
        return this.callOpenAI(prompt);
      case 'openai-compatible':
        return this.callOpenAICompatible(prompt);
      case 'anthropic':
        return this.callAnthropic(prompt);
      case 'local':
        return this.callLocalLLM(prompt);
      default:
        throw new Error(`Unsupported LLM provider: ${this.llmConfig.provider}`);
    }
  }

  /**
   * Call OpenAI API using Obsidian's requestUrl to bypass CORS
   */
  private async callOpenAI(prompt: string): Promise<string> {
    if (!this.llmConfig.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const requestData: RequestUrlParam = {
      url: 'https://api.openai.com/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.llmConfig.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.llmConfig.model || 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: this.llmConfig.maxTokens || 1000,
        temperature: this.llmConfig.temperature || 0.1,
      }),
    };

    const response = await requestUrl(requestData);

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`OpenAI API error: ${response.status} ${response.text}`);
    }

    const data = response.json;
    return data.choices[0]?.message?.content || '';
  }

  /**
   * Call OpenAI-compatible API (OpenRouter, local servers, etc.) using custom baseUrl
   */
  private async callOpenAICompatible(prompt: string): Promise<string> {
    if (!this.llmConfig.apiKey) {
      throw new Error('API key not configured for OpenAI-compatible service');
    }

    if (!this.llmConfig.baseUrl) {
      throw new Error('Base URL must be configured for OpenAI-compatible services');
    }

    // Ensure baseUrl ends with the correct path
    let apiUrl = this.llmConfig.baseUrl;
    if (!apiUrl.endsWith('/chat/completions')) {
      apiUrl = apiUrl.replace(/\/+$/, '') + '/v1/chat/completions';
    }

    const requestData: RequestUrlParam = {
      url: apiUrl,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.llmConfig.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.llmConfig.model || 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: this.llmConfig.maxTokens || 1000,
        temperature: this.llmConfig.temperature || 0.1,
      }),
    };

    const response = await requestUrl(requestData);

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`OpenAI-compatible API error: ${response.status} ${response.text}`);
    }

    const data = response.json;
    return data.choices[0]?.message?.content || '';
  }

  /**
   * Call Anthropic API using Obsidian's requestUrl to bypass CORS
   */
  private async callAnthropic(prompt: string): Promise<string> {
    if (!this.llmConfig.apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    const requestData: RequestUrlParam = {
      url: 'https://api.anthropic.com/v1/messages',
      method: 'POST',
      headers: {
        'x-api-key': this.llmConfig.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.llmConfig.model || 'claude-3-sonnet-20240229',
        max_tokens: this.llmConfig.maxTokens || 1000,
        messages: [{ role: 'user', content: prompt }],
        temperature: this.llmConfig.temperature || 0.1,
      }),
    };

    const response = await requestUrl(requestData);

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Anthropic API error: ${response.status} ${response.text}`);
    }

    const data = response.json;
    return data.content[0]?.text || '';
  }

  /**
   * Call local LLM (placeholder for local model integration)
   */
  private async callLocalLLM(_prompt: string): Promise<string> {
    // This could integrate with local models via:
    // - Ollama API
    // - Hugging Face transformers
    // - Local OpenAI-compatible API
    throw new Error('Local LLM integration not yet implemented');
  }

  /**
   * Parse LLM response into routing plan
   */
  private parseLLMResponse(response: string): QueryRoutingPlan {
    try {
      // Clean up response (remove markdown code blocks if present)
      const cleanResponse = response.replace(/```json\\n?|```\\n?/g, '').trim();
      
      const parsed = JSON.parse(cleanResponse);
      
      // Validate required fields
      if (!parsed.selectedServer || !parsed.selectedTool) {
        throw new Error('Invalid LLM response: missing required fields');
      }
      
      // Validate server exists
      if (!this.serverCatalog.has(parsed.selectedServer)) {
        throw new Error(`Invalid server: ${parsed.selectedServer}`);
      }
      
      // Validate tool exists on server
      const server = this.serverCatalog.get(parsed.selectedServer);
      if (!server) {
        throw new Error(`Server not found: ${parsed.selectedServer}`);
      }
      const toolExists = server.tools.some(tool => tool.name === parsed.selectedTool);
      if (!toolExists) {
        throw new Error(`Tool ${parsed.selectedTool} not found on server ${parsed.selectedServer}`);
      }
      
      return {
        intent: parsed.intent || 'Unknown intent',
        selectedServer: parsed.selectedServer,
        selectedTool: parsed.selectedTool,
        parameters: parsed.parameters || {},
        reasoning: parsed.reasoning || 'No reasoning provided',
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0)),
        fallbackOptions: parsed.fallbackOptions || [],
      };
    } catch (error) {
      this.logger.error('LLMQueryRouter', 'Failed to parse LLM response', error instanceof Error ? error : new Error(String(error)));
      this.logger.debug('LLMQueryRouter', `Raw response: ${response}`);
      
      throw new Error(`Failed to parse LLM response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Fallback analysis when LLM is unavailable
   */
  private fallbackAnalysis(query: string): QueryRoutingPlan {
    this.logger.warn('LLMQueryRouter', 'Using fallback analysis for query');
    
    const queryLower = query.toLowerCase();
    
    // Simple heuristics as fallback - check multiple server types
    for (const server of this.serverCatalog.values()) {
      if (server.status !== 'connected') continue;
      
      // Git operations
      if (server.serverId === 'git' && 
          (queryLower.includes('git') || queryLower.includes('commit') || 
           queryLower.includes('status') || queryLower.includes('log') ||
           queryLower.includes('diff') || queryLower.includes('branch'))) {
        
        let toolName = 'git_status';
        let parameters = {};
        
        if (queryLower.includes('log') || queryLower.includes('history')) {
          toolName = 'git_log';
        } else if (queryLower.includes('diff')) {
          toolName = 'git_diff';
        }
        
        return {
          intent: 'Git operation',
          selectedServer: server.serverId,
          selectedTool: toolName,
          parameters,
          reasoning: 'Fallback heuristic analysis for Git operations',
          confidence: 0.6,
        };
      }
      
      // Web search operations
      if ((server.serverId === 'brave-search' || server.serverId === 'web-search') && 
          (queryLower.includes('search') || queryLower.includes('find') || 
           queryLower.includes('lookup') || queryLower.includes('web'))) {
        
        const searchMatch = query.match(/(?:search|find|lookup)\\s+(.+)/i);
        const searchTerm = searchMatch ? searchMatch[1].trim() : query;
        
        return {
          intent: 'Web search',
          selectedServer: server.serverId,
          selectedTool: 'search',
          parameters: { query: searchTerm },
          reasoning: 'Fallback heuristic analysis for web search',
          confidence: 0.7,
        };
      }
      
      // Filesystem operations
      if (server.serverId === 'filesystem' && 
          (queryLower.includes('file') || queryLower.includes('directory') || 
           queryLower.includes('read') || queryLower.includes('write') ||
           queryLower.includes('list') || queryLower.includes('ls'))) {
        
        let toolName = 'list_directory';
        let parameters: Record<string, unknown> = { path: '.' };
        
        if (queryLower.includes('read') || queryLower.includes('open')) {
          toolName = 'read_file';
          const pathMatch = query.match(/(?:read|open)\\s+([^\\s]+)/i);
          if (pathMatch) {
            parameters = { path: pathMatch[1] };
          }
        } else if (queryLower.includes('write') || queryLower.includes('create')) {
          toolName = 'write_file';
          const writeMatch = query.match(/(?:write|create)\\s+(.+)\\s+with\\s+(.+)/i);
          if (writeMatch) {
            parameters = { path: writeMatch[1].trim(), content: writeMatch[2].trim() };
          }
        } else if (queryLower.includes('search') || queryLower.includes('find')) {
          toolName = 'search_files';
          const searchMatch = query.match(/(?:search|find)\\s+(.+)/i);
          if (searchMatch) {
            parameters = { path: '.', pattern: searchMatch[1].trim() };
          }
        }
        
        return {
          intent: 'Filesystem operation',
          selectedServer: server.serverId,
          selectedTool: toolName,
          parameters,
          reasoning: 'Fallback heuristic analysis for filesystem operations',
          confidence: 0.5,
        };
      }
      
      // SQLite operations
      if (server.serverId === 'sqlite' && 
          (queryLower.includes('database') || queryLower.includes('query') || 
           queryLower.includes('sql') || queryLower.includes('table'))) {
        
        return {
          intent: 'Database operation',
          selectedServer: server.serverId,
          selectedTool: 'query',
          parameters: { sql: query },
          reasoning: 'Fallback heuristic analysis for database operations',
          confidence: 0.6,
        };
      }
    }
    
    // If no specific server matches, try to use any available server
    const connectedServers = Array.from(this.serverCatalog.values()).filter(s => s.status === 'connected');
    if (connectedServers.length > 0) {
      const firstServer = connectedServers[0];
      if (firstServer.tools.length > 0) {
        return {
          intent: 'General query',
          selectedServer: firstServer.serverId,
          selectedTool: firstServer.tools[0].name,
          parameters: { query },
          reasoning: `No specific match found, using first available server (${firstServer.serverId}) and tool (${firstServer.tools[0].name})`,
          confidence: 0.2,
        };
      }
    }
    
    return {
      intent: 'Unknown',
      selectedServer: '',
      selectedTool: '',
      parameters: {},
      reasoning: 'No suitable server/tool found in fallback analysis',
      confidence: 0,
    };
  }
}