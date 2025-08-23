import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from 'react-i18next'; // Add this import
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
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
    paddingHorizontal: scaleSize(20),
  },
  errorText: {
    fontSize: scaleSize(16),
    color: colors.error,
    textAlign: "center",
    marginBottom: scaleSize(20),
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: scaleSize(20),
    paddingVertical: scaleSize(12),
    borderRadius: scaleSize(8),
  },
  retryButtonText: {
    color: colors.white,
    fontSize: scaleSize(14),
    fontWeight: '600',
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
  // const [rerenderKey, setRerenderKey] = useState(0); // Force re-render key
  
  // Track pending operations to prevent spam clicking
  const [pendingOperations, setPendingOperations] = useState(new Map());
  
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
    stockQuantities, // Add real-time stock data
  } = useStockManager();
  
  // Sync stock data when items are loaded
  useEffect(() => {
    if (allItems && allItems.length > 0) {
      syncItemsStock(allItems);
    }
  }, [allItems, syncItemsStock]);

  const handleManualInput = useCallback(async (item, value) => {
    if (!item) return;

    const normalizedItem = normalizeItemData(item);

    // Use translated name in messages (scope by categoryName when available)
    const translatedItemName = getTranslatedName(t, normalizedItem?.name, 'subcategories', { categoryName: normalizedItem?.categoryName, currentLanguage });

    // For pieces (measurement_unit === 2), round fractional values to nearest integer
    if (normalizedItem.measurement_unit === 2 && value !== Math.floor(value)) {
      value = Math.round(value);
      console.log("Rounded fractional value for pieces to:", value);
    }

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
    }
  }, [t, currentLanguage, user, getItemStock, handleSetQuantity]);

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
            
            // Get real-time stock quantity
            const stockQuantity = stockQuantities[normalizedItem._id] ?? normalizedItem.quantity ?? 0;
            
            return {
              ...normalizedItem,
              quantity: stockQuantity, // Use real-time stock quantity
              displayName: translatedItemName, // Add display name for UI
              translatedCategoryName: translatedCategoryName, // Add translated category name
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
  }, [categories, allItems, showItemsMode, searchText, t, currentLanguage, stockQuantities, wasRecentlyUpdated]);

  // Memoize items with cart quantities separately for better performance
  const itemsWithCartQuantities = useMemo(() => {
    return filteredItems.map((item) => {
      const itemKey = getCartKey(item);
      const cartQuantity = cartItems[itemKey] || 0;
      
      return {
        ...item,
        cartQuantity,
      };
    });
  }, [filteredItems, cartItems]);

  useEffect(() => {
    if (onFilteredCountChange) {
      if (showItemsMode) {
        onFilteredCountChange(itemsWithCartQuantities.length);
      } else {
        onFilteredCountChange(filteredCategories.length);
      }
    }
  }, [
    filteredCategories.length,
    itemsWithCartQuantities.length,
    onFilteredCountChange,
    showItemsMode,
  ]);
  
  const handleCategoryPress = (categoryOrItem) => {
    if (onCategoryPress) {
      onCategoryPress(categoryOrItem);
    }
  };

  // Memoized render function for better performance with large lists
  const renderItemCard = useCallback(({ item, index }) => {
    const itemKey = getCartKey(item);
    // Use cartQuantity from the item (already calculated in itemsWithCartQuantities)
    const cartQuantity = item.cartQuantity;
    
    // Debug logging to verify this function is being used
    console.log(`[CategoriesGrid] renderItemCard called for ${item.name}: quantity=${cartQuantity}`);

    // Only apply stock validation for buyer users
    let maxReached = false;
    let outOfStock = false;
    if (isBuyer(user)) {
      const stockUtils = require("../../utils/stockUtils");
      const {
        isOutOfStock,
        isMaxStockReached,
      } = stockUtils;
      
      maxReached = isMaxStockReached(item, cartQuantity);
      outOfStock = isOutOfStock(item);
    }

    // Check if this item has pending operations
    const hasPendingOperation = pendingOperations.has(itemKey);

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
        disabled={hasPendingOperation}
        pendingAction={hasPendingOperation ? pendingOperations.get(itemKey) : null}
        maxReached={maxReached}
        outOfStock={outOfStock}
        user={user}
        onManualInput={(val) => handleManualInput(item, val)}
        onIncrease={async () => {
          // Prevent spam clicking
          if (pendingOperations.has(itemKey)) {
            console.log(`[CategoriesGrid] Blocking rapid click for ${item.name} - operation pending`);
            return;
          }

          // Set pending operation
          setPendingOperations(prev => new Map(prev).set(itemKey, 'increase'));

          // Pre-compute values for instant feedback
          const normalizedItem = normalizeItemData(item);
          const step = getIncrementStep(normalizedItem.measurement_unit);
          const translatedItemName = getTranslatedName(t, normalizedItem?.name, 'subcategories', { 
            categoryName: normalizedItem?.categoryName, 
            currentLanguage 
          });

          // Quick pre-checks for immediate feedback - prevent spam clicking on out of stock items
          if (isBuyer(user) && outOfStock) {
            showGlobalToast(
              t('cart.outOfStock', 'This item is out of stock.'),
              1200,
              "error"
            );
            // Clear pending operation
            setPendingOperations(prev => {
              const newMap = new Map(prev);
              newMap.delete(itemKey);
              return newMap;
            });
            return;
          }

          // Additional comprehensive stock validation for buyer users
          if (isBuyer(user)) {
            const currentStock = getItemStock(item._id);
            const stockQuantity = currentStock > 0 ? currentStock : item.quantity;
            const currentCartQuantity = cartQuantity;
            const newTotalQuantity = currentCartQuantity + step;

            // Check if adding step would exceed available stock
            if (newTotalQuantity > stockQuantity) {
              showMaxStockMessage(
                translatedItemName,
                stockQuantity,
                normalizedItem.measurement_unit,
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

          // Show success toast IMMEDIATELY for instant feedback (only after stock checks pass)
          showCartMessage(CartMessageTypes.ADD_SINGLE, {
            itemName: translatedItemName,
            quantity: step,
            measurementUnit: normalizedItem.measurement_unit,
            isBuyer: user?.role === "buyer",
            t
          });

          try {
            // Direct cart operation for better performance
            const addResult = await handleIncreaseQuantity(item);
            
            if (addResult === false) {
              // Show stock error message
              const currentStock = getItemStock(item._id);
              const stockQuantity = currentStock > 0 ? currentStock : item.quantity;
              showMaxStockMessage(
                translatedItemName,
                stockQuantity,
                normalizedItem.measurement_unit,
                t
              );
            }
          } catch (err) {
            console.error("[CategoriesGrid] Error increasing quantity:", err);
            showCartMessage(CartMessageTypes.OPERATION_FAILED, {
              itemName: translatedItemName,
              measurementUnit: normalizedItem.measurement_unit,
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
          // Pre-compute values for instant feedback
          const normalizedItem = normalizeItemData(item);
          const step = getIncrementStep(normalizedItem.measurement_unit);
          const remainingQuantity = cartQuantity - step;
          const translatedItemName = getTranslatedName(t, normalizedItem?.name, 'subcategories', { 
            categoryName: normalizedItem?.categoryName, 
            currentLanguage 
          });

          // Show success toast IMMEDIATELY for instant feedback
          if (remainingQuantity > 0) {
            showCartMessage(CartMessageTypes.REMOVE_SINGLE, {
              itemName: translatedItemName,
              quantity: step,
              measurementUnit: normalizedItem.measurement_unit,
              remainingQuantity: remainingQuantity,
              isBuyer: user?.role === "buyer",
              t
            });
          } else {
            showCartMessage(CartMessageTypes.ITEM_REMOVED, {
              itemName: translatedItemName,
              measurementUnit: normalizedItem.measurement_unit,
              isBuyer: user?.role === "buyer",
              t
            });
          }

          try {
            // Direct cart operation for better performance
            await handleDecreaseQuantity(item);
          } catch (err) {
            console.error("[CategoriesGrid] Error decreasing quantity:", err);
            showCartMessage(CartMessageTypes.OPERATION_FAILED, {
              itemName: translatedItemName,
              measurementUnit: normalizedItem.measurement_unit,
              isBuyer: user?.role === "buyer",
              t
            });
          }
        }}
        onFastIncrease={async () => {
          // Prevent spam clicking
          if (pendingOperations.has(itemKey)) {
            console.log(`[CategoriesGrid] Blocking rapid click for ${item.name} - fast operation pending`);
            return;
          }

          // Set pending operation
          setPendingOperations(prev => new Map(prev).set(itemKey, 'fastIncrease'));

          // Pre-compute values for instant feedback
          const normalizedItem = normalizeItemData(item);
          const fastStep = 5;
          const translatedItemName = getTranslatedName(t, normalizedItem?.name, 'subcategories', { 
            categoryName: normalizedItem?.categoryName, 
            currentLanguage 
          });

          // Quick pre-checks for immediate feedback - block spam clicking on 0 quantity items
          if (isBuyer(user) && outOfStock) {
            showGlobalToast(
              t('cart.outOfStock', 'This item is out of stock.'),
              1200,
              "error"
            );
            // Clear pending operation
            setPendingOperations(prev => {
              const newMap = new Map(prev);
              newMap.delete(itemKey);
              return newMap;
            });
            return;
          }

          // Additional comprehensive stock validation for buyer users
          if (isBuyer(user)) {
            const currentStock = getItemStock(item._id);
            const stockQuantity = currentStock > 0 ? currentStock : item.quantity;
            const currentCartQuantity = cartQuantity;
            const newTotalQuantity = currentCartQuantity + fastStep;

            // Check if adding fast step would exceed available stock
            if (newTotalQuantity > stockQuantity) {
              showMaxStockMessage(
                translatedItemName,
                stockQuantity,
                normalizedItem.measurement_unit,
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

            // Check minimum stock requirements
            const isKg = item.measurement_unit === 1;
            const minStockRequired = isKg ? 0.25 : 1;
            if (
              typeof stockQuantity === "number" &&
              stockQuantity < minStockRequired
            ) {
              showGlobalToast(
                t('cart.notEnoughStock', 'Not enough quantity in stock to add this item.'),
                1200,
                "error"
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

          // Show success toast IMMEDIATELY for instant feedback (only after stock checks pass)
          showCartMessage(CartMessageTypes.ADD_FAST, {
            itemName: translatedItemName,
            quantity: fastStep,
            measurementUnit: normalizedItem.measurement_unit,
            isBuyer: user?.role === "buyer",
            t
          });

          try {
            // Direct cart operation for better performance
            const addResult = await handleFastIncreaseQuantity(item);
            
            if (addResult === false) {
              // Show stock error message
              const currentStock = getItemStock(item._id);
              const stockQuantity = currentStock > 0 ? currentStock : item.quantity;
              showMaxStockMessage(
                translatedItemName,
                stockQuantity,
                normalizedItem.measurement_unit,
                t
              );
            }
          } catch (err) {
            console.error("[CategoriesGrid] Error fast increasing quantity:", err);
            showCartMessage(CartMessageTypes.OPERATION_FAILED, {
              itemName: translatedItemName,
              measurementUnit: normalizedItem.measurement_unit,
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
          // Pre-compute values for instant feedback
          const normalizedItem = normalizeItemData(item);
          const fastStep = 5;
          const remainingQuantity = Math.max(0, cartQuantity - fastStep);
          const translatedItemName = getTranslatedName(t, normalizedItem?.name, 'subcategories', { 
            categoryName: normalizedItem?.categoryName, 
            currentLanguage 
          });

          // Show success toast IMMEDIATELY for instant feedback
          showCartMessage(CartMessageTypes.REMOVE_FAST, {
            itemName: translatedItemName,
            quantity: fastStep,
            measurementUnit: normalizedItem.measurement_unit,
            remainingQuantity: remainingQuantity,
            isBuyer: user?.role === "buyer",
            t
          });

          try {
            // Direct cart operation for better performance
            await handleFastDecreaseQuantity(item);
          } catch (err) {
            console.error("[CategoriesGrid] Error fast decreasing quantity:", err);
            showCartMessage(CartMessageTypes.OPERATION_FAILED, {
              itemName: translatedItemName,
              measurementUnit: normalizedItem.measurement_unit,
              isBuyer: user?.role === "buyer",
              t
            });
          }
        }}
      />
    );
  }, [user, t, currentLanguage, getItemStock, handleIncreaseQuantity, handleDecreaseQuantity, handleFastIncreaseQuantity, handleFastDecreaseQuantity, handleManualInput, pendingOperations, setPendingOperations]);
  
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
        <MaterialCommunityIcons 
          name="wifi-off" 
          size={48} 
          color={colors.error} 
          style={{ marginBottom: 16 }}
        />
        <Text style={styles.errorText}>{t('common.error', 'Error')}: {error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={handleRefresh}
          disabled={refreshing}
        >
          <MaterialCommunityIcons 
            name="refresh" 
            size={16} 
            color={colors.white} 
            style={{ marginRight: 8 }}
          />
          <Text style={styles.retryButtonText}>
            {refreshing ? t('common.retrying', 'Retrying...') : t('common.retry', 'Retry')}
          </Text>
        </TouchableOpacity>
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
          data={itemsWithCartQuantities}
          keyExtractor={(item) => getCartKey(item) || `${item?.name || 'unknown'}`}
          renderItem={renderItemCard}
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
          // Performance optimizations for large lists
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={15}
          windowSize={10}
          extraData={`${Object.keys(cartItems).length}-${pendingOperations.size}`}
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
