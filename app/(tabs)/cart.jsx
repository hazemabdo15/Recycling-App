import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedButton, AnimatedListItem } from '../../components/common';
import { useAllItems } from '../../hooks/useAPI';
import { useCart } from '../../hooks/useCart';
import { borderRadius, spacing, typography } from '../../styles';
import { colors } from '../../styles/theme';
import { normalizeItemData } from '../../utils/cartUtils';

const Cart = () => {
  const insets = useSafeAreaInsets();
  const { cartItems, handleIncreaseQuantity, handleDecreaseQuantity, handleRemoveFromCart, handleClearCart, fetchBackendCart, removingItems } = useCart();
  const { items: allItems, loading: itemsLoading } = useAllItems();
  const [backendCartItems, setBackendCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEmptyState, setShowEmptyState] = useState(false);

  useEffect(() => {

    if (!itemsLoading) {
      setLoading(false);
    }
  }, [itemsLoading]);

  const fetchCartFromBackend = useCallback(async () => {
    console.log('Calling fetchBackendCart...');
    try {
      const response = await fetchBackendCart();
      console.log('Backend cart response:', response);
      setBackendCartItems(Array.isArray(response.items) ? response.items : []);
    } catch (err) {
      console.error('Error in fetchBackendCart:', err);
      setBackendCartItems([]);
    }
  }, [fetchBackendCart]);

  useEffect(() => {
    fetchCartFromBackend();
  }, [fetchCartFromBackend]);

  const safeAllItems = Array.isArray(allItems) ? allItems : [];
  const cartArray = Object.entries(cartItems).map(([categoryId, quantity]) => {
    const itemDetails = safeAllItems.find((item) => item.categoryId === categoryId || item._id === categoryId) || {};

    const backendItem = backendCartItems.find((item) => item.categoryId === categoryId) || {};
    
    const combinedItem = {
      ...itemDetails,
      ...backendItem,
      categoryId: categoryId,
      name: backendItem.itemName || itemDetails.name || itemDetails.material || 'Unknown Item',
      image: backendItem.image || itemDetails.image,
      points: typeof backendItem.points === 'number' ? backendItem.points : itemDetails.points,
      price: typeof backendItem.price === 'number' ? backendItem.price : itemDetails.price,
      measurement_unit: backendItem.measurement_unit || itemDetails.measurement_unit,
      quantity: quantity,
    };

    return normalizeItemData(combinedItem);
  }).filter(item => item.quantity > 0);

  useEffect(() => {
    if (cartArray.length === 0) {

      const hasRemovingItems = removingItems && removingItems.size > 0;
      if (hasRemovingItems) {
        setShowEmptyState(false);
      } else {

        const timer = setTimeout(() => {
          setShowEmptyState(true);
        }, 150);
        
        return () => clearTimeout(timer);
      }
    } else {
      setShowEmptyState(false);
    }
  }, [cartArray.length, removingItems]);

  const handleIncrease = async (item) => {
    try {

      await handleIncreaseQuantity({ ...item, categoryId: item.categoryId });
    } catch (err) {
      console.error('[Cart] Error increasing quantity:', err);

    }
  };
  
  const handleDecrease = async (item) => {
    try {

      await handleDecreaseQuantity({ ...item, categoryId: item.categoryId });
    } catch (err) {
      console.error('[Cart] Error decreasing quantity:', err);

    }
  };
  
  const handleDelete = async (item) => {
    try {

      await handleRemoveFromCart(item.categoryId);
    } catch (err) {
      console.error('[Cart] Error removing item:', err);

    }
  };

  const handleClearAll = async () => {
    try {
      await handleClearCart();
    } catch (err) {
      console.error('[Cart] Error clearing cart:', err);
    }
  };

  const renderCartItem = ({ item, index }) => {
    const name = item.name || item.material || 'Unknown Item';
    let unit = item.unit || item.measurement_unit || '';
    if (unit === 1 || unit === '1') unit = 'KG';
    if (unit === 2 || unit === '2') unit = 'Piece';
    const points = typeof item.points === 'number' ? item.points : null;
    const value = typeof item.value === 'number' ? item.value : (typeof item.price === 'number' ? item.price : null);
    const quantity = typeof item.quantity === 'number' ? item.quantity : 1;

    const totalValue = value !== null ? value * quantity : null;

    return (
      <AnimatedListItem index={index} style={[styles.cartCard, { borderLeftWidth: 5, borderLeftColor: colors.primary, marginBottom: spacing.md, marginTop: spacing.sm, shadowOpacity: 0.18 }]}> 
        <View style={styles.cartImageContainer}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.cartImage} resizeMode="cover" />
          ) : (
            <View style={styles.cartImagePlaceholder}>
              <MaterialCommunityIcons name="image-off-outline" size={32} color={colors.base300} />
            </View>
          )}
        </View>
        <View style={styles.cartInfoContainer}>
          <Text style={styles.cartName}>{name}</Text>
          <View style={styles.itemDetailsRow}>
            <Text style={[styles.cartUnit, { color: colors.primary, fontWeight: 'bold', marginRight: 8 }]}> 
              {quantity} {unit ? unit : ''}
            </Text>
          </View>
          <View style={styles.itemDetailsRow}>
            {points !== null ? (
              <Text style={[styles.cartUnit, { color: colors.accent, fontWeight: 'bold', marginRight: 8 }]}>{points} pts each</Text>
            ) : null}
            {totalValue !== null ? (
              <Text style={[styles.cartUnit, { color: colors.secondary, fontWeight: 'bold' }]}>{totalValue.toFixed(2)} EGP</Text>
            ) : null}
          </View>
          <View style={styles.cartQuantityRow}>
            <TouchableOpacity
              style={[styles.cartQtyBtn, quantity <= 1 && { opacity: 0.5 }]}
              onPress={() => handleDecrease(item)}
              disabled={quantity <= 1}
            >
              <MaterialCommunityIcons name="minus" size={20} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.cartQtyText}>{quantity}</Text>
            <TouchableOpacity style={styles.cartQtyBtn} onPress={() => handleIncrease(item)}>
              <MaterialCommunityIcons name="plus" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.cartActionsContainer}>
          <TouchableOpacity style={styles.cartDeleteBtn} onPress={() => handleDelete(item)}>
            <MaterialCommunityIcons name="delete-outline" size={24} color={colors.error} />
          </TouchableOpacity>
        </View>
      </AnimatedListItem>
    );
  };

  if (loading) {
    return (
      <View style={styles.emptyCartContainer}>
        <Text style={styles.emptyCartTitle}>Loading cart...</Text>
      </View>
    );
  }

  if (!allItems.length) {
    return (
      <View style={styles.emptyCartContainer}>
        <Text style={styles.emptyCartTitle}>Unable to load item details</Text>
        <Text style={styles.emptyCartSubtitle}>There was a problem fetching item data. Please try again later.</Text>
      </View>
    );
  }

  if (cartArray.length === 0 && showEmptyState) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroSection, { paddingTop: insets.top + 20 }]}
        >
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>🛒 Your Pickup Cart</Text>
            <Text style={styles.heroSubtitle}>
              No pickup items yet
            </Text>
          </View>
        </LinearGradient>
        <View style={styles.emptyCartContainer}>
          <View style={styles.emptyCartIconWrapper}>
            <MaterialCommunityIcons name="truck-delivery-outline" size={80} color={colors.base300} />
          </View>
          <Text style={styles.emptyCartTitle}>Add recyclable items to get started</Text>
          <Text style={styles.emptyCartSubtitle}>Schedule your pickup and earn rewards!</Text>
          <AnimatedButton style={styles.emptyCartBrowseBtn} onPress={() => router.push('/(tabs)/explore')}>
            <MaterialCommunityIcons name="recycle" size={22} color={colors.primary} />
            <Text style={styles.emptyCartBrowseText}>Find Recyclables</Text>
          </AnimatedButton>
        </View>
      </View>
    );
  }

  if (cartArray.length === 0 && !showEmptyState) {
    return (
      <View style={styles.emptyCartContainer}>
        <Text style={styles.emptyCartTitle}>Updating cart...</Text>
      </View>
    );
  }

  const totalPoints = cartArray.reduce((sum, item) => {
    const points = typeof item.points === 'number' ? item.points : 0;
    return sum + points * (item.quantity || 1);
  }, 0);
  
  const totalValue = cartArray.reduce((sum, item) => {
    const value = typeof item.value === 'number' ? item.value : (typeof item.price === 'number' ? item.price : 0);
    return sum + value * (item.quantity || 1);
  }, 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.heroSection, { paddingTop: insets.top + 20 }]}
      >
        <View style={styles.heroRowHeader}>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>🛒 Your Pickup Cart</Text>
            <Text style={styles.heroSubtitle}>
              {cartArray.length} items ready for pickup
            </Text>
            <View style={styles.checkoutSummaryRowHero}>
              <View style={styles.checkoutSummaryItemHero}>
                <MaterialCommunityIcons name="star" size={22} color={colors.accent} />
                <Text style={styles.checkoutSummaryLabelHero}>Eco Points</Text>
                <Text style={styles.checkoutSummaryValueHero}>{totalPoints}</Text>
              </View>
              <View style={styles.checkoutSummaryItemHero}>
                <MaterialCommunityIcons name="cash" size={22} color={colors.secondary} />
                <Text style={styles.checkoutSummaryLabelHero}>You'll Earn</Text>
                <Text style={styles.checkoutSummaryValueHero}>{totalValue.toFixed(2)} EGP</Text>
              </View>
            </View>
            <View style={styles.heroActionRow}>
              <AnimatedButton style={styles.checkoutBtnBarHero} onPress={() => router.push('/checkout')}>
                <MaterialCommunityIcons name="truck-fast" size={24} color={colors.white} />
                <Text style={styles.checkoutBtnBarTextHero}>Schedule Pickup</Text>
              </AnimatedButton>
              {cartArray.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButtonHero}
                  onPress={handleClearAll}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name="delete-sweep"
                    size={22}
                    color={colors.white}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </LinearGradient>
      <View style={[styles.contentContainer, { backgroundColor: colors.base100 }]}> 
        <FlatList
          data={cartArray}
          renderItem={renderCartItem}
          keyExtractor={(item) => item.categoryId || item._id || String(Math.random())}
          contentContainerStyle={[styles.listContainerModern, { paddingBottom: spacing.xxl * 2 + 64 }]}
          showsVerticalScrollIndicator={false}
          extraData={cartItems}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  heroSection: {
    minHeight: 170,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    paddingTop: spacing.xl,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    justifyContent: 'flex-end',
  },
  heroRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  heroContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingBottom: spacing.sm,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 14,
    color: colors.white,
    textAlign: 'center',
    opacity: 0.85,
    lineHeight: 22,
  },
  clearButton: {
    position: 'relative',
    padding: spacing.sm,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  contentContainer: {
    flex: 1,
    paddingTop: spacing.md,
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.base100,
  },
  emptyCartIconWrapper: {
    marginBottom: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 100,
  },
  emptyCartTitle: {
    ...typography.title,
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyCartSubtitle: {
    ...typography.subtitle,
    color: colors.neutral,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  emptyCartBrowseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.base200,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.lg,
  },
  emptyCartBrowseText: {
    ...typography.subtitle,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 16,
    marginLeft: spacing.sm,
  },
  cartCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: 18,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
    minHeight: 100,
  },
  cartImageContainer: {
    width: 64,
    height: 64,
    borderRadius: 14,
    overflow: 'hidden',
    marginRight: spacing.lg,
    backgroundColor: colors.base100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  cartImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: colors.base200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartInfoContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  cartName: {
    ...typography.subtitle,
    fontSize: 17,
    fontWeight: '700',
    color: colors.black,
    marginBottom: 2,
  },
  cartUnit: {
    ...typography.caption,
    color: colors.neutral,
    textTransform: 'uppercase',
    fontWeight: '600',
    fontSize: 13,
    marginBottom: 6,
  },
  cartQuantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  cartQtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.base100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.base200,
  },
  cartQtyText: {
    ...typography.title,
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    minWidth: 36,
    textAlign: 'center',
  },
  cartActionsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.lg,
    gap: 8,
  },
  cartDeleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.base100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: colors.base200,
  },
  itemDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  filledContainer: {
    flex: 1,
    backgroundColor: colors.base100,
    paddingBottom: spacing.xxl + 16,
  },
  headerMerged: {
    paddingHorizontal: spacing.xl,
    paddingTop: 0,
    paddingBottom: spacing.md,
    backgroundColor: colors.base100,
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: colors.base200,
  },
  headerRowMerged: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    width: '100%',
  },
  headerLeftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  clearCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.base100,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.base200,
  },
  clearCartText: {
    ...typography.caption,
    color: colors.error,
    fontWeight: '600',
    fontSize: 12,
    marginLeft: 4,
  },
  headerTitleMerged: {
    ...typography.title,
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 2,
  },
  headerSubtitleMerged: {
    ...typography.subtitle,
    color: colors.neutral,
    fontSize: 16,
    marginBottom: 2,
  },
  listContainerModern: {
    paddingVertical: spacing.md,
    paddingBottom: spacing.xxl,
  },
  // ...existing code...
  checkoutSummaryRowHero: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    gap: 12,
  },
  checkoutSummaryItemHero: {
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: spacing.md,
  },
  checkoutSummaryLabelHero: {
    ...typography.caption,
    color: colors.white,
    marginTop: 2,
    marginBottom: 2,
    fontSize: 13,
  },
  checkoutSummaryValueHero: {
    ...typography.title,
    fontSize: 18,
    color: colors.white,
    fontWeight: '700',
    marginTop: 2,
  },
  heroActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
    marginTop: spacing.sm,
    gap: 5,
  },
  checkoutBtnBarHero: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    shadowColor: colors.primary,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    justifyContent: 'center',
    flex: 1,
    minWidth: 0,
  },
  checkoutBtnBarTextHero: {
    ...typography.subtitle,
    color: colors.white,
    fontWeight: '700',
    fontSize: 18,
    marginLeft: spacing.sm,
  },
  clearButtonHero: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
    height: 55,
    minWidth: 40,
  },
});

export default Cart;
