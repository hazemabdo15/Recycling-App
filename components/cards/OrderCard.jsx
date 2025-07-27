import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import UserAvatar from '../../components/common/UserAvatar'; // Adjust the import path as needed
import { colors, shadows } from '../../styles/theme'; // Import your colors

const OrderCard = ({ item, setSelectedOrder, setShowProofModal }) => {
  const customer = item.user;
  const address = item.address;
  const createdAt = new Date(item.createdAt).toLocaleString();

  return (
    <View style={styles.cardContainer}>
      {/* Customer Info with UserAvatar */}
      <View style={styles.customerInfo}>
        <UserAvatar 
          user={{ 
            name: customer.userName, 
            profileImage: customer.image 
          }} 
          size={50} 
        />
        <View style={styles.customerDetails}>
          <Text style={styles.customerName}>{customer.userName}</Text>
          <Text style={styles.customerPhone}>{customer.phoneNumber}</Text>
        </View>
      </View>

      {/* Address */}
      <View style={styles.addressSection}>
        <Text style={styles.addressMain}>
          📍 {address.street}, Bldg {address.building}, Apt {address.apartment}, Floor {address.floor}
        </Text>
        <Text style={styles.addressSecondary}>
          Area: {address.area}, City: {address.city} (Landmark: {address.landmark})
        </Text>
      </View>

      {/* Date and Status */}
      <View style={styles.metaSection}>
        <Text style={styles.orderDate}>🕒 Ordered at: {createdAt}</Text>
        <View style={[styles.statusBadge, 
          item.status === 'assigntocourier' ? styles.statusPending : styles.statusCompleted]}>
          <Text style={styles.statusText}>Status: {item.status}</Text>
        </View>
      </View>

      {/* Complete Delivery Button */}
      {item.status === 'assigntocourier' && (
        <TouchableOpacity
          style={styles.completeButton}
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

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.base300,
    borderRadius: 12,
    backgroundColor: colors.white,
    ...shadows.small,
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
    borderBottomColor: colors.base200,
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
    backgroundColor: colors.warning + '20', // Add transparency
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

export default OrderCard;