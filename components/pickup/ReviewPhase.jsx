import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useLocalization } from "../../context/LocalizationContext";
import { useCart } from "../../hooks/useCart";
import { usePayment } from "../../hooks/usePayment";
// import { orderService } from "../../services/api/orders"; // Removed - using unified flow

import { useThemedStyles } from "../../hooks/useThemedStyles";
import { borderRadius, spacing, typography } from "../../styles";
import { normalizeItemData } from "../../utils/cartUtils";
import { isBuyer, isBuyer as isBuyerRole, shouldShowDeliveryFee, shouldShowTotalValue } from "../../utils/roleUtils";
import { extractNameFromMultilingual, getTranslatedName } from "../../utils/translationHelpers";


import { getDeliveryFeeForCity } from '../../utils/deliveryFees';
import { AnimatedButton } from "../common";

const ReviewPhase = ({
  selectedAddress,
  cartItems,
  onConfirm,
  onBack,
  loading,
  user: propUser,
  accessToken,
}) => {
  const { t, currentLanguage } = useLocalization();
  const { colors } = useThemedStyles();
  const styles = getReviewPhaseStyles(colors);
  const [allItems, setAllItems] = useState([]);
  const [itemsLoaded, setItemsLoaded] = useState(false);
  const [cartItemsDisplay, setCartItemsDisplay] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);

  const [isCashOrderProcessing, setIsCashOrderProcessing] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(0);

  // Helper function to get translated item names consistently
  const getTranslatedItemName = useCallback((item) => {
    const originalName = item.name || item.itemName || item.material || "Unknown Item";
    const categoryName = item.categoryName || item.category || null;
    
    // Safely extract category name from multilingual structure
    const categoryNameForTranslation = categoryName 
      ? extractNameFromMultilingual(categoryName, currentLanguage) 
      : null;
    
    const translatedName = getTranslatedName(t, originalName, "subcategories", {
      categoryName: categoryNameForTranslation
        ? categoryNameForTranslation.toLowerCase().replace(/\s+/g, "-")
        : null,
      currentLanguage
    });
    return translatedName || originalName;
  }, [t, currentLanguage]);

  // ✅ Role-based delivery fee calculation
  useEffect(() => {
    if (selectedAddress && selectedAddress.city && shouldShowDeliveryFee(user)) {
      setDeliveryFee(getDeliveryFeeForCity(selectedAddress.city));
    } else {
      setDeliveryFee(0);
    }
  }, [selectedAddress, user]);

  const { user: contextUser } = useAuth();
  const user = propUser || contextUser;
  const { cartItemDetails } = useCart(user);

  const { isProcessing, processPayment, shouldUsePayment } = usePayment();

  // Helper to check if any processing is happening
  const isAnyProcessing = isProcessing || isCashOrderProcessing;

  useEffect(() => {
    console.log(
      "[ReviewPhase] Using cart item details directly, no API call needed"
    );

    const itemsFromCart = Object.values(cartItemDetails || {});

    if (itemsFromCart.length > 0) {
      setAllItems(itemsFromCart);
      setItemsLoaded(true);
      console.log(
        "[ReviewPhase] Loaded",
        itemsFromCart.length,
        "items from cart context"
      );
    } else {
      if (cartItems && Object.keys(cartItems).length > 0) {
        console.log(
          "[ReviewPhase] Cart items exist but details not loaded yet, waiting..."
        );
        setItemsLoaded(false);
      } else {
        console.log("[ReviewPhase] No cart items found");
        setAllItems([]);
        setItemsLoaded(true);
      }
    }
  }, [cartItemDetails, cartItems]);

  useEffect(() => {
    if (itemsLoaded && cartItems && allItems.length > 0) {
      const displayItems = Object.entries(cartItems).map(
        ([categoryId, quantity]) => {
          let realItem = allItems.find((item) => item._id === categoryId);

          if (!realItem) {
            realItem = allItems.find((item) => {
              const normalizedItem = normalizeItemData(item);
              return (
                normalizedItem.categoryId === categoryId ||
                String(normalizedItem.id) === String(categoryId)
              );
            });
          }

          if (realItem) {
            const normalizedItem = normalizeItemData(realItem);
            const translatedItemName = getTranslatedItemName(normalizedItem);
            return {
              categoryId,
              quantity,
              itemName: translatedItemName,
              measurement_unit:
                normalizedItem.measurement_unit === 1 ? t("units.kg") : t("units.piece"),
              points: normalizedItem.points || 10,
              price: normalizedItem.price || 5.0,
              image: normalizedItem.image,
              totalPoints: (normalizedItem.points || 10) * quantity,
              totalPrice: (normalizedItem.price || 5.0) * quantity,
              isValidItem: true,
            };
          } else {
            console.warn(
              `[ReviewPhase] Item ${categoryId} not found in catalog - may be discontinued`
            );

            let itemName = "Recycling Item";
            let measurementUnit = "KG";

            const validCartItems = Object.entries(cartItems)
              .map(([id, qty]) => {
                const foundItem = allItems.find((item) => {
                  const normalized = normalizeItemData(item);
                  return (
                    normalized.categoryId === id ||
                    String(normalized._id) === String(id)
                  );
                });
                return foundItem ? normalizeItemData(foundItem) : null;
              })
              .filter(Boolean);

            if (validCartItems.length > 0) {
              const sampleItem = validCartItems[0];
              itemName = `${sampleItem.categoryName || "Recycling"} Item`;
              measurementUnit =
                sampleItem.measurement_unit === 1 ? "KG" : "Piece";
            } else if (allItems.length > 0) {
              const sampleItem =
                allItems.find((item) => item.categoryName) || allItems[0];
              if (sampleItem?.categoryName) {
                itemName = `${sampleItem.categoryName} Item`;
                measurementUnit =
                  sampleItem.measurement_unit === 1 ? "KG" : "Piece";
              }
            }

            return {
              categoryId,
              quantity,
              itemName,
              measurement_unit: measurementUnit,
              points: 10,
              price: 5.0,
              image: null,
              totalPoints: 10 * quantity,
              totalPrice: 5.0 * quantity,
              isValidItem: false,
            };
          }
        }
      );

      const validItems = displayItems.filter((item) => item.isValidItem);
      const invalidItems = displayItems.filter((item) => !item.isValidItem);

      if (invalidItems.length > 0) {
        console.warn(
          `[ReviewPhase] Found ${invalidItems.length} invalid/stale cart items out of ${displayItems.length} total`
        );
      }

      console.log("[ReviewPhase] Cart summary:", {
        totalItems: displayItems.length,
        validItems: validItems.length,
        invalidItems: invalidItems.length,
        itemNames: displayItems.map((item) => ({
          name: item.itemName,
          valid: item.isValidItem,
        })),
      });

      setCartItemsDisplay(displayItems);
    }
  }, [itemsLoaded, cartItems, allItems, getTranslatedItemName, t]);

  const handlePaymentFlow = async (cartItemsArray, userData) => {
    if (selectedPaymentMethod === 'cash') {
      // For cash on delivery, create order directly without Stripe
      await handleCashOnDeliveryOrder();
    } else {
      // For credit card, use the existing Stripe flow
      await processPayment({
        user,
        accessToken,
        cartItemsDisplay,
        deliveryFee, // Pass delivery fee to payment
        onSuccess: async (paymentResult) => {
          try {
            console.log('[ReviewPhase] Payment successful, but letting deep link handler create order:', paymentResult);
            // ✅ DON'T create order here - let the deep link handler do it
            // This prevents duplicate order creation
            // Just log the success, the deep link will handle order creation
            console.log('[ReviewPhase] Payment completed, waiting for deep link return...');
          } catch (error) {
            console.error('[ReviewPhase] Payment processing error:', error);
            Alert.alert(
              "Payment Processing Error", 
              error.message || "Payment processing failed. Please try again.",
              [{ text: "OK" }]
            );
          }
        },
        onError: (error) => {
          console.error("[ReviewPhase] Payment failed:", error.message);
          Alert.alert(
            "Payment Failed",
            error.message || "Payment failed. Please try again.",
            [{ text: "OK" }]
          );
        },
        // Only pass paymentMethod if user is a buyer
        ...(isBuyerRole(user) ? { paymentMethod: 'card' } : {})
      });
    }
  };

  const handleCashOnDeliveryOrder = async () => {
    if (isCashOrderProcessing) return;
    setIsCashOrderProcessing(true);
    try {
      console.log('[ReviewPhase] Creating cash order via unified service');
      // Use the unified order flow through onConfirm (which is createOrder from usePickupWorkflow)
      if (typeof onConfirm === "function") {
        const order = await onConfirm({ paymentMethod: 'cash' });
        console.log('[ReviewPhase] Cash order created successfully:', order);
      }
    } catch (error) {
      console.error('[ReviewPhase] Cash order creation failed:', error);
      Alert.alert(
        "Order Creation Failed",
        error.message || "Failed to create order. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsCashOrderProcessing(false);
    }
  };

  const handleRegularOrderFlow = (cartItemsArray, userData) => {
    if (typeof onConfirm === "function") {
      onConfirm(cartItemsArray, userData);
    }
  };

  const handleConfirm = async () => {
    if (!cartItems || typeof cartItems !== "object") {
      console.error("[ReviewPhase] Invalid cartItems format:", cartItems);
      return;
    }

    // For buyers, check if payment method is selected
    if (shouldUsePayment(user) && !selectedPaymentMethod) {
      // Payment method selection is handled in the UI
      return;
    }

    const cartItemsArray = Object.entries(cartItems).map(
      ([categoryId, quantity]) => {
        let realItem = allItems.find((item) => item._id === categoryId);

        if (!realItem) {
          realItem = allItems.find((item) => {
            const normalizedItem = normalizeItemData(item);
            return (
              normalizedItem.categoryId === categoryId ||
              String(normalizedItem.id) === String(categoryId)
            );
          });
        }

        if (realItem) {
          const normalizedItem = normalizeItemData(realItem);
          const measurementUnit =
            typeof normalizedItem.measurement_unit === "string"
              ? normalizedItem.measurement_unit === "KG"
                ? 1
                : 2
              : Number(normalizedItem.measurement_unit);

          const translatedItemName = getTranslatedItemName(normalizedItem);

          return {
            _id: normalizedItem._id || normalizedItem.id || categoryId,
            categoryId: categoryId,
            quantity: quantity,
            name: translatedItemName,
            categoryName: normalizedItem.categoryName || "Unknown Category",
            measurement_unit: measurementUnit,
            points: normalizedItem.points || 10,
            price: normalizedItem.price || 5.0,
            image:
              normalizedItem.image ||
              `${(normalizedItem.name || normalizedItem.itemName || "item")
                .toLowerCase()
                .replace(/\s+/g, "-")}.png`,
          };
        } else {
          return {
            _id: categoryId,
            categoryId: categoryId,
            quantity: quantity,
            name: `Recycling Item`,
            categoryName: "Unknown Category",
            measurement_unit: 1,
            points: 10,
            price: 5.0,
            image: `recycling-item.png`,
          };
        }
      }
    );

    const userData = user
      ? {
          userId: user._id || user.userId,
          phoneNumber: user.phoneNumber || user.phone || "",
          userName: user.name || user.userName || user.fullName || "User",
          email: user.email || "",
          imageUrl:
            (typeof user.imageUrl === "string" &&
              user.imageUrl &&
              user.imageUrl.trim()) ||
            (typeof user.image === "string" &&
              user.image &&
              user.image.trim()) ||
            "https://via.placeholder.com/150/0000FF/808080?text=User",
          role: user.role,
        }
      : null;

    console.log("[ReviewPhase] Prepared user data:", JSON.stringify(userData, null, 2));

    if (shouldUsePayment(user)) {
      await handlePaymentFlow(cartItemsArray, userData);
    } else {
      handleRegularOrderFlow(cartItemsArray, userData);
    }
  };


  // totalItems: number of unique items in the order (not sum of quantities)
  const totalItems = cartItemsDisplay.filter(item => item.quantity > 0).length;
  const totalPoints = cartItemsDisplay.reduce(
    (sum, item) => sum + item.totalPoints,
    0
  );
  // ✅ Role-based totals calculation
  const itemsTotalPrice = cartItemsDisplay.reduce(
    (sum, item) => sum + item.totalPrice,
    0
  );
  
  const totalPrice = shouldShowDeliveryFee(user) 
    ? itemsTotalPrice + deliveryFee 
    : itemsTotalPrice;

  const renderCartItem = (item, index) => (
    <View key={index} style={styles.itemCard}>
      <View style={styles.itemContent}>
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={styles.itemImage}
            onError={() => console.log("Failed to load image:", item.image)}
          />
        ) : (
          <View style={styles.placeholderImage}>
            <MaterialCommunityIcons
              name={
                item.isValidItem ? "package-variant" : "alert-circle-outline"
              }
              size={24}
              color={item.isValidItem ? colors.base300 : colors.warning}
            />
          </View>
        )}

        <View style={styles.itemDetails}>
          <View style={styles.itemNameRow}>
            <Text style={styles.itemName}>{item.itemName}</Text>
            {!item.isValidItem && (
              <View style={styles.warningBadge}>
                <MaterialCommunityIcons
                  name="alert"
                  size={12}
                  color={colors.warning}
                />
                <Text style={styles.warningText}>{t('pickup.reviewPhase.unavailable')}</Text>
              </View>
            )}
          </View>
          <View style={styles.itemMeta}>
            <Text style={styles.itemUnit}>
              {item.quantity} {item.measurement_unit}
            </Text>
            <View style={styles.separator} />
            {!isBuyer(user) && (
              <View style={styles.pointsRow}>
                <MaterialCommunityIcons
                  name="star"
                  size={14}
                  color={colors.accent}
                />
                <Text style={styles.points}>{item.totalPoints} {t('pickup.reviewPhase.points')}</Text>
              </View>
            )}
          </View>
          <Text style={styles.price}>{item.totalPrice.toFixed(2)} {t("units.egp")}</Text>
        </View>

        <View style={styles.quantityBadge}>
          <Text style={styles.quantityText}>{item.quantity}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{t('pickup.reviewPhase.title')}</Text>
            <Text style={styles.subtitle}>
              {selectedAddress?.street
                ? `${t('pickup.reviewPhase.deliveryTo')} ${selectedAddress.street}, ${
                    selectedAddress.area || selectedAddress.city
                  }`
                : t('pickup.reviewPhase.noAddress')}
            </Text>
          </View>
        </View>
      </View>

      {!itemsLoaded ? (
        <View style={styles.loadingContainer}>
          <MaterialCommunityIcons
            name="loading"
            size={32}
            color={colors.primary}
          />
          <Text style={styles.loadingText}>{t('pickup.reviewPhase.loadingItems')}</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {cartItemsDisplay.filter((item) => !item.isValidItem).length > 0 && (
            <View style={styles.warningBanner}>
              <MaterialCommunityIcons
                name="alert-circle"
                size={20}
                color={colors.warning}
              />
              <View style={styles.warningBannerText}>
                <Text style={styles.warningBannerTitle}>
                  {t('pickup.reviewPhase.unavailableItems')}
                </Text>
                <Text style={styles.warningBannerSubtitle}>
                  {t('pickup.reviewPhase.unavailableMessage')}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="package-variant"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.sectionTitle}>{t('pickup.reviewPhase.itemsInCart')}</Text>
            </View>
            {cartItemsDisplay.map((item, index) => renderCartItem(item, index))}
          </View>

          {shouldUsePayment(user) && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons
                  name="credit-card"
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.sectionTitle}>{t('pickup.reviewPhase.paymentMethod')}</Text>
              </View>
              <View style={styles.paymentMethodContainer}>
                <TouchableOpacity
                  style={[
                    styles.paymentMethodCard,
                    selectedPaymentMethod === 'cash' && styles.selectedPaymentMethod,
                  ]}
                  onPress={() => setSelectedPaymentMethod('cash')}
                >
                  <View style={styles.paymentMethodContent}>
                    <MaterialCommunityIcons
                      name="cash"
                      size={24}
                      color={selectedPaymentMethod === 'cash' ? colors.primary : colors.neutral}
                    />
                    <View style={styles.paymentMethodInfo}>
                      <Text style={[
                        styles.paymentMethodTitle,
                        selectedPaymentMethod === 'cash' && styles.selectedPaymentMethodTitle,
                      ]}>
                        {t('pickup.reviewPhase.cashOnDelivery')}
                      </Text>
                      <Text style={styles.paymentMethodDescription}>
                        {t('pickup.reviewPhase.cashDescription')}
                      </Text>
                    </View>
                    <View style={styles.radioButton}>
                      {selectedPaymentMethod === 'cash' && (
                        <View style={styles.radioButtonSelected} />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.paymentMethodCard,
                    selectedPaymentMethod === 'card' && styles.selectedPaymentMethod,
                  ]}
                  onPress={() => setSelectedPaymentMethod('card')}
                >
                  <View style={styles.paymentMethodContent}>
                    <MaterialCommunityIcons
                      name="credit-card-outline"
                      size={24}
                      color={selectedPaymentMethod === 'card' ? colors.primary : colors.neutral}
                    />
                    <View style={styles.paymentMethodInfo}>
                      <Text style={[
                        styles.paymentMethodTitle,
                        selectedPaymentMethod === 'card' && styles.selectedPaymentMethodTitle,
                      ]}>
                        {t('pickup.reviewPhase.creditCard')}
                      </Text>
                      <Text style={styles.paymentMethodDescription}>
                        {t("pickup.reviewPhase.cardDescription")}
                      </Text>
                    </View>
                    <View style={styles.radioButton}>
                      {selectedPaymentMethod === 'card' && (
                        <View style={styles.radioButtonSelected} />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="calculator"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.sectionTitle}>{t("pickup.reviewPhase.orderSummary")}</Text>
            </View>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t("pickup.reviewPhase.totalItems")}</Text>
                <Text style={styles.summaryValue}>{totalItems}</Text>
              </View>
              
              {!isBuyerRole(user) && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{t("pickup.reviewPhase.totalPoints")}</Text>
                  <View style={styles.pointsContainer}>
                    <MaterialCommunityIcons
                      name="star"
                      size={16}
                      color={colors.accent}
                    />
                    <Text style={[styles.summaryValue, styles.pointsText]}>
                      {totalPoints}
                    </Text>
                  </View>
                </View>
              )}
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  {isBuyerRole(user) ? t("pickup.reviewPhase.itemsSubtotal") : t("pickup.reviewPhase.totalValue")}
                </Text>
                <Text style={styles.summaryValue}>
                  {itemsTotalPrice.toFixed(2)} {t("units.egp")}
                </Text>
              </View>
              
              {/* ✅ Only show delivery fee for buyers */}
              {shouldShowDeliveryFee(user) && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{t("pickup.reviewPhase.deliveryFee")}</Text>
                  <Text style={styles.summaryValue}>
                    {deliveryFee.toFixed(2)} {t("units.egp")}
                  </Text>
                </View>
              )}
              
              {/* ✅ Only show total value for buyers */}
              {shouldShowTotalValue(user) && (
                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>{t("pickup.reviewPhase.totalValue")}</Text>
                  <Text style={styles.totalValue}>
                    {totalPrice.toFixed(2)} {t("units.egp")}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (typeof onBack === "function") {
              onBack();
            }
          }}
          disabled={isAnyProcessing}
        >
          <Text style={styles.backButtonText}>{t("pickup.reviewPhase.backToAddress")}</Text>
        </TouchableOpacity>

        <AnimatedButton
          style={[
            styles.confirmButton,
            (!itemsLoaded || isAnyProcessing || (shouldUsePayment(user) && !selectedPaymentMethod)) && styles.disabledButton,
          ]}
          onPress={handleConfirm}
          disabled={!itemsLoaded || isAnyProcessing || (shouldUsePayment(user) && !selectedPaymentMethod)}
        >
          {isAnyProcessing ? (
            <MaterialCommunityIcons
              name="loading"
              size={20}
              color={colors.white}
            />
          ) : (
            <MaterialCommunityIcons
              name="check"
              size={20}
              color={colors.white}
            />
          )}
          <Text style={styles.confirmButtonText}>
            {isAnyProcessing
              ? isCashOrderProcessing
                ? t('pickup.reviewPhase.creatingOrder')
                : "Processing..."
              : shouldUsePayment(user)
              ? selectedPaymentMethod === 'cash'
                ? t("pickup.reviewPhase.confirmOrder")
                : selectedPaymentMethod === 'card'
                ? t("pickup.reviewPhase.payAndConfirm")
                : t("pickup.reviewPhase.selectPaymentMethod")
              : t("pickup.reviewPhase.confirmOrder")}
          </Text>
        </AnimatedButton>
      </View>
    </View>
  );
};

