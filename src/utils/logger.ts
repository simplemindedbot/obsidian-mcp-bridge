import { App } from "obsidian";

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  component: string;
  message: string;
  error?: Error;
  metadata?: any;
}

export class Logger {
  private app: App;
  private enableFileLogging: boolean = false;
  private enableConsoleLogging: boolean = true;
  private logLevel: LogLevel = LogLevel.INFO;
  private logFilePath: string;
  private maxLogFileSize: number = 10 * 1024 * 1024; // 10MB
  private maxLogFiles: number = 5;
  private logBuffer: LogEntry[] = [];
  private bufferFlushInterval: number = 5000; // 5 seconds
  private flushTimer?: ReturnType<typeof setInterval>;

  constructor(app: App) {
    this.app = app;
    this.logFilePath = `${app.vault.configDir}/plugins/obsidian-mcp-bridge/logs/mcp-bridge.log`;
    this.startBufferFlush();
  }

  configure(settings: {
    enableFileLogging?: boolean;
    enableConsoleLogging?: boolean;
    logLevel?: LogLevel;
    logFilePath?: string;
    maxLogFileSize?: number;
  }) {
    this.enableFileLogging =
      settings.enableFileLogging ?? this.enableFileLogging;
    this.enableConsoleLogging =
      settings.enableConsoleLogging ?? this.enableConsoleLogging;
    this.logLevel = settings.logLevel ?? this.logLevel;
    this.logFilePath = settings.logFilePath ?? this.logFilePath;
    this.maxLogFileSize = settings.maxLogFileSize ?? this.maxLogFileSize;
  }

  private startBufferFlush() {
    this.flushTimer = setInterval(() => {
      this.flushBuffer();
    }, this.bufferFlushInterval);
  }

  private async flushBuffer() {
    if (this.logBuffer.length === 0 || !this.enableFileLogging) {
      return;
    }

    const entries = [...this.logBuffer];
    this.logBuffer = [];

    try {
      await this.writeToFile(entries);
    } catch (error) {
      console.error("MCP Bridge Logger: Failed to write to log file:", error);
      // Re-add entries to buffer for retry
      this.logBuffer.unshift(...entries);
    }
  }

  private async writeToFile(entries: LogEntry[]) {
    const logDir = this.logFilePath.substring(
      0,
      this.logFilePath.lastIndexOf("/"),
    );

    // Ensure log directory exists
    try {
      await this.app.vault.adapter.mkdir(logDir);
    } catch (error) {
      // Directory might already exist
    }

    // Check if we need to rotate logs
    await this.rotateLogsIfNeeded();

    // Format log entries
    const logLines =
      entries.map((entry) => this.formatLogEntry(entry)).join("\n") + "\n";

    try {
      // Check if file exists
      const exists = await this.app.vault.adapter.exists(this.logFilePath);

      if (exists) {
        // Append to existing file
        const currentContent = await this.app.vault.adapter.read(
          this.logFilePath,
        );
        await this.app.vault.adapter.write(
          this.logFilePath,
          currentContent + logLines,
        );
      } else {
        // Create new file
        await this.app.vault.adapter.write(this.logFilePath, logLines);
      }
    } catch (error) {
      console.error("MCP Bridge Logger: Failed to write log entries:", error);
      throw error;
    }
  }

  private async rotateLogsIfNeeded() {
    try {
      const exists = await this.app.vault.adapter.exists(this.logFilePath);
      if (!exists) return;

      const stat = await this.app.vault.adapter.stat(this.logFilePath);
      if (stat && stat.size > this.maxLogFileSize) {
        await this.rotateLogs();
      }
    } catch (error) {
      console.error("MCP Bridge Logger: Failed to check log file size:", error);
    }
  }

  private async rotateLogs() {
    const logDir = this.logFilePath.substring(
      0,
      this.logFilePath.lastIndexOf("/"),
    );
    const logFileName = this.logFilePath.substring(
      this.logFilePath.lastIndexOf("/") + 1,
    );
    const baseName = logFileName.replace(".log", "");

    try {
      // Rotate existing log files
      for (let i = this.maxLogFiles - 1; i >= 1; i--) {
        const oldFile = `${logDir}/${baseName}.${i}.log`;
        const newFile = `${logDir}/${baseName}.${i + 1}.log`;

        const exists = await this.app.vault.adapter.exists(oldFile);
        if (exists) {
          if (i === this.maxLogFiles - 1) {
            // Delete the oldest file
            await this.app.vault.adapter.remove(oldFile);
          } else {
            // Rename to next number
            const content = await this.app.vault.adapter.read(oldFile);
            await this.app.vault.adapter.write(newFile, content);
            await this.app.vault.adapter.remove(oldFile);
          }
        }
      }

      // Move current log to .1
      const currentContent = await this.app.vault.adapter.read(
        this.logFilePath,
      );
      await this.app.vault.adapter.write(
        `${logDir}/${baseName}.1.log`,
        currentContent,
      );
      await this.app.vault.adapter.remove(this.logFilePath);
    } catch (error) {
      console.error("MCP Bridge Logger: Failed to rotate logs:", error);
    }
  }

