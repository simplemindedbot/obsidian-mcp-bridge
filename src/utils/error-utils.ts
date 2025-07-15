/**
 * Utility functions for error handling and logging
 */

/**
 * Format error for display to user
 */
export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unknown error occurred';
}

/**
 * Log error with context
 */
export function logError(context: string, error: unknown): void {
  console.error(`[${context}] Error:`, error);
}

/**
 * Create a standardized error object
 */
export function createError(message: string, code?: string, details?: any): Error {
  const error = new Error(message);
  (error as any).code = code;
  (error as any).details = details;
  return error;
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.includes('network') || 
           error.message.includes('connection') ||
           error.message.includes('timeout') ||
           error.message.includes('ECONNREFUSED') ||
           error.message.includes('ENOTFOUND');
  }
  return false;
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (i === maxRetries - 1) {
        throw lastError;
      }
      
      const delay = initialDelay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

/**
 * Safe JSON parse that returns null on error
 */
export function safeJsonParse(json: string): any {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Safe JSON stringify that returns empty string on error
 */
export function safeJsonStringify(obj: any): string {
  try {
    return JSON.stringify(obj);
  } catch {
    return '';
  }
}