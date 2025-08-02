import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useCategories } from "../../hooks/useAPI";
import { useCart } from "../../hooks/useCart";
import { useToast } from "../../hooks/useToast";
import { spacing } from "../../styles";
import { getCartKey, getIncrementStep, normalizeItemData } from "../../utils/cartUtils";
import { getLabel } from "../../utils/roleLabels";
import { scaleSize } from '../../utils/scale';
import { CategoryCard } from "../cards";
import { ItemCard } from "../category";
import { FadeInView } from "../common";

const CategoriesGrid = ({
  searchText = "",
  onCategoryPress,
  onFilteredCountChange,
  showItemsMode = false,
}) => {
  const { user } = useAuth();
  const { categories, loading, error } = useCategories();
  const {
    cartItems,
    handleIncreaseQuantity,
    handleDecreaseQuantity,
    handleFastIncreaseQuantity,
    handleFastDecreaseQuantity,
  } = useCart();
  const { showSuccess, showError } = useToast();
  const [pendingOperations, setPendingOperations] = useState({});

  // Optimized: Memoize filtered data to prevent unnecessary re-computations
  const { filteredCategories, filteredItems } = useMemo(() => {
    const searchLower = searchText.toLowerCase();
    
    if (showItemsMode) {
      const items = categories
        .flatMap((category) =>
          category.items?.map((item) => {
            const normalizedItem = normalizeItemData({
              ...item,
              category: category  // Pass category info for proper normalization
            });
            const itemKey = getCartKey(normalizedItem);
            const quantity = cartItems[itemKey] || 0;
            return {
              ...normalizedItem,
              quantity,
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

  // Optimized: Memoize cart operation handler
  const handleCartOperation = useCallback(async (item, operation) => {
    const itemKey = getCartKey(item);
    if (pendingOperations[itemKey]) return;

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

      switch (operation) {
        case 'increase':
          await handleIncreaseQuantity(item);
          break;
        case 'decrease':
          await handleDecreaseQuantity(item);
          break;
        case 'fastIncrease':
          await handleFastIncreaseQuantity(item);
          break;
        case 'fastDecrease':
          await handleFastDecreaseQuantity(item);
          break;
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }

      // Show success message
      const normalizedItem = normalizeItemData(item);
      const step = operation.includes('fast') ? 5 : getIncrementStep(normalizedItem.measurement_unit);
      const unit = normalizedItem.measurement_unit === 1 ? "kg" : "";
      
      if (operation.includes('increase')) {
        showSuccess(
          `Added ${step}${unit} ${item.name || "item"} ${getLabel('addToPickup', user?.role)}`,
          2500
        );
      } else {
        const remainingQuantity = item.quantity - step;
        if (remainingQuantity > 0) {
          showSuccess(
            `Reduced ${item.name || "item"} by ${step}${unit}`,
            2000
          );
        } else {
          showSuccess(
            `Removed ${item.name || "item"} from pickup`,
            2000
          );
        }
      }
    } catch (err) {
      console.error(`[CategoriesGrid] Error ${operation} quantity:`, err);
      const errorMessage = operation.includes('increase') 
        ? `Failed to add item ${getLabel('addToPickup', user?.role)}` 
        : "Failed to update item quantity";
      showError(errorMessage);
    } finally {
      clearTimeout(timeoutId);
      setPendingOperations((prev) => {
        const newState = { ...prev };
        delete newState[itemKey];
        return newState;
      });
    }
  }, [handleIncreaseQuantity, handleDecreaseQuantity, handleFastIncreaseQuantity, handleFastDecreaseQuantity, pendingOperations, showSuccess, showError, user?.role]);

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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          showItemsMode ? styles.itemsScrollContainer : styles.scrollContainer
        }
      >
        {showItemsMode ? (
          <View style={styles.itemsList}>
            {filteredItems.map((item, index) => {
              const itemKey = getCartKey(item);
              const itemPendingAction = pendingOperations[itemKey];
              return (
                <ItemCard
                  key={itemKey || `${item.name}-${index}`}
                  item={item}
                  quantity={item.quantity}
                  index={index}
                  disabled={!!itemPendingAction}
                  pendingAction={itemPendingAction}
                  onIncrease={() => handleCartOperation(item, 'increase')}
                  onDecrease={() => handleCartOperation(item, 'decrease')}
                  onFastIncrease={() => handleCartOperation(item, 'fastIncrease')}
                  onFastDecrease={() => handleCartOperation(item, 'fastDecrease')}
                />
              );
            })}
          </View>
        ) : (
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
        )}
      </ScrollView>
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
    paddingBottom: scaleSize(5),
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
    shadowOffset: { width: 0, height: scaleSize(2) },
    shadowOpacity: 0.10,
    shadowRadius: scaleSize(16),
    elevation: 8,
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
