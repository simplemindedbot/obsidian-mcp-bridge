import { App } from 'obsidian';
import { MCPBridgeSettings, DEFAULT_SETTINGS } from '@/types/settings';
import { getLogger } from './logger';

export class ConfigManager {
  private app: App;
  private configFileName = 'obsidian-mcp-bridge-config.json';
  private legacyDataFile = 'data.json';

  constructor(app: App) {
    this.app = app;
  }

  private get configPath(): string {
    return `${this.app.vault.configDir}/plugins/obsidian-mcp-bridge/${this.configFileName}`;
  }

  private get legacyDataPath(): string {
    return `${this.app.vault.configDir}/plugins/obsidian-mcp-bridge/${this.legacyDataFile}`;
  }

  async loadSettings(): Promise<MCPBridgeSettings> {
    const logger = getLogger();
    
    try {
      // First, try to load from new config file
      const configExists = await this.app.vault.adapter.exists(this.configPath);
      
      if (configExists) {
        logger.debug('ConfigManager', `Loading settings from ${this.configFileName}`);
        const configContent = await this.app.vault.adapter.read(this.configPath);
        const parsedSettings = JSON.parse(configContent);
        return Object.assign({}, DEFAULT_SETTINGS, parsedSettings);
      }

      // If new config doesn't exist, check for legacy data.json
      const legacyExists = await this.app.vault.adapter.exists(this.legacyDataPath);
      
      if (legacyExists) {
        logger.info('ConfigManager', 'Migrating from legacy data.json to new config file');
        const legacyContent = await this.app.vault.adapter.read(this.legacyDataPath);
        const legacySettings = JSON.parse(legacyContent);
        const settings = Object.assign({}, DEFAULT_SETTINGS, legacySettings);
        
        // Save to new location
        await this.saveSettings(settings);
        
        // Keep legacy file as backup for now
        logger.info('ConfigManager', 'Migration completed. Legacy data.json preserved as backup.');
        
        return settings;
      }

      // If neither exists, return default settings
      logger.info('ConfigManager', 'No existing configuration found, using defaults');
      return { ...DEFAULT_SETTINGS };

    } catch (error) {
      logger.error('ConfigManager', 'Error loading settings', error instanceof Error ? error : new Error(String(error)));
      logger.info('ConfigManager', 'Using default settings due to load error');
      return { ...DEFAULT_SETTINGS };
    }
  }

  async saveSettings(settings: MCPBridgeSettings): Promise<void> {
    const logger = getLogger();
    
    try {
      // Ensure the plugin directory exists
      const pluginDir = `${this.app.vault.configDir}/plugins/obsidian-mcp-bridge`;
      try {
        await this.app.vault.adapter.mkdir(pluginDir);
      } catch (error) {
        // Directory might already exist, ignore
      }

      // Save to new config file
      const configContent = JSON.stringify(settings, null, 2);
      await this.app.vault.adapter.write(this.configPath, configContent);
      
      logger.debug('ConfigManager', `Settings saved to ${this.configFileName}`);
      
    } catch (error) {
      logger.error('ConfigManager', 'Error saving settings', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async getConfigFilePath(): Promise<string> {
    return this.configPath;
  }

  async hasLegacyConfig(): Promise<boolean> {
    return await this.app.vault.adapter.exists(this.legacyDataPath);
  }

  async cleanupLegacyConfig(): Promise<void> {
    const logger = getLogger();
    
    try {
      const legacyExists = await this.app.vault.adapter.exists(this.legacyDataPath);
      if (legacyExists) {
        // Create backup before removing
        const backupPath = `${this.app.vault.configDir}/plugins/obsidian-mcp-bridge/data.json.backup`;
        const legacyContent = await this.app.vault.adapter.read(this.legacyDataPath);
        await this.app.vault.adapter.write(backupPath, legacyContent);
        
        // Remove original
        await this.app.vault.adapter.remove(this.legacyDataPath);
        
        logger.info('ConfigManager', 'Legacy data.json moved to data.json.backup');
      }
    } catch (error) {
      logger.error('ConfigManager', 'Error cleaning up legacy config', error instanceof Error ? error : new Error(String(error)));
    }
  }
}