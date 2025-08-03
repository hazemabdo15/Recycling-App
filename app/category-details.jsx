import { useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, StatusBar, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CategoryHeader, EmptyState, ItemCard } from "../components/category";
import { ErrorState, Loader } from "../components/common";
import { showGlobalToast } from "../components/common/GlobalToast";
import { useAuth } from "../context/AuthContext";
import { useCategoryItems } from "../hooks/useAPI";
import { useCart } from "../hooks/useCart";
import { layoutStyles } from "../styles/components/commonStyles";
import { colors } from "../styles/theme";
import {
  calculateCartStats,
  getCartKey,
  getDisplayKey,
  getIncrementStep,
  normalizeItemData,
} from "../utils/cartUtils";
import { getLabel } from "../utils/roleLabels";

let Animated, useAnimatedStyle, useSharedValue, withSpring, withTiming;

try {
  const reanimated = require("react-native-reanimated");
  Animated = reanimated.default;
  useAnimatedStyle = reanimated.useAnimatedStyle;
  useSharedValue = reanimated.useSharedValue;
  withSpring = reanimated.withSpring;
  withTiming = reanimated.withTiming;
} catch (_error) {
  const { View: RNView } = require("react-native");
  Animated = { View: RNView };
  useAnimatedStyle = () => ({});
  useSharedValue = (value) => ({ value });
  withSpring = (value) => value;
  withTiming = (value) => value;
}