// Dynamic styles function for ReviewPhase
const getReviewPhaseStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  header: {
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.title,
    fontSize: 20,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },

  content: {
    flex: 1,
  },
  warningBanner: {
    backgroundColor: colors.warning + "15",
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
    marginHorizontal: spacing.xl,
    marginVertical: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  warningBannerText: {
    flex: 1,
  },
  warningBannerTitle: {
    ...typography.subtitle,
    fontWeight: "bold",
    color: colors.warning,
    marginBottom: spacing.xs,
  },
  warningBannerSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.subtitle,
    fontWeight: "bold",
    color: colors.primary,
  },

  itemCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemContent: {
    flexDirection: "row",
    padding: spacing.lg,
    alignItems: "center",
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceVariant,
  },
  placeholderImage: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceVariant,
    justifyContent: "center",
    alignItems: "center",
  },
  itemDetails: {
    flex: 1,
    marginLeft: spacing.lg,
  },
  itemNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  itemName: {
    ...typography.subtitle,
    fontWeight: "bold",
    color: colors.text,
    flex: 1,
  },
  warningBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.warning + "20",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: spacing.xs,
  },
  warningText: {
    ...typography.caption,
    color: colors.warning,
    fontSize: 10,
    fontWeight: "600",
  },
  itemMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  itemUnit: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 13,
  },
  separator: {
    width: 1,
    height: 12,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },
  pointsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  points: {
    ...typography.body,
    color: colors.accent,
    fontWeight: "600",
    fontSize: 13,
  },
  price: {
    ...typography.subtitle,
    color: colors.secondary,
    fontWeight: "bold",
  },
  quantityBadge: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minWidth: 24,
    alignItems: "center",
  },
  quantityText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: "bold",
    fontSize: 12,
  },

  summaryCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  summaryLabel: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  summaryValue: {
    ...typography.subtitle,
    fontWeight: "bold",
    color: colors.text,
  },
  pointsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  pointsText: {
    color: colors.accent,
  },
  totalRow: {
    borderBottomWidth: 0,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginTop: spacing.sm,
  },
  totalLabel: {
    ...typography.subtitle,
    fontWeight: "bold",
    color: colors.primary,
    fontSize: 16,
  },
  totalValue: {
    ...typography.title,
    fontWeight: "bold",
    color: colors.secondary,
    fontSize: 18,
  },

  // Payment Method Styles
  paymentMethodContainer: {
    marginHorizontal: spacing.xl,
    gap: spacing.md,
  },
  paymentMethodCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 0,
  },
  selectedPaymentMethod: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + "05",
  },
  paymentMethodContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodTitle: {
    ...typography.subtitle,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  selectedPaymentMethodTitle: {
    color: colors.primary,
  },
  paymentMethodDescription: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 13,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  radioButtonSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },

  footer: {
    flexDirection: "row",
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  backButton: {
    flex: 1,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.error,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  backButtonText: {
    ...typography.subtitle,
    color: colors.white,
    fontWeight: "600",
  },
  confirmButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    gap: spacing.sm,
  },
  confirmButtonText: {
    ...typography.subtitle,
    color: colors.white,
    fontWeight: "700",
  },
  disabledButton: {
    backgroundColor: colors.disabled,
  },
});

export default ReviewPhase;
