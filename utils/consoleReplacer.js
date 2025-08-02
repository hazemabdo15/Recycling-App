

import { FEATURE_FLAGS } from '../config/env';
import logger from './logger';

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

class ProductionConsole {
  constructor() {
    this.isEnabled = FEATURE_FLAGS.ENABLE_CONSOLE_LOGS || false;
    this.logPatterns = new Map([

      [/api|fetch|request|response|axios/i, 'API'],
      [/auth|login|token|session/i, 'AUTH'],
      [/cart|order|payment|checkout/i, 'CART'],
      [/pickup|delivery|schedule/i, 'PICKUP'],

      [/performance|slow|timing|duration/i, 'PERFORMANCE'],
      [/render|component|hook/i, 'RENDER'],
      [/memory|leak|usage/i, 'MEMORY'],

      [/error|exception|failed|crash/i, 'ERROR'],
      [/warning|warn|deprecated/i, 'WARN'],

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

const productionConsole = new ProductionConsole();

export const replaceGlobalConsole = () => {
  if (!__DEV__ || FEATURE_FLAGS.ENABLE_STRUCTURED_LOGGING) {

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

export const restoreGlobalConsole = () => {
  Object.assign(console, originalConsole);
  logger.info('Original console methods restored');
};

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
