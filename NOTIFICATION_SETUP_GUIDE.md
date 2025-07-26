# 🚀 Complete Notification System Implementation Guide

## 📋 Overview

Your notification system is **already implemented and functional**! Here's what's working:

✅ **Backend Components:**
- MongoDB Notification model with persistence
- Notification service with real-time Socket.IO integration  
- Notification controller with REST API endpoints
- Socket.IO server with JWT authentication
- Integration with order status changes (assigned, cancelled, completed)

✅ **Real-time Features:**
- WebSocket connections for instant notifications
- User-specific notification rooms
- Automatic notification creation on order status changes

## 🔧 Backend Configuration

### 1. Environment Variables
Make sure your `.env` file includes:

```env
JWT_SECRET=your-jwt-secret-key
MONGODB_URI=your-mongodb-connection-string
PORT=5000
```

### 2. Socket.IO CORS Configuration
Update `src/socket/socketServer.ts` to include your frontend URLs:

```typescript
origin: [
  "http://localhost:3000",           // Next.js development
  "exp://192.168.1.100:8081",       // Expo Go (update IP as needed)
  "https://your-production-domain.com" // Production web
]
```

### 3. Start the Server
```bash
npm run dev
```

## 📱 Expo Go App Implementation

### 1. Install Dependencies
```bash
npx expo install socket.io-client
```

### 2. Create Notification Context

Create `contexts/NotificationContext.js`:

