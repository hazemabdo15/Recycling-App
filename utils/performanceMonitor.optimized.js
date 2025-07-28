/**
 * Optimized Performance Monitor
 * Reduces overhead while maintaining critical monitoring capabilities
 * Features:
 * - Lightweight tracking with minimal memory footprint
 * - Smart sampling to reduce measurement overhead
 * - Optimized for production with minimal performance impact
 * - Emergency throttling when performance degrades
 */

import { isProduction } from '../config/env';
import logger from './logger';

// Optimized configurations
const OPTIMIZED_PRODUCTION_CONFIG = {
  enabled: true,
  trackRenders: false, // Disable in production
  trackMemory: false, // Disable heavy memory tracking
  slowOperationThreshold: 300, // More lenient threshold
  slowRenderThreshold: 50, // More lenient render threshold
  maxMetricsHistory: 20, // Smaller memory footprint
  reportInterval: 600000, // 10 minutes - less frequent reporting
  samplingRate: 0.1, // Only track 10% of operations in production
  emergencyThrottleRate: 0.01 // 1% when performance is critically bad
};

const OPTIMIZED_DEVELOPMENT_CONFIG = {
  enabled: true,
  trackRenders: true,
  trackMemory: true,
  slowOperationThreshold: 150, // Slightly more lenient
  slowRenderThreshold: 20, // Slightly more lenient
  maxMetricsHistory: 100, // Reduced history
  reportInterval: 120000, // 2 minutes
  samplingRate: 0.3, // 30% sampling in development
  emergencyThrottleRate: 0.05 // 5% emergency throttle
};

class OptimizedPerformanceMonitor {
  constructor() {
    const config = isProduction ? OPTIMIZED_PRODUCTION_CONFIG : OPTIMIZED_DEVELOPMENT_CONFIG;
    
    this.isEnabled = config.enabled;
    this.trackRenders = config.trackRenders;
    this.trackMemory = config.trackMemory;
    this.slowOperationThreshold = config.slowOperationThreshold;
    this.slowRenderThreshold = config.slowRenderThreshold;
    this.maxMetricsHistory = config.maxMetricsHistory;
    this.samplingRate = config.samplingRate;
    this.emergencyThrottleRate = config.emergencyThrottleRate;
    
    // Lightweight tracking structures
    this.activeTimers = new Map();
    this.criticalMetrics = new Map(); // Only store critical slow operations
    this.apiSummary = new Map(); // Aggregated API metrics
    
    // Performance statistics
    this.totalMeasurements = 0;
    this.criticalSlowOperations = 0;
    this.startTime = Date.now();
    this.lastCleanup = Date.now();
    
    // Emergency throttling
    this.isEmergencyMode = false;
    this.currentSamplingRate = this.samplingRate;
    
    // Optimized reporting
    if (config.reportInterval) {
      this.reportInterval = setInterval(() => {
        this.generateOptimizedReport();
        this.performMaintenanceCleanup();
      }, config.reportInterval);
    }
  }

  // Smart sampling - skip measurements to reduce overhead
  shouldTrack() {
    if (!this.isEnabled) return false;
    
    // Emergency throttling when performance is critical
    if (this.isEmergencyMode) {
      return Math.random() < this.emergencyThrottleRate;
    }
    
    return Math.random() < this.currentSamplingRate;
  }

  // Ultra-lightweight timer start
  startTimer(key, metadata = {}) {
    if (!this.shouldTrack()) return false;
    
    this.activeTimers.set(key, {
      start: Date.now(),
      metadata
    });
    return true;
  }

  // Optimized timer end with critical-only storage
  endTimer(key, additionalMetadata = {}) {
    const timer = this.activeTimers.get(key);
    if (!timer) return null;

    const duration = Date.now() - timer.start;
    this.totalMeasurements++;
    
    // Only track and store critical slow operations
    const threshold = timer.metadata.type === 'render' ? 
      this.slowRenderThreshold : this.slowOperationThreshold;
    
    if (duration > threshold) {
      this.criticalSlowOperations++;
      
      // Store only critical metrics to save memory
      this.storeCriticalMetric(key, {
        duration,
        type: timer.metadata.type || 'operation',
        timestamp: Date.now(),
        ...timer.metadata,
        ...additionalMetadata
      });

      // Emergency mode activation
      this.checkEmergencyMode();
    }

    // Update API summary for API calls
    if (timer.metadata.type === 'api') {
      this.updateApiSummary(timer.metadata.endpoint || key, duration, additionalMetadata.success !== false);
    }

    this.activeTimers.delete(key);
    return { duration, tracked: true };
  }

