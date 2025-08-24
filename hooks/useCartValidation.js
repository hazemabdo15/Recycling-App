/**
 * Custom hook for cart stock validation
 * 
 * Provides cart validation functionality that can be used across components
 * Handles app state changes, focus events, and manual validation triggers
 */

import { useFocusEffect } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useCartContext } from '../context/CartContext';
import { useStock } from '../context/StockContext';
import { CartStockValidator } from '../services/cartStockValidator';
import logger from '../utils/logger';
import { isBuyer } from '../utils/roleUtils';

export const useCartValidation = (options = {}) => {
  const {
    validateOnFocus = false,
    validateOnAppActivation = true,
    autoCorrect = true,
    showMessages = true,
    source = 'useCartValidation'
  } = options;

  const { user } = useAuth();
  const { 
    cartItems, 
    cartItemDetails, 
    handleUpdateQuantity,
    loading: cartLoading 
  } = useCartContext();
  const { stockQuantities, lastUpdated } = useStock();
  
  const appStateRef = useRef(AppState.currentState);
  const lastValidationRef = useRef(0);
  const validationInProgressRef = useRef(false);
  const lastStockUpdateRef = useRef(null);

  // Only validate for buyer users
  const shouldValidate = isBuyer(user) && !cartLoading;

  /**
   * Perform cart validation
   */
  const validateCart = useCallback(async (validationOptions = {}) => {
    if (!shouldValidate || validationInProgressRef.current) {
      return { success: true, noAction: true };
    }

    const { immediate = false } = validationOptions;
    const now = Date.now();
    
    // Bypass cooldown for real-time updates with optimized delay for backend rate limiting
    if (!immediate && (now - lastValidationRef.current) < 3000) { // Reduced back to 3s since backend is rate-limited
      return { success: true, skipped: true };
    }

    validationInProgressRef.current = true;
    lastValidationRef.current = now;

    try {
      const updateFunction = async (itemId, newQuantity) => {
        const item = cartItemDetails[itemId];
        const measurementUnit = item?.measurement_unit || (item?.unit === 'KG' ? 1 : 2);
        
        if (newQuantity === 0) {
          await handleUpdateQuantity(itemId, 0, measurementUnit);
        } else {
          await handleUpdateQuantity(itemId, newQuantity, measurementUnit);
        }
      };

      const result = await CartStockValidator.validateAndCorrectCart(
        cartItems,
        cartItemDetails,
        stockQuantities,
        updateFunction,
        {
          autoCorrect,
          showMessages,
          source: validationOptions.source || source,
          forceValidation: validationOptions.forceValidation || immediate,
          ...validationOptions
        }
      );

      if (result.corrected && showMessages) {
        logger.cart(`✅ Cart auto-corrected due to stock changes: ${result.fixes?.length || 0} fixes applied`);
      }

      return result;

    } catch (error) {
      logger.error('Cart validation failed:', error);
      return { success: false, error: error.message };
    } finally {
      validationInProgressRef.current = false;
    }
  }, [shouldValidate, cartItems, cartItemDetails, stockQuantities, handleUpdateQuantity, autoCorrect, showMessages, source]);

  /**
   * Quick validation without auto-correction
   */
  const quickValidateCart = useCallback(async () => {
    if (!shouldValidate) {
      return { isValid: true, issues: [] };
    }

    return CartStockValidator.quickValidate(cartItems, stockQuantities, cartItemDetails);
  }, [shouldValidate, cartItems, stockQuantities, cartItemDetails]);

  /**
   * Force validation regardless of cooldown
   */
  const forceValidateCart = useCallback(async () => {
    if (!shouldValidate) {
      return { success: true, noAction: true };
    }

    return validateCart({ forceValidation: true, immediate: true });
  }, [shouldValidate, validateCart]);

  // Immediate validation when stock data changes (real-time)
  useEffect(() => {
    if (!shouldValidate || !lastUpdated) return;
    
    // Check if this is a new stock update
    if (lastStockUpdateRef.current && lastUpdated > lastStockUpdateRef.current) {
      logger.cart('🔄 Real-time stock update detected, validating cart immediately');
      
      // Validate with shorter delay since backend is rate-limited
      setTimeout(() => {
        validateCart({ 
          source: 'realTimeStockUpdate', 
          forceValidation: true,
          immediate: true 
        });
      }, 1000); // Reduced from 2s to 1s since backend prevents spam
    }
    
    lastStockUpdateRef.current = lastUpdated;
  }, [lastUpdated, shouldValidate, validateCart]);

  // Validate cart when stock quantities change (real-time validation)
  useEffect(() => {
    if (!shouldValidate) return;

    // Skip if stock data is empty (initial load)
    if (!stockQuantities || Object.keys(stockQuantities).length === 0) return;

    // Skip if cart is empty
    if (!cartItems || Object.keys(cartItems).length === 0) return;

    logger.cart('Stock quantities changed, validating cart');
    
    // Reduced delay since backend is rate-limited
    const timeoutId = setTimeout(() => {
      validateCart({ source: 'stockUpdate' });
    }, 1500); // Reduced from 3s to 1.5s

    return () => clearTimeout(timeoutId);
  }, [stockQuantities, shouldValidate, cartItems, validateCart]);

  // App state change handler
  useEffect(() => {
    if (!validateOnAppActivation || !shouldValidate) return;

    const handleAppStateChange = (nextAppState) => {
      const currentState = appStateRef.current;
      appStateRef.current = nextAppState;

      // User returned to app from background
      if (currentState.match(/inactive|background/) && nextAppState === 'active') {
        logger.cart('App became active, validating cart');
        
        // Check if we're in a payment flow to avoid disrupting it
        Linking.getInitialURL().then(url => {
          if (url && (url.includes('payment=success') || url.includes('payment_intent'))) {
            logger.cart('Cart validation: Skipping validation - payment flow detected');
            return;
          }
          
          // Add small delay to ensure cart and stock data is loaded
          setTimeout(() => {
            validateCart({ source: 'appActivation' });
          }, 1000);
        });
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [validateOnAppActivation, shouldValidate, validateCart]);

  // Focus-based validation
  useFocusEffect(
    useCallback(() => {
      if (validateOnFocus && shouldValidate) {
        logger.cart('Screen focused, validating cart');
        
        // Add delay to ensure data is ready
        setTimeout(() => {
          validateCart({ 
            source: 'screenFocus',
            isCritical: true // Mark screen focus as critical for better responsiveness
          });
        }, 500);
      }
    }, [validateOnFocus, shouldValidate, validateCart])
  );

  // Periodic validation for long-running screens
  useEffect(() => {
    if (!shouldValidate) return;

    const interval = setInterval(() => {
      const timeSinceLastValidation = Date.now() - lastValidationRef.current;
      
      // Validate every 5 minutes if user is actively using the app
      if (timeSinceLastValidation > 300000 && AppState.currentState === 'active') {
        logger.cart('Periodic cart validation');
        validateCart({ source: 'periodic' });
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [shouldValidate, validateCart]);

  return {
    validateCart,
    quickValidateCart,
    forceValidateCart,
    triggerValidationOnDataRefresh: useCallback(() => {
      if (shouldValidate) {
        validateCart({ source: 'dataRefresh', forceValidation: true, immediate: true });
      }
    }, [shouldValidate, validateCart]),
    isValidationSupported: shouldValidate,
    validationInProgress: validationInProgressRef.current,
    isValidating: validationInProgressRef.current
  };
};

export default useCartValidation;
