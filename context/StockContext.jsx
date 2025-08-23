import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../services/api/config';
import { refreshAccessToken } from '../services/auth';
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
        
        // Immediately request fresh stock data from server
        console.log('🔄 Requesting fresh stock data from server...');
        console.log('🔄 Emitting requestStockData event with userId:', user._id);
        socket.emit('requestStockData', { userId: user._id });
        
        // Add timeout to detect if server doesn't respond
        const timeoutId = setTimeout(() => {
          console.log('⚠️ Initial stock request timeout: Server did not respond with stock data within 15 seconds');
          console.log('📊 Current stock quantities count:', Object.keys(stockQuantities).length);
        }, 15000);
        
        // Clear timeout if we receive stock data
        const timeoutStockHandler = (stockData) => {
          clearTimeout(timeoutId);
          console.log('✅ Initial stock request completed: Received stock data for', Object.keys(stockData).length, 'items');
        };
        
        socket.once('stockData', timeoutStockHandler);
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
            
            setLastUpdated(new Date());
            
            console.log('📦 Updated stock for item:', itemId, 'new quantity:', quantity);
            return updated;
          });
        } else {
          console.warn('📦 Invalid stock update data:', data);
        }
      });

      // Listen for bulk stock updates
      socket.on('stockDataUpdate', (stockData) => {
        console.log('📦 Bulk stock update received:', Object.keys(stockData).length, 'items');
        setStockQuantities(prev => {
          const updated = { ...prev, ...stockData };
          setLastUpdated(new Date());
          
          return updated;
        });
      });

      // Handle initial stock data response
      socket.on('stockData', (stockData) => {
        console.log('� Fresh stock data received from server:', Object.keys(stockData).length, 'items');
        console.log('📦 Setting fresh stock data from server');
        setStockQuantities(stockData);
        setLastUpdated(new Date());
      });

    } catch (error) {
      console.error('❌ Error setting up stock socket:', error);
      setIsConnected(false);
      isConnectingRef.current = false;
    }
  }, [accessToken, user, isLoggedIn, stockQuantities]);

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

  // Get stock quantity for a specific item with fallback support
  const getStockQuantity = useCallback((itemId, fallbackQuantity = undefined) => {
    const realTimeStock = stockQuantities[itemId];
    
    // Return real-time stock if available
    if (realTimeStock !== undefined) {
      return realTimeStock;
    }
    
    // If socket is connected but no data yet, we might be waiting for fresh data
    if (isConnected && Object.keys(stockQuantities).length === 0) {
      console.log(`🔄 [${itemId}] Waiting for real-time stock data...`);
      return fallbackQuantity; // Use fallback (API data) while waiting
    }
    
    // No real-time data available
    return undefined;
  }, [stockQuantities, isConnected]);

  // Update local stock (optimistic update)
  const updateLocalStock = useCallback((itemId, newQuantity) => {
    setStockQuantities(prev => {
      const updated = {
        ...prev,
        [itemId]: Math.max(0, newQuantity) // Ensure non-negative
      };
      return updated;
    });
  }, []);

  // Bulk update stock quantities
  const updateBulkStock = useCallback((stockUpdates) => {
    setStockQuantities(prev => {
      const updated = { ...prev, ...stockUpdates };
      setLastUpdated(new Date());
      
      return updated;
    });
  }, []);

  // Check if item is in stock
  const isInStock = useCallback((itemId, requestedQuantity = 1) => {
    const currentStock = stockQuantities[itemId] || 0;
    return currentStock >= requestedQuantity;
  }, [stockQuantities]);

  // Force refresh stock data from server
  const forceRefreshStock = useCallback(() => {
    if (socketRef.current?.connected && user) {
      console.log('🔄 Force refreshing stock data from server...');
      console.log('🔄 Emitting requestStockData event with userId:', user._id);
      socketRef.current.emit('requestStockData', { userId: user._id });
      
      // Add timeout to detect if server doesn't respond
      const timeoutId = setTimeout(() => {
        console.log('⚠️ Force refresh timeout: Server did not respond with stock data within 10 seconds');
        console.log('📊 Current stock quantities count:', Object.keys(stockQuantities).length);
      }, 10000);
      
      // Clear timeout if we receive stock data
      const originalStockHandler = socketRef.current.listeners('stockData');
      const timeoutStockHandler = (stockData) => {
        clearTimeout(timeoutId);
        console.log('✅ Force refresh completed: Received stock data for', Object.keys(stockData).length, 'items');
        // Call original handlers
        originalStockHandler.forEach(handler => handler(stockData));
      };
      
      socketRef.current.once('stockData', timeoutStockHandler);
      
      return true;
    } else {
      console.log('❌ Cannot refresh stock data: socket not connected');
      console.log('🔌 Socket status:', { 
        exists: !!socketRef.current, 
        connected: socketRef.current?.connected,
        hasUser: !!user 
      });
      return false;
    }
  }, [user, stockQuantities]);

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
    forceRefreshStock,
    reconnect: connectSocket,
    // Add socket connection status for better debugging
    stockSocketConnected: isConnected,
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
