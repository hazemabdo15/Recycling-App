/**
 * Global Cart Validation Manager
 * 
 * Handles app-wide cart validation, especially when users return to the app
 * This component should be placed at the app root level
 */

import * as Linking from 'expo-linking';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useCartValidation } from '../../hooks/useCartValidation';
import logger from '../../utils/logger';
import { isBuyer } from '../../utils/roleUtils';

const GlobalCartValidator = () => {
  const { user } = useAuth();
  
  // Global cart validation for buyer users - DISABLED REAL-TIME VALIDATION
  const { validateCart } = useCartValidation({
    validateOnFocus: false, // We don't want focus validation at global level
    validateOnAppActivation: true, // This is the main purpose - validate when app activates
    autoCorrect: false, // Disable auto-correction to prevent conflicts with order completion
    showMessages: false, // Disable messages to prevent unwanted toasts after order creation
    source: 'globalValidator'
  });

  // DISABLED: Real-time stock monitoring to prevent cart validation after order creation
  // const { triggerValidation, isMonitoring } = useCartStockMonitor({
  //   enableRealTimeValidation: true,
  //   validationDelay: 1500, // 1.5 seconds after stock change
  //   source: 'globalStockMonitor'
  // });

  // Only validate for buyer users
  const shouldValidate = isBuyer(user);

  useEffect(() => {
    if (!shouldValidate) return;

    // Additional app state monitoring for edge cases
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active') {
        logger.cart('Global validator: App became active');
        
        // Check if we're in a payment flow to avoid disrupting it
        Linking.getInitialURL().then(url => {
          if (url && (url.includes('payment=success') || url.includes('payment_intent'))) {
            logger.cart('Global validator: Skipping validation - payment flow detected');
            return;
          }
          
          // Add delay to ensure all contexts are ready
          setTimeout(() => {
            validateCart({ source: 'globalAppActivation' });
          }, 2000);
        }).catch(error => {
          console.warn('Could not check initial URL:', error);
          // Continue with validation if URL check fails
          setTimeout(() => {
            validateCart({ source: 'globalAppActivation' });
          }, 2000);
        });
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [shouldValidate, validateCart]);

  // DISABLED: Real-time monitoring logging since it's no longer active
  // useEffect(() => {
  //   if (shouldValidate) {
  //     logger.cart(`Global cart validator active - Real-time monitoring: ${isMonitoring}`);
  //   }
  // }, [shouldValidate, isMonitoring]);

  // This component doesn't render anything - it's just for logic
  return null;
};

export default GlobalCartValidator;
