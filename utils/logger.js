/**
 * Production-optimized logger utility
 * Features:
 * - Environment-aware logging levels
 * - Structured logging with metadata
 * - Performance-optimized for production
 * - Remote logging capabilities
 * - Memory-efficient log buffer
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

const LOG_COLORS = {
  ERROR: '🔴',
  WARN: '🟡',
  INFO: '🔵',
  DEBUG: '🟢',
  SUCCESS: '✅',
  PERFORMANCE: '⚡',
  API: '🌐',
  AUTH: '🔐',
  CART: '🛒',
  PAYMENT: '💳',
};

// Performance optimizations
const isProduction = !__DEV__;
const isDevelopment = __DEV__;

class Logger {
  constructor() {
    // Production-optimized defaults
    this.logLevel = isProduction ? LOG_LEVELS.ERROR : LOG_LEVELS.DEBUG;
    this.enableConsole = isDevelopment;
    this.enableRemoteLogging = isProduction;
    this.logs = [];
    this.maxLogHistory = isProduction ? 50 : 100; // Smaller buffer in production
    this.batchSize = 10; // For remote logging batching
    this.pendingLogs = [];
    this.flushInterval = null;
    
    // Performance tracking
    this.logCounts = new Map();
    this.startTime = Date.now();
    
    if (isProduction) {
      this._initializeProductionLogging();
    }
  }

  _initializeProductionLogging() {
    // Set up periodic log flushing for production
    this.flushInterval = setInterval(() => {
      this._flushRemoteLogs();
    }, 30000); // Flush every 30 seconds
    
    // Note: React Native doesn't have window.beforeunload
    // App lifecycle cleanup is handled in the constructor cleanup section
  }

  setLogLevel(level) {
    this.logLevel = level;
  }

  setConsoleLogging(enabled) {
    this.enableConsole = enabled;
  }

  setRemoteLogging(enabled) {
    this.enableRemoteLogging = enabled;
  }

  _shouldLog(level) {
    return LOG_LEVELS[level] <= this.logLevel;
  }

  _formatMessage(level, category, message, data) {
    const timestamp = new Date().toISOString();
    const emoji = LOG_COLORS[category] || LOG_COLORS[level] || '';
    
    // Performance optimization: avoid string concatenation in production
    if (isProduction && !this.enableConsole) {
      return {
        raw: {
          timestamp,
          level,
          category,
          message,
          data,
          sessionId: this._getSessionId(),
          buildInfo: this._getBuildInfo()
        }
      };
    }
    
    const prefix = `${emoji} [${level}] [${category}] ${timestamp}`;
    
    return {
      formatted: `${prefix} ${message}`,
      raw: {
        timestamp,
        level,
        category,
        message,
        data,
        sessionId: this._getSessionId(),
        buildInfo: this._getBuildInfo()
      }
    };
  }

  _getSessionId() {
    if (!this.sessionId) {
      this.sessionId = Date.now().toString(36) + Math.random().toString(36);
    }
    return this.sessionId;
  }

  _getBuildInfo() {
    if (!this.buildInfo) {
      // Import Platform safely
      let platform = 'unknown';
      try {
        const { Platform } = require('react-native');
        platform = Platform.OS;
      } catch (_error) {
        // Fallback for non-React Native environments
        platform = typeof navigator !== 'undefined' ? 'web' : 'unknown';
      }

      this.buildInfo = {
        version: '1.0.0', // Static version - can be set via environment variable if needed
        platform: platform,
        environment: isProduction ? 'production' : 'development'
      };
    }
    return this.buildInfo;
  }

  _trackLogCount(level, category) {
    const key = `${level}-${category}`;
    const count = this.logCounts.get(key) || 0;
    this.logCounts.set(key, count + 1);
  }

  _log(level, category, message, data = null) {
    if (!this._shouldLog(level)) return;

    // Track log frequency for performance monitoring
    this._trackLogCount(level, category);

    const formatted = this._formatMessage(level, category, message, data);
    
    // Store in memory for debugging (production-optimized)
    if (isDevelopment || level === 'ERROR') {
      this.logs.push(formatted.raw);
      if (this.logs.length > this.maxLogHistory) {
        this.logs.shift();
      }
    }

    // Console logging (disabled in production by default)
    if (this.enableConsole) {
      const consoleMethod = level === 'ERROR' ? 'error' : 
                           level === 'WARN' ? 'warn' : 'log';
      
      if (data && typeof data === 'object') {
        console[consoleMethod](formatted.formatted, data);
      } else {
        console[consoleMethod](formatted.formatted);
      }
    }

    // Remote logging for production (batched for performance)
    if (this.enableRemoteLogging && (level === 'ERROR' || level === 'WARN')) {
      this._queueForRemoteLogging(formatted.raw);
    }
  }

  _queueForRemoteLogging(logData) {
    this.pendingLogs.push(logData);
    
    // Auto-flush when batch is full or for critical errors
    if (this.pendingLogs.length >= this.batchSize || logData.level === 'ERROR') {
      this._flushRemoteLogs();
    }
  }

  _flushRemoteLogs(force = false) {
    if (this.pendingLogs.length === 0 && !force) return;
    
    try {
      // Use AsyncStorage for React Native compatibility
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      
      AsyncStorage.getItem('app_error_logs').then((existingLogsStr) => {
        const existingLogs = JSON.parse(existingLogsStr || '[]');
        existingLogs.push(...this.pendingLogs);
        
        // Keep only recent logs to prevent storage bloat
        if (existingLogs.length > 100) {
          existingLogs.splice(0, existingLogs.length - 100);
        }
        
        AsyncStorage.setItem('app_error_logs', JSON.stringify(existingLogs));
        this.pendingLogs = [];
      }).catch((_error) => {
        // Silently fail in production to avoid logging loops
        this.pendingLogs = []; // Clear to prevent memory buildup
      });
      
    } catch (_error) {
      // Silently fail in production to avoid logging loops
      if (isDevelopment) {
        console.error('Failed to flush logs: AsyncStorage not available');
      }
      this.pendingLogs = []; // Clear to prevent memory buildup
    }
  }

  // Main logging methods with production optimizations
  error(message, data = null, category = 'ERROR') {
    this._log('ERROR', category, message, data);
  }

  warn(message, data = null, category = 'WARN') {
    this._log('WARN', category, message, data);
  }

  info(message, data = null, category = 'INFO') {
    this._log('INFO', category, message, data);
  }

  debug(message, data = null, category = 'DEBUG') {
    // Skip debug logs in production unless explicitly enabled
    if (isProduction && !this.enableConsole) return;
    this._log('DEBUG', category, message, data);
  }

  // Category-specific methods with smart logging
  api(message, data = null, level = 'INFO') {
    // Reduce API logging noise in production
    if (isProduction && level === 'DEBUG') return;
    this._log(level, 'API', message, data);
  }

  auth(message, data = null, level = 'INFO') {
    this._log(level, 'AUTH', message, data);
  }

  cart(message, data = null, level = 'INFO') {
    this._log(level, 'CART', message, data);
  }

  payment(message, data = null, level = 'INFO') {
    this._log(level, 'PAYMENT', message, data);
  }

  performance(message, data = null) {
    this._log('INFO', 'PERFORMANCE', message, data);
  }

  success(message, data = null, category = 'SUCCESS') {
    this._log('INFO', category, message, data);
  }

  // Production-optimized utility methods
  getLogs() {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
    this.logCounts.clear();
    this.pendingLogs = [];
    if (isDevelopment) {
      console.log('Logger: All logs cleared');
    }
  }

  getErrorLogs() {
    return this.logs.filter(log => log.level === 'ERROR');
  }

  getLogStats() {
    return {
      totalLogs: this.logs.length,
      logCounts: Object.fromEntries(this.logCounts),
      uptime: Date.now() - this.startTime,
      memoryUsage: this.logs.length * 150, // Rough estimate in bytes
      pendingRemoteLogs: this.pendingLogs.length
    };
  }

  exportLogs() {
    return {
      logs: this.logs,
      stats: this.getLogStats(),
      config: {
        logLevel: this.logLevel,
        enableConsole: this.enableConsole,
        enableRemoteLogging: this.enableRemoteLogging
      }
    };
  }

  // Performance logging with production guards
  time(label) {
    if (isProduction || !this.enableConsole) return;
    console.time?.(label);
  }

  timeEnd(label) {
    if (isProduction || !this.enableConsole) return;
    console.timeEnd?.(label);
  }

  // Group logging for development only
  group(label) {
    if (isProduction || !this.enableConsole) return;
    console.group?.(label);
  }

  groupEnd() {
    if (isProduction || !this.enableConsole) return;
    console.groupEnd?.();
  }

  // Cleanup method for production
  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this._flushRemoteLogs(true);
    this.clearLogs();
  }

  // React Native specific cleanup that can be called from AppState changes
  onAppStateChange(nextAppState) {
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      this._flushRemoteLogs(true);
    }
  }
}

// Create and configure singleton instance
const logger = new Logger();

// Global error handler for production debugging
if (isProduction) {
  const originalConsoleError = console.error;
  console.error = (...args) => {
    logger.error('Uncaught console error', { args });
    // Still log to console in development
    if (isDevelopment) {
      originalConsoleError.apply(console, args);
    }
  };
}

// Cleanup on app termination (React Native compatible)
// React Native apps don't have traditional process lifecycle events
// Cleanup is handled through the destroy() method when needed or app state changes

export default logger;
export { LOG_LEVELS, Logger };

// Performance-optimized convenience exports
export const logError = (message, data, category) => logger.error(message, data, category);
export const logWarn = (message, data, category) => logger.warn(message, data, category);
export const logInfo = (message, data, category) => logger.info(message, data, category);
export const logDebug = (message, data, category) => {
  if (isProduction) return; // Early return in production
  logger.debug(message, data, category);
};
export const logApi = (message, data, level) => logger.api(message, data, level);
export const logAuth = (message, data, level) => logger.auth(message, data, level);
export const logCart = (message, data, level) => logger.cart(message, data, level);
export const logPayment = (message, data, level) => logger.payment(message, data, level);
export const logPerformance = (message, data) => logger.performance(message, data);
export const logSuccess = (message, data, category) => logger.success(message, data, category);
