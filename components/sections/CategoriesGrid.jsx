import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from 'react-i18next'; // Add this import
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
import { useLocalization } from "../../context/LocalizationContext";
import { useAllItems, useCategories } from "../../hooks/useAPI";
import { useCart } from "../../hooks/useCart";
import { useStockManager } from "../../hooks/useStockManager";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import { spacing } from "../../styles";
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
import { extractNameFromMultilingual, getTranslatedName } from "../../utils/translationHelpers";
import { CategoryCard } from "../cards";
import { ItemCard } from "../category";
import { FadeInView } from "../common";
import { showGlobalToast } from "../common/GlobalToast";

// Dynamic styles function for CategoriesGrid
const getCategoriesGridStyles = (colors) => StyleSheet.create({
  scrollContainer: {
    paddingBottom: scaleSize(100),
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
    backgroundColor: colors.background,
    borderRadius: scaleSize(18),
    shadowColor: colors.shadow,
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
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: scaleSize(50),
  },
  errorText: {
    fontSize: scaleSize(16),
    color: colors.error,
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
    color: colors.textSecondary,
    textAlign: "center",
  },
});

const CategoriesGrid = ({
  searchText = "",
  onCategoryPress,
  onFilteredCountChange,
  showItemsMode = false,
  flatListBottomPadding = 0,
}) => {
  const { t } = useTranslation(); // Add translation hook
  const { currentLanguage } = useLocalization(); // Add localization hook for current language
  const { colors } = useThemedStyles(); // Add themed styles hook
  const styles = getCategoriesGridStyles(colors); // Generate dynamic styles
  const [refreshing, setRefreshing] = useState(false);
  
  const { user } = useAuth();
  const { categories, loading: categoriesLoading, error: categoriesError, refetch: refetchCategories } = useCategories();
  const { items: allItems, loading: itemsLoading, error: itemsError, refetch: refetchItems } = useAllItems();
  
  // Determine which data source to use based on mode
  const loading = showItemsMode ? itemsLoading : categoriesLoading;
  const error = showItemsMode ? itemsError : categoriesError;
  
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (showItemsMode) {
        await refetchItems();
      } else {
        await refetchCategories();
      }
    } finally {
      setRefreshing(false);
    }
  };
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
  
  const [pendingOperations, setPendingOperations] = useState({});

  // Sync stock data when items are loaded
  useEffect(() => {
    if (allItems && allItems.length > 0) {
      syncItemsStock(allItems);
    }
  }, [allItems, syncItemsStock]);

  const handleManualInput = async (item, value) => {
    if (!item) return;

    const normalizedItem = normalizeItemData(item);

    // Use translated name in messages (scope by categoryName when available)
    const translatedItemName = getTranslatedName(t, normalizedItem?.name, 'subcategories', { categoryName: normalizedItem?.categoryName, currentLanguage });

    // Validate minimum quantity based on measurement unit
    if (value > 0) {
      if (normalizedItem.measurement_unit === 1 && value < 0.25) {
        showCartMessage(CartMessageTypes.INVALID_QUANTITY, {
          itemName: translatedItemName,
          measurementUnit: normalizedItem.measurement_unit,
          isBuyer: user?.role === "buyer",
          t
        });
        return;
      } else if (normalizedItem.measurement_unit === 2 && value < 1) {
        showCartMessage(CartMessageTypes.INVALID_QUANTITY, {
          itemName: translatedItemName,
          measurementUnit: normalizedItem.measurement_unit,
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
        showMaxStockMessage(
          translatedItemName,
          stockQuantity,
          normalizedItem.measurement_unit,
          t
        );
        return;
      }
    }

    const itemKey = getCartKey(item);
    setPendingOperations((prev) => ({ ...prev, [itemKey]: "manualInput" }));

    try {
      await handleSetQuantity(item, value);
    } catch (_err) {
      showCartMessage(CartMessageTypes.OPERATION_FAILED, {
        itemName: translatedItemName,
        measurementUnit: normalizedItem.measurement_unit,
        isBuyer: user?.role === "buyer",
        t
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
      // Use fresh items data from useAllItems() instead of embedded items in categories
      const items = allItems
        .filter(item => item && item.name)
        .map((item) => {
          try {
            const normalizedItem = normalizeItemData({
              ...item,
              categoryId: item.categoryId,
              categoryName: item.categoryName,
            });
            
            // Add translated names to the normalized item with error handling
            const translatedItemName = getTranslatedName(t, normalizedItem.name, 'subcategories', { 
              categoryName: normalizedItem.categoryName, 
              currentLanguage 
            }) || extractNameFromMultilingual(normalizedItem.name, currentLanguage) || 'Unknown Item';
            
            const translatedCategoryName = getTranslatedName(t, normalizedItem.categoryName, 'categories', { 
              currentLanguage 
            }) || extractNameFromMultilingual(normalizedItem.categoryName, currentLanguage) || 'Unknown Category';
            
            const itemKey = getCartKey(normalizedItem);
            const cartQuantity = cartItems[itemKey] || 0;
            
            // Get real-time stock quantity
            const realTimeStock = getItemStock(normalizedItem._id);
            const stockQuantity = realTimeStock > 0 ? realTimeStock : (normalizedItem.quantity || 0);
            
            return {
              ...normalizedItem,
              quantity: stockQuantity, // Use real-time stock quantity
              displayName: translatedItemName, // Add display name for UI
              translatedCategoryName: translatedCategoryName, // Add translated category name
              cartQuantity,
              stockUpdated: wasRecentlyUpdated(normalizedItem._id), // Flag for UI feedback
            };
          } catch (error) {
            console.warn('Error processing item:', error, item);
            return null;
          }
        })
        .filter(Boolean)
        .filter((item) => {
          if (!item || !item.displayName) return false;
          
          // Extract original name safely for additional search
          const originalItemName = extractNameFromMultilingual(item.name, currentLanguage) || '';
          const originalCategoryName = extractNameFromMultilingual(item.categoryName, currentLanguage) || '';
          
          // Search in both translated and original names
          return item.displayName.toLowerCase().includes(searchLower) ||
                 originalItemName.toLowerCase().includes(searchLower) ||
                 originalCategoryName.toLowerCase().includes(searchLower) ||
                 (item.translatedCategoryName && item.translatedCategoryName.toLowerCase().includes(searchLower));
        });

      return { filteredCategories: [], filteredItems: items };
    } else {
      const cats = categories
        .filter(category => category && category.name)
        .map(category => {
          try {
            return {
              ...category,
              displayName: getTranslatedName(t, category.name, 'categories', { currentLanguage }) ||
                          extractNameFromMultilingual(category.name, currentLanguage) ||
                          'Unknown Category'
            };
          } catch (error) {
            console.warn('Error processing category:', error, category);
            return null;
          }
        })
        .filter(Boolean)
        .filter((category) => {
          if (!category || !category.displayName) return false;
          
          // Extract original name safely for additional search
          const originalCategoryName = extractNameFromMultilingual(category.name, currentLanguage) || '';
          
          // Search in both translated and original names
          return category.displayName.toLowerCase().includes(searchLower) ||
                 originalCategoryName.toLowerCase().includes(searchLower);
        });
      return { filteredCategories: cats, filteredItems: [] };
    }
  }, [categories, allItems, showItemsMode, searchText, cartItems, t, currentLanguage, getItemStock, wasRecentlyUpdated]);

  const handleCartOperation = useCallback(
    async (item, operation) => {
      const itemKey = getCartKey(item);
      if (pendingOperations[itemKey]) return;

      // Get normalized item data
      const normalizedItem = normalizeItemData(item);
      const translatedItemName = getTranslatedName(t, normalizedItem?.name, 'subcategories', { categoryName: normalizedItem?.categoryName, currentLanguage });
      
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

        // Show toast instantly before async operation with translated name
        if (operation === "increase") {
          showCartMessage(CartMessageTypes.ADD_SINGLE, {
            itemName: translatedItemName,
            quantity: step,
            measurementUnit: normalizedItem.measurement_unit,
            isBuyer: user?.role === "buyer",
            t
          });
        } else if (operation === "decrease") {
          showCartMessage(CartMessageTypes.REMOVE_SINGLE, {
            itemName: translatedItemName,
            quantity: step,
            measurementUnit: normalizedItem.measurement_unit,
            remainingQuantity: Math.max(0, (item.cartQuantity || 0) - step),
            isBuyer: user?.role === "buyer",
            t
          });
        } else if (operation === "fastIncrease") {
          showCartMessage(CartMessageTypes.ADD_FAST, {
            itemName: translatedItemName,
            quantity: step,
            measurementUnit: normalizedItem.measurement_unit,
            isBuyer: user?.role === "buyer",
            t
          });
        } else if (operation === "fastDecrease") {
          showCartMessage(CartMessageTypes.REMOVE_FAST, {
            itemName: translatedItemName,
            quantity: step,
            measurementUnit: normalizedItem.measurement_unit,
            remainingQuantity: Math.max(0, (item.cartQuantity || 0) - step),
            isBuyer: user?.role === "buyer",
            t
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
              // Show unified stock error message with real-time stock quantity
              const currentStock = getItemStock(item._id);
              const stockQuantity = currentStock > 0 ? currentStock : (item.quantity || 0);
              showMaxStockMessage(
                translatedItemName,
                stockQuantity,
                normalizedItem.measurement_unit,
                t
              );
            }
          }
        }
      } catch (err) {
        console.error(`[CategoriesGrid] Error ${operation} quantity:`, err);
        showCartMessage(CartMessageTypes.OPERATION_FAILED, {
          itemName: translatedItemName,
          measurementUnit: normalizedItem.measurement_unit,
          isBuyer: user?.role === "buyer",
          t
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
      t,
      currentLanguage,
      getItemStock,
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
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('common.loading', 'Loading categories...')}</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{t('common.error', 'Error')}: {error}</Text>
      </View>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{t('categories.noCategories', 'No categories available')}</Text>
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
                item={{
                  ...item,
                  // Pass the display name to ItemCard so it shows translated text
                  name: item.displayName || item.name
                }}
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
                        t('cart.outOfStock', 'This item is out of stock.'),
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
                        t('cart.notEnoughStock', 'Not enough quantity in stock to add this item.'),
                        1200,
                        "error"
                      );
                      return;
                    }
                    // Check if adding would exceed stock quantity
                    const step = getIncrementStep(item.measurement_unit);
                    // Get real-time stock quantity
                    const currentStock = getItemStock(item._id);
                    const stockQuantity = currentStock > 0 ? currentStock : item.quantity;
                    const remainingStock = stockQuantity - cartQuantity;
                    
                    console.log("[CategoriesGrid] Stock check:", {
                      itemName: item.displayName || item?.name || 'Item',
                      totalStock: stockQuantity,
                      cartQuantity,
                      remainingStock,
                      step,
                      wouldExceed:
                        remainingStock < step ||
                        cartQuantity + step > stockQuantity,
                    });
                    if (
                      remainingStock < step ||
                      cartQuantity + step > stockQuantity
                    ) {
                      const maxMsg = t('cart.maxStock', 'You cannot add more. Only {{quantity}} in stock.', { quantity: stockQuantity });
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
                        t('cart.notEnoughStock', 'Not enough quantity in stock to add this item.'),
                        1200,
                        "error"
                      );
                      return;
                    }
                    // Check if adding 5 would exceed stock quantity
                    const fastStep = 5;
                    // Get real-time stock quantity
                    const currentStock = getItemStock(item._id);
                    const stockQuantity = currentStock > 0 ? currentStock : item.quantity;
                    const remainingStock = stockQuantity - cartQuantity;
                    
                    console.log("[CategoriesGrid] Fast stock check:", {
                      itemName: item.displayName || item.name,
                      totalStock: stockQuantity,
                      cartQuantity,
                      remainingStock,
                      fastStep,
                      wouldExceed:
                        remainingStock < fastStep ||
                        cartQuantity + fastStep > stockQuantity,
                    });
                    if (
                      remainingStock < fastStep ||
                      cartQuantity + fastStep > stockQuantity
                    ) {
                      const maxMsg = t('cart.maxStock', 'You cannot add more. Only {{quantity}} in stock.', { quantity: stockQuantity });
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
          extraScrollHeight={70}
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
              category={{
                ...category,
                // Pass the display name to CategoryCard so it shows translated text
                name: category.displayName || category.name
              }}
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

export default CategoriesGrid;
