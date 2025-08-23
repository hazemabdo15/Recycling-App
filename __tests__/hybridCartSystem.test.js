/**
 * Test suite for the hybrid cart management system
 * Run this to verify the debounced and batch operations work correctly
 */

import { DebouncedCartManager } from '../utils/debouncedCartOperations';

describe('Hybrid Cart Management System', () => {
  let cartManager;
  let mockUpdateCartItem;
  let mockSaveCart;
  let mockOnError;

  beforeEach(() => {
    cartManager = new DebouncedCartManager();
    cartManager.setDebounceDelay(100); // Short delay for testing
    
    mockUpdateCartItem = jest.fn().mockResolvedValue({ success: true });
    mockSaveCart = jest.fn().mockResolvedValue({ success: true });
    mockOnError = jest.fn();

    // Mock the API calls
    jest.doMock('../services/api/cart', () => ({
      updateCartItem: mockUpdateCartItem,
      saveCart: mockSaveCart,
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
    cartManager = null;
  });

  describe('Debounced Operations', () => {
    test('should debounce rapid quantity updates', async () => {
      const itemId = 'test-item-1';
      const item = { _id: itemId, name: 'Test Item' };
      const previousState = {};

      // Simulate rapid clicks
      cartManager.updateQuantity(itemId, item, 1, 1, true, previousState, mockOnError);
      cartManager.updateQuantity(itemId, item, 2, 1, true, previousState, mockOnError);
      cartManager.updateQuantity(itemId, item, 3, 1, true, previousState, mockOnError);
      cartManager.updateQuantity(itemId, item, 4, 1, true, previousState, mockOnError);

      // Wait for debounce to complete
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should only call API once with final quantity
      expect(mockUpdateCartItem).toHaveBeenCalledTimes(1);
      expect(mockUpdateCartItem).toHaveBeenCalledWith(item, 4, true, 1);
    });

    test('should handle remove operations with debouncing', async () => {
      const itemId = 'test-item-2';
      const previousState = {};

      cartManager.removeItem(itemId, true, previousState, mockOnError);

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should call remove API
      expect(mockUpdateCartItem).toHaveBeenCalledTimes(0); // Remove uses different API
    });

    test('should cancel previous operation when new one is queued', async () => {
      const itemId = 'test-item-3';
      const item = { _id: itemId, name: 'Test Item' };
      const previousState = {};

      // First operation
      cartManager.updateQuantity(itemId, item, 1, 1, true, previousState, mockOnError);
      
      // Wait halfway through debounce
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Second operation should cancel first
      cartManager.updateQuantity(itemId, item, 5, 1, true, previousState, mockOnError);
      
      // Wait for full debounce
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should only call API once with second quantity
      expect(mockUpdateCartItem).toHaveBeenCalledTimes(1);
      expect(mockUpdateCartItem).toHaveBeenCalledWith(item, 5, true, 1);
    });
  });

  describe('Batch Operations', () => {
    test('should handle batch save for AI results', async () => {
      const cartItems = [
        { _id: 'item-1', name: 'Item 1', quantity: 2 },
        { _id: 'item-2', name: 'Item 2', quantity: 3 },
        { _id: 'item-3', name: 'Item 3', quantity: 1 },
      ];
      const previousState = {};

      await cartManager.batchSave(cartItems, true, previousState, mockOnError);

      // Should call batch save API
      expect(mockSaveCart).toHaveBeenCalledTimes(1);
      expect(mockSaveCart).toHaveBeenCalledWith(cartItems, true);
    });

    test('should handle batch save errors with rollback', async () => {
      const cartItems = [{ _id: 'item-1', quantity: 1 }];
      const previousState = { 'item-1': 0 };

      // Mock API failure
      mockSaveCart.mockRejectedValueOnce(new Error('Network error'));

      try {
        await cartManager.batchSave(cartItems, true, previousState, mockOnError);
      } catch (error) {
        expect(error.message).toBe('Network error');
      }

      // Should call error callback for rollback
      expect(mockOnError).toHaveBeenCalledWith(
        previousState,
        expect.objectContaining({ message: 'Network error' })
      );
    });
  });

  describe('Sync Operations', () => {
    test('should sync all pending operations', async () => {
      const item1 = { _id: 'item-1', name: 'Item 1' };
      const item2 = { _id: 'item-2', name: 'Item 2' };
      const previousState = {};

      // Queue multiple operations
      cartManager.updateQuantity('item-1', item1, 2, 1, true, previousState, mockOnError);
      cartManager.updateQuantity('item-2', item2, 3, 1, true, previousState, mockOnError);

      // Sync immediately
      await cartManager.syncAll();

      // Should call API for both items
      expect(mockUpdateCartItem).toHaveBeenCalledTimes(2);
    });

    test('should clear all operations after sync', async () => {
      const item = { _id: 'item-1', name: 'Item 1' };
      const previousState = {};

      cartManager.updateQuantity('item-1', item, 2, 1, true, previousState, mockOnError);
      
      expect(cartManager.hasPendingOperations()).toBe(true);
      expect(cartManager.getPendingCount()).toBe(1);

      await cartManager.syncAll();

      expect(cartManager.hasPendingOperations()).toBe(false);
      expect(cartManager.getPendingCount()).toBe(0);
    });
  });

  describe('Operation Management', () => {
    test('should track pending operations', () => {
      const item = { _id: 'item-1', name: 'Item 1' };
      const previousState = {};

      expect(cartManager.hasPendingOperations()).toBe(false);
      expect(cartManager.getPendingCount()).toBe(0);

      cartManager.updateQuantity('item-1', item, 2, 1, true, previousState, mockOnError);

      expect(cartManager.hasPendingOperations()).toBe(true);
      expect(cartManager.getPendingCount()).toBe(1);
    });

    test('should cancel specific operations', () => {
      const item = { _id: 'item-1', name: 'Item 1' };
      const previousState = {};

      cartManager.updateQuantity('item-1', item, 2, 1, true, previousState, mockOnError);
      
      expect(cartManager.hasPendingOperations()).toBe(true);
      
      cartManager.cancelOperation('item-1');
      
      expect(cartManager.hasPendingOperations()).toBe(false);
    });

    test('should handle custom debounce delays', () => {
      cartManager.setDebounceDelay(500);
      
      // This is mainly to ensure the setter works
      // The actual timing would be tested in integration tests
      expect(cartManager.debounceDelay).toBe(500);
    });
  });
});

// Integration test example
describe('Cart Context Integration', () => {
  test('should use debounced approach for user interactions', async () => {
    // This would test the actual CartContext with mocked API
    // Verify that user interactions use debounced operations
    // while AI results use batch save
  });

  test('should preserve stock validation', async () => {
    // Test that stock validation happens immediately
    // before any debounced operations
  });

  test('should handle app state changes', async () => {
    // Test that pending operations sync when app goes to background
  });
});

export default {
  // Export test utilities for use in other test files
  createMockCartManager: () => {
    const manager = new DebouncedCartManager();
    manager.setDebounceDelay(50); // Fast for testing
    return manager;
  },
  
  createMockCartItem: (id, quantity = 1) => ({
    _id: id,
    name: `Test Item ${id}`,
    quantity,
    measurement_unit: 1,
    categoryId: 'test-category',
    image: 'test.jpg',
    points: 10,
    price: 5,
  }),
};
