

import { isProduction } from '../config/env';
import logger from './logger';

const OPTIMIZED_PRODUCTION_CONFIG = {
  enabled: true,
  trackRenders: false,
  trackMemory: false,
  slowOperationThreshold: 300,
  slowRenderThreshold: 50,
  maxMetricsHistory: 20,
  reportInterval: 600000,
  samplingRate: 0.1,
  emergencyThrottleRate: 0.01
};

const OPTIMIZED_DEVELOPMENT_CONFIG = {
  enabled: true,
  trackRenders: true,
  trackMemory: true,
  slowOperationThreshold: 150,
  slowRenderThreshold: 20,
  maxMetricsHistory: 100,
  reportInterval: 120000,
  samplingRate: 0.3,
  emergencyThrottleRate: 0.05
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

    this.activeTimers = new Map();
    this.criticalMetrics = new Map();
    this.apiSummary = new Map();

    this.totalMeasurements = 0;
    this.criticalSlowOperations = 0;
    this.startTime = Date.now();
    this.lastCleanup = Date.now();

    this.isEmergencyMode = false;
    this.currentSamplingRate = this.samplingRate;

    if (config.reportInterval) {
      this.reportInterval = setInterval(() => {
        this.generateOptimizedReport();
        this.performMaintenanceCleanup();
      }, config.reportInterval);
    }
  }

  shouldTrack() {
    if (!this.isEnabled) return false;

    if (this.isEmergencyMode) {
      return Math.random() < this.emergencyThrottleRate;
    }
    
    return Math.random() < this.currentSamplingRate;
  }

  startTimer(key, metadata = {}) {
    if (!this.shouldTrack()) return false;
    
    this.activeTimers.set(key, {
      start: Date.now(),
      metadata
    });
    return true;
  }

  endTimer(key, additionalMetadata = {}) {
    const timer = this.activeTimers.get(key);
    if (!timer) return null;

    const duration = Date.now() - timer.start;
    this.totalMeasurements++;

    const threshold = timer.metadata.type === 'render' ? 
      this.slowRenderThreshold : this.slowOperationThreshold;
    
    if (duration > threshold) {
      this.criticalSlowOperations++;

      this.storeCriticalMetric(key, {
        duration,
        type: timer.metadata.type || 'operation',
        timestamp: Date.now(),
        ...timer.metadata,
        ...additionalMetadata
      });

      this.checkEmergencyMode();
    }

    if (timer.metadata.type === 'api') {
      this.updateApiSummary(timer.metadata.endpoint || key, duration, additionalMetadata.success !== false);
    }

    this.activeTimers.delete(key);
    return { duration, tracked: true };
  }

  storeCriticalMetric(key, metric) {

    if (this.criticalMetrics.size >= this.maxMetricsHistory) {
      const oldestKey = this.criticalMetrics.keys().next().value;
      this.criticalMetrics.delete(oldestKey);
    }
    
    this.criticalMetrics.set(`${key}-${Date.now()}`, metric);
  }

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

  checkEmergencyMode() {
    const slowRate = this.totalMeasurements > 0 ? 
      (this.criticalSlowOperations / this.totalMeasurements) : 0;
    
    const shouldActivateEmergency = slowRate > 0.5;
    
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

  measureAsync(key, asyncFn, metadata = {}) {
    if (!this.startTimer(key, metadata)) {
      return asyncFn();
    }
    
    const timeout = metadata.timeout || 15000;
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

  measureApiCall(endpoint, apiCallFn, options = {}) {
    const key = `api-${endpoint}`;
    return this.measureAsync(key, apiCallFn, { 
      type: 'api', 
      endpoint,
      timeout: options.timeout || 10000,
      ...options 
    });
  }

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
        isHealthy: slowRate < 0.1,
        emergencyMode: this.isEmergencyMode,
        memoryUsage: this.criticalMetrics.size + this.apiSummary.size
      }
    };

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

  performMaintenanceCleanup() {
    const now = Date.now();

    if (now - this.lastCleanup < 300000) return;

    if (this.criticalMetrics.size > this.maxMetricsHistory) {
      const entries = Array.from(this.criticalMetrics.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

      const toRemove = Math.floor(entries.length * 0.5);
      for (let i = 0; i < toRemove; i++) {
        this.criticalMetrics.delete(entries[i][0]);
      }
    }

    this.lastCleanup = now;
  }

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

  clearMetrics() {
    this.criticalMetrics.clear();
    this.apiSummary.clear();
    this.activeTimers.clear();
    this.totalMeasurements = 0;
    this.criticalSlowOperations = 0;
    this.isEmergencyMode = false;
    this.currentSamplingRate = this.samplingRate;
  }

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

  destroy() {
    if (this.reportInterval) {
      clearInterval(this.reportInterval);
      this.reportInterval = null;
    }
    
    this.clearMetrics();
    this.isEnabled = false;
  }
}

const optimizedPerformanceMonitor = new OptimizedPerformanceMonitor();

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

export const useOptimizedPerformanceMonitor = (componentName) => {
  return {
    measureAsync: (key, asyncFn, metadata) => 
      optimizedPerformanceMonitor.measureAsync(`${componentName}-${key}`, asyncFn, metadata)
  };
};

export default optimizedPerformanceMonitor;
