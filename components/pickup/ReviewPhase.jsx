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

import { categoriesAPI } from "../../services/api";
import { borderRadius, spacing, typography } from "../../styles";
import { colors } from "../../styles/theme";
import { AnimatedButton } from "../common";

const ReviewPhase = ({
  selectedAddress,
  cartItems,
  onConfirm,
  onBack,
  loading,
}) => {
  console.log("[ReviewPhase] MINIMAL component starting");
  console.log("[ReviewPhase] Received props:", {
    selectedAddress: !!selectedAddress,
    cartItems: cartItems,
    cartItemsType: typeof cartItems,
    cartItemsKeys: cartItems ? Object.keys(cartItems) : [],
    onConfirm: typeof onConfirm,
    onBack: typeof onBack,
    loading: typeof loading,
  });

  const [allItems, setAllItems] = useState([]);
  const [itemsLoaded, setItemsLoaded] = useState(false);
  const [cartItemsDisplay, setCartItemsDisplay] = useState([]);

  // Get the real logged-in user from AuthContext
  const { user } = useAuth();

  useEffect(() => {
    const fetchItems = async () => {
      try {
        console.log("[ReviewPhase] Fetching all items...");
        const response = await categoriesAPI.getAllItems();
        const items = response.data?.items || response.data || response.items || response;
        setAllItems(Array.isArray(items) ? items : []);
        setItemsLoaded(true);
        console.log("[ReviewPhase] Items loaded:", items.length);
      } catch (error) {
        console.error("[ReviewPhase] Failed to fetch items:", error);
        setItemsLoaded(true);
      }
    };

    fetchItems();
  }, []);

  useEffect(() => {
    if (itemsLoaded && cartItems && allItems.length > 0) {
      const displayItems = Object.entries(cartItems).map(
        ([categoryId, quantity]) => {
          const realItem = allItems.find(
            (item) => item._id === categoryId || item.categoryId === categoryId
          );

          if (realItem) {
            return {
              categoryId,
              quantity,
              itemName: realItem.name,
              measurement_unit:
                realItem.measurement_unit === 1 ? "KG" : "Piece",
              points: realItem.points || 10,
              price: realItem.price || 5.0,
              image: realItem.image,
              totalPoints: (realItem.points || 10) * quantity,
              totalPrice: (realItem.price || 5.0) * quantity,
            };
          } else {
            return {
              categoryId,
              quantity,
              itemName: `Item ${categoryId}`,
              measurement_unit: "KG",
              points: 10,
              price: 5.0,
              image: null,
              totalPoints: 10 * quantity,
              totalPrice: 5.0 * quantity,
            };
          }
        }
      );

      setCartItemsDisplay(displayItems);
    }
  }, [itemsLoaded, cartItems, allItems]);

  const handleConfirm = () => {
    console.log("[ReviewPhase] MINIMAL confirm pressed");
    console.log("[ReviewPhase] Processing cart items:", cartItems);
    console.log("[ReviewPhase] Available items for lookup:", allItems.length);

    if (cartItems && typeof cartItems === "object") {

      const cartItemsArray = Object.entries(cartItems).map(
        ([categoryId, quantity]) => {

          const realItem = allItems.find(
            (item) => item._id === categoryId || item.categoryId === categoryId
          );

          if (realItem) {
            console.log(
              "[ReviewPhase] Found real item for",
              categoryId,
              ":",
              realItem.name,
              "with measurement_unit:",
              realItem.measurement_unit,
              "type:",
              typeof realItem.measurement_unit
            );
            
            const measurementUnit = typeof realItem.measurement_unit === 'string' 
              ? (realItem.measurement_unit === "KG" ? 1 : 2) 
              : Number(realItem.measurement_unit);
              
            console.log("[ReviewPhase] Converted measurement_unit to:", measurementUnit);
            
            return {
              categoryId: categoryId,
              quantity: quantity,
              itemName: realItem.name,
              measurement_unit: measurementUnit,
              points: realItem.points || 10,
              price: realItem.price || 5.0,
              image:
                realItem.image ||
                `${realItem.name.toLowerCase().replace(/\s+/g, "-")}.png`,
            };
          } else {
            console.log(
              "[ReviewPhase] No real item found for",
              categoryId,
              ", using fallback with proper image"
            );
            return {
              categoryId: categoryId,
              quantity: quantity,
              itemName: `Item ${categoryId}`,
              measurement_unit: 1,
              points: 10,
              price: 5.0,
              image: `item-${categoryId.slice(-4)}.png`,
            };
          }
        }
      );


      // Use the real user data from context, always provide imageUrl as a string
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

      console.log("[ReviewPhase] Calling onConfirm with:", {
        cartItemsArray,
        userData,
      });

      cartItemsArray.forEach((item, index) => {
        console.log(`[ReviewPhase] Item ${index + 1}:`, {
          categoryId: item.categoryId,
          quantity: item.quantity,
          quantityType: typeof item.quantity,
          measurement_unit: item.measurement_unit,
          measurement_unit_type: typeof item.measurement_unit,
          itemName: item.itemName
        });
      });

      if (typeof onConfirm === "function") {
        onConfirm(cartItemsArray, userData);
      }
    } else {
      console.error("[ReviewPhase] Invalid cartItems format:", cartItems);
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
              name="package-variant"
              size={24}
              color={colors.base300}
            />
          </View>
        )}

        <View style={styles.itemDetails}>
          <Text style={styles.itemName}>{item.itemName}</Text>
          <View style={styles.itemMeta}>
            <Text style={styles.itemUnit}>
              {item.quantity} {item.measurement_unit}
            </Text>
            <View style={styles.separator} />
            <View style={styles.pointsRow}>
              <MaterialCommunityIcons
                name="star"
                size={14}
                color={colors.accent}
              />
              <Text style={styles.points}>{item.totalPoints} pts</Text>
            </View>
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
        <Text style={styles.title}>Review Your Order</Text>
        <Text style={styles.subtitle}>
          {selectedAddress?.street
            ? `Delivery to ${selectedAddress.street}, ${
                selectedAddress.area || selectedAddress.city
              }`
            : "No address selected"}
        </Text>
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
            console.log("[ReviewPhase] Back pressed");
            if (typeof onBack === "function") {
              onBack();
            }
          }}
        >
          <Text style={styles.backButtonText}>Back to Address</Text>
        </TouchableOpacity>

        <AnimatedButton
          style={[styles.confirmButton, !itemsLoaded && styles.disabledButton]}
          onPress={handleConfirm}
          disabled={!itemsLoaded}
        >
          <MaterialCommunityIcons name="check" size={20} color={colors.white} />
          <Text style={styles.confirmButtonText}>Confirm Order</Text>
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
  itemName: {
    ...typography.subtitle,
    fontWeight: "bold",
    color: colors.black,
    marginBottom: spacing.xs,
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
