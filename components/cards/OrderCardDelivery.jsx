import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalization } from '../../context/LocalizationContext';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { formatDate, formatTime, getStatusBadgeStyle, getStatusText } from '../../utils/deliveryHelpers';

// Dynamic styles function for OrderCardDelivery
const getOrderCardDeliveryStyles = (colors) => StyleSheet.create({
  orderCard: {
    backgroundColor: colors.itemCardBg,
    borderRadius: 16,
    padding: 16,
    margin: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    backgroundColor: colors.success,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  customerRole: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  orderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderDetail: {
    flex: 1,
  },
  orderLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  orderValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  orderTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.primary + '15',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  detailsButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.primary,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.primary,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  completeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.success + '15',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.success,
  },
  completedText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
  },
});

const getInitials = (name) => {
  if (!name) return '';
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
};

export default function OrderCard({ item, onViewDetails, onComplete }) {
  const { t } = useLocalization();
  const { colors } = useThemedStyles();
  const styles = getOrderCardDeliveryStyles(colors);
  return (
    <View style={styles.orderCard}>
      <View style={styles.customerInfo}>
        <View style={styles.avatarContainer}>
          {item.user.image ? (
            <Image source={{ uri: item.user.image }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>{getInitials(item.user.userName)}</Text>
            </View>
          )}
          <View style={styles.onlineIndicator} />
        </View>
        <View style={styles.customerDetails}>
          <Text style={styles.customerName}>{item.user.userName}</Text>
          <Text style={styles.customerRole}>{item.user.role}</Text>
        </View>
      </View>

      <View style={styles.orderInfo}>
        <View style={styles.orderDetail}>
          <Text style={styles.orderLabel}>{t('orders.orderCard.orderDate')}</Text>
          <Text style={styles.orderValue}>{formatDate(item.createdAt)}</Text>
          <Text style={styles.orderTime}>{formatTime(item.createdAt)}</Text>
        </View>

        <View style={[styles.statusBadge, getStatusBadgeStyle(item.status)]}>
          <Text style={[styles.statusText, { color: getStatusBadgeStyle(item.status).color }]}>
            {getStatusText(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity onPress={() => onViewDetails(item)} style={styles.detailsButton}>
          <Ionicons name="document-text-outline" size={16} color={colors.primary} />
          <Text style={styles.detailsButtonText}>{t('orders.orderCard.viewDetails')}</Text>
        </TouchableOpacity>

        {item.status === 'assigntocourier' && (
          <TouchableOpacity onPress={() => onComplete(item)} style={styles.completeButton}>
            <Ionicons name="checkmark-circle" size={16} color={colors.white} />
            <Text style={styles.completeButtonText}>
              {item.user.role === 'customer' ? t('orders.orderCard.collect') : t('orders.orderCard.deliver')}
            </Text>
          </TouchableOpacity>
        )}

        {item.status === 'completed' && (
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={styles.completedText}>
              {item.user.role === 'customer' ? t('orders.orderCard.collected') : t('orders.orderCard.delivered')}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}