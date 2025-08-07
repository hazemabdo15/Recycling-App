import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
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
import { useCart } from "../../hooks/useCart";
import { usePayment } from "../../hooks/usePayment";
import { orderService } from "../../services/api/orders";

import { borderRadius, spacing, typography } from "../../styles";
import { colors } from "../../styles/theme";
import { normalizeItemData } from "../../utils/cartUtils";
import { isBuyer } from "../../utils/roleLabels";
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
  const [allItems, setAllItems] = useState([]);
  const [itemsLoaded, setItemsLoaded] = useState(false);
  const [cartItemsDisplay, setCartItemsDisplay] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [isCashOrderProcessing, setIsCashOrderProcessing] = useState(false);

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
            return {
              categoryId,
              quantity,
              itemName:
                normalizedItem.name ||
                normalizedItem.itemName ||
                normalizedItem.categoryName ||
                `Item ${categoryId.slice(-4)}`,
              measurement_unit:
                normalizedItem.measurement_unit === 1 ? "KG" : "Piece",
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
  }, [itemsLoaded, cartItems, allItems]);

  const handlePaymentFlow = async (cartItemsArray, userData) => {
    if (selectedPaymentMethod === 'cash') {
      // For cash on delivery, create order directly without Stripe
      await handleCashOnDeliveryOrder(cartItemsArray, userData);
    } else {
      // For credit card, use the existing Stripe flow
      await processPayment({
        user,
        accessToken,
        cartItemsDisplay,
        onSuccess: (result) => {},
        onError: (error) => {
          console.error("[ReviewPhase] Payment failed:", error.message);
        },
      });
    }
  };

  const handleCashOnDeliveryOrder = async (cartItemsArray, userData) => {
    if (isCashOrderProcessing) return;
    
    setIsCashOrderProcessing(true);
    
    try {
      console.log("[ReviewPhase] Creating cash on delivery order");
      console.log("[ReviewPhase] User data received:", JSON.stringify(userData, null, 2));
      console.log("[ReviewPhase] Selected address:", JSON.stringify(selectedAddress, null, 2));
      console.log("[ReviewPhase] Cart items array received:", JSON.stringify(cartItemsArray, null, 2));
      console.log("[ReviewPhase] All items for reference:", JSON.stringify(allItems, null, 2));
      
      // Validate required user data
      if (!userData || !userData.userId || !userData.phoneNumber || !userData.userName || !userData.email) {
        throw new Error("Missing required user information. Please make sure you're logged in properly.");
      }
      
      // Transform cart items to match the backend expected format
      const formattedItems = cartItemsArray.map(item => {
        // Find the corresponding item in allItems to get the actual category data
        const originalItem = allItems.find(origItem => origItem._id === item._id);
        const actualCategoryId = originalItem?.categoryId || originalItem?.category?._id || originalItem?.category || item.categoryId;
        
        console.log(`[ReviewPhase] Processing item ${item.name}:`, {
          itemId: item._id,
          providedCategoryId: item.categoryId,
          actualCategoryId: actualCategoryId,
          originalItem: originalItem ? 'found' : 'not found'
        });
        
        return {
          _id: item._id,
          categoryId: actualCategoryId,
          name: item.name || item.itemName || "Unknown Item",
          itemName: item.name || item.itemName || "Unknown Item",
          image: item.image || `${(item.name || "item").toLowerCase().replace(/\s+/g, "-")}.png`,
          measurement_unit: item.measurement_unit,
          points: item.points || 0,
          price: item.price || 0,
          quantity: item.quantity,
          categoryName: item.categoryName || "Unknown Category",
          originalQuantity: null,
          quantityAdjusted: false,
          unit: item.measurement_unit === 1 ? "kg" : "piece"
        };
      });

      const orderData = {
        phoneNumber: userData.phoneNumber,
        userName: userData.userName,
        email: userData.email,
        imageUrl: userData.imageUrl,
        user: {
          userId: userData.userId,
          phoneNumber: userData.phoneNumber,
          userName: userData.userName,
          email: userData.email
        },
        address: {
          city: selectedAddress.city,
          area: selectedAddress.area,
          street: selectedAddress.street,
          building: selectedAddress.building || "",
          floor: selectedAddress.floor || "",
          apartment: selectedAddress.apartment || "",
          landmark: selectedAddress.landmark || "",
          isDefault: selectedAddress.isDefault || false
        },
        items: formattedItems,
        status: "pending",
        paymentMethod: 'cash_on_delivery',
        courier: null,
        deliveryProof: null,
        collectedAt: null,
        completedAt: null,
        estimatedWeight: null,
        quantityAdjustmentNotes: null,
        hasQuantityAdjustments: false,
        statusHistory: []
      };

      console.log("[ReviewPhase] Order data to be sent:", JSON.stringify(orderData, null, 2));

      // Create order using the order service
      const orderResponse = await orderService.createOrder(orderData);
      
      console.log("[ReviewPhase] Cash on delivery order created successfully:", orderResponse);
      
      // Navigate to confirmation phase with the completed cash order
      if (typeof onConfirm === "function") {
        onConfirm(cartItemsArray, userData, { 
          paymentMethod: 'cash_on_delivery', 
          orderResponse,
          orderData,
          isOrderComplete: true, // Flag to indicate order is already created
          skipOrderCreation: true // Flag to skip any additional order processing
        });
      }
    } catch (error) {
      console.error("[ReviewPhase] Failed to create cash on delivery order:", error);
      
      let errorMessage = "Failed to create order. Please try again.";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
        console.error("[ReviewPhase] Backend error:", error.response.data.message);
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert(
        "Order Creation Failed",
        errorMessage,
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

          return {
            _id: normalizedItem._id || normalizedItem.id || categoryId,
            categoryId: categoryId,
            quantity: quantity,
            name:
              normalizedItem.name ||
              normalizedItem.itemName ||
              normalizedItem.categoryName ||
              "Unknown Item",
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

  const totalItems = cartItemsDisplay.reduce(
    (sum, item) => sum + item.quantity,
    0
  );
  const totalPoints = cartItemsDisplay.reduce(
    (sum, item) => sum + item.totalPoints,
    0
  );
  const totalPrice = cartItemsDisplay.reduce(
    (sum, item) => sum + item.totalPrice,
    0
  );

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
                <Text style={styles.warningText}>Unavailable</Text>
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
                <Text style={styles.points}>{item.totalPoints} pts</Text>
              </View>
            )}
          </View>
          <Text style={styles.price}>{item.totalPrice.toFixed(2)} EGP</Text>
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
            <Text style={styles.title}>Review Your Order</Text>
            <Text style={styles.subtitle}>
              {selectedAddress?.street
                ? `Delivery to ${selectedAddress.street}, ${
                    selectedAddress.area || selectedAddress.city
                  }`
                : "No address selected"}
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
          <Text style={styles.loadingText}>Loading items...</Text>
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
                  Some items may be unavailable
                </Text>
                <Text style={styles.warningBannerSubtitle}>
                  These items might have been removed from the catalog. You can
                  still proceed with your order.
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
              <Text style={styles.sectionTitle}>Items in your cart</Text>
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
                <Text style={styles.sectionTitle}>Payment Method</Text>
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
                        Cash on Delivery
                      </Text>
                      <Text style={styles.paymentMethodDescription}>
                        Pay when your order is delivered
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
                        Credit Card
                      </Text>
                      <Text style={styles.paymentMethodDescription}>
                        Pay securely online with your card
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
              <Text style={styles.sectionTitle}>Order Summary</Text>
            </View>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Items:</Text>
                <Text style={styles.summaryValue}>{totalItems}</Text>
              </View>
              {!isBuyer(user) && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Points:</Text>
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
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total Value:</Text>
                <Text style={styles.totalValue}>
                  {totalPrice.toFixed(2)} EGP
                </Text>
              </View>
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
          <Text style={styles.backButtonText}>Back to Address</Text>
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
                ? "Creating Order..."
                : "Processing..."
              : shouldUsePayment(user)
              ? selectedPaymentMethod === 'cash'
                ? "Confirm Order"
                : selectedPaymentMethod === 'card'
                ? "Pay & Confirm Order"
                : "Select Payment Method"
              : "Confirm Order"}
          </Text>
        </AnimatedButton>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.base100,
  },

  header: {
    padding: spacing.xl,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.base200,
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
    color: colors.neutral,
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
    color: colors.neutral,
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
    color: colors.neutral,
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
    backgroundColor: colors.white,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    shadowColor: colors.black,
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
    backgroundColor: colors.base100,
  },
  placeholderImage: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
    backgroundColor: colors.base100,
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
    color: colors.black,
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
    color: colors.neutral,
    fontSize: 13,
  },
  separator: {
    width: 1,
    height: 12,
    backgroundColor: colors.base200,
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
    backgroundColor: colors.white,
    marginHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: colors.black,
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
    borderBottomColor: colors.base100,
  },
  summaryLabel: {
    ...typography.body,
    color: colors.neutral,
    fontWeight: "500",
  },
  summaryValue: {
    ...typography.subtitle,
    fontWeight: "bold",
    color: colors.black,
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
    borderTopColor: colors.base200,
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
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.base200,
    shadowColor: colors.black,
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
    color: colors.black,
    marginBottom: spacing.xs,
  },
  selectedPaymentMethodTitle: {
    color: colors.primary,
  },
  paymentMethodDescription: {
    ...typography.body,
    color: colors.neutral,
    fontSize: 13,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.base300,
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
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.base200,
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
    borderColor: colors.base200,
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
    backgroundColor: colors.base300,
  },
});

export default ReviewPhase;
