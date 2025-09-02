/**
 * Payment Deduplication Utility
 * Prevents duplicate order creation for credit card payments
 */

class PaymentDeduplicationManager {
  constructor() {
    // Use global storage to persist across component re-renders
    if (!window.paymentProcessingState) {
      window.paymentProcessingState = {
        processedPayments: new Set(),
        processedOrderIntents: new Set(),
        activeProcessing: new Set()
      };
    }
    this.state = window.paymentProcessingState;
  }

  /**
   * Check if a payment is already being processed
   * @param {string} paymentKey - Unique identifier for the payment
   * @returns {boolean}
   */
  isProcessing(paymentKey) {
    return this.state.activeProcessing.has(paymentKey) || 
           this.state.processedPayments.has(paymentKey);
  }

  /**
   * Mark a payment as being processed
   * @param {string} paymentKey - Unique identifier for the payment
   */
  startProcessing(paymentKey) {
    if (this.isProcessing(paymentKey)) {
      throw new Error(`Payment ${paymentKey} is already being processed`);
    }
    
    this.state.activeProcessing.add(paymentKey);
    console.log(`[PaymentDedup] Started processing payment: ${paymentKey}`);
  }

  /**
   * Mark a payment as completed
   * @param {string} paymentKey - Unique identifier for the payment
   * @param {boolean} success - Whether the payment was successful
   */
  completeProcessing(paymentKey, success = true) {
    this.state.activeProcessing.delete(paymentKey);
    
    if (success) {
      this.state.processedPayments.add(paymentKey);
      console.log(`[PaymentDedup] Completed processing payment: ${paymentKey}`);
      
      // Clean up after a delay to prevent immediate re-processing
      setTimeout(() => {
        this.state.processedPayments.delete(paymentKey);
        console.log(`[PaymentDedup] Cleaned up payment: ${paymentKey}`);
      }, 10000); // 10 second cleanup delay
    } else {
      console.log(`[PaymentDedup] Failed processing payment: ${paymentKey}`);
    }
  }

  /**
   * Check if an order intent has already been processed
   * @param {string} intentId - Payment intent ID
   * @returns {boolean}
   */
  isOrderIntentProcessed(intentId) {
    return this.state.processedOrderIntents.has(intentId);
  }

  /**
   * Mark an order intent as processed
   * @param {string} intentId - Payment intent ID
   */
  markOrderIntentProcessed(intentId) {
    this.state.processedOrderIntents.add(intentId);
    console.log(`[PaymentDedup] Marked order intent as processed: ${intentId}`);
    
    // Clean up after a longer delay since order intents should persist longer
    setTimeout(() => {
      this.state.processedOrderIntents.delete(intentId);
      console.log(`[PaymentDedup] Cleaned up order intent: ${intentId}`);
    }, 30000); // 30 second cleanup delay for order intents
  }

  /**
   * Reset all state (use with caution)
   */
  reset() {
    this.state.processedPayments.clear();
    this.state.processedOrderIntents.clear();
    this.state.activeProcessing.clear();
    console.log('[PaymentDedup] Reset all payment processing state');
  }

  /**
   * Get current state for debugging
   */
  getState() {
    return {
      processedPayments: Array.from(this.state.processedPayments),
      processedOrderIntents: Array.from(this.state.processedOrderIntents),
      activeProcessing: Array.from(this.state.activeProcessing)
    };
  }
}

// Export singleton instance
export const paymentDeduplicationManager = new PaymentDeduplicationManager();

/**
 * Higher-order function to wrap payment processing with deduplication
 * @param {Function} paymentFunction - The payment processing function
 * @param {Function} getPaymentKey - Function to extract payment key from arguments
 * @returns {Function} - Wrapped function with deduplication
 */
export const withPaymentDeduplication = (paymentFunction, getPaymentKey) => {
  return async (...args) => {
    const paymentKey = getPaymentKey(...args);
    
    if (paymentDeduplicationManager.isProcessing(paymentKey)) {
      console.warn(`[PaymentDedup] Blocking duplicate payment processing: ${paymentKey}`);
      return null;
    }
    
    try {
      paymentDeduplicationManager.startProcessing(paymentKey);
      const result = await paymentFunction(...args);
      paymentDeduplicationManager.completeProcessing(paymentKey, true);
      return result;
    } catch (error) {
      paymentDeduplicationManager.completeProcessing(paymentKey, false);
      throw error;
    }
  };
};
