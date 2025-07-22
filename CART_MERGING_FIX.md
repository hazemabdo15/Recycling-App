# Cart Merging Issue Fix

## Problem
When adding items from AI results modal to cart, items were being added as new cart items even when items of the same type (same categoryId) already existed in the cart, instead of merging quantities.

## Root Cause
The `handleAddToCart` function in CartContext was calling `addItemToCart` for each item individually without checking if the item already exists in the cart. This caused the backend to create duplicate entries instead of merging quantities.

## Solution
Modified `handleAddToCart` in CartContext to:

1. **Merge items locally first**: Group items by categoryId and sum quantities for items being added in the same batch
2. **Check existing cart items**: For each merged item, check if it already exists in the cart
3. **Use appropriate API calls**:
   - If item exists: Use `updateCartItem` with the new total quantity (existing + new)
   - If item is new: Use `addItemToCart` as normal
4. **Maintain optimistic updates**: UI updates immediately, then syncs with backend response

## Test Scenarios

### Test 1: Adding new items from AI
- Cart: Empty
- AI adds: [Paper: 2, Plastic: 1]
- Expected: Cart shows Paper: 2, Plastic: 1

### Test 2: Adding duplicate items from AI  
- Cart: [Paper: 3]
- AI adds: [Paper: 2, Plastic: 1]
- Expected: Cart shows Paper: 5, Plastic: 1

### Test 3: Adding multiple of same item from AI
- Cart: [Paper: 1]  
- AI adds: [Paper: 2, Paper: 3] (duplicate in AI results)
- Expected: Cart shows Paper: 6 (1 + 2 + 3)

### Test 4: Error handling
- Cart: [Paper: 2]
- AI adds: [Paper: 1] but backend fails
- Expected: Cart reverts to Paper: 2

## Code Changes

### Before:
```javascript

for (const item of items) {
  const result = await addItemToCart(item, isLoggedIn);
}
```

### After:
```javascript

for (const mergedItem of Object.values(itemsToMerge)) {
  const currentQuantity = cartItems[mergedItem.categoryId] || 0;
  
  if (currentQuantity > 0) {

    const newTotalQuantity = currentQuantity + mergedItem.quantity;
    await updateCartItem(mergedItem.categoryId, newTotalQuantity, isLoggedIn);
  } else {

    await addItemToCart(mergedItem, isLoggedIn);
  }
}
```

## Expected Outcome
✅ Items from AI results modal now properly merge with existing cart items
✅ No duplicate items created in cart
✅ Quantities are correctly summed
✅ Optimistic updates work smoothly
✅ Error handling reverts to correct state
