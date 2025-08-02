import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AnimatedButton,
  AnimatedListItem,
  Loader,
} from "../../components/common";
import { useAuth } from "../../context/AuthContext";
import { useAllItems } from "../../hooks/useAPI";
import { useCart } from "../../hooks/useCart";
import { borderRadius, spacing, typography } from "../../styles";
import { colors } from "../../styles/theme";
import {
  getCartKey,
  getDisplayKey,
  normalizeItemData,
} from "../../utils/cartUtils";
import { getLabel, isBuyer } from "../../utils/roleLabels";
import { scaleSize } from "../../utils/scale";

const getRoleBasedIcon = (iconType, userRole = "customer") => {
  const iconMappings = {
    scheduleAction: {
      customer: "truck-fast",
      buyer: "credit-card-fast",
    },

    emptyCart: {
      customer: "truck-delivery-outline",
      buyer: "cart-outline",
    },

    findItems: {
      customer: "recycle",
      buyer: "store",
    },

    locked: {
      customer: "lock",
      buyer: "lock",
    },
  };

  return (
    iconMappings[iconType]?.[userRole] ||
    iconMappings[iconType]?.customer ||
    "help-circle"
  );
};

const Cart = () => {
  const insets = useSafeAreaInsets();
  const { user, isLoggedIn } = useAuth();
  const {
    cartItems,
    cartItemDetails,
    handleIncreaseQuantity,
    handleDecreaseQuantity,
    handleRemoveFromCart,
    handleClearCart,
    removingItems,
  } = useCart();
  const { items: allItems, loading: itemsLoading } = useAllItems();
  const [loading, setLoading] = useState(true);
  const [showEmptyState, setShowEmptyState] = useState(false);

  useEffect(() => {
    if (!itemsLoading) {
      setLoading(false);
    }
  }, [itemsLoading]);

  const safeAllItems = Array.isArray(allItems) ? allItems : [];

  const cartArray = Object.entries(cartItems)
    .map(([itemId, quantity]) => {
      const itemFromDetails = cartItemDetails[itemId];

      if (itemFromDetails) {
        return {
          ...itemFromDetails,
          quantity: quantity,
        };
      }

      const item = safeAllItems.find(
        (item) => item._id === itemId || item.categoryId === itemId
      );

      const combinedItem = {
        ...(item || {}),
        _id: item?._id || itemId,
        categoryId: item?.categoryId,
        name: item?.name || item?.material || "Unknown Item",
        image: item?.image,
        points: item?.points,
        price: item?.price,
        measurement_unit: item?.measurement_unit,
        quantity: quantity,
      };

      const needsNormalization =
        !combinedItem._id ||
        !combinedItem.categoryId ||
        !combinedItem.image ||
        combinedItem.measurement_unit === undefined;
      return needsNormalization
        ? normalizeItemData(combinedItem)
        : combinedItem;
    })
    .filter((item) => item.quantity > 0);

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
      const itemWithCorrectId = {
        ...item,
        _id: getCartKey(item),
      };
      await handleIncreaseQuantity(itemWithCorrectId);
    } catch (err) {
      console.error("[Cart] Error increasing quantity:", err);
    }
  };

  const handleDecrease = async (item) => {
    try {
      const itemWithCorrectId = {
        ...item,
        _id: getCartKey(item),
      };
      await handleDecreaseQuantity(itemWithCorrectId);
    } catch (err) {
      console.error("[Cart] Error decreasing quantity:", err);
    }
  };

  const handleDelete = async (item) => {
    try {
      const itemId = getCartKey(item);
      await handleRemoveFromCart(itemId);
    } catch (err) {
      console.error("[Cart] Error removing item:", err);
    }
  };

  const handleClearAll = async () => {
    try {
      await handleClearCart();
    } catch (err) {
      console.error("[Cart] Error clearing cart:", err);
    }
  };

  const renderCartItem = ({ item, index }) => {
    const name = item.name || item.material || "Unknown Item";
    let unit = item.unit || item.measurement_unit || "";
    if (unit === 1 || unit === "1") unit = "KG";
    if (unit === 2 || unit === "2") unit = "Piece";
    const points = typeof item.points === "number" ? item.points : null;
    const value =
      typeof item.value === "number"
        ? item.value
        : typeof item.price === "number"
        ? item.price
        : null;
    const quantity = typeof item.quantity === "number" ? item.quantity : 1;

    const totalValue = value !== null ? value * quantity : null;

    return (
      <AnimatedListItem
        index={index}
        style={[
          styles.cartCard,
          {
            borderLeftWidth: 5,
            borderLeftColor: colors.primary,
            marginBottom: spacing.md,
            marginTop: spacing.sm,
            shadowOpacity: 0.18,
          },
        ]}
      >
        <View style={styles.cartImageContainer}>
          {item.image ? (
            <Image
              source={{ uri: item.image }}
              style={styles.cartImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.cartImagePlaceholder}>
              <MaterialCommunityIcons
                name="image-off-outline"
                size={32}
                color={colors.base300}
              />
            </View>
          )}
        </View>
        <View style={styles.cartInfoContainer}>
          <Text style={styles.cartName}>{name}</Text>
          <View style={styles.itemDetailsRow}>
            <Text
              style={[
                styles.cartUnit,
                { color: colors.primary, fontWeight: "bold", marginRight: 8 },
              ]}
            >
              {quantity} {unit ? unit : ""}
            </Text>
          </View>
          <View style={styles.itemDetailsRow}>
            {!isBuyer(user) && points !== null ? (
              <Text
                style={[
                  styles.cartUnit,
                  { color: colors.accent, fontWeight: "bold", marginRight: 8 },
                ]}
              >
                {points} pts each
              </Text>
            ) : null}
            {totalValue !== null ? (
              <Text
                style={[
                  styles.cartUnit,
                  { color: colors.secondary, fontWeight: "bold" },
                ]}
              >
                {totalValue.toFixed(2)} EGP
              </Text>
            ) : null}
          </View>
          <View style={styles.cartQuantityRow}>
            {/* Get the proper minimum quantity based on measurement unit */}
            {(() => {
              const measurementUnit =
                item.measurement_unit || (unit === "KG" ? 1 : 2);
              const minQuantity = measurementUnit === 1 ? 0.25 : 1;
              const isAtMinimum = quantity <= minQuantity;

              return (
                <>
                  <TouchableOpacity
                    style={[styles.cartQtyBtn, isAtMinimum && { opacity: 0.5 }]}
                    onPress={() => handleDecrease(item)}
                    disabled={isAtMinimum}
                  >
                    <MaterialCommunityIcons
                      name="minus"
                      size={20}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                  <Text style={styles.cartQtyText}>{quantity}</Text>
                  <TouchableOpacity
                    style={styles.cartQtyBtn}
                    onPress={() => handleIncrease(item)}
                  >
                    <MaterialCommunityIcons
                      name="plus"
                      size={20}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                </>
              );
            })()}
          </View>
        </View>
        <View style={styles.cartActionsContainer}>
          <TouchableOpacity
            style={styles.cartDeleteBtn}
            onPress={() => handleDelete(item)}
          >
            <MaterialCommunityIcons
              name="delete-outline"
              size={24}
              color={colors.error}
            />
          </TouchableOpacity>
        </View>
      </AnimatedListItem>
    );
  };

  if (loading) {
    return <Loader />;
  }

  if (!allItems.length) {
    return (
      <View style={styles.emptyCartContainer}>
        <Loader style={{ height: 180 }} />
        <Text style={styles.emptyCartTitle}>Unable to load item details</Text>
        <Text style={styles.emptyCartSubtitle}>
          There was a problem fetching item data. Please try again later.
        </Text>
      </View>
    );
  }

  if (cartArray.length === 0 && showEmptyState) {
    return (
      <View style={styles.container}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />
        <LinearGradient
          colors={[colors.primary, colors.neutral]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroSection, { paddingTop: insets.top + 20 }]}
        >
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>
              {getLabel("cartTitle", user?.role)}
            </Text>
            <Text style={styles.heroSubtitle}>No items yet</Text>
            <AnimatedButton
              style={styles.heroFindBtn}
              onPress={() => router.push("/(tabs)/explore")}
            >
              <MaterialCommunityIcons
                name={getRoleBasedIcon("findItems", user?.role)}
                size={28}
                color={colors.white}
              />
              <Text style={styles.heroFindBtnText}>
                {getLabel("cartPage.findItemsButton", user?.role)}
              </Text>
            </AnimatedButton>
          </View>
        </LinearGradient>
        <View style={styles.emptyCartContainer}>
          <View style={styles.emptyCartIconWrapper}>
            <MaterialCommunityIcons
              name={getRoleBasedIcon("emptyCart", user?.role)}
              size={80}
              color={colors.base300}
            />
          </View>
          <Text style={styles.emptyCartTitle}>
            {getLabel("emptyCartTitle", user?.role)}
          </Text>
          <Text style={styles.emptyCartSubtitle}>
            {getLabel("emptyCartSubtitle", user?.role)}
          </Text>
        </View>
      </View>
    );
  }

  if (cartArray.length === 0 && !showEmptyState) {
    return (
      <View style={styles.emptyCartContainer}>
        <Loader />
      </View>
    );
  }

  const totalPoints = cartArray.reduce((sum, item) => {
    const points = typeof item.points === "number" ? item.points : 0;
    return sum + points * (item.quantity || 1);
  }, 0);

  const totalValue = cartArray.reduce((sum, item) => {
    const value =
      typeof item.value === "number"
        ? item.value
        : typeof item.price === "number"
        ? item.price
        : 0;
    return sum + value * (item.quantity || 1);
  }, 0);

  const MINIMUM_ORDER_VALUE = 100;

  const isGuest = !isLoggedIn || !user;
  const canSchedulePickup =
    totalValue >= MINIMUM_ORDER_VALUE && user?.role === "customer";
  const canProceedToPurchase =
    totalValue >= MINIMUM_ORDER_VALUE && user?.role === "buyer";
  const canGuestProceed = totalValue >= MINIMUM_ORDER_VALUE && isGuest;
  const canProceed =
    canSchedulePickup || canProceedToPurchase || canGuestProceed;

  const remainingAmount = MINIMUM_ORDER_VALUE - totalValue;

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <LinearGradient
        colors={[colors.primary, colors.neutral]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.heroSection, { paddingTop: insets.top + 20 }]}
      >
        <View style={styles.heroRowHeader}>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>
              {getLabel("cartTitle", user?.role)}
            </Text>
            <Text style={styles.heroSubtitle}>
              {cartArray.length} {getLabel("itemsReadyFor", user?.role)}
            </Text>
            <View style={styles.checkoutSummaryRowHero}>
              {!isBuyer(user) && (
                <View style={styles.checkoutSummaryItemHero}>
                  <MaterialCommunityIcons
                    name="star"
                    size={22}
                    color={colors.accent}
                  />
                  <Text style={styles.checkoutSummaryLabelHero}>
                    Eco Points
                  </Text>
                  <Text style={styles.checkoutSummaryValueHero}>
                    {totalPoints}
                  </Text>
                </View>
              )}
              <View style={styles.checkoutSummaryItemHero}>
                <MaterialCommunityIcons
                  name="cash"
                  size={22}
                  color={colors.secondary}
                />
                <Text style={styles.checkoutSummaryLabelHero}>
                  {getLabel("money", user?.role)}
                </Text>
                <Text style={styles.checkoutSummaryValueHero}>
                  {totalValue.toFixed(2)} EGP
                </Text>
              </View>
            </View>
            {remainingAmount > 0 && (
              <View style={styles.minimumOrderWarning}>
                <MaterialCommunityIcons
                  name="alert-circle"
                  size={16}
                  color={colors.warning}
                />
                <Text style={styles.minimumOrderText}>
                  {getLabel("minimumOrderMessage", user?.role, {
                    amount: remainingAmount.toFixed(2),
                  })}
                </Text>
              </View>
            )}
            <View style={styles.heroActionRow}>
              <AnimatedButton
                style={[
                  styles.checkoutBtnBarHero,
                  !canProceed && styles.checkoutBtnBarDisabled,
                ]}
                onPress={
                  canSchedulePickup
                    ? () => router.push("/pickup")
                    : canProceedToPurchase
                    ? () => router.push("/pickup")
                    : canGuestProceed
                    ? () => router.push("/login")
                    : null
                }
                disabled={!canProceed}
              >
                <MaterialCommunityIcons
                  name={
                    canProceed
                      ? getRoleBasedIcon("scheduleAction", user?.role)
                      : getRoleBasedIcon("locked", user?.role)
                  }
                  size={24}
                  color={canProceed ? colors.white : colors.white}
                />
                <Text
                  style={[
                    styles.checkoutBtnBarTextHero,
                    !canProceed && styles.checkoutBtnBarTextDisabled,
                  ]}
                >
                  {canSchedulePickup || canProceedToPurchase
                    ? getLabel("schedulePickup", user?.role)
                    : canGuestProceed
                    ? "Login to Continue"
                    : getLabel("minimumOrderButton", user?.role)}
                </Text>
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
      <View
        style={[styles.contentContainer, { backgroundColor: colors.base100 }]}
      >
        <FlatList
          data={cartArray}
          renderItem={renderCartItem}
          keyExtractor={(item) => getDisplayKey(item)}
          contentContainerStyle={[
            styles.listContainerModern,
            { paddingBottom: spacing.xxl * 2 + 64 },
          ]}
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
    minHeight: scaleSize(170),
    paddingHorizontal: scaleSize(spacing.lg),
    paddingBottom: scaleSize(spacing.md),
    paddingTop: scaleSize(spacing.xl),
    borderBottomLeftRadius: scaleSize(32),
    borderBottomRightRadius: scaleSize(32),
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: scaleSize(8) },
    shadowOpacity: 0.3,
    shadowRadius: scaleSize(12),
    elevation: 8,
    justifyContent: "flex-end",
  },
  heroRowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.sm,
  },
  heroContent: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingBottom: spacing.sm,
    paddingTop: spacing.lg,
    minHeight: 120,
  },
  heroTitle: {
    fontSize: scaleSize(24),
    fontWeight: "bold",
    color: colors.white,
    textAlign: "center",
    marginBottom: scaleSize(spacing.sm),
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: scaleSize(14),
    color: colors.white,
    textAlign: "center",
    opacity: 0.85,
    lineHeight: scaleSize(22),
  },
  clearButton: {
    position: "relative",
    padding: spacing.sm,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  contentContainer: {
    flex: 1,
    paddingTop: spacing.md,
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.base100,
  },
  emptyCartIconWrapper: {
    marginBottom: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    width: 100,
    height: 100,
  },
  emptyCartTitle: {
    ...typography.title,
    fontSize: 22,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  emptyCartSubtitle: {
    ...typography.subtitle,
    color: colors.neutral,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  heroFindBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: scaleSize(borderRadius.xl),
    paddingVertical: scaleSize(spacing.xl),
    paddingHorizontal: scaleSize(spacing.xxl),
    marginTop: scaleSize(spacing.xl),
    marginBottom: scaleSize(spacing.md),
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: scaleSize(4) },
    shadowOpacity: 0.18,
    shadowRadius: scaleSize(12),
    elevation: 6,
    minWidth: scaleSize(220),
    alignSelf: "center",
  },
  heroFindBtnText: {
    ...typography.subtitle,
    color: colors.white,
    fontWeight: "700",
    fontSize: scaleSize(18),
    marginLeft: scaleSize(spacing.md),
    letterSpacing: 0.2,
  },
  cartCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    marginHorizontal: scaleSize(spacing.xl),
    marginBottom: scaleSize(spacing.md),
    padding: scaleSize(spacing.lg),
    borderRadius: scaleSize(18),
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: scaleSize(2) },
    shadowOpacity: 0.12,
    shadowRadius: scaleSize(6),
    elevation: 3,
    minHeight: scaleSize(100),
  },
  cartImageContainer: {
    width: scaleSize(64),
    height: scaleSize(64),
    borderRadius: scaleSize(14),
    overflow: "hidden",
    marginRight: scaleSize(spacing.lg),
    backgroundColor: colors.base100,
    justifyContent: "center",
    alignItems: "center",
  },
  cartImage: {
    width: "100%",
    height: "100%",
    borderRadius: scaleSize(14),
  },
  cartImagePlaceholder: {
    width: scaleSize(48),
    height: scaleSize(48),
    borderRadius: scaleSize(10),
    backgroundColor: colors.base200,
    justifyContent: "center",
    alignItems: "center",
  },
  cartInfoContainer: {
    flex: 1,
    justifyContent: "center",
    gap: 2,
  },
  cartName: {
    ...typography.subtitle,
    fontSize: scaleSize(17),
    fontWeight: "700",
    color: colors.black,
    marginBottom: scaleSize(2),
  },
  cartUnit: {
    ...typography.caption,
    color: colors.neutral,
    textTransform: "uppercase",
    fontWeight: "600",
    fontSize: scaleSize(13),
    marginBottom: scaleSize(6),
  },
  cartQuantityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scaleSize(8),
    marginTop: scaleSize(2),
  },
  cartQtyBtn: {
    width: scaleSize(32),
    height: scaleSize(32),
    borderRadius: scaleSize(16),
    backgroundColor: colors.base100,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.base200,
  },
  cartQtyText: {
    ...typography.title,
    fontSize: scaleSize(18),
    fontWeight: "700",
    color: colors.primary,
    minWidth: scaleSize(36),
    textAlign: "center",
  },
  cartActionsContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginLeft: scaleSize(spacing.lg),
    gap: scaleSize(8),
  },
  cartDeleteBtn: {
    width: scaleSize(36),
    height: scaleSize(36),
    borderRadius: scaleSize(18),
    backgroundColor: colors.base100,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: scaleSize(4),
    borderWidth: 1,
    borderColor: colors.base200,
  },
  itemDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
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
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: colors.base200,
  },
  headerRowMerged: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.sm,
    width: "100%",
  },
  headerLeftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  clearCartBtn: {
    flexDirection: "row",
    alignItems: "center",
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
    fontWeight: "600",
    fontSize: 12,
    marginLeft: 4,
  },
  headerTitleMerged: {
    ...typography.title,
    fontSize: 26,
    fontWeight: "bold",
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

  checkoutSummaryRowHero: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    gap: 12,
  },
  checkoutSummaryItemHero: {
    flexDirection: "column",
    alignItems: "center",
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
    fontWeight: "700",
    marginTop: 2,
  },
  heroActionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    width: "100%",
    marginTop: spacing.sm,
    gap: 5,
  },
  checkoutBtnBarHero: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    shadowColor: colors.primary,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    justifyContent: "center",
    flex: 1,
    minWidth: 0,
  },
  checkoutBtnBarTextHero: {
    ...typography.subtitle,
    color: colors.white,
    fontWeight: "700",
    fontSize: 18,
    marginLeft: spacing.sm,
  },
  clearButtonHero: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: spacing.sm,
    height: 55,
    minWidth: 40,
  },
  minimumOrderWarning: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: "rgba(255, 193, 7, 0.15)",
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.md,
  },
  minimumOrderText: {
    ...typography.caption,
    color: colors.warning,
    fontWeight: "600",
    fontSize: 13,
    marginLeft: spacing.xs,
    textAlign: "center",
  },
  checkoutBtnBarDisabled: {
    backgroundColor: colors.base300,
    shadowOpacity: 0,
    elevation: 0,
  },
  checkoutBtnBarTextDisabled: {
    color: colors.white,
    fontWeight: "600",
  },
});

export default Cart;
