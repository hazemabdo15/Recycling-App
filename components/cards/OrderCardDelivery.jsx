import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDate, formatTime, getStatusBadgeStyle, getStatusText } from '../../utils/deliveryHelpers';
import { colors } from '../../styles/theme';

const getInitials = (name) => {
  if (!name) return '';
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
};

export default function OrderCard({ item, onViewDetails, onComplete }) {
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
          <Text style={styles.orderLabel}>Order Date</Text>
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
          <Text style={styles.detailsButtonText}>View Details</Text>
        </TouchableOpacity>

        {item.status === 'assigntocourier' && (
          <TouchableOpacity onPress={() => onComplete(item)} style={styles.completeButton}>
            <Ionicons name="checkmark-circle" size={16} color="white" />
            <Text style={styles.completeButtonText}>
              {item.user.role === 'customer' ? 'Collect' : 'Deliver'}
            </Text>
          </TouchableOpacity>
        )}

        {item.status === 'completed' && (
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
            <Text style={styles.completedText}>
              {item.user.role === 'customer' ? 'Collected' : 'Delivered'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
    orderCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        margin: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
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
    backgroundColor: '#e5e7eb',
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
    backgroundColor: '#22c55e',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'white',
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
    backgroundColor: '#dbeafe',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
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
    color: 'white',
    },
    completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#dcfce7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#22c55e',
    },
    completedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#22c55e',
    },
});