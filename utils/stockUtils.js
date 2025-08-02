// Utility for stock logic
export function canAddToCart(item, cartQuantity, step = 1) {
  if (typeof item.quantity !== 'number') return true;
  return cartQuantity + step <= item.quantity;
}

export function isOutOfStock(item) {
  return typeof item.quantity === 'number' && item.quantity <= 0;
}

export function isMaxStockReached(item, cartQuantity) {
  if (typeof item.quantity !== 'number') return false;
  return cartQuantity >= item.quantity;
}
