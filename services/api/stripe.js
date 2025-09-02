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
        "pickup?payment=success"
      );
      const cancelUrl = Linking.createURL(
        "pickup?payment=cancelled"
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

      console.log("[Stripe Service] Response received:", JSON.stringify(response, null, 2));

      if (!response) {
        throw new Error("No data returned from server");
      }

      // Note: apiService.post returns the data directly, not wrapped in response.data
      const { url, sessionId } = response;

      console.log("[Stripe Service] Extracted URL:", url);
      console.log("[Stripe Service] Extracted Session ID:", sessionId);

      if (!url) {
        console.error("[Stripe Service] Server response missing URL field:", response);
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

      // Since apiService handles HTTP errors and throws them directly,
      // we need to check the error properties directly
      if (error.status) {
        const { status, data } = error;
        console.error("[Stripe Service] Server error:", { status, data });

        switch (status) {
          case 400:
            throw new Error(data?.error || error.message || "Invalid payment request");
          case 401:
            throw new Error("Authentication failed. Please log in again.");
          case 404:
            throw new Error("Payment service not available");
          case 500:
            throw new Error("Payment service error. Please try again.");
          default:
            throw new Error(data?.error || error.message || "Payment processing failed");
        }
      } else if (error.message && error.message.includes("fetch")) {
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
