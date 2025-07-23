import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useContext, useEffect, useMemo, useState } from 'react';
import {
    Alert,
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

const ReviewPhase = ({ selectedAddress, cartItems, onConfirm, onBack, loading, user: userProp, pickupWorkflow, ...otherProps }) => {
  // ALL HOOKS MUST BE CALLED FIRST (React rule)
  const authContext = useContext(AuthContext);
  const { items: allItems, loading: itemsLoading } = useAllItems();
  const [phoneNumber, setPhoneNumber] = useState('');

  // DEBUG: Add comprehensive error checking
  console.log('[ReviewPhase] Component start - props received:', {
    selectedAddress: !!selectedAddress,
    cartItems: !!cartItems,
    onConfirm: typeof onConfirm,
    onBack: typeof onBack,
    loading: typeof loading,
    userProp: !!userProp,
    pickupWorkflow: !!pickupWorkflow
  });

  // Safe user extraction using useMemo
  const user = useMemo(() => {
    try {
      if (authContext && typeof authContext === 'object') {
        return authContext.user || null;
      }
      return null;
    } catch (error) {
      console.warn('[ReviewPhase] AuthContext access failed:', error.message);
      return null;
    }
  }, [authContext]);

  // Update phone number when user data becomes available
  useEffect(() => {
    const phoneValue = user?.phoneNumber || user?.phone || user?.mobile || user?.number || '';
    if (phoneValue) {
      setPhoneNumber(phoneValue);
    }
    console.log('[ReviewPhase] Phone number updated:', phoneValue || 'none');
  }, [user, authContext]);

  // Safe items array
  const safeAllItems = useMemo(() => allItems || [], [allItems]);

  // Convert cart items to display format with safety checks
  const reviewItems = useMemo(() => {
    try {
      if (!cartItems || !Array.isArray(safeAllItems)) {
        console.warn('[ReviewPhase] Invalid data for processing items');
        return [];
      }

      const items = Object.entries(cartItems).map(([categoryId, quantity]) => {
        try {
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

          const normalizedItem = normalizeItemData(combinedItem);
          return normalizedItem;
        } catch (error) {
          console.error(`[ReviewPhase] Error processing item ${categoryId}:`, error);
          return null;
        }
      }).filter(item => item && item.quantity > 0);

      return items;
    } catch (error) {
      console.error('[ReviewPhase] Error processing review items:', error);
      return [];
    }
  }, [cartItems, safeAllItems]);

  // Early safety check for props AFTER hooks
  if (!selectedAddress || !cartItems) {
    console.log('[ReviewPhase] Missing required props, rendering fallback');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: colors.error, textAlign: 'center' }}>
          Loading review data...
        </Text>
      </View>
    );
  }

  // Additional safety check for essential functions
  if (typeof onConfirm !== 'function' || typeof onBack !== 'function') {
    console.error('[ReviewPhase] Missing required callback functions');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: colors.error, textAlign: 'center' }}>
          Component configuration error
        </Text>
      </View>
    );
  }

  // Calculate totals
  const totalPoints = reviewItems.reduce((sum, item) => {
    const points = typeof item.points === 'number' ? item.points : 0;
    return sum + points * (item.quantity || 1);
  }, 0);

  const totalValue = reviewItems.reduce((sum, item) => {
    const value = typeof item.value === 'number' ? item.value : (typeof item.price === 'number' ? item.price : 0);
    return sum + value * (item.quantity || 1);
  }, 0);

  const handleConfirmOrder = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    const orderData = {
      selectedAddress,
      items: reviewItems,
      phoneNumber: phoneNumber.trim(),
      totalPoints,
      totalValue,
      user
    };

    console.log('[ReviewPhase] Creating order with data:', orderData);
    onConfirm(orderData);
  };

  const renderOrderItem = ({ item }) => {
    const name = item?.name || item?.material || 'Unknown Item';
    let unit = item?.unit || item?.measurement_unit || '';
    if (unit === 1 || unit === '1') unit = 'KG';
    if (unit === 2 || unit === '2') unit = 'Piece';
    const points = typeof item?.points === 'number' ? item.points : 0;
    const value = typeof item?.value === 'number' ? item.value : (typeof item?.price === 'number' ? item.price : 0);
    const quantity = typeof item?.quantity === 'number' ? item.quantity : 1;

    return (
      <View style={styles.orderItem}>
        <View style={styles.itemImageContainer}>
          {item?.image ? (
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
              <Text style={styles.itemPoints}>+{points * quantity} pts</Text>
            )}
          </View>
          {value > 0 && (
            <Text style={styles.itemValue}>{(value * quantity).toFixed(2)} EGP</Text>
          )}
        </View>
      </View>
    );
  };

  console.log('[ReviewPhase] Rendering component successfully');

  // TEST: Return a simple test component first to isolate the $$typeof error
  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: '#f5f5f5' }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 20 }}>
        Review Phase - Test Version
      </Text>
      <Text style={{ marginBottom: 10 }}>
        Address: {selectedAddress?.street || 'No address'}
      </Text>
      <Text style={{ marginBottom: 10 }}>
        Cart Items: {Object.keys(cartItems || {}).length}
      </Text>
      <Text style={{ marginBottom: 20 }}>
        User: {user?.name || 'No user'}
      </Text>
      
      <TouchableOpacity 
        style={{ 
          backgroundColor: '#007AFF', 
          padding: 15, 
          borderRadius: 8, 
          alignItems: 'center',
          marginBottom: 10
        }}
        onPress={() => {
          console.log('[ReviewPhase] Test confirm pressed');
          onConfirm?.({ test: true });
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>
          Test Confirm
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={{ 
          backgroundColor: '#FF3B30', 
          padding: 15, 
          borderRadius: 8, 
          alignItems: 'center' 
        }}
        onPress={() => {
          console.log('[ReviewPhase] Test back pressed');
          onBack?.();
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>
          Test Back
        </Text>
      </TouchableOpacity>
    </View>
  );

  /* ORIGINAL COMPONENT - TEMPORARILY COMMENTED OUT
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.confirmButton, (loading || !phoneNumber.trim()) && { opacity: 0.5 }]}
          onPress={handleConfirmOrder}
          disabled={loading || !phoneNumber.trim()}
        >
          <MaterialCommunityIcons name="truck-fast" size={20} color={colors.white} />
          <Text style={styles.confirmButtonText}>
            {loading ? 'Processing...' : 'Confirm Order'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.base100,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  section: {
    marginVertical: spacing.md,
  },
  sectionTitle: {
    ...typography.headline,
    color: colors.text,
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  addressCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  addressInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  addressText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
  addressSubtext: {
    ...typography.caption,
    color: colors.base600,
    marginTop: spacing.xs,
  },
  addressLandmark: {
    ...typography.caption,
    color: colors.base500,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  userInfoCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  userField: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    ...typography.caption,
    color: colors.base600,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  fieldValue: {
    ...typography.body,
    color: colors.text,
  },
  phoneInput: {
    ...typography.body,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.base300,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
  },
  orderItem: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  itemImageContainer: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.base100,
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
    marginLeft: spacing.md,
  },
  itemName: {
    ...typography.subtitle,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  itemQuantity: {
    ...typography.caption,
    color: colors.base600,
    marginRight: spacing.md,
  },
  itemPoints: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '600',
  },
  itemValue: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  itemSeparator: {
    height: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.base500,
    textAlign: 'center',
    padding: spacing.xl,
  },
  summaryCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.base200,
  },
  summaryLabel: {
    ...typography.body,
    color: colors.base600,
  },
  summaryValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
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
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  backButtonText: {
    ...typography.subtitle,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
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
