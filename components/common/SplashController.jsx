import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useCartContext } from '../../context/CartContext';
import { addressService, categoriesAPI, orderService } from '../../services/api';
import apiService from '../../services/api/apiService';
import { isAuthenticated } from '../../services/auth';
import logger from '../../utils/logger';
import SplashScreenComponent from './SplashScreen';

// Prevent the native splash from auto-hiding initially
SplashScreen.preventAutoHideAsync().catch(() => {
  // If this fails, that's okay, we'll handle it manually
});

const SplashController = ({ children, onDataLoaded }) => {
  const [isAppReady, setIsAppReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Initializing...');
  const [error, setError] = useState(null);
  
  const { loading: authLoading, user, isLoggedIn } = useAuth();
  const { loading: cartLoading, fetchBackendCart } = useCartContext();
  
  const hasInitialized = useRef(false);
  const progressTimer = useRef(null);

  // Simulate smooth progress updates
  const updateProgress = useCallback((targetProgress, newStatus) => {
    if (progressTimer.current) {
      clearInterval(progressTimer.current);
    }

    if (newStatus) {
      setStatusText(newStatus);
    }

    progressTimer.current = setInterval(() => {
      setProgress(currentProgress => {
        const increment = (targetProgress - currentProgress) * 0.1;
        const newProgress = currentProgress + Math.max(increment, 1);
        
        if (newProgress >= targetProgress - 1) {
          clearInterval(progressTimer.current);
          return targetProgress;
        }
        
        return newProgress;
      });
    }, 50);
  }, []);

  const initializeApp = useCallback(async () => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    try {
      logger.info('Starting app initialization', null, 'SPLASH');
      
      // Ensure minimum splash duration for better UX (much longer in dev for testing)
      const minSplashDuration = __DEV__ ? 5000 : 2000; // 5 seconds in dev, 2 in production
      const startTime = Date.now();
      
      // In development, add extra delay to ensure visibility
      if (__DEV__) {
        logger.info('Development mode: Adding initial delay for splash visibility', null, 'SPLASH');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Step 1: Initialize API Service (10%)
      updateProgress(10, 'Setting up connections...');
      await apiService.initialize();
      await new Promise(resolve => setTimeout(resolve, __DEV__ ? 500 : 300));

      // Step 2: Wait for Auth Context to finish loading (30%)
      updateProgress(30, 'Verifying authentication...');
      let authWaitCounter = 0;
      while (authLoading && authWaitCounter < 50) { // Max 5 second wait
        await new Promise(resolve => setTimeout(resolve, 100));
        authWaitCounter++;
      }
      await new Promise(resolve => setTimeout(resolve, __DEV__ ? 500 : 200));

      // Step 3: Validate authentication if user exists (50%)
      if (isLoggedIn && user) {
        updateProgress(50, 'Validating session...');
        try {
          const authStatus = await isAuthenticated();
          if (!authStatus) {
            logger.warn('Authentication validation failed during splash', null, 'SPLASH');
          }
        } catch (authError) {
          logger.error('Auth validation error during splash', { error: authError.message }, 'SPLASH');
        }
      }
      await new Promise(resolve => setTimeout(resolve, __DEV__ ? 500 : 200));

      // Step 4: Load essential data (70%)
      updateProgress(70, 'Loading categories...');
      try {
        // Load all necessary data in parallel for better performance
        const dataPromises = [
          categoriesAPI.getAllCategories(user?.role || 'customer'),
          categoriesAPI.getAllItems(user?.role || 'customer'),
        ];

        // If user is logged in, also load user-specific data
        if (isLoggedIn && user) {
          updateProgress(75, 'Loading your data...');
          // Add user-specific data loading
          try {
            // Load user addresses and recent orders in parallel
            const userDataPromises = [
              addressService.getUserAddresses().catch(err => {
                logger.warn('Failed to preload addresses', { error: err.message }, 'SPLASH');
                return null;
              }),
              orderService.getUserOrders({ limit: 10 }).catch(err => {
                logger.warn('Failed to preload recent orders', { error: err.message }, 'SPLASH');
                return null;
              })
            ];
            
            dataPromises.push(...userDataPromises);
          } catch (userDataError) {
            logger.warn('Failed to load user-specific data', { error: userDataError.message }, 'SPLASH');
          }
        }
        
        const results = await Promise.allSettled(dataPromises);
        
        // Log results for debugging
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            logger.info(`Data load ${index + 1} completed successfully`, null, 'SPLASH');
          } else {
            logger.warn(`Data load ${index + 1} failed`, { error: result.reason?.message }, 'SPLASH');
          }
        });
        
        logger.info('Essential data loading completed', null, 'SPLASH');
      } catch (dataError) {
        logger.warn('Failed to load some essential data', { error: dataError.message }, 'SPLASH');
      }
      await new Promise(resolve => setTimeout(resolve, __DEV__ ? 500 : 200));

      // Step 5: Initialize cart if user is logged in (85%)
      if (isLoggedIn && user) {
        updateProgress(85, 'Syncing your cart...');
        try {
          await fetchBackendCart();
          let cartWaitCounter = 0;
          while (cartLoading && cartWaitCounter < 30) {
            await new Promise(resolve => setTimeout(resolve, 100));
            cartWaitCounter++;
          }
        } catch (cartError) {
          logger.warn('Failed to load cart during splash', { error: cartError.message }, 'SPLASH');
        }
      }
      await new Promise(resolve => setTimeout(resolve, __DEV__ ? 500 : 200));

      // Step 6: Final initialization (95%)
      updateProgress(95, 'Almost ready...');
      
      // Ensure minimum splash duration has passed
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < minSplashDuration) {
        await new Promise(resolve => setTimeout(resolve, minSplashDuration - elapsedTime));
      }

      // Step 7: Complete (100%)
      updateProgress(100, 'Welcome!');
      await new Promise(resolve => setTimeout(resolve, 800));

      logger.info('App initialization completed successfully', null, 'SPLASH');
      setIsAppReady(true);

    } catch (error) {
      logger.error('App initialization failed', { 
        error: error.message,
        stack: error.stack 
      }, 'SPLASH');
      
      setError(error);
      setTimeout(() => setIsAppReady(true), 2000);
    }
  }, [authLoading, isLoggedIn, user, fetchBackendCart, cartLoading, updateProgress]);

  useEffect(() => {
    // Reset initialization flag for development/hot reload
    if (__DEV__) {
      hasInitialized.current = false;
      logger.info('Development mode: Resetting splash initialization for hot reload', null, 'SPLASH');
    }
    
    // Hide the native splash screen immediately to show our custom one
    const hideNativeSplash = async () => {
      try {
        await SplashScreen.hideAsync();
        logger.info('Native splash screen hidden, showing custom splash', null, 'SPLASH');
      } catch (error) {
        logger.warn('Failed to hide native splash screen', { error: error.message }, 'SPLASH');
      }
    };
    
    hideNativeSplash();
    
    // Small delay to ensure splash screen is visible
    const initTimer = setTimeout(() => {
      logger.info('Starting splash initialization timer', null, 'SPLASH');
      initializeApp();
    }, __DEV__ ? 500 : 100); // Longer delay in development

    return () => {
      logger.info('Cleaning up splash initialization timer', null, 'SPLASH');
      clearTimeout(initTimer);
      if (progressTimer.current) {
        clearInterval(progressTimer.current);
      }
    };
  }, [initializeApp]);

  useEffect(() => {
    if (isAppReady) {
      // App is ready, don't hide native splash since it's already hidden
      // Just call the onDataLoaded callback
      const completeTransition = async () => {
        try {
          logger.info('App initialization complete, calling onDataLoaded', null, 'SPLASH');
          onDataLoaded?.();
        } catch (error) {
          logger.warn('Failed to complete transition', { error: error.message }, 'SPLASH');
        }
      };
      
      // Small delay for smooth transition
      setTimeout(completeTransition, 300);
    }
  }, [isAppReady, onDataLoaded]);

  // Show splash screen if app is not ready
  if (!isAppReady) {
    logger.info('Rendering splash screen', { 
      progress, 
      statusText, 
      isAppReady, 
      hasInitialized: hasInitialized.current 
    }, 'SPLASH');
    
    try {
      return (
        <View style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 99999,
          elevation: 99999,
          backgroundColor: '#0E9F6E',
        }}>
          <SplashScreenComponent
            progress={progress}
            statusText={error ? 'Starting app...' : statusText}
          />
        </View>
      );
    } catch (splashError) {
      logger.error('Splash screen component failed to render', { error: splashError.message }, 'SPLASH');
      // Fallback to a simple loading screen
      return (
        <View style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 99999,
          elevation: 99999,
          backgroundColor: '#0E9F6E', 
          justifyContent: 'center', 
          alignItems: 'center',
        }}>
          <Text style={{ color: 'white', fontSize: 24, marginBottom: 20 }}>RecycleApp</Text>
          <Text style={{ color: 'white', fontSize: 16 }}>{statusText}</Text>
        </View>
      );
    }
  }

  return children;
};

export default SplashController;
