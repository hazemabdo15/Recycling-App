import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import Icon from 'react-native-vector-icons/Feather';

const WaitingForApprovalScreen = () => {
  const router = useRouter();
  const {
    user,
    deliveryStatus: contextDeliveryStatus,
    refreshDeliveryStatus,
    checkPublicDeliveryStatus,
    setUser,
    deliveryStatus,
    setDeliveryStatus,
    isLoading,
    logout,
    token,
  } = useAuth();

  const [sessionDeliveryData, setSessionDeliveryData] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isApprovedLocally, setIsApprovedLocally] = useState(false);

  // Redirect to login if user is undefined
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  const loadSessionData = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem('deliveryUserData');
      if (raw) {
        const parsed = JSON.parse(raw);
        setSessionDeliveryData(parsed);
        console.log('Loaded session delivery data:', parsed);
      }
    } catch (error) {
      console.warn('Failed to load session data:', error);
    }
  }, []);

  useEffect(() => {
    loadSessionData();
  }, [loadSessionData]);

  useEffect(() => {
    if (user?.role === 'delivery') {
      refreshDeliveryStatus();
    }
  }, [user]);

  const handleStatusCheck = async () => {
    if (!user?.email) {
      Alert.alert('Error', 'User email not found');
      return;
    }
    
    console.log('Starting status check for:', user.email);
    console.log('Current token:', token ? 'exists' : 'none');
    console.log('IsApprovedLocally:', isApprovedLocally);
    
    setIsRefreshing(true);
    try {
      let statusData;
      if (!token) {
        console.log('Using public status check');
        statusData = await checkPublicDeliveryStatus(user.email);
      } else {
        console.log('Using authenticated status refresh');
        statusData = await refreshDeliveryStatus();
      }

      console.log('Raw status data received:', statusData);
      
      // Handle different response formats
      let newStatus;
      if (typeof statusData === 'string') {
        newStatus = statusData;
      } else if (statusData?.deliveryStatus) {
        newStatus = statusData.deliveryStatus;
      } else if (statusData?.status) {
        newStatus = statusData.status;
      } else {
        console.warn('Unexpected status data format:', statusData);
        newStatus = 'pending'; // fallback
      }

      console.log('Parsed delivery status:', newStatus);

      if (newStatus === 'approved') {
        console.log('Status: APPROVED - updating state');
        setIsApprovedLocally(true);
        setDeliveryStatus('approved');
        // Clear session data for approved users
        await AsyncStorage.removeItem('deliveryUserData');
        setSessionDeliveryData(null);
        Alert.alert('Great News!', 'Your application has been approved! You can now login to start delivering.');
      } else if (newStatus === 'declined') {
        console.log('Status: DECLINED - updating state');
        setUser({ ...user, isApproved: false });
        setDeliveryStatus('declined');
        setSessionDeliveryData(statusData);
        await AsyncStorage.setItem('deliveryUserData', JSON.stringify(statusData));
        Alert.alert('Application Update', 'Your application status has been updated.');
      } else {
        console.log('Status: PENDING - no change');
        setDeliveryStatus('pending');
        // Update session data for pending status
        const pendingData = {
          deliveryStatus: 'pending',
          user: statusData?.user || user,
        };
        setSessionDeliveryData(pendingData);
        await AsyncStorage.setItem('deliveryUserData', JSON.stringify(pendingData));
        Alert.alert('Status Check', 'Your application is still under review. check again after a while');
      }
    } catch (error) {
      console.error('Status check error:', error);
      Alert.alert('Error', `Failed to check status: ${error.message || 'Unknown error'}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleReapply = async () => {
    await AsyncStorage.removeItem('deliveryUserData');
    setSessionDeliveryData(null);
    router.push('/register');
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('deliveryUserData');
    setSessionDeliveryData(null);
    logout();
    router.replace('/login');
  };

  const handleLoginNavigation = async () => {
    await AsyncStorage.removeItem('deliveryUserData');
    setSessionDeliveryData(null);
    logout();
    router.replace('/login');
  };

  // Show loading while checking auth state
  if (isLoading) {
    return (
      <View style={styles.centered}> 
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.text}>Loading your application status...</Text>
      </View>
    );
  }

  // Don't render anything if user is undefined (redirect is happening)
  if (!user) {
    return null;
  }

  // Determine the current status from multiple sources
  const displayUser = sessionDeliveryData?.user || user;
  const currentDeliveryStatus = sessionDeliveryData?.deliveryStatus || deliveryStatus || contextDeliveryStatus;
  const isApproved = isApprovedLocally || currentDeliveryStatus === 'approved';
  const isDeclined = currentDeliveryStatus === 'declined';
  const isPending = currentDeliveryStatus === 'pending';

  // Get decline-specific data
  const declineReason = sessionDeliveryData?.reason;
  const canReapply = sessionDeliveryData?.canReapply;
  const declinedAt = sessionDeliveryData?.declinedAt;

  const renderIcon = () => {
    if (isApproved) return <Icon name="check-circle" size={40} color="green" />;
    if (isDeclined) return <Icon name="x-circle" size={40} color="red" />;
    return <Icon name="clock" size={40} color="orange" />;
  };

  const renderTitle = () => {
    if (isApproved) return 'Application Approved';
    if (isDeclined) return 'Application Declined';
    return 'Application Under Review';
  };

  const renderDescription = () => {
    if (isApproved) {
      return 'Congratulations! You can now login to start delivering.';
    }
    
    if (isDeclined) {
      let message = 'Unfortunately, your application was declined.';
      if (declineReason) {
        message += `\n\nReason: ${declineReason}`;
      }
      if (declinedAt) {
        const date = new Date(declinedAt).toLocaleDateString();
        message += `\n\nDeclined on: ${date}`;
      }
      return message;
    }
    
    return 'Your application is currently being reviewed. Please check back later for updates.';
  };

  const renderActionButtons = () => {
    if (isApproved) {
      return (
        <TouchableOpacity style={styles.button} onPress={handleLoginNavigation}>
          <Text style={styles.buttonText}>Login to Dashboard</Text>
        </TouchableOpacity>
      );
    }

    if (isDeclined) {
      return (
        <>
          {canReapply && (
            <TouchableOpacity style={styles.buttonAlt} onPress={handleReapply}>
              <Text style={styles.buttonText}>Reapply Now</Text>
            </TouchableOpacity>
          )}
          {!canReapply && (
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Reapplication is not available at this time. Please contact support if you have questions.
              </Text>
            </View>
          )}
        </>
      );
    }

    if (isPending) {
      return (
        <TouchableOpacity
          style={styles.button}
          onPress={handleStatusCheck}
          disabled={isRefreshing}
        >
          <Text style={styles.buttonText}>
            {isRefreshing ? 'Checking...' : 'Check Status Now'}
          </Text>
        </TouchableOpacity>
      );
    }

    // Fallback for any other status - show check status button
    return (
      <TouchableOpacity
        style={styles.button}
        onPress={handleStatusCheck}
        disabled={isRefreshing}
      >
        <Text style={styles.buttonText}>
          {isRefreshing ? 'Checking...' : 'Check Status Now'}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconContainer}>{renderIcon()}</View>
        
        <Text style={styles.title}>{renderTitle()}</Text>
        
        <Text style={[
          styles.description, 
          isDeclined && declineReason && styles.descriptionMultiline
        ]}>
          {renderDescription()}
        </Text>

        {/* User info section */}
        {displayUser && (
          <View style={styles.userInfo}>
            <Text style={styles.userInfoText}>
              Application for: {displayUser.name || displayUser.email}
            </Text>
          </View>
        )}

        {/* Action buttons */}
        {renderActionButtons()}

        {/* Back/Logout button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f9fafb',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#111827',
  },
  description: {
    textAlign: 'center',
    color: '#4b5563',
    marginBottom: 16,
    lineHeight: 20,
  },
  descriptionMultiline: {
    textAlign: 'left',
    paddingHorizontal: 10,
  },
  userInfo: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  userInfoText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 14,
  },
  infoBox: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  infoText: {
    color: '#92400e',
    fontSize: 14,
    lineHeight: 18,
  },
  button: {
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonAlt: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  logoutButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderColor: '#6b7280',
    borderWidth: 1,
  },
  logoutText: {
    color: '#374151',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  text: {
    marginTop: 10,
    color: '#4b5563',
  },
});

export default WaitingForApprovalScreen;