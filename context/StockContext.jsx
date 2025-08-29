import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../services/api/config';
import { refreshAccessToken } from '../services/auth';
import logger from '../utils/logger';
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
  
  // Add subscription tracking to prevent duplicate subscriptions
  const isSubscribedRef = useRef(false);
  const lastSubscriptionTimeRef = useRef(0);
  
  // Enhanced client-side optimization for real-time updates
  const lastUpdateTimeRef = useRef(0);
  const updateThrottleTimeoutRef = useRef(null);
  const subscribersRef = useRef(new Set());
  
  // Optimized stock update function that respects backend rate limiting
  const throttledStockUpdate = useCallback((updateFunction) => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTimeRef.current;
    
    // Clear any pending timeout
    if (updateThrottleTimeoutRef.current) {
      clearTimeout(updateThrottleTimeoutRef.current);
    }
    
    // Client-side rate limiting (100ms) for better responsiveness
    if (timeSinceLastUpdate >= 100) {
      lastUpdateTimeRef.current = now;
      updateFunction();
      
      // Notify subscribers of stock update
      subscribersRef.current.forEach(callback => {
        try {
          callback(now);
        } catch (error) {
          console.warn('Error notifying stock subscriber:', error);
        }
      });
    } else {
      // Batch updates with shorter delay for better responsiveness
      updateThrottleTimeoutRef.current = setTimeout(() => {
        lastUpdateTimeRef.current = Date.now();
        updateFunction();
        
        // Notify subscribers of stock update
        subscribersRef.current.forEach(callback => {
          try {
            callback(Date.now());
          } catch (error) {
            console.warn('Error notifying stock subscriber:', error);
          }
        });
      }, 100 - timeSinceLastUpdate);
    }
  }, []);

  // Subscribe to real-time stock updates
  const subscribeToStockUpdates = useCallback((callback) => {
    subscribersRef.current.add(callback);
    
    return () => {
      subscribersRef.current.delete(callback);
    };
  }, []);

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

  // Load cached stock data as fallback
  const loadCachedStockData = useCallback(async () => {
    try {
      console.log('🔄 Loading cached stock data as fallback...');
      const cachedData = await AsyncStorage.getItem('@stock_cache');
      if (cachedData) {
        const { stockData, timestamp } = JSON.parse(cachedData);
        const isRecent = Date.now() - timestamp < 3600000; // 1 hour old max
        
        if (isRecent && stockData && Object.keys(stockData).length > 0) {
          console.log('✅ Loaded cached stock data:', Object.keys(stockData).length, 'items');
          setStockQuantities(stockData);
          setLastUpdated(new Date(timestamp));
          return true;
        } else {
          console.log('⚠️ Cached stock data is too old or empty, ignoring');
        }
      } else {
        console.log('⚠️ No cached stock data found');
      }
    } catch (error) {
      console.error('❌ Error loading cached stock data:', error);
    }
    return false;
  }, []);

  // Save stock data to cache
  const saveStockDataToCache = useCallback(async (stockData) => {
    try {
      const cacheData = {
        stockData,
        timestamp: Date.now()
      };
      await AsyncStorage.setItem('@stock_cache', JSON.stringify(cacheData));
      console.log('💾 Stock data cached successfully');
    } catch (error) {
      console.error('❌ Error caching stock data:', error);
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

    // Only buyers need stock socket connection
    if (user.role !== 'buyer') {
      console.log(`🔒 User role '${user.role}' doesn't need stock socket connection`);
      return;
    }

    try {
      isConnectingRef.current = true;
      console.log('🔍 Connecting stock socket for buyer user...');
      
      let token = accessToken || await AsyncStorage.getItem('accessToken');
      if (!token || isTokenExpired(token)) {
        console.log('🔄 Token expired, refreshing...');
        token = await refreshAccessToken();
        if (!token) {
          console.log('❌ Failed to refresh token for stock socket');
          isConnectingRef.current = false;
          return;
        }
      }
      
      // Verify token belongs to current user
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
        const decoded = atob(padded);
        const payload = JSON.parse(decoded);
        
        if (payload.userId !== user._id) {
          console.log('❌ [StockSocket] Token user mismatch. Expected:', user._id, 'Got:', payload.userId);
          isConnectingRef.current = false;
          return;
        }
      } catch (tokenError) {
        console.error('❌ [StockSocket] Error validating token:', tokenError);
        isConnectingRef.current = false;
        return;
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
        
        // Only subscribe once per connection (backend now prevents duplicates)
        if (!isSubscribedRef.current) {
          console.log('🔄 Subscribing to real-time stock updates...');
          socket.emit('stock:subscribe');
          isSubscribedRef.current = true;
          lastSubscriptionTimeRef.current = Date.now();
        } else {
          console.log('🔒 Already subscribed to stock updates, skipping duplicate subscription');
        }
        
        // Backend now automatically sends stock:full-state after subscription
        // No need for legacy requestStockData calls
      });

      socket.on('disconnect', (reason) => {
        console.log('❌ Disconnected from stock socket:', reason);
        setIsConnected(false);
        socketRef.current = null;
        isConnectingRef.current = false;
        isSubscribedRef.current = false; // Reset subscription state

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

        // Load cached data as immediate fallback
        console.log('🔄 Socket connection failed, trying to load cached stock data...');
        await loadCachedStockData();

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

      // Handle your new real-time stock updates (individual item quantity changes)
      socket.on('stock:updated', (data) => {
        console.log('📦 Individual stock update received:', data);
        
        if (data.items && Array.isArray(data.items)) {
          // Use throttling to prevent excessive updates but with faster response
          throttledStockUpdate(() => {
            setStockQuantities(prev => {
              const updated = { ...prev };
              let hasChanges = false;
              
              data.items.forEach(item => {
                if (item.itemId && item.quantity !== undefined) {
                  const previousQuantity = updated[item.itemId];
                  if (previousQuantity !== item.quantity) {
                    updated[item.itemId] = item.quantity;
                    hasChanges = true;
                    
                    // Enhanced logging with change details
                    const changeInfo = item.previousQuantity !== undefined && item.changeAmount !== undefined
                      ? ` (${item.previousQuantity} → ${item.quantity}, change: ${item.changeAmount})`
                      : ` → ${item.quantity}`;
                    
                    logger.stock(`Stock updated: ${item.name?.en || item.itemId}${changeInfo}`);
                  }
                }
              });
              
              if (hasChanges) {
                setLastUpdated(new Date());
                console.log(`📦 Applied ${data.items.length} stock updates in category: ${data.categoryName?.en || data.categoryId}`);
              }
              
              return hasChanges ? updated : prev;
            });
          });
        }
      });

      // Handle category-level updates (when items are added/removed from category)
      socket.on('stock:category-updated', (data) => {
        console.log('📦 Category stock update received:', data);
        
        if (data.items && Array.isArray(data.items)) {
          // Use throttling to prevent excessive updates
          throttledStockUpdate(() => {
            setStockQuantities(prev => {
              const updated = { ...prev };
              let hasChanges = false;
              
              data.items.forEach(item => {
                if (item.itemId && item.quantity !== undefined) {
                  const previousQuantity = updated[item.itemId];
                  if (previousQuantity !== item.quantity) {
                    updated[item.itemId] = item.quantity;
                    hasChanges = true;
                  }
                }
              });
              
              if (hasChanges) {
                setLastUpdated(new Date());
                console.log(`📦 Category updated: ${data.categoryName?.en || data.categoryId} with ${data.items.length} items`);
              }
              
              return hasChanges ? updated : prev;
            });
          });
        }
      });

      // Handle bulk stock updates efficiently
      socket.on('stock:bulk-update', (data) => {
        console.log('📦 Bulk stock update received:', data);
        
        if (data.items && Array.isArray(data.items)) {
          throttledStockUpdate(() => {
            setStockQuantities(prev => {
              const updated = { ...prev };
              let changeCount = 0;
              
              data.items.forEach(item => {
                if (item.itemId && item.quantity !== undefined) {
                  const previousQuantity = updated[item.itemId];
                  if (previousQuantity !== item.quantity) {
                    updated[item.itemId] = item.quantity;
                    changeCount++;
                  }
                }
              });
              
              if (changeCount > 0) {
                setLastUpdated(new Date());
                console.log(`📦 Bulk update applied: ${changeCount} items changed`);
              }
              
              return changeCount > 0 ? updated : prev;
            });
          });
        }
      });

      // Handle new category additions
      socket.on('stock:category-added', (data) => {
        console.log('📦 New category added:', data);
        
        if (data.items && Array.isArray(data.items)) {
          // Use throttling to prevent excessive updates
          throttledStockUpdate(() => {
            setStockQuantities(prev => {
              const updated = { ...prev };
              
              data.items.forEach(item => {
                if (item.itemId && item.quantity !== undefined) {
                  updated[item.itemId] = item.quantity;
                }
              });
              
              setLastUpdated(new Date());
              return updated;
            });
            
            console.log(`📦 New category added: ${data.categoryName?.en || data.categoryId} with ${data.items.length} items`);
          });
        }
      });

      // Handle category deletions
      socket.on('stock:category-deleted', (data) => {
        console.log('📦 Category deleted:', data);
        
        // Note: We'll keep the stock data for now as the backend doesn't send which items to remove
        // In a real scenario, you might want to refetch the full state or maintain a category->items mapping
        console.log(`📦 Category deleted: ${data.categoryId} - Full state refresh may be needed`);
        
        // Optionally trigger a full state refresh
        if (socketRef.current?.connected) {
          socketRef.current.emit('stock:subscribe');
        }
      });

      // Handle full stock state on connection (don't throttle initial full state)
      socket.on('stock:full-state', (data) => {
        console.log('📊 Full stock state received:', data);
        
        const fullStock = {};
        if (data.categories && Array.isArray(data.categories)) {
          data.categories.forEach(category => {
            if (category.items && Array.isArray(category.items)) {
              category.items.forEach(item => {
                if (item.itemId && item.quantity !== undefined) {
                  fullStock[item.itemId] = item.quantity;
                }
              });
            }
          });
        }
        
        // Don't throttle full state updates as they're typically sent once on connection
        setStockQuantities(fullStock);
        setLastUpdated(new Date());
        console.log('📦 Initialized stock data for', Object.keys(fullStock).length, 'items');
        
        // Cache the stock data for fallback
        saveStockDataToCache(fullStock);
      });

      // Listen for item stock updates from backend (legacy support)
      socket.on('itemUpdated', (data) => {
        console.log('📦 Stock update received:', data);
        const { itemId, quantity } = data;
        
        if (itemId && quantity !== undefined) {
          // Use throttling for legacy updates too
          throttledStockUpdate(() => {
            setStockQuantities(prev => {
              const updated = {
                ...prev,
                [itemId]: quantity
              };
              
              setLastUpdated(new Date());
              
              console.log('📦 Updated stock for item:', itemId, 'new quantity:', quantity);
              return updated;
            });
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
        console.log('🎯 Fresh stock data received from server:', Object.keys(stockData).length, 'items');
        console.log('📦 Setting fresh stock data from server');
        setStockQuantities(stockData);
        setLastUpdated(new Date());
        
        // Cache the stock data for fallback
        saveStockDataToCache(stockData);
      });

    } catch (error) {
      console.error('❌ Error setting up stock socket:', error);
      setIsConnected(false);
      isConnectingRef.current = false;
    }
  }, [accessToken, user, isLoggedIn, loadCachedStockData, saveStockDataToCache, throttledStockUpdate]);

  // Disconnect socket with improved cleanup
  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      console.log('🔌 Disconnecting from stock socket');
      
      // Remove all listeners before disconnecting
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
    isConnectingRef.current = false;
    isSubscribedRef.current = false;
  }, []);

  // Get stock quantity for a specific item with fallback support
  const getStockQuantity = useCallback((itemId, fallbackQuantity = undefined) => {
    // Stock functionality only available for buyers
    if (!user || user.role !== 'buyer') {
      return fallbackQuantity; // Return fallback for non-buyers
    }
    
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
  }, [stockQuantities, isConnected, user]);

  // Update local stock (optimistic update)
  const updateLocalStock = useCallback((itemId, newQuantity) => {
    // Stock functionality only available for buyers
    if (!user || user.role !== 'buyer') {
      console.log(`🔒 User role '${user?.role || 'unknown'}' cannot update stock`);
      return;
    }
    
    setStockQuantities(prev => {
      const updated = {
        ...prev,
        [itemId]: Math.max(0, newQuantity) // Ensure non-negative
      };
      return updated;
    });
  }, [user]);

  // Bulk update stock quantities
  const updateBulkStock = useCallback((stockUpdates) => {
    // Stock functionality only available for buyers
    if (!user || user.role !== 'buyer') {
      console.log(`🔒 User role '${user?.role || 'unknown'}' cannot update bulk stock`);
      return;
    }
    
    setStockQuantities(prev => {
      const updated = { ...prev, ...stockUpdates };
      setLastUpdated(new Date());
      
      // Log the update for debugging
      console.log('📦 Bulk stock update applied:', Object.keys(stockUpdates).length, 'items');
      
      return updated;
    });
  }, [user]);

  // Check if item is in stock
  const isInStock = useCallback((itemId, requestedQuantity = 1) => {
    // Stock functionality only available for buyers
    if (!user || user.role !== 'buyer') {
      return true; // Always allow for non-buyers (no stock restrictions)
    }
    
    const currentStock = stockQuantities[itemId] || 0;
    return currentStock >= requestedQuantity;
  }, [stockQuantities, user]);

  // Force refresh stock data from server
  const forceRefreshStock = useCallback(() => {
    // Stock functionality only available for buyers
    if (!user || user.role !== 'buyer') {
      console.log(`🔒 User role '${user?.role || 'unknown'}' doesn't need stock refresh`);
      return;
    }
    
    if (socketRef.current?.connected && user) {
      console.log('🔄 Force refreshing stock data from server...');
      
      // Use the new subscription method first
      socketRef.current.emit('stock:subscribe');
      
      // Keep legacy support
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
    const shouldConnect = isLoggedIn && user && !user.isGuest && accessToken && user.role === 'buyer';
    
    if (shouldConnect && !socketRef.current?.connected) {
      console.log('🚀 Auth ready, connecting to stock socket for buyer...');
      console.log(`🔍 User role: ${user.role}, connecting stock socket`);
      // Add small delay to ensure auth state is stable and avoid race conditions
      const connectionTimeout = setTimeout(() => {
        connectSocket();
      }, 200);
      
      return () => clearTimeout(connectionTimeout);
    } else if (!shouldConnect && socketRef.current) {
      if (user && user.role !== 'buyer') {
        console.log(`🔒 User role '${user.role}' doesn't need stock socket, disconnecting...`);
      } else {
        console.log('🔒 Auth lost, disconnecting from stock socket...');
      }
      disconnectSocket();
      setStockQuantities({});
    }

    return () => {
      if (!shouldConnect) {
        disconnectSocket();
      }
    };
  }, [isLoggedIn, user, accessToken, connectSocket, disconnectSocket]);

  // Load cached data on initial mount for faster startup
  useEffect(() => {
    const loadInitialData = async () => {
      if (isLoggedIn && user && !user.isGuest && user.role === 'buyer' && Object.keys(stockQuantities).length === 0) {
        console.log('🔄 Loading cached stock data for buyer startup...');
        await loadCachedStockData();
      } else if (user && user.role !== 'buyer') {
        console.log(`🔍 User role '${user.role}' doesn't need stock data, skipping cache load`);
      }
    };

    loadInitialData();
  }, [isLoggedIn, user, stockQuantities, loadCachedStockData]);

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
    loadCachedStockData, // Add fallback data loader
    subscribeToStockUpdates, // Add subscription functionality
    reconnect: connectSocket,
    // Add socket connection status for better debugging
    stockSocketConnected: isConnected,
    // Helper to check if user role supports stock functionality
    isStockAvailable: user?.role === 'buyer',
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
