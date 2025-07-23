import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useContext, useEffect, useState } from 'react';
import {
    StatusBar,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthContext } from '../context/AuthContext';
import { useCart } from '../hooks/useCart';
import { spacing, typography } from '../styles';
import { colors } from '../styles/theme';

const PHASES = {
  ADDRESS: 0,
  REVIEW: 1,
  CONFIRMATION: 2,
};

const Pickup = () => {
  const insets = useSafeAreaInsets();
  const { user, token } = useContext(AuthContext);
  const { cartItems } = useCart();

  const [currentPhase, setCurrentPhase] = useState(PHASES.ADDRESS);
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    if (!user || !token) {
      setShowLoginDialog(true);
    }
  }, [user, token]);

  if (!user || !token) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 20 }]}
        >
          <Text style={styles.headerTitle}>Login Required</Text>
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
              You need to be logged in to schedule a pickup. Please log in to continue.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <Text style={styles.headerTitle}>Schedule Your Pickup</Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.messageContainer}>
          <MaterialCommunityIcons 
            name="truck-fast" 
            size={64} 
            color={colors.primary} 
          />
          <Text style={styles.messageTitle}>Pickup Workflow</Text>
          <Text style={styles.messageText}>
            Pickup workflow is under development. Coming soon!
          </Text>
        </View>
      </View>
    </View>
  );
};

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
  },
});

export default Pickup;
