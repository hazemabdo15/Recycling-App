
/**
 * Production-Optimized Environment Configuration
 * Centralized configuration management for different environments
 * Features: Performance, logging control, feature flags
 */

import Constants from 'expo-constants';
import logger from '../utils/logger';

// Environment detection
export const ENV = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  STAGING: 'staging'
};

export const getCurrentEnv = () => {
  if (__DEV__) return ENV.DEVELOPMENT;
  
  // You can add logic here to detect staging vs production
  const releaseChannel = Constants.expoConfig?.releaseChannel;
  if (releaseChannel === 'staging') return ENV.STAGING;
  
  return ENV.PRODUCTION;
};

export const isDevelopment = () => getCurrentEnv() === ENV.DEVELOPMENT;
export const isProduction = () => getCurrentEnv() === ENV.PRODUCTION;
export const isStaging = () => getCurrentEnv() === ENV.STAGING;

// API Configuration with environment-specific optimizations
const API_CONFIGS = {
  [ENV.DEVELOPMENT]: {
    baseUrl: 'http://192.168.0.165:5000',
    timeout: 30000,
    retries: 3,
    debug: true
  },
  [ENV.STAGING]: {
    baseUrl: 'https://staging-api.recycling-app.com',
    timeout: 15000,
    retries: 2,
    debug: true
  },
  [ENV.PRODUCTION]: {
    baseUrl: 'https://api.recycling-app.com',
    timeout: 10000,
    retries: 1,
    debug: false
  }
};

export const getApiConfig = () => {
  const env = getCurrentEnv();
  const config = API_CONFIGS[env];
  
  if (!isProduction()) {
    logger.info(`Using API config for ${env}`, {
      baseUrl: config.baseUrl,
      timeout: config.timeout,
      retries: config.retries
    });
  }
  
  return config;
};

// Feature Flags for Production Optimization
export const FEATURE_FLAGS = {
  // Logging configuration
  ENABLE_CONSOLE_LOGS: isDevelopment(),
  ENABLE_DEBUG_LOGS: isDevelopment(),
  ENABLE_PERFORMANCE_LOGS: true, // Keep enabled for production monitoring
  ENABLE_REMOTE_LOGGING: isProduction(),
  
  // Performance monitoring
  ENABLE_PERFORMANCE_MONITORING: true,
  ENABLE_RENDER_TRACKING: isDevelopment(), // Disable in production for performance
  ENABLE_MEMORY_TRACKING: true,
  ENABLE_API_MONITORING: true,
  
  // Development features
  ENABLE_REDUX_DEVTOOLS: isDevelopment(),
  ENABLE_FLIPPER: isDevelopment(),
  ENABLE_NETWORK_INSPECTOR: isDevelopment(),
  
  // Production optimizations
  ENABLE_CODE_SPLITTING: isProduction(),
  ENABLE_BUNDLE_ANALYZER: isDevelopment(),
  ENABLE_MINIFICATION: isProduction(),
  
  // Security features
  ENABLE_SSL_PINNING: isProduction(),
  ENABLE_ROOT_DETECTION: isProduction(),
  ENABLE_DEBUG_PROTECTION: isProduction(),
};

// Secure API Key Management
const getSecureApiKey = () => {
  try {
    // Try environment variable first
    const fromEnv = process.env.EXPO_PUBLIC_GROQ_API_KEY;
    
    // Try Expo constants
    const fromConstants = Constants.expoConfig?.extra?.EXPO_PUBLIC_GROQ_API_KEY;
    
    // Development fallback (remove in production)
    const devKey = isDevelopment() ? process.env.EXPO_PUBLIC_GROQ_API_KEY : null;
    
    const apiKey = fromEnv || fromConstants || devKey;
    
    if (!apiKey || apiKey === 'your-api-key-here') {
      const message = 'No valid API key found. Please check your environment configuration.';
      
      if (isProduction()) {
        logger.error(message, null, 'CONFIG');
        // In production, this should be a critical error
        throw new Error(message);
      } else {
        logger.warn(message, null, 'CONFIG');
      }
      
      return null;
    }
    
    if (!isProduction()) {
      logger.debug('API key loaded successfully', { hasKey: !!apiKey }, 'CONFIG');
    }
    return apiKey;
    
  } catch (error) {
    logger.error('Failed to load API key', error, 'CONFIG');
    if (isProduction()) {
      throw error;
    }
    return null;
  }
};

