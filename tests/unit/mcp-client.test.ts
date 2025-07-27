import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MCPClient } from '@/core/mcp-client';
import { MCPBridgeSettings } from '@/types/settings';
import { initializeLogger } from '@/utils/logger';

// Mock app for logger
const mockApp = {
  vault: {
    configDir: '/tmp/test-config'
  }
} as any;

vi.mock('@/core/mcp-client', async (importOriginal) => {
  const actual = await importOriginal();
  const mockMCPConnection = vi.fn().mockImplementation(() => {
    const connection = {
      connect: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
      callTool: vi.fn().mockResolvedValue({ result: 'mock response' }),
      getResources: vi.fn().mockResolvedValue([]),
      isReady: () => true,
      on: vi.fn(),
    };
    return connection;
  });

  return {
    ...actual,
    MCPConnection: mockMCPConnection,
  };
});

import { initializeLogger } from '@/utils/logger';

describe('MCPClient', () => {
  let mcpClient: MCPClient;
  let mockSettings: MCPBridgeSettings;
  let mockConnection: any;

  beforeEach(() => {
    const mockApp = {
      vault: {
        configDir: '/tmp/test-config'
      }
    } as any;
    initializeLogger(mockApp);
    
    mockSettings = {
      servers: {
        'test-server': {
          enabled: true,
          name: 'Test Server',
          command: 'test-command',
          args: ['--test'],
          type: 'stdio',
          env: {},
          timeout: 500,
          retryAttempts: 1,
        }
      },
    } as any;

    mockConnection = {
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn(),
      callTool: vi.fn().mockResolvedValue({ result: 'mock response' }),
      getResources: vi.fn().mockResolvedValue([]),
      search: vi.fn(),
    };

    mcpClient = new MCPClient(mockSettings, () => mockConnection);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize successfully with enabled servers', async () => {
      await mcpClient.initialize();
      
      expect(mcpClient.getConnectedServers()).toContain('test-server');
    });

    it('should skip disabled servers during initialization', async () => {
      mockSettings.servers['test-server'].enabled = false;
      mcpClient = new MCPClient(mockSettings, () => mockConnection);
      
      await mcpClient.initialize();
      
      expect(mcpClient.getConnectedServers()).toHaveLength(0);
    });

    it('should handle connection failures gracefully', async () => {
      mockConnection.connect.mockRejectedValue(new Error('Connection failed'));
      mcpClient = new MCPClient(mockSettings, () => mockConnection);

      await mcpClient.initialize();
      
      expect(mcpClient.getConnectedServers()).toHaveLength(0);
    });
  });

  describe('connection management', () => {
    beforeEach(async () => {
      await mcpClient.initialize();
    });

    it('should disconnect all connections', async () => {
      await mcpClient.disconnect();
      
      expect(mcpClient.getConnectedServers()).toHaveLength(0);
    });

    it('should update settings and reinitialize connections', async () => {
      const newSettings = {
        ...mockSettings,
        servers: {
          ...mockSettings.servers,
          'new-server': {
            enabled: true,
            name: 'New Server',
            command: 'new-command',
            args: [],
            type: 'stdio' as const,
            env: {},
            timeout: 5000,
            retryAttempts: 3,
          }
        }
      };

      await mcpClient.updateSettings(newSettings);
      
      expect(mcpClient.getConnectedServers()).toContain('new-server');
    });
  });

  describe('tool operations', () => {
    beforeEach(async () => {
      await mcpClient.initialize();
    });

    it('should call tool on connected server', async () => {
      const result = await mcpClient.callTool('test-server', 'test-tool', { param: 'value' });
      expect(result).toEqual({ result: 'mock response' });
    });

    it('should throw error for non-existent server', async () => {
      await expect(mcpClient.callTool('non-existent', 'test-tool', {}))
        .rejects.toThrow('No connection to server: non-existent');
    });

    it('should search across all connected servers', async () => {
      await mcpClient.searchAcrossServers('test query');
      expect(mockConnection.search).toHaveBeenCalledWith('test query');
    });
  });

  describe('resource operations', () => {
    beforeEach(async () => {
      await mcpClient.initialize();
    });

    it('should list resources for connected server', async () => {
      await mcpClient.getResources('test-server');
      expect(mockConnection.getResources).toHaveBeenCalled();
    });

    it('should throw error for non-existent server resources', async () => {
      await expect(mcpClient.getResources('non-existent'))
        .rejects.toThrow('No connection to server: non-existent');
    });
  });

  describe('server status', () => {
    beforeEach(async () => {
      await mcpClient.initialize();
    });

    it('should check if server is connected', () => {
      const isConnected = mcpClient.isServerConnected('test-server');
      
      expect(isConnected).toBe(true);
    });

    it('should return false for non-existent server', () => {
      const isConnected = mcpClient.isServerConnected('non-existent');
      
      expect(isConnected).toBe(false);
    });
  });
});