import { useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import { RefreshControl, StatusBar, View } from "react-native";
import { KeyboardAwareFlatList } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CategoryHeader, EmptyState, ItemCard } from "../components/category";
import { ErrorState, Loader } from "../components/common";
import { useAuth } from "../context/AuthContext";
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
import { isBuyer } from "../utils/roleLabels";
import { scaleSize } from "../utils/scale";

let useAnimatedStyle, useSharedValue, withSpring, withTiming;

try {
  const reanimated = require("react-native-reanimated");
  useAnimatedStyle = reanimated.useAnimatedStyle;
  useSharedValue = reanimated.useSharedValue;
  withSpring = reanimated.withSpring;
  withTiming = reanimated.withTiming;
} catch (_error) {
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
      item: item?.name,
      value,
      itemQuantity: item?.quantity,
    });

    if (!item) {
      console.log("No item found, returning");
      return;
    }

    // Validate minimum quantity based on measurement unit
    const measurementUnit =
      item.measurement_unit || (item.unit === "KG" ? 1 : 2);
    if (value > 0) {
      if (measurementUnit === 1 && value < 0.25) {
        showCartMessage(CartMessageTypes.INVALID_QUANTITY, {
          itemName: item.name,
          measurementUnit: measurementUnit,
          isBuyer: user?.role === "buyer",
        });
        return;
      } else if (measurementUnit === 2 && value < 1) {
        showCartMessage(CartMessageTypes.INVALID_QUANTITY, {
          itemName: item.name,
          measurementUnit: measurementUnit,
          isBuyer: user?.role === "buyer",
        });
        return;
      }
    }

    // Only check stock for buyer users
    if (isBuyer(user) && value > item.quantity) {
      showCartMessage(CartMessageTypes.STOCK_ERROR, {
        itemName: item.name,
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
        item: item.name,
        value,
      });
      const result = await handleSetQuantity(item, value);
      console.log("handleSetQuantity result:", result);

      // Only show removal message when quantity is set to 0
      if (value === 0) {
        showCartMessage(CartMessageTypes.MANUAL_REMOVED, {
          itemName: item.name,
          measurementUnit: item.measurement_unit,
          isBuyer: user?.role === "buyer",
        });
      }
    } catch (_err) {
      console.log("handleSetQuantity error:", _err);
      showCartMessage(CartMessageTypes.OPERATION_FAILED, {
        itemName: item.name,
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
        item={item}
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
                item.name,
                item.quantity,
                item.measurement_unit
              );
            }
            if (outOfStock) {
              showCartMessage(CartMessageTypes.STOCK_ERROR, {
                itemName: item.name,
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
            itemName: item.name || "item",
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
                item.name,
                item.quantity,
                item.measurement_unit
              );
            }
          } catch (err) {
            console.error("[CategoryDetails] Error increasing quantity:", err);
            showCartMessage(CartMessageTypes.OPERATION_FAILED, {
              itemName: item.name,
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
              itemName: item.name || "item",
              quantity: step,
              measurementUnit: normalizedItem.measurement_unit,
              remainingQuantity: remainingQuantity,
              isBuyer: user?.role === "buyer",
            });
          } else {
            showCartMessage(CartMessageTypes.ITEM_REMOVED, {
              itemName: item.name || "item",
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
              itemName: item.name,
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
              item.name,
              item.quantity,
              item.measurement_unit
            );
            return;
          }
          // Show toast instantly
          const normalizedItem = normalizeItemData(item);

          showCartMessage(CartMessageTypes.ADD_FAST, {
            itemName: item.name || "item",
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
            showCartMessage(CartMessageTypes.OPERATION_FAILED);
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
              itemName: item.name || "item",
              quantity: fastStep,
              measurementUnit: normalizedItem.measurement_unit,
              remainingQuantity: remainingQuantity,
              isBuyer: user?.role === "buyer",
            });
          } else {
            showCartMessage(CartMessageTypes.ITEM_REMOVED, {
              itemName: item.name || "item",
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
            showCartMessage(CartMessageTypes.OPERATION_FAILED);
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
  if (loading && !refreshing) {
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
      {mergedItems.length === 0 ? (
        <EmptyState categoryName={categoryName} onAddItem={handleAddItem} />
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
          extraScrollHeight={200}
          keyboardOpeningTime={0}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
};

export default CategoryDetails;
