import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareFlatList } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AnimatedButton,
  AnimatedListItem,
  Loader,
  RealTimeStockIndicator,
} from "../../components/common";
import { useAuth } from "../../context/AuthContext";
import { useLocalization } from "../../context/LocalizationContext";
import { useStock } from "../../context/StockContext";
import { useAllItems } from "../../hooks/useAPI";
import { useCart } from "../../hooks/useCart";
import { useCartValidation } from "../../hooks/useCartValidation";
import { useStockManager } from "../../hooks/useStockManager";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import { borderRadius, spacing, typography } from "../../styles";
import {
  CartMessageTypes,
  showCartMessage,
  showMaxStockMessage,
} from "../../utils/cartMessages";
import {
  getCartKey,
  getDisplayKey,
  normalizeItemData,
} from "../../utils/cartUtils";
import { isBuyer } from "../../utils/roleUtils";
import { scaleSize } from "../../utils/scale";
import {
  extractNameFromMultilingual,
  getTranslatedName,
} from "../../utils/translationHelpers";

const getRoleBasedIcon = (iconType, userRole = "customer") => {
  const iconMappings = {
    scheduleAction: {
      customer: "truck-fast",
      buyer: "credit-card-fast",
    },

    emptyCart: {
      customer: "truck-delivery-outline",
      buyer: "cart-outline",
    },

    findItems: {
      customer: "recycle",
      buyer: "store",
    },

    locked: {
      customer: "lock",
      buyer: "lock",
    },
  };

  return (
    iconMappings[iconType]?.[userRole] ||
    iconMappings[iconType]?.customer ||
    "help-circle"
  );
};

