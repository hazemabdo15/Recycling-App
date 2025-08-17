import { Feather, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Print from "expo-print";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  PanResponder,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Loader } from "../components/common";
import { showGlobalToast } from "../components/common/GlobalToast";
import ReviewManager from "../components/profile/ReviewManager";
import { useAuth } from "../context/AuthContext";
import { useLocalization } from "../context/LocalizationContext";
import { orderService } from "../services/api/orders";
import { colors } from "../styles";
import { generateOrderReportHTML } from "../utils/orderReportPDF";
import { isBuyer, isCustomer } from "../utils/roleUtils";
import { scaleSize } from "../utils/scale";
import { extractNameFromMultilingual, getTranslatedName } from "../utils/translationHelpers";

const tabs = ["incoming", "completed", "cancelled"];

export default function RecyclingHistory() {
  const { user, isLoggedIn } = useAuth();
  const { tRole, t, currentLanguage } = useLocalization();
  const router = useRouter();
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("incoming");
  const [refreshing, setRefreshing] = useState(false);

  // Helper function to get translated item name
  const getTranslatedItemName = useCallback((item) => {
    if (!item || !t) return item?.itemName || item?.name || "Unknown Item";
    
    const originalName = item.itemName || item.name || "Unknown Item";
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

  // For swipe gesture
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to horizontal swipes
        return Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dy) < 20;
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx < -40) {
          // Swipe left: go to next tab
          setActiveTab((prev) => {
            const idx = tabs.indexOf(prev);
            if (idx < tabs.length - 1) return tabs[idx + 1];
            return prev;
          });
        } else if (gestureState.dx > 40) {
          // Swipe right: go to previous tab
          setActiveTab((prev) => {
            const idx = tabs.indexOf(prev);
            if (idx > 0) return tabs[idx - 1];
            return prev;
          });
        }
      },
    })
  ).current;

  function handleCancelOrder(orderId) {
    Alert.alert("Cancel Order", "Are you sure you want to cancel this order?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes",
        onPress: async () => {
          try {
            await orderService.cancelOrder(orderId);
            setAllOrders((prev) =>
              prev.map((order) =>
                order._id === orderId
                  ? { ...order, status: "cancelled" }
                  : order
              )
            );
          } catch {
            Alert.alert("Failed to cancel order");
          }
        },
      },
    ]);
  }

  useEffect(() => {
    if (isLoggedIn && user?.email) {
      fetchOrders();
    } else {
      setAllOrders([]);
      setLoading(false);
    }
  }, [user, isLoggedIn]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getOrders();
      setAllOrders(Array.isArray(response.data) ? response.data : []);
    } catch (_error) {
      setAllOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const getTabDisplayName = (tab) => {
    switch (tab) {
      case "incoming":
        return tRole("profileLabels.incomingTab", user?.role);
      case "completed":
        return tRole("profileLabels.completedTab", user?.role);
      case "cancelled":
        return tRole("profileLabels.cancelledTab", user?.role);
      default:
        return tab;
    }
  };

  const filteredOrders = allOrders.filter((order) => {
    if (activeTab === "incoming") {
      return ["pending", "accepted", "collected"].includes(order.status?.toLowerCase());
    } else if (activeTab === "completed") {
      return order.status === "completed";
    } else if (activeTab === "cancelled") {
      return order.status === "cancelled";
    }
    return true;
  });

  // Helper function to check if an order has been reviewed
  const hasReview = (orderId, userReviews) => {
    return userReviews && userReviews.some(review => review.orderId === orderId);
  };

  // Order item component
  const OrderItem = ({ order, openReviewModal, userReviews, deleteReview, isDeleting }) => (
    <View style={styles.orderCardModern}>
      <View style={styles.orderCardHeader}>
        <Text style={styles.orderDate}>
          {new Date(order.createdAt).toLocaleDateString()}
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Feather
            name={
              order.status === "completed"
                ? "check-circle"
                : order.status === "cancelled"
                ? "x-circle"
                : order.status === "collected"
                ? "package"
                : "clock"
            }
            size={scaleSize(16)}
            color={
              order.status === "completed"
                ? colors.primary
                : order.status === "cancelled"
                ? "#dc2626"
                : order.status === "collected"
                ? "#10b981"
                : "#f59e42"
            }
          />
          <Text
            style={[
              styles.orderStatusModern,
              {
                color:
                  order.status === "completed"
                    ? colors.primary
                    : order.status === "cancelled"
                    ? "#dc2626"
                    : order.status === "collected"
                    ? "#10b981"
                    : "#f59e42",
              },
            ]}
          >
            Status: {order.status}
          </Text>
        </View>
      </View>

      {/* Collected Badge */}
      {order.status?.toLowerCase() === "collected" && (
        <View style={styles.collectedBadgeContainer}>
          <View style={styles.collectedBadge}>
            <Feather name="truck" size={scaleSize(12)} color="#fff" />
            <Text style={styles.collectedBadgeText}>Collected</Text>
          </View>
        </View>
      )}
      
      <View style={styles.orderItemsList}>
        {order.items.map((item, i) => (
          <View key={item._id || i} style={styles.orderItemModern}>
            <Image
              source={{ uri: item.image }}
              style={styles.itemImageModern}
            />
            <View style={styles.itemDetailsModern}>
              <Text style={styles.itemNameModern}>
                {getTranslatedItemName(item)}
              </Text>
              <Text style={styles.itemInfoModern}>
                Qty: {item.quantity}{" "}
                {item.measurement_unit === 1 ? "kg" : "pcs"}
              </Text>
              {!isBuyer(user) && (
                <Text style={styles.itemInfoModern}>
                  Points: {item.points}
                </Text>
              )}
              <Text style={styles.itemInfoModern}>
                Price: {item.price} EGP
              </Text>
            </View>
          </View>
        ))}
      </View>
      

      <Text style={styles.addressTextModern}>
        {order.address.street}, Bldg {order.address.building}, Floor {order.address.floor}, {order.address.area}, {order.address.city}
      </Text>

      {/* Download PDF button for pending orders - for both customers and buyers */}
      {activeTab === "incoming" &&
        ["pending", "collected"].includes(order.status?.toLowerCase()) &&
        isLoggedIn && (
          <TouchableOpacity
            style={styles.downloadPdfButton}
            onPress={async () => {
              Alert.alert(
                "Download PDF",
                "Do you want to preview the order report as PDF?",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Preview",
                    onPress: async () => {
                      try {
                        if (!order || !user) {
                          Alert.alert(
                            "Missing data",
                            "Order or user info is missing."
                          );
                          return;
                        }
                        const html = generateOrderReportHTML({
                          order,
                          user,
                        });
                        await Print.printAsync({ html });
                      } catch (_err) {
                        Alert.alert(
                          "Error",
                          "Failed to generate PDF."
                        );
                      }
                    },
                  },
                ]
              );
            }}
            accessibilityLabel="Download PDF"
          >
            <View style={styles.buttonContentRow}>
              <Feather
                name="download"
                size={scaleSize(16)}
                color="#fff"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.downloadPdfButtonText}>
                Download PDF
              </Text>
            </View>
          </TouchableOpacity>
        )}

      {/* Review Button for Completed Orders */}
      {activeTab === "completed" && order.status === "completed" && (
        <>
          <TouchableOpacity
            style={[
              styles.reviewButton,
              hasReview(order._id, userReviews) && styles.reviewButtonUpdated
            ]}
            onPress={() => openReviewModal(order)}
          >
            <View style={styles.buttonContentRow}>
              <Feather
                name={hasReview(order._id, userReviews) ? "edit-3" : "star"}
                size={scaleSize(16)}
                color={hasReview(order._id, userReviews) ? "#f59e42" : "#fff"}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.reviewButtonText,
                  hasReview(order._id, userReviews) && styles.reviewButtonTextUpdated
                ]}
              >
                {hasReview(order._id, userReviews) ? "Update Review" : "Leave Review"}
              </Text>
            </View>
          </TouchableOpacity>

          {hasReview(order._id, userReviews) && (
            <TouchableOpacity
              style={styles.deleteReviewButton}
              onPress={() => {
                Alert.alert(
                  "Delete Review",
                  "Are you sure you want to delete your review?",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Delete",
                      style: "destructive",
                      onPress: async () => {
                        try {
                          await deleteReview(order._id);
                          showGlobalToast("Review deleted successfully", 1500)
                        } catch (_error) {
                          Alert.alert("Failed to delete review");
                        }
                      }
                    }
                  ]
                );
              }}
            >
              <View style={styles.buttonContentRow}>
                <Feather
                  name="trash-2"
                  size={scaleSize(16)}
                  color={isDeleting ? "#9ca3af" : "#dc2626"}
                  style={{ marginRight: 6 }}
                />
                <Text style={[
                  styles.deleteReviewButtonText,
                  isDeleting && { color: "#9ca3af" }
                ]}>
                  {isDeleting ? "Deleting..." : "Delete Review"}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </>
      )}

      {/* Cancel Order button only for customers and only for pending orders */}
      {activeTab === "incoming" &&
        order.status?.toLowerCase() === "pending" &&
        isCustomer(user) && (
          <TouchableOpacity
            onPress={() => handleCancelOrder(order._id)}
            style={styles.cancelOrderButton}
          >
            <View style={styles.buttonContentRow}>
              <Feather
                name="x-circle"
                size={scaleSize(16)}
                color="#dc2626"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.cancelOrderButtonText}>
                Cancel Order
              </Text>
            </View>
          </TouchableOpacity>
        )}
    </View>
  );

  return (
    <ReviewManager>
      {({ openReviewModal, userReviews, isReviewsLoading, deleteReview, isDeleting }) => (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#F7F8FA" }} {...panResponder.panHandlers}>
          {/* Modern Card Header */}
          <LinearGradient
            colors={[colors.primary, colors.neutral]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.heroSection,
              { paddingTop: useSafeAreaInsets.top + scaleSize(80), paddingBottom: scaleSize(40) }
            ]}
          >
            <View style={styles.headerRow}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.heroBackButton}
              >
                <MaterialIcons
                  name="arrow-back-ios"
                  size={scaleSize(22)}
                  color={"#fff"}
                />
              </TouchableOpacity>
              <View style={styles.headerTextFlex}>
                <Text style={styles.heroTitleText}>Recycling History</Text>
                <Text style={styles.heroSubtitleText}>All your recycling orders in one place</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Modern Tabs */}
          <View style={{ height: scaleSize(18) }} />
          <View style={styles.tabsContainerModern}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={
                  activeTab === tab ? styles.activeTabModern : styles.tabModern
                }
                activeOpacity={0.85}
              >
                <Text
                  style={
                    activeTab === tab
                      ? styles.activeTabTextModern
                      : styles.tabTextModern
                  }
                >
                  {getTabDisplayName(tab)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <FlatList
            data={loading ? [] : filteredOrders}
            keyExtractor={(order) => order._id}
            renderItem={
              loading
                ? undefined
                : ({ item: order }) => (
                    <OrderItem
                      order={order}
                      openReviewModal={openReviewModal}
                      userReviews={userReviews}
                      deleteReview={deleteReview}
                      isDeleting={isDeleting}
                    />
                  )
            }
            contentContainerStyle={{
              paddingHorizontal: 10,
              paddingBottom: scaleSize(120),
            }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            ListEmptyComponent={
              loading ? (
                <View style={{ padding: 32 }}>
                  <Loader />
                </View>
              ) : (
                <View style={styles.emptyStateContainerModern}>
                  <Feather
                    name="inbox"
                    size={scaleSize(48)}
                    color={colors.gray}
                    style={{ marginBottom: 10 }}
                  />
                  <Text style={styles.emptyTextModern}>No orders found.</Text>
                </View>
              )
            }
            showsVerticalScrollIndicator={false}
          />
        </SafeAreaView>
      )}
    </ReviewManager>
  );
}

