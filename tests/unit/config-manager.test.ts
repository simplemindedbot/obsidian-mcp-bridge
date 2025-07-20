import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConfigManager } from '@/utils/config-manager';
import { DEFAULT_SETTINGS } from '@/types/settings';
import { initializeLogger } from '@/utils/logger';

// Mock app for tests
const mockApp = {
  vault: {
    configDir: '/tmp/test-config',
    adapter: {
      exists: vi.fn(),
      read: vi.fn(),
      write: vi.fn(),
      mkdir: vi.fn(),
      remove: vi.fn()
    }
  }
} as any;

describe('ConfigManager', () => {
  let configManager: ConfigManager;

  beforeEach(() => {
    // Initialize logger for tests
    initializeLogger(mockApp);
    
    configManager = new ConfigManager(mockApp);
    
    // Reset all mocks
    vi.clearAllMocks();
  });

  describe('loadSettings', () => {
    it('should load settings from new config file when it exists', async () => {
      const mockSettings = {
        ...DEFAULT_SETTINGS,
        servers: {
          'test-server': {
            name: 'Test Server',
            command: 'test-cmd',
            args: ['--test'],
            enabled: true,
            type: 'stdio' as const
          }
        }
      };

      mockApp.vault.adapter.exists
        .mockResolvedValueOnce(true) // New config exists
        .mockResolvedValueOnce(false); // Legacy doesn't exist
      
      mockApp.vault.adapter.read.mockResolvedValue(JSON.stringify(mockSettings));

      const result = await configManager.loadSettings();

      expect(mockApp.vault.adapter.exists).toHaveBeenCalledWith(
        '/tmp/test-config/plugins/obsidian-mcp-bridge/obsidian-mcp-bridge-config.json'
      );
      expect(result.servers['test-server'].name).toBe('Test Server');
    });

    it('should migrate from legacy data.json when new config does not exist', async () => {
      const legacySettings = {
        servers: {
          'legacy-server': {
            name: 'Legacy Server',
            command: 'legacy-cmd',
            args: ['--legacy'],
            enabled: false,
            type: 'stdio' as const
          }
        }
      };

      // Set up mocks correctly - new config doesn't exist, legacy does
      mockApp.vault.adapter.exists.mockImplementation((path: string) => {
        if (path.includes('obsidian-mcp-bridge-config.json')) {
          return Promise.resolve(false); // New config doesn't exist
        }
        if (path.includes('data.json')) {
          return Promise.resolve(true);  // Legacy exists
        }
        return Promise.resolve(false);
      });
      
      mockApp.vault.adapter.read.mockResolvedValue(JSON.stringify(legacySettings));
      mockApp.vault.adapter.write.mockResolvedValue(undefined);
      mockApp.vault.adapter.mkdir.mockResolvedValue(undefined);

      const result = await configManager.loadSettings();

      expect(mockApp.vault.adapter.write).toHaveBeenCalled();
      expect(result.servers['legacy-server'].name).toBe('Legacy Server');
    });

    it('should return default settings when no config files exist', async () => {
      mockApp.vault.adapter.exists.mockResolvedValue(false);

      const result = await configManager.loadSettings();

      expect(result).toMatchObject({
        version: DEFAULT_SETTINGS.version,
        servers: {},
        defaultTimeout: DEFAULT_SETTINGS.defaultTimeout
      });
    });

    it('should handle JSON parsing errors gracefully', async () => {
      mockApp.vault.adapter.exists.mockResolvedValueOnce(true);
      mockApp.vault.adapter.read.mockResolvedValue('invalid json{');

      const result = await configManager.loadSettings();

      expect(result).toEqual(DEFAULT_SETTINGS);
    });
  });

  describe('saveSettings', () => {
    it('should save settings to new config file', async () => {
      const settings = {
        ...DEFAULT_SETTINGS,
        servers: {
          'new-server': {
            name: 'New Server',
            command: 'new-cmd',
            args: ['--new'],
            enabled: true,
            type: 'stdio' as const
          }
        }
      };

      mockApp.vault.adapter.mkdir.mockResolvedValue(undefined);
      mockApp.vault.adapter.write.mockResolvedValue(undefined);

      await configManager.saveSettings(settings);

      expect(mockApp.vault.adapter.write).toHaveBeenCalledWith(
        '/tmp/test-config/plugins/obsidian-mcp-bridge/obsidian-mcp-bridge-config.json',
        JSON.stringify(settings, null, 2)
      );
    });
  });

  describe('hasLegacyConfig', () => {
    it('should return true when legacy config exists', async () => {
      mockApp.vault.adapter.exists.mockResolvedValue(true);

      const result = await configManager.hasLegacyConfig();

      expect(result).toBe(true);
      expect(mockApp.vault.adapter.exists).toHaveBeenCalledWith(
        '/tmp/test-config/plugins/obsidian-mcp-bridge/data.json'
      );
    });

    it('should return false when legacy config does not exist', async () => {
      mockApp.vault.adapter.exists.mockResolvedValue(false);

      const result = await configManager.hasLegacyConfig();

      expect(result).toBe(false);
    });
  });

  describe('cleanupLegacyConfig', () => {
    it('should backup and remove legacy config file', async () => {
      const legacyContent = '{"servers": {}}';
      
      mockApp.vault.adapter.exists.mockResolvedValue(true);
      mockApp.vault.adapter.read.mockResolvedValue(legacyContent);
      mockApp.vault.adapter.write.mockResolvedValue(undefined);
      mockApp.vault.adapter.remove.mockResolvedValue(undefined);

      await configManager.cleanupLegacyConfig();

      expect(mockApp.vault.adapter.write).toHaveBeenCalledWith(
        '/tmp/test-config/plugins/obsidian-mcp-bridge/data.json.backup',
        legacyContent
      );
      expect(mockApp.vault.adapter.remove).toHaveBeenCalledWith(
        '/tmp/test-config/plugins/obsidian-mcp-bridge/data.json'
      );
    });
  });
});