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


export const usePayment = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  
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

      const validation = validatePaymentPrerequisites({
        user,
        accessToken,
        cartItems: cartItemsDisplay,
      });

      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      const { userId } = validation;

      const totalAmountEGP = calculateTotalAmount(cartItemsDisplay);
      const totalAmountPiasters = stripeService.egpToPiasters(totalAmountEGP);

      const checkoutResult = await stripeService.createCheckoutSession(
        userId,
        totalAmountPiasters,
        accessToken
      );

      console.log('[Payment Hook] Checkout result received:', checkoutResult);

      if (!checkoutResult) {
        throw new Error('No checkout result returned from service');
      }

      if (!checkoutResult.url) {
        console.error('[Payment Hook] Checkout result missing URL:', checkoutResult);
        throw new Error('No checkout URL available');
      }

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

  
  const shouldUsePayment = (user) => {
    return isBuyer(user);
  };

  return {
    isProcessing,
    processPayment,
    shouldUsePayment,
  };
};
