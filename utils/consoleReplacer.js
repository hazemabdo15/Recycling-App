/**
 * Production-Ready Console Log Replacement
 * Automatically replaces console.log with structured logging
 * This utility helps migrate from console.log to proper logging
 */

import { FEATURE_FLAGS } from '../config/env';
import logger from './logger';

// Store original console methods
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info,
  debug: console.debug,
  time: console.time,
  timeEnd: console.timeEnd,
  group: console.group,
  groupEnd: console.groupEnd
};

// Enhanced console wrapper with automatic categorization
class ProductionConsole {
  constructor() {
    this.isEnabled = FEATURE_FLAGS.ENABLE_CONSOLE_LOGS || false;
    this.logPatterns = new Map([
      // API related patterns
      [/api|fetch|request|response|axios/i, 'API'],
      [/auth|login|token|session/i, 'AUTH'],
      [/cart|order|payment|checkout/i, 'CART'],
      [/pickup|delivery|schedule/i, 'PICKUP'],
      
      // Performance patterns
      [/performance|slow|timing|duration/i, 'PERFORMANCE'],
      [/render|component|hook/i, 'RENDER'],
      [/memory|leak|usage/i, 'MEMORY'],
      
      // Error patterns
      [/error|exception|failed|crash/i, 'ERROR'],
      [/warning|warn|deprecated/i, 'WARN'],
      
      // Debug patterns
      [/debug|trace|verbose/i, 'DEBUG'],
    ]);
  }

  _categorizeMessage(message) {
    const messageStr = String(message).toLowerCase();
    
    for (const [pattern, category] of this.logPatterns) {
      if (pattern.test(messageStr)) {
        return category;
      }
    }
    
    return 'INFO';
  }

  _extractContext(args) {
    // Extract objects and additional context from arguments
    const context = {};
    
    for (let i = 1; i < args.length; i++) {
      const arg = args[i];
      if (typeof arg === 'object' && arg !== null) {
        Object.assign(context, arg);
      }
    }
    
    return Object.keys(context).length > 0 ? context : null;
  }

  log(...args) {
    if (!this.isEnabled && __DEV__) {
      return originalConsole.log.apply(console, args);
    }
    
    const message = args[0];
    const category = this._categorizeMessage(message);
    const context = this._extractContext(args);
    
    switch (category) {
      case 'ERROR':
        logger.error(message, context);
        break;
      case 'WARN':
        logger.warn(message, context);
        break;
      case 'API':
        logger.api(message, context);
        break;
      case 'AUTH':
        logger.auth(message, context);
        break;
      case 'CART':
        logger.cart(message, context);
        break;
      case 'PERFORMANCE':
        logger.performance(message, context);
        break;
      default:
        logger.info(message, context);
    }
  }

  error(...args) {
    const message = args[0];
    const context = this._extractContext(args);
    logger.error(message, context);
  }

  warn(...args) {
    const message = args[0];
    const context = this._extractContext(args);
    logger.warn(message, context);
  }

  info(...args) {
    const message = args[0];
    const context = this._extractContext(args);
    logger.info(message, context);
  }

  debug(...args) {
    if (__DEV__) {
      const message = args[0];
      const context = this._extractContext(args);
      logger.debug(message, context);
    }
  }

  time(label) {
    if (__DEV__) {
      logger.time(label);
    }
  }

  timeEnd(label) {
    if (__DEV__) {
      logger.timeEnd(label);
    }
  }

  group(label) {
    if (__DEV__) {
      logger.group(label);
    }
  }

  groupEnd() {
    if (__DEV__) {
      logger.groupEnd();
    }
  }
}

// Create production console instance
const productionConsole = new ProductionConsole();

// Replace global console in production
export const replaceGlobalConsole = () => {
  if (!__DEV__ || FEATURE_FLAGS.ENABLE_STRUCTURED_LOGGING) {
    // Replace console methods with structured logging
    console.log = productionConsole.log.bind(productionConsole);
    console.error = productionConsole.error.bind(productionConsole);
    console.warn = productionConsole.warn.bind(productionConsole);
    console.info = productionConsole.info.bind(productionConsole);
    console.debug = productionConsole.debug.bind(productionConsole);
    console.time = productionConsole.time.bind(productionConsole);
    console.timeEnd = productionConsole.timeEnd.bind(productionConsole);
    console.group = productionConsole.group.bind(productionConsole);
    console.groupEnd = productionConsole.groupEnd.bind(productionConsole);
    
    if (!__DEV__) {
      logger.info('Global console replaced with structured logging');
    }
  }
};

// Restore original console (for debugging)
export const restoreGlobalConsole = () => {
  Object.assign(console, originalConsole);
  logger.info('Original console methods restored');
};

// Utility to migrate console.log calls
export const migrateConsoleLog = (message, data = null, category = null) => {
  const detectedCategory = category || productionConsole._categorizeMessage(message);
  
  switch (detectedCategory) {
    case 'ERROR':
      logger.error(message, data);
      break;
    case 'WARN':
      logger.warn(message, data);
      break;
    case 'API':
      logger.api(message, data);
      break;
    case 'AUTH':
      logger.auth(message, data);
      break;
    case 'CART':
      logger.cart(message, data);
      break;
    case 'PERFORMANCE':
      logger.performance(message, data);
      break;
    default:
      logger.info(message, data);
  }
};

export default productionConsole;