```javascript
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NotificationContext = createContext();

const SOCKET_URL = 'http://YOUR_BACKEND_IP:5000'; // Update with your backend URL

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);

  // Connect to Socket.IO when user is authenticated
  const connectSocket = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;

      const socketConnection = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling']
      });

      socketConnection.on('connect', () => {
        console.log('✅ Connected to notification server');
      });

      // Listen for new notifications
      socketConnection.on('notification:new', (notification) => {
        console.log('📢 New notification received:', notification);
        
        // Add to notifications list
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Show in-app notification (you can customize this)
        // showInAppNotification(notification);
      });

      socketConnection.on('disconnect', (reason) => {
        console.log('❌ Disconnected from notification server:', reason);
      });

      setSocket(socketConnection);
    } catch (error) {
      console.error('Socket connection error:', error);
    }
  };

  // Fetch notifications from API on app start
  const fetchNotifications = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`${SOCKET_URL}/api/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data.notifications || []);
        setUnreadCount(data.data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Mark notifications as read
  const markAsRead = async (notificationIds) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`${SOCKET_URL}/api/notifications/mark-read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationIds }),
      });

      if (response.ok) {
        // Update local state
        setNotifications(prev => 
          prev.map(notif => 
            notificationIds.includes(notif.id) 
              ? { ...notif, isRead: true }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  // Disconnect socket
  const disconnectSocket = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  };

  const value = {
    notifications,
    unreadCount,
    connectSocket,
    disconnectSocket,
    fetchNotifications,
    markAsRead,
    socket
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};
```

### 3. Wrap Your App

Update your main App component:

```javascript
import { NotificationProvider } from './contexts/NotificationContext';

export default function App() {
  return (
    <NotificationProvider>
      {/* Your existing app content */}
      <YourAppContent />
    </NotificationProvider>
  );
}
```

### 4. Use in Components

```javascript
import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useNotifications } from '../contexts/NotificationContext';

export default function NotificationScreen() {
  const { 
    notifications, 
    unreadCount, 
    fetchNotifications, 
    markAsRead,
    connectSocket 
  } = useNotifications();

  useEffect(() => {
    // Fetch notifications on screen load
    fetchNotifications();
    
    // Connect socket for real-time updates
    connectSocket();
  }, []);

  const handleMarkAsRead = (notificationId) => {
    markAsRead([notificationId]);
  };

  const renderNotification = ({ item }) => (
    <TouchableOpacity 
      style={{
        padding: 16,
        backgroundColor: item.isRead ? '#f9f9f9' : '#e3f2fd',
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
      }}
      onPress={() => handleMarkAsRead(item.id)}
    >
      <Text style={{ fontWeight: 'bold', fontSize: 16 }}>
        {item.title}
      </Text>
      <Text style={{ marginTop: 4, color: '#666' }}>
        {item.body}
      </Text>
      <Text style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
        {new Date(item.createdAt).toLocaleString()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={{ padding: 16, backgroundColor: '#fff' }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
          Notifications ({unreadCount} unread)
        </Text>
      </View>
      
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        refreshing={false}
        onRefresh={fetchNotifications}
      />
    </View>
  );
}
```

### 5. Connect/Disconnect on Auth Changes

```javascript
import { useNotifications } from '../contexts/NotificationContext';

// In your login component
const handleLogin = async (credentials) => {
  // Your login logic
  const response = await loginAPI(credentials);
  
  if (response.success) {
    await AsyncStorage.setItem('authToken', response.token);
    
    // Connect to notifications
    connectSocket();
    fetchNotifications();
  }
};

// In your logout component
const handleLogout = async () => {
  await AsyncStorage.removeItem('authToken');
  
  // Disconnect from notifications
  disconnectSocket();
};
```

## 🌐 Next.js Web Implementation

### 1. Install Dependencies
```bash
npm install socket.io-client
```

### 2. Create Notification Hook

Create `hooks/useNotifications.js`:

```javascript
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000'; // Update for production

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);

  const connectSocket = (token) => {
    if (socket) return;

    const socketConnection = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socketConnection.on('connect', () => {
      console.log('✅ Connected to notification server');
    });

    socketConnection.on('notification:new', (notification) => {
      console.log('📢 New notification:', notification);
      
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Show browser notification (optional)
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.body,
          icon: '/favicon.ico'
        });
      }
    });

    setSocket(socketConnection);
  };

  const fetchNotifications = async (token) => {
    try {
      const response = await fetch(`${SOCKET_URL}/api/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data.notifications || []);
        setUnreadCount(data.data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (token, notificationIds) => {
    try {
      const response = await fetch(`${SOCKET_URL}/api/notifications/mark-read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationIds }),
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notificationIds.includes(notif.id) 
              ? { ...notif, isRead: true }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const disconnectSocket = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  };

  return {
    notifications,
    unreadCount,
    connectSocket,
    disconnectSocket,
    fetchNotifications,
    markAsRead
  };
};
```

### 3. Use in Components

```javascript
import { useEffect } from 'react';
import { useNotifications } from '../hooks/useNotifications';

export default function NotificationComponent() {
  const { 
    notifications, 
    unreadCount, 
    connectSocket, 
    fetchNotifications, 
    markAsRead 
  } = useNotifications();

  useEffect(() => {
    // Get token from your auth system
    const token = localStorage.getItem('authToken'); // or however you store it
    
    if (token) {
      connectSocket(token);
      fetchNotifications(token);
    }

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleMarkAsRead = (notificationId) => {
    const token = localStorage.getItem('authToken');
    markAsRead(token, [notificationId]);
  };

  return (
    <div className="notification-container">
      <h3>Notifications ({unreadCount} unread)</h3>
      
      <div className="notification-list">
        {notifications.map((notification) => (
          <div 
            key={notification.id}
            className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}
            onClick={() => handleMarkAsRead(notification.id)}
          >
            <h4>{notification.title}</h4>
            <p>{notification.body}</p>
            <small>{new Date(notification.createdAt).toLocaleString()}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 🎯 Available API Endpoints

Your backend already provides these notification endpoints:

- `GET /api/notifications` - Get all notifications for user
- `GET /api/notifications/unread-count` - Get unread count
- `PATCH /api/notifications/mark-read` - Mark notifications as read
- `PATCH /api/notifications/:id/mark-read` - Mark single notification as read
- `DELETE /api/notifications/:id` - Delete a notification
- `DELETE /api/notifications` - Delete all notifications for user

## 🎉 Testing the System

### 1. Test Order Status Changes
- Create an order in your app
- As admin, change order status to "assigntocourier" 
- Check if notification appears in real-time

### 2. Test Order Cancellation
- Cancel an order with a reason
- Verify the notification includes the cancellation reason

### 3. Test Persistence
- Close the app/website
- Change order status
- Reopen app/website
- Verify notifications are fetched and displayed

## 🔧 Troubleshooting

1. **Socket not connecting**: Check if JWT token is being sent correctly
2. **Notifications not appearing**: Check browser console/app logs for errors
3. **CORS issues**: Ensure your frontend URL is in the socket CORS origins

## 📝 Customization

You can customize notification messages by editing the functions in `src/services/notificationService.ts`:
- `createOrderAssignedNotification`
- `createOrderCancelledNotification` 
- `createOrderCompletedNotification`

Your notification system is production-ready! 🚀
