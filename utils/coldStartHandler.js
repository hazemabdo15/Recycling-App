/**
 * Cold Start Handler Utility
 * Handles server cold starts on free tier hosting platforms
 */

class ColdStartHandler {
  constructor() {
    this.coldStartAttempts = new Map();
    this.maxRetries = 3;
    this.baseDelay = 2000; // 2 seconds
    this.maxDelay = 15000; // 15 seconds
    this.coldStartIndicators = [
      'ECONNREFUSED',
      'ETIMEDOUT',
      'Request timeout',
      'Network request failed',
      'Service Unavailable',
      '503',
      '502',
      '504'
    ];
  }

  /**
   * Check if error indicates a cold start
   * @param {Error} error 
   * @returns {boolean}
   */
  isColdStartError(error) {
    const errorMessage = error?.message || '';
    const errorCode = error?.code || '';
    const statusCode = error?.response?.status || error?.status;

    // Check for common cold start indicators
    return this.coldStartIndicators.some(indicator => 
      errorMessage.includes(indicator) || 
      errorCode.includes(indicator) ||
      statusCode?.toString() === indicator
    );
  }

  /**
   * Calculate delay for retry attempt
   * @param {number} attempt 
   * @returns {number}
   */
  calculateDelay(attempt) {
    // Exponential backoff with jitter
    const exponentialDelay = Math.min(
      this.baseDelay * Math.pow(2, attempt - 1), 
      this.maxDelay
    );
    
    // Add jitter (random variation of ±25%)
    const jitter = exponentialDelay * 0.25 * (Math.random() - 0.5);
    return Math.max(1000, exponentialDelay + jitter);
  }

  /**
   * Execute a function with cold start retry logic
   * @param {string} key - Unique key for this request
   * @param {Function} requestFn - Function that returns a Promise
   * @param {Object} options - Configuration options
   * @returns {Promise}
   */
  async executeWithRetry(key, requestFn, options = {}) {
    const {
      maxRetries = this.maxRetries,
      onRetry = null,
      onColdStartDetected = null,
      fallbackData = null
    } = options;

    let lastError = null;
    let attempt = 0;

    // Reset attempts for this key if it's been a while
    const lastAttemptTime = this.coldStartAttempts.get(key)?.time || 0;
    if (Date.now() - lastAttemptTime > 60000) { // 1 minute
      this.coldStartAttempts.delete(key);
    }

    const attemptData = this.coldStartAttempts.get(key) || { count: 0, time: Date.now() };

    while (attempt <= maxRetries) {
      try {
        // Execute the request
        const result = await requestFn();
        
        // Success - reset attempts
        this.coldStartAttempts.delete(key);
        return result;
        
      } catch (error) {
        lastError = error;
        attempt++;
        attemptData.count++;
        attemptData.time = Date.now();
        this.coldStartAttempts.set(key, attemptData);

        console.log(`[ColdStartHandler] Attempt ${attempt} failed for ${key}:`, error.message);

        // Check if this looks like a cold start
        const isColdStart = this.isColdStartError(error);
        
        if (isColdStart && attempt === 1 && onColdStartDetected) {
          onColdStartDetected();
        }

        // If we've exhausted retries, throw the error
        if (attempt > maxRetries) {
          console.log(`[ColdStartHandler] Max retries (${maxRetries}) exceeded for ${key}`);
          break;
        }

        // Calculate delay and wait
        const delay = this.calculateDelay(attempt);
        console.log(`[ColdStartHandler] Retrying ${key} in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
        
        if (onRetry) {
          onRetry(attempt, delay, isColdStart);
        }

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // If we get here, all retries failed
    console.error(`[ColdStartHandler] All retries failed for ${key}:`, lastError);
    
    // Return fallback data if provided
    if (fallbackData !== null) {
      console.log(`[ColdStartHandler] Returning fallback data for ${key}`);
      return fallbackData;
    }

    throw lastError;
  }

  /**
   * Get retry information for a key
   * @param {string} key 
   * @returns {Object|null}
   */
  getRetryInfo(key) {
    return this.coldStartAttempts.get(key) || null;
  }

  /**
   * Clear retry attempts for a key
   * @param {string} key 
   */
  clearRetryInfo(key) {
    this.coldStartAttempts.delete(key);
  }

  /**
   * Check if a key is currently in retry state
   * @param {string} key 
   * @returns {boolean}
   */
  isRetrying(key) {
    const info = this.coldStartAttempts.get(key);
    return info && info.count > 0 && (Date.now() - info.time) < 30000; // 30 seconds
  }
}

// Create singleton instance
const coldStartHandler = new ColdStartHandler();

export default coldStartHandler;

// Export utility functions
export const withColdStartRetry = (key, requestFn, options) => {
  return coldStartHandler.executeWithRetry(key, requestFn, options);
};

export const isColdStartError = (error) => {
  return coldStartHandler.isColdStartError(error);
};
