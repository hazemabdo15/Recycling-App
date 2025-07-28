/**
 * Production-Optimized Performance Monitor
 * Features:
 * - Environment-aware monitoring
 * - Memory-efficient tracking
 * - Smart thresholds based on environment
 * - Automatic cleanup and reporting
 * - Zero-overhead in production when disabled
 */

import { isProduction } from '../config/env';
import logger from './logger';

// Environment-specific configurations
const PRODUCTION_CONFIG = {
  enabled: true, // Keep enabled for critical performance monitoring
  trackRenders: false, // Disable render tracking in production
  trackMemory: true,
  slowOperationThreshold: 200, // More lenient in production
  slowRenderThreshold: 32, // More lenient (30 FPS)
  maxMetricsHistory: 50, // Smaller memory footprint
  reportInterval: 300000, // 5 minutes
};

const DEVELOPMENT_CONFIG = {
  enabled: true,
  trackRenders: true,
  trackMemory: true,
  slowOperationThreshold: 100,
  slowRenderThreshold: 16, // 60 FPS
  maxMetricsHistory: 200,
  reportInterval: 60000, // 1 minute
};

class PerformanceMonitor {
  constructor() {
    const config = isProduction ? PRODUCTION_CONFIG : DEVELOPMENT_CONFIG;
    
    this.isEnabled = config.enabled;
    this.trackRenders = config.trackRenders;
    this.trackMemory = config.trackMemory;
    this.slowOperationThreshold = config.slowOperationThreshold;
    this.slowRenderThreshold = config.slowRenderThreshold;
    this.maxMetricsHistory = config.maxMetricsHistory;
    
    // Core tracking data structures
    this.metrics = new Map();
    this.renderMetrics = new Map();
    this.apiMetrics = new Map();
    this.memorySnapshots = [];
    
    // Performance statistics
    this.totalMeasurements = 0;
    this.slowOperations = 0;
    this.startTime = Date.now();
    
    // Auto-reporting for production monitoring
    if (isProduction && config.reportInterval) {
      this.reportInterval = setInterval(() => {
        this._generatePerformanceReport();
        this._cleanupOldMetrics();
      }, config.reportInterval);
    }
  }

  startTimer(key, metadata = {}) {
    if (!this.isEnabled) return;
    
    // Prevent memory leaks from abandoned timers
    if (this.metrics.has(key)) {
      logger.warn(`Performance timer '${key}' already exists, overwriting`, null, 'PERFORMANCE');
    }
    
    this.metrics.set(key, { 
      startTime: Date.now(),
      startMemory: this.trackMemory ? this._getMemoryUsage() : 0,
      metadata 
    });
  }

  endTimer(key, additionalMetadata = {}) {
    if (!this.isEnabled) return null;
    
    const metric = this.metrics.get(key);
    if (!metric) {
      if (!isProduction) {
        logger.warn(`Performance timer '${key}' not found`, null, 'PERFORMANCE');
      }
      return null;
    }

    const endTime = Date.now();
    const duration = endTime - metric.startTime;
    const endMemory = this.trackMemory ? this._getMemoryUsage() : 0;
    const memoryDelta = endMemory - metric.startMemory;

    const result = {
      duration,
      memoryDelta,
      timestamp: endTime,
      ...metric.metadata,
      ...additionalMetadata
    };

    // Track statistics
    this.totalMeasurements++;
    
    // Log slow operations with environment-appropriate thresholds
    const threshold = metric.metadata.type === 'render' ? 
      this.slowRenderThreshold : this.slowOperationThreshold;
    
    if (duration > threshold) {
      this.slowOperations++;
      
      // Only log in development or for critical slowdowns in production
      const shouldLog = !isProduction || duration > (threshold * 2);
      if (shouldLog) {
        logger.performance(`Slow ${metric.metadata.type || 'operation'}: ${key}`, {
          duration: `${duration}ms`,
          threshold: `${threshold}ms`,
          memoryDelta: `${memoryDelta}KB`,
          ...result
        }, 'WARN');
      }
    }

    // Store metrics for analysis
    this._storeMetric(key, result);
    this.metrics.delete(key);
    
    return result;
  }

  _storeMetric(key, result) {
    if (!this.isEnabled) return;
    
    const category = result.type || 'general';
    
    if (category === 'render' && this.trackRenders) {
      this._updateRenderMetrics(key, result);
    } else if (category === 'api') {
      this._updateApiMetrics(key, result);
    }
  }

