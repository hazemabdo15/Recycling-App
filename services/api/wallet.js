import optimizedApiService from './apiService';

class WalletService {
  /**
   * Get user balance
   * @param {string} userId - User ID
   * @returns {Promise<number>} User balance
   */
  async getUserBalance(userId) {
    try {
      const response = await optimizedApiService.get(`/users/${userId}`);
      return response?.attachments?.balance || 0;
    } catch (error) {
      console.error('Error fetching user balance:', error);
      throw error;
    }
  }

  /**
   * Get user transactions
   * @param {string} userId - User ID
   * @param {Object} options - Query options (limit, offset, type, etc.)
   * @returns {Promise<Array>} Array of transactions
   */
  async getUserTransactions(userId, options = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (options.limit) queryParams.append('limit', options.limit);
      if (options.offset) queryParams.append('offset', options.offset);
      if (options.type) queryParams.append('type', options.type);
      if (options.startDate) queryParams.append('startDate', options.startDate);
      if (options.endDate) queryParams.append('endDate', options.endDate);

      const queryString = queryParams.toString();
      const endpoint = `/users/${userId}/transactions${queryString ? `?${queryString}` : ''}`;
      
      // The backend returns transactions directly, not wrapped in a property
      const transactions = await optimizedApiService.get(endpoint);
      return transactions || [];
    } catch (error) {
      console.error('Error fetching user transactions:', error);
      throw error;
    }
  }

  /**
   * Create a new transaction (withdrawal)
   * @param {string} userId - User ID
   * @param {Object} transactionData - Transaction data
   * @returns {Promise<Object>} Created transaction
   */
  async createTransaction(userId, transactionData) {
    try {
      const response = await optimizedApiService.post(`/users/${userId}/transactions`, transactionData);
      return response;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  /**
   * Get transaction by ID
   * @param {string} userId - User ID
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<Object>} Transaction details
   */
  async getTransaction(userId, transactionId) {
    try {
      const response = await optimizedApiService.get(`/users/${userId}/transactions/${transactionId}`);
      return response;
    } catch (error) {
      console.error('Error fetching transaction:', error);
      throw error;
    }
  }

  /**
   * Update transaction status (for admin use)
   * @param {string} userId - User ID
   * @param {string} transactionId - Transaction ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated transaction
   */
  async updateTransaction(userId, transactionId, updateData) {
    try {
      const response = await optimizedApiService.patch(`/users/${userId}/transactions/${transactionId}`, updateData);
      return response;
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  }

  /**
   * Get wallet summary (balance + recent transactions)
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Wallet summary
   */
  async getWalletSummary(userId) {
    try {
      const [balance, transactions] = await Promise.all([
        this.getUserBalance(userId),
        this.getUserTransactions(userId, { limit: 10 })
      ]);

      return {
        balance,
        transactions,
        totalTransactions: transactions.length
      };
    } catch (error) {
      console.error('Error fetching wallet summary:', error);
      throw error;
    }
  }
}

export default new WalletService();