  private formatLogEntry(entry: LogEntry): string {
    const levelStr = LogLevel[entry.level].padEnd(5);
    const component = entry.component.padEnd(15);

    let formatted = `[${entry.timestamp}] ${levelStr} ${component} ${entry.message}`;

    if (entry.error) {
      formatted += `\n  Error: ${entry.error.message}`;
      if (entry.error.stack) {
        formatted += `\n  Stack: ${entry.error.stack}`;
      }
    }

    if (entry.metadata) {
      formatted += `\n  Metadata: ${JSON.stringify(entry.metadata, null, 2)}`;
    }

    return formatted;
  }

  private createLogEntry(
    level: LogLevel,
    component: string,
    message: string,
    error?: Error,
    metadata?: any,
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      component,
      message,
      error,
      metadata,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  private logToConsole(entry: LogEntry) {
    if (!this.enableConsoleLogging) return;

    const prefix = `MCP Bridge [${entry.component}]:`;
    const message = `${prefix} ${entry.message}`;

    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(message, entry.error || "");
        break;
      case LogLevel.WARN:
        console.warn(message);
        break;
      case LogLevel.INFO:
        console.info(message);
        break;
      case LogLevel.DEBUG:
      case LogLevel.TRACE:
        console.log(message);
        break;
    }

    if (entry.metadata) {
      console.log(`${prefix} Metadata:`, entry.metadata);
    }
  }

  private log(
    level: LogLevel,
    component: string,
    message: string,
    error?: Error,
    metadata?: any,
  ) {
    if (!this.shouldLog(level)) return;

    const entry = this.createLogEntry(
      level,
      component,
      message,
      error,
      metadata,
    );

    this.logToConsole(entry);

    if (this.enableFileLogging) {
      this.logBuffer.push(entry);
    }
  }

  error(component: string, message: string, error?: Error, metadata?: any) {
    this.log(LogLevel.ERROR, component, message, error, metadata);
  }

  warn(component: string, message: string, metadata?: any) {
    this.log(LogLevel.WARN, component, message, undefined, metadata);
  }

  info(component: string, message: string, metadata?: any) {
    this.log(LogLevel.INFO, component, message, undefined, metadata);
  }

  debug(component: string, message: string, metadata?: any) {
    this.log(LogLevel.DEBUG, component, message, undefined, metadata);
  }

  trace(component: string, message: string, metadata?: any) {
    this.log(LogLevel.TRACE, component, message, undefined, metadata);
  }

  async getLogContents(): Promise<string> {
    try {
      const exists = await this.app.vault.adapter.exists(this.logFilePath);
      if (!exists) return "";

      return await this.app.vault.adapter.read(this.logFilePath);
    } catch (error) {
      console.error("MCP Bridge Logger: Failed to read log file:", error);
      return "";
    }
  }

  async clearLogs(): Promise<void> {
    try {
      const exists = await this.app.vault.adapter.exists(this.logFilePath);
      if (exists) {
        await this.app.vault.adapter.remove(this.logFilePath);
      }

      // Clear rotated logs too
      const logDir = this.logFilePath.substring(
        0,
        this.logFilePath.lastIndexOf("/"),
      );
      const logFileName = this.logFilePath.substring(
        this.logFilePath.lastIndexOf("/") + 1,
      );
      const baseName = logFileName.replace(".log", "");

      for (let i = 1; i <= this.maxLogFiles; i++) {
        const rotatedFile = `${logDir}/${baseName}.${i}.log`;
        const exists = await this.app.vault.adapter.exists(rotatedFile);
        if (exists) {
          await this.app.vault.adapter.remove(rotatedFile);
        }
      }
    } catch (error) {
      console.error("MCP Bridge Logger: Failed to clear logs:", error);
    }
  }

  async getLogFiles(): Promise<string[]> {
    const logDir = this.logFilePath.substring(
      0,
      this.logFilePath.lastIndexOf("/"),
    );
    const logFileName = this.logFilePath.substring(
      this.logFilePath.lastIndexOf("/") + 1,
    );
    const baseName = logFileName.replace(".log", "");

    const files: string[] = [];

    try {
      // Check main log file
      const mainExists = await this.app.vault.adapter.exists(this.logFilePath);
      if (mainExists) {
        files.push(this.logFilePath);
      }

      // Check rotated log files
      for (let i = 1; i <= this.maxLogFiles; i++) {
        const rotatedFile = `${logDir}/${baseName}.${i}.log`;
        const exists = await this.app.vault.adapter.exists(rotatedFile);
        if (exists) {
          files.push(rotatedFile);
        }
      }
    } catch (error) {
      console.error("MCP Bridge Logger: Failed to get log files:", error);
    }

    return files;
  }

  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flushBuffer();
  }
}

// Global logger instance
let globalLogger: Logger;

export function initializeLogger(app: App): Logger {
  globalLogger = new Logger(app);
  return globalLogger;
}

export function getLogger(): Logger {
  if (!globalLogger) {
    throw new Error("Logger not initialized. Call initializeLogger() first.");
  }
  return globalLogger;
}

// Convenience functions for common logging
export function logError(
  component: string,
  message: string,
  error?: Error,
  metadata?: any,
) {
  getLogger().error(component, message, error, metadata);
}

export function logWarn(component: string, message: string, metadata?: any) {
  getLogger().warn(component, message, metadata);
}

export function logInfo(component: string, message: string, metadata?: any) {
  getLogger().info(component, message, metadata);
}

export function logDebug(component: string, message: string, metadata?: any) {
  getLogger().debug(component, message, metadata);
}

export function logTrace(component: string, message: string, metadata?: any) {
  getLogger().trace(component, message, metadata);
}
