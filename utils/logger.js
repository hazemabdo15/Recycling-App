

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

const isProduction = !__DEV__;
const isDevelopment = __DEV__;

class Logger {
  constructor() {

    this.logLevel = isProduction ? LOG_LEVELS.ERROR : LOG_LEVELS.DEBUG;
    this.enableConsole = isDevelopment;
    this.enableRemoteLogging = isProduction;
    this.logs = [];
    this.maxLogHistory = isProduction ? 50 : 100;
    this.batchSize = 10;
    this.pendingLogs = [];
    this.flushInterval = null;

    this.logCounts = new Map();
    this.startTime = Date.now();
    
    if (isProduction) {
      this._initializeProductionLogging();
    }
  }

  _initializeProductionLogging() {

    this.flushInterval = setInterval(() => {
      this._flushRemoteLogs();
    }, 30000);

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

      let platform = 'unknown';
      try {
        const { Platform } = require('react-native');
        platform = Platform.OS;
      } catch (_error) {

        platform = typeof navigator !== 'undefined' ? 'web' : 'unknown';
      }

      this.buildInfo = {
        version: '1.0.0',
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

    this._trackLogCount(level, category);

    const formatted = this._formatMessage(level, category, message, data);

    if (isDevelopment || level === 'ERROR') {
      this.logs.push(formatted.raw);
      if (this.logs.length > this.maxLogHistory) {
        this.logs.shift();
      }
    }

    if (this.enableConsole) {
      const consoleMethod = level === 'ERROR' ? 'error' : 
                           level === 'WARN' ? 'warn' : 'log';
      
      if (data && typeof data === 'object') {
        console[consoleMethod](formatted.formatted, data);
      } else {
        console[consoleMethod](formatted.formatted);
      }
    }

    if (this.enableRemoteLogging && (level === 'ERROR' || level === 'WARN')) {
      this._queueForRemoteLogging(formatted.raw);
    }
  }

  _queueForRemoteLogging(logData) {
    this.pendingLogs.push(logData);

    if (this.pendingLogs.length >= this.batchSize || logData.level === 'ERROR') {
      this._flushRemoteLogs();
    }
  }

  _flushRemoteLogs(force = false) {
    if (this.pendingLogs.length === 0 && !force) return;
    
    try {

      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      
      AsyncStorage.getItem('app_error_logs').then((existingLogsStr) => {
        const existingLogs = JSON.parse(existingLogsStr || '[]');
        existingLogs.push(...this.pendingLogs);

        if (existingLogs.length > 100) {
          existingLogs.splice(0, existingLogs.length - 100);
        }
        
        AsyncStorage.setItem('app_error_logs', JSON.stringify(existingLogs));
        this.pendingLogs = [];
      }).catch((_error) => {

        this.pendingLogs = [];
      });
      
    } catch (_error) {

      if (isDevelopment) {
        console.error('Failed to flush logs: AsyncStorage not available');
      }
      this.pendingLogs = [];
    }
  }

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

    if (isProduction && !this.enableConsole) return;
    this._log('DEBUG', category, message, data);
  }

  api(message, data = null, level = 'INFO') {

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
      memoryUsage: this.logs.length * 150,
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

  time(label) {
    if (isProduction || !this.enableConsole) return;
    console.time?.(label);
  }

  timeEnd(label) {
    if (isProduction || !this.enableConsole) return;
    console.timeEnd?.(label);
  }

  group(label) {
    if (isProduction || !this.enableConsole) return;
    console.group?.(label);
  }

  groupEnd() {
    if (isProduction || !this.enableConsole) return;
    console.groupEnd?.();
  }

  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this._flushRemoteLogs(true);
    this.clearLogs();
  }

  onAppStateChange(nextAppState) {
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      this._flushRemoteLogs(true);
    }
  }
}

const logger = new Logger();

if (isProduction) {
  const originalConsoleError = console.error;
  console.error = (...args) => {
    logger.error('Uncaught console error', { args });

    if (isDevelopment) {
      originalConsoleError.apply(console, args);
    }
  };
}


export default logger;
export { LOG_LEVELS, Logger };

export const logError = (message, data, category) => logger.error(message, data, category);
export const logWarn = (message, data, category) => logger.warn(message, data, category);
export const logInfo = (message, data, category) => logger.info(message, data, category);
export const logDebug = (message, data, category) => {
  if (isProduction) return;
  logger.debug(message, data, category);
};
export const logApi = (message, data, level) => logger.api(message, data, level);
export const logAuth = (message, data, level) => logger.auth(message, data, level);
export const logCart = (message, data, level) => logger.cart(message, data, level);
export const logPayment = (message, data, level) => logger.payment(message, data, level);
export const logPerformance = (message, data) => logger.performance(message, data);
export const logSuccess = (message, data, category) => logger.success(message, data, category);
