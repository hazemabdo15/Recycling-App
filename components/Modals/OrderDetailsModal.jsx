import { Modal, View, Text, TouchableOpacity, ScrollView, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDate, formatTime, getStatusBadgeStyle, getStatusText } from '../../utils/deliveryHelpers';
import { colors } from '../../styles/theme';

const getInitials = (name) => {
  if (!name) return '';
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
};

export default function OrderDetailsModal({ visible, onClose, order }) {
  if (!order) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Order Details</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.orderDetailsContent} showsVerticalScrollIndicator={false}>
          {/* Order Summary Card */}
          <View style={styles.detailCard}>
            <View style={styles.detailCardHeader}>
              <Ionicons name="document-text" size={20} color={colors.primary} />
              <Text style={styles.detailCardTitle}>Order Summary</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Order ID:</Text>
              <Text style={styles.detailValue}>#{order._id?.slice(-8)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status:</Text>
              <View style={[styles.statusBadge, getStatusBadgeStyle(order.status)]}>
                <Text style={[styles.statusText, { color: getStatusBadgeStyle(order.status).color }]}>
                  {getStatusText(order.status)}
                </Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Created:</Text>
              <View>
                <Text style={styles.detailValue}>{formatDate(order.createdAt)}</Text>
                <Text style={styles.detailSubValue}>{formatTime(order.createdAt)}</Text>
              </View>
            </View>
            {order.completedAt && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Completed:</Text>
                <View>
                  <Text style={styles.detailValue}>{formatDate(order.completedAt)}</Text>
                  <Text style={styles.detailSubValue}>{formatTime(order.completedAt)}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Customer Information Card */}
          <View style={styles.detailCard}>
            <View style={styles.detailCardHeader}>
              <Ionicons name="person" size={20} color={colors.primary} />
              <Text style={styles.detailCardTitle}>Customer Information</Text>
            </View>
            <View style={styles.customerInfoDetail}>
              {order.user.image ? (
                <Image source={{ uri: order.user.image }} style={styles.customerAvatar} />
              ) : (
                <View style={[styles.customerAvatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarText}>{getInitials(order.user.userName)}</Text>
                </View>
              )}
              <View style={styles.customerDetailsText}>
                <Text style={styles.customerDetailName}>{order.user.userName}</Text>
                <Text style={styles.customerDetailRole}>{order.user.role}</Text>
                <Text style={styles.customerDetailContact}>{order.user.email}</Text>
                {order.user.phoneNumber && (
                  <Text style={styles.customerDetailContact}>{order.user.phoneNumber}</Text>
                )}
              </View>
            </View>
          </View>

          {/* Delivery Address Card */}
          {order.address && (
            <View style={styles.detailCard}>
              <View style={styles.detailCardHeader}>
                <Ionicons name="location" size={20} color={colors.primary} />
                <Text style={styles.detailCardTitle}>Delivery Address</Text>
              </View>
              <View style={styles.addressContainer}>
                <Text style={styles.addressText}>
                  {order.address.building && `${order.address.building}, `}
                  {order.address.street}
                </Text>
                <Text style={styles.addressText}>
                  {order.address.apartment && `Apt ${order.address.apartment}, `}
                  {order.address.floor && `Floor ${order.address.floor}`}
                </Text>
                <Text style={styles.addressText}>
                  {order.address.area}, {order.address.city}
                </Text>
                {order.address.landmark && (
                  <Text style={styles.landmarkText}>
                    Landmark: {order.address.landmark}
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Items Card */}
          {order.items && order.items.length > 0 && (
            <View style={styles.detailCard}>
              <View style={styles.detailCardHeader}>
                <Ionicons name="list" size={20} color={colors.primary} />
                <Text style={styles.detailCardTitle}>Items ({order.items.length})</Text>
              </View>
              {order.items.map((item, index) => (
                <View key={index} style={styles.itemContainer}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemName}>
                      {item.itemName || item.name || item.productName || 'Item'}
                    </Text>
                    <Text style={styles.itemQuantity}>
                      {item.quantity} {item.unit || 'pcs'}
                    </Text>
                  </View>
                  {item.points && (
                    <Text style={styles.itemPoints}>
                      {item.points} points per {item.unit || 'piece'}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Courier Information Card */}
          {order.courier && (
            <View style={styles.detailCard}>
              <View style={styles.detailCardHeader}>
                <Ionicons name="car" size={20} color={colors.primary} />
                <Text style={styles.detailCardTitle}>Courier Information</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Name:</Text>
                <Text style={styles.detailValue}>{order.courier.name}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Email:</Text>
                <Text style={styles.detailValue}>{order.courier.email}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Phone:</Text>
                <Text style={styles.detailValue}>{order.courier.phoneNumber}</Text>
              </View>
            </View>
          )}

          {/* Additional Information Card */}
          <View style={styles.detailCard}>
            <View style={styles.detailCardHeader}>
              <Ionicons name="information-circle" size={20} color={colors.primary} />
              <Text style={styles.detailCardTitle}>Additional Information</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Delivery Fee:</Text>
              <Text style={styles.detailValue}>
                {order.deliveryFee ? `$${order.deliveryFee}` : 'Free'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total Amount:</Text>
              <Text style={styles.detailValue}>
                {order.totalAmount ? `$${order.totalAmount}` : 'N/A'}
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: 'white',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  orderDetailsContent: {
    flex: 1,
    padding: 16,
  },
  detailCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  detailCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  detailSubValue: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  customerInfoDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  customerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  customerDetailsText: {
    flex: 1,
  },
  customerDetailName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  customerDetailRole: {
    fontSize: 14,
    color: colors.primary,
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  customerDetailContact: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  addressContainer: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  addressText: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
    lineHeight: 20,
  },
  landmarkText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  itemContainer: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#22c55e',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  itemQuantity: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  itemPoints: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});