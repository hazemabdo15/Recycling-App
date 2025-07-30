import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { usePayment } from "../../hooks/usePayment";

import { categoriesAPI } from "../../services/api";
import { API_BASE_URL } from "../../services/api/config";
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

  // Get the real logged-in user from AuthContext, but prefer prop user
  const { user: contextUser } = useAuth();
  const user = propUser || contextUser;

  // Payment processing hook
  const { isProcessing, processPayment, shouldUsePayment } = usePayment();

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await categoriesAPI.getAllItems(user?.role || "customer");
        const items = response.data?.items || response.data || response.items || response;
        const normalizedItems = Array.isArray(items) ? items.map(normalizeItemData) : [];
        
        if (normalizedItems.length === 0) {
          // If API fails, try to get data from backend cart endpoint
          try {
            const backendResponse = await fetch(`${API_BASE_URL}/api/cart`, {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (backendResponse.ok) {
              const backendCartData = await backendResponse.json();
              const backendItems = backendCartData.items || [];
              
              // Use backend cart items which already have the right structure
              setAllItems(backendItems.map(normalizeItemData));
            } else {
              setAllItems([]);
            }
          } catch (backendError) {
            console.error('[ReviewPhase] Backend cart fetch error:', backendError);
            setAllItems([]);
          }
        } else {
          setAllItems(normalizedItems);
        }
        
        setItemsLoaded(true);
      } catch (error) {
        console.error("[ReviewPhase] Failed to fetch items:", error);
        setAllItems([]);
        setItemsLoaded(true);
      }
    };

    fetchItems();
  }, [accessToken, cartItems,user?.role]);

  useEffect(() => {
    if (itemsLoaded && cartItems && allItems.length > 0) {
      const displayItems = Object.entries(cartItems).map(
        ([categoryId, quantity]) => {
          // The cart key might be either the item's _id or its categoryId
          // Try to find the item by _id first (most common case), then by categoryId
          let realItem = allItems.find(item => item._id === categoryId);
          
          if (!realItem) {
            // If not found by _id, try by categoryId after normalization
            realItem = allItems.find(item => {
              const normalizedItem = normalizeItemData(item);
              return normalizedItem.categoryId === categoryId ||
                     String(normalizedItem.id) === String(categoryId);
            });
          }

          if (realItem) {
            const normalizedItem = normalizeItemData(realItem);
            return {
              categoryId,
              quantity,
              itemName: normalizedItem.name || normalizedItem.itemName || normalizedItem.categoryName || `Item ${categoryId.slice(-4)}`,
              measurement_unit: normalizedItem.measurement_unit === 1 ? "KG" : "Piece",
              points: normalizedItem.points || 10,
              price: normalizedItem.price || 5.0,
              image: normalizedItem.image,
              totalPoints: (normalizedItem.points || 10) * quantity,
              totalPrice: (normalizedItem.price || 5.0) * quantity,
              isValidItem: true // Mark as valid item
            };
          } else {
            // Enhanced fallback for items not found in current catalog
            console.warn(`[ReviewPhase] Item ${categoryId} not found in catalog - may be discontinued`);
            
            // Try to determine a more meaningful name based on other items in cart
            let itemName = "Recycling Item";
            let measurementUnit = "KG";
            
            // Look for other valid items to infer category
            const validCartItems = Object.entries(cartItems).map(([id, qty]) => {
              const foundItem = allItems.find(item => {
                const normalized = normalizeItemData(item);
                return normalized.categoryId === id || String(normalized._id) === String(id);
              });
              return foundItem ? normalizeItemData(foundItem) : null;
            }).filter(Boolean);
            
            if (validCartItems.length > 0) {
              const sampleItem = validCartItems[0];
              itemName = `${sampleItem.categoryName || 'Recycling'} Item`;
              measurementUnit = sampleItem.measurement_unit === 1 ? "KG" : "Piece";
            } else if (allItems.length > 0) {
              // Fall back to any available item
              const sampleItem = allItems.find(item => item.categoryName) || allItems[0];
              if (sampleItem?.categoryName) {
                itemName = `${sampleItem.categoryName} Item`;
                measurementUnit = sampleItem.measurement_unit === 1 ? "KG" : "Piece";
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
              isValidItem: false // Mark as invalid/fallback item
            };
          }
        }
      );

      // Log summary of what we found
      const validItems = displayItems.filter(item => item.isValidItem);
      const invalidItems = displayItems.filter(item => !item.isValidItem);
      
      if (invalidItems.length > 0) {
        console.warn(`[ReviewPhase] Found ${invalidItems.length} invalid/stale cart items out of ${displayItems.length} total`);
      }
      
      console.log('[ReviewPhase] Cart summary:', {
        totalItems: displayItems.length,
        validItems: validItems.length,
        invalidItems: invalidItems.length,
        itemNames: displayItems.map(item => ({ name: item.itemName, valid: item.isValidItem }))
      });

      setCartItemsDisplay(displayItems);
    }
  }, [itemsLoaded, cartItems, allItems]);

  /**
   * Handles payment processing for buyers
   */
  const handlePaymentFlow = async (cartItemsArray, userData) => {
    await processPayment({
      user,
      accessToken,
      cartItemsDisplay,
      onSuccess: (result) => {
        // Payment initiated successfully
      },
      onError: (error) => {
        console.error("[ReviewPhase] Payment failed:", error.message);
      },
    });
  };

  /**
   * Handles regular order flow for non-buyers
   */
  const handleRegularOrderFlow = (cartItemsArray, userData) => {
    if (typeof onConfirm === "function") {
      onConfirm(cartItemsArray, userData);
    }
  };

  /**
   * Main confirm handler - routes to appropriate flow based on user role
   */
  const handleConfirm = async () => {
    if (!cartItems || typeof cartItems !== "object") {
      console.error("[ReviewPhase] Invalid cartItems format:", cartItems);
      return;
    }

    // Process cart items
    const cartItemsArray = Object.entries(cartItems).map(
      ([categoryId, quantity]) => {
        // The cart key might be either the item's _id or its categoryId
        // Try to find the item by _id first (most common case), then by categoryId
        let realItem = allItems.find(item => item._id === categoryId);
        
        if (!realItem) {
          // If not found by _id, try by categoryId after normalization
          realItem = allItems.find(item => {
            const normalizedItem = normalizeItemData(item);
            return normalizedItem.categoryId === categoryId ||
                   String(normalizedItem.id) === String(categoryId);
          });
        }

        if (realItem) {
          const normalizedItem = normalizeItemData(realItem);
          const measurementUnit = typeof normalizedItem.measurement_unit === 'string' 
            ? (normalizedItem.measurement_unit === "KG" ? 1 : 2) 
            : Number(normalizedItem.measurement_unit);
            
          return {
            categoryId: categoryId,
            quantity: quantity,
            itemName: normalizedItem.name || normalizedItem.itemName || normalizedItem.categoryName,
            measurement_unit: measurementUnit,
            points: normalizedItem.points || 10,
            price: normalizedItem.price || 5.0,
            image: normalizedItem.image || `${(normalizedItem.name || 'item').toLowerCase().replace(/\s+/g, "-")}.png`,
          };
        } else {
          return {
            categoryId: categoryId,
            quantity: quantity,
            itemName: `Recycling Item`,
            measurement_unit: 1,
            points: 10,
            price: 5.0,
            image: `recycling-item.png`,
          };
        }
      }
    );

    // Prepare user data
    const userData = user ? {
      userId: user._id || user.userId,
      phoneNumber: user.phoneNumber,
      userName: user.name || user.userName,
      email: user.email,
      imageUrl: (typeof user.imageUrl === 'string' && user.imageUrl && user.imageUrl.trim())
        || (typeof user.image === 'string' && user.image && user.image.trim())
        || 'https://via.placeholder.com/150/0000FF/808080?text=User',
      role: user.role,
    } : null;

    // Route to appropriate flow based on user role
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
              name={item.isValidItem ? "package-variant" : "alert-circle-outline"}
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
                <MaterialCommunityIcons name="alert" size={12} color={colors.warning} />
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
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
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
          {/* Warning banner for invalid items */}
          {cartItemsDisplay.filter(item => !item.isValidItem).length > 0 && (
            <View style={styles.warningBanner}>
              <MaterialCommunityIcons name="alert-circle" size={20} color={colors.warning} />
              <View style={styles.warningBannerText}>
                <Text style={styles.warningBannerTitle}>Some items may be unavailable</Text>
                <Text style={styles.warningBannerSubtitle}>
                  These items might have been removed from the catalog. You can still proceed with your order.
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
          disabled={isProcessing}
        >
          <Text style={styles.backButtonText}>Back to Address</Text>
        </TouchableOpacity>

        <AnimatedButton
          style={[
            styles.confirmButton, 
            (!itemsLoaded || isProcessing) && styles.disabledButton
          ]}
          onPress={handleConfirm}
          disabled={!itemsLoaded || isProcessing}
        >
          {isProcessing ? (
            <MaterialCommunityIcons name="loading" size={20} color={colors.white} />
          ) : (
            <MaterialCommunityIcons name="check" size={20} color={colors.white} />
          )}
          <Text style={styles.confirmButtonText}>
            {isProcessing 
              ? 'Processing...' 
              : user?.role === 'buyer' 
                ? 'Pay & Confirm Order' 
                : 'Confirm Order'
            }
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
    backgroundColor: colors.warning + "15", // 15% opacity
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
    backgroundColor: colors.warning + "20", // 20% opacity
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