  _updateRenderMetrics(componentName, result) {
    if (!this.trackRenders) return;
    
    const existing = this.renderMetrics.get(componentName) || {
      count: 0,
      totalDuration: 0,
      avgDuration: 0,
      maxDuration: 0,
      slowRenders: 0,
      lastMeasured: 0
    };

    existing.count++;
    existing.totalDuration += result.duration;
    existing.avgDuration = existing.totalDuration / existing.count;
    existing.maxDuration = Math.max(existing.maxDuration, result.duration);
    existing.lastMeasured = Date.now();
    
    if (result.duration > this.slowRenderThreshold) {
      existing.slowRenders++;
    }

    this.renderMetrics.set(componentName, existing);
    
    // Auto-cleanup old render metrics to prevent memory bloat
    this._cleanupRenderMetrics();
  }

  _updateApiMetrics(endpoint, result) {
    const existing = this.apiMetrics.get(endpoint) || {
      count: 0,
      totalDuration: 0,
      avgDuration: 0,
      maxDuration: 0,
      minDuration: Infinity,
      errors: 0,
      successRate: 100,
      lastCall: 0
    };

    existing.count++;
    existing.totalDuration += result.duration;
    existing.avgDuration = existing.totalDuration / existing.count;
    existing.maxDuration = Math.max(existing.maxDuration, result.duration);
    existing.minDuration = Math.min(existing.minDuration, result.duration);
    existing.lastCall = Date.now();
    
    if (result.error || result.success === false) {
      existing.errors++;
    }
    
    existing.successRate = ((existing.count - existing.errors) / existing.count) * 100;

    this.apiMetrics.set(endpoint, existing);
    
    // Log API performance issues in production
    if (isProduction && existing.count > 5) {
      const avgDuration = existing.avgDuration;
      const errorRate = 100 - existing.successRate;
      
      if (avgDuration > this.slowOperationThreshold || errorRate > 10) {
        logger.performance(`API performance concern: ${endpoint}`, {
          avgDuration: `${avgDuration.toFixed(2)}ms`,
          errorRate: `${errorRate.toFixed(1)}%`,
          totalCalls: existing.count
        }, 'WARN');
      }
    }
  }

  _cleanupRenderMetrics() {
    if (this.renderMetrics.size <= this.maxMetricsHistory) return;
    
    // Remove oldest render metrics
    const entries = Array.from(this.renderMetrics.entries());
    entries.sort((a, b) => (a[1].lastMeasured || 0) - (b[1].lastMeasured || 0));
    
    // Remove oldest 20%
    const toRemove = Math.floor(entries.length * 0.2);
    for (let i = 0; i < toRemove; i++) {
      this.renderMetrics.delete(entries[i][0]);
    }
  }

  _cleanupOldMetrics() {
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10 minutes
    
    // Cleanup old render metrics
    for (const [key, metrics] of this.renderMetrics.entries()) {
      if (now - (metrics.lastMeasured || 0) > maxAge) {
        this.renderMetrics.delete(key);
      }
    }
    
    // Cleanup old API metrics
    for (const [key, metrics] of this.apiMetrics.entries()) {
      if (now - (metrics.lastCall || 0) > maxAge) {
        this.apiMetrics.delete(key);
      }
    }
    
    // Cleanup memory snapshots
    if (this.memorySnapshots.length > 20) {
      this.memorySnapshots = this.memorySnapshots.slice(-10);
    }
  }

  measureRender(componentName, renderFn) {
    // Skip render monitoring in production unless explicitly enabled
    if (!this.isEnabled || !this.trackRenders) {
      return renderFn();
    }
    
    const key = `render-${componentName}`;
    this.startTimer(key, { type: 'render', component: componentName });
    
    try {
      const result = renderFn();
      this.endTimer(key, { success: true });
      return result;
    } catch (error) {
      this.endTimer(key, { success: false, error: error.message });
      logger.error(`Render error in ${componentName}`, error, 'PERFORMANCE');
      throw error;
    }
  }