// App Configuration Export
export const APP_CONFIG = {
  VERSION: '1.0.0', // Static version - update manually or use build script
  BUILD_NUMBER: Constants.expoConfig?.ios?.buildNumber || 
                Constants.expoConfig?.android?.versionCode || '1',
  APP_NAME: Constants.expoConfig?.name || 'Recycling App',
  ENVIRONMENT: getCurrentEnv(),
  IS_DEVELOPMENT: isDevelopment(),
  IS_PRODUCTION: isProduction(),
  IS_STAGING: isStaging(),
  FEATURE_FLAGS,
  API: getApiConfig(),
  GROQ_API_KEY: getSecureApiKey(),
};

// Logging Configuration for Production
export const configureLogging = () => {
  logger.setConsoleLogging(FEATURE_FLAGS.ENABLE_CONSOLE_LOGS);
  logger.setRemoteLogging(FEATURE_FLAGS.ENABLE_REMOTE_LOGGING);
  
  // Set appropriate log levels based on environment
  if (isDevelopment()) {
    logger.setLogLevel(3); // DEBUG - full logging in development
  } else if (isStaging()) {
    logger.setLogLevel(2); // INFO - moderate logging in staging
  } else {
    logger.setLogLevel(1); // WARN - minimal logging in production for performance
  }
  
  if (!isProduction()) {
    logger.info('Logging system configured', {
      environment: getCurrentEnv(),
      consoleLogging: FEATURE_FLAGS.ENABLE_CONSOLE_LOGS,
      remoteLogging: FEATURE_FLAGS.ENABLE_REMOTE_LOGGING,
      performanceLogging: FEATURE_FLAGS.ENABLE_PERFORMANCE_LOGS
    }, 'CONFIG');
  }
};

// Performance Configuration
export const configurePerformanceMonitoring = () => {
  if (!FEATURE_FLAGS.ENABLE_PERFORMANCE_MONITORING) {
    require('../utils/performanceMonitor').default.disable();
    return;
  }
  
  const performanceMonitor = require('../utils/performanceMonitor').default;
  
  // Environment-specific thresholds
  if (isProduction()) {
    performanceMonitor.setThresholds(200, 32); // More lenient in production
  } else {
    performanceMonitor.setThresholds(100, 16); // Strict in development
  }
  
  if (!isProduction()) {
    logger.info('Performance monitoring configured', {
      enabled: true,
      renderTracking: FEATURE_FLAGS.ENABLE_RENDER_TRACKING,
      memoryTracking: FEATURE_FLAGS.ENABLE_MEMORY_TRACKING,
      apiMonitoring: FEATURE_FLAGS.ENABLE_API_MONITORING
    }, 'CONFIG');
  }
};

// Initialize app configuration
export const initializeAppConfig = () => {
  try {
    configureLogging();
    configurePerformanceMonitoring();
    
    if (!isProduction()) {
      logger.info('App configuration initialized', {
        version: APP_CONFIG.VERSION,
        environment: APP_CONFIG.ENVIRONMENT,
        features: Object.keys(FEATURE_FLAGS).filter(key => FEATURE_FLAGS[key]).length
      }, 'CONFIG');
    }
    
    return APP_CONFIG;
  } catch (error) {
    // Use console.error as fallback since logger might not be ready
    console.error('Failed to initialize app configuration:', error);
    throw error;
  }
};

export { getSecureApiKey };
export default APP_CONFIG;
