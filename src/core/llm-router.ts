import { getLogger } from '@/utils/logger';

/**
 * Represents a discovered MCP tool with its capabilities
 */
export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
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
  resources: any[];
  status: 'connected' | 'disconnected' | 'error';
  lastUpdated: Date;
}

/**
 * Represents the LLM's analysis and routing decision
 */
export interface QueryRoutingPlan {
  intent: string;
  selectedServer: string;
  selectedTool: string;
  parameters: Record<string, any>;
  reasoning: string;
  confidence: number;
  fallbackOptions?: QueryRoutingPlan[];
}

/**
 * Configuration for LLM providers
 */
export interface LLMProviderConfig {
  provider: 'openai' | 'anthropic' | 'local';
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
    return `You are an intelligent query router for MCP (Model Context Protocol) servers. Your job is to analyze user queries and determine which MCP server and tool should handle the request.

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
- Only use servers and tools that are listed in the available capabilities
- Extract specific parameters from the query (file paths, search terms, etc.)
- If the query is ambiguous, choose the most likely interpretation
- If no good match exists, set confidence to 0 and explain in reasoning
- For file operations, prefer filesystem servers
- For search operations, prefer search-capable servers

Respond with only valid JSON.`;
  }

  /**
   * Call the configured LLM provider
   */
  private async callLLM(prompt: string): Promise<string> {
    switch (this.llmConfig.provider) {
      case 'openai':
        return this.callOpenAI(prompt);
      case 'anthropic':
        return this.callAnthropic(prompt);
      case 'local':
        return this.callLocalLLM(prompt);
      default:
        throw new Error(`Unsupported LLM provider: ${this.llmConfig.provider}`);
    }
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(prompt: string): Promise<string> {
    if (!this.llmConfig.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  /**
   * Call Anthropic API
   */
  private async callAnthropic(prompt: string): Promise<string> {
    if (!this.llmConfig.apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
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
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
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
      const server = this.serverCatalog.get(parsed.selectedServer)!;
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
    
    // Simple heuristics as fallback
    for (const server of this.serverCatalog.values()) {
      if (server.status !== 'connected') continue;
      
      // Filesystem operations
      if (server.serverId === 'filesystem' && 
          (queryLower.includes('file') || queryLower.includes('directory') || 
           queryLower.includes('read') || queryLower.includes('write') ||
           queryLower.includes('list') || queryLower.includes('search'))) {
        
        let toolName = 'list_directory';
        let parameters = { path: '.' };
        
        if (queryLower.includes('read') || queryLower.includes('open')) {
          toolName = 'read_file';
          // Try to extract file path
          const pathMatch = query.match(/(?:read|open)\\s+([^\\s]+)/i);
          if (pathMatch) {
            parameters = { path: pathMatch[1] };
          }
        }
        
        return {
          intent: 'Filesystem operation',
          selectedServer: server.serverId,
          selectedTool: toolName,
          parameters,
          reasoning: 'Fallback heuristic analysis',
          confidence: 0.5,
        };
      }
    }
    
    return {
      intent: 'Unknown',
      selectedServer: '',
      selectedTool: '',
      parameters: {},
      reasoning: 'No suitable server/tool found',
      confidence: 0,
    };
  }
}