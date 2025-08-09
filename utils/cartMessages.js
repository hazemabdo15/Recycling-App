import { showGlobalToast } from '../components/common/GlobalToast';

/**
 * Unified cart operation messages and toast display
 * This ensures consistent messaging across all pages
 */

export const CartMessageTypes = {
  ADD_SINGLE: 'add_single',
  ADD_FAST: 'add_fast', 
  REMOVE_SINGLE: 'remove_single',
  REMOVE_FAST: 'remove_fast',
  REMOVE_ALL: 'remove_all',
  ITEM_REMOVED: 'item_removed',
  MANUAL_SET: 'manual_set',
  MANUAL_REMOVED: 'manual_removed',
  STOCK_ERROR: 'stock_error',
  NOT_IN_CART: 'not_in_cart',
  INVALID_QUANTITY: 'invalid_quantity',
  ADD_TO_CART_SUCCESS: 'add_to_cart_success',
  OPERATION_FAILED: 'operation_failed'
};

/**
 * Get the appropriate unit display text
 */
const getUnitText = (measurementUnit) => {
  return measurementUnit === 1 ? 'kg' : 'pieces';
};

/**
 * Show unified cart operation messages
 * @param {string} type - Message type from CartMessageTypes
 * @param {Object} options - Message options
 * @param {string} options.itemName - Name of the item
 * @param {number} options.quantity - Quantity involved
 * @param {number} options.measurementUnit - 1 for kg, 2 for pieces
 * @param {number} options.remainingQuantity - Remaining quantity after operation
 * @param {number} options.maxStock - Maximum stock available
 * @param {number} options.totalItems - Total items for batch operations
 * @param {number} options.duration - Toast duration (default varies by type)
 * @param {boolean} options.isBuyer - Whether user is a buyer (affects stock messages)
 */
export const showCartMessage = (type, options = {}) => {
  const {
    itemName = 'item',
    quantity = 1,
    measurementUnit = 2,
    remainingQuantity = 0,
    maxStock = 0,
    totalItems = 1,
    duration,
    isBuyer = false
  } = options;

  const unit = getUnitText(measurementUnit);
  const quantityText = measurementUnit === 1 ? quantity.toFixed(2) : quantity.toString();
  
  let message = '';
  let toastType = 'success';
  let defaultDuration = 1200;

  switch (type) {
    case CartMessageTypes.ADD_SINGLE:
      message = `Added ${quantityText} ${unit} of ${itemName}`;
      toastType = 'success';

      break;

    case CartMessageTypes.ADD_FAST:
      message = `Added ${quantityText} ${unit} of ${itemName}`;
      toastType = 'success';
      defaultDuration = 1200;
      break;

    case CartMessageTypes.REMOVE_SINGLE:
      if (remainingQuantity > 0) {
        message = `Removed ${quantityText} ${unit} of ${itemName}`;
        toastType = 'info';
      } else {
        message = `${itemName} removed from cart`;
        toastType = 'info';
      }
      defaultDuration = 1200;
      break;

    case CartMessageTypes.REMOVE_FAST:
      if (remainingQuantity > 0) {
        message = `Removed ${quantityText} ${unit} of ${itemName}`;
        toastType = 'info';
      } else {
        message = `${itemName} removed from cart`;
        toastType = 'info';
      }
      defaultDuration = 1200;
      break;

    case CartMessageTypes.REMOVE_ALL:
      message = `${itemName} removed from cart`;
      toastType = 'info';
      defaultDuration = 2000;
      break;

    case CartMessageTypes.ITEM_REMOVED:
      message = `${itemName} removed from cart`;
      toastType = 'info';
      defaultDuration = 2000;
      break;

    case CartMessageTypes.NOT_IN_CART:
      message = `${itemName} is not in your cart`;
      toastType = 'warning';
      defaultDuration = 1500;
      break;

    case CartMessageTypes.INVALID_QUANTITY:
      if (measurementUnit === 1) {
        message = 'Please enter a valid quantity (minimum 0.25 kg)';
      } else {
        message = 'Please enter a valid quantity (minimum 1 piece)';
      }
      toastType = 'error';
      defaultDuration = 2000;
      break;

    case CartMessageTypes.MANUAL_SET:
      message = `Set ${itemName} quantity to ${quantityText} ${unit}`;
      toastType = 'success';
      defaultDuration = 1500;
      break;

    case CartMessageTypes.MANUAL_REMOVED:
      message = 'Item removed from cart';
      toastType = 'info';
      defaultDuration = 2000;
      break;

    case CartMessageTypes.STOCK_ERROR:
      if (isBuyer) {
        const maxStockText = measurementUnit === 1 ? maxStock.toFixed(2) : maxStock.toString();
        if (maxStock === 0) {
          message = `${itemName} is out of stock`;
          toastType = 'error';
        } else {
          message = `Not enough stock. Only ${maxStockText} ${unit} available`;
          toastType = 'error';
        }
      } else {
        // For customers, no stock restrictions
        return;
      }
      defaultDuration = 2000;
      break;

    case CartMessageTypes.ADD_TO_CART_SUCCESS:
      if (totalItems === 1) {
        message = `${totalItems} item added to cart`;
      } else {
        message = `${totalItems} items added to cart`;
      }
      toastType = 'success';
      defaultDuration = 2500;
      break;

    case CartMessageTypes.OPERATION_FAILED:
      message = 'Failed to update cart';
      toastType = 'error';
      defaultDuration = 2000;
      break;

    default:
      message = 'Cart updated';
      toastType = 'success';
      defaultDuration = 1200;
  }

  showGlobalToast(message, duration || defaultDuration, toastType);
};

/**
 * Show stock warning message for buyers
 */
export const showStockWarning = (itemName, currentStock, measurementUnit = 2) => {
  const unit = getUnitText(measurementUnit);
  const stockText = measurementUnit === 1 ? currentStock.toFixed(2) : currentStock.toString();
  let message;
  
  if (currentStock === 0) {
    message = `${itemName} is out of stock`;
  } else {
    message = `Only ${stockText} ${unit} of ${itemName} in stock`;
  }
  
  showGlobalToast(message, 1200, 'warning');
};

/**
 * Show max stock reached message for buyers
 */
export const showMaxStockMessage = (itemName, maxStock, measurementUnit = 2) => {
  const unit = getUnitText(measurementUnit);
  const maxStockText = measurementUnit === 1 ? maxStock.toFixed(2) : maxStock.toString();
  const message = `Cannot add more. Only ${maxStockText} ${unit} available`;
  showGlobalToast(message, 1200, 'error');
};
