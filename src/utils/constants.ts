/**
 * Application-wide constants
 */

// Timeout constants (in milliseconds)
export const TIMEOUTS = {
  DEFAULT_CONNECTION_TIMEOUT: 10000,
  DEFAULT_REQUEST_TIMEOUT: 10000,
  GRACEFUL_SHUTDOWN_TIMEOUT: 2000,
  DEFAULT_SERVER_TIMEOUT: 30000,
} as const;

// Retry and backoff constants
export const RETRY_CONFIG = {
  MAX_ATTEMPTS: 3,
  BASE_DELAY: 1000,
  MAX_DELAY: 30000,
  BACKOFF_FACTOR: 2,
} as const;

// LLM configuration constants
export const LLM_DEFAULTS = {
  MAX_TOKENS: 1000,
  TEMPERATURE: 0.1,
  MODEL: 'gpt-4',
} as const;

// Time intervals
export const INTERVALS = {
  CATALOG_UPDATE_INTERVAL: 5 * 60 * 1000, // 5 minutes
  LOG_BUFFER_FLUSH_INTERVAL: 5000, // 5 seconds
} as const;

// Confidence thresholds
export const CONFIDENCE_THRESHOLDS = {
  LOW_CONFIDENCE: 0.3,
  MEDIUM_CONFIDENCE: 0.6,
  HIGH_CONFIDENCE: 0.8,
} as const;

// Version constants
export const VERSION_INFO = {
  PLUGIN_VERSION: '0.1.1',
  MCP_PROTOCOL_VERSION: '2024-11-05',
  CLIENT_NAME: 'obsidian-mcp-bridge',
} as const;