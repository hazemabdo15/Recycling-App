import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../hooks/useCart';
import { borderRadius, spacing, typography } from '../../styles';
import { colors } from '../../styles/theme';
import { getLabel, isBuyer } from '../../utils/roleLabels';
import { AnimatedButton } from '../common';

const ConfirmationPhase = ({ order, onNewRequest, onFinish }) => {
  const { user } = useAuth();
  const { handleClearCart } = useCart();
  const [copied, setCopied] = useState(false);
  const rotateValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!trackingNumber) {
      const rotateAnimation = Animated.loop(
        Animated.timing(rotateValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      rotateAnimation.start();
      return () => rotateAnimation.stop();
    }
  }, [trackingNumber, rotateValue]);

  const trackingNumber = useMemo(() => {
    const generateTrackingNumber = (orderId) => {
      if (!orderId) {

        return null;
      }

      console.log('[ConfirmationPhase] Using full order ID as tracking number:', orderId);
      return orderId;
    };

    const orderId = order?._id || order?.id;
    return generateTrackingNumber(orderId);
  }, [order]);

  const handleCopyTracking = async () => {
    try {
      await Clipboard.setStringAsync(trackingNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy tracking number:', error);
    }
  };

  const handleDone = async () => {
    try {
      await handleClearCart();
      console.log('[ConfirmationPhase] Cart cleared locally after confirmation');
    } catch (err) {
      console.warn('[ConfirmationPhase] Failed to clear cart locally:', err);
    }
    if (onFinish && typeof onFinish === 'function') {
      onFinish();
    } else if (onNewRequest && typeof onNewRequest === 'function') {
      onNewRequest();
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={styles.successCircle}>
            <MaterialCommunityIcons 
              name="check" 
              size={48} 
              color={colors.white} 
            />
          </View>
        </View>

        <Text style={styles.title}>{getLabel('orderConfirmation', user?.role)}</Text>
        <Text style={styles.subtitle}>
          {getLabel('orderStatus', user?.role)}
        </Text>

        <View style={styles.trackingCard}>
          <View style={styles.trackingHeader}>
            <MaterialCommunityIcons 
              name="truck-fast" 
              size={24} 
              color={colors.primary} 
            />
            <Text style={styles.trackingTitle}>{getLabel('trackingInfo', user?.role)}</Text>
          </View>
          
          <View style={styles.trackingContent}>
            <View style={styles.trackingRow}>
              <Text style={styles.trackingLabel}>Tracking Number</Text>
              <View style={styles.trackingNumberContainer}>
                {trackingNumber ? (
                  <>
                    <Text style={styles.trackingNumber} numberOfLines={1} ellipsizeMode="middle">
                      {trackingNumber}
                    </Text>
                    <TouchableOpacity 
                      style={styles.copyButton}
                      onPress={handleCopyTracking}
                    >
                      <MaterialCommunityIcons 
                        name={copied ? "check" : "content-copy"} 
                        size={16} 
                        color={copied ? colors.accent : colors.primary} 
                      />
                    </TouchableOpacity>
                  </>
                ) : (
                  <View style={styles.loadingContainer}>
                    <Animated.View 
                      style={{
                        transform: [{
                          rotate: rotateValue.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '360deg'],
                          })
                        }]
                      }}
                    >
                      <MaterialCommunityIcons 
                        name="loading" 
                        size={16} 
                        color={colors.neutral} 
                      />
                    </Animated.View>
                    <Text style={styles.loadingText}>Loading...</Text>
                  </View>
                )}
              </View>
            </View>
            
            <View style={styles.trackingRow}>
              <Text style={styles.trackingLabel}>Status</Text>
              <View style={styles.statusContainer}>
                <View style={[styles.statusDot, { backgroundColor: colors.accent }]} />
                <Text style={styles.statusText}>Pending</Text>
              </View>
            </View>
            
            <View style={styles.trackingRow}>
              <Text style={styles.trackingLabel}>{getLabel('estimatedTime', user?.role)}</Text>
              <Text style={styles.trackingValue}>Within 24-48 hours</Text>
            </View>
          </View>
        </View>

        {order && (
          <View style={styles.orderCard}>
            <Text style={styles.orderTitle}>Order Summary</Text>
            <View style={styles.orderRow}>
              <Text style={styles.orderLabel}>Items</Text>
              <Text style={styles.orderValue}>{order.items?.length || 0} items</Text>
            </View>
            {!isBuyer(user) && (
              <View style={styles.orderRow}>
                <Text style={styles.orderLabel}>Total Points</Text>
                <Text style={[styles.orderValue, { color: colors.accent }]}>
                  {order.items?.reduce((sum, item) => sum + (item.points * item.quantity), 0) || 0}
                </Text>
              </View>
            )}
            <View style={styles.orderRow}>
              <Text style={styles.orderLabel}>Total Value</Text>
              <Text style={[styles.orderValue, { color: colors.secondary }]}>
                {(order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0).toFixed(2)} EGP
              </Text>
            </View>
          </View>
        )}

        <View style={styles.stepsCard}>
          <Text style={styles.stepsTitle}>What happens next?</Text>
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepText}>Our team will review your request</Text>
          </View>
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepText}>We&apos;ll contact you to schedule pickup</Text>
          </View>
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepText}>Collect your recyclables and earn rewards</Text>
          </View>
        </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <AnimatedButton style={styles.newRequestButton} onPress={handleDone}>
          <MaterialCommunityIcons name="check" size={20} color={colors.white} />
          <Text style={styles.newRequestButtonText}>Done</Text>
        </AnimatedButton>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.base100,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },

  iconContainer: {
    marginBottom: spacing.xxl,
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  title: {
    ...typography.title,
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.body,
    color: colors.neutral,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },

  trackingCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    width: '100%',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  trackingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  trackingTitle: {
    ...typography.subtitle,
    fontWeight: 'bold',
    color: colors.primary,
  },
  trackingContent: {
    gap: spacing.md,
  },
  trackingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.base100,
  },
  trackingLabel: {
    ...typography.body,
    color: colors.neutral,
    fontWeight: '500',
    flex: 0,
    marginRight: spacing.md,
  },
  trackingNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    justifyContent: 'flex-end',
    maxWidth: '70%',
  },
  trackingNumber: {
    ...typography.subtitle,
    fontWeight: 'bold',
    color: colors.primary,
    fontFamily: 'monospace',
    flex: 1,
    textAlign: 'right',
  },
  copyButton: {
    padding: spacing.xs,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  loadingText: {
    ...typography.body,
    color: colors.neutral,
    fontStyle: 'italic',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.accent,
  },
  trackingValue: {
    ...typography.body,
    color: colors.neutral,
  },

  orderCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    width: '100%',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderTitle: {
    ...typography.subtitle,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.md,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.base100,
  },
  orderLabel: {
    ...typography.body,
    color: colors.neutral,
    fontWeight: '500',
  },
  orderValue: {
    ...typography.subtitle,
    fontWeight: 'bold',
    color: colors.black,
  },

  stepsCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    width: '100%',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stepsTitle: {
    ...typography.subtitle,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 12,
  },
  stepText: {
    ...typography.body,
    color: colors.neutral,
    flex: 1,
  },

  footer: {
    padding: spacing.xl,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.base200,
  },
  newRequestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    gap: spacing.sm,
  },
  newRequestButtonText: {
    ...typography.subtitle,
    color: colors.white,
    fontWeight: '700',
  },
});

export default ConfirmationPhase;
