/**
 * Logger utility for production-safe logging
 * 
 * Usage:
 *   import { logger } from '../utils/logger';
 *   logger.info('User action', { userId: 123 });    // Only in development
 *   logger.error('Payment failed', error);           // Always logged
 *   logger.debug('Debug info', data);                // Only in development
 */

// Check if we're in production
const isProduction = process.env.NODE_ENV === 'production';

export const logger = {
  /**
   * Info level - Only logs in development
   * Use for general information that's useful during development
   */
  info: (message: string, data?: any) => {
    if (!isProduction) {
      console.log(`ℹ️ ${message}`, data !== undefined ? data : '');
    }
  },

  /**
   * Error level - Always logs (production & development)
   * Use for errors that need to be tracked
   */
  error: (message: string, error?: any) => {
    console.error(`❌ ${message}`, error !== undefined ? error : '');
  },

  /**
   * Debug level - Only logs in development
   * Use for detailed debugging information
   */
  debug: (message: string, data?: any) => {
    if (!isProduction) {
      console.debug(`🐛 ${message}`, data !== undefined ? data : '');
    }
  },

  /**
   * Success level - Only logs in development
   * Use for successful operations
   */
  success: (message: string, data?: any) => {
    if (!isProduction) {
      console.log(`✅ ${message}`, data !== undefined ? data : '');
    }
  },

  /**
   * Warning level - Always logs (production & development)
   * Use for warnings that might indicate issues
   */
  warn: (message: string, data?: any) => {
    console.warn(`⚠️ ${message}`, data !== undefined ? data : '');
  }
};
