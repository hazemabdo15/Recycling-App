import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

const SOCKET_URL = 'http://192.168.0.165:5000'; // Your backend URL

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
      
      const response = await fetch(`${SOCKET_URL}/api/notifications`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });

      if (response.ok) {
        const data = await response.json();
        const notificationsList = data.data?.data?.notifications || data.data?.notifications || data.notifications || [];
        const count = data.data?.data?.unreadCount || data.data?.unreadCount || data.unreadCount || 0;
        
        setNotifications(notificationsList);
        setUnreadCount(count);
        console.log('🔄 Refreshed', notificationsList.length, 'notifications,', count, 'unread');
      }
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    }
  }, []); // Remove all dependencies to prevent recreation

  // Main authentication and initialization effect
  useEffect(() => {
    const isAuthenticated = isLoggedIn && user && !user.isGuest && accessToken;
    const authKey = isAuthenticated ? `${user._id}-${accessToken.substring(0, 20)}` : null;
    
    if (isAuthenticated && (!hasInitialized.current || hasInitialized.current !== authKey)) {
      console.log('🚀 First time auth ready - initializing notifications');
      hasInitialized.current = authKey; // Store auth key instead of just true/false
      
      // Fetch notifications function - inline to avoid dependencies
      const doFetch = async () => {
        try {
          console.log('📡 Fetching notifications from API...');
          const token = accessToken || await AsyncStorage.getItem('accessToken');
          if (!token) return;

          const response = await fetch(`${SOCKET_URL}/api/notifications`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });

          if (response.ok) {
            const data = await response.json();
            const notificationsList = data.data?.data?.notifications || data.data?.notifications || data.notifications || [];
            const count = data.data?.data?.unreadCount || data.data?.unreadCount || data.unreadCount || 0;
            
            setNotifications(notificationsList);
            setUnreadCount(count);
            console.log('📋 Fetched', notificationsList.length, 'notifications,', count, 'unread');
          }
        } catch (error) {
          console.error('Error fetching notifications:', error);
        }
      };

      // Socket connect function - Using correct backend format from investigation
      const doConnect = async () => {
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
          console.log('🔌 Connecting to notification server...');
          
          // Use the exact format your backend expects: { auth: { token: "jwt_token" } }
          // NO "Bearer " prefix needed according to your backend investigation
          const socketConnection = io(SOCKET_URL, {
            auth: { 
              token: token  // Raw JWT token, no Bearer prefix
            },
            transports: ['websocket', 'polling'],
            timeout: 10000,
            forceNew: true
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
            console.error('❌ Socket connection failed:', error.message);
            setIsConnected(false);
            currentSocket.current = null;
            isConnecting.current = false;
          });

          socketConnection.on('notification:new', (notification) => {
            console.log('📢 New notification received:', notification);
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
            Alert.alert(notification.title, notification.body, [{ text: 'OK' }]);
          });

          currentSocket.current = socketConnection;
        } catch (error) {
          console.error('Error connecting socket:', error);
          setIsConnected(false);
          isConnecting.current = false;
        }
      };
      
      // Execute once
      doFetch();
      doConnect();
      
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
  }, [isLoggedIn, user, accessToken]); // Minimal dependencies

  // Mark notifications as read
  const markAsRead = useCallback(async () => {
    if (!user || user.isGuest || !accessToken) return;

    try {
      const response = await fetch(`${SOCKET_URL}/api/notifications/mark-read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        console.log('✅ Notifications marked as read');
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  }, [user, accessToken]);

  const value = {
    notifications,
    unreadCount,
    isConnected,
    refreshNotifications,
    markAsRead,
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
