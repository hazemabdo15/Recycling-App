import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../services/api/config';
import { notificationsAPI } from '../services/api/notifications';
import { refreshAccessToken } from '../services/auth';
import { extractNameFromMultilingual } from '../utils/translationHelpers';
import { useAuth } from './AuthContext';
import { useLocalization } from './LocalizationContext';

const NotificationContext = createContext();

const SOCKET_URL = API_BASE_URL;

/**
 * Expected notification types from backend:
 * - order_status: General order status updates
 * - order_assigned: Order assigned to courier
 * - order_cancelled: Order cancellation with reason
 * - order_completed: Order completion
 * - system: System notifications (tier upgrades, achievements)
 * 
 * Legacy types (for backward compatibility):
 * - order_confirmed, order_failed, order_picked_up
 */

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  
  const { user, accessToken, isLoggedIn } = useAuth();
  const { currentLanguage } = useLocalization();

  const currentSocket = useRef(null);
  const isConnecting = useRef(false);
  const hasInitialized = useRef(null);
  const lastRefreshTime = useRef(0);

  // Helper function to get localized notification content
  const getLocalizedNotification = useCallback((notification) => {
    if (!notification) return notification;

    const localizedTitle = typeof notification.title === 'object' 
      ? extractNameFromMultilingual(notification.title, currentLanguage)
      : notification.title;

    const localizedBody = typeof notification.body === 'object'
      ? extractNameFromMultilingual(notification.body, currentLanguage)
      : notification.body;

    return {
      ...notification,
      title: localizedTitle || notification.title || 'Notification',
      body: localizedBody || notification.body || notification.message || 'New notification'
    };
  }, [currentLanguage]);

  // Process notifications array to localize content
  const processNotifications = useCallback((notificationsList) => {
    return notificationsList.map(notification => getLocalizedNotification(notification));
  }, [getLocalizedNotification]);

  const refreshNotifications = useCallback(async () => {
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTime.current;
    
    if (timeSinceLastRefresh < 5000) {
      console.log('🔒 Throttling refresh, too soon since last refresh');
      return;
    }

    if (!user || user.isGuest || !accessToken) {
      console.log('🔒 Cannot refresh - user not authenticated');
      return;
    }

    try {
      console.log('🔄 Manual refresh notifications requested...');
      lastRefreshTime.current = now;
      
      const data = await notificationsAPI.getNotifications();
      const notificationsList = data.data?.data?.notifications || data.data?.notifications || data.notifications || [];
      const count = data.data?.data?.unreadCount || data.data?.unreadCount || data.unreadCount || 0;
      
      // Process notifications to extract localized content
      const processedNotifications = processNotifications(notificationsList);
      
      setNotifications(processedNotifications);
      setUnreadCount(count);
      console.log('🔄 Refreshed', processedNotifications.length, 'notifications,', count, 'unread');
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    }
  }, [accessToken, user, processNotifications]);

  useEffect(() => {
    const isAuthenticated = isLoggedIn && user && !user.isGuest && accessToken;
    const authKey = isAuthenticated ? `${user._id}-${accessToken.substring(0, 20)}` : null;
    
    console.log('📱 [NotificationContext] Auth state check:');
    console.log('  - isLoggedIn:', isLoggedIn);
    console.log('  - user present:', !!user);
    console.log('  - user ID:', user?._id);
    console.log('  - user isGuest:', user?.isGuest);
    console.log('  - accessToken present:', !!accessToken);
    console.log('  - isAuthenticated:', isAuthenticated);
    console.log('  - authKey:', authKey);
    console.log('  - hasInitialized.current:', hasInitialized.current);
    console.log('  - authKey changed:', hasInitialized.current !== authKey);
    
    if (isAuthenticated && (!hasInitialized.current || hasInitialized.current !== authKey)) {
      console.log('🚀 First time auth ready - initializing notifications');
      hasInitialized.current = authKey;

      // Reduced delay for faster connection (optimization 3: Pre-connect)
      setTimeout(() => {
        console.log('🔗 [NotificationContext] Starting optimized initialization...');
        console.log('🔗 [NotificationContext] Current auth state:', {
          isLoggedIn,
          userId: user?._id,
          hasToken: !!accessToken,
          tokenLength: accessToken?.length
        });
        
        // Optimization 1: Parallel Operations - Run fetch and connect simultaneously
        console.log('🔄 [Optimization] Starting parallel operations: fetch + connect');
        doFetch(); // Start fetching notifications
        doConnect(); // Start socket connection simultaneously
      }, 300); // Reduced from 1000ms to 300ms for faster pre-connection
      
      // Adjusted watchdog timer for faster retry (optimization 3: Pre-connect)
      setTimeout(() => {
        if (!currentSocket.current?.connected && isLoggedIn && user && !user.isGuest && accessToken) {
          console.log('⏰ [NotificationContext] Watchdog: Socket not connected, forcing retry...');
          console.log('⏰ [NotificationContext] Current socket state:', {
            exists: !!currentSocket.current,
            connected: currentSocket.current?.connected,
            connecting: isConnecting.current
          });
          if (!isConnecting.current) {
            doConnect();
          }
        }
      }, 3000); // Reduced from 6000ms to 3000ms for faster retry
      
    } else if (!isAuthenticated && hasInitialized.current) {
      console.log('🔒 Auth lost - cleaning up notifications');
      hasInitialized.current = null;

      if (currentSocket.current) {
        console.log('🧹 Cleaning up notification socket...');
        currentSocket.current.removeAllListeners();
        currentSocket.current.disconnect();
        currentSocket.current = null;
        setIsConnected(false);
      }
      isConnecting.current = false;
      setNotifications([]);
      setUnreadCount(0);
    } else {
      console.log('📋 [NotificationContext] No action needed - auth state unchanged');
    }

    return () => {
      if (currentSocket.current) {
        currentSocket.current.removeAllListeners();
        currentSocket.current.disconnect();
        currentSocket.current = null;
        setIsConnected(false);
      }
      isConnecting.current = false;
    };
  }, [isLoggedIn, user, accessToken, doConnect, doFetch]);

  // Re-process notifications when language changes
  useEffect(() => {
    if (notifications.length > 0) {
      console.log('🌍 Language changed, re-processing notifications for language:', currentLanguage);
      // Re-fetch to get fresh localized content
      refreshNotifications();
    }
  }, [currentLanguage, refreshNotifications, notifications.length]);

  const doFetch = useCallback(async () => {
    try {
      console.log('📡 Fetching notifications from API...');
      const token = accessToken || await AsyncStorage.getItem('accessToken');
      if (!token) {
        console.log('❌ No token available for API fetch');
        return;
      }

      console.log('🔗 Attempting to fetch notifications via API service');
      const data = await notificationsAPI.getNotifications();
      const notificationsList = data.data?.data?.notifications || data.data?.notifications || data.notifications || [];
      const count = data.data?.data?.unreadCount || data.data?.unreadCount || data.unreadCount || 0;
      
      // Process notifications to extract localized content
      const processedNotifications = processNotifications(notificationsList);
      
      setNotifications(processedNotifications);
      setUnreadCount(count);
      console.log('📋 Fetched', processedNotifications.length, 'notifications,', count, 'unread');
    } catch (error) {
      console.error('❌ Error fetching notifications:', error.message || error);

    }
  }, [accessToken, processNotifications]);

  const isTokenExpired = (token) => {
    if (!token) return true;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return true;
      const base64 = parts[1];
      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
      const decoded = atob(padded);
      const payload = JSON.parse(decoded);
      const currentTime = Math.floor(Date.now() / 1000);
      return currentTime >= payload.exp;
    } catch {
      return true;
    }
  };

  const doConnect = useCallback(async () => {
    try {
      console.log('🔍 [NotificationSocket] doConnect called');
      console.log('🔍 [NotificationSocket] isConnecting.current:', isConnecting.current);
      console.log('🔍 [NotificationSocket] currentSocket.current:', currentSocket.current ? 'exists' : 'null');
      
      // Prevent duplicate connections
      if (currentSocket.current?.connected) {
        console.log('🔒 [NotificationSocket] Already connected, skipping...');
        setIsConnected(true);
        return;
      }
      
      // Ensure any existing connection is fully cleaned up first
      if (currentSocket.current) {
        console.log('🧹 [NotificationSocket] Cleaning up existing connection before creating new one');
        currentSocket.current.removeAllListeners();
        currentSocket.current.disconnect();
        currentSocket.current = null;
        setIsConnected(false);
      }
      
      if (isConnecting.current) {
        console.log('🔒 Already connecting, skipping...');
        return;
      }

      let token = accessToken || await AsyncStorage.getItem('accessToken');
      console.log('🔍 [NotificationSocket] Token obtained:', token ? 'present' : 'null', 'length:', token?.length || 0);
      
      // Validate that we have the current user's data and token matches
      if (!user || !user._id) {
        console.log('❌ [NotificationSocket] No valid user data, aborting connection');
        return;
      }
      
      if (!token || isTokenExpired(token)) {
        console.log('🔄 Token expired or missing, attempting to refresh...');
        token = await refreshAccessToken();
        if (!token) {
          Alert.alert('Session expired', 'Please log in again.');
          return;
        }
      }
      
      // Verify token belongs to current user (decode and check userId)
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
        const decoded = atob(padded);
        const payload = JSON.parse(decoded);
        
        console.log('🔍 [NotificationSocket] Token validation:');
        console.log('  - Token userId:', payload.userId);
        console.log('  - Current user._id:', user._id);
        console.log('  - Match:', payload.userId === user._id);
        
        if (payload.userId !== user._id) {
          console.log('⚠️ [NotificationSocket] Token user mismatch - proceeding anyway as token might be updating');
          // Don't abort connection, just log the mismatch as it might resolve itself
        }
      } catch (tokenError) {
        console.error('❌ [NotificationSocket] Error validating token (proceeding anyway):', tokenError.message);
        // Don't abort connection due to token parsing errors
      }

      isConnecting.current = true;
      console.log('🔌 Connecting to notification server at:', SOCKET_URL);
      console.log('🔍 [NotificationSocket] Auth token first 20 chars:', token.substring(0, 20));
      console.log('🔍 [NotificationSocket] Comparing with stock socket - both using same URL:', SOCKET_URL);

      console.log('🔍 [NotificationSocket] Creating socket with config:', {
        url: SOCKET_URL,
        auth: { token: `${token.substring(0, 30)}...` },
        transports: ['websocket', 'polling'],
        timeout: 12000 // Reduced from 15000ms to 12000ms for consistency
      });

      console.log('🔍 [NotificationSocket] Attempting connection to default namespace first...');

      const socketConnection = io(SOCKET_URL, {
        auth: { 
          token: token
        },
        transports: ['websocket', 'polling'],
        timeout: 12000, // Reduced from 15000ms to 12000ms for consistency

        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000, // Reduced from 5000ms to 2000ms for faster reconnection
      });

      console.log('🔍 [NotificationSocket] Socket connection object created');
      console.log('🔍 [NotificationSocket] Initial socket state:', {
        connected: socketConnection.connected,
        connecting: socketConnection.connecting,
        disconnected: socketConnection.disconnected,
        id: socketConnection.id
      });
      console.log('🔍 [NotificationSocket] Setting up event listeners...');

      // Add comprehensive event debugging
      socketConnection.onAny((eventName, ...args) => {
        console.log(`🔍 [NotificationSocket] Event received: ${eventName}`, args);
      });

      // Log connection state changes
      const originalEmit = socketConnection.emit;
      socketConnection.emit = function(...args) {
        console.log('📤 [NotificationSocket] Emitting:', args[0], args.slice(1));
        return originalEmit.apply(this, args);
      };

      socketConnection.on('connect', () => {
        console.log('✅🔥 Connected to notification server!');
        console.log('✅🔥 Socket ID:', socketConnection.id);
        console.log('✅🔥 Socket is ready to receive notifications');
        clearTimeout(connectionTimeout);
        setIsConnected(true);
        isConnecting.current = false;
        currentSocket.current = socketConnection;

        // Emit notification-specific events
        socketConnection.emit('join-notifications', { userId: user?._id });
        socketConnection.emit('test-connection', { userId: user?._id });
        
        // Test if backend responds to our test events
        socketConnection.emit('ping', { timestamp: Date.now(), userId: user?._id });
        
        console.log('📤 [NotificationSocket] Emitted join-notifications, test-connection and ping for user:', user?._id);

        // Set up notification event listeners
        socketConnection.on('notification:new', (notification) => {
          console.log('📨 [NotificationSocket] Received new notification:', notification);
          // Handle incoming notification - refresh to get latest data
          refreshNotifications();
        });

        socketConnection.on('notification:joined', (data) => {
          console.log('🎯 [NotificationSocket] Successfully joined notification channel:', data);
        });

        socketConnection.on('notification-count', (data) => {
          console.log('📊 [NotificationSocket] Received notification count:', data);
          if (data.unreadCount !== undefined) {
            setUnreadCount(data.unreadCount);
          }
        });

        socketConnection.on('pong', (data) => {
          console.log('🏓 [NotificationSocket] Received pong:', {
            clientTimestamp: data.timestamp,
            serverTime: data.serverTime,
            roundTrip: Date.now() - (data.timestamp || 0)
          });
        });

        // Listen for order status updates
        socketConnection.on('order_status', (data) => {
          console.log('📋 [NotificationSocket] Received order status update:', data);
          refreshNotifications();
        });

        // Listen for system notifications
        socketConnection.on('system', (data) => {
          console.log('🔔 [NotificationSocket] Received system notification:', data);
          refreshNotifications();
        });

        // Legacy event listeners for backward compatibility
        socketConnection.on('notification', (notification) => {
          console.log('📨 [NotificationSocket] Received legacy notification:', notification);
          refreshNotifications();
        });

        const heartbeatInterval = setInterval(() => {
          if (socketConnection.connected) {
            socketConnection.emit('ping', { timestamp: Date.now() });
          } else {
            clearInterval(heartbeatInterval);
          }
        }, 30000);

        socketConnection.on('disconnect', () => {
          clearInterval(heartbeatInterval);
        });
      });

      // Add connection timeout after setting up listeners (optimization 2: Reduced timeout)
      const connectionTimeout = setTimeout(() => {
        if (isConnecting.current && !currentSocket.current) {
          console.warn('⏰ [NotificationSocket] Connection timeout - no response after 12 seconds');
          console.warn('⏰ [NotificationSocket] Socket state:', {
            connected: socketConnection.connected,
            connecting: socketConnection.connecting,
            disconnected: socketConnection.disconnected
          });
          isConnecting.current = false;
          socketConnection.disconnect();
        }
      }, 12000); // Reduced from 20000ms to 12000ms (12 seconds)

      socketConnection.on('disconnect', (reason) => {
        console.log('❌ Disconnected from notification server. Reason:', reason);
        setIsConnected(false);
        currentSocket.current = null;
        isConnecting.current = false;

        setTimeout(() => {
          if (!currentSocket.current && user && accessToken && !user.isGuest) {
            console.log('🔄 Auto-reconnecting after disconnect (user authenticated)...');
            doConnect();
          } else {
            console.log('🔒 Not reconnecting: no authenticated user.');
          }
        }, 5000);
      });

      socketConnection.on('connect_error', async (error) => {
        console.error('❌ [NotificationSocket] Socket connection failed:', error.message || error);
        console.error('❌ [NotificationSocket] Error details:', JSON.stringify(error, null, 2));
        console.error('❌ [NotificationSocket] Socket URL attempted:', SOCKET_URL);
        console.error('❌ [NotificationSocket] Auth token used:', token ? `${token.substring(0, 30)}...` : 'null');
        clearTimeout(connectionTimeout);
        setIsConnected(false);
        currentSocket.current = null;
        isConnecting.current = false;

        if (error?.message?.toLowerCase().includes('invalid token') || error?.message?.toLowerCase().includes('authentication')) {
          console.log('🔄 Detected invalid/expired token, attempting to refresh and reconnect...');
          const newToken = await refreshAccessToken();
          if (newToken) {
            doConnect();
            return;
          } else {
            Alert.alert('Session expired', 'Please log in again.');
            return;
          }
        }

        setTimeout(() => {
          console.log('🔄 Attempting to reconnect after connection error...');
          if (!currentSocket.current && user && accessToken) {
            isConnecting.current = false;
            doConnect();
          }
        }, 10000);
      });

      socketConnection.on('notification:new', (notification) => {
        console.log('📢 New notification received via socket:', notification);

        // Localize the incoming notification
        const localizedNotification = getLocalizedNotification(notification);

        setNotifications(prev => {

          const exists = prev.some(n => (n.id || n._id) === (localizedNotification.id || localizedNotification._id));
          if (exists) {
            return prev;
          }
          return [localizedNotification, ...prev];
        });

        setUnreadCount(prev => prev + 1);

        const orderTypes = [
          'order_assigned',
          'order_status', 
          'order_cancelled',
          'order_completed',
          // Legacy types for backward compatibility
          'order_confirmed',
          'order_failed',
          'order_picked_up'
        ];
        
        const notificationType = notification.type?.toLowerCase();
        const shouldShowAlert = !orderTypes.includes(notificationType);
        
        if (shouldShowAlert) {
          Alert.alert(localizedNotification.title, localizedNotification.body, [{ text: 'OK' }]);
        }
      });

      socketConnection.on('pong', (data) => {

      });

      const commonNotificationEvents = [
        'notification',
        'newNotification', 
        'notification:created',
        'notification:received',
        'notificationReceived',
        'push-notification',
        'realtime-notification',
        'user-notification'
      ];

      commonNotificationEvents.forEach(eventName => {
        socketConnection.on(eventName, (notification) => {
          // Localize the incoming notification
          const localizedNotification = getLocalizedNotification(notification);

          setNotifications(prev => {
            const exists = prev.some(n => (n.id || n._id) === (localizedNotification.id || localizedNotification._id));
            if (exists) {
              return prev;
            }
            return [localizedNotification, ...prev];
          });
          
          setUnreadCount(prev => prev + 1);

          const orderTypes = [
            'order_assigned',
            'order_status', 
            'order_cancelled',
            'order_completed',
            // Legacy types for backward compatibility
            'order_confirmed',
            'order_failed',
            'order_picked_up'
          ];
          
          const notificationType = notification.type?.toLowerCase();
          if (!orderTypes.includes(notificationType)) {
            Alert.alert(localizedNotification.title, localizedNotification.body, [{ text: 'OK' }]);
          }
        });
      });

      currentSocket.current = socketConnection;
    } catch (error) {
      console.error('❌ Error in socket connection setup:', error.message || error);
      console.error('❌ Full error details:', error);
      setIsConnected(false);
      isConnecting.current = false;
      
      // Retry connection after a delay
      if (user && accessToken && !user.isGuest) {
        console.log('🔄 Retrying notification socket connection in 3 seconds...');
        setTimeout(() => {
          console.log('🔄 Attempting retry connection...');
          doConnect();
        }, 3000);
      }
    }
  }, [accessToken, user, getLocalizedNotification, refreshNotifications]);

  const markAsRead = useCallback(async () => {
    if (!user || user.isGuest || !accessToken) {
      console.log('❌ Cannot mark all as read: missing user or token');
      return;
    }

    console.log('🔄 Marking all notifications as read');

    try {
      const response = await notificationsAPI.markAllAsRead();
      console.log('📡 API Response:', response);

      if (response) {
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, read: true, isRead: true })));
        console.log('✅ All notifications marked as read');
      } else {
        console.log('❌ Failed to mark all notifications as read');
      }
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
    }
  }, [user, accessToken]);

  const markNotificationAsRead = useCallback(async (notificationId) => {
    if (!user || user.isGuest || !accessToken) {
      console.log('❌ Cannot mark as read: missing user or token');
      return;
    }

    console.log('🔄 Marking notification as read:', notificationId);

    try {
      const response = await notificationsAPI.markAsRead(notificationId);
      console.log('📡 API Response:', response);

      if (response) {
        setNotifications(prev => prev.map(n => 
          (n.id || n._id) === notificationId 
            ? { ...n, read: true, isRead: true }
            : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
        console.log('✅ Notification marked as read');
      } else {
        console.log('❌ Failed to mark notification as read');
      }
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
    }
  }, [user, accessToken]);

  const deleteNotification = useCallback(async (notificationId) => {
    if (!user || user.isGuest || !accessToken) return;

    try {
      const response = await notificationsAPI.deleteNotification(notificationId);

      if (response) {
        setNotifications(prev => prev.filter(n => (n.id || n._id) !== notificationId));
        setUnreadCount(prev => {
          const deletedNotification = notifications.find(n => (n.id || n._id) === notificationId);
          if (deletedNotification && !deletedNotification.read && !deletedNotification.isRead) {
            return prev - 1;
          }
          return prev;
        });
        console.log('✅ Notification deleted');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [user, accessToken, notifications]);

  const reconnectSocket = useCallback(async () => {
    console.log('🔄 Manual socket reconnection requested');

    if (currentSocket.current) {
      currentSocket.current.disconnect();
      currentSocket.current = null;
    }
    
    setIsConnected(false);
    isConnecting.current = false;

    setTimeout(() => {
      if (user && !user.isGuest && accessToken) {
        doConnect();
      }
    }, 1000);
  }, [user, accessToken, doConnect]);

  const value = {
    notifications,
    unreadCount,
    isConnected,
    refreshNotifications,
    markAsRead,
    markNotificationAsRead,
    deleteNotification,
    reconnectSocket,
    forceRefresh: refreshNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
