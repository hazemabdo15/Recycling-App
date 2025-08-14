import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { KeyboardAwareFlatList } from 'react-native-keyboard-aware-scroll-view';
import { useAuth } from "../../context/AuthContext";
import { useCategories } from "../../hooks/useAPI";
import { useCart } from "../../hooks/useCart";
import { spacing } from "../../styles";
import { colors } from "../../styles/theme";
import {
    CartMessageTypes,
    showCartMessage,
    showMaxStockMessage,
} from "../../utils/cartMessages";
import {
    getCartKey,
    getIncrementStep,
    normalizeItemData,
} from "../../utils/cartUtils";
import { isBuyer } from "../../utils/roleUtils";
import { scaleSize } from "../../utils/scale";
import { isMaxStockReached, isOutOfStock } from "../../utils/stockUtils";
import { CategoryCard } from "../cards";
import { ItemCard } from "../category";
import { FadeInView } from "../common";
import { showGlobalToast } from "../common/GlobalToast";

const CategoriesGrid = ({
  searchText = "",
  onCategoryPress,
  onFilteredCountChange,
  showItemsMode = false,
  flatListBottomPadding = 0,
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const { refetch } = require("../../hooks/useAPI").useAllItems();
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };
  const { user } = useAuth();
  const { categories, loading, error } = useCategories();
  const {
    cartItems,
    handleIncreaseQuantity,
    handleDecreaseQuantity,
    handleFastIncreaseQuantity,
    handleFastDecreaseQuantity,
    handleSetQuantity,
  } = useCart(user);
  const [pendingOperations, setPendingOperations] = useState({});

  const handleManualInput = async (item, value) => {
    if (!item) return;

    const normalizedItem = normalizeItemData(item);
    const currentQuantity = cartItems[getCartKey(item)] || 0;

    // Validate minimum quantity based on measurement unit
    if (value > 0) {
      if (normalizedItem.measurement_unit === 1 && value < 0.25) {
        showCartMessage(CartMessageTypes.INVALID_QUANTITY, {
          itemName: normalizedItem?.name || 'Item',
          measurementUnit: normalizedItem.measurement_unit,
          isBuyer: user?.role === "buyer",
        });
        return;
      } else if (normalizedItem.measurement_unit === 2 && value < 1) {
        showCartMessage(CartMessageTypes.INVALID_QUANTITY, {
          itemName: normalizedItem?.name || 'Item',
          measurementUnit: normalizedItem.measurement_unit,
          isBuyer: user?.role === "buyer",
        });
        return;
      }
    }

    // Only check stock for buyer users
    if (isBuyer(user) && value > item.quantity) {
      showMaxStockMessage(
        normalizedItem?.name || 'Item',
        item.quantity,
        normalizedItem.measurement_unit
      );
      return;
    }

    const itemKey = getCartKey(item);
    setPendingOperations((prev) => ({ ...prev, [itemKey]: "manualInput" }));

    try {
      await handleSetQuantity(item, value);

      // Show unified message based on the operation
      if (value === 0) {
        // Only show removal message when quantity is set to 0
        // No toast for manual removed
        // showCartMessage(CartMessageTypes.MANUAL_REMOVED, {
        //   itemName: normalizedItem.name,
        //   measurementUnit: normalizedItem.measurement_unit,
        //   isBuyer: user?.role === 'buyer',
        // });
      } else if (value > currentQuantity) {
        // Always show the final quantity for manual set, not the added amount
        // No toast for manual set
        // showCartMessage(CartMessageTypes.MANUAL_SET, {
        //   itemName: normalizedItem.name,
        //   quantity: value,
        //   measurementUnit: normalizedItem.measurement_unit,
        //   isBuyer: user?.role === 'buyer',
        // });
      } else if (value < currentQuantity) {
        // Show quantity change, not removal
        // No toast for manual set
        // showCartMessage(CartMessageTypes.MANUAL_SET, {
        //   itemName: normalizedItem.name,
        //   quantity: value,
        //   measurementUnit: normalizedItem.measurement_unit,
        //   isBuyer: user?.role === 'buyer',
        // });
      }
    } catch (_err) {
      showCartMessage(CartMessageTypes.OPERATION_FAILED, {
        itemName: normalizedItem?.name || 'Item',
        measurementUnit: normalizedItem.measurement_unit,
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

  const { filteredCategories, filteredItems } = useMemo(() => {
    const searchLower = searchText.toLowerCase();

    if (showItemsMode) {
      const items = categories
        .flatMap(
          (category) =>
            category.items?.map((item) => {
              const normalizedItem = normalizeItemData({
                ...item,
                categoryId: item.categoryId || category._id,
                categoryName: item.categoryName || category.name,
                category: category,
              });
              const itemKey = getCartKey(normalizedItem);
              // DO NOT overwrite normalizedItem.quantity (stock from API)
              const cartQuantity = cartItems[itemKey] || 0;
              return {
                ...normalizedItem,
                cartQuantity,
                category: category,
              };
            }) || []
        )
        .filter((item) => item && item.name && item.name.toLowerCase().includes(searchLower));

      return { filteredCategories: [], filteredItems: items };
    } else {
      const cats = categories.filter((category) =>
        category && category.name && category.name.toLowerCase().includes(searchLower)
      );
      return { filteredCategories: cats, filteredItems: [] };
    }
  }, [categories, showItemsMode, searchText, cartItems]);

  const handleCartOperation = useCallback(
    async (item, operation) => {
      const itemKey = getCartKey(item);
      if (pendingOperations[itemKey]) return;

      // Get normalized item data
      const normalizedItem = normalizeItemData(item);
      const step = operation.includes("fast")
        ? 5
        : getIncrementStep(normalizedItem.measurement_unit);

      const timeoutId = setTimeout(() => {
        setPendingOperations((prev) => {
          const newState = { ...prev };
          delete newState[itemKey];
          return newState;
        });
      }, 2000);

      try {
        setPendingOperations((prev) => ({
          ...prev,
          [itemKey]: operation,
        }));

        // Show toast instantly before async operation
        if (operation === "increase") {
          showCartMessage(CartMessageTypes.ADD_SINGLE, {
            itemName: normalizedItem?.name || 'Item',
            quantity: step,
            measurementUnit: normalizedItem.measurement_unit,
            isBuyer: user?.role === "buyer",
          });
        } else if (operation === "decrease") {
          showCartMessage(CartMessageTypes.REMOVE_SINGLE, {
            itemName: normalizedItem?.name || 'Item',
            quantity: step,
            measurementUnit: normalizedItem.measurement_unit,
            remainingQuantity: Math.max(0, (item.cartQuantity || 0) - step),
            isBuyer: user?.role === "buyer",
          });
        } else if (operation === "fastIncrease") {
          showCartMessage(CartMessageTypes.ADD_FAST, {
            itemName: normalizedItem?.name || 'Item',
            quantity: step,
            measurementUnit: normalizedItem.measurement_unit,
            isBuyer: user?.role === "buyer",
          });
        } else if (operation === "fastDecrease") {
          showCartMessage(CartMessageTypes.REMOVE_FAST, {
            itemName: normalizedItem?.name || 'Item',
            quantity: step,
            measurementUnit: normalizedItem.measurement_unit,
            remainingQuantity: Math.max(0, (item.cartQuantity || 0) - step),
            isBuyer: user?.role === "buyer",
          });
        }

        let increaseResult;
        switch (operation) {
          case "increase":
            increaseResult = await handleIncreaseQuantity(
              item,
              showGlobalToast
            );
            break;
          case "decrease":
            await handleDecreaseQuantity(item);
            break;
          case "fastIncrease":
            increaseResult = await handleFastIncreaseQuantity(
              item,
              showGlobalToast
            );
            break;
          case "fastDecrease":
            await handleFastDecreaseQuantity(item);
            break;
          default:
            throw new Error(`Unknown operation: ${operation}`);
        }

        if (operation.includes("increase")) {
          if (operation === "increase" || operation === "fastIncrease") {
            if (increaseResult === false) {
              // Show unified stock error message
              showMaxStockMessage(
                normalizedItem?.name || 'Item',
                item.quantity || 0,
                normalizedItem.measurement_unit
              );
            }
          }
        }
      } catch (err) {
        console.error(`[CategoriesGrid] Error ${operation} quantity:`, err);
        showCartMessage(CartMessageTypes.OPERATION_FAILED, {
          itemName: normalizedItem?.name || 'Item',
          measurementUnit: normalizedItem.measurement_unit,
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
    },
    [
      handleIncreaseQuantity,
      handleDecreaseQuantity,
      handleFastIncreaseQuantity,
      handleFastDecreaseQuantity,
      pendingOperations,
      user,
    ]
  );

  useEffect(() => {
    if (onFilteredCountChange) {
      if (showItemsMode) {
        onFilteredCountChange(filteredItems.length);
      } else {
        onFilteredCountChange(filteredCategories.length);
      }
    }
  }, [
    filteredCategories.length,
    filteredItems.length,
    onFilteredCountChange,
    showItemsMode,
  ]);
  const handleCategoryPress = (categoryOrItem) => {
    if (onCategoryPress) {
      onCategoryPress(categoryOrItem);
    }
  };
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0E9F6E" />
        <Text style={styles.loadingText}>Loading categories...</Text>
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No categories available</Text>
      </View>
    );
  }

  return (
    <FadeInView delay={0}>
      {showItemsMode ? (
        <KeyboardAwareFlatList
          key={"items"}
          style={styles.itemsScrollContainer}
          data={filteredItems}
          keyExtractor={(item) => getCartKey(item) || `${item?.name || 'unknown'}`}
          renderItem={({ item, index }) => {
            const itemKey = getCartKey(item);
            const itemPendingAction = pendingOperations[itemKey];
            const cartQuantity = cartItems[itemKey] || 0;

            // Only apply stock validation for buyer users
            let maxReached = false;
            let outOfStock = false;
            if (isBuyer(user)) {
              maxReached = isMaxStockReached(item, cartQuantity);
              outOfStock = isOutOfStock(item);
            }

            return (
              <ItemCard
                key={itemKey || `${item.name}-${index}`}
                item={item}
                quantity={cartQuantity}
                index={index}
                disabled={!!itemPendingAction}
                pendingAction={itemPendingAction}
                maxReached={maxReached}
                outOfStock={outOfStock}
                user={user}
                onManualInput={(val) => handleManualInput(item, val)}
                onIncrease={async () => {
                  // Only check stock limitations for buyer users
                  if (isBuyer(user) && (itemPendingAction || outOfStock)) {
                    if (outOfStock) {
                      showGlobalToast(
                        "This item is out of stock.",
                        1200,
                        "error"
                      );
                    }
                    return;
                  }

                  // Only block add based on stock for buyer users
                  if (isBuyer(user)) {
                    // Block add if stock is less than minimum required (0.25 for kg, 1 for pieces)
                    const isKg = item.measurement_unit === 1;
                    const minStockRequired = isKg ? 0.25 : 1;
                    if (
                      typeof item.quantity === "number" &&
                      item.quantity < minStockRequired
                    ) {
                      showGlobalToast(
                        "Not enough quantity in stock to add this item.",
                        1200,
                        "error"
                      );
                      return;
                    }
                    // Check if adding would exceed stock quantity
                    const step = getIncrementStep(item.measurement_unit);
                    const remainingStock = item.quantity - cartQuantity;
                    console.log("[CategoriesGrid] Stock check:", {
                      itemName: item?.name || 'Item',
                      totalStock: item.quantity,
                      cartQuantity,
                      remainingStock,
                      step,
                      wouldExceed:
                        remainingStock < step ||
                        cartQuantity + step > item.quantity,
                    });
                    if (
                      remainingStock < step ||
                      cartQuantity + step > item.quantity
                    ) {
                      const maxMsg = `You cannot add more. Only ${item.quantity} in stock.`;
                      console.log(
                        "[CategoriesGrid] Showing maxStock toast:",
                        maxMsg
                      );
                      showGlobalToast(maxMsg, 1200, "error");
                      return;
                    }
                  }
                  await handleCartOperation(item, "increase");
                }}
                onDecrease={() => handleCartOperation(item, "decrease")}
                onFastIncrease={async () => {
                  // Only apply stock limitations for buyer users
                  if (isBuyer(user)) {
                    const isKg = item.measurement_unit === 1;
                    // Block add if stock is less than minimum required (0.25 for kg, 1 for pieces)
                    const minStockRequired = isKg ? 0.25 : 1;
                    if (
                      typeof item.quantity === "number" &&
                      item.quantity < minStockRequired
                    ) {
                      showGlobalToast(
                        "Not enough quantity in stock to add this item.",
                        1200,
                        "error"
                      );
                      return;
                    }
                    // Check if adding 5 would exceed stock quantity
                    const fastStep = 5;
                    const remainingStock = item.quantity - cartQuantity;
                    console.log("[CategoriesGrid] Fast stock check:", {
                      itemName: item.name,
                      totalStock: item.quantity,
                      cartQuantity,
                      remainingStock,
                      fastStep,
                      wouldExceed:
                        remainingStock < fastStep ||
                        cartQuantity + fastStep > item.quantity,
                    });
                    if (
                      remainingStock < fastStep ||
                      cartQuantity + fastStep > item.quantity
                    ) {
                      const maxMsg = `You cannot add more. Only ${item.quantity} in stock.`;
                      console.log(
                        "[CategoriesGrid] Showing fast maxStock toast:",
                        maxMsg
                      );
                      showGlobalToast(maxMsg, 1200, "error");
                      return;
                    }
                  }
                  await handleCartOperation(item, "fastIncrease");
                }}
                onFastDecrease={() => handleCartOperation(item, "fastDecrease")}
              />
            );
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={[
            styles.itemsList,
            // Remove extra paddingBottom, rely on ListFooterComponent for spacing
          ]}
          ListFooterComponent={<View style={{ height: 100 }} />}
          showsVerticalScrollIndicator={false}
          enableOnAndroid
          extraScrollHeight={100}
          keyboardShouldPersistTaps="handled"
        />
      ) : (
        <FlatList
          key={"categories"}
          data={filteredCategories}
          keyExtractor={(category) => category._id}
          numColumns={2}
          renderItem={({ item: category }) => (
            <CategoryCard
              key={category._id}
              category={category}
              onPress={() => handleCategoryPress(category)}
              style={styles.categoryCard}
            />
          )}
          contentContainerStyle={styles.scrollContainer}
          columnWrapperStyle={styles.categoriesGrid}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </FadeInView>
  );
};
const styles = StyleSheet.create({
  scrollContainer: {
    paddingBottom: scaleSize(40),
    paddingHorizontal: scaleSize(5),
    backgroundColor: "transparent",
  },
  itemsScrollContainer: {
    paddingHorizontal: scaleSize(spacing.sm),
    backgroundColor: "transparent",
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    backgroundColor: "transparent",
  },
  itemsList: {
    gap: scaleSize(16),
    backgroundColor: "transparent",
  },
  categoryCard: {
    width: "48%",
    marginBottom: scaleSize(15),
    backgroundColor: "#fff",
    borderRadius: scaleSize(18),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: scaleSize(3) },
    shadowOpacity: 0.1,
    shadowRadius: scaleSize(30),
    elevation: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: scaleSize(50),
  },
  loadingText: {
    marginTop: scaleSize(16),
    fontSize: scaleSize(16),
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: scaleSize(50),
  },
  errorText: {
    fontSize: scaleSize(16),
    color: "#F44336",
    textAlign: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: scaleSize(50),
  },
  emptyText: {
    fontSize: scaleSize(16),
    color: "#666",
    textAlign: "center",
  },
});
export default CategoriesGrid;
