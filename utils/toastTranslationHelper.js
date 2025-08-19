/**
 * Helper utilities for using translated toast messages in components
 * This file shows examples of how to use the new translation features
 */

import { useTranslation } from 'react-i18next';
import { showCartMessage, showMaxStockMessage, showStockWarning } from './cartMessages';

/**
 * Custom hook to get translation-aware toast functions
 * Use this in React components that need to show toast messages
 */
export const useTranslatedToasts = () => {
  const { t } = useTranslation();

  return {
    /**
     * Show cart message with translations
     * @param {string} type - Message type from CartMessageTypes
     * @param {Object} options - Message options (same as before, but will use translations)
     */
    showCartMessage: (type, options = {}) => {
      showCartMessage(type, { ...options, t });
    },

    /**
     * Show stock warning with translations
     */
    showStockWarning: (itemName, currentStock, measurementUnit = 2) => {
      showStockWarning(itemName, currentStock, measurementUnit, t);
    },

    /**
     * Show max stock message with translations
     */
    showMaxStockMessage: (itemName, maxStock, measurementUnit = 2) => {
      showMaxStockMessage(itemName, maxStock, measurementUnit, t);
    }
  };
};

/**
 * Example usage in a React component:
 * 
 * import { useTranslatedToasts } from '../utils/toastTranslationHelper';
 * import { CartMessageTypes } from '../utils/cartMessages';
 * 
 * export default function MyComponent() {
 *   const { showCartMessage, showStockWarning } = useTranslatedToasts();
 * 
 *   const handleAddToCart = () => {
 *     // This will now show translated messages
 *     showCartMessage(CartMessageTypes.ADD_SINGLE, {
 *       itemName: 'Plastic Bottle',
 *       quantity: 2,
 *       measurementUnit: 2
 *     });
 *   };
 * 
 *   return (
 *     // Your component JSX
 *   );
 * }
 */