const CategoryDetails = () => {
  const { categoryName } = useLocalSearchParams();
  const navigation = useNavigation();
  const { user } = useAuth();

  const [pendingOperations, setPendingOperations] = useState({});

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const { items, loading, error, refetch } = useCategoryItems(categoryName);
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
  } = useCart();

  const mergedItems = items.map((item) => {
    const needsNormalization =
      !item._id ||
      !item.categoryId ||
      !item.image ||
      item.measurement_unit === undefined;
    const processedItem = needsNormalization ? normalizeItemData(item) : item;
    const itemKey = getCartKey(processedItem);
    const cartQuantity = cartItems[itemKey] || 0;
    return {
      ...processedItem,
      cartQuantity, // this is the quantity in the cart
    };
  });

  const headerOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(50);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 600 });
    contentTranslateY.value = withSpring(0, {
      damping: 15,
      stiffness: 100,
    });
  }, [headerOpacity, contentTranslateY]);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const { totalItems, totalPoints, totalValue } = calculateCartStats(
    mergedItems,
    cartItems
  );

  const handleManualInput = async (itemOrValue, valueMaybe) => {
    console.log('handleManualInput called with:', { itemOrValue, valueMaybe });
    
    // itemOrValue can be item or value depending on call
    let item, value;
    if (typeof valueMaybe === 'undefined') {
      // Called as onManualInput(item)
      item = itemOrValue;
      console.log('Called with just item, returning early');
      return; // Do nothing on just focus/click
    } else {
      // Called as onManualInput(value) from QuantityControls
      item =  itemOrValue;
      value = valueMaybe;
    }
    
    console.log('Processing manual input:', { item: item?.name, value, itemQuantity: item?.quantity });
    
    if (!item) {
      console.log('No item found, returning');
      return;
    }
    // Check stock before setting
    if (value > item.quantity) {
      console.log('Value exceeds stock:', { value, stock: item.quantity });
      showGlobalToast(`Not enough stock. Only ${item.quantity} available.`, 2000, 'error');
      return;
    }
    const itemKey = getCartKey(item);
    setPendingOperations((prev) => ({ ...prev, [itemKey]: "manualInput" }));
    try {
      console.log('Calling handleSetQuantity with:', { item: item.name, value });
      const result = await handleSetQuantity(item, value);
      console.log('handleSetQuantity result:', result);
    } catch (_err) {
      console.log('handleSetQuantity error:', _err);
      showGlobalToast("Failed to set quantity", 2000, "error");
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
    // item.quantity is the stock, item.cartQuantity is the cart
    // Stock logic
    const {
      isOutOfStock,
      isMaxStockReached,
      canAddToCart,
    } = require("../utils/stockUtils");
    const maxReached = isMaxStockReached(item, item.cartQuantity);
    const outOfStock = isOutOfStock(item);
    return (
      <ItemCard
        item={item}
        quantity={item.cartQuantity}
        disabled={!!itemPendingAction}
        pendingAction={itemPendingAction}
        index={index}
        maxReached={maxReached}
        outOfStock={outOfStock}
        onManualInput={(val) => handleManualInput(item, val)}
        onIncrease={async () => {
          if (itemPendingAction || maxReached || outOfStock) {
            if (maxReached) {
              const maxMsg = `You cannot add more. Only ${item.quantity} in stock.`;
              showGlobalToast(maxMsg, 1000, "error");
            }
            if (outOfStock) {
              showGlobalToast("This item is out of stock.", 2000, "error");
            }
            return;
          }
          // Show toast instantly
          const normalizedItem = normalizeItemData(item);
          const step = getIncrementStep(normalizedItem.measurement_unit);
          const unit = normalizedItem.measurement_unit === 1 ? "kg" : "";
          const displayQuantity = step;
          const message = getLabel(
            "categoryToastMessages.itemAdded",
            user?.role,
            {
              quantity: displayQuantity,
              unit: unit,
              itemName: item.name || "item",
            }
          );
          showGlobalToast(message, 1200, "success");
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
              const maxMsg = `You cannot add more. Only ${item.quantity} in stock.`;
              showGlobalToast(maxMsg, 1000, "error");
            }
          } catch (err) {
            console.error("[CategoryDetails] Error increasing quantity:", err);
            const message = getLabel(
              "categoryToastMessages.addFailed",
              user?.role
            );
            showGlobalToast(message, 2000, "error");
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
          const unit = normalizedItem.measurement_unit === 1 ? "kg" : "";
          let message;
          if (item.quantity > step) {
            message = getLabel(
              "categoryToastMessages.itemReduced",
              user?.role,
              {
                itemName: item.name || "item",
                quantity: step,
                unit: unit,
              }
            );
          } else {
            message = getLabel(
              "categoryToastMessages.itemRemoved",
              user?.role,
              {
                itemName: item.name || "item",
              }
            );
          }
          showGlobalToast(message, 1200, "info");
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
            const message = getLabel(
              "categoryToastMessages.updateFailed",
              user?.role
            );
            showGlobalToast(message, 2000, "error");
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
          // Prevent fast-increase if it would exceed stock
          const fastStep = 5;
          if (!canAddToCart(item, item.cartQuantity, fastStep)) {
            const maxMsg = `You cannot add more. Only ${item.quantity} in stock.`;
            showGlobalToast(maxMsg, 1000, "error");
            return;
          }
          // Show toast instantly
          const normalizedItem = normalizeItemData(item);
          const unit = normalizedItem.measurement_unit === 1 ? "kg" : "";
          const message = getLabel(
            "categoryToastMessages.itemAdded",
            user?.role,
            {
              quantity: fastStep,
              unit: unit,
              itemName: item.name || "items",
            }
          );
          showGlobalToast(message, 1200, "success");
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
            const message = getLabel(
              "categoryToastMessages.addFailed",
              user?.role
            );
            showGlobalToast(message, 2000, "error");
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
          const unit = normalizedItem.measurement_unit === 1 ? "kg" : "";
          const remainingQuantity = item.quantity - 5;
          let message;
          if (remainingQuantity > 0) {
            message = getLabel(
              "categoryToastMessages.itemReduced",
              user?.role,
              {
                itemName: item.name || "item",
                quantity: "5",
                unit: unit,
              }
            );
          } else {
            message = getLabel(
              "categoryToastMessages.itemRemoved",
              user?.role,
              {
                itemName: item.name || "item",
              }
            );
          }
          showGlobalToast(message, 1200, "info");
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
            const message = getLabel(
              "categoryToastMessages.updateFailed",
              user?.role
            );
            showGlobalToast(message, 2000, "error");
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
    console.log("Add item to", categoryName);
  };
  if (loading) {
    return (
      <View style={[layoutStyles.container, { paddingTop: insets.top }]}>
        <StatusBar
          barStyle="dark-content"
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
          barStyle="dark-content"
          backgroundColor="transparent"
          translucent
        />
        <ErrorState message={`Error loading ${categoryName} items`} />
      </View>
    );
  }
  return (
    <View
      style={[
        layoutStyles.container,
        { paddingTop: insets.top, backgroundColor: colors.base100 },
      ]}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      <CategoryHeader
        categoryName={categoryName}
        totalItems={totalItems}
        totalPoints={totalPoints}
        totalValue={totalValue}
        animatedStyle={headerAnimatedStyle}
        headerOpacity={headerOpacity}
        onGoBack={() => navigation && navigation.goBack && navigation.goBack()}
      />
      <Animated.View
        style={[
          layoutStyles.content,
          contentAnimatedStyle,
          styles.animatedCard,
        ]}
      >
        {mergedItems.length === 0 ? (
          <EmptyState categoryName={categoryName} onAddItem={handleAddItem} />
        ) : (
          <>
            <FlatList
              data={mergedItems}
              renderItem={renderItem}
              keyExtractor={(item) => getDisplayKey(item)}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                layoutStyles.listContainer,
                { paddingBottom: 32 },
              ]}
              ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
              extraData={cartItems}
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
          </>
        )}
      </Animated.View>
    </View>
  );
};
const styles = StyleSheet.create({
  animatedCard: {
    borderRadius: 24,
    backgroundColor: colors.white,
    marginTop: 12,
    padding: 8,
    shadowColor: colors.primary,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
});

export default CategoryDetails;
