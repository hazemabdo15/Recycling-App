import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next"; // Add this import
import {
  RefreshControl,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareFlatList } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EmptyState, ItemCard } from "../components/category";
import { ErrorState, Loader } from "../components/common";
import { useAuth } from "../context/AuthContext";
import { useLocalization } from "../context/LocalizationContext";
import { useCategoryItems } from "../hooks/useAPI";
import { useCart } from "../hooks/useCart";
import { useStockManager } from "../hooks/useStockManager";
import { useThemedStyles } from "../hooks/useThemedStyles";
import { getLayoutStyles } from "../styles/components/commonStyles";
import { spacing } from "../styles/theme";
import {
  CartMessageTypes,
  showCartMessage,
  showMaxStockMessage,
} from "../utils/cartMessages";
import {
  calculateCartStats,
  getCartKey,
  getDisplayKey,
  getIncrementStep,
  normalizeItemData,
} from "../utils/cartUtils";
import { isBuyer } from "../utils/roleUtils";
import { scaleSize } from "../utils/scale";
import { extractNameFromMultilingual, getTranslatedName } from "../utils/translationHelpers";

const CategoryDetails = () => {
  const { categoryName: categoryNameParam } = useLocalSearchParams();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { tRole, currentLanguage } = useLocalization();
  const { t } = useTranslation(); // Add translation hook
  const { colors, isDarkMode } = useThemedStyles();
  const layoutStyles = getLayoutStyles(isDarkMode);
  
  // Parse the category name if it's a JSON string, otherwise use as-is
  let categoryName;
  try {
    categoryName = JSON.parse(categoryNameParam);
  } catch {
    categoryName = categoryNameParam;
  }
  
  // Get translated category name for display (use shared helper)
  const translatedCategoryName = getTranslatedName(t, categoryName, 'categories', { 
    currentLanguage 
  });

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // For API calls, use the English name or fallback to the original string
  const categoryNameForAPI = typeof categoryName === 'object' 
    ? (categoryName.en || categoryName.ar || Object.values(categoryName)[0])
    : categoryName;

  const { items, loading, error, refetch } = useCategoryItems(categoryNameForAPI);
  const [refreshing, setRefreshing] = useState(false);
  
  // Track pending operations to prevent spam clicking
  const [pendingOperations, setPendingOperations] = useState(new Map());
  
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };
  const insets = useSafeAreaInsets();
  const {
    cartItems,
    handleIncreaseQuantity,
    handleDecreaseQuantity,
    handleFastIncreaseQuantity,
    handleFastDecreaseQuantity,
    handleSetQuantity,
  } = useCart(user);
  
  const {
    getItemStock,
    syncItemsStock,
    wasRecentlyUpdated,
  } = useStockManager();

  // Sync stock data when items are loaded
  useEffect(() => {
    if (items && items.length > 0) {
      syncItemsStock(items);
    }
  }, [items, syncItemsStock]);

  // Memoize the processed items separately from cart quantities for better performance
  const processedItems = useMemo(() => {
    return items.map((item) => {
      const needsNormalization =
        !item._id ||
        !item.categoryId ||
        !item.image ||
        item.measurement_unit === undefined;
      const processedItem = needsNormalization ? normalizeItemData(item) : item;

      // Get real-time stock quantity
      const realTimeStock = getItemStock(processedItem._id);
      const stockQuantity = realTimeStock > 0 ? realTimeStock : (processedItem.quantity || 0);

      // Handle multilingual item name - extract from the item name structure
      const itemDisplayName = extractNameFromMultilingual(processedItem.name, currentLanguage);
      
      // Add translated name to item (fallback to translation system if multilingual data not available)
      const translatedItemName = getTranslatedName(
        t,
        processedItem.name,
        "subcategories",
        { categoryName: categoryName, currentLanguage }
      );

      return {
        ...processedItem,
        quantity: stockQuantity, // Use real-time stock quantity
        displayName: translatedItemName, // Add translated name for display
        originalName: itemDisplayName, // Keep the original multilingual name for reference
        stockUpdated: wasRecentlyUpdated(processedItem._id), // Flag for UI feedback
      };
    });
  }, [items, getItemStock, wasRecentlyUpdated, currentLanguage, t, categoryName]);

  // Memoize cart quantities separately to avoid recalculating processed items
  const mergedItems = useMemo(() => {
    return processedItems.map((processedItem) => {
      const itemKey = getCartKey(processedItem);
      const cartQuantity = cartItems[itemKey] || 0;

      return {
        ...processedItem,
        cartQuantity, // this is the quantity in the cart
      };
    });
  }, [processedItems, cartItems]);

  const { totalItems, totalPoints, totalValue } = calculateCartStats(
    mergedItems,
    cartItems
  );

  const handleManualInput = useCallback(async (itemOrValue, valueMaybe) => {
    console.log("handleManualInput called with:", { itemOrValue, valueMaybe });

    // itemOrValue can be item or value depending on call
    let item, value;
    if (typeof valueMaybe === "undefined") {
      // Called as onManualInput(item)
      item = itemOrValue;
      console.log("Called with just item, returning early");
      return; // Do nothing on just focus/click
    } else {
      // Called as onManualInput(value) from QuantityControls
      item = itemOrValue;
      value = valueMaybe;
    }

    console.log("Processing manual input:", {
      item: item?.displayName || item?.name,
      value,
      itemQuantity: item?.quantity,
    });

    if (!item) {
      console.log("No item found, returning");
      return;
    }

    // Use translated item name in messages
    const itemDisplayName = item.displayName || item.name;

    // Validate minimum quantity based on measurement unit
    const measurementUnit =
      item.measurement_unit || (item.unit === "KG" ? 1 : 2);
    
    // For pieces (measurement_unit === 2), round fractional values to nearest integer
    if (measurementUnit === 2 && value !== Math.floor(value)) {
      value = Math.round(value);
      console.log("Rounded fractional value for pieces to:", value);
    }
    
    if (value > 0) {
      if (measurementUnit === 1 && value < 0.25) {
        showCartMessage(CartMessageTypes.INVALID_QUANTITY, {
          itemName: itemDisplayName,
          measurementUnit: measurementUnit,
          isBuyer: user?.role === "buyer",
          t
        });
        return;
      } else if (measurementUnit === 2 && value < 1) {
        showCartMessage(CartMessageTypes.INVALID_QUANTITY, {
          itemName: itemDisplayName,
          measurementUnit: measurementUnit,
          isBuyer: user?.role === "buyer",
          t
        });
        return;
      }
    }

    // Only check stock for buyer users
    if (isBuyer(user)) {
      // Get real-time stock quantity
      const currentStock = getItemStock(item._id);
      const stockQuantity = currentStock > 0 ? currentStock : item.quantity;
      
      if (value > stockQuantity) {
        showCartMessage(CartMessageTypes.STOCK_ERROR, {
          itemName: itemDisplayName,
          maxStock: stockQuantity,
          measurementUnit: item.measurement_unit,
          isBuyer: true,
          t
        });
        return;
      }
    }
    try {
      console.log("Calling handleSetQuantity with:", {
        item: itemDisplayName,
        value,
      });
      const result = await handleSetQuantity(item, value);
      console.log("handleSetQuantity result:", result);

      // Only show removal message when quantity is set to 0
      if (value === 0) {
        showCartMessage(CartMessageTypes.MANUAL_REMOVED, {
          itemName: itemDisplayName,
          measurementUnit: item.measurement_unit,
          isBuyer: user?.role === "buyer",
          t
        });
      }
    } catch (_err) {
      console.log("handleSetQuantity error:", _err);
      showCartMessage(CartMessageTypes.OPERATION_FAILED, {
        itemName: itemDisplayName,
        measurementUnit: item.measurement_unit,
        isBuyer: user?.role === "buyer",
        t
      });
    } finally {
    }
  }, [user, getItemStock, handleSetQuantity, t]);

  // Memoized render function to prevent unnecessary re-renders of individual items
  const renderItem = useCallback(({ item, index }) => {
    const itemKey = getCartKey(item);
    // Use displayName if available (already translated), otherwise extract from multilingual name
    const itemDisplayName = item.displayName || extractNameFromMultilingual(item.name, currentLanguage);

    // Stock logic - only for buyer users
    let maxReached = false;
    let outOfStock = false;
    let canAddToCart = () => true; // Default to always allow for non-buyers

    if (isBuyer(user)) {
      const stockUtils = require("../utils/stockUtils");
      const {
        isOutOfStock,
        isMaxStockReached,
        canAddToCart: stockCanAddToCart,
      } = stockUtils;
      maxReached = isMaxStockReached(item, item.cartQuantity);
      outOfStock = isOutOfStock(item);
      canAddToCart = stockCanAddToCart;
    }

    // Check if this item has pending operations
    const hasPendingOperation = pendingOperations.has(itemKey);

    return (
      <ItemCard
        item={{
          ...item,
          // Pass the display name to ItemCard so it shows translated text
          name: itemDisplayName,
        }}
        quantity={item.cartQuantity}
        disabled={hasPendingOperation}
        pendingAction={hasPendingOperation ? pendingOperations.get(itemKey) : null}
        index={index}
        maxReached={maxReached}
        outOfStock={outOfStock}
        user={user}
        onManualInput={(val) => handleManualInput(item, val)}
        onIncrease={async () => {
          // Prevent spam clicking
          if (pendingOperations.has(itemKey)) {
            console.log(`[CategoryDetails] Blocking rapid click for ${item.name} - operation pending`);
            return;
          }

          // Set pending operation
          setPendingOperations(prev => new Map(prev).set(itemKey, 'increase'));

          // Pre-compute values for instant feedback
          const normalizedItem = normalizeItemData(item);
          const step = getIncrementStep(normalizedItem.measurement_unit);

          // Comprehensive stock validation for buyer users before showing optimistic UI
          if (isBuyer(user)) {
            if (outOfStock) {
              showCartMessage(CartMessageTypes.STOCK_ERROR, {
                itemName: itemDisplayName,
                maxStock: 0,
                measurementUnit: item.measurement_unit,
                isBuyer: true,
                t
              });
              // Clear pending operation
              setPendingOperations(prev => {
                const newMap = new Map(prev);
                newMap.delete(itemKey);
                return newMap;
              });
              return;
            }

            // Check if adding step would exceed available stock
            const currentStock = getItemStock(item._id);
            const stockQuantity = currentStock > 0 ? currentStock : item.quantity;
            const currentCartQuantity = item.cartQuantity;
            const newTotalQuantity = currentCartQuantity + step;

            if (newTotalQuantity > stockQuantity) {
              showMaxStockMessage(
                itemDisplayName,
                stockQuantity,
                item.measurement_unit,
                t
              );
              // Clear pending operation
              setPendingOperations(prev => {
                const newMap = new Map(prev);
                newMap.delete(itemKey);
                return newMap;
              });
              return;
            }

            if (maxReached) {
              showMaxStockMessage(
                itemDisplayName,
                item.quantity,
                item.measurement_unit,
                t
              );
              // Clear pending operation
              setPendingOperations(prev => {
                const newMap = new Map(prev);
                newMap.delete(itemKey);
                return newMap;
              });
              return;
            }
          }

          // Show toast instantly (only after stock checks pass)
          showCartMessage(CartMessageTypes.ADD_SINGLE, {
            itemName: itemDisplayName,
            quantity: step,
            measurementUnit: normalizedItem.measurement_unit,
            isBuyer: user?.role === "buyer",
            t
          });

          try {
            const itemWithCorrectId = { ...item, _id: itemKey };
            const addResult = await handleIncreaseQuantity(itemWithCorrectId);
            if (addResult === false) {
              // Show maxStock toast with real-time stock quantity
              const currentStock = getItemStock(item._id);
              const stockQuantity = currentStock > 0 ? currentStock : item.quantity;
              showMaxStockMessage(
                itemDisplayName,
                stockQuantity,
                item.measurement_unit,
                t
              );
            }
          } catch (err) {
            console.error("[CategoryDetails] Error increasing quantity:", err);
            showCartMessage(CartMessageTypes.OPERATION_FAILED, {
              itemName: itemDisplayName,
              measurementUnit: item.measurement_unit,
              isBuyer: user?.role === "buyer",
              t
            });
          } finally {
            // Always clear pending operation
            setPendingOperations(prev => {
              const newMap = new Map(prev);
              newMap.delete(itemKey);
              return newMap;
            });
          }
        }}
        onDecrease={async () => {
          // Show toast instantly
          const normalizedItem = normalizeItemData(item);
          const step = getIncrementStep(normalizedItem.measurement_unit);
          const remainingQuantity = item.cartQuantity - step;

          if (remainingQuantity > 0) {
            showCartMessage(CartMessageTypes.REMOVE_SINGLE, {
              itemName: itemDisplayName,
              quantity: step,
              measurementUnit: normalizedItem.measurement_unit,
              remainingQuantity: remainingQuantity,
              isBuyer: user?.role === "buyer",
              t
            });
          } else {
            showCartMessage(CartMessageTypes.ITEM_REMOVED, {
              itemName: itemDisplayName,
              measurementUnit: normalizedItem.measurement_unit,
              isBuyer: user?.role === "buyer",
              t
            });
          }

          try {
            const itemWithCorrectId = { ...item, _id: itemKey };
            await handleDecreaseQuantity(itemWithCorrectId);
          } catch (err) {
            console.error("[CategoryDetails] Error decreasing quantity:", err);
            showCartMessage(CartMessageTypes.OPERATION_FAILED, {
              itemName: itemDisplayName,
              measurementUnit: item.measurement_unit,
              isBuyer: user?.role === "buyer",
              t
            });
          }
        }}
        onFastIncrease={async () => {
          // Prevent spam clicking
          if (pendingOperations.has(itemKey)) {
            console.log(`[CategoryDetails] Blocking rapid click for ${item.name} - fast operation pending`);
            return;
          }

          // Set pending operation
          setPendingOperations(prev => new Map(prev).set(itemKey, 'fastIncrease'));

          // Pre-compute values for instant feedback
          const fastStep = 5;
          const normalizedItem = normalizeItemData(item);

          // Comprehensive stock validation for buyer users before showing optimistic UI
          if (isBuyer(user)) {
            if (outOfStock) {
              showMaxStockMessage(
                itemDisplayName,
                0,
                item.measurement_unit,
                t
              );
              // Clear pending operation
              setPendingOperations(prev => {
                const newMap = new Map(prev);
                newMap.delete(itemKey);
                return newMap;
              });
              return;
            }

            // Check if adding fast step would exceed available stock
            const currentStock = getItemStock(item._id);
            const stockQuantity = currentStock > 0 ? currentStock : item.quantity;
            const currentCartQuantity = item.cartQuantity;
            const newTotalQuantity = currentCartQuantity + fastStep;

            if (newTotalQuantity > stockQuantity) {
              showMaxStockMessage(
                itemDisplayName,
                stockQuantity,
                item.measurement_unit,
                t
              );
              // Clear pending operation
              setPendingOperations(prev => {
                const newMap = new Map(prev);
                newMap.delete(itemKey);
                return newMap;
              });
              return;
            }

            // Use the existing canAddToCart function as additional validation
            if (!canAddToCart(item, item.cartQuantity, fastStep)) {
              showMaxStockMessage(
                itemDisplayName,
                item.quantity,
                item.measurement_unit,
                t
              );
              // Clear pending operation
              setPendingOperations(prev => {
                const newMap = new Map(prev);
                newMap.delete(itemKey);
                return newMap;
              });
              return;
            }
          }

          // Show toast instantly (only after stock checks pass)
          showCartMessage(CartMessageTypes.ADD_FAST, {
            itemName: itemDisplayName,
            quantity: fastStep,
            measurementUnit: normalizedItem.measurement_unit,
            isBuyer: user?.role === "buyer",
            t
          });

          try {
            await handleFastIncreaseQuantity(item);
          } catch (err) {
            console.error(
              "[CategoryDetails] Error fast increasing quantity:",
              err
            );
            showCartMessage(CartMessageTypes.OPERATION_FAILED, {
              itemName: itemDisplayName,
              measurementUnit: item.measurement_unit,
              isBuyer: user?.role === "buyer",
              t
            });
          } finally {
            // Always clear pending operation
            setPendingOperations(prev => {
              const newMap = new Map(prev);
              newMap.delete(itemKey);
              return newMap;
            });
          }
        }}
        onFastDecrease={async () => {
          // Show toast instantly
          const normalizedItem = normalizeItemData(item);
          const fastStep = 5;
          const remainingQuantity = item.cartQuantity - fastStep;

          if (remainingQuantity > 0) {
            showCartMessage(CartMessageTypes.REMOVE_FAST, {
              itemName: itemDisplayName,
              quantity: fastStep,
              measurementUnit: normalizedItem.measurement_unit,
              remainingQuantity: remainingQuantity,
              isBuyer: user?.role === "buyer",
              t
            });
          } else {
            showCartMessage(CartMessageTypes.ITEM_REMOVED, {
              itemName: itemDisplayName,
              measurementUnit: normalizedItem.measurement_unit,
              isBuyer: user?.role === "buyer",
              t
            });
          }

          try {
            await handleFastDecreaseQuantity(item);
          } catch (err) {
            console.error(
              "[CategoryDetails] Error fast decreasing quantity:",
              err
            );
            showCartMessage(CartMessageTypes.OPERATION_FAILED, {
              itemName: itemDisplayName,
              measurementUnit: item.measurement_unit,
              isBuyer: user?.role === "buyer",
              t
            });
          }
        }}
      />
    );
  }, [
    currentLanguage,
    user,
    pendingOperations,
    handleManualInput,
    getItemStock,
    handleIncreaseQuantity,
    handleDecreaseQuantity,
    handleFastIncreaseQuantity,
    handleFastDecreaseQuantity,
    setPendingOperations,
    t
  ]);

  const handleAddItem = () => {
    console.log("Add item to", translatedCategoryName);
  };

  // Hero Header Component
  const HeroHeader = () => (
    <LinearGradient
      colors={[colors.primary, colors.neutral]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[heroStyles.heroSection, { paddingTop: insets.top + 20 }]}
    >
      <View style={heroStyles.headerRow}>
        <TouchableOpacity
          style={heroStyles.backButton}
          onPress={() => navigation && navigation.goBack && navigation.goBack()}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={colors.white}
          />
        </TouchableOpacity>

        <Text style={[heroStyles.heroTitle, { color: colors.white }]}>{translatedCategoryName}</Text>

        <View style={heroStyles.spacer} />
      </View>

      <View style={heroStyles.heroContent}>
        <Text style={[heroStyles.heroSubtitle, { color: colors.white }]}>
          {t("categories.subtitle", {
            categoryName: translatedCategoryName.toLowerCase(),
          })}
        </Text>

        <View style={heroStyles.statsContainer}>
          <View style={heroStyles.statItem}>
            <MaterialCommunityIcons
              name="package-variant"
              size={20}
              color={colors.white}
            />
            <Text style={[heroStyles.statValue, { color: colors.white }]}>{totalItems}</Text>
            <Text style={[heroStyles.statLabel, { color: colors.white }]}>{t("common.items")}</Text>
          </View>

          {!isBuyer(user) && (
            <View style={heroStyles.statItem}>
              <MaterialCommunityIcons
                name="star"
                size={20}
                color={colors.white}
              />
              <Text style={[heroStyles.statValue, { color: colors.white }]}>{totalPoints}</Text>
              <Text style={[heroStyles.statLabel, { color: colors.white }]}>{t("common.points")}</Text>
            </View>
          )}

          <View style={heroStyles.statItem}>
            <MaterialCommunityIcons
              name="cash"
              size={20}
              color={colors.white}
            />
            <Text style={[heroStyles.statValue, { color: colors.white }]}>{totalValue} {t("units.egp")}</Text>
            <Text style={[heroStyles.statLabel, { color: colors.white }]}>
              {tRole("money", user?.role)}
            </Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );

  if (loading && !refreshing) {
    return (
      <View style={[layoutStyles.container, { paddingTop: insets.top }]}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />
        <Loader />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[layoutStyles.container, { paddingTop: insets.top }]}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />
        <ErrorState
          message={t(
            "categories.errorLoading",
            "Error loading {{categoryName}} items",
            { categoryName: translatedCategoryName }
          )}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        layoutStyles.container,
        { paddingTop: 0, backgroundColor: colors.background },
      ]}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <HeroHeader />

      {mergedItems.length === 0 ? (
        <EmptyState
          categoryName={translatedCategoryName}
          onAddItem={handleAddItem}
        />
      ) : (
        <KeyboardAwareFlatList
          data={mergedItems}
          renderItem={renderItem}
          keyExtractor={(item) => getDisplayKey(item)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            gap: 16,
            backgroundColor: "transparent",
            paddingBottom: 40,
            paddingHorizontal: scaleSize(spacing.sm),
            paddingTop: scaleSize(spacing.md),
          }}
          extraData={`${Object.keys(cartItems).length}-${pendingOperations.size}`}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          enableOnAndroid
          extraScrollHeight={160}
          keyboardOpeningTime={0}
          keyboardShouldPersistTaps="handled"
          // Performance optimizations for large lists
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={15}
          windowSize={10}
          getItemLayout={undefined} // Let FlatList calculate automatically
        />
      )}
    </View>
  );
};

