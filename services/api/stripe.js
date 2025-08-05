import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import apiService from './apiService';

export const stripeService = {
  async createCheckoutSession(userId, amount, accessToken) {
    try {
      if (!userId) {
        throw new Error("User ID is required");
      }

      if (!amount || amount <= 0) {
        throw new Error("Valid amount is required");
      }

      if (!accessToken) {
        throw new Error("Access token is required");
      }

      const MINIMUM_AMOUNT_PIASTERS = 2500;
      const validatedAmount = Math.max(amount, MINIMUM_AMOUNT_PIASTERS);

      if (validatedAmount !== amount) {
      }

      const successUrl = Linking.createURL(
        "pickup?phase=confirmation&payment=success"
      );
      const cancelUrl = Linking.createURL(
        "pickup?phase=review&payment=cancelled"
      );

      const payload = {
        userId,
        amount: validatedAmount,
        successUrl,
        cancelUrl,
      };

      const response = await apiService.post(
        `/users/${userId}/create-checkout-session`,
        payload,
        {
          // headers: {
          //   Authorization: `Bearer ${accessToken}`,
          //   "Content-Type": "application/json",
          // },
          timeout: 15000,
        }
      );

      const { url, sessionId } = response.data;

      if (!url) {
        throw new Error("No checkout URL returned from server");
      }

      return {
        url,
        sessionId: sessionId || "unknown",
        adjustedAmount: validatedAmount,
        wasAdjusted: validatedAmount !== amount,
      };
    } catch (error) {
      console.error(
        "[Stripe Service] Failed to create checkout session:",
        error.message
      );

      if (error.response) {
        const { status, data } = error.response;
        console.error("[Stripe Service] Server error:", { status, data });

        switch (status) {
          case 400:
            throw new Error(data?.error || "Invalid payment request");
          case 401:
            throw new Error("Authentication failed. Please log in again.");
          case 404:
            throw new Error("Payment service not available");
          case 500:
            throw new Error("Payment service error. Please try again.");
          default:
            throw new Error(data?.error || "Payment processing failed");
        }
      } else if (error.request) {
        throw new Error(
          "Cannot connect to payment service. Check your internet connection."
        );
      } else {
        throw error;
      }
    }
  },

  async openCheckout(checkoutUrl) {
    try {
      await WebBrowser.openBrowserAsync(checkoutUrl);
    } catch (error) {
      console.error("[Stripe Service] Failed to open checkout:", error.message);
      throw new Error("Failed to open payment page");
    }
  },

  validateAmount(amount) {
    const MINIMUM_AMOUNT_PIASTERS = 2500;
    return Math.max(amount, MINIMUM_AMOUNT_PIASTERS);
  },

  egpToPiasters(egp) {
    return Math.round(egp * 100);
  },

  piastersToEgp(piasters) {
    return piasters / 100;
  },
};