  // Store only critical metrics
  storeCriticalMetric(key, metric) {
    // Keep only most recent critical metrics to save memory
    if (this.criticalMetrics.size >= this.maxMetricsHistory) {
      const oldestKey = this.criticalMetrics.keys().next().value;
      this.criticalMetrics.delete(oldestKey);
    }
    
    this.criticalMetrics.set(`${key}-${Date.now()}`, metric);
  }

  // Lightweight API summary updates
  updateApiSummary(endpoint, duration, success) {
    const existing = this.apiSummary.get(endpoint) || {
      count: 0,
      totalDuration: 0,
      errors: 0,
      maxDuration: 0
    };

    existing.count++;
    existing.totalDuration += duration;
    existing.maxDuration = Math.max(existing.maxDuration, duration);
    
    if (!success) {
      existing.errors++;
    }

    this.apiSummary.set(endpoint, existing);
  }

  // Emergency mode detection and activation
  checkEmergencyMode() {
    const slowRate = this.totalMeasurements > 0 ? 
      (this.criticalSlowOperations / this.totalMeasurements) : 0;
    
    const shouldActivateEmergency = slowRate > 0.5; // More than 50% slow operations
    
    if (shouldActivateEmergency && !this.isEmergencyMode) {
      this.isEmergencyMode = true;
      this.currentSamplingRate = this.emergencyThrottleRate;
      
      if (!isProduction) {
        logger.performance('Emergency performance mode activated', {
          slowRate: `${(slowRate * 100).toFixed(1)}%`,
          totalMeasurements: this.totalMeasurements
        }, 'ERROR');
      }
    } else if (!shouldActivateEmergency && this.isEmergencyMode) {
      this.isEmergencyMode = false;
      this.currentSamplingRate = this.samplingRate;
      
      if (!isProduction) {
        logger.performance('Emergency performance mode deactivated', null, 'INFO');
      }
    }
  }

