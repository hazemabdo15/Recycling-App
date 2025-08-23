/**
 * Global Cart Validation Manager
 * 
 * Handles app-wide cart validation, especially when users return to the app
 * This component should be placed at the app root level
 */

import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useCartStockMonitor } from '../../hooks/useCartStockMonitor';
import { useCartValidation } from '../../hooks/useCartValidation';
import logger from '../../utils/logger';
import { isBuyer } from '../../utils/roleUtils';

const GlobalCartValidator = () => {
  const { user } = useAuth();
  
  // Global cart validation for buyer users
  const { validateCart } = useCartValidation({
    validateOnFocus: false, // We don't want focus validation at global level
    validateOnAppActivation: true, // This is the main purpose - validate when app activates
    autoCorrect: true, // Auto-fix issues
    showMessages: true, // Show user feedback
    source: 'globalValidator'
  });

  // Real-time stock monitoring
  const { triggerValidation, isMonitoring } = useCartStockMonitor({
    enableRealTimeValidation: true,
    validationDelay: 1500, // 1.5 seconds after stock change
    source: 'globalStockMonitor'
  });

  // Only validate for buyer users
  const shouldValidate = isBuyer(user);

  useEffect(() => {
    if (!shouldValidate) return;

    // Additional app state monitoring for edge cases
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active') {
        logger.cart('Global validator: App became active');
        
        // Add delay to ensure all contexts are ready
        setTimeout(() => {
          validateCart({ source: 'globalAppActivation' });
        }, 2000);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [shouldValidate, validateCart]);

  // Log monitoring status for debugging
  useEffect(() => {
    if (shouldValidate) {
      logger.cart(`Global cart validator active - Real-time monitoring: ${isMonitoring}`);
    }
  }, [shouldValidate, isMonitoring]);

  // This component doesn't render anything - it's just for logic
  return null;
};

export default GlobalCartValidator;
