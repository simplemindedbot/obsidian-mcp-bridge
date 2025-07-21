import { spawn, ChildProcess } from 'child_process';
import { getLogger } from '@/utils/logger';

interface CustomStdioTransportOptions {
  command: string;
  args: string[];
  env?: Record<string, string>;
  workingDirectory?: string;
}

/**
 * Custom stdio transport that works better in Obsidian/Electron environment
 * Bypasses the MCP SDK's StdioClientTransport which has compatibility issues
 */
export class CustomStdioTransport {
  private process: ChildProcess | null = null;
  private connected = false;
  private messageId = 1;
  private pendingRequests = new Map<number, { resolve: (value: any) => void; reject: (error: Error) => void }>();
  private logger = getLogger();

  constructor(private options: CustomStdioTransportOptions) {}

  async connect(): Promise<void> {
    this.logger.info('CustomStdioTransport', `Starting process: ${this.options.command} ${this.options.args.join(' ')}`);
    
    this.process = spawn(this.options.command, this.options.args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        ...(this.options.env || {}),
        // Ensure npm/npx can access global packages and find node
        NODE_PATH: process.env.NODE_PATH || '',
        PATH: `/Users/scotcampbell/.nvm/versions/node/v22.17.0/bin:${process.env.PATH || ''}`,
      },
      cwd: this.options.workingDirectory || process.cwd(),
      shell: true, // Use shell to ensure proper environment
    });

    return new Promise((resolve, reject) => {
      if (!this.process) {
        reject(new Error('Failed to create process'));
        return;
      }

      // Handle process errors
      this.process.on('error', (error) => {
        this.logger.error('CustomStdioTransport', 'Process error', error);
        reject(error);
      });

      this.process.on('exit', (code, signal) => {
        if (signal === 'SIGTERM') {
          this.logger.debug('CustomStdioTransport', `Process terminated gracefully (${signal})`);
        } else {
          this.logger.info('CustomStdioTransport', `Process exited with code ${code}, signal ${signal}`);
        }
        this.connected = false;
      });

      // Setup stdout handler for responses
      let buffer = '';
      this.process.stdout?.on('data', (data) => {
        buffer += data.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.trim()) {
            this.handleMessage(line.trim());
          }
        }
      });

      // Setup stderr handler for debugging
      this.process.stderr?.on('data', (data) => {
        const message = data.toString().trim();
        if (message) {
          if (message.includes('running on stdio')) {
            this.logger.debug('CustomStdioTransport', `Server info: ${message}`);
          } else {
            this.logger.error('CustomStdioTransport', `Server stderr: ${message}`);
          }
        }
      });

      // Send initialization message
      this.sendInitialize()
        .then(() => {
          this.connected = true;
          this.logger.info('CustomStdioTransport', 'Successfully initialized MCP connection');
          resolve();
        })
        .catch(reject);
    });
  }

  private async sendInitialize(): Promise<any> {
    const initMessage = {
      jsonrpc: '2.0',
      id: this.messageId++,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
          resources: {},
        },
        clientInfo: {
          name: 'obsidian-mcp-bridge',
          version: '0.1.1',
        },
      },
    };

    return this.sendMessage(initMessage);
  }

  private sendMessage(message: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.process || !this.process.stdin) {
        reject(new Error('Transport not connected'));
        return;
      }

      const messageStr = JSON.stringify(message) + '\n';
      this.logger.debug('CustomStdioTransport', `Sending: ${messageStr.trim()}`);

      // Store pending request if it has an ID
      if (message.id) {
        this.pendingRequests.set(message.id, { resolve, reject });
        
        // Set timeout for request
        setTimeout(() => {
          if (this.pendingRequests.has(message.id)) {
            this.pendingRequests.delete(message.id);
            reject(new Error(`Request timeout for message ID ${message.id}`));
          }
        }, 10000);
      }

      this.process.stdin.write(messageStr, (error) => {
        if (error) {
          this.logger.error('CustomStdioTransport', 'Failed to write message', error);
          if (message.id) {
            this.pendingRequests.delete(message.id);
          }
          reject(error);
        } else if (!message.id) {
          // For messages without ID (notifications), resolve immediately
          resolve(undefined);
        }
      });
    });
  }

  private handleMessage(messageStr: string): void {
    try {
      const message = JSON.parse(messageStr);
      this.logger.debug('CustomStdioTransport', `Received: ${messageStr}`);

      // Handle response to pending request
      if (message.id && this.pendingRequests.has(message.id)) {
        const { resolve, reject } = this.pendingRequests.get(message.id)!;
        this.pendingRequests.delete(message.id);

        if (message.error) {
          reject(new Error(`MCP Error: ${message.error.message || 'Unknown error'}`));
        } else {
          resolve(message.result || message);
        }
      }
    } catch (error) {
      this.logger.error('CustomStdioTransport', 'Failed to parse message', error instanceof Error ? error : new Error(String(error)));
      this.logger.debug('CustomStdioTransport', `Raw message: ${messageStr}`);
    }
  }

  async callTool(name: string, parameters: any = {}): Promise<any> {
    const message = {
      jsonrpc: '2.0',
      id: this.messageId++,
      method: 'tools/call',
      params: {
        name,
        arguments: parameters,
      },
    };

    return this.sendMessage(message);
  }

  async listTools(): Promise<any> {
    const message = {
      jsonrpc: '2.0',
      id: this.messageId++,
      method: 'tools/list',
      params: {},
    };

    return this.sendMessage(message);
  }

  async listResources(): Promise<any> {
    const message = {
      jsonrpc: '2.0',
      id: this.messageId++,
      method: 'resources/list',
      params: {},
    };

    return this.sendMessage(message);
  }

  async readResource(uri: string): Promise<any> {
    const message = {
      jsonrpc: '2.0',
      id: this.messageId++,
      method: 'resources/read',
      params: {
        uri,
      },
    };

    return this.sendMessage(message);
  }

  async callMethod(method: string, params: any = {}): Promise<any> {
    const message = {
      jsonrpc: '2.0',
      id: this.messageId++,
      method,
      params,
    };

    return this.sendMessage(message);
  }

  async disconnect(): Promise<void> {
    if (this.process) {
      // Gracefully terminate the process
      this.process.kill('SIGTERM');
      
      // Give process time to exit gracefully, then force kill if needed
      setTimeout(() => {
        if (this.process && !this.process.killed) {
          this.logger.debug('CustomStdioTransport', 'Force killing unresponsive process');
          this.process.kill('SIGKILL');
        }
      }, 2000);
      
      this.process = null;
    }
    this.connected = false;
    this.pendingRequests.clear();
    this.logger.debug('CustomStdioTransport', 'Disconnected');
  }

  isConnected(): boolean {
    return this.connected && this.process !== null;
  }
}