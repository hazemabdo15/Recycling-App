import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect, useState } from "react";
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
import { layoutStyles } from "../styles/components/commonStyles";
import { colors, spacing } from "../styles/theme";
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

  const [pendingOperations, setPendingOperations] = useState({});
  
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

  const mergedItems = items.map((item) => {
    const needsNormalization =
      !item._id ||
      !item.categoryId ||
      !item.image ||
      item.measurement_unit === undefined;
    const processedItem = needsNormalization ? normalizeItemData(item) : item;
    const itemKey = getCartKey(processedItem);
    const cartQuantity = cartItems[itemKey] || 0;

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
      cartQuantity, // this is the quantity in the cart
      displayName: translatedItemName, // Add translated name for display
      originalName: itemDisplayName, // Keep the original multilingual name for reference
    };
  });

  const { totalItems, totalPoints, totalValue } = calculateCartStats(
    mergedItems,
    cartItems
  );

  const handleManualInput = async (itemOrValue, valueMaybe) => {
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
    if (value > 0) {
      if (measurementUnit === 1 && value < 0.25) {
        showCartMessage(CartMessageTypes.INVALID_QUANTITY, {
          itemName: itemDisplayName,
          measurementUnit: measurementUnit,
          isBuyer: user?.role === "buyer",
        });
        return;
      } else if (measurementUnit === 2 && value < 1) {
        showCartMessage(CartMessageTypes.INVALID_QUANTITY, {
          itemName: itemDisplayName,
          measurementUnit: measurementUnit,
          isBuyer: user?.role === "buyer",
        });
        return;
      }
    }

    // Only check stock for buyer users
    if (isBuyer(user) && value > item.quantity) {
      showCartMessage(CartMessageTypes.STOCK_ERROR, {
        itemName: itemDisplayName,
        maxStock: item.quantity,
        measurementUnit: item.measurement_unit,
        isBuyer: true,
      });
      return;
    }
    const itemKey = getCartKey(item);
    setPendingOperations((prev) => ({ ...prev, [itemKey]: "manualInput" }));
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
        });
      }
    } catch (_err) {
      console.log("handleSetQuantity error:", _err);
      showCartMessage(CartMessageTypes.OPERATION_FAILED, {
        itemName: itemDisplayName,
        measurementUnit: item.measurement_unit,
        isBuyer: user?.role === "buyer",
      });
    } finally {
      setPendingOperations((prev) => {
        const newState = { ...prev };
        delete newState[itemKey];
        return newState;
      });
    }
  };

  const renderItem = ({ item, index }) => {
    const itemKey = getCartKey(item);
    const itemPendingAction = pendingOperations[itemKey];
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

    return (
      <ItemCard
        item={{
          ...item,
          // Pass the display name to ItemCard so it shows translated text
          name: itemDisplayName,
        }}
        quantity={item.cartQuantity}
        disabled={!!itemPendingAction}
        pendingAction={itemPendingAction}
        index={index}
        maxReached={maxReached}
        outOfStock={outOfStock}
        user={user}
        onManualInput={(val) => handleManualInput(item, val)}
        onIncrease={async () => {
          // Only check stock limits for buyer users
          if (
            isBuyer(user) &&
            (itemPendingAction || maxReached || outOfStock)
          ) {
            if (maxReached) {
              showMaxStockMessage(
                itemDisplayName,
                item.quantity,
                item.measurement_unit
              );
            }
            if (outOfStock) {
              showCartMessage(CartMessageTypes.STOCK_ERROR, {
                itemName: itemDisplayName,
                maxStock: 0,
                measurementUnit: item.measurement_unit,
                isBuyer: true,
              });
            }
            return;
          }
          // Show toast instantly
          const normalizedItem = normalizeItemData(item);
          const step = getIncrementStep(normalizedItem.measurement_unit);

          showCartMessage(CartMessageTypes.ADD_SINGLE, {
            itemName: itemDisplayName,
            quantity: step,
            measurementUnit: normalizedItem.measurement_unit,
            isBuyer: user?.role === "buyer",
          });

          const timeoutId = setTimeout(() => {
            setPendingOperations((prev) => {
              const newState = { ...prev };
              delete newState[itemKey];
              return newState;
            });
          }, 1000);
          try {
            setPendingOperations((prev) => ({
              ...prev,
              [itemKey]: "increase",
            }));
            const itemWithCorrectId = { ...item, _id: itemKey };
            const addResult = await handleIncreaseQuantity(itemWithCorrectId);
            if (addResult === false) {
              // Show maxStock toast if add was blocked
              showMaxStockMessage(
                itemDisplayName,
                item.quantity,
                item.measurement_unit
              );
            }
          } catch (err) {
            console.error("[CategoryDetails] Error increasing quantity:", err);
            showCartMessage(CartMessageTypes.OPERATION_FAILED, {
              itemName: itemDisplayName,
              measurementUnit: item.measurement_unit,
              isBuyer: user?.role === "buyer",
            });
          } finally {
            clearTimeout(timeoutId);
            setPendingOperations((prev) => {
              const newState = { ...prev };
              delete newState[itemKey];
              return newState;
            });
          }
        }}
        onDecrease={async () => {
          if (itemPendingAction) return;
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
            });
          } else {
            showCartMessage(CartMessageTypes.ITEM_REMOVED, {
              itemName: itemDisplayName,
              measurementUnit: normalizedItem.measurement_unit,
              isBuyer: user?.role === "buyer",
            });
          }

          const timeoutId = setTimeout(() => {
            setPendingOperations((prev) => {
              const newState = { ...prev };
              delete newState[itemKey];
              return newState;
            });
          }, 1000);
          try {
            setPendingOperations((prev) => ({
              ...prev,
              [itemKey]: "decrease",
            }));
            const itemWithCorrectId = { ...item, _id: itemKey };
            await handleDecreaseQuantity(itemWithCorrectId);
          } catch (err) {
            console.error("[CategoryDetails] Error decreasing quantity:", err);
            showCartMessage(CartMessageTypes.OPERATION_FAILED, {
              itemName: itemDisplayName,
              measurementUnit: item.measurement_unit,
              isBuyer: user?.role === "buyer",
            });
          } finally {
            clearTimeout(timeoutId);
            setPendingOperations((prev) => {
              const newState = { ...prev };
              delete newState[itemKey];
              return newState;
            });
          }
        }}
        onFastIncrease={async () => {
          if (itemPendingAction) return;
          // Only prevent fast-increase for buyer users based on stock
          const fastStep = 5;
          if (
            isBuyer(user) &&
            !canAddToCart(item, item.cartQuantity, fastStep)
          ) {
            showMaxStockMessage(
              itemDisplayName,
              item.quantity,
              item.measurement_unit
            );
            return;
          }
          // Show toast instantly
          const normalizedItem = normalizeItemData(item);

          showCartMessage(CartMessageTypes.ADD_FAST, {
            itemName: itemDisplayName,
            quantity: fastStep,
            measurementUnit: normalizedItem.measurement_unit,
            isBuyer: user?.role === "buyer",
          });

          const timeoutId = setTimeout(() => {
            setPendingOperations((prev) => {
              const newState = { ...prev };
              delete newState[item.categoryId];
              return newState;
            });
          }, 1000);
          try {
            setPendingOperations((prev) => ({
              ...prev,
              [item.categoryId]: "fastIncrease",
            }));
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
            });
          } finally {
            clearTimeout(timeoutId);
            setPendingOperations((prev) => {
              const newState = { ...prev };
              delete newState[item.categoryId];
              return newState;
            });
          }
        }}
        onFastDecrease={async () => {
          if (itemPendingAction) return;
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
            });
          } else {
            showCartMessage(CartMessageTypes.ITEM_REMOVED, {
              itemName: itemDisplayName,
              measurementUnit: normalizedItem.measurement_unit,
              isBuyer: user?.role === "buyer",
            });
          }

          const timeoutId = setTimeout(() => {
            setPendingOperations((prev) => {
              const newState = { ...prev };
              delete newState[item.categoryId];
              return newState;
            });
          }, 1000);
          try {
            setPendingOperations((prev) => ({
              ...prev,
              [item.categoryId]: "fastDecrease",
            }));
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
            });
          } finally {
            clearTimeout(timeoutId);
            setPendingOperations((prev) => {
              const newState = { ...prev };
              delete newState[item.categoryId];
              return newState;
            });
          }
        }}
      />
    );
  };

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

        <Text style={heroStyles.heroTitle}>{translatedCategoryName}</Text>

        <View style={heroStyles.spacer} />
      </View>

      <View style={heroStyles.heroContent}>
        <Text style={heroStyles.heroSubtitle}>
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
            <Text style={heroStyles.statValue}>{totalItems}</Text>
            <Text style={heroStyles.statLabel}>{t("common.items")}</Text>
          </View>

          {!isBuyer(user) && (
            <View style={heroStyles.statItem}>
              <MaterialCommunityIcons
                name="star"
                size={20}
                color={colors.white}
              />
              <Text style={heroStyles.statValue}>{totalPoints}</Text>
              <Text style={heroStyles.statLabel}>{t("common.points")}</Text>
            </View>
          )}

          <View style={heroStyles.statItem}>
            <MaterialCommunityIcons
              name="cash"
              size={20}
              color={colors.white}
            />
            <Text style={heroStyles.statValue}>{totalValue} EGP</Text>
            <Text style={heroStyles.statLabel}>
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
          extraData={cartItems}
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
    shadowColor: colors.primary,
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
    color: colors.white,
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
    color: colors.white,
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
    color: colors.white,
    marginTop: scaleSize(4),
    marginBottom: scaleSize(2),
  },
  statLabel: {
    fontSize: scaleSize(12),
    color: colors.white,
    opacity: 0.8,
    textAlign: "center",
  },
};

export default CategoryDetails;