const heroStyles = {
  heroSection: {
    paddingHorizontal: scaleSize(spacing.lg),
    paddingBottom: scaleSize(spacing.lg),
    borderBottomLeftRadius: scaleSize(32),
    borderBottomRightRadius: scaleSize(32),
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: scaleSize(8) },
    shadowOpacity: 0.3,
    shadowRadius: scaleSize(12),
    elevation: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: scaleSize(spacing.md),
  },
  backButton: {
    padding: scaleSize(spacing.sm),
    borderRadius: scaleSize(20),
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  heroTitle: {
    fontSize: scaleSize(24),
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: -0.5,
    flex: 1,
  },
  spacer: {
    width: 40,
  },
  heroContent: {
    alignItems: "center",
    paddingTop: scaleSize(spacing.sm),
  },
  heroSubtitle: {
    fontSize: scaleSize(14),
    color: "#FFFFFF",
    textAlign: "center",
    opacity: 0.85,
    lineHeight: scaleSize(22),
    maxWidth: scaleSize(280),
    marginBottom: scaleSize(spacing.md),
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: scaleSize(16),
    paddingVertical: scaleSize(spacing.md),
    paddingHorizontal: scaleSize(spacing.sm),
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: scaleSize(18),
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: scaleSize(4),
    marginBottom: scaleSize(2),
  },
  statLabel: {
    fontSize: scaleSize(12),
    color: "#FFFFFF",
    opacity: 0.8,
    textAlign: "center",
  },
};

export default CategoryDetails;
