import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AddressPhase from '../components/pickup/AddressPhase';
import ConfirmationPhase from '../components/pickup/ConfirmationPhase';
import ReviewPhase from '../components/pickup/ReviewPhase';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../hooks/useCart';
import { usePickupWorkflow } from '../hooks/usePickupWorkflow';
import { isAuthenticated } from '../services/auth';
import { colors, spacing, typography } from '../styles/theme';

export default function Pickup() {
  const insets = useSafeAreaInsets();
  const { user, isLoggedIn, accessToken, loading: authContextLoading } = useAuth();
  const { cartItems } = useCart();
  
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [dialogShown, setDialogShown] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    console.log('[Pickup] Auth state changed:');
    console.log('  - isLoggedIn:', isLoggedIn);
    console.log('  - user:', user ? 'present' : 'null');
    console.log('  - accessToken:', accessToken ? 'present' : 'null');
    console.log('  - authContextLoading:', authContextLoading);
  }, [isLoggedIn, user, accessToken, authContextLoading]);

  useFocusEffect(
    useCallback(() => {
      console.log('[Pickup] Screen focused');
      setIsFocused(true);
      
      return () => {
        console.log('[Pickup] Screen unfocused');
        setIsFocused(false);
        setDialogShown(false);
      };
    }, [])
  );

  useEffect(() => {
    if (!isFocused) {
      console.log('[Pickup] Screen not focused, skipping auth check');
      return;
    }
    
    const checkAuth = async () => {
      try {
        console.log('[Pickup] Starting auth check...');
        console.log('[Pickup] authContextLoading:', authContextLoading);

        if (authContextLoading) {
          console.log('[Pickup] Waiting for AuthContext to finish loading...');
          return;
        }
        
        console.log('[Pickup] isLoggedIn:', isLoggedIn);
        console.log('[Pickup] user:', user ? 'present' : 'null');
        console.log('[Pickup] accessToken:', accessToken ? 'present' : 'null');
        
        if (!isLoggedIn || !user) {
          console.log('[Pickup] User not logged in or user data missing');
          setAuthError('LOGIN_REQUIRED');
          setAuthLoading(false);
          return;
        }

        const authStatus = await isAuthenticated();
        console.log('[Pickup] isAuthenticated() result:', authStatus);
        
        if (!authStatus) {
          console.log('[Pickup] Token expired or invalid');
          setAuthError('TOKEN_EXPIRED');
          setAuthLoading(false);
          return;
        }

        console.log('[Pickup] Authentication verified successfully');
        setAuthError(null);
        setAuthLoading(false);
      } catch (error) {
        console.error('[Pickup] Authentication check failed:', error);
        setAuthError('AUTH_ERROR');
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, [isLoggedIn, user, accessToken, authContextLoading, isFocused]);

  const workflowHook = usePickupWorkflow();

  const {
    currentPhase = 1,
    selectedAddress = null,
    orderData = null,
    nextPhase = () => {},
    previousPhase = () => {},
    setSelectedAddress = () => {},
    createOrder = () => {},
    reset = () => {}
  } = workflowHook || {};

  useEffect(() => {
    console.log('[Pickup] Phase changed to:', currentPhase);
    console.log('[Pickup] Selected address:', selectedAddress ? 'present' : 'null');
  }, [currentPhase, selectedAddress]);

  const handleAddressSelect = useCallback((address) => {
    console.log('[Pickup] handleAddressSelect called with:', address);
    setSelectedAddress(address);
  }, [setSelectedAddress]);

  const handleNextPhase = useCallback(() => {
    console.log('[Pickup] handleNextPhase called, current phase:', currentPhase);
    nextPhase();
  }, [nextPhase, currentPhase]);

  useEffect(() => {
    if (!isFocused || !authError || dialogShown) {
      return;
    }
    
    setDialogShown(true);
    
    if (authError === 'LOGIN_REQUIRED') {
      Alert.alert(
        'Login Required',
        'You need to be logged in to schedule a pickup. Please log in to continue.',
        [
          { text: 'Cancel', onPress: () => {
            setDialogShown(false);
            router.back();
          }},
          { text: 'Login', onPress: () => {
            setDialogShown(false);
            router.push('/login');
          }}
        ]
      );
    } else if (authError === 'TOKEN_EXPIRED') {
      Alert.alert(
        'Session Expired',
        'Your session has expired. Please log in again to schedule a pickup.',
        [
          { text: 'OK', onPress: () => {
            setDialogShown(false);
            router.push('/login');
          }}
        ]
      );
    } else if (authError === 'AUTH_ERROR') {
      Alert.alert(
        'Authentication Error',
        'There was an issue verifying your session. Please try logging in again.',
        [
          { text: 'OK', onPress: () => {
            setDialogShown(false);
            router.push('/login');
          }}
        ]
      );
    }
  }, [authError, dialogShown, isFocused]);

  useEffect(() => {
    return () => reset();
  }, [reset]);

  if (authLoading || authContextLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 20 }]}
        >
          <Text style={styles.headerTitle}>Loading...</Text>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.messageContainer}>
            <MaterialCommunityIcons 
              name="loading" 
              size={64} 
              color={colors.primary} 
            />
            <Text style={styles.messageTitle}>Preparing Pickup</Text>
            <Text style={styles.messageText}>
              Verifying your session and setting up pickup workflow...
            </Text>
          </View>
        </View>
      </View>
    );
  }

  if (authError) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 20 }]}
        >
          <Text style={styles.headerTitle}>Authentication Required</Text>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.messageContainer}>
            <MaterialCommunityIcons 
              name="account-alert" 
              size={64} 
              color={colors.primary} 
            />
            <Text style={styles.messageTitle}>Login Required</Text>
            <Text style={styles.messageText}>
              You need to be logged in to schedule a pickup.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  const getPhaseTitle = () => {
    switch (currentPhase) {
      case 1:
        return 'Select Address';
      case 2:
        return 'Review Order';
      case 3:
        return 'Order Confirmed';
      default:
        return 'Schedule Pickup';
    }
  };

  const renderProgressIndicator = () => (
    <View style={styles.progressContainer}>
      {[1, 2, 3].map((phase) => (
        <View key={phase} style={styles.progressStep}>
          <View style={[
            styles.progressCircle,
            currentPhase >= phase && styles.progressCircleActive
          ]}>
            <Text style={[
              styles.progressText,
              currentPhase >= phase && styles.progressTextActive
            ]}>
              {phase}
            </Text>
          </View>
          {phase < 3 && (
            <View style={[
              styles.progressLine,
              currentPhase > phase && styles.progressLineActive
            ]} />
          )}
        </View>
      ))}
    </View>
  );

  const renderCurrentPhase = (phase = currentPhase) => {
    console.log('[Pickup] Rendering phase:', phase);
    
    try {
      switch (phase) {
      case 1:
        return (
          <AddressPhase
            user={user}
            selectedAddress={selectedAddress}
            onAddressSelect={handleAddressSelect}
            onNext={handleNextPhase}
            onBack={() => router.back()}
            pickupWorkflow={workflowHook}
          />
        );
      case 2:

        if (!selectedAddress) {
          console.log('[Pickup] No selected address, staying in phase 1');
          return renderCurrentPhase(1);
        }
        if (!cartItems || Object.keys(cartItems).length === 0) {
          console.log('[Pickup] No cart items, redirecting to cart');
          router.push('/(tabs)/cart');
          return null;
        }
        
        console.log('[Pickup] Rendering ReviewPhase with:', {
          user: !!user,
          cartItems: Object.keys(cartItems).length,
          selectedAddress: !!selectedAddress,
          loading: workflowHook?.loading,
          selectedAddressKeys: selectedAddress ? Object.keys(selectedAddress) : [],
          userType: typeof user,
          cartItemsType: typeof cartItems
        });

        if (typeof createOrder !== 'function') {
          console.error('[Pickup] createOrder is not a function:', typeof createOrder);
          return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
              <Text style={{ color: 'red', textAlign: 'center' }}>
                Configuration error: Invalid createOrder function
              </Text>
            </View>
          );
        }
        
        if (typeof previousPhase !== 'function') {
          console.error('[Pickup] previousPhase is not a function:', typeof previousPhase);
          return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
              <Text style={{ color: 'red', textAlign: 'center' }}>
                Configuration error: Invalid previousPhase function
              </Text>
            </View>
          );
        }

        console.log('[Pickup] Creating ReviewPhase directly...');
        return (
          <ReviewPhase
            user={user}
            cartItems={cartItems}
            selectedAddress={selectedAddress}
            onConfirm={createOrder}
            onBack={previousPhase}
            loading={workflowHook?.loading || false}
            pickupWorkflow={workflowHook}
          />
        );
      case 3:
        return (
          <ConfirmationPhase
            order={orderData}
            onFinish={() => {
              reset();
              router.push('/(tabs)/home');
            }}
          />
        );
      default:
        return null;
    }
    } catch (error) {
      console.error('[Pickup] Error rendering phase:', phase, error);
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ color: colors.error, textAlign: 'center', marginBottom: 20 }}>
            An error occurred while loading this phase. Please try again.
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: colors.primary,
              paddingVertical: 12,
              paddingHorizontal: 24,
              borderRadius: 8
            }}
            onPress={() => {
              console.log('[Pickup] Retrying phase render');

              if (phase > 1) {
                previousPhase();
              }
            }}
          >
            <Text style={{ color: colors.white, fontWeight: 'bold' }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <Text style={styles.headerTitle}>{getPhaseTitle()}</Text>
        {renderProgressIndicator()}
      </LinearGradient>

      <View style={styles.content}>
        {renderCurrentPhase()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    ...typography.title,
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  content: {
    flex: 1,
    backgroundColor: colors.base100,
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  messageTitle: {
    ...typography.title,
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  messageText: {
    ...typography.body,
    color: colors.neutral,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },

  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  progressCircleActive: {
    backgroundColor: colors.white,
    borderColor: colors.white,
  },
  progressText: {
    ...typography.caption,
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.white,
  },
  progressTextActive: {
    color: colors.primary,
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: spacing.sm,
  },
  progressLineActive: {
    backgroundColor: colors.white,
  },
});
