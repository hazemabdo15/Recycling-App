

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.isEnabled = __DEV__;
  }

  startTimer(key) {
    if (!this.isEnabled) return;
    this.metrics.set(key, { startTime: Date.now() });
  }

  endTimer(key, metadata = {}) {
    if (!this.isEnabled) return;
    
    const metric = this.metrics.get(key);
    if (!metric) return;

    const duration = Date.now() - metric.startTime;

    const threshold = metadata.type === 'render' ? 16 : 100;
    if (duration > threshold) {
      console.warn(`⚠️ Slow ${metadata.type || 'operation'}: ${key} took ${duration}ms`, metadata);
    }

    this.metrics.delete(key);
    return duration;
  }

  measureRender(componentName, renderFn) {
    if (!this.isEnabled) return renderFn();
    
    const key = `render-${componentName}`;
    this.startTimer(key);
    
    try {
      const result = renderFn();
      this.endTimer(key, { type: 'render', component: componentName });
      return result;
    } catch (error) {
      this.endTimer(key, { type: 'render', component: componentName, error: true });
      throw error;
    }
  }

  measureAsync(key, asyncFn, metadata = {}) {
    if (!this.isEnabled) return asyncFn();
    
    this.startTimer(key);
    
    return asyncFn()
      .then(result => {
        this.endTimer(key, { ...metadata, success: true });
        return result;
      })
      .catch(error => {
        this.endTimer(key, { ...metadata, success: false, error: error.message });
        throw error;
      });
  }

  getMetrics() {
    return Object.fromEntries(this.metrics);
  }

  clearMetrics() {
    this.metrics.clear();
  }
}

export const usePerformanceMonitor = (componentName) => {
  const monitor = performanceMonitor;
  
  return {
    measureRender: (renderFn) => monitor.measureRender(componentName, renderFn),
    measureAsync: (key, asyncFn, metadata) => 
      monitor.measureAsync(`${componentName}-${key}`, asyncFn, metadata),
  };
};

export const withPerformanceMonitoring = (WrappedComponent) => {
  const ComponentWithMonitoring = (props) => {
    const monitor = performanceMonitor;
    
    return monitor.measureRender(
      WrappedComponent.displayName || WrappedComponent.name || 'Anonymous',
      () => <WrappedComponent {...props} />
    );
  };
  
  ComponentWithMonitoring.displayName = `withPerformanceMonitoring(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;
  
  return ComponentWithMonitoring;
};

export const measureApiCall = (apiCall, endpoint) => {
  return performanceMonitor.measureAsync(
    `api-${endpoint}`,
    apiCall,
    { type: 'api', endpoint }
  );
};

export const trackMemoryUsage = () => {
  if (!__DEV__) return;

  const used = performance?.memory?.usedJSHeapSize;
  const total = performance?.memory?.totalJSHeapSize;
  
  if (used && total) {
    const percentage = ((used / total) * 100).toFixed(2);
    console.log(`📊 Memory usage: ${(used / 1048576).toFixed(2)}MB / ${(total / 1048576).toFixed(2)}MB (${percentage}%)`);
  }
};

const performanceMonitor = new PerformanceMonitor();

export default performanceMonitor;
