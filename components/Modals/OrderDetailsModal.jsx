import { Ionicons } from '@expo/vector-icons';
import { Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalization } from '../../context/LocalizationContext';
import { useThemedStyles } from '../../hooks/useThemedStyles';

const getInitials = (name) => {
  if (!name) return '';
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
};

export default function OrderDetailsModal({ visible, onClose, order }) {
  const { currentLanguage, t } = useLocalization();
  const { colors } = useThemedStyles();
  const styles = getOrderDetailsModalStyles(colors);
  if (!order) return null;

  const getLocalizedText = (textObject, fallback = '') => {
    if (!textObject) return fallback;
    if (typeof textObject === 'string') return textObject;
    return textObject[currentLanguage] || textObject.en || fallback;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{t('orderDetails.title') || 'Order Details'}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.orderDetailsContent} showsVerticalScrollIndicator={false}>

          {/* Customer Information Card */}
          <View style={styles.detailCard}>
            <View style={styles.detailCardHeader}>
              <Ionicons name="person" size={20} color={colors.primary} />
              <Text style={styles.detailCardTitle}>{t('orderDetails.customerInformation') || 'Customer Information'}</Text>
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
                <Text style={styles.detailCardTitle}>{t('orderDetails.deliveryAddress') || 'Delivery Address'}</Text>
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
                    {t('orderDetails.landmark') || 'Landmark'}: {order.address.landmark}
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
                <Text style={styles.detailCardTitle}>
                  {t('orderDetails.items') || 'Items'} ({order.items.length})
                </Text>
              </View>
              {order.items.map((item, index) => (
                  <View key={index} style={styles.itemContainer}>
                    <View style={styles.itemHeader}>
                      <Text style={styles.itemName}>
                        {getLocalizedText(item.name, 'Item')}
                      </Text>
                      <Text style={styles.itemQuantity}>
                        {item.quantity} {item.measurement_unit === 1 ? t('units.kg') : t('units.piece') || 'pcs'}
                      </Text>
                    </View>
                  </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

// Dynamic styles function for OrderDetailsModal
const getOrderDetailsModalStyles = (colors) => StyleSheet.create({
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
    backgroundColor: colors.surface,
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
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.shadow,
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
    backgroundColor: colors.surfaceVariant,
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
    backgroundColor: colors.surfaceVariant,
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
    backgroundColor: colors.surfaceVariant,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
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