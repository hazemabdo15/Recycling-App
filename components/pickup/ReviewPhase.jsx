import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useContext, useState } from 'react';
import {
    FlatList,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { AuthContext } from '../../context/AuthContext';
import { useAllItems } from '../../hooks/useAPI';
import { borderRadius, spacing, typography } from '../../styles';
import { colors } from '../../styles/theme';
import { normalizeItemData } from '../../utils/cartUtils';
import { AnimatedButton } from '../common';

const ReviewPhase = ({ selectedAddress, cartItems, onConfirm, onBack, loading }) => {
  const { user } = useContext(AuthContext);
  const { items: allItems } = useAllItems();
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');

  const safeAllItems = Array.isArray(allItems) ? allItems : [];
  
  // Convert cart items to display format
  const reviewItems = Object.entries(cartItems).map(([categoryId, quantity]) => {
    const itemDetails = safeAllItems.find((item) => item.categoryId === categoryId || item._id === categoryId) || {};
    
    const combinedItem = {
      ...itemDetails,
      categoryId: categoryId,
      name: itemDetails.name || itemDetails.material || 'Unknown Item',
      image: itemDetails.image,
      points: typeof itemDetails.points === 'number' ? itemDetails.points : 0,
      price: typeof itemDetails.price === 'number' ? itemDetails.price : 0,
      measurement_unit: itemDetails.measurement_unit,
      quantity: quantity,
    };

    return normalizeItemData(combinedItem);
  }).filter(item => item.quantity > 0);

  // Calculate totals
  const totalPoints = reviewItems.reduce((sum, item) => {
    const points = typeof item.points === 'number' ? item.points : 0;
    return sum + points * (item.quantity || 1);
  }, 0);
  
  const totalValue = reviewItems.reduce((sum, item) => {
    const value = typeof item.value === 'number' ? item.value : (typeof item.price === 'number' ? item.price : 0);
    return sum + value * (item.quantity || 1);
  }, 0);

  const handleConfirmOrder = () => {
    const orderData = {
      items: reviewItems.map(item => ({
        categoryId: item.categoryId,
        image: item.image,
        itemName: item.name,
        measurement_unit: item.measurement_unit || 1,
        points: item.points || 0,
        price: item.price || item.value || 0,
        quantity: item.quantity,
      })),
      phoneNumber: phoneNumber,
    };

    onConfirm(orderData);
  };

  const renderOrderItem = ({ item }) => {
    const name = item.name || item.material || 'Unknown Item';
    let unit = item.unit || item.measurement_unit || '';
    if (unit === 1 || unit === '1') unit = 'KG';
    if (unit === 2 || unit === '2') unit = 'Piece';
    const points = typeof item.points === 'number' ? item.points : 0;
    const value = typeof item.value === 'number' ? item.value : (typeof item.price === 'number' ? item.price : 0);
    const quantity = typeof item.quantity === 'number' ? item.quantity : 1;

    return (
      <View style={styles.orderItem}>
        <View style={styles.itemImageContainer}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.itemImage} resizeMode="cover" />
          ) : (
            <View style={styles.itemImagePlaceholder}>
              <MaterialCommunityIcons name="image-off-outline" size={24} color={colors.base300} />
            </View>
          )}
        </View>
        
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{name}</Text>
          <View style={styles.itemDetails}>
            <Text style={styles.itemQuantity}>
              {quantity} {unit}
            </Text>
            {points > 0 && (
              <Text style={styles.itemPoints}>{points} pts each</Text>
            )}
            {value > 0 && (
              <Text style={styles.itemValue}>{(value * quantity).toFixed(2)} EGP</Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Address Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <View style={styles.addressCard}>
            <MaterialCommunityIcons name="map-marker" size={24} color={colors.primary} />
            <View style={styles.addressInfo}>
              <Text style={styles.addressText}>
                {selectedAddress.building && `Building ${selectedAddress.building}, `}
                {selectedAddress.street}
              </Text>
              <Text style={styles.addressSubtext}>
                {selectedAddress.area}, {selectedAddress.city}
              </Text>
              {selectedAddress.landmark && (
                <Text style={styles.addressLandmark}>Near {selectedAddress.landmark}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.contactCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.phoneInput}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="Enter your phone number"
                placeholderTextColor={colors.base300}
                keyboardType="phone-pad"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name</Text>
              <Text style={styles.userInfo}>{user?.name || user?.email || 'User'}</Text>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <Text style={styles.userInfo}>{user?.email || 'No email provided'}</Text>
            </View>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items ({reviewItems.length})</Text>
          <View style={styles.orderItemsContainer}>
            <FlatList
              data={reviewItems}
              renderItem={renderOrderItem}
              keyExtractor={(item) => item.categoryId}
              scrollEnabled={false}
            />
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Items</Text>
              <Text style={styles.summaryValue}>{reviewItems.length}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Eco Points</Text>
              <Text style={[styles.summaryValue, { color: colors.accent }]}>{totalPoints}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Earnings</Text>
              <Text style={[styles.summaryValue, { color: colors.secondary }]}>
                {totalValue.toFixed(2)} EGP
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        
        <AnimatedButton
          style={styles.confirmButton}
          onPress={handleConfirmOrder}
          disabled={loading || !phoneNumber.trim()}
        >
          <MaterialCommunityIcons name="truck-fast" size={20} color={colors.white} />
          <Text style={styles.confirmButtonText}>
            {loading ? 'Processing...' : 'Confirm Order'}
          </Text>
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
  content: {
    flex: 1,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.title,
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.base200,
  },
  
  // Address styles
  addressCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.white,
    padding: spacing.lg,
    gap: spacing.md,
  },
  addressInfo: {
    flex: 1,
  },
  addressText: {
    ...typography.subtitle,
    fontWeight: 'bold',
    color: colors.black,
    marginBottom: spacing.xs,
  },
  addressSubtext: {
    ...typography.body,
    color: colors.neutral,
    marginBottom: spacing.xs,
  },
  addressLandmark: {
    ...typography.caption,
    color: colors.primary,
    fontStyle: 'italic',
  },
  
  // Contact styles
  contactCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  phoneInput: {
    backgroundColor: colors.base100,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.black,
    borderWidth: 1,
    borderColor: colors.base200,
  },
  userInfo: {
    ...typography.body,
    color: colors.neutral,
    paddingVertical: spacing.sm,
  },
  
  // Order items styles
  orderItemsContainer: {
    backgroundColor: colors.white,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.base100,
  },
  itemImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: spacing.lg,
    backgroundColor: colors.base100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.base200,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    ...typography.subtitle,
    fontWeight: 'bold',
    color: colors.black,
    marginBottom: spacing.xs,
  },
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  itemQuantity: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    backgroundColor: colors.base100,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  itemPoints: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: '600',
  },
  itemValue: {
    ...typography.caption,
    color: colors.secondary,
    fontWeight: '600',
  },
  
  // Summary styles
  summaryCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.base100,
  },
  summaryLabel: {
    ...typography.body,
    color: colors.neutral,
    fontWeight: '500',
  },
  summaryValue: {
    ...typography.subtitle,
    fontWeight: 'bold',
    color: colors.black,
  },
  
  // Footer styles
  footer: {
    flexDirection: 'row',
    padding: spacing.xl,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.base200,
    gap: spacing.md,
  },
  backButton: {
    flex: 1,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.base100,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.base200,
  },
  backButtonText: {
    ...typography.subtitle,
    color: colors.neutral,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    gap: spacing.sm,
  },
  confirmButtonText: {
    ...typography.subtitle,
    color: colors.white,
    fontWeight: '700',
  },
});

export default ReviewPhase;