  // Optimized async measurement
  measureAsync(key, asyncFn, metadata = {}) {
    if (!this.startTimer(key, metadata)) {
      return asyncFn(); // Skip tracking, just execute
    }
    
    const timeout = metadata.timeout || 15000; // Shorter default timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Timeout: ${key}`)), timeout);
    });
    
    return Promise.race([asyncFn(), timeoutPromise])
      .then(result => {
        this.endTimer(key, { success: true });
        return result;
      })
      .catch(error => {
        this.endTimer(key, { 
          success: false, 
          error: error.message,
          isTimeout: error.message.includes('Timeout')
        });
        throw error;
      });
  }

  // Lightweight API call measurement
  measureApiCall(endpoint, apiCallFn, options = {}) {
    const key = `api-${endpoint}`;
    return this.measureAsync(key, apiCallFn, { 
      type: 'api', 
      endpoint,
      timeout: options.timeout || 10000, // Shorter API timeout
      ...options 
    });
  }

  // Generate optimized performance report
  generateOptimizedReport() {
    const uptime = Date.now() - this.startTime;
    const slowRate = this.totalMeasurements > 0 ? 
      (this.criticalSlowOperations / this.totalMeasurements) : 0;

    const report = {
      timestamp: new Date().toISOString(),
      uptime: Math.round(uptime / 1000),
      sampling: `${(this.currentSamplingRate * 100).toFixed(1)}%`,
      emergency: this.isEmergencyMode,
      statistics: {
        totalMeasurements: this.totalMeasurements,
        criticalSlowOperations: this.criticalSlowOperations,
        criticalSlowRate: `${(slowRate * 100).toFixed(1)}%`
      },
      criticalIssues: Array.from(this.criticalMetrics.values()).slice(-5),
      apiSummary: this.getApiSummary(),
      health: {
        isHealthy: slowRate < 0.1, // Less than 10% critical slow operations
        emergencyMode: this.isEmergencyMode,
        memoryUsage: this.criticalMetrics.size + this.apiSummary.size
      }
    };

    // Only log if there are issues or in development
    if (!isProduction || !report.health.isHealthy || this.isEmergencyMode) {
      logger.performance('Performance Report', {
        emergencyMode: report.emergency,
        criticalSlowRate: report.statistics.criticalSlowRate,
        totalMeasurements: report.statistics.totalMeasurements,
        sampling: report.sampling
      }, report.health.isHealthy ? 'INFO' : 'WARN');
    }

    return report;
  }

  // Get API performance summary
  getApiSummary() {
    const summary = {};
    for (const [endpoint, metrics] of this.apiSummary.entries()) {
      const avgDuration = metrics.count > 0 ? metrics.totalDuration / metrics.count : 0;
      const errorRate = metrics.count > 0 ? (metrics.errors / metrics.count) * 100 : 0;
      
      summary[endpoint] = {
        calls: metrics.count,
        avgDuration: Math.round(avgDuration),
        maxDuration: metrics.maxDuration,
        errorRate: `${errorRate.toFixed(1)}%`,
        isSlow: avgDuration > this.slowOperationThreshold
      };
    }
    return summary;
  }

  // Lightweight maintenance cleanup
  performMaintenanceCleanup() {
    const now = Date.now();
    
    // Only cleanup every 5 minutes to reduce overhead
    if (now - this.lastCleanup < 300000) return;
    
    // Clear old critical metrics
    if (this.criticalMetrics.size > this.maxMetricsHistory) {
      const entries = Array.from(this.criticalMetrics.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      // Remove oldest 50%
      const toRemove = Math.floor(entries.length * 0.5);
      for (let i = 0; i < toRemove; i++) {
        this.criticalMetrics.delete(entries[i][0]);
      }
    }

    this.lastCleanup = now;
  }

  // Get current performance health
  getHealthStatus() {
    const slowRate = this.totalMeasurements > 0 ? 
      (this.criticalSlowOperations / this.totalMeasurements) : 0;
    
    return {
      healthy: slowRate < 0.1 && !this.isEmergencyMode,
      totalMeasurements: this.totalMeasurements,
      criticalSlowOperations: this.criticalSlowOperations,
      criticalSlowRate: `${(slowRate * 100).toFixed(1)}%`,
      emergencyMode: this.isEmergencyMode,
      samplingRate: `${(this.currentSamplingRate * 100).toFixed(1)}%`,
      uptime: Date.now() - this.startTime,
      isEnabled: this.isEnabled
    };
  }

  // Get slow API endpoints
  getSlowApiEndpoints() {
    const slowEndpoints = [];
    for (const [endpoint, summary] of Object.entries(this.getApiSummary())) {
      if (summary.isSlow || parseFloat(summary.errorRate) > 5) {
        slowEndpoints.push({
          endpoint,
          ...summary
        });
      }
    }
    return slowEndpoints.sort((a, b) => b.avgDuration - a.avgDuration);
  }

  // Optimized cleanup
  clearMetrics() {
    this.criticalMetrics.clear();
    this.apiSummary.clear();
    this.activeTimers.clear();
    this.totalMeasurements = 0;
    this.criticalSlowOperations = 0;
    this.isEmergencyMode = false;
    this.currentSamplingRate = this.samplingRate;
  }

  // Disable monitoring (for emergency performance recovery)
  disable() {
    this.isEnabled = false;
    this.clearMetrics();
    
    if (!isProduction) {
      logger.performance('Performance monitoring disabled for emergency recovery', null, 'WARN');
    }
  }

  enable() {
    this.isEnabled = true;
    this.currentSamplingRate = this.samplingRate;
    
    if (!isProduction) {
      logger.performance('Performance monitoring re-enabled', null, 'INFO');
    }
  }

  // Cleanup on app termination
  destroy() {
    if (this.reportInterval) {
      clearInterval(this.reportInterval);
      this.reportInterval = null;
    }
    
    this.clearMetrics();
    this.isEnabled = false;
  }
}

// Create optimized singleton
const optimizedPerformanceMonitor = new OptimizedPerformanceMonitor();

// Optimized exports
export const measureApiCall = (apiCall, endpoint, options = {}) => {
  return optimizedPerformanceMonitor.measureApiCall(endpoint, apiCall, options);
};

export const getPerformanceReport = () => {
  return optimizedPerformanceMonitor.generateOptimizedReport();
};

export const getHealthStatus = () => {
  return optimizedPerformanceMonitor.getHealthStatus();
};

export const getSlowApiEndpoints = () => {
  return optimizedPerformanceMonitor.getSlowApiEndpoints();
};

export const clearPerformanceMetrics = () => {
  optimizedPerformanceMonitor.clearMetrics();
};

export const emergencyDisableMonitoring = () => {
  optimizedPerformanceMonitor.disable();
};

export const enableMonitoring = () => {
  optimizedPerformanceMonitor.enable();
};

// React hook for lightweight performance monitoring
export const useOptimizedPerformanceMonitor = (componentName) => {
  return {
    measureAsync: (key, asyncFn, metadata) => 
      optimizedPerformanceMonitor.measureAsync(`${componentName}-${key}`, asyncFn, metadata)
  };
};

export default optimizedPerformanceMonitor;
