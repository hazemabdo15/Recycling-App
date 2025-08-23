# Hybrid Cart Management System

This document explains the new hybrid cart management system that combines debounced individual requests with batch save operations for optimal performance and user experience.

## Overview

The system automatically chooses between two strategies based on the operation context:

1. **Debounced Individual Requests**: For user interactions (clicking +/- buttons)
2. **Batch Save**: For bulk operations (AI voice results, bulk imports)

## Key Features

### ✅ **Immediate UI Response**
- All cart operations provide instant visual feedback
- Users see changes immediately, even before backend sync

### ✅ **Smart Batching**
- Rapid user actions are batched into single API calls
- Reduces server load and improves performance

### ✅ **Real-time Stock Validation**
- Stock checks happen instantly for buyer users
- Prevents overselling and provides immediate feedback

### ✅ **Automatic Error Recovery**
- Failed operations automatically rollback to previous state
- Retry logic with exponential backoff

### ✅ **Background Sync**
- Pending operations sync when app goes to background
- No data loss on app state changes

## Usage Examples

### Basic Cart Operations

```javascript
import { useCart } from '../hooks/useCart';

const CartComponent = () => {
  const { user } = useAuth();
  const {
    cartItems,
    handleIncreaseQuantity,
    handleDecreaseQuantity,
    handleSetQuantity,
    handleRemoveFromCart,
  } = useCart(user);

  // Single item increase (debounced)
  const handleIncrease = async (item) => {
    const success = await handleIncreaseQuantity(item);
    if (!success) {
      showError('Failed to add item');
    }
  };

  // Rapid clicking is automatically debounced
  const handleRapidClicks = async (item) => {
    await handleIncreaseQuantity(item); // Click 1 → UI updates instantly
    await handleIncreaseQuantity(item); // Click 2 → UI updates instantly
    await handleIncreaseQuantity(item); // Click 3 → UI updates instantly
    // Only 1 API call made 800ms after last click
  };

  // Manual quantity input
  const handleQuantityInput = async (item, newQuantity) => {
    const result = await handleSetQuantity(item, newQuantity);
    if (!result.success) {
      showError(result.error);
    }
  };
};
```

### AI Voice Results (Batch Operations)

```javascript
import { useCart } from '../hooks/useCart';

const AIVoiceModal = () => {
  const { user } = useAuth();
  const { handleAIResults } = useCart(user);

  const handleConfirmAIItems = async (aiItems) => {
    try {
      setIsProcessing(true);
      
      // Uses batch save for optimal performance
      const result = await handleAIResults(aiItems);
      
      if (result.success) {
        showSuccess(`Added ${result.itemCount} items to cart!`);
        setModalVisible(false);
      } else {
        showError(result.error);
      }
    } catch (error) {
      showError('Failed to add AI results');
    } finally {
      setIsProcessing(false);
    }
  };
};
```

### Advanced Usage: Manual Sync Control

```javascript
import { useCart } from '../hooks/useCart';

const AdvancedCartComponent = () => {
  const {
    syncPendingOperations,
    debouncedCartManager,
  } = useCart(user);

  // Force sync all pending operations
  const handleForceSync = async () => {
    try {
      const results = await syncPendingOperations();
      console.log('Sync completed:', results);
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  // Check if there are pending operations
  const hasPendingChanges = () => {
    return debouncedCartManager.hasPendingOperations();
  };

  // Get count of pending operations
  const getPendingCount = () => {
    return debouncedCartManager.getPendingCount();
  };
};
```

## Stock Validation Integration

The system preserves real-time stock validation for buyer users:

```javascript
// In CartContext.js - stock validation happens immediately
const handleUpdateQuantity = async (itemId, quantity, measurementUnit, context) => {
  // Immediate stock validation for buyers
  if (isBuyer(user)) {
    const stockValidation = validateQuantity(itemId, quantity);
    if (!stockValidation.isValid) {
      showError(`Only ${currentStock} available`);
      return { success: false, error: "Insufficient stock" };
    }
  }

  // Immediate optimistic update
  setCartItems(prev => ({ ...prev, [itemId]: quantity }));

  // Debounced backend sync
  debouncedCartManager.updateQuantity(/*...*/);
};
```

## Performance Comparison

