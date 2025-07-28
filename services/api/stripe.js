import axios from 'axios';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { API_BASE_URL } from './config';

/**
 * Stripe service for handling payment processing
 */
export const stripeService = {
  /**
   * Creates a Stripe Checkout session
   * @param {string} userId - User ID
   * @param {number} amount - Amount in piasters (1 EGP = 100 piasters)
   * @param {string} accessToken - JWT access token
   * @returns {Promise<{url: string, sessionId: string}>}
   */
  async createCheckoutSession(userId, amount, accessToken) {
    try {
      // Validate inputs
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      if (!amount || amount <= 0) {
        throw new Error('Valid amount is required');
      }
      
      if (!accessToken) {
        throw new Error('Access token is required');
      }

      // Ensure minimum amount for Stripe (25 EGP ≈ $0.50 USD)
      const MINIMUM_AMOUNT_PIASTERS = 2500;
      const validatedAmount = Math.max(amount, MINIMUM_AMOUNT_PIASTERS);
      
      if (validatedAmount !== amount) {
        // Amount was adjusted to meet Stripe minimum requirement
      }

      // Create deep links
      const successUrl = Linking.createURL('confirmation');
      const cancelUrl = Linking.createURL('review');

      const payload = {
        userId,
        amount: validatedAmount,
        successUrl,
        cancelUrl,
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/users/${userId}/create-checkout-session`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000, // 15 second timeout
        }
      );

      const { url, sessionId } = response.data;
      
      if (!url) {
        throw new Error('No checkout URL returned from server');
      }

      return {
        url,
        sessionId: sessionId || 'unknown',
        adjustedAmount: validatedAmount,
        wasAdjusted: validatedAmount !== amount,
      };

    } catch (error) {
      console.error('[Stripe Service] Failed to create checkout session:', error.message);
      
      // Enhanced error handling
      if (error.response) {
        const { status, data } = error.response;
        console.error('[Stripe Service] Server error:', { status, data });
        
        switch (status) {
          case 400:
            throw new Error(data?.error || 'Invalid payment request');
          case 401:
            throw new Error('Authentication failed. Please log in again.');
          case 404:
            throw new Error('Payment service not available');
          case 500:
            throw new Error('Payment service error. Please try again.');
          default:
            throw new Error(data?.error || 'Payment processing failed');
        }
      } else if (error.request) {
        throw new Error('Cannot connect to payment service. Check your internet connection.');
      } else {
        throw error;
      }
    }
  },

  /**
   * Opens Stripe Checkout in browser
   * @param {string} checkoutUrl - Stripe checkout URL
   */
  async openCheckout(checkoutUrl) {
    try {
      await WebBrowser.openBrowserAsync(checkoutUrl);
    } catch (error) {
      console.error('[Stripe Service] Failed to open checkout:', error.message);
      throw new Error('Failed to open payment page');
    }
  },

  /**
   * Validates if amount meets Stripe minimum requirements
   * @param {number} amount - Amount in piasters
   * @returns {number} - Validated amount
   */
  validateAmount(amount) {
    const MINIMUM_AMOUNT_PIASTERS = 2500; // 25 EGP ≈ $0.50 USD
    return Math.max(amount, MINIMUM_AMOUNT_PIASTERS);
  },

  /**
   * Converts EGP to piasters
   * @param {number} egp - Amount in EGP
   * @returns {number} - Amount in piasters
   */
  egpToPiasters(egp) {
    return Math.round(egp * 100);
  },

  /**
   * Converts piasters to EGP
   * @param {number} piasters - Amount in piasters
   * @returns {number} - Amount in EGP
   */
  piastersToEgp(piasters) {
    return piasters / 100;
  },
};
