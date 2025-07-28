/**
 * Production-Ready App Initializer
 * Sets up all production optimizations and configurations
 */

import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { initializeAppConfig } from '../config/env';
import { replaceGlobalConsole } from '../utils/consoleReplacer';
import logger from '../utils/logger';
import performanceMonitor from '../utils/performanceMonitor';

const AppInitializer = ({ children, onInitialized }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState(null);

  useEffect(() => {
    const initializeApp = async () => {
      const startTime = Date.now();
      
      try {
        // Step 1: Replace console with structured logging
        replaceGlobalConsole();
        
        // Step 2: Initialize app configuration
        const appConfig = initializeAppConfig();
        
        // Step 3: Setup performance monitoring
        performanceMonitor.takeMemorySnapshot('app-startup');
        
        // Step 4: Log successful initialization
        logger.info('App initialization completed', {
          duration: Date.now() - startTime,
          version: appConfig.VERSION,
          environment: appConfig.ENVIRONMENT,
          features: Object.keys(appConfig.FEATURE_FLAGS).filter(
            key => appConfig.FEATURE_FLAGS[key]
          ).length
        });
        
        setIsInitialized(true);
        onInitialized?.(appConfig);
        
      } catch (error) {
        logger.error('App initialization failed', {
          error: error.message,
          stack: error.stack
        });
        setInitError(error);
      }
    };

    initializeApp();
  }, [onInitialized]);

  if (initError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: 'red', textAlign: 'center', marginBottom: 10 }}>
          Failed to initialize app
        </Text>
        <Text style={{ color: 'gray', textAlign: 'center', fontSize: 12 }}>
          {initError.message}
        </Text>
      </View>
    );
  }

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 16, color: 'gray' }}>
          Initializing app...
        </Text>
      </View>
    );
  }

  return children;
};

export default AppInitializer;
