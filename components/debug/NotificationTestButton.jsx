// Test Component - You can add this to any screen temporarily to test notifications
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { useNotifications } from '../../context/NotificationContext';

export const NotificationTestButton = () => {
  const { isConnected, unreadCount, notifications } = useNotifications();
  
  const handleTest = () => {
    Alert.alert(
      'Notification Status',
      `Connected: ${isConnected ? 'Yes' : 'No'}\nUnread: ${unreadCount}\nTotal: ${notifications.length}`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={{ padding: 16 }}>
      <TouchableOpacity
        onPress={handleTest}
        style={{
          backgroundColor: isConnected ? '#4CAF50' : '#f44336',
          padding: 12,
          borderRadius: 8,
          alignItems: 'center'
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>
          Test Notifications ({unreadCount})
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default NotificationTestButton;
