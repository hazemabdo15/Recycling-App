/**
 * Cart Stock Validator Service
 * 
 * Handles real-time cart validation against current stock levels
 * Automatically corrects cart issues when users return to the app
 * or navigate to critical screens (cart, checkout, pickup)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { showCartMessage } from '../utils/cartMessages';
import { CheckoutValidator } from '../utils/checkoutValidator';
import logger from '../utils/logger';

const LAST_VALIDATION_KEY = '@cart_last_validation';
const VALIDATION_COOLDOWN = 30000; // 30 seconds cooldown between validations

export class CartStockValidator {
  static instance = null;
  static validationInProgress = false;
  static lastValidationTime = 0;

  constructor() {
    if (CartStockValidator.instance) {
      return CartStockValidator.instance;
    }
    CartStockValidator.instance = this;
  }

  /**
   * Get singleton instance
   */
  static getInstance() {
    if (!CartStockValidator.instance) {
      CartStockValidator.instance = new CartStockValidator();
    }
    return CartStockValidator.instance;
  }

  /**
   * Check if validation is needed based on cooldown
   */
  static async shouldValidate() {
    const now = Date.now();
    
    // Check cooldown
    if (now - CartStockValidator.lastValidationTime < VALIDATION_COOLDOWN) {
      return false;
    }

    try {
      const lastValidation = await AsyncStorage.getItem(LAST_VALIDATION_KEY);
      if (lastValidation) {
        const timeSinceLastValidation = now - parseInt(lastValidation);
        // If last validation was less than 5 minutes ago, skip
        if (timeSinceLastValidation < 300000) { // 5 minutes
          return false;
        }
      }
    } catch (error) {
      console.warn('Failed to check last validation time:', error);
    }

    return true;
  }

  /**
   * Main validation function - validates and auto-corrects cart
   * @param {Object} cartItems - Current cart items
   * @param {Object} cartItemDetails - Cart item details
   * @param {Object} stockQuantities - Current stock levels
   * @param {Function} updateCartFunction - Function to update cart quantities
   * @param {Object} options - Validation options
   */
  static async validateAndCorrectCart(
    cartItems, 
    cartItemDetails, 
    stockQuantities, 
    updateCartFunction,
    options = {}
  ) {
    const { 
      showMessages = true, 
      autoCorrect = true, 
      source = 'unknown',
      forceValidation = false 
    } = options;

    // Skip if validation is in progress or cooldown active
    if (CartStockValidator.validationInProgress) {
      logger.cart('Cart validation already in progress, skipping');
      return { success: true, noAction: true };
    }

    if (!forceValidation && !(await CartStockValidator.shouldValidate())) {
      logger.cart('Cart validation skipped due to cooldown');
      return { success: true, noAction: true };
    }

    CartStockValidator.validationInProgress = true;
    CartStockValidator.lastValidationTime = Date.now();

    try {
      logger.cart(`🔍 [Cart Validator] Starting cart validation from: ${source}`);

      // Store validation timestamp
      await AsyncStorage.setItem(LAST_VALIDATION_KEY, Date.now().toString());

      // Check if cart is empty
      if (!cartItems || Object.keys(cartItems).length === 0) {
        logger.cart('Cart is empty, no validation needed');
        return { success: true, noAction: true };
      }

      // Validate cart against current stock
      const validation = await CheckoutValidator.validateForCheckout(
        cartItems,
        stockQuantities,
        cartItemDetails,
        { showMessages: false } // We'll handle messages ourselves
      );

      if (validation.isValid) {
        logger.cart('✅ Cart validation passed - all items are in stock');
        return { 
          success: true, 
          isValid: true,
          noChanges: true 
        };
      }

      // Cart has issues - handle them
      logger.cart('❌ Cart validation failed - issues detected:', {
        totalIssues: validation.issues?.length || 0,
        outOfStock: validation.outOfStockItems?.length || 0
      });

      if (!autoCorrect) {
        // Just notify about issues without fixing
        if (showMessages) {
          this.showValidationMessages(validation, source);
        }
        return {
          success: false,
          isValid: false,
          issues: validation.issues,
          correctionAvailable: true
        };
      }

      // Auto-correct cart issues
      const correctionResult = await this.correctCartIssues(
        cartItems,
        cartItemDetails,
        stockQuantities,
        updateCartFunction,
        validation
      );

      // Show user-friendly messages about corrections
      if (showMessages) {
        this.showCorrectionMessages(correctionResult, source);
      }

      return {
        success: correctionResult.success,
        isValid: false,
        corrected: true,
        fixes: correctionResult.fixes,
        errors: correctionResult.errors
      };

    } catch (error) {
      logger.error('Cart validation failed:', error);
      return {
        success: false,
        error: error.message
      };
    } finally {
      CartStockValidator.validationInProgress = false;
    }
  }

  /**
   * Correct cart issues by removing/updating items
   */
  static async correctCartIssues(
    cartItems,
    cartItemDetails,
    stockQuantities,
    updateCartFunction,
    validation
  ) {
    const fixes = [];
    const errors = [];

    logger.cart('🔧 Starting cart auto-correction');

    // Process each invalid item
    for (const invalidItem of validation.invalidItems || []) {
      const { itemId, availableStock, requestedQuantity } = invalidItem;
      const itemName = cartItemDetails[itemId]?.name || `Item ${itemId}`;

      try {
        if (availableStock === 0) {
          // Remove out of stock items
          await updateCartFunction(itemId, 0);
          fixes.push({
            type: 'removed',
            itemId,
            itemName,
            reason: 'Out of stock',
            oldQuantity: requestedQuantity
          });
          logger.cart(`🗑️ Removed out of stock item: ${itemName}`);
        } else if (availableStock < requestedQuantity) {
          // Reduce quantity to available stock
          await updateCartFunction(itemId, availableStock);
          fixes.push({
            type: 'reduced',
            itemId,
            itemName,
            oldQuantity: requestedQuantity,
            newQuantity: availableStock,
            reason: 'Insufficient stock'
          });
          logger.cart(`📉 Reduced quantity for ${itemName}: ${requestedQuantity} → ${availableStock}`);
        }
      } catch (error) {
        logger.error(`Failed to correct item ${itemName}:`, error);
        errors.push({
          itemId,
          itemName,
          error: error.message
        });
      }
    }

    const result = {
      success: errors.length === 0,
      fixes,
      errors,
      totalFixed: fixes.length,
      totalErrors: errors.length
    };

    logger.cart('🔧 Cart auto-correction completed:', {
      totalFixed: result.totalFixed,
      totalErrors: result.totalErrors
    });

    return result;
  }

  /**
   * Show validation messages to user
   */
  static showValidationMessages(validation, source) {
    const { issues } = validation;
    
    if (!issues || issues.length === 0) return;

    // Show a summary message about cart issues
    const outOfStockCount = issues.find(i => i.type === 'out-of-stock')?.count || 0;
    const insufficientStockCount = issues.find(i => i.type === 'insufficient-stock')?.count || 0;
    
    let message = 'Some items in your cart are no longer available as expected.';
    
    if (outOfStockCount > 0 && insufficientStockCount > 0) {
      message = `${outOfStockCount} item(s) are out of stock and ${insufficientStockCount} have insufficient stock.`;
    } else if (outOfStockCount > 0) {
      message = `${outOfStockCount} item(s) in your cart are now out of stock.`;
    } else if (insufficientStockCount > 0) {
      message = `${insufficientStockCount} item(s) have insufficient stock available.`;
    }

      showCartMessage('cartIssuesDetected', {
        message,
        source: source === 'appActivation' ? 'when returning to the app' : ''
      });
  }

  /**
   * Show correction messages to user
   */
  static showCorrectionMessages(correctionResult, source) {
    const { fixes, errors, totalFixed, totalErrors } = correctionResult;

    if (totalFixed === 0 && totalErrors === 0) return;

    // Show summary of corrections
    if (totalFixed > 0) {
      const removedCount = fixes.filter(f => f.type === 'removed').length;
      const reducedCount = fixes.filter(f => f.type === 'reduced').length;

      let message = `Your cart has been updated: `;
      const messages = [];
      
      if (removedCount > 0) {
        messages.push(`${removedCount} out-of-stock item(s) removed`);
      }
      if (reducedCount > 0) {
        messages.push(`${reducedCount} item(s) quantity reduced to available stock`);
      }

      message += messages.join(', ');

      showCartMessage('cartAutoCorrected', {
        message,
        totalFixed,
        source: source === 'appActivation' ? ' since you were away' : ''
      });
    }

    // Show errors if any
    if (totalErrors > 0) {
      showCartMessage('cartCorrectionError', {
        message: `Failed to update ${totalErrors} item(s). Please review your cart.`,
        totalErrors
      });
    }
  }

  /**
   * Quick validation without auto-correction
   * Used for real-time checks during cart operations
   */
  static async quickValidate(cartItems, stockQuantities, cartItemDetails) {
    if (!cartItems || Object.keys(cartItems).length === 0) {
      return { isValid: true, issues: [] };
    }

    const validation = await CheckoutValidator.validateForCheckout(
      cartItems,
      stockQuantities,
      cartItemDetails,
      { showMessages: false }
    );

    return {
      isValid: validation.isValid,
      issues: validation.issues || [],
      canProceed: validation.canProceed
    };
  }

  /**
   * Reset validation cooldown (useful for force validation)
   */
  static resetCooldown() {
    CartStockValidator.lastValidationTime = 0;
  }

  /**
   * Force validation regardless of cooldown
   */
  static async forceValidation(cartItems, cartItemDetails, stockQuantities, updateCartFunction, options = {}) {
    return this.validateAndCorrectCart(
      cartItems,
      cartItemDetails,
      stockQuantities,
      updateCartFunction,
      { ...options, forceValidation: true }
    );
  }
}

export default CartStockValidator;
