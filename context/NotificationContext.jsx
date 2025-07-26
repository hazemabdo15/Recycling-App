import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../services/api/config';
import { notificationsAPI } from '../services/api/notifications';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

const SOCKET_URL = API_BASE_URL; // Your backend URL

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  
  const { user, accessToken, isLoggedIn } = useAuth();
  
  // Use refs to prevent recreation in effects
  const currentSocket = useRef(null);
  const isConnecting = useRef(false);
  const hasInitialized = useRef(null); // Track specific auth state
  const lastRefreshTime = useRef(0);

  // Throttled refresh function to prevent infinite loops
  const refreshNotifications = useCallback(async () => {
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTime.current;
    
    if (timeSinceLastRefresh < 5000) { // 5 second minimum between refreshes
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
      
      setNotifications(notificationsList);
      setUnreadCount(count);
      console.log('🔄 Refreshed', notificationsList.length, 'notifications,', count, 'unread');
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    }
  }, [accessToken, user]); // Include dependencies

  // Main authentication and initialization effect
  useEffect(() => {
    const isAuthenticated = isLoggedIn && user && !user.isGuest && accessToken;
    const authKey = isAuthenticated ? `${user._id}-${accessToken.substring(0, 20)}` : null;
    
    if (isAuthenticated && (!hasInitialized.current || hasInitialized.current !== authKey)) {
      console.log('🚀 First time auth ready - initializing notifications');
      hasInitialized.current = authKey; // Store auth key instead of just true/false
      
      // Add a small delay to ensure auth is fully ready
      setTimeout(() => {
        doFetch();
        doConnect();
      }, 1000);
      
    } else if (!isAuthenticated && hasInitialized.current) {
      console.log('🔒 Auth lost - cleaning up notifications');
      hasInitialized.current = null; // Reset to null instead of false
      
      // Cleanup
      if (currentSocket.current) {
        currentSocket.current.disconnect();
        currentSocket.current = null;
        setIsConnected(false);
      }
      isConnecting.current = false;
      setNotifications([]);
      setUnreadCount(0);
    }

    // Cleanup on unmount
    return () => {
      if (currentSocket.current) {
        currentSocket.current.disconnect();
        currentSocket.current = null;
        setIsConnected(false);
      }
      isConnecting.current = false;
    };
  }, [isLoggedIn, user, accessToken, doFetch, doConnect]); // Include all dependencies

  // Fetch notifications function - moved outside useEffect for better reusability
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
      
      setNotifications(notificationsList);
      setUnreadCount(count);
      console.log('📋 Fetched', notificationsList.length, 'notifications,', count, 'unread');
    } catch (error) {
      console.error('❌ Error fetching notifications:', error.message || error);
      // Don't throw - just log and continue
    }
  }, [accessToken]);

  // Socket connect function - moved outside useEffect for better reusability  
  const doConnect = useCallback(async () => {
    try {
      if (isConnecting.current || currentSocket.current) {
        console.log('🔒 Already connecting or connected, skipping...');
        return;
      }

      const token = accessToken || await AsyncStorage.getItem('accessToken');
      if (!token) {
        console.log('❌ No token available for socket connection');
        return;
      }

      isConnecting.current = true;
      console.log('🔌 Connecting to notification server at:', SOCKET_URL);
      
      // Use the exact format your backend expects: { auth: { token: "jwt_token" } }
      // NO "Bearer " prefix needed according to your backend investigation
      const socketConnection = io(SOCKET_URL, {
        auth: { 
          token: token  // Raw JWT token, no Bearer prefix
        },
        transports: ['websocket', 'polling'],
        timeout: 15000, // Increase timeout
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 2000,
      });

      socketConnection.on('connect', () => {
        console.log('✅ Connected to notification server!');
        console.log('✅ Socket ID:', socketConnection.id);
        setIsConnected(true);
        isConnecting.current = false;
        currentSocket.current = socketConnection;
      });

      socketConnection.on('disconnect', (reason) => {
        console.log('❌ Disconnected from notification server. Reason:', reason);
        setIsConnected(false);
        currentSocket.current = null;
        isConnecting.current = false;
      });

      socketConnection.on('connect_error', (error) => {
        console.error('❌ Socket connection failed:', error.message || error);
        console.error('❌ Socket URL attempted:', SOCKET_URL);
        setIsConnected(false);
        currentSocket.current = null;
        isConnecting.current = false;
        
        // Don't retry immediately on error
        setTimeout(() => {
          isConnecting.current = false;
        }, 5000);
      });

      socketConnection.on('notification:new', (notification) => {
        console.log('📢 New notification received:', notification);
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Only show alert for non-order related notifications
        const orderTypes = [
          'order_assigned',
          'order_confirmed', 
          'order_cancelled',
          'order_failed',
          'order_completed',
          'order_picked_up'
        ];
        
        const notificationType = notification.type?.toLowerCase();
        const shouldShowAlert = !orderTypes.includes(notificationType);
        
        if (shouldShowAlert) {
          Alert.alert(notification.title, notification.body, [{ text: 'OK' }]);
        }
      });

      currentSocket.current = socketConnection;
    } catch (error) {
      console.error('❌ Error in socket connection setup:', error.message || error);
      setIsConnected(false);
      isConnecting.current = false;
    }
  }, [accessToken]);

  // Mark notifications as read
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

  // Mark individual notification as read
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

  // Delete a specific notification
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

  const value = {
    notifications,
    unreadCount,
    isConnected,
    refreshNotifications,
    markAsRead,
    markNotificationAsRead,
    deleteNotification,
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
