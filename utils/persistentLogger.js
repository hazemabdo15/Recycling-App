// Enhanced Persistent Logger Utility
class Logger {
  constructor() {
    this.isDev = typeof __DEV__ !== 'undefined' && __DEV__;
    this.logs = []; // Store logs for debugging
  }

  log(level, message, context = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context
    };
    
    this.logs.push(logEntry);
    
    // Keep only last 100 logs to prevent memory issues
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(-100);
    }
    
    if (!this.isDev) return;
    
    const emoji = this.getLogEmoji(level);
    const formattedMessage = `${emoji} [PICKUP] ${message}`;
    
    switch (level.toLowerCase()) {
      case 'error':
        console.error(formattedMessage, context);
        break;
      case 'warn':
        console.warn(formattedMessage, context);
        break;
      case 'success':
        console.log(`%c${formattedMessage}`, 'color: green; font-weight: bold;', context);
        break;
      default:
        console.log(formattedMessage, context);
    }
  }

  getLogEmoji(level) {
    const emojis = {
      error: '❌',
      warn: '⚠️', 
      info: 'ℹ️',
      debug: '🐛',
      success: '✅'
    };
    return emojis[level.toLowerCase()] || '📝';
  }

  // Convenience methods
  info(message, context = {}) { this.log('info', message, context); }
  debug(message, context = {}) { this.log('debug', message, context); }
  warn(message, context = {}) { this.log('warn', message, context); }
  error(message, context = {}) { this.log('error', message, context); }
  success(message, context = {}) { this.log('success', message, context); }
  
  // Get recent logs for debugging
  getRecentLogs(count = 20) {
    return this.logs.slice(-count);
  }
}

export const logger = new Logger();
