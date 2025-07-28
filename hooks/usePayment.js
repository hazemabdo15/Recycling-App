import { useState } from 'react';
import { Alert } from 'react-native';
import { stripeService } from '../services/api/stripe';
import {
    calculateTotalAmount,
    formatAmount,
    getPaymentErrorMessage,
    isBuyer,
    validatePaymentPrerequisites,
} from '../utils/paymentUtils';

/**
 * Custom hook for handling payment processing
 */
export const usePayment = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Processes payment for buyers using Stripe
   * @param {Object} params - Payment parameters
   * @param {Object} params.user - User object
   * @param {string} params.accessToken - Access token
   * @param {Array} params.cartItemsDisplay - Cart items for display
   * @param {Function} params.onSuccess - Success callback
   * @param {Function} params.onError - Error callback
   */
  const processPayment = async ({
    user,
    accessToken,
    cartItemsDisplay,
    onSuccess,
    onError,
  }) => {
    if (isProcessing) {
      return;
    }

    setIsProcessing(true);

    try {
      // Validate prerequisites
      const validation = validatePaymentPrerequisites({
        user,
        accessToken,
        cartItems: cartItemsDisplay,
      });

      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      const { userId } = validation;

      // Calculate total amount
      const totalAmountEGP = calculateTotalAmount(cartItemsDisplay);
      const totalAmountPiasters = stripeService.egpToPiasters(totalAmountEGP);

      // Create Stripe checkout session
      const checkoutResult = await stripeService.createCheckoutSession(
        userId,
        totalAmountPiasters,
        accessToken
      );

      // Show amount adjustment notification if needed
      if (checkoutResult.wasAdjusted) {
        const adjustedAmountEGP = stripeService.piastersToEgp(checkoutResult.adjustedAmount);
        
        return new Promise((resolve) => {
          Alert.alert(
            'Payment Amount Adjusted',
            `The minimum payment amount for online transactions is ${formatAmount(adjustedAmountEGP)}. Your order total has been adjusted to meet this requirement.`,
            [
              {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => {
                  setIsProcessing(false);
                  resolve();
                },
              },
              {
                text: 'Continue',
                style: 'default',
                onPress: async () => {
                  try {
                    await stripeService.openCheckout(checkoutResult.url);
                    console.log('[Payment Hook] Payment completed successfully');
                    onSuccess?.(checkoutResult);
                  } catch (error) {
                    console.error('[Payment Hook] Failed to open checkout:', error);
                    onError?.(error);
                  } finally {
                    setIsProcessing(false);
                    resolve();
                  }
                },
              },
            ]
          );
        });
      } else {
        // No adjustment needed, proceed directly
        await stripeService.openCheckout(checkoutResult.url);
        onSuccess?.(checkoutResult);
      }

    } catch (error) {
      console.error('[Payment Hook] Payment failed:', error);
      
      const errorMessage = getPaymentErrorMessage(error);
      
      Alert.alert(
        'Payment Error',
        errorMessage,
        [{ text: 'OK' }]
      );
      
      onError?.(error);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Determines if user should use payment flow
   * @param {Object} user - User object
   * @returns {boolean}
   */
  const shouldUsePayment = (user) => {
    return isBuyer(user);
  };

  return {
    isProcessing,
    processPayment,
    shouldUsePayment,
  };
};
