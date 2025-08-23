/**
 * Real-time Cart Stock Monitor Hook
 * 
 * Monitors stock changes and triggers cart validation when necessary
 * Specifically handles the case where API data updates stock values
 */

import { useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCartContext } from '../context/CartContext';
import { useStock } from '../context/StockContext';
import { CartStockValidator } from '../services/cartStockValidator';
import logger from '../utils/logger';
import { isBuyer } from '../utils/roleUtils';

export const useCartStockMonitor = (options = {}) => {
  const {
    enableRealTimeValidation = true,
    validationDelay = 2000, // 2 seconds after stock change
    source = 'stockMonitor'
  } = options;

  const { user } = useAuth();
  const { cartItems, cartItemDetails, handleUpdateQuantity } = useCartContext();
  const { stockQuantities } = useStock();
  
  const lastStockState = useRef({});
  const validationTimeoutRef = useRef(null);
  const lastValidationTime = useRef(0);

  // Only monitor for buyer users
  const shouldMonitor = isBuyer(user) && enableRealTimeValidation;

  /**
   * Check if any cart items have stock changes that affect cart validity
   */
  const hasSignificantStockChanges = useCallback((newStock, oldStock) => {
    if (!cartItems || Object.keys(cartItems).length === 0) return false;

    const cartItemIds = Object.keys(cartItems);
    let hasChanges = false;

    for (const itemId of cartItemIds) {
      const newStockValue = newStock[itemId] ?? 0;
      const oldStockValue = oldStock[itemId] ?? 0;
      const cartQuantity = cartItems[itemId] ?? 0;

      // Check if stock decreased below cart quantity
      if (newStockValue < cartQuantity && oldStockValue >= cartQuantity) {
        logger.cart(`Stock change detected for cart item ${itemId}: ${oldStockValue} → ${newStockValue} (cart has ${cartQuantity})`);
        hasChanges = true;
        break;
      }

      // Check if item went out of stock
      if (newStockValue === 0 && oldStockValue > 0 && cartQuantity > 0) {
        logger.cart(`Item ${itemId} went out of stock (cart has ${cartQuantity})`);
        hasChanges = true;
        break;
      }
    }

    return hasChanges;
  }, [cartItems]);

  /**
   * Perform validation with cart correction
   */
  const performValidation = useCallback(async () => {
    if (!cartItems || Object.keys(cartItems).length === 0) return;

    const now = Date.now();
    // Prevent excessive validation (max once per 5 seconds)
    if (now - lastValidationTime.current < 5000) {
      logger.cart('Skipping validation due to cooldown');
      return;
    }

    lastValidationTime.current = now;

    try {
      logger.cart('🔍 Performing real-time cart validation due to stock changes');

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
          autoCorrect: true,
          showMessages: true,
          source: `${source}_realTime`,
          forceValidation: true
        }
      );

      if (result.corrected && result.fixes?.length > 0) {
        logger.cart(`✅ Cart auto-corrected: ${result.fixes.length} fixes applied`);
      }

    } catch (error) {
      logger.error('Real-time cart validation failed:', error);
    }
  }, [cartItems, cartItemDetails, stockQuantities, handleUpdateQuantity, source]);

  // Monitor stock changes
  useEffect(() => {
    if (!shouldMonitor || !stockQuantities) return;

    // Check for significant changes
    const hasChanges = hasSignificantStockChanges(stockQuantities, lastStockState.current);
    
    if (hasChanges) {
      logger.cart('Significant stock changes detected, scheduling cart validation');
      
      // Clear existing timeout
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }

      // Schedule validation after delay
      validationTimeoutRef.current = setTimeout(() => {
        performValidation();
      }, validationDelay);
    }

    // Update last known stock state
    lastStockState.current = { ...stockQuantities };

  }, [stockQuantities, shouldMonitor, hasSignificantStockChanges, performValidation, validationDelay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Manually trigger validation
   */
  const triggerValidation = useCallback(() => {
    if (!shouldMonitor) return;

    logger.cart('Manual cart validation triggered');
    
    // Clear existing timeout
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    // Trigger immediately
    performValidation();
  }, [shouldMonitor, performValidation]);

  return {
    triggerValidation,
    isMonitoring: shouldMonitor,
    hasCartItems: cartItems && Object.keys(cartItems).length > 0
  };
};

export default useCartStockMonitor;
