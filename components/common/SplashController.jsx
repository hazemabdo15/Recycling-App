﻿import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useCartContext } from '../../context/CartContext';
import { addressService, categoriesAPI, orderService } from '../../services/api';
import apiService from '../../services/api/apiService';
import { isAuthenticated } from '../../services/auth';
import logger from '../../utils/logger';
import SplashScreenComponent from './SplashScreen';

SplashScreen.preventAutoHideAsync().catch(() => {

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

      const minSplashDuration = __DEV__ ? 5000 : 2000;
      const startTime = Date.now();

      if (__DEV__) {
        logger.info('Development mode: Adding initial delay for splash visibility', null, 'SPLASH');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      updateProgress(10, 'Setting up connections...');
      await apiService.initialize();
      await new Promise(resolve => setTimeout(resolve, __DEV__ ? 500 : 300));

      updateProgress(30, 'Verifying authentication...');
      let authWaitCounter = 0;
      while (authLoading && authWaitCounter < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        authWaitCounter++;
      }
      await new Promise(resolve => setTimeout(resolve, __DEV__ ? 500 : 200));

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

      updateProgress(70, 'Loading categories...');
      try {

        const dataPromises = [
          categoriesAPI.getAllCategories(user?.role || 'customer'),
          categoriesAPI.getAllItems(user?.role || 'customer'),
        ];

        if (isLoggedIn && user) {
          updateProgress(75, 'Loading your data...');

          try {

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

      updateProgress(95, 'Almost ready...');

      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < minSplashDuration) {
        await new Promise(resolve => setTimeout(resolve, minSplashDuration - elapsedTime));
      }

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

    if (__DEV__) {
      hasInitialized.current = false;
      logger.info('Development mode: Resetting splash initialization for hot reload', null, 'SPLASH');
    }

    const hideNativeSplash = async () => {
      try {
        await SplashScreen.hideAsync();
        logger.info('Native splash screen hidden, showing custom splash', null, 'SPLASH');
      } catch (error) {
        logger.warn('Failed to hide native splash screen', { error: error.message }, 'SPLASH');
      }
    };
    
    hideNativeSplash();

    const initTimer = setTimeout(() => {
      logger.info('Starting splash initialization timer', null, 'SPLASH');
      initializeApp();
    }, __DEV__ ? 500 : 100);

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

      const completeTransition = async () => {
        try {
          logger.info('App initialization complete, calling onDataLoaded', null, 'SPLASH');
          onDataLoaded?.();
        } catch (error) {
          logger.warn('Failed to complete transition', { error: error.message }, 'SPLASH');
        }
      };

      setTimeout(completeTransition, 300);
    }
  }, [isAppReady, onDataLoaded]);

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
