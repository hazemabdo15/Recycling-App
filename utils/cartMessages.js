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
const getUnitText = (measurementUnit, t) => {
  return measurementUnit === 1 ? (t ? t('units.kg').toLowerCase() : 'kg') : (t ? t('units.pieces').toLowerCase() : 'pieces');
};

/**
 * Fallback messages when no translation function is provided
 */
const getFallbackMessage = (type, { itemName, quantity, unit, remainingQuantity, maxStock, totalItems, isBuyer }) => {
  switch (type) {
    case CartMessageTypes.ADD_SINGLE:
    case CartMessageTypes.ADD_FAST:
      return `Added ${quantity} ${unit} of ${itemName}`;
    case CartMessageTypes.REMOVE_SINGLE:
    case CartMessageTypes.REMOVE_FAST:
      return remainingQuantity > 0 ? `Removed ${quantity} ${unit} of ${itemName}` : `${itemName} removed from cart`;
    case CartMessageTypes.REMOVE_ALL:
    case CartMessageTypes.ITEM_REMOVED:
      return `${itemName} removed from cart`;
    case CartMessageTypes.NOT_IN_CART:
      return `${itemName} is not in your cart`;
    case CartMessageTypes.INVALID_QUANTITY:
      return unit === 'kg' ? 'Please enter a valid quantity (minimum 0.25 kg)' : 'Please enter a valid quantity (minimum 1 piece)';
    case CartMessageTypes.MANUAL_SET:
      return `Set ${itemName} quantity to ${quantity} ${unit}`;
    case CartMessageTypes.MANUAL_REMOVED:
      return 'Item removed from cart';
    case CartMessageTypes.STOCK_ERROR:
      return maxStock === 0 ? `${itemName} is out of stock` : `Not enough stock. Only ${maxStock} ${unit} available`;
    case CartMessageTypes.ADD_TO_CART_SUCCESS:
      return `${totalItems} item${totalItems > 1 ? 's' : ''} added to cart`;
    case CartMessageTypes.OPERATION_FAILED:
      return 'Failed to update cart';
    default:
      return 'Cart updated';
  }
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
 * @param {Function} options.t - Translation function (optional)
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
    isBuyer = false,
    t
  } = options;

  const unit = getUnitText(measurementUnit, t);
  const quantityText = measurementUnit === 1 ? quantity.toFixed(2) : quantity.toString();
  
  let message = '';
  let toastType = 'success';
  let defaultDuration = 1200;

  // Helper function to get translation or fallback
  const getTranslation = (key, params = {}) => {
    if (t) {
      return t(key, params);
    }
    // Fallback to hardcoded text if no translation function provided
    return getFallbackMessage(type, { itemName, quantity: quantityText, unit, remainingQuantity, maxStock, totalItems, isBuyer });
  };

  switch (type) {
    case CartMessageTypes.ADD_SINGLE:
      message = getTranslation('toast.cart.addSingle', { quantity: quantityText, unit, itemName });
      toastType = 'success';
      break;

    case CartMessageTypes.ADD_FAST:
      message = getTranslation('toast.cart.addFast', { quantity: quantityText, unit, itemName });
      toastType = 'success';
      defaultDuration = 1200;
      break;

    case CartMessageTypes.REMOVE_SINGLE:
      if (remainingQuantity > 0) {
        message = getTranslation('toast.cart.removeSingle', { quantity: quantityText, unit, itemName });
        toastType = 'info';
      } else {
        message = getTranslation('toast.cart.removeSingleComplete', { itemName });
        toastType = 'info';
      }
      defaultDuration = 1200;
      break;

    case CartMessageTypes.REMOVE_FAST:
      if (remainingQuantity > 0) {
        message = getTranslation('toast.cart.removeFast', { quantity: quantityText, unit, itemName });
        toastType = 'info';
      } else {
        message = getTranslation('toast.cart.removeFastComplete', { itemName });
        toastType = 'info';
      }
      defaultDuration = 1200;
      break;

    case CartMessageTypes.REMOVE_ALL:
      message = getTranslation('toast.cart.removeAll', { itemName });
      toastType = 'info';
      defaultDuration = 2000;
      break;

    case CartMessageTypes.ITEM_REMOVED:
      message = getTranslation('toast.cart.itemRemoved', { itemName });
      toastType = 'info';
      defaultDuration = 2000;
      break;

    case CartMessageTypes.NOT_IN_CART:
      message = getTranslation('toast.cart.notInCart', { itemName });
      toastType = 'warning';
      defaultDuration = 1500;
      break;

    case CartMessageTypes.INVALID_QUANTITY:
      if (measurementUnit === 1) {
        message = getTranslation('toast.cart.invalidQuantityKg');
      } else {
        message = getTranslation('toast.cart.invalidQuantityPieces');
      }
      toastType = 'error';
      defaultDuration = 2000;
      break;

    case CartMessageTypes.MANUAL_SET:
      message = getTranslation('toast.cart.manualSet', { itemName, quantity: quantityText, unit });
      toastType = 'success';
      defaultDuration = 1500;
      break;

    case CartMessageTypes.MANUAL_REMOVED:
      message = getTranslation('toast.cart.manualRemoved');
      toastType = 'info';
      defaultDuration = 2000;
      break;

    case CartMessageTypes.STOCK_ERROR:
      if (isBuyer) {
        const maxStockText = measurementUnit === 1 ? maxStock.toFixed(2) : maxStock.toString();
        if (maxStock === 0) {
          message = getTranslation('toast.cart.stockErrorOutOfStock', { itemName });
          toastType = 'error';
        } else {
          message = getTranslation('toast.cart.stockErrorLimited', { maxStock: maxStockText, unit });
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
        message = getTranslation('toast.cart.addToCartSuccessSingle', { totalItems });
      } else {
        message = getTranslation('toast.cart.addToCartSuccessMultiple', { totalItems });
      }
      toastType = 'success';
      defaultDuration = 2500;
      break;

    case CartMessageTypes.OPERATION_FAILED:
      message = getTranslation('toast.cart.operationFailed');
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
export const showStockWarning = (itemName, currentStock, measurementUnit = 2, t = null) => {
  const unit = getUnitText(measurementUnit, t);
  const stockText = measurementUnit === 1 ? currentStock.toFixed(2) : currentStock.toString();
  let message;
  
  if (currentStock === 0) {
    message = t ? t('toast.cart.stockWarningSingle', { itemName }) : `${itemName} is out of stock`;
  } else {
    message = t ? t('toast.cart.stockWarningLimited', { stock: stockText, unit, itemName }) : `Only ${stockText} ${unit} of ${itemName} in stock`;
  }
  
  showGlobalToast(message, 1200, 'warning');
};

/**
 * Show max stock reached message for buyers
 */
export const showMaxStockMessage = (itemName, maxStock, measurementUnit = 2, t = null) => {
  const unit = getUnitText(measurementUnit, t);
  const maxStockText = measurementUnit === 1 ? maxStock.toFixed(2) : maxStock.toString();
  const message = t ? t('toast.cart.maxStockReached', { maxStock: maxStockText, unit }) : `Cannot add more. Only ${maxStockText} ${unit} available`;
  showGlobalToast(message, 1200, 'error');
};
