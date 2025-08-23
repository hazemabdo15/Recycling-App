import { showCartMessage } from './cartMessages';
import logger from './logger';

/**
 * Real-time stock validation utilities for cart operations
 * Ensures stock checks happen against current live data
 */

/**
 * Validate if an item has sufficient stock for the requested quantity
 * @param {string} itemId - Item ID to check
 * @param {number} requestedQuantity - Quantity being requested
 * @param {Object} stockQuantities - Current stock quantities from StockContext
 * @param {Object} options - Additional options
 * @returns {Object} Validation result
 */
export const validateItemStock = (itemId, requestedQuantity, stockQuantities, options = {}) => {
  const { itemName = 'Item', measurementUnit = 'items', showMessages = true } = options;
  
  if (!itemId || requestedQuantity <= 0) {
    return {
      isValid: false,
      error: 'Invalid item or quantity',
      availableStock: 0,
      requestedQuantity,
      shortage: requestedQuantity
    };
  }

  const availableStock = stockQuantities[itemId] || 0;
  const isValid = availableStock >= requestedQuantity;
  const shortage = isValid ? 0 : requestedQuantity - availableStock;

  const result = {
    isValid,
    availableStock,
    requestedQuantity,
    shortage,
    error: null
  };

  if (!isValid) {
    if (availableStock === 0) {
      result.error = `${itemName} is out of stock`;
      if (showMessages) {
        showCartMessage('outOfStock', { 
          itemName,
          availableStock: 0,
          measurementUnit 
        });
      }
    } else {
      result.error = `Insufficient stock. Available: ${availableStock} ${measurementUnit}`;
      if (showMessages) {
        showCartMessage('insufficientStock', { 
          itemName,
          availableStock,
          requestedQuantity,
          measurementUnit 
        });
      }
    }
    
    logger.warn('[Stock Validation] Insufficient stock', {
      itemId,
      itemName,
      requestedQuantity,
      availableStock,
      shortage
    });
  }

  return result;
};

/**
 * Validate an entire cart against current stock levels
 * @param {Object} cartItems - Cart items { itemId: quantity }
 * @param {Object} stockQuantities - Current stock quantities
 * @param {Object} itemDetails - Item details for better error messages
 * @returns {Object} Cart validation result
 */
export const validateCartStock = (cartItems, stockQuantities, itemDetails = {}) => {
  const results = [];
  const invalidItems = [];
  const outOfStockItems = [];
  let totalValid = true;

  Object.entries(cartItems).forEach(([itemId, quantity]) => {
    const item = itemDetails[itemId] || {};
    const itemName = item.name || `Item ${itemId}`;
    const measurementUnit = item.measurement_unit === 1 ? 'pieces' : 'kg';

    const validation = validateItemStock(itemId, quantity, stockQuantities, {
      itemName,
      measurementUnit,
      showMessages: false // Don't show individual messages for bulk validation
    });

    results.push({
      itemId,
      itemName,
      ...validation
    });

    if (!validation.isValid) {
      totalValid = false;
      invalidItems.push({
        itemId,
        itemName,
        requestedQuantity: quantity,
        availableStock: validation.availableStock,
        shortage: validation.shortage
      });

      if (validation.availableStock === 0) {
        outOfStockItems.push(itemName);
      }
    }
  });

  return {
    isValid: totalValid,
    results,
    invalidItems,
    outOfStockItems,
    totalItems: Object.keys(cartItems).length,
    validItems: results.filter(r => r.isValid).length,
    invalidCount: invalidItems.length
  };
};

/**
 * Real-time stock checker for cart operations
 * This should be called before any cart operation to ensure stock availability
 * @param {string} operation - Operation type ('add', 'increase', 'set')
 * @param {string} itemId - Item ID
 * @param {number} newQuantity - New quantity after operation
 * @param {Object} stockQuantities - Current stock quantities
 * @param {Object} cartItems - Current cart items
 * @param {Object} itemDetails - Item details for better messages
 * @returns {Object} Operation validation result
 */
export const validateCartOperation = (
  operation, 
  itemId, 
  newQuantity, 
  stockQuantities, 
  cartItems = {}, 
  itemDetails = {}
) => {
  const item = itemDetails[itemId] || {};
  const itemName = item.name || `Item ${itemId}`;
  const measurementUnit = item.measurement_unit === 1 ? 'pieces' : 'kg';

  // Check if this would be a valid stock operation
  const validation = validateItemStock(itemId, newQuantity, stockQuantities, {
    itemName,
    measurementUnit,
    showMessages: true
  });

  if (!validation.isValid) {
    return {
      canProceed: false,
      reason: validation.error,
      suggestion: validation.availableStock > 0 
        ? `Maximum available: ${validation.availableStock} ${measurementUnit}`
        : 'Item is out of stock',
      ...validation
    };
  }

  return {
    canProceed: true,
    ...validation
  };
};

/**
 * Get stock status for display in UI
 * @param {string} itemId - Item ID
 * @param {Object} stockQuantities - Current stock quantities
 * @returns {Object} Stock status
 */
export const getStockStatus = (itemId, stockQuantities) => {
  const stock = stockQuantities[itemId] || 0;
  
  let status = 'available';
  let color = '#4CAF50'; // green
  let message = `${stock} available`;
  
  if (stock === 0) {
    status = 'out-of-stock';
    color = '#F44336'; // red
    message = 'Out of stock';
  } else if (stock <= 5) {
    status = 'low-stock';
    color = '#FF9800'; // orange
    message = `Only ${stock} left`;
  }
  
  return {
    status,
    quantity: stock,
    color,
    message,
    isAvailable: stock > 0
  };
};