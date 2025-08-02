import { useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, StatusBar, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CategoryHeader, EmptyState, ItemCard } from "../components/category";
import { ErrorState, Loader } from "../components/common";
import { Toast } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useCategoryItems } from "../hooks/useAPI";
import { useCart } from "../hooks/useCart";
import { useToast } from "../hooks/useToast";
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
  const { toast, showSuccess, showError, hideToast } = useToast();
  const { user } = useAuth();

  const [pendingOperations, setPendingOperations] = useState({});

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const { items, loading, error } = useCategoryItems(categoryName);
  const insets = useSafeAreaInsets();
  const {
    cartItems,
    handleIncreaseQuantity,
    handleDecreaseQuantity,
    handleFastIncreaseQuantity,
    handleFastDecreaseQuantity,
  } = useCart();

  const mergedItems = items.map((item) => {

    const needsNormalization =
      !item._id ||
      !item.categoryId ||
      !item.image ||
      item.measurement_unit === undefined;
    const processedItem = needsNormalization ? normalizeItemData(item) : item;

    const itemKey = getCartKey(processedItem);
    const quantity = cartItems[itemKey] || 0;

    return {
      ...processedItem,
      quantity,
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

  const renderItem = ({ item, index }) => {
    const itemKey = getCartKey(item);
    const itemPendingAction = pendingOperations[itemKey];

    return (
      <ItemCard
        item={item}
        quantity={item.quantity}
        disabled={!!itemPendingAction}
        pendingAction={itemPendingAction}
        index={index}
        onIncrease={async () => {
          if (itemPendingAction) return;

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
            await handleIncreaseQuantity(itemWithCorrectId);

            const normalizedItem = normalizeItemData(item);
            const step = getIncrementStep(normalizedItem.measurement_unit);
            const unit = normalizedItem.measurement_unit === 1 ? "kg" : "";
            const isFirstAdd = !item.quantity || item.quantity === 0;
            const displayQuantity = isFirstAdd ? 1 : step;
            const message = getLabel(
              "categoryToastMessages.itemAdded",
              user?.role,
              {
                quantity: displayQuantity,
                unit: unit,
                itemName: item.name || "item",
              }
            );
            showSuccess(message, 1000);
          } catch (err) {
            console.error("[CategoryDetails] Error increasing quantity:", err);
            const message = getLabel(
              "categoryToastMessages.addFailed",
              user?.role
            );
            showError(message);
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

            const normalizedItem = normalizeItemData(item);
            const step = getIncrementStep(normalizedItem.measurement_unit);
            const unit = normalizedItem.measurement_unit === 1 ? "kg" : "";
            if (item.quantity > step) {
              const message = getLabel(
                "categoryToastMessages.itemReduced",
                user?.role,
                {
                  itemName: item.name || "item",
                  quantity: step,
                  unit: unit,
                }
              );
              showSuccess(message, 1000);
            } else {
              const message = getLabel(
                "categoryToastMessages.itemRemoved",
                user?.role,
                {
                  itemName: item.name || "item",
                }
              );
              showSuccess(message, 1000);
            }
          } catch (err) {
            console.error("[CategoryDetails] Error decreasing quantity:", err);
            const message = getLabel(
              "categoryToastMessages.updateFailed",
              user?.role
            );
            showError(message);
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

            const normalizedItem = normalizeItemData(item);
            const unit = normalizedItem.measurement_unit === 1 ? "kg" : "";
            const message = getLabel(
              "categoryToastMessages.itemAdded",
              user?.role,
              {
                quantity: "5",
                unit: unit,
                itemName: item.name || "items",
              }
            );
            showSuccess(message, 1000);
          } catch (err) {
            console.error(
              "[CategoryDetails] Error fast increasing quantity:",
              err
            );
            const message = getLabel(
              "categoryToastMessages.addFailed",
              user?.role
            );
            showError(message);
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
          }, 1000);

          try {
            setPendingOperations((prev) => ({
              ...prev,
              [item.categoryId]: "fastDecrease",
            }));
            await handleFastDecreaseQuantity(item);

            const normalizedItem = normalizeItemData(item);
            const unit = normalizedItem.measurement_unit === 1 ? "kg" : "";
            const remainingQuantity = item.quantity - 5;
            if (remainingQuantity > 0) {
              const message = getLabel(
                "categoryToastMessages.itemReduced",
                user?.role,
                {
                  itemName: item.name || "item",
                  quantity: "5",
                  unit: unit,
                }
              );
              showSuccess(message, 2000);
            } else {
              const message = getLabel(
                "categoryToastMessages.itemRemoved",
                user?.role,
                {
                  itemName: item.name || "item",
                }
              );
              showSuccess(message, 2000);
            }
          } catch (err) {
            console.error(
              "[CategoryDetails] Error fast decreasing quantity:",
              err
            );
            const message = getLabel(
              "categoryToastMessages.updateFailed",
              user?.role
            );
            showError(message);
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

      {}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
        duration={toast.duration}
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
          />
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
