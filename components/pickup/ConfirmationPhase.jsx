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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../../context/AuthContext';
import { useLocalization } from '../../context/LocalizationContext';
import { useCart } from '../../hooks/useCart';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { borderRadius, spacing, typography } from '../../styles';
import { isBuyer as isBuyerRole, shouldShowDeliveryFee, shouldShowTotalValue } from '../../utils/roleUtils';

import { getDeliveryFeeForCity } from '../../utils/deliveryFees';
import { AnimatedButton } from '../common';

const ConfirmationPhase = ({ order, onNewRequest, onFinish }) => {
  const { user } = useAuth();
  const { t, tRole } = useLocalization();
  const { colors } = useThemedStyles();
  const insets = useSafeAreaInsets();
  const styles = getConfirmationPhaseStyles(colors, insets);
  const { handleClearCart } = useCart(user);
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

  // Start animation when finishing to show loading state
  useEffect(() => {
    if (isFinishing) {
      const rotateAnimation = Animated.loop(
        Animated.timing(rotateValue, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        })
      );
      rotateAnimation.start();
      return () => rotateAnimation.stop();
    }
  }, [isFinishing, rotateValue]);

  // ✅ Fix tracking number generation to handle nested order structure
  const trackingNumber = useMemo(() => {
    // Handle different order response structures
    const orderId = order?._id || order?.id || order?.data?._id || order?.data?.id;
    if (!orderId) {
      console.warn('[ConfirmationPhase] No order ID found', { order });
      return null;
    }
    
    console.log('[ConfirmationPhase] Using order ID as tracking number:', orderId);
    return orderId;
  }, [order]);

  // ✅ Role-based calculations with nested order structure support
  const orderItems = order?.items || order?.data?.items || [];
  const orderAddress = order?.address || order?.data?.address || {};
  
  const itemsSubtotal = orderItems.reduce((sum, item) => 
    sum + (item.price * item.quantity), 0) || 0;
  
  const deliveryFee = shouldShowDeliveryFee(user) && orderAddress?.city 
    ? getDeliveryFeeForCity(orderAddress.city) 
    : 0;
  
  const totalValue = itemsSubtotal + deliveryFee;

  const handleCopyTracking = async () => {
    try {
      await Clipboard.setStringAsync(trackingNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy tracking number:', error);
    }
  };

  const [isFinishing, setIsFinishing] = useState(false);

  const handleDone = async () => {
    // Prevent multiple presses and provide immediate feedback
    if (isFinishing) return;
    setIsFinishing(true);

    // Clear cart in the background without awaiting
    handleClearCart().catch(err => {
      console.warn('[ConfirmationPhase] Failed to clear cart locally:', err);
    });

    // Immediate navigation without waiting for cart clearing
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

        <Text style={styles.title}>{tRole('orders.confirmation', user?.role)}</Text>
        <Text style={styles.subtitle}>
          {tRole('orders.statusMessage', user?.role)}
        </Text>

        <View style={styles.trackingCard}>
          <View style={styles.trackingHeader}>
            <MaterialCommunityIcons 
              name="truck-fast" 
              size={24} 
              color={colors.primary} 
            />
            <Text style={styles.trackingTitle}>{tRole('orders.trackingInfo', user?.role)}</Text>
          </View>
          
          <View style={styles.trackingContent}>
            <View style={styles.trackingRow}>
              <Text style={styles.trackingLabel}>{t('orders.confirmation.trackingNumber')}</Text>
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
                    <Text style={styles.loadingText}>{t('orders.confirmation.loading')}</Text>
                  </View>
                )}
              </View>
            </View>
            
            <View style={styles.trackingRow}>
              <Text style={styles.trackingLabel}>{t('orders.confirmation.status')}</Text>
              <View style={styles.statusContainer}>
                <View style={[styles.statusDot, { backgroundColor: colors.accent }]} />
                <Text style={styles.statusText}>{t('orders.confirmation.pending')}</Text>
              </View>
            </View>
            
            <View style={styles.trackingRow}>
              <Text style={styles.trackingLabel}>{tRole('orders.estimatedTime', user?.role)}</Text>
              <Text style={styles.trackingValue}>{t('orders.confirmation.estimatedTime')}</Text>
            </View>
          </View>
        </View>

        {order && (
          <View style={styles.orderCard}>
            <Text style={styles.orderTitle}>{t('orders.confirmation.orderSummary')}</Text>
            
            <View style={styles.orderRow}>
              <Text style={styles.orderLabel}>{t('orders.confirmation.items')}</Text>
              <Text style={styles.orderValue}>
                {orderItems?.length || 0}
              </Text>
            </View>
            
            {!isBuyerRole(user) && (
              <View style={styles.orderRow}>
                <Text style={styles.orderLabel}>{t('orders.confirmation.totalPoints')}</Text>
                <Text style={[styles.orderValue, { color: colors.accent }]}>
                  {orderItems?.reduce((sum, item) => 
                    sum + (item.points * item.quantity), 0) || 0}
                </Text>
              </View>
            )}
            
            <View style={styles.orderRow}>
              <Text style={styles.orderLabel}>
                {isBuyerRole(user) ? t('orders.confirmation.itemsSubtotal') : t('orders.confirmation.totalValue')}
              </Text>
              <Text style={styles.orderValue}>
                {itemsSubtotal.toFixed(2)} {t("units.egp")}
              </Text>
            </View>
            
            {/* ✅ Only show for buyers */}
            {shouldShowDeliveryFee(user) && (
              <View style={styles.orderRow}>
                <Text style={styles.orderLabel}>{t('orders.confirmation.deliveryFee')}</Text>
                <Text style={styles.orderValue}>
                  {deliveryFee.toFixed(2)} {t("units.egp")}
                </Text>
              </View>
            )}
            
            {/* ✅ Only show total for buyers */}
            {shouldShowTotalValue(user) && (
              <View style={styles.orderRow}>
                <Text style={styles.orderLabel}>{t('orders.confirmation.totalValue')}</Text>
                <Text style={[styles.orderValue, { color: colors.secondary }]}>
                  {totalValue.toFixed(2)} {t("units.egp")}
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.stepsCard}>
          <Text style={styles.stepsTitle}>{t('orders.confirmation.whatNext')}</Text>
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepText}>{t('orders.confirmation.steps.review')}</Text>
          </View>
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepText}>{t('orders.confirmation.steps.contact')}</Text>
          </View>
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepText}>{t('orders.confirmation.steps.collect')}</Text>
          </View>
        </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <AnimatedButton 
          style={[
            styles.newRequestButton,
            isFinishing && styles.newRequestButtonDisabled
          ]} 
          onPress={handleDone}
          disabled={isFinishing}
        >
          {isFinishing ? (
            <>
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
                <MaterialCommunityIcons name="loading" size={20} color={colors.white} />
              </Animated.View>
              <Text style={styles.newRequestButtonText}>{t('common.redirecting', 'Redirecting...')}</Text>
            </>
          ) : (
            <>
              <MaterialCommunityIcons name="check" size={20} color={colors.white} />
              <Text style={styles.newRequestButtonText}>{t('orders.confirmation.done')}</Text>
            </>
          )}
        </AnimatedButton>
      </View>
    </View>
  );
};

// Dynamic styles function for ConfirmationPhase
const getConfirmationPhaseStyles = (colors, insets) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },

  trackingCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    width: '100%',
    shadowColor: colors.shadow,
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
    borderBottomColor: colors.surfaceVariant,
  },
  trackingLabel: {
    ...typography.body,
    color: colors.textSecondary,
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
    color: colors.textSecondary,
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
    color: colors.textSecondary,
  },

  orderCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    width: '100%',
    shadowColor: colors.shadow,
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
    borderBottomColor: colors.surfaceVariant,
  },
  orderLabel: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  orderValue: {
    ...typography.subtitle,
    fontWeight: 'bold',
    color: colors.text,
  },

  stepsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    width: '100%',
    shadowColor: colors.shadow,
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
    color: colors.textSecondary,
    flex: 1,
  },

  footer: {
    padding: spacing.xl,
    paddingBottom: Math.max(insets.bottom + spacing.md, spacing.xl),
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
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
  newRequestButtonDisabled: {
    backgroundColor: colors.primaryVariant || colors.primary,
    opacity: 0.8,
  },
  newRequestButtonText: {
    ...typography.subtitle,
    color: colors.white,
    fontWeight: '700',
  },
});

export default ConfirmationPhase;