const Cart = () => {
  const insets = useSafeAreaInsets();
  const { user, isLoggedIn } = useAuth();
  const { t, tRole, currentLanguage } = useLocalization();
  const { colors } = useThemedStyles();
  const styles = getStyles(colors);
  const {
    cartItems,
    cartItemDetails,
    handleIncreaseQuantity,
    handleDecreaseQuantity,
    handleRemoveFromCart,
    handleClearCart,
    handleSetQuantity,
    removingItems,
    loading: cartLoading,
  } = useCart(user);
  const { items: allItems, loading: itemsLoading } = useAllItems();
  const {
    getItemStock,
  } = useStockManager();
  
  // Enhanced real-time stock integration
  const {
    getStockQuantity,
    lastUpdated,
  } = useStock();
  
  // Real-time cart validation for stock changes - DISABLED to prevent issues after order creation
  useCartValidation({
    validateOnFocus: false,
    validateOnAppActivation: false,
    autoCorrect: false, // Disable auto-correction to prevent unwanted updates
    showMessages: false, // Disable messages in cart page to prevent unwanted toasts
    source: 'cartPage'
  });
  
  const [loading, setLoading] = useState(true);
  const [showEmptyState, setShowEmptyState] = useState(false);
  const [inputValues, setInputValues] = useState({});
  
  // REMOVED: Real-time stock update subscription to prevent cart validation after order creation
  // The cart is automatically cleared by the backend after successful order creation
  // No real-time cart validation needed as it conflicts with order completion flow
  
  const [cartValidationErrors, setCartValidationErrors] = useState({});

  // Stock validation for cart items
  const validateCartStock = useCallback(() => {
    if (!isBuyer(user)) return {}; // Only validate for buyers

    const errors = {};

    // Use cartItems and cartItemDetails directly instead of cartArray to avoid stale closures
    Object.entries(cartItems).forEach(([itemId, quantity]) => {
      const itemDetails = cartItemDetails[itemId];
      if (!itemDetails || !quantity || quantity <= 0) return;

      const realTimeStock = getStockQuantity(itemId, itemDetails.availableStock || itemDetails.quantity);
      const currentStock = realTimeStock !== undefined ? realTimeStock : (itemDetails.availableStock || itemDetails.quantity || 0);
      const cartQuantity = quantity || 0;

      if (currentStock <= 0) {
        errors[itemId] = {
          type: 'out_of_stock',
          message: 'Out of stock',
          currentStock: 0,
          cartQuantity
        };
      } else if (cartQuantity > currentStock) {
        errors[itemId] = {
          type: 'exceeds_stock',
          message: `Only ${currentStock} available`,
          currentStock,
          cartQuantity
        };
      }
    });

    return errors;
  }, [cartItems, cartItemDetails, getStockQuantity, user]);

  // Update validation errors when cart or stock changes - using direct cart state for immediate updates
  useEffect(() => {
    const errors = validateCartStock();
    setCartValidationErrors(errors);
  }, [validateCartStock, lastUpdated]); // Removed cartArray dependency, using cartItems/cartItemDetails from validateCartStock dependencies

  // Check if cart has any validation errors
  const hasValidationErrors = Object.keys(cartValidationErrors).length > 0;

  // Helper function to get translated item names consistently
  const getTranslatedItemName = (item) => {
    const originalName = item.name || item.material || "Unknown Item";
    const categoryName = item.categoryName || item.category || null;

    // Safely extract category name from multilingual structure
    const categoryNameForTranslation = categoryName
      ? extractNameFromMultilingual(categoryName, currentLanguage)
      : null;

    const translatedName = getTranslatedName(t, originalName, "subcategories", {
      categoryName: categoryNameForTranslation
        ? categoryNameForTranslation.toLowerCase().replace(/\s+/g, "-")
        : null,
      currentLanguage,
    });
    return translatedName || originalName;
  };

  // Cart is already synced via CartContext, no need for manual refresh on focus

  useEffect(() => {
    if (!itemsLoading) {
      setLoading(false);
    }
  }, [itemsLoading, loading]);

  // Debug logging for cart items
  useEffect(() => {
    // Removed excessive logging to prevent console spam
  }, [cartItems, cartItemDetails, isLoggedIn]);

  const safeAllItems = useMemo(() => {
    return Array.isArray(allItems) ? allItems : [];
  }, [allItems]);

  const cartArray = useMemo(() => {
    if (Object.keys(cartItems).length === 0) {
      return [];
    }

    const result = Object.entries(cartItems)
      .map(([itemId, quantity]) => {
        const itemFromDetails = cartItemDetails[itemId];

        if (itemFromDetails) {
          return {
            ...itemFromDetails,
            quantity: quantity,
          };
        }

        const item = safeAllItems.find(
          (item) => item._id === itemId || item.categoryId === itemId
        );

        const combinedItem = {
          ...(item || {}),
          _id: item?._id || itemId,
          categoryId: item?.categoryId || itemId,
          name: item?.name || item?.material || "Unknown Item",
          image: item?.image || null,
          points: item?.points || 0,
          price: item?.price || 0,
          measurement_unit: item?.measurement_unit || 1,
          quantity: quantity,
        };

        const needsNormalization =
          !combinedItem._id ||
          !combinedItem.categoryId ||
          !combinedItem.image ||
          combinedItem.measurement_unit === undefined;

        const result = needsNormalization
          ? normalizeItemData(combinedItem)
          : combinedItem;

        return result;
      })
      .filter((item) => {
        const hasQuantity = item && item.quantity > 0;
        return hasQuantity;
      });

    return result;
  }, [cartItems, cartItemDetails, safeAllItems]);

  useEffect(() => {
    if (cartArray.length === 0) {
      const hasRemovingItems = removingItems && removingItems.size > 0;
      if (hasRemovingItems) {
        setShowEmptyState(false);
      } else {
        const timer = setTimeout(() => {
          setShowEmptyState(true);
        }, 150);

        return () => clearTimeout(timer);
      }
    } else {
      setShowEmptyState(false);
    }
  }, [cartArray.length, removingItems]);

  const handleIncrease = async (item) => {
    try {
      const measurementUnit =
        item.measurement_unit || (item.unit === "KG" ? 1 : 2);
      const incrementStep = measurementUnit === 1 ? 0.25 : 1;
      const newQuantity = item.quantity + incrementStep;

      // Only apply stock validation for buyers
      if (isBuyer(user)) {
        // Get API stock quantity as fallback - try multiple ID fields
        const originalItem = safeAllItems.find(
          (originalItem) =>
            originalItem._id === item._id ||
            originalItem._id === item.categoryId ||
            originalItem.categoryId === item._id ||
            originalItem.categoryId === item.categoryId
        );
        
        // Get the most reliable stock value from the original item
        const apiStockQuantity = originalItem?.quantity ??
          originalItem?.available_quantity ??
          originalItem?.stock_quantity ??
          originalItem?.quantity_available ??
          item.quantity ??
          item.available_quantity ??
          item.stock_quantity ??
          item.quantity_available ?? 0;
        
        // Get real-time stock quantity from StockContext with API fallback
        const actualStockQuantity = getItemStock(item._id, apiStockQuantity);

        // Stock validation - check against real-time stock quantity
        if (newQuantity > actualStockQuantity) {
          const normalizedItem = normalizeItemData(item);
          const translatedItemName = getTranslatedItemName(normalizedItem);
          showMaxStockMessage(
            translatedItemName,
            actualStockQuantity, // Pass real-time stock quantity
            normalizedItem.measurement_unit,
            t // Pass translation function
          );
          return;
        }
      }

      const itemWithCorrectId = {
        ...item,
        _id: getCartKey(item),
      };
      await handleIncreaseQuantity(itemWithCorrectId);

      // No toast for add in cart page

      // Clear input value to sync with new cart quantity
      const itemKey = getCartKey(item);
      setInputValue(itemKey, "");
    } catch (err) {
      console.error("[Cart] Error increasing quantity:", err);
      const normalizedItem = normalizeItemData(item);
      const translatedItemName = getTranslatedItemName(normalizedItem);
      showCartMessage(CartMessageTypes.OPERATION_FAILED, {
        itemName: translatedItemName,
        measurementUnit: normalizedItem.measurement_unit,
        isBuyer: user?.role === "buyer",
        t // Pass translation function
      });
    }
  };

  const handleDecrease = async (item) => {
    try {
      const itemWithCorrectId = {
        ...item,
        _id: getCartKey(item),
      };
      await handleDecreaseQuantity(itemWithCorrectId);

      // No toast for decrease in cart page

      // Clear input value to sync with new cart quantity
      const itemKey = getCartKey(item);
      setInputValue(itemKey, "");
    } catch (err) {
      console.error("[Cart] Error decreasing quantity:", err);
      const normalizedItem = normalizeItemData(item);
      const translatedItemName = getTranslatedItemName(normalizedItem);
      showCartMessage(CartMessageTypes.OPERATION_FAILED, {
        itemName: translatedItemName,
        measurementUnit: item.measurement_unit || (item.unit === "KG" ? 1 : 2),
        isBuyer: user?.role === "buyer",
        t // Pass translation function
      });
    }
  };

  const handleDelete = async (item) => {
    try {
      const itemId = getCartKey(item);
      await handleRemoveFromCart(itemId);

      // Show toast only for removal
      const normalizedItem = normalizeItemData(item);
      const translatedItemName = getTranslatedItemName(normalizedItem);
      showCartMessage(CartMessageTypes.REMOVE_ALL, {
        itemName: translatedItemName,
        measurementUnit: normalizedItem.measurement_unit,
        isBuyer: user?.role === "buyer",
        t // Pass translation function
      });
    } catch (err) {
      console.error("[Cart] Error removing item:", err);
      const normalizedItem = normalizeItemData(item);
      const translatedItemName = getTranslatedItemName(normalizedItem);
      showCartMessage(CartMessageTypes.OPERATION_FAILED, {
        itemName: translatedItemName,
        measurementUnit: item.measurement_unit || (item.unit === "KG" ? 1 : 2),
        isBuyer: user?.role === "buyer",
        t // Pass translation function
      });
    }
  };

  const handleClearAll = async () => {
    try {
      await handleClearCart();
      // Show toast for clear cart
      showCartMessage(CartMessageTypes.REMOVE_ALL, {
        itemName: t("toast.cart.allItems"),
        measurementUnit: 2,
        isBuyer: user?.role === "buyer",
        t // Pass translation function
      });
    } catch (err) {
      console.error("[Cart] Error clearing cart:", err);
      // For clear cart failures, we can still use a generic error
      showCartMessage(CartMessageTypes.OPERATION_FAILED, {
        itemName: "cart",
        measurementUnit: 2,
        isBuyer: user?.role === "buyer",
        t // Pass translation function
      });
    }
  };

  const handleManualInput = async (item, inputValue) => {
    try {
      const measurementUnit =
        item.measurement_unit || (item.unit === "KG" ? 1 : 2);
      let parsedValue = parseFloat(inputValue);

      // Handle zero quantity - remove item from cart
      if (parsedValue === 0) {
        const itemId = getCartKey(item);
        await handleRemoveFromCart(itemId);
        // Show unified removal message
        const normalizedItem = normalizeItemData(item);
        const translatedItemName = getTranslatedItemName(normalizedItem);
        showCartMessage(CartMessageTypes.REMOVE_ALL, {
          itemName: translatedItemName,
          measurementUnit: normalizedItem.measurement_unit,
          isBuyer: user?.role === "buyer",
          t // Pass translation function
        });
        return true;
      }

      // Validation and smart rounding based on measurement unit
      if (measurementUnit === 1) {
        // KG - smart rounding to nearest multiple of 0.25
        if (parsedValue <= 0) {
          const normalizedItem = normalizeItemData(item);
          const translatedItemName = getTranslatedItemName(normalizedItem);
          showCartMessage(CartMessageTypes.INVALID_QUANTITY, {
            itemName: translatedItemName,
            measurementUnit: measurementUnit,
            isBuyer: user?.role === "buyer",
            t // Pass translation function
          });
          return false;
        }

        // Smart rounding logic for KG
        const originalValue = parsedValue;
        parsedValue = Math.floor(parsedValue / 0.25) * 0.25;
        const diff = parsedValue + 0.25 - originalValue;
        if (diff <= 0.125) parsedValue += 0.25;
        parsedValue = Math.round(parsedValue * 100) / 100;

        // Minimum quantity check after rounding
        if (parsedValue < 0.25) {
          parsedValue = 0.25;
        }
      } else {
        // Pieces - smart rounding to nearest whole number
        if (parsedValue <= 0) {
          const normalizedItem = normalizeItemData(item);
          const translatedItemName = getTranslatedItemName(normalizedItem);
          showCartMessage(CartMessageTypes.INVALID_QUANTITY, {
            itemName: translatedItemName,
            measurementUnit: measurementUnit,
            isBuyer: user?.role === "buyer",
            t // Pass translation function
          });
          return false;
        }

        // Smart rounding for pieces
        parsedValue = Math.round(parsedValue);

        // Minimum quantity check after rounding
        if (parsedValue < 1) {
          parsedValue = 1;
        }
      }

      // Only apply stock validation for buyers
      if (isBuyer(user)) {
        // Get API stock quantity as fallback - try multiple ID fields
        const originalItem = safeAllItems.find(
          (originalItem) =>
            originalItem._id === item._id ||
            originalItem._id === item.categoryId ||
            originalItem.categoryId === item._id ||
            originalItem.categoryId === item.categoryId
        );
        
        // Get the most reliable stock value from the original item
        const apiStockQuantity = originalItem?.quantity ??
          originalItem?.available_quantity ??
          originalItem?.stock_quantity ??
          originalItem?.quantity_available ??
          item.quantity ??
          item.available_quantity ??
          item.stock_quantity ??
          item.quantity_available ?? 0;
        
        // Get real-time stock quantity from StockContext with API fallback
        const actualStockQuantity = getItemStock(item._id, apiStockQuantity);

        // Stock validation - check against real-time stock quantity
        if (parsedValue > actualStockQuantity) {
          const normalizedItem = normalizeItemData(item);
          const translatedItemName = getTranslatedItemName(normalizedItem);
          showMaxStockMessage(
            translatedItemName,
            actualStockQuantity, // Pass real-time stock quantity
            normalizedItem.measurement_unit,
            t // Pass translation function
          );
          return false;
        }
      }

      const itemWithCorrectId = {
        ...item,
        _id: getCartKey(item),
      };

      await handleSetQuantity(itemWithCorrectId, parsedValue);

      // Only show toast if item is removed (handled above)
      return true;
    } catch (err) {
      console.error("[Cart] Error setting manual quantity:", err);
      const normalizedItem = normalizeItemData(item);
      const translatedItemName = getTranslatedItemName(normalizedItem);
      showCartMessage(CartMessageTypes.OPERATION_FAILED, {
        itemName: translatedItemName,
        measurementUnit: normalizedItem.measurement_unit,
        isBuyer: user?.role === "buyer",
      }, t);
      return false;
    }
  };

  const getInputValue = (itemKey, defaultValue) => {
    // Always show the actual cart quantity unless user is actively editing
    return inputValues[itemKey] !== undefined && inputValues[itemKey] !== ""
      ? inputValues[itemKey]
      : String(defaultValue);
  };

  const setInputValue = (itemKey, value) => {
    setInputValues((prev) => ({
      ...prev,
      [itemKey]: value,
    }));
  };

  const renderCartItem = ({ item, index }) => {
    const name = getTranslatedItemName(item);
    let unit = item.unit || item.measurement_unit || "";
    if (unit === 1 || unit === "1") unit = t("units.kg");
    if (unit === 2 || unit === "2") unit = t("units.piece");
    const points = typeof item.points === "number" ? item.points : null;
    const value =
      typeof item.value === "number"
        ? item.value
        : typeof item.price === "number"
        ? item.price
        : null;
    const quantity = typeof item.quantity === "number" ? item.quantity : 1;

    // Get real-time stock data for this cart item
    const realTimeStock = getStockQuantity(item._id, item.availableStock || item.quantity);
    const currentStock = realTimeStock !== undefined ? realTimeStock : (item.availableStock || item.quantity || 0);
    
    const validationError = cartValidationErrors[item._id];
    const hasError = !!validationError;
    const isOutOfStock = isBuyer(user) && (validationError?.type === 'out_of_stock' || currentStock === 0);
    const exceedsStock = validationError?.type === 'exceeds_stock' || quantity > currentStock;

    const totalValue = value !== null ? value * quantity : null;

    return (
      <AnimatedListItem
        index={index}
        style={[
          styles.cartCard,
          {
            borderLeftWidth: 5,
            borderLeftColor: hasError ? colors.error : colors.primary,
            marginBottom: spacing.md,
            marginTop: spacing.sm,
            shadowOpacity: 0.18,
            opacity: isBuyer(user) && isOutOfStock ? 0.6 : 1,
          },
          hasError && styles.cartCardError,
        ]}
      >
        <TouchableOpacity
          style={styles.cartDeleteBtn}
          onPress={() => handleDelete(item)}
        >
          <MaterialCommunityIcons
            name="delete-outline"
            size={20}
            color={colors.error}
          />
        </TouchableOpacity>
        
        {/* Real-time stock indicator positioned above the image */}
        {isBuyer(user) && (
          <View style={styles.cartStockIndicatorAbove}>
            <RealTimeStockIndicator 
              itemId={item._id}
              quantity={currentStock}
              showConnectionStatus={false}
              showChangeIndicator={true}
              size="small"
            />
          </View>
        )}
        
        <View style={styles.cartImageContainer}>
          {item.image ? (
            <Image
              source={{ uri: item.image }}
              style={styles.cartImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.cartImagePlaceholder}>
              <MaterialCommunityIcons
                name="image-off-outline"
                size={32}
                color={colors.base300}
              />
            </View>
          )}
        </View>
        <View style={styles.cartInfoContainer}>
          <View style={styles.cartHeaderRow}>
            <Text style={styles.cartName}>{name}</Text>
          </View>
          <View style={styles.itemDetailsRow}>
            <Text
              style={[
                styles.cartUnit,
                { color: colors.primary, fontWeight: "bold", marginRight: 8 },
              ]}
            >
              {quantity} {unit ? unit : ""}
            </Text>
          </View>
          {!isBuyer(user) && points !== null ? (
            <View style={styles.itemDetailsRow}>
              <Text
                style={[
                  styles.cartUnit,
                  { color: colors.accent, fontWeight: "bold", marginRight: 8 },
                ]}
              >
                {t("units.ptsEach", { points })}
              </Text>
            </View>
          ) : null}
          {totalValue !== null ? (
            <View style={styles.itemDetailsRow}>
              <Text
                style={[
                  styles.cartUnit,
                  { color: colors.secondary, fontWeight: "bold" },
                ]}
              >
                {totalValue.toFixed(2)} {t("units.egp")}
              </Text>
            </View>
          ) : null}
          <View style={styles.cartQuantityRow}>
            {/* Get the proper minimum quantity based on measurement unit */}
            {(() => {
              const measurementUnit =
                item.measurement_unit || (unit === "KG" ? 1 : 2);
              const minQuantity = measurementUnit === 1 ? 0.25 : 1;
              const isAtMinimum = quantity <= minQuantity;

              return (
                <>
                  <TouchableOpacity
                    style={[styles.cartQtyBtn, isAtMinimum && { opacity: 0.5 }]}
                    onPress={() => handleDecrease(item)}
                    disabled={isAtMinimum}
                  >
                    <MaterialCommunityIcons
                      name="minus"
                      size={20}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.cartQtyText}
                    value={getInputValue(getCartKey(item), quantity)}
                    onChangeText={(text) =>
                      setInputValue(getCartKey(item), text)
                    }
                    onEndEditing={(e) => {
                      const inputValue = e.nativeEvent.text.trim();
                      const itemKey = getCartKey(item);

                      if (
                        inputValue === "" ||
                        inputValue === String(quantity)
                      ) {
                        // Clear input value to show actual cart quantity
                        setInputValue(itemKey, "");
                        return;
                      }

                      // Use requestAnimationFrame to avoid render cycle conflicts
                      requestAnimationFrame(() => {
                        handleManualInput(item, inputValue).then((success) => {
                          if (success) {
                            // Clear input value so it shows the updated cart quantity
                            setInputValue(itemKey, "");
                          } else {
                            // Revert immediately on failure
                            setInputValue(itemKey, "");
                          }
                        });
                      });
                    }}
                    keyboardType="numeric"
                    selectTextOnFocus
                    textAlign="center"
                    maxLength={6}
                  />
                  <TouchableOpacity
                    style={styles.cartQtyBtn}
                    onPress={() => handleIncrease(item)}
                  >
                    <MaterialCommunityIcons
                      name="plus"
                      size={20}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                </>
              );
            })()}
          </View>
          {hasError && (
            <View style={styles.validationErrorContainer}>
              <MaterialCommunityIcons
                name={isOutOfStock ? "alert-circle" : "alert-outline"}
                size={14}
                color={colors.error}
              />
              <Text style={styles.validationErrorMessage}>
                {isOutOfStock 
                  ? t("cart.validation.outOfStock", "Out of stock")
                  : exceedsStock 
                  ? t("cart.validation.exceedsStock", `Only ${validationError.currentStock} available`)
                  : validationError.message
                }
              </Text>
            </View>
          )}
        </View>
      </AnimatedListItem>
    );
  };

  if (loading && cartArray.length === 0) {
    return <Loader />;
  }

  // Only show error state if items failed to load AND we're not still loading
  if (!allItems.length && !itemsLoading && !loading) {
    return (
      <View style={styles.emptyCartContainer}>
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={64}
          color={colors.error}
          style={{ marginBottom: 16 }}
        />
        <Text style={styles.emptyCartTitle}>{t("cart.loadingError")}</Text>
        <Text style={styles.emptyCartSubtitle}>
          {t("cart.loadingErrorMessage")}
        </Text>
      </View>
    );
  }

  if (cartArray.length === 0 && showEmptyState) {
    return (
      <View style={styles.container}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />
        <LinearGradient
          colors={[colors.primary, colors.neutral]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroSection, { paddingTop: insets.top + 20 }]}
        >
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>
              {tRole("cart.title", user?.role)}
            </Text>
            <Text style={styles.heroSubtitle}>{t("cart.noItems")}</Text>
            <AnimatedButton
              style={styles.heroFindBtn}
              onPress={() => router.push("/(tabs)/explore")}
            >
              <MaterialCommunityIcons
                name={getRoleBasedIcon("findItems", user?.role)}
                size={28}
                color={colors.title}
              />
              <Text style={styles.heroFindBtnText}>
                {tRole("cart.findItemsButton", user?.role)}
              </Text>
            </AnimatedButton>
          </View>
        </LinearGradient>
        <View style={styles.emptyCartContainer}>
          <View style={styles.emptyCartIconWrapper}>
            <MaterialCommunityIcons
              name={getRoleBasedIcon("emptyCart", user?.role)}
              size={80}
              color={colors.base300}
            />
          </View>
          <Text style={styles.emptyCartTitle}>
            {tRole("cart.empty", user?.role)}
          </Text>
          <Text style={styles.emptyCartSubtitle}>
            {tRole("cart.emptySubtitle", user?.role)}
          </Text>
        </View>
      </View>
    );
  }

  if (cartArray.length === 0 && !showEmptyState) {
    return (
      <View style={styles.emptyCartContainer}>
        <Loader />
      </View>
    );
  }

  const totalPoints = cartArray.reduce((sum, item) => {
    const points = typeof item.points === "number" ? item.points : 0;
    return sum + points * (item.quantity || 1);
  }, 0);

  const totalValue = cartArray.reduce((sum, item) => {
    const value =
      typeof item.value === "number"
        ? item.value
        : typeof item.price === "number"
        ? item.price
        : 0;
    return sum + value * (item.quantity || 1);
  }, 0);

  const MINIMUM_ORDER_VALUE = 100;

  const isGuest = !isLoggedIn || !user;
  const canSchedulePickup =
    totalValue >= MINIMUM_ORDER_VALUE && user?.role === "customer" && !hasValidationErrors;
  const canProceedToPurchase =
    totalValue >= MINIMUM_ORDER_VALUE && user?.role === "buyer" && !hasValidationErrors;
  const canGuestProceed = totalValue >= MINIMUM_ORDER_VALUE && isGuest && !hasValidationErrors;
  const canProceed =
    canSchedulePickup || canProceedToPurchase || canGuestProceed;

  const remainingAmount = MINIMUM_ORDER_VALUE - totalValue;

  // Determine the appropriate button text based on different blocking conditions
  const getButtonText = () => {
    if (canSchedulePickup || canProceedToPurchase) {
      return tRole("cart.checkout", user?.role);
    }
    if (canGuestProceed) {
      return t("auth.loginToContinue");
    }
    
    // When blocked, prioritize stock issues over minimum order issues
    if (hasValidationErrors) {
      return tRole("cart.fixStockIssues", user?.role) || "Please fix stock issues";
    }
    
    // Only show minimum order message if that's the only issue
    if (totalValue < MINIMUM_ORDER_VALUE) {
      return tRole("minimumOrder.button", user?.role);
    }
    
    // Fallback
    return tRole("minimumOrder.button", user?.role);
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <LinearGradient
        colors={[colors.primary, colors.neutral]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.heroSection, { paddingTop: insets.top + 20 }]}
      >
        <View style={styles.heroRowHeader}>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>
              {tRole("cart.title", user?.role)}
            </Text>
            <Text style={styles.heroSubtitle}>
              {cartArray.length} {tRole("itemsReadyFor", user?.role)}
            </Text>
            <View style={styles.checkoutSummaryRowHero}>
              {!isBuyer(user) && (
                <View style={styles.checkoutSummaryItemHero}>
                  <MaterialCommunityIcons
                    name="star"
                    size={22}
                    color={colors.title}
                  />
                  <Text style={styles.checkoutSummaryLabelHero}>
                    {t("common.points")}
                  </Text>
                  <Text style={styles.checkoutSummaryValueHero}>
                    {totalPoints}
                  </Text>
                </View>
              )}
              <View style={styles.checkoutSummaryItemHero}>
                <MaterialCommunityIcons
                  name="cash"
                  size={22}
                  color={colors.title}
                />
                <Text style={styles.checkoutSummaryLabelHero}>
                  {tRole("money", user?.role)}
                </Text>
                <Text style={styles.checkoutSummaryValueHero}>
                  {totalValue.toFixed(2)} {t("units.egp")}
                </Text>
              </View>
            </View>
            {remainingAmount > 0 && (
              <View style={styles.minimumOrderWarning}>
                <MaterialCommunityIcons
                  name="alert-circle"
                  size={16}
                  color={colors.warning}
                />
                <Text style={styles.minimumOrderText}>
                  {tRole("minimumOrder.message", user?.role, {
                    amount: remainingAmount.toFixed(2),
                  })}
                </Text>
              </View>
            )}
            {hasValidationErrors && (
              <View style={styles.validationErrorWarning}>
                <MaterialCommunityIcons
                  name="alert-circle-outline"
                  size={16}
                  color={colors.error}
                />
                <Text style={styles.validationErrorText}>
                  {t("cart.validation.hasErrors", "Please fix cart issues before proceeding")}
                </Text>
              </View>
            )}
            <View style={styles.heroActionRow}>
              <AnimatedButton
                style={[
                  styles.checkoutBtnBarHero,
                  !canProceed && styles.checkoutBtnBarDisabled,
                ]}
                onPress={
                  canSchedulePickup
                    ? () => router.push("/pickup")
                    : canProceedToPurchase
                    ? () => router.push("/pickup")
                    : canGuestProceed
                    ? () => router.push("/login")
                    : null
                }
                disabled={!canProceed}
              >
                <MaterialCommunityIcons
                  name={
                    canProceed
                      ? getRoleBasedIcon("scheduleAction", user?.role)
                      : getRoleBasedIcon("locked", user?.role)
                  }
                  size={24}
                  color={canProceed ? colors.title : colors.title}
                />
                <Text
                  style={[
                    styles.checkoutBtnBarTextHero,
                    !canProceed && styles.checkoutBtnBarTextDisabled,
                  ]}
                >
                  {getButtonText()}
                </Text>
              </AnimatedButton>
              {cartArray.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButtonHero}
                  onPress={handleClearAll}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name="delete-sweep"
                    size={22}
                    color={colors.title}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </LinearGradient>
      <View
        style={[styles.contentContainer, { backgroundColor: colors.background }]}
      >
        <KeyboardAwareFlatList
          data={cartArray}
          renderItem={renderCartItem}
          keyExtractor={(item) => getDisplayKey(item)}
          contentContainerStyle={[styles.listContainerModern]}
          showsVerticalScrollIndicator={false}
          extraData={cartItems}
          enableOnAndroid
          extraScrollHeight={100}
          keyboardShouldPersistTaps="handled"
          ListFooterComponent={<View style={{ height: 100 }} />}
        />
      </View>
      
      {/* Loading overlay when cart is syncing */}
      {cartLoading && cartArray.length > 0 && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>{t('cart.syncing')}</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  heroSection: {
    minHeight: scaleSize(170),
    paddingHorizontal: scaleSize(spacing.lg),
    paddingBottom: scaleSize(spacing.md),
    paddingTop: scaleSize(spacing.xl),
    borderBottomLeftRadius: scaleSize(32),
    borderBottomRightRadius: scaleSize(32),
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: scaleSize(8) },
    shadowOpacity: 0.3,
    shadowRadius: scaleSize(12),
    elevation: 8,
    justifyContent: "flex-end",
  },
  heroRowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.sm,
  },
  heroContent: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingBottom: spacing.sm,
    paddingTop: spacing.lg,
    minHeight: 120,
  },
  heroTitle: {
    fontSize: scaleSize(24),
    fontWeight: "bold",
    color: colors.title,
    textAlign: "center",
    marginBottom: scaleSize(spacing.sm),
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: scaleSize(14),
    color: colors.title,
    textAlign: "center",
    opacity: 0.85,
    lineHeight: scaleSize(22),
  },
  clearButton: {
    position: "relative",
    padding: spacing.sm,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  contentContainer: {
    flex: 1,
    paddingTop: spacing.md,
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.background,
  },
  emptyCartIconWrapper: {
    marginBottom: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    width: 100,
    height: 100,
  },
  emptyCartTitle: {
    ...typography.title,
    fontSize: 22,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  emptyCartSubtitle: {
    ...typography.subtitle,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  heroFindBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: scaleSize(borderRadius.xl),
    paddingVertical: scaleSize(spacing.xl),
    paddingHorizontal: scaleSize(spacing.xxl),
    marginTop: scaleSize(spacing.xl),
    marginBottom: scaleSize(spacing.md),
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: scaleSize(4) },
    shadowOpacity: 0.18,
    shadowRadius: scaleSize(12),
    elevation: 6,
    minWidth: scaleSize(220),
    alignSelf: "center",
  },
  heroFindBtnText: {
    ...typography.subtitle,
    color: colors.title,
    fontWeight: "700",
    fontSize: scaleSize(18),
    marginLeft: scaleSize(spacing.md),
    letterSpacing: 0.2,
  },
  cartCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.cardBackground,
    marginHorizontal: scaleSize(spacing.xl),
    marginBottom: scaleSize(spacing.md),
    padding: scaleSize(spacing.lg),
    borderRadius: scaleSize(18),
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: scaleSize(2) },
    shadowOpacity: 0.12,
    shadowRadius: scaleSize(6),
    elevation: 3,
    minHeight: scaleSize(100),
    borderWidth: 1,
    borderColor: colors.border,
  },
  cartImageContainer: {
    width: scaleSize(64),
    height: scaleSize(64),
    borderRadius: scaleSize(14),
    overflow: "hidden",
    marginRight: scaleSize(spacing.lg),
    backgroundColor: colors.cardBackground,
    justifyContent: "center",
    alignItems: "center",
  },
  cartImage: {
    width: "100%",
    height: "100%",
    borderRadius: scaleSize(14),
  },
  cartImagePlaceholder: {
    width: scaleSize(48),
    height: scaleSize(48),
    borderRadius: scaleSize(10),
    backgroundColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  cartInfoContainer: {
    flex: 1,
    justifyContent: "center",
    gap: 2,
    marginLeft: scaleSize(spacing.md), // Move text content to the right
  },
  cartName: {
    ...typography.subtitle,
    fontSize: scaleSize(17),
    fontWeight: "700",
    color: colors.text,
    marginBottom: scaleSize(2),
  },
  cartUnit: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: "uppercase",
    fontWeight: "600",
    fontSize: scaleSize(13),
    marginBottom: scaleSize(6),
  },
  cartQuantityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scaleSize(8),
    marginTop: scaleSize(2),
  },
  cartQtyBtn: {
    width: scaleSize(32),
    height: scaleSize(32),
    borderRadius: scaleSize(16),
    backgroundColor: colors.cardBackground,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  cartQtyText: {
    ...typography.title,
    fontSize: scaleSize(18),
    fontWeight: "700",
    color: colors.primary,
    minWidth: scaleSize(36),
    textAlign: "center",
  },
  cartDeleteBtn: {
    position: "absolute",
    top: scaleSize(8),
    right: scaleSize(8),
    width: scaleSize(32),
    height: scaleSize(32),
    borderRadius: scaleSize(16),
    backgroundColor: colors.cardBackground,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 1,
  },
  itemDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  filledContainer: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    paddingBottom: spacing.xxl + 16,
  },
  headerMerged: {
    paddingHorizontal: spacing.xl,
    paddingTop: 0,
    paddingBottom: spacing.md,
    backgroundColor: colors.cardBackground,
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerRowMerged: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.sm,
    width: "100%",
  },
  headerLeftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  clearCartBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  clearCartText: {
    ...typography.caption,
    color: colors.error,
    fontWeight: "600",
    fontSize: 12,
    marginLeft: 4,
  },
  headerTitleMerged: {
    ...typography.title,
    fontSize: 26,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 2,
  },
  headerSubtitleMerged: {
    ...typography.subtitle,
    color: colors.textSecondary,
    fontSize: 16,
    marginBottom: 2,
  },
  listContainerModern: {
    paddingVertical: spacing.md,
    paddingBottom: spacing.xxl,
  },

  checkoutSummaryRowHero: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    gap: 12,
  },
  checkoutSummaryItemHero: {
    flexDirection: "column",
    alignItems: "center",
    flex: 1,
    marginHorizontal: spacing.md,
  },
  checkoutSummaryLabelHero: {
    ...typography.caption,
    color: colors.title,
    marginTop: 2,
    marginBottom: 2,
    fontSize: 13,
  },
  checkoutSummaryValueHero: {
    ...typography.title,
    fontSize: 18,
    color: colors.title,
    fontWeight: "700",
    marginTop: 2,
  },
  heroActionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    width: "100%",
    marginTop: spacing.sm,
    gap: 5,
  },
  checkoutBtnBarHero: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    shadowColor: colors.primary,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    justifyContent: "center",
    flex: 1,
    minWidth: 0,
  },
  checkoutBtnBarTextHero: {
    ...typography.subtitle,
    color: colors.title,
    fontWeight: "700",
    fontSize: 18,
    marginLeft: spacing.sm,
  },
  clearButtonHero: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: spacing.sm,
    height: 55,
    minWidth: 40,
  },
  minimumOrderWarning: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: "rgba(255, 193, 7, 0.15)",
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.md,
  },
  minimumOrderText: {
    ...typography.caption,
    color: colors.warning,
    fontWeight: "600",
    fontSize: 13,
    marginLeft: spacing.xs,
    textAlign: "center",
  },
  validationErrorWarning: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: "rgba(255, 59, 48, 0.15)",
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.md,
  },
  validationErrorText: {
    ...typography.caption,
    color: colors.error,
    fontWeight: "600",
    fontSize: 13,
    marginLeft: spacing.xs,
    textAlign: "center",
  },
  cartCardError: {
    backgroundColor: "rgba(255, 59, 48, 0.05)",
  },
  validationErrorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs / 2,
    backgroundColor: "rgba(255, 59, 48, 0.1)",
    borderRadius: borderRadius.sm,
  },
  validationErrorMessage: {
    ...typography.caption,
    color: colors.error,
    fontWeight: "600",
    fontSize: 12,
    marginLeft: spacing.xs / 2,
  },
  checkoutBtnBarDisabled: {
    backgroundColor: colors.base300,
    shadowOpacity: 0,
    elevation: 0,
  },
  checkoutBtnBarTextDisabled: {
    color: colors.title,
    fontWeight: "600",
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  cartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  cartStockIndicator: {
    marginLeft: spacing.xs,
  },
  cartStockIndicatorAbove: {
    position: 'absolute',
    top: scaleSize(spacing.sm),
    left: scaleSize(spacing.lg),
    zIndex: 2,
    backgroundColor: 'transparent',
  },
  loadingText: {
    ...typography.subtitle,
    color: colors.textPrimary,
    marginLeft: spacing.md,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default Cart;
