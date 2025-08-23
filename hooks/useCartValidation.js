/**
 * Custom hook for cart stock validation
 * 
 * Provides cart validation functionality that can be used across components
 * Handles app state changes, focus events, and manual validation triggers
 */

import { useFocusEffect } from '@react-navigation/native';
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
  const { stockQuantities } = useStock();
  
  const appStateRef = useRef(AppState.currentState);
  const lastValidationRef = useRef(0);
  const validationInProgressRef = useRef(false);

  // Only validate for buyer users
  const shouldValidate = isBuyer(user) && !cartLoading;

  /**
   * Perform cart validation
   */
  const validateCart = useCallback(async (validationOptions = {}) => {
    if (!shouldValidate || validationInProgressRef.current) {
      return { success: true, noAction: true };
    }

    validationInProgressRef.current = true;

    try {
      const updateFunction = async (itemId, newQuantity) => {
        const item = cartItemDetails[itemId];
        const measurementUnit = item?.measurement_unit || (item?.unit === 'KG' ? 1 : 2);
        
        if (newQuantity === 0) {
          // Remove item from cart
          await handleUpdateQuantity(itemId, 0, measurementUnit);
        } else {
          // Update quantity
          await handleUpdateQuantity(itemId, newQuantity, measurementUnit);
        }
      };

      const result = await CartStockValidator.validateAndCorrectCart(
        cartItems,
        cartItemDetails,
        stockQuantities,
        updateFunction,
        {
          showMessages,
          autoCorrect,
          source,
          ...validationOptions
        }
      );

      lastValidationRef.current = Date.now();
      return result;

    } catch (error) {
      logger.error('Cart validation error:', error);
      return { success: false, error: error.message };
    } finally {
      validationInProgressRef.current = false;
    }
  }, [shouldValidate, cartItems, cartItemDetails, stockQuantities, handleUpdateQuantity, showMessages, autoCorrect, source]);

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

    return validateCart({ forceValidation: true });
  }, [shouldValidate, validateCart]);

  /**
   * Trigger validation when fresh data is loaded
   */
  const triggerValidationOnDataRefresh = useCallback(async () => {
    if (!shouldValidate) return;

    logger.cart('Data refreshed, triggering cart validation');
    
    // Use a shorter delay for data refresh scenarios
    setTimeout(() => {
      validateCart({ source: 'dataRefresh', forceValidation: true });
    }, 500);
  }, [shouldValidate, validateCart]);

  // Validate cart when stock quantities change (real-time validation)
  useEffect(() => {
    if (!shouldValidate) return;

    // Skip if stock data is empty (initial load)
    if (!stockQuantities || Object.keys(stockQuantities).length === 0) return;

    // Skip if cart is empty
    if (!cartItems || Object.keys(cartItems).length === 0) return;

    logger.cart('Stock quantities changed, validating cart');
    
    // Add delay to allow for batch stock updates
    const timeoutId = setTimeout(() => {
      validateCart({ source: 'stockUpdate' });
    }, 1000);

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
        
        // Add small delay to ensure cart and stock data is loaded
        setTimeout(() => {
          validateCart({ source: 'appActivation' });
        }, 1000);
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
          validateCart({ source: 'screenFocus' });
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
    triggerValidationOnDataRefresh,
    isValidationSupported: shouldValidate,
    validationInProgress: validationInProgressRef.current
  };
};

export default useCartValidation;
