import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useCategories } from "../../hooks/useAPI";
import { useCart } from "../../hooks/useCart";
import { useToast } from "../../hooks/useToast";
import { spacing } from "../../styles";
import { getIncrementStep, normalizeItemData } from "../../utils/cartUtils";
import { CategoryCard } from "../cards";
import { ItemCard } from "../category";
import { FadeInView } from "../common";

const CategoriesGrid = ({
  searchText = "",
  onCategoryPress,
  onFilteredCountChange,
  showItemsMode = false,
}) => {
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

  let filteredCategories = [];
  let filteredItems = [];

  if (showItemsMode) {

    filteredItems = categories
      .flatMap(
        (category) =>
          category.items?.map((item) => {
            const normalizedItem = normalizeItemData(item);
            const quantity = cartItems[normalizedItem.categoryId] || 0;
            return {
              ...normalizedItem,
              quantity,
              category: category,
            };
          }) || []
      )
      .filter((item) =>
        item.name.toLowerCase().includes(searchText.toLowerCase())
      );
  } else {
    filteredCategories = categories.filter((category) =>
      category.name.toLowerCase().includes(searchText.toLowerCase())
    );
  }

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
              const itemPendingAction = pendingOperations[item.categoryId];
              return (
                <ItemCard
                  key={item.categoryId || `${item.name}-${index}`}
                  item={item}
                  quantity={item.quantity}
                  index={index}
                  disabled={!!itemPendingAction}
                  pendingAction={itemPendingAction}
                  onIncrease={async () => {
                    if (itemPendingAction) return;

                    const timeoutId = setTimeout(() => {
                      setPendingOperations((prev) => {
                        const newState = { ...prev };
                        delete newState[item.categoryId];
                        return newState;
                      });
                    }, 2000);

                    try {
                      setPendingOperations((prev) => ({
                        ...prev,
                        [item.categoryId]: "increase",
                      }));
                      await handleIncreaseQuantity(item);

                      const normalizedItem = normalizeItemData(item);
                      const step = getIncrementStep(
                        normalizedItem.measurement_unit
                      );
                      const unit =
                        normalizedItem.measurement_unit === 1 ? "kg" : "";
                      showSuccess(
                        `Added ${step}${unit} ${item.name || "item"} to pickup`,
                        2500
                      );
                    } catch (err) {
                      console.error(
                        "[CategoriesGrid] Error increasing quantity:",
                        err
                      );
                      showError("Failed to add item to pickup");
                    } finally {
                      clearTimeout(timeoutId);
                      setPendingOperations((prev) => {
                        const newState = { ...prev };
                        delete newState[item.categoryId];
                        return newState;
                      });
                    }
                  }}
                  onDecrease={async () => {
                    if (itemPendingAction) return;

                    const timeoutId = setTimeout(() => {
                      setPendingOperations((prev) => {
                        const newState = { ...prev };
                        delete newState[item.categoryId];
                        return newState;
                      });
                    }, 2000);

                    try {
                      setPendingOperations((prev) => ({
                        ...prev,
                        [item.categoryId]: "decrease",
                      }));
                      await handleDecreaseQuantity(item);

                      const normalizedItem = normalizeItemData(item);
                      const step = getIncrementStep(
                        normalizedItem.measurement_unit
                      );
                      const unit =
                        normalizedItem.measurement_unit === 1 ? "kg" : "";
                      if (item.quantity > step) {
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
                    } catch (err) {
                      console.error(
                        "[CategoriesGrid] Error decreasing quantity:",
                        err
                      );
                      showError("Failed to update item quantity");
                    } finally {
                      clearTimeout(timeoutId);
                      setPendingOperations((prev) => {
                        const newState = { ...prev };
                        delete newState[item.categoryId];
                        return newState;
                      });
                    }
                  }}
                  onFastIncrease={async () => {
                    if (itemPendingAction) return;

                    const timeoutId = setTimeout(() => {
                      setPendingOperations((prev) => {
                        const newState = { ...prev };
                        delete newState[item.categoryId];
                        return newState;
                      });
                    }, 2000);

                    try {
                      setPendingOperations((prev) => ({
                        ...prev,
                        [item.categoryId]: "fastIncrease",
                      }));
                      await handleFastIncreaseQuantity(item);

                      const normalizedItem = normalizeItemData(item);
                      const unit =
                        normalizedItem.measurement_unit === 1 ? "kg" : "";
                      showSuccess(
                        `Added 5${unit} ${item.name || "items"} to pickup`,
                        2500
                      );
                    } catch (err) {
                      console.error(
                        "[CategoriesGrid] Error fast increasing quantity:",
                        err
                      );
                      showError("Failed to add items to pickup");
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

                    const timeoutId = setTimeout(() => {
                      setPendingOperations((prev) => {
                        const newState = { ...prev };
                        delete newState[item.categoryId];
                        return newState;
                      });
                    }, 2000);

                    try {
                      setPendingOperations((prev) => ({
                        ...prev,
                        [item.categoryId]: "fastDecrease",
                      }));
                      await handleFastDecreaseQuantity(item);

                      const normalizedItem = normalizeItemData(item);
                      const unit =
                        normalizedItem.measurement_unit === 1 ? "kg" : "";
                      const remainingQuantity = item.quantity - 5;
                      if (remainingQuantity > 0) {
                        showSuccess(
                          `Reduced ${item.name || "item"} by 5${unit}`,
                          2000
                        );
                      } else {
                        showSuccess(
                          `Removed ${item.name || "item"} from pickup`,
                          2000
                        );
                      }
                    } catch (err) {
                      console.error(
                        "[CategoriesGrid] Error fast decreasing quantity:",
                        err
                      );
                      showError("Failed to update item quantity");
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
    paddingBottom: 40,
    paddingHorizontal: 5,
    backgroundColor: "transparent",
  },
  itemsScrollContainer: {
    paddingBottom: 5,
    paddingHorizontal: spacing.sm,
    backgroundColor: "transparent",
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    backgroundColor: "transparent",
  },
  itemsList: {
    gap: 16,
    backgroundColor: "transparent",
  },
  categoryCard: {
    width: "48%",
    marginBottom: 15,
    backgroundColor: '#fff',
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  errorText: {
    fontSize: 16,
    color: "#F44336",
    textAlign: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});
export default CategoriesGrid;
