import { useCallback, useEffect, useState } from 'react';
import { showGlobalToast } from '../components/common/GlobalToast';
import { useAuth } from '../context/AuthContext';
import { walletService } from '../services/api';

export const useWallet = () => {
  const { user, setUser } = useAuth();
  const [balance, setBalance] = useState(user?.attachments?.balance || 0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!user?._id) return;

    try {
      const userBalance = await walletService.getUserBalance(user._id);
      setBalance(userBalance);
      
      // Update user context with new balance
      setUser(prevUser => ({
        ...prevUser,
        attachments: {
          ...prevUser.attachments,
          balance: userBalance
        }
      }));
      
      return userBalance;
    } catch (error) {
      console.error('Error fetching balance:', error);
      showGlobalToast('Failed to fetch balance', 'error');
      return null;
    }
  }, [user?._id, setUser]);

  const fetchTransactions = useCallback(async (options = {}) => {
    if (!user?._id) return;

    try {
      setTransactionsLoading(true);
      const transactionsData = await walletService.getUserTransactions(user._id, options);
      
      // The backend returns transactions directly as an array
      const sorted = (transactionsData || []).slice().sort((a, b) => {
        const dateA = new Date(a.date || a.createdAt || 0).getTime();
        const dateB = new Date(b.date || b.createdAt || 0).getTime();
        return dateB - dateA;
      });
      setTransactions(sorted);
      return sorted;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      showGlobalToast('Failed to fetch transactions', 'error');
      setTransactions([]);
      return [];
    } finally {
      setTransactionsLoading(false);
    }
  }, [user?._id]);

  const createWithdrawal = useCallback(async (withdrawalData) => {
    if (!user?._id) return null;

    try {
      const transaction = await walletService.createTransaction(user._id, withdrawalData);
      showGlobalToast('Withdrawal request submitted successfully', 'success');
      
      // Refresh data after successful transaction
      await Promise.all([fetchBalance(), fetchTransactions()]);
      
      return transaction;
    } catch (error) {
      console.error('Error creating withdrawal:', error);
      showGlobalToast(error.message || 'Failed to submit withdrawal', 'error');
      throw error;
    }
  }, [user?._id, fetchBalance, fetchTransactions]);

  const refreshWalletData = useCallback(async () => {
    if (!user?._id) return;

    try {
      setRefreshing(true);
      await Promise.all([fetchBalance(), fetchTransactions()]);
    } catch (error) {
      console.error('Error refreshing wallet data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [user?._id, fetchBalance, fetchTransactions]);

  const loadWalletData = useCallback(async () => {
    if (!user?._id) return;

    try {
      setLoading(true);
      await Promise.all([fetchBalance(), fetchTransactions()]);
    } catch (error) {
      console.error('Error loading wallet data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?._id, fetchBalance, fetchTransactions]);

  // Auto-load data when user changes
  useEffect(() => {
    if (user?._id) {
      loadWalletData();
    }
  }, [user?._id, loadWalletData]);

  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 2,
    }).format(amount || 0);
  }, []);

  const formatDate = useCallback((dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  return {
    // State
    balance,
    transactions,
    loading,
    transactionsLoading,
    refreshing,
    user,

    // Actions
    fetchBalance,
    fetchTransactions,
    createWithdrawal,
    refreshWalletData,
    loadWalletData,

    // Utilities
    formatCurrency,
    formatDate,
  };
};