const styles = StyleSheet.create({
  heroSection: {
    borderBottomLeftRadius: scaleSize(32),
    borderBottomRightRadius: scaleSize(32),
    paddingHorizontal: scaleSize(18),
    paddingBottom: scaleSize(32),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scaleSize(56), // increased from 32 to lower the content
  },
  heroBackButton: {
    marginRight: scaleSize(12),
    padding: scaleSize(6),
    alignSelf: 'center',
  },
  heroTitleText: {
    fontSize: scaleSize(22),
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.2,
    marginBottom: scaleSize(2),
    textAlign: 'center',
  },
  heroSubtitleText: {
    fontSize: scaleSize(14),
    color: '#e0f2f1',
    marginTop: 0,
    textAlign: 'center',
    fontWeight: '400',
    opacity: 0.95,
  },
  headerTextFlex: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -scaleSize(36),
  },
  tabsContainerModern: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: scaleSize(18),
    backgroundColor: "transparent",
    paddingHorizontal: 0,
    gap: scaleSize(6),
  },
  tabModern: {
    flex: 0,
    width: scaleSize(110),
    paddingVertical: scaleSize(10),
    alignItems: "center",
    justifyContent: "center",
    borderRadius: scaleSize(20),
    marginHorizontal: scaleSize(2),
    backgroundColor: "#f1f5f9",
    minWidth: 0,
  },
  activeTabModern: {
    flex: 0,
    width: scaleSize(110),
    paddingVertical: scaleSize(10),
    backgroundColor: colors.primary,
    borderRadius: scaleSize(20),
    alignItems: "center",
    justifyContent: "center",
    minWidth: 0,
  },
  tabTextModern: {
    color: colors.primary,
    fontWeight: "600",
    fontSize: scaleSize(14),
    textAlign: "center",
  },
  activeTabTextModern: {
    color: "#fff",
    fontWeight: "700",
    fontSize: scaleSize(14),
    textAlign: "center",
  },
  orderCardModern: {
    backgroundColor: colors.white,
    borderRadius: scaleSize(18),
    padding: scaleSize(16),
    marginBottom: scaleSize(14),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  orderCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: scaleSize(8),
  },
  orderDate: {
    fontSize: scaleSize(13),
    color: colors.primary,
    fontWeight: "700",
  },
  orderStatusModern: {
    fontSize: scaleSize(12),
    fontWeight: "700",
    textTransform: "capitalize",
  },
  orderItemsList: {
    marginBottom: scaleSize(8),
  },
  orderItemModern: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    backgroundColor: "#f8fafc",
    borderRadius: scaleSize(10),
    padding: scaleSize(8),
  },
  itemImageModern: {
    width: scaleSize(40),
    height: scaleSize(40),
    borderRadius: scaleSize(10),
    marginRight: scaleSize(10),
    backgroundColor: "#e5e7eb",
  },
  itemDetailsModern: {
    flex: 1,
  },
  itemNameModern: {
    fontWeight: "700",
    color: colors.primary,
    fontSize: scaleSize(13),
    marginBottom: 2,
  },
  itemInfoModern: {
    fontSize: scaleSize(11),
    color: colors.gray,
    marginBottom: 1,
  },
  addressTextModern: {
    fontSize: scaleSize(11),
    color: colors.gray,
    marginTop: 6,
    marginBottom: 2,
  },
  // Review button styles
  reviewButton: {
    backgroundColor: colors.primary,
    marginTop: scaleSize(10),
    marginBottom: scaleSize(6),
    borderRadius: scaleSize(8),
    padding: scaleSize(13),
    alignSelf: "stretch",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewButtonUpdated: {
    backgroundColor: "#fff3cd",
    borderWidth: 1,
    borderColor: "#f59e42",
  },
  reviewButtonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "700",
    fontSize: scaleSize(14),
    letterSpacing: 0.2,
  },
  reviewButtonTextUpdated: {
    color: "#f59e42",
  },
  downloadPdfButton: {
    backgroundColor: colors.primary,
    marginTop: 10,
    marginBottom: 6,
    borderRadius: 8,
    padding: 13,
    alignSelf: "stretch",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  downloadPdfButtonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 0.2,
  },
  cancelOrderButton: {
    marginTop: scaleSize(10),
    marginBottom: scaleSize(6),
    backgroundColor: "#fee2e2",
    padding: scaleSize(12),
    borderRadius: scaleSize(8),
    alignSelf: "stretch",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  cancelOrderButtonText: {
    color: "#dc2626",
    textAlign: "center",
    fontSize: scaleSize(12),
    fontWeight: "700",
  },
  buttonContentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateContainerModern: {
    alignItems: "center",
    marginTop: scaleSize(40),
    opacity: 0.7,
  },
  emptyTextModern: {
    color: colors.gray,
    fontSize: scaleSize(15),
    fontWeight: "600",
    marginTop: 2,
  },
  deleteReviewButton: {
    marginTop: scaleSize(6),
    marginBottom: scaleSize(6),
    backgroundColor: "#fee2e2",
    padding: scaleSize(12),
    borderRadius: scaleSize(8),
    alignSelf: "stretch",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  deleteReviewButtonText: {
    color: "#dc2626",
    textAlign: "center",
    fontSize: scaleSize(12),
    fontWeight: "700",
  },
  collectedBadgeContainer: {
    marginBottom: scaleSize(8),
    alignItems: "flex-start",
  },
  collectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10b981",
    paddingHorizontal: scaleSize(8),
    paddingVertical: scaleSize(4),
    borderRadius: scaleSize(12),
    gap: scaleSize(4),
  },
  collectedBadgeText: {
    color: "#fff",
    fontSize: scaleSize(11),
    fontWeight: "600",
  },
});
