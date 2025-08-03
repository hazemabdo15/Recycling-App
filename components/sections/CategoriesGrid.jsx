import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useCategories } from "../../hooks/useAPI";
import { useCart } from "../../hooks/useCart";
import { spacing } from "../../styles";
import { getCartKey, getIncrementStep, normalizeItemData } from "../../utils/cartUtils";
import { getLabel, isBuyer } from "../../utils/roleLabels";
import { scaleSize } from '../../utils/scale';
import { isMaxStockReached, isOutOfStock } from '../../utils/stockUtils';
import { CategoryCard } from "../cards";
import { ItemCard } from "../category";
import { FadeInView } from "../common";
import { showGlobalToast } from "../common/GlobalToast";

const CategoriesGrid = ({
  searchText = "",
  onCategoryPress,
  onFilteredCountChange,
  showItemsMode = false,
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const { refetch } = require('../../hooks/useAPI').useAllItems();
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
    
    // Only check stock for buyer users
    if (isBuyer(user) && value > item.quantity) {
      showGlobalToast(`Not enough stock. Only ${item.quantity} available.`, 2000, 'error');
      return;
    }
    
    const itemKey = getCartKey(item);
    setPendingOperations((prev) => ({ ...prev, [itemKey]: "manualInput" }));
    
    try {
      await handleSetQuantity(item, value);
    } catch (_err) {
      showGlobalToast("Failed to set quantity", 2000, "error");
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
        .flatMap((category) =>
          category.items?.map((item) => {
            const normalizedItem = normalizeItemData({
              ...item,
              categoryId: item.categoryId || category._id,
              categoryName: item.categoryName || category.name,
              category: category
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
        .filter((item) => item.name.toLowerCase().includes(searchLower));

      return { filteredCategories: [], filteredItems: items };
    } else {
      const cats = categories.filter((category) =>
        category.name.toLowerCase().includes(searchLower)
      );
      return { filteredCategories: cats, filteredItems: [] };
    }
  }, [categories, showItemsMode, searchText, cartItems]);

  const handleCartOperation = useCallback(async (item, operation) => {
    const itemKey = getCartKey(item);
    if (pendingOperations[itemKey]) return;

    // Show toast instantly for all actions
    const normalizedItem = normalizeItemData(item);
    const step = operation.includes('fast') ? 5 : getIncrementStep(normalizedItem.measurement_unit);
    const unit = normalizedItem.measurement_unit === 1 ? "kg" : "";
    if (operation.includes('increase')) {
      if (operation === 'increase' || operation === 'fastIncrease') {
        showGlobalToast(
          `Added ${step}${unit} ${item.name || "item"} ${getLabel('addToPickup', user?.role)}`,
          1200,
          "success"
        );
      }
    } else {
      const remainingQuantity = item.quantity - step;
      if (remainingQuantity > 0) {
        showGlobalToast(
          `Reduced ${item.name || "item"} by ${step}${unit}`,
          1200,
          "success"
        );
      } else {
        showGlobalToast(
          `Removed ${item.name || "item"} from pickup`,
          1200,
          "info"
        );
      }
    }

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

      let increaseResult;
      switch (operation) {
        case 'increase':
          increaseResult = await handleIncreaseQuantity(item, showGlobalToast);
          break;
        case 'decrease':
          await handleDecreaseQuantity(item);
          break;
        case 'fastIncrease':
          increaseResult = await handleFastIncreaseQuantity(item, showGlobalToast);
          break;
        case 'fastDecrease':
          await handleFastDecreaseQuantity(item);
          break;
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }

      if (operation.includes('increase')) {
        if (operation === 'increase' || operation === 'fastIncrease') {
          if (increaseResult === false) {
            // Show maxStock toast if add was blocked by backend
            const maxMsg = `You cannot add more. Only ${item.quantity} in stock.`;
            console.log('[CategoriesGrid] Backend blocked operation, showing toast:', maxMsg);
            showGlobalToast(maxMsg, 1000, "error");
          }
        }
      }
    } catch (err) {
      console.error(`[CategoriesGrid] Error ${operation} quantity:`, err);
      const errorMessage = operation.includes('increase') 
        ? `Failed to add item ${getLabel('addToPickup', user?.role)}` 
        : "Failed to update item quantity";
      showGlobalToast(errorMessage, 2000, "error");
    } finally {
      clearTimeout(timeoutId);
      setPendingOperations((prev) => {
        const newState = { ...prev };
        delete newState[itemKey];
        return newState;
      });
    }
  }, [handleIncreaseQuantity, handleDecreaseQuantity, handleFastIncreaseQuantity, handleFastDecreaseQuantity, pendingOperations, user?.role]);

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
        <FlatList
          style={styles.itemsScrollContainer}
          data={filteredItems}
          keyExtractor={(item) => getCartKey(item) || `${item.name}`}
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
                      showGlobalToast('This item is out of stock.', 1000, "error");
                    }
                    return;
                  }
                  
                  // Only block add based on stock for buyer users
                  if (isBuyer(user)) {
                    // Block add if stock is less than minimum required (0.25 for kg, 1 for pieces)
                    const isKg = item.measurement_unit === 1;
                    const minStockRequired = isKg ? 0.25 : 1;
                    if (typeof item.quantity === 'number' && item.quantity < minStockRequired) {
                      showGlobalToast('Not enough quantity in stock to add this item.', 1000, "error");
                      return;
                    }
                    // Check if adding would exceed stock quantity
                    const step = getIncrementStep(item.measurement_unit);
                    const remainingStock = item.quantity - cartQuantity;
                    console.log('[CategoriesGrid] Stock check:', {
                      itemName: item.name,
                      totalStock: item.quantity,
                      cartQuantity,
                      remainingStock,
                      step,
                      wouldExceed: remainingStock < step || cartQuantity + step > item.quantity
                    });
                    if (remainingStock < step || cartQuantity + step > item.quantity) {
                      const maxMsg = `You cannot add more. Only ${item.quantity} in stock.`;
                      console.log('[CategoriesGrid] Showing maxStock toast:', maxMsg);
                      showGlobalToast(maxMsg, 1000, "error");
                      return;
                    }
                  }
                  await handleCartOperation(item, 'increase');
                }}
                onDecrease={() => handleCartOperation(item, 'decrease')}
                onFastIncrease={async () => {
                  // Only apply stock limitations for buyer users
                  if (isBuyer(user)) {
                    const isKg = item.measurement_unit === 1;
                    // Block add if stock is less than minimum required (0.25 for kg, 1 for pieces)
                    const minStockRequired = isKg ? 0.25 : 1;
                    if (typeof item.quantity === 'number' && item.quantity < minStockRequired) {
                      showGlobalToast('Not enough quantity in stock to add this item.', 1000, "error");
                      return;
                    }
                    // Check if adding 5 would exceed stock quantity
                    const fastStep = 5;
                    const remainingStock = item.quantity - cartQuantity;
                    console.log('[CategoriesGrid] Fast stock check:', {
                      itemName: item.name,
                      totalStock: item.quantity,
                      cartQuantity,
                      remainingStock,
                      fastStep,
                      wouldExceed: remainingStock < fastStep || cartQuantity + fastStep > item.quantity
                    });
                    if (remainingStock < fastStep || cartQuantity + fastStep > item.quantity) {
                      const maxMsg = `You cannot add more. Only ${item.quantity} in stock.`;
                      console.log('[CategoriesGrid] Showing fast maxStock toast:', maxMsg);
                      showGlobalToast(maxMsg, 1000, "error");
                      return;
                    }
                  }
                  await handleCartOperation(item, 'fastIncrease');
                }}
                onFastDecrease={() => handleCartOperation(item, 'fastDecrease')}
              />
            );
          }}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          contentContainerStyle={styles.itemsList}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          <View style={styles.categoriesGrid}>
            {filteredCategories.map((category, index) => (
              <CategoryCard
                key={category._id}
                category={category}
                onPress={() => handleCategoryPress(category)}
                style={styles.categoryCard}
              />
            ))}
          </View>
        </ScrollView>
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
    backgroundColor: '#fff',
    borderRadius: scaleSize(18),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scaleSize(3) },
    shadowOpacity: 0.10,
    shadowRadius: scaleSize(30),
    elevation: 50,
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
