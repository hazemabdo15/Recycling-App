import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../services/api/config';
import { refreshAccessToken } from '../services/auth';
import stockCacheManager from '../utils/stockCacheManager';
import { useAuth } from './AuthContext';

const StockContext = createContext();

const SOCKET_URL = API_BASE_URL;

export const StockProvider = ({ children }) => {
  const [stockQuantities, setStockQuantities] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  const { user, accessToken, isLoggedIn } = useAuth();
  const socketRef = useRef(null);
  const isConnectingRef = useRef(false);

  // Helper function to check if token is expired
  const isTokenExpired = (token) => {
    if (!token) return true;
    try {
      const [, payload] = token.split('.');
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
      const decoded = atob(padded);
      const tokenPayload = JSON.parse(decoded);
      const currentTime = Math.floor(Date.now() / 1000);
      return currentTime >= tokenPayload.exp;
    } catch {
      return true;
    }
  };

  // Initialize stock data from cache
  const initializeStockData = useCallback(async () => {
    try {
      const cachedStock = await AsyncStorage.getItem('stock_quantities');
      if (cachedStock) {
        const parsedStock = JSON.parse(cachedStock);
        setStockQuantities(parsedStock);
        console.log('📦 Loaded cached stock data:', Object.keys(parsedStock).length, 'items');
      }
    } catch (error) {
      console.error('❌ Failed to load cached stock data:', error);
    }
  }, []);

  // Save stock data to cache
  const saveStockToCache = useCallback(async (stockData) => {
    try {
      await AsyncStorage.setItem('stock_quantities', JSON.stringify(stockData));
    } catch (error) {
      console.error('❌ Failed to save stock data to cache:', error);
    }
  }, []);

  // Connect to socket for real-time stock updates
  const connectSocket = useCallback(async () => {
    if (isConnectingRef.current || socketRef.current?.connected) {
      console.log('🔒 Already connecting or connected to stock socket');
      return;
    }

    if (!isLoggedIn || !user || user.isGuest) {
      console.log('🔒 Not connecting to stock socket: user not authenticated');
      return;
    }

    try {
      isConnectingRef.current = true;
      
      let token = accessToken || await AsyncStorage.getItem('accessToken');
      if (!token || isTokenExpired(token)) {
        console.log('🔄 Token expired, refreshing...');
        token = await refreshAccessToken();
        if (!token) {
          console.log('❌ Failed to refresh token for stock socket');
          return;
        }
      }

      console.log('🔌 Connecting to stock socket at:', SOCKET_URL);

      const socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        timeout: 15000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 3000,
      });

      socket.on('connect', () => {
        console.log('✅ Connected to stock socket!');
        setIsConnected(true);
        isConnectingRef.current = false;
        socketRef.current = socket;
        
        // Request initial stock data
        socket.emit('requestStockData', { userId: user._id });
      });

      socket.on('disconnect', (reason) => {
        console.log('❌ Disconnected from stock socket:', reason);
        setIsConnected(false);
        socketRef.current = null;
        isConnectingRef.current = false;

        // Attempt to reconnect after delay if user is still authenticated
        setTimeout(() => {
          if (isLoggedIn && user && !user.isGuest) {
            console.log('🔄 Auto-reconnecting to stock socket...');
            connectSocket();
          }
        }, 5000);
      });

      socket.on('connect_error', async (error) => {
        console.error('❌ Stock socket connection failed:', error.message);
        setIsConnected(false);
        socketRef.current = null;
        isConnectingRef.current = false;

        // Handle authentication errors
        if (error?.message?.toLowerCase().includes('invalid token') || 
            error?.message?.toLowerCase().includes('authentication')) {
          console.log('🔄 Detected invalid token, attempting to refresh...');
          const newToken = await refreshAccessToken();
          if (newToken) {
            setTimeout(() => connectSocket(), 2000);
          }
        } else {
          // Retry connection after delay
          setTimeout(() => {
            if (isLoggedIn && user && !user.isGuest) {
              connectSocket();
            }
          }, 10000);
        }
      });

      // Listen for item stock updates from backend
      socket.on('itemUpdated', (data) => {
        console.log('📦 Stock update received:', data);
        const { itemId, quantity } = data;
        
        if (itemId && quantity !== undefined) {
          setStockQuantities(prev => {
            const updated = {
              ...prev,
              [itemId]: quantity
            };
            
            // Save to cache
            saveStockToCache(updated);
            setLastUpdated(new Date());
            
            // Notify stock cache manager of the update
            stockCacheManager.notifyStockUpdate({ [itemId]: quantity });
            
            console.log('📦 Updated stock for item:', itemId, 'new quantity:', quantity);
            return updated;
          });
        }
      });

      // Listen for bulk stock updates
      socket.on('stockDataUpdate', (stockData) => {
        console.log('📦 Bulk stock update received:', Object.keys(stockData).length, 'items');
        setStockQuantities(prev => {
          const updated = { ...prev, ...stockData };
          saveStockToCache(updated);
          setLastUpdated(new Date());
          
          // Notify stock cache manager of bulk update
          stockCacheManager.notifyStockUpdate(stockData);
          
          return updated;
        });
      });

      // Handle initial stock data response
      socket.on('stockData', (stockData) => {
        console.log('📦 Initial stock data received:', Object.keys(stockData).length, 'items');
        setStockQuantities(stockData);
        saveStockToCache(stockData);
        setLastUpdated(new Date());
        
        // Notify stock cache manager of initial data
        stockCacheManager.notifyStockUpdate(stockData);
      });

    } catch (error) {
      console.error('❌ Error setting up stock socket:', error);
      setIsConnected(false);
      isConnectingRef.current = false;
    }
  }, [accessToken, user, isLoggedIn, saveStockToCache]);

  // Disconnect socket
  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      console.log('🔌 Disconnecting from stock socket');
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
    isConnectingRef.current = false;
  }, []);

  // Get stock quantity for a specific item
  const getStockQuantity = useCallback((itemId) => {
    return stockQuantities[itemId] || 0;
  }, [stockQuantities]);

  // Update local stock (optimistic update)
  const updateLocalStock = useCallback((itemId, newQuantity) => {
    setStockQuantities(prev => {
      const updated = {
        ...prev,
        [itemId]: Math.max(0, newQuantity) // Ensure non-negative
      };
      saveStockToCache(updated);
      return updated;
    });
  }, [saveStockToCache]);

  // Bulk update stock quantities
  const updateBulkStock = useCallback((stockUpdates) => {
    setStockQuantities(prev => {
      const updated = { ...prev, ...stockUpdates };
      saveStockToCache(updated);
      setLastUpdated(new Date());
      
      // Notify stock cache manager of bulk update
      stockCacheManager.notifyStockUpdate(stockUpdates);
      
      return updated;
    });
  }, [saveStockToCache]);

  // Check if item is in stock
  const isInStock = useCallback((itemId, requestedQuantity = 1) => {
    const currentStock = stockQuantities[itemId] || 0;
    return currentStock >= requestedQuantity;
  }, [stockQuantities]);

  // Initialize on mount
  useEffect(() => {
    initializeStockData();
  }, [initializeStockData]);

  // Handle authentication state changes
  useEffect(() => {
    const shouldConnect = isLoggedIn && user && !user.isGuest && accessToken;
    
    if (shouldConnect && !socketRef.current?.connected) {
      console.log('🚀 Auth ready, connecting to stock socket...');
      connectSocket();
    } else if (!shouldConnect && socketRef.current) {
      console.log('🔒 Auth lost, disconnecting from stock socket...');
      disconnectSocket();
      setStockQuantities({});
      AsyncStorage.removeItem('stock_quantities');
    }

    return () => {
      if (!shouldConnect) {
        disconnectSocket();
      }
    };
  }, [isLoggedIn, user, accessToken, connectSocket, disconnectSocket]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, [disconnectSocket]);

  const value = {
    stockQuantities,
    isConnected,
    lastUpdated,
    getStockQuantity,
    updateLocalStock,
    updateBulkStock,
    isInStock,
    reconnect: connectSocket,
  };

  return (
    <StockContext.Provider value={value}>
      {children}
    </StockContext.Provider>
  );
};

export const useStock = () => {
  const context = useContext(StockContext);
  if (!context) {
    throw new Error('useStock must be used within a StockProvider');
  }
  return context;
};

export default StockContext;
