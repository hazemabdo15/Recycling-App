import apiService from './apiService';

/**
 * Cart Service with proper backend integration
 * Supports both authenticated users and guest sessions
 */

export const cartService = {
  // Get cart (works for both authenticated and guest users)
  async getCart() {
    try {
      console.log('[Cart Service] Fetching cart');
      
      const response = await apiService.get('/cart');
      
      console.log(`[Cart Service] Retrieved cart with ${response.items?.length || 0} items`);
      return response;
    } catch (error) {
      console.error('[Cart Service] Failed to fetch cart:', error.message);
      throw error;
    }
  },

  // Add item to cart
  async addItem(itemData) {
    try {
      console.log('[Cart Service] Adding item to cart');
      
      // Validate item data
      this.validateCartItem(itemData);
      
      const response = await apiService.post('/cart', itemData);
      
      console.log('[Cart Service] Item added to cart successfully');
      return response;
    } catch (error) {
      console.error('[Cart Service] Failed to add item to cart:', error.message);
      throw error;
    }
  },

  // Update cart item quantity
  async updateItem(categoryId, quantity) {
    try {
      console.log('[Cart Service] Updating cart item:', categoryId);
      
      // Validate quantity
      if (quantity <= 0) {
        throw new Error('Quantity must be greater than 0');
      }
      
      const response = await apiService.put('/cart', { categoryId, quantity });
      
      console.log('[Cart Service] Cart item updated successfully');
      return response;
    } catch (error) {
      console.error('[Cart Service] Failed to update cart item:', error.message);
      throw error;
    }
  },

  // Remove item from cart
  async removeItem(categoryId) {
    try {
      console.log('[Cart Service] Removing item from cart:', categoryId);
      
      await apiService.delete(`/cart/${categoryId}`);
      
      console.log('[Cart Service] Item removed from cart successfully');
    } catch (error) {
      console.error('[Cart Service] Failed to remove item from cart:', error.message);
      throw error;
    }
  },

  // Clear entire cart
  async clearCart() {
    try {
      console.log('[Cart Service] Clearing entire cart');
      
      await apiService.delete('/cart');
      
      console.log('[Cart Service] Cart cleared successfully');
    } catch (error) {
      console.error('[Cart Service] Failed to clear cart:', error.message);
      throw error;
    }
  },

  // Validate cart item data
  validateCartItem(itemData) {
    const requiredFields = ['categoryId', 'categoryName', 'itemName', 'image', 'points', 'price', 'measurement_unit', 'quantity'];
    const missingFields = requiredFields.filter(field => itemData[field] === undefined || itemData[field] === null);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate quantity based on measurement unit
    if (itemData.measurement_unit === 1) {
      // For KG items, must be in 0.25 increments
      const multiplied = Math.round(itemData.quantity * 4);
      if (itemData.quantity < 0.25 || Math.abs(itemData.quantity * 4 - multiplied) >= 0.0001) {
        throw new Error('For KG items, quantity must be in 0.25 increments (0.25, 0.5, 0.75, 1.0, etc.)');
      }
    } else if (itemData.measurement_unit === 2) {
      // For piece items, must be whole numbers >= 1
      if (!Number.isInteger(itemData.quantity) || itemData.quantity < 1) {
        throw new Error('For piece items, quantity must be whole numbers >= 1');
      }
    } else {
      throw new Error('Invalid measurement_unit. Must be 1 (KG) or 2 (Pieces)');
    }
  }
};