### Before (Individual API Calls)
```
User clicks increase 4 times rapidly:
Click 1 → API Call (200ms delay)
Click 2 → API Call (200ms delay) 
Click 3 → API Call (200ms delay)
Click 4 → API Call (200ms delay)
Total: 4 API calls, 800ms total delay
```

### After (Debounced Approach)
```
User clicks increase 4 times rapidly:
Click 1 → UI Update (instant)
Click 2 → UI Update (instant)
Click 3 → UI Update (instant) 
Click 4 → UI Update (instant)
... 800ms later → 1 API Call (200ms)
Total: 1 API call, instant UI, 200ms backend sync
```

### AI Results Comparison
```
Before: 10 AI items → 10 individual API calls → 2000ms
After:  10 AI items → 1 batch API call → 200ms
```

## Configuration

### Debounce Timing
```javascript
// Default debounce delay: 800ms
debouncedCartManager.setDebounceDelay(500); // Custom delay
```

### Operation Context
```javascript
// Specify context for different strategies
await handleUpdateQuantity(itemId, quantity, measurementUnit, 'user-interaction'); // Debounced
await handleUpdateQuantity(itemId, quantity, measurementUnit, 'ai-bulk'); // Batch save
await handleUpdateQuantity(itemId, quantity, measurementUnit, 'rapid-updates'); // Shorter debounce
```

## Error Handling

All operations include automatic error recovery:

```javascript
// Optimistic update with rollback on failure
const onError = (prevState, error) => {
  setCartItems(prevState); // Rollback UI
  setError(error.message); // Show error
  logger.cart('Operation failed, rolled back');
};

debouncedCartManager.updateQuantity(itemId, item, quantity, measurementUnit, isLoggedIn, previousState, onError);
```

## App State Management

Pending operations automatically sync when the app goes to background:

```javascript
// In CartContext.js
useEffect(() => {
  const handleAppStateChange = (nextAppState) => {
    if (nextAppState === 'background' && debouncedCartManager.hasPendingOperations()) {
      debouncedCartManager.syncAll();
    }
  };
  
  const subscription = AppState.addEventListener('change', handleAppStateChange);
  return () => subscription?.remove();
}, []);
```

## Best Practices

### 1. **Use Appropriate Methods**
- `handleIncreaseQuantity` / `handleDecreaseQuantity` for single item changes
- `handleAIResults` for bulk AI results
- `handleSetQuantity` for manual input

### 2. **Check Return Values**
```javascript
const result = await handleIncreaseQuantity(item);
if (!result) {
  // Handle error (stock issues, network problems, etc.)
}
```

### 3. **Handle Loading States**
```javascript
const { loading, removingItems } = useCart(user);

// Show loading indicator
if (loading) return <LoadingSpinner />;

// Show item-specific loading
const isRemoving = removingItems.has(item._id);
```

### 4. **Monitor Pending Operations**
```javascript
// Show sync indicator when there are pending operations
const hasPending = debouncedCartManager.hasPendingOperations();
if (hasPending) {
  return <SyncIndicator />;
}
```

## Migration Guide

### Updating Existing Components

Replace direct context calls with useCart hook:

```javascript
// Before
const { handleUpdateQuantity } = useCartContext();
await handleUpdateQuantity(itemId, quantity, measurementUnit);

// After
const { handleIncreaseQuantity } = useCart(user);
await handleIncreaseQuantity(item);
```

### AI Voice Modal Updates

Replace individual cart additions with batch save:

```javascript
// Before
for (const item of aiItems) {
  await handleAddToCart(item);
}

// After
await handleAIResults(aiItems);
```

## Troubleshooting

### 1. **Operations Not Syncing**
```javascript
// Force sync pending operations
await syncPendingOperations();
```

### 2. **Stock Validation Issues**
```javascript
// Check if user is buyer
if (isBuyer(user)) {
  // Stock validation only applies to buyers
}
```

### 3. **Performance Issues**
```javascript
// Adjust debounce timing
debouncedCartManager.setDebounceDelay(1000); // Longer delay
```

### 4. **Debug Pending Operations**
```javascript
console.log('Pending operations:', debouncedCartManager.getPendingCount());
console.log('Has pending:', debouncedCartManager.hasPendingOperations());
```

This hybrid approach provides the best of both worlds: immediate user experience with optimized backend performance, while maintaining all existing functionality including real-time stock validation for buyer users.
