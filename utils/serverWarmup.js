/**
 * Server Warm-up Utility
 * Helps wake up cold start servers proactively
 */

class ServerWarmup {
  constructor() {
    this.warmupAttempts = new Map();
    this.isWarming = false;
    this.lastWarmupTime = 0;
    this.warmupCooldown = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Attempt to warm up the server proactively
   * @returns {Promise<boolean>}
   */

  /**
   * Check if server is likely cold and needs warmup
   * @param {Error} error
   * @returns {boolean}
   */
  isLikelyColdStart(error) {
    const indicators = [
      "ECONNREFUSED",
      "ETIMEDOUT",
      "Request timeout",
      "Network request failed",
      "503",
      "502",
      "504",
    ];

    const errorMessage = error?.message || "";
    const statusCode = error?.response?.status?.toString() || "";

    return indicators.some(
      (indicator) =>
        errorMessage.includes(indicator) || statusCode === indicator
    );
  }

  /**
   * Get warmup status
   * @returns {Object}
   */
  getStatus() {
    return {
      isWarming: this.isWarming,
      lastWarmupTime: this.lastWarmupTime,
      canWarmup: Date.now() - this.lastWarmupTime >= this.warmupCooldown,
    };
  }
}

// Create singleton
const serverWarmup = new ServerWarmup();

export default serverWarmup;

// Utility function for easy use
export const warmupServer = () => serverWarmup.warmupServer();
export const isLikelyColdStart = (error) =>
  serverWarmup.isLikelyColdStart(error);
