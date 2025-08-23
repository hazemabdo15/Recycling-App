import { validateCartStock } from './cartStockValidation';
import { showCartMessage } from './cartMessages';

/**
 * Pre-checkout cart validation
 * Validates entire cart against current stock before proceeding to checkout
 */
export class CheckoutValidator {
  
  /**
   * Validate cart for checkout
   * @param {Object} cartItems - Cart items { itemId: quantity }
   * @param {Object} stockQuantities - Current stock quantities  
   * @param {Object} itemDetails - Item details for better error messages
   * @param {Object} options - Additional options
   * @returns {Object} Validation result
   */
  static async validateForCheckout(cartItems, stockQuantities, itemDetails = {}, options = {}) {
    const { showMessages = true, t } = options;
    
    console.log('🔍 [Checkout Validator] Validating cart for checkout', {
      cartItemCount: Object.keys(cartItems).length,
      stockItemCount: Object.keys(stockQuantities).length
    });

    // First check if cart is empty
    if (!cartItems || Object.keys(cartItems).length === 0) {
      return {
        isValid: false,
        error: 'Cart is empty',
        canProceed: false,
        issues: []
      };
    }

    // Validate stock for all items
    const validation = validateCartStock(cartItems, stockQuantities, itemDetails);
    
    if (!validation.isValid) {
      const issues = [];
      
      // Group issues by type
      const outOfStockItems = validation.invalidItems.filter(item => item.availableStock === 0);
      const insufficientStockItems = validation.invalidItems.filter(item => item.availableStock > 0);
      
      // Handle out of stock items
      if (outOfStockItems.length > 0) {
        issues.push({
          type: 'out-of-stock',
          count: outOfStockItems.length,
          items: outOfStockItems,
          message: `${outOfStockItems.length} item(s) are out of stock`
        });
        
        if (showMessages) {
          outOfStockItems.forEach(item => {
            showCartMessage('outOfStock', {
              itemName: item.itemName,
              measurementUnit: itemDetails[item.itemId]?.measurement_unit === 1 ? 'kg' : 'pieces'
            });
          });
        }
      }
      
      // Handle insufficient stock items
      if (insufficientStockItems.length > 0) {
        issues.push({
          type: 'insufficient-stock', 
          count: insufficientStockItems.length,
          items: insufficientStockItems,
          message: `${insufficientStockItems.length} item(s) have insufficient stock`
        });
        
        if (showMessages) {
          insufficientStockItems.forEach(item => {
            showCartMessage('insufficientStock', {
              itemName: item.itemName,
              availableStock: item.availableStock,
              requestedQuantity: item.requestedQuantity,
              measurementUnit: itemDetails[item.itemId]?.measurement_unit === 1 ? 'kg' : 'pieces'
            });
          });
        }
      }
      
      console.log('❌ [Checkout Validator] Cart validation failed', {
        totalIssues: issues.length,
        outOfStock: outOfStockItems.length,
        insufficientStock: insufficientStockItems.length
      });
      
      return {
        isValid: false,
        canProceed: false,
        issues,
        invalidItems: validation.invalidItems,
        outOfStockItems: validation.outOfStockItems,
        error: this.generateErrorMessage(issues),
        suggestions: this.generateSuggestions(issues, itemDetails)
      };
    }
    
    console.log('✅ [Checkout Validator] Cart validation passed');
    return {
      isValid: true,
      canProceed: true,
      issues: [],
      error: null
    };
  }
  
  /**
   * Generate user-friendly error message
   * @param {Array} issues - List of validation issues
   * @returns {string} Error message
   */
  static generateErrorMessage(issues) {
    if (issues.length === 0) return null;
    
    const messages = issues.map(issue => issue.message);
    
    if (issues.length === 1) {
      return messages[0];
    }
    
    return `Multiple issues found: ${messages.join(', ')}`;
  }
  
  /**
   * Generate suggestions to resolve issues
   * @param {Array} issues - List of validation issues
   * @param {Object} itemDetails - Item details
   * @returns {Array} List of suggestions
   */
  static generateSuggestions(issues, itemDetails) {
    const suggestions = [];
    
    issues.forEach(issue => {
      if (issue.type === 'out-of-stock') {
        suggestions.push({
          type: 'remove-items',
          message: 'Remove out of stock items from your cart',
          items: issue.items.map(item => item.itemName)
        });
      } else if (issue.type === 'insufficient-stock') {
        suggestions.push({
          type: 'reduce-quantities',
          message: 'Reduce quantities for items with insufficient stock',
          items: issue.items.map(item => ({
            name: item.itemName,
            requested: item.requestedQuantity,
            available: item.availableStock,
            unit: itemDetails[item.itemId]?.measurement_unit === 1 ? 'kg' : 'pieces'
          }))
        });
      }
    });
    
    return suggestions;
  }
  
  /**
   * Auto-fix cart by removing out of stock items and reducing quantities
   * @param {Object} cartItems - Current cart items
   * @param {Object} stockQuantities - Current stock quantities
   * @param {Function} updateCartFunction - Function to update cart
   * @returns {Object} Fix result
   */
  static async autoFixCart(cartItems, stockQuantities, updateCartFunction) {
    const fixes = [];
    const errors = [];
    
    console.log('🔧 [Checkout Validator] Auto-fixing cart issues');
    
    for (const [itemId, quantity] of Object.entries(cartItems)) {
      const availableStock = stockQuantities[itemId] || 0;
      
      if (availableStock === 0) {
        // Remove out of stock items
        try {
          await updateCartFunction(itemId, 0);
          fixes.push({
            type: 'removed',
            itemId,
            reason: 'Out of stock'
          });
        } catch (error) {
          errors.push({
            itemId,
            error: error.message
          });
        }
      } else if (availableStock < quantity) {
        // Reduce quantity to available stock
        try {
          await updateCartFunction(itemId, availableStock);
          fixes.push({
            type: 'reduced',
            itemId,
            oldQuantity: quantity,
            newQuantity: availableStock,
            reason: 'Insufficient stock'
          });
        } catch (error) {
          errors.push({
            itemId,
            error: error.message
          });
        }
      }
    }
    
    console.log('🔧 [Checkout Validator] Auto-fix completed', {
      fixesApplied: fixes.length,
      errors: errors.length
    });
    
    return {
      success: errors.length === 0,
      fixes,
      errors,
      message: errors.length === 0 
        ? `Applied ${fixes.length} fixes to your cart`
        : `Applied ${fixes.length} fixes, but ${errors.length} errors occurred`
    };
  }
}

export default CheckoutValidator;