  measureAsync(key, asyncFn, metadata = {}) {
    if (!this.isEnabled) return asyncFn();
    
    // Add timeout protection for async operations
    const timeout = metadata.timeout || 30000; // 30 second default
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Operation timeout: ${key}`)), timeout);
    });
    
    this.startTimer(key, metadata);
    
    return Promise.race([asyncFn(), timeoutPromise])
      .then(result => {
        this.endTimer(key, { success: true });
        return result;
      })
      .catch(error => {
        this.endTimer(key, { 
          success: false, 
          error: error.message,
          isTimeout: error.message.includes('timeout')
        });
        
        // Log timeouts as performance issues
        if (error.message.includes('timeout')) {
          logger.performance(`Operation timeout: ${key}`, {
            timeout: `${timeout}ms`,
            metadata
          }, 'ERROR');
        }
        
        throw error;
      });
  }

  measureApiCall(endpoint, apiCallFn, options = {}) {
    if (!this.isEnabled) return apiCallFn();
    
    const key = `api-${endpoint}`;
    const startTime = Date.now();
    
    return this.measureAsync(key, apiCallFn, { 
      type: 'api', 
      endpoint,
      method: options.method || 'GET',
      timeout: options.timeout || 15000,
      ...options 
    }).catch(error => {
      // Track API failures for monitoring
      const duration = Date.now() - startTime;
      
      if (isProduction && duration > 5000) {
        logger.api(`Slow API call: ${endpoint}`, {
          duration: `${duration}ms`,
          error: error.message,
          method: options.method || 'GET'
        }, 'ERROR');
      }
      
      throw error;
    });
  }

  _getMemoryUsage() {
    try {
      // React Native doesn't have performance.memory, so we'll use a fallback
      if (typeof performance !== 'undefined' && performance.memory) {
        return Math.round(performance.memory.usedJSHeapSize / 1024); // KB
      }
      return 0;
    } catch (_error) {
      return 0;
    }
  }

  takeMemorySnapshot(label = '') {
    const snapshot = {
      timestamp: Date.now(),
      label,
      memoryUsage: this._getMemoryUsage()
    };
    
    this.memorySnapshots.push(snapshot);
    
    // Keep only last 20 snapshots
    if (this.memorySnapshots.length > 20) {
      this.memorySnapshots.shift();
    }
    
    return snapshot;
  }

  _generatePerformanceReport() {
    const report = this.getPerformanceReport();
    
    // In production, only log if there are performance issues
    if (isProduction) {
      const hasIssues = report.summary.slowComponents > 0 || 
                       report.summary.slowApiEndpoints > 0 ||
                       this.slowOperations > (this.totalMeasurements * 0.1); // More than 10% slow
      
      if (hasIssues) {
        logger.performance('Performance issues detected', {
          slowComponents: report.summary.slowComponents,
          slowApiEndpoints: report.summary.slowApiEndpoints,
          slowOperationRate: `${((this.slowOperations / this.totalMeasurements) * 100).toFixed(1)}%`,
          totalMeasurements: this.totalMeasurements
        }, 'WARN');
      }
    } else {
      logger.performance('Performance report', report.summary);
    }
    
    return report;
  }

  getPerformanceReport() {
    const uptime = Date.now() - this.startTime;
    
    const report = {
      timestamp: new Date().toISOString(),
      uptime: `${Math.round(uptime / 1000)}s`,
      renderMetrics: this.trackRenders ? Object.fromEntries(this.renderMetrics) : {},
      apiMetrics: Object.fromEntries(this.apiMetrics),
      memorySnapshots: this.memorySnapshots.slice(-5),
      statistics: {
        totalMeasurements: this.totalMeasurements,
        slowOperations: this.slowOperations,
        slowOperationRate: this.totalMeasurements > 0 ? 
          `${((this.slowOperations / this.totalMeasurements) * 100).toFixed(1)}%` : '0%',
        averageMemory: this.memorySnapshots.length > 0 ?
          `${Math.round(this.memorySnapshots.reduce((sum, s) => sum + s.memoryUsage, 0) / this.memorySnapshots.length)}KB` : '0KB'
      },
      summary: {
        totalComponents: this.renderMetrics.size,
        slowComponents: this.getSlowComponents().length,
        totalApiEndpoints: this.apiMetrics.size,
        slowApiEndpoints: this.getSlowApiEndpoints().length,
        currentMemory: `${this._getMemoryUsage()}KB`,
        isHealthy: this.slowOperations < (this.totalMeasurements * 0.05) // Less than 5% slow operations
      }
    };

    if (!isProduction) {
      logger.performance('Performance Report Generated', report.summary);
    }
    
    return report;
  }

  getSlowComponents() {
    if (!this.trackRenders) return [];
    
    return Array.from(this.renderMetrics.entries())
      .filter(([, metrics]) => metrics.avgDuration > this.slowRenderThreshold || metrics.slowRenders > 0)
      .map(([name, metrics]) => ({ 
        name, 
        ...metrics,
        slowRenderRate: `${((metrics.slowRenders / metrics.count) * 100).toFixed(1)}%`
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration);
  }

  getSlowApiEndpoints() {
    return Array.from(this.apiMetrics.entries())
      .filter(([, metrics]) => {
        return metrics.avgDuration > this.slowOperationThreshold || 
               metrics.successRate < 95 || // Less than 95% success rate
               (metrics.count > 5 && metrics.errors > 1); // Multiple errors
      })
      .map(([endpoint, metrics]) => ({ 
        endpoint, 
        ...metrics,
        avgDuration: `${metrics.avgDuration.toFixed(2)}ms`,
        successRate: `${metrics.successRate.toFixed(1)}%`,
        errorRate: `${(100 - metrics.successRate).toFixed(1)}%`
      }))
      .sort((a, b) => parseFloat(b.avgDuration) - parseFloat(a.avgDuration));
  }

  clearMetrics() {
    this.metrics.clear();
    this.renderMetrics.clear();
    this.apiMetrics.clear();
    this.memorySnapshots = [];
    this.totalMeasurements = 0;
    this.slowOperations = 0;
    
    if (!isProduction) {
      logger.info('Performance metrics cleared', null, 'PERFORMANCE');
    }
  }

  setThresholds(slowOperation = 100, slowRender = 16) {
    this.slowOperationThreshold = slowOperation;
    this.slowRenderThreshold = slowRender;
    
    if (!isProduction) {
      logger.info('Performance thresholds updated', {
        slowOperation: `${slowOperation}ms`,
        slowRender: `${slowRender}ms`
      }, 'PERFORMANCE');
    }
  }

  enable() {
    this.isEnabled = true;
    if (!isProduction) {
      logger.info('Performance monitoring enabled', null, 'PERFORMANCE');
    }
  }

  disable() {
    this.isEnabled = false;
    if (!isProduction) {
      logger.info('Performance monitoring disabled', null, 'PERFORMANCE');
    }
  }

  // Production-ready cleanup
  destroy() {
    if (this.reportInterval) {
      clearInterval(this.reportInterval);
      this.reportInterval = null;
    }
    
    // Generate final report before cleanup
    if (isProduction && this.totalMeasurements > 0) {
      this._generatePerformanceReport();
    }
    
    this.clearMetrics();
    this.isEnabled = false;
  }

  // Health check for monitoring systems
  getHealthStatus() {
    const totalMeasurements = this.totalMeasurements;
    const slowOperations = this.slowOperations;
    const slowRate = totalMeasurements > 0 ? (slowOperations / totalMeasurements) : 0;
    
    const status = {
      healthy: slowRate < 0.05, // Less than 5% slow operations
      totalMeasurements,
      slowOperations,
      slowOperationRate: `${(slowRate * 100).toFixed(1)}%`,
      uptime: Date.now() - this.startTime,
      memoryUsage: this._getMemoryUsage(),
      isEnabled: this.isEnabled
    };
    
    return status;
  }
}

// Create singleton instance with cleanup handling
const performanceMonitor = new PerformanceMonitor();

// Cleanup on app termination (React Native compatible)
// React Native apps don't have traditional process lifecycle events
// Cleanup is handled through the destroy() method when needed or app state changes

// React hooks for easy integration (production-optimized)
export const usePerformanceMonitor = (componentName) => {
  // Early return in production if render tracking is disabled
  if (isProduction && !performanceMonitor.trackRenders) {
    return {
      measureRender: (renderFn) => renderFn(),
      measureAsync: (key, asyncFn) => asyncFn(),
      takeSnapshot: () => ({})
    };
  }
  
  return {
    measureRender: (renderFn) => performanceMonitor.measureRender(componentName, renderFn),
    measureAsync: (key, asyncFn, metadata) => 
      performanceMonitor.measureAsync(`${componentName}-${key}`, asyncFn, metadata),
    takeSnapshot: (label) => performanceMonitor.takeMemorySnapshot(`${componentName}-${label}`)
  };
};

// Higher-order component for automatic performance monitoring
export const withPerformanceMonitoring = (WrappedComponent) => {
  // Skip wrapping in production if render tracking is disabled
  if (isProduction && !performanceMonitor.trackRenders) {
    return WrappedComponent;
  }
  
  const ComponentWithMonitoring = (props) => {
    const componentName = WrappedComponent.displayName || WrappedComponent.name || 'Anonymous';
    
    return performanceMonitor.measureRender(
      componentName,
      () => <WrappedComponent {...props} />
    );
  };
  
  ComponentWithMonitoring.displayName = `withPerformanceMonitoring(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;
  
  return ComponentWithMonitoring;
};

// Production-optimized utility functions
export const measureApiCall = (apiCall, endpoint, options = {}) => {
  return performanceMonitor.measureApiCall(endpoint, apiCall, options);
};

export const trackMemoryUsage = (label) => {
  if (!performanceMonitor.trackMemory) return {};
  return performanceMonitor.takeMemorySnapshot(label);
};

export const getPerformanceReport = () => {
  return performanceMonitor.getPerformanceReport();
};

export const getHealthStatus = () => {
  return performanceMonitor.getHealthStatus();
};

// Debug utilities (development only)
export const getSlowComponents = () => {
  if (isProduction) return [];
  return performanceMonitor.getSlowComponents();
};

export const getSlowApiEndpoints = () => {
  return performanceMonitor.getSlowApiEndpoints();
};

export const clearPerformanceMetrics = () => {
  if (!isProduction) {
    performanceMonitor.clearMetrics();
  }
};

export default performanceMonitor;
