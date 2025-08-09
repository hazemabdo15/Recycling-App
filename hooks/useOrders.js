import { useEffect, useState, useCallback } from 'react';
import optimizedApiService from '../services/api/apiService';
import { Alert } from 'react-native';

export default function useOrders() {
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchingOrders, setFetchingOrders] = useState(false);

  const getAssignedOrders = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) setFetchingOrders(true);
      else setRefreshing(true);
      
      const res = await optimizedApiService.get('/my-orders');
      setOrders(res.orders || []);
    } catch (err) {
      console.error('Error loading orders', err);
      Alert.alert('Error', 'Failed to fetch orders. Please try again');
    } finally {
      setRefreshing(false);
      setFetchingOrders(false);
    }
  }, []);

  const updateOrderStatus = useCallback((orderId, newStatus) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order._id === orderId 
          ? { ...order, status: newStatus, completedAt: new Date().toISOString() }
          : order
      )
    );
  }, []);

  const removeOrder = useCallback((orderId) => {
    setOrders(prevOrders => prevOrders.filter(order => order._id !== orderId));
  }, []);

  useEffect(() => {
    getAssignedOrders(true);
  }, [getAssignedOrders]);

  return {
    orders,
    setOrders,
    refreshing,
    fetchingOrders,
    getAssignedOrders,
    updateOrderStatus,
    removeOrder,
  };
}