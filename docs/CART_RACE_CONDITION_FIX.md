# Cart Race Condition Fix

## Problem Description

There was a race condition issue in the cart system where the first addition from 0 to the minimum step (0.25 for kg, 1 for pieces) worked correctly, but subsequent rapid additions would show inconsistent behavior:

1. **First addition**: 0 → 0.25/1 ✅ 
2. **Second addition**: 0.25/1 → 0.5/2 ✅ (shows correctly in UI)
3. **Third addition**: 0.5/2 → 0.75/3 ❌ (resets back to lower value)

## Root Cause Analysis

The issue was caused by **inconsistent API usage** for cart operations:

### Before Fix:
1. **First addition (0 → step)**: Used `handleAddSingleItem` → calls `addItemToCart` API (ADDS quantity to existing)
2. **Subsequent additions**: Used `handleUpdateQuantity` → calls `updateCartItem` API (SETS absolute quantity)

### The Race Condition:
When rapid clicks happened:
- `addItemToCart` adds incrementally: `existing + newQuantity`
- `updateCartItem` sets absolutely: `quantity = newQuantity`
- These two different behaviors caused conflicts when executed in parallel or out of order

## Solution Implemented

### 1. **Unified API Approach**
- Modified `handleAddSingleItem` in `CartContext.js` to use `updateCartItem` instead of `addItemToCart`
- Enhanced `handleUpdateQuantity` to handle both new and existing items
- All cart operations now use consistent absolute quantity setting

### 2. **Enhanced handleUpdateQuantity**
```javascript
const handleUpdateQuantity = async (
  itemId,
  quantity,
  measurementUnit = null,
  context = 'user-interaction',
  itemData = null // NEW: Support for new items
) => {
  let itemDetails = cartItemDetails[itemId];
  
  // Handle new items by creating cart entry from provided itemData
  if (!itemDetails && itemData) {
    const cartItem = createCartItem(itemData, quantity);
    itemDetails = cartItem;
    // Set optimistic state immediately
  }
  
  // Continue with debounced operation...
}
```

### 3. **Simplified handleIncreaseQuantity**
```javascript
const handleIncreaseQuantity = async (item, showError) => {
  // Calculate new quantity consistently
  const step = getIncrementStep(measurement_unit);
  const newQuantity = calculateQuantity(currentQuantity, step, 'add');
  
  // Always use handleUpdateQuantity for consistency
  const result = await handleUpdateQuantity(
    _id, 
    newQuantity, 
    measurement_unit, 
    'user-interaction',
    currentQuantity === 0 ? processedItem : null // Pass item data for new items
  );
}
```

## Key Changes Made

### Files Modified:
1. **`context/CartContext.js`**:
   - Modified `handleAddSingleItem` to use `updateCartItem` instead of `addItemToCart`
   - Enhanced `handleUpdateQuantity` to accept `itemData` parameter for new items
   - Added logic to create cart items for new entries

2. **`hooks/useCart.js`**:
   - Simplified `handleIncreaseQuantity` to always use `handleUpdateQuantity`
   - Removed dual-path logic (new vs existing items)
   - Pass item data when adding new items

## Benefits

1. **Consistency**: All cart operations use the same API pattern (absolute quantity setting)
2. **Race Condition Eliminated**: No more conflicts between additive and absolute operations
3. **Improved Performance**: Still benefits from debounced operations and optimistic updates
4. **Cleaner Code**: Simplified logic flow without dual paths

## Testing

The fix maintains all existing functionality while resolving the race condition:
- ✅ First addition works correctly (0 → 0.25/1)
- ✅ Subsequent rapid additions work correctly (maintains proper increments)
- ✅ Debounced operations still prevent excessive API calls
- ✅ Optimistic updates provide immediate UI feedback
- ✅ Error handling and rollback still function
- ✅ Button disabling effects successfully removed (previous task)

## Backend Compatibility

The fix is backward compatible with existing backend APIs:
- `updateCartItem` API handles both new and existing items correctly
- `addItemToCart` API is no longer used by the frontend, avoiding conflicts
- All validation and business logic on the backend remains unchanged
