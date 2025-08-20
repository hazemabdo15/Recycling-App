import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import UserAvatar from '../../components/common/UserAvatar';
import { useThemedStyles } from '../../hooks/useThemedStyles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scale = (size) => (SCREEN_WIDTH / 375) * size;

// Dynamic styles function for OrderCard
const getOrderCardStyles = (colors) => StyleSheet.create({
  cardContainer: {
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.itemCardBg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerDetails: {
    marginLeft: 12,
  },
  customerName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: colors.text,
  },
  customerPhone: {
    color: colors.textSecondary,
    marginTop: 2,
  },
  addressSection: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  addressMain: {
    color: colors.text,
    marginBottom: 4,
  },
  addressSecondary: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  metaSection: {
    marginTop: 8,
  },
  orderDate: {
    color: colors.text,
    marginBottom: 6,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusPending: {
    backgroundColor: colors.warning + '20',
  },
  statusCompleted: {
    backgroundColor: colors.success + '20',
  },
  statusText: {
    color: colors.text,
    fontSize: 12,
  },
  completeButton: {
    backgroundColor: colors.primary,
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  completeButtonText: {
    color: colors.white,
    fontWeight: 'bold',
  },
});

const OrderCard = ({ item, setSelectedOrder, setShowProofModal }) => {
  const { colors } = useThemedStyles();
  const styles = getOrderCardStyles(colors);
  const customer = item.user;
  const address = item.address;
  const createdAt = new Date(item.createdAt).toLocaleString();

  return (
    <View style={[styles.cardContainer, {
      marginBottom: scale(16),
      padding: scale(16),
      borderRadius: scale(12),
    }]}
    >
      <View style={[styles.customerInfo, { marginBottom: scale(12) }]}
      >
        <UserAvatar
          user={{
            name: customer.userName,
            profileImage: customer.image
          }}
          size={scale(50)}
        />
        <View style={[styles.customerDetails, { marginLeft: scale(12) }]}
        >
          <Text style={[styles.customerName, { fontSize: scale(16) }]}>{customer.userName}</Text>
          <Text style={styles.customerPhone}>{customer.phoneNumber}</Text>
        </View>
      </View>

      <View style={[styles.addressSection, { marginBottom: scale(12), paddingBottom: scale(12), borderBottomWidth: scale(1) }]}
      >
        <Text style={styles.addressMain}>
          📍 {address.street}, Bldg {address.building}, Apt {address.apartment}, Floor {address.floor}
        </Text>
        <Text style={[styles.addressSecondary, { fontSize: scale(12) }]}
        >
          Area: {address.area}, City: {address.city} (Landmark: {address.landmark})
        </Text>
      </View>

      <View style={styles.metaSection}>
        <Text style={styles.orderDate}>🕒 Ordered at: {createdAt}</Text>
        <View style={[
          styles.statusBadge,
          item.status === 'assigntocourier' ? styles.statusPending : styles.statusCompleted,
          { paddingHorizontal: scale(8), paddingVertical: scale(4), borderRadius: scale(4) },
        ]}>
          <Text style={[styles.statusText, { fontSize: scale(12) }]}>Status: {item.status}</Text>
        </View>
      </View>

      {item.status === 'assigntocourier' && (
        <TouchableOpacity
          style={[styles.completeButton, { marginTop: scale(16), paddingVertical: scale(12), borderRadius: scale(8) }]}
          onPress={() => {
            setSelectedOrder(item);
            setShowProofModal(true);
          }}
        >
          <Text style={styles.completeButtonText}>Complete Delivery</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default OrderCard;