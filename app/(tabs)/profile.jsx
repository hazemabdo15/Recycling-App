import * as ImagePicker from "expo-image-picker";
import * as Print from "expo-print";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Loader } from "../../components/common";
import RecyclingModal from "../../components/Modals/RecyclingModal";
import ProfileCard from "../../components/profile/ProfileCard";
import { useAuth } from "../../context/AuthContext";
import { useUserPoints } from "../../hooks/useUserPoints";
import apiService from "../../services/api/apiService";
import { orderService } from "../../services/api/orders";
import { generateOrderReportHTML } from "../../utils/orderReportPDF";
import { getLabel, isBuyer, isCustomer } from "../../utils/roleLabels";
import { scaleSize } from "../../utils/scale";

const tabs = ["incoming", "completed", "cancelled"];

export default function Profile() {
  return <ProfileContent />;
}

function ProfileContent() {
  const { user, logout, isLoggedIn } = useAuth();
  const router = useRouter();
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [avatarUri, setAvatarUri] = useState(null);
  const [avatarLoading, setAvatarLoading] = useState(false); // New state for avatar upload
  // Edit avatar with image picker and upload to backend
  const { setUser } = useAuth(); // Assumes setUser is available in context
  // Only update avatar locally and in user context, do not trigger global loading or re-fetch orders
  // Only update avatar fields in-place to avoid triggering useEffect on user object change
  const handleEditAvatar = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permission required",
          "Please allow access to your photos."
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        setAvatarLoading(true);
        try {
          const uri = result.assets[0].uri;
          const formData = new FormData();
          formData.append("image", {
            uri,
            name: "avatar.jpg",
            type: "image/jpeg",
          });
          const updatedUser = await apiService.put("/profile", formData, {
            headers: {},
          });
          // Only update avatar fields in user context, do not change object reference
          if (setUser) {
            setUser((prevUser) => {
              if (!prevUser) return prevUser;
              prevUser.imgUrl = updatedUser.imgUrl;
              prevUser.avatarUri = updatedUser.imgUrl;
              return prevUser;
            });
          }
          setAvatarUri(updatedUser.imgUrl); // Immediate UI update
        } catch (_) {
          Alert.alert("Error", "Could not change profile picture.");
        } finally {
          setAvatarLoading(false);
        }
      }
    } catch (_) {
      Alert.alert("Error", "Could not change profile picture.");
    }
  };
  const [activeTab, setActiveTab] = useState("incoming");
  const hasUserId = isLoggedIn && user && user._id;
  const { userPoints, getUserPoints } = useUserPoints(
    hasUserId
      ? {
          userId: user._id,
          name: user.name,
          email: user.email,
        }
      : { userId: null, name: null, email: null }
  );
  console.log('userPoints in ProfileContent:', userPoints);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const getTabDisplayName = (tab) => {
    switch (tab) {
      case "incoming":
        return getLabel("profileLabels.incomingTab", user?.role);
      case "completed":
        return getLabel("profileLabels.completedTab", user?.role);
      case "cancelled":
        return getLabel("profileLabels.cancelledTab", user?.role);
      default:
        return tab;
    }
  };

  useEffect(() => {
    console.log("AuthContext user:", user);
    console.log("AuthContext isLoggedIn:", isLoggedIn);
    console.log("User role:", user?.role);

    if (isLoggedIn && user?.email) {
      console.log(`[Profile] ${user?.role} role detected, fetching orders`);
      fetchOrders();
    } else {
      console.log("[Profile] User not logged in, clearing orders");
      setAllOrders([]);
      setLoading(false);
    }
  }, [user, isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn && user?._id) {
      console.log("[Profile] User is logged in, fetching points");
      getUserPoints();
    } else {
      console.log(
        "[Profile] User not logged in or no user ID, skipping points fetch"
      );
    }
  }, [isLoggedIn, user?._id, getUserPoints]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getOrders();
      console.log("[Profile] Orders API response:", response);
      setAllOrders(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Failed to fetch orders", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        setAllOrders([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const handleCancelOrder = (orderId) => {
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
            setActiveTab("cancelled");
          } catch {
            Alert.alert("Failed to cancel order");
          }
        },
      },
    ]);
  };

  const handleLogout = async () => {
    try {
      console.log("Logging out user...");
      router.replace("/login");
      await logout();
    } catch (error) {
      console.error("Logout failed", error);
      Alert.alert(
        "Logout Failed",
        "There was an error logging out. Please try again."
      );
    }
  };

  const confirmLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Yes", style: "destructive", onPress: handleLogout },
    ]);
  };

  const filteredOrders = allOrders.filter((order) => {
    if (activeTab === "incoming") {
      return ["pending", "accepted"].includes(order.status?.toLowerCase());
    } else if (activeTab === "completed") {
      return order.status === "completed";
    } else if (activeTab === "cancelled") {
      return order.status === "cancelled";
    }
    return true;
  });

  const stats = {
    totalRecycles: allOrders.filter((o) => o.status === "completed").length,
    points: userPoints?.totalPoints,
    tier: 50,
  };

  const isGuest = !isLoggedIn || !user?.email;

  if (isGuest) {
    return (
      <View style={styles.guestContainer}>
        <View style={styles.guestContent}>
          <View style={styles.guestIcon}>
            <Text style={styles.guestIconText}>👤</Text>
          </View>
          <Text style={styles.guestTitle}>Welcome, Guest!</Text>
          <Text style={styles.guestSubtitle}>
            You&apos;re browsing in guest mode
          </Text>
          <View style={styles.benefitsContainer}>
            <Text style={styles.benefitsTitle}>Join us to enjoy:</Text>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>♻️</Text>
              <Text style={styles.benefitText}>
                Track your recycling impact
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>🎯</Text>
              <Text style={styles.benefitText}>
                Earn points for every order
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>📱</Text>
              <Text style={styles.benefitText}>Manage orders easily</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>🏆</Text>
              <Text style={styles.benefitText}>Unlock membership tiers</Text>
            </View>
          </View>
          <View style={styles.guestActions}>
            <TouchableOpacity
              onPress={() => {
                router.push("/login");
              }}
              style={styles.loginButton}
            >
              <Text style={styles.loginButtonText}>Login to Your Account</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                router.push("/register");
              }}
              style={styles.signupButton}
            >
              <Text style={styles.signupButtonText}>Create New Account</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.guestBrowse}>
            <Text style={styles.guestBrowseText}>
              Or continue browsing as guest
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/home")}
              style={styles.browseButton}
            >
              <Text style={styles.browseButtonText}>Browse Services</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ListHeaderComponent for tabs only (profile card is fixed above)
  const renderListHeader = () => (
    <View style={styles.tabsContainer}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab}
          onPress={() => setActiveTab(tab)}
          style={activeTab === tab ? styles.activeTab : styles.tab}
        >
          <Text
            style={activeTab === tab ? styles.activeTabText : styles.tabText}
          >
            {getTabDisplayName(tab)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (loading) {
    return <Loader style={{ marginTop: 20 }} />;
  }

  // Determine avatar source: prefer user.imgUrl, then avatarUri, then fallback
  const avatarSource = user?.imgUrl || avatarUri || undefined;

  if (filteredOrders.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: "#f0fdf4" }}>
        <ProfileCard
          user={{
            ...user,
            totalRecycles: stats.totalRecycles,
            avatarUri: avatarSource,
          }}
          points={userPoints ?? 100}
          tier={stats.tier}
          onLogout={confirmLogout}
          onRedeem={() => setModalVisible(true)}
          showRedeem={isCustomer(user)}
          onEditAvatar={handleEditAvatar}
          avatarLoading={avatarLoading}
        />
        <RecyclingModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          totalPoints={userPoints}
          onPointsUpdated={getUserPoints}
        />
        {renderListHeader()}
        <View style={{ flex: 1 }}>
          {loading ? (
            <View style={{ padding: 32 }}>
              <Loader />
            </View>
          ) : user?.role === "buyer" ? (
            <View style={styles.buyerMessageContainer}>
              <Text style={styles.buyerMessageTitle}>
                {getLabel("profileLabels.noOrdersMessage", user?.role)}
              </Text>
              <Text style={styles.buyerMessageSubtitle}>
                Your purchase history will appear here once you start shopping
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/explore")}
                style={styles.startShoppingButton}
              >
                <Text style={styles.startShoppingButtonText}>
                  Start Shopping
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyText}>
                {getLabel("profileLabels.noOrdersMessage", user?.role)}
              </Text>
              <Text style={styles.emptySubtext}>
                {getLabel("profileLabels.startOrderingMessage", user?.role)}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f0fdf4" }}>
      <ProfileCard
        user={{
          ...user,
          totalRecycles: stats.totalRecycles,
          avatarUri: avatarSource,
        }}
        points={userPoints ?? 0}
        tier={stats.tier}
        onLogout={confirmLogout}
        onRedeem={() => setModalVisible(true)}
        showRedeem={isCustomer(user)}
        onEditAvatar={handleEditAvatar}
        avatarLoading={avatarLoading}
      />
      <RecyclingModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        totalPoints={userPoints}
        onPointsUpdated={getUserPoints}
      />
      {renderListHeader()}
      <FlatList
        data={filteredOrders}
        keyExtractor={(order) => order._id}
        renderItem={({ item: order }) => (
          <View style={styles.orderCard}>
            <Text style={styles.orderText}>
              Date: {new Date(order.createdAt).toLocaleDateString()}
            </Text>
            <Text style={styles.orderStatus}>Status: {order.status}</Text>
            {order.items.map((item, i) => (
              <View key={item._id || i} style={styles.orderItem}>
                <Image source={{ uri: item.image }} style={styles.itemImage} />
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName}>{item.itemName}</Text>
                  <Text style={styles.itemInfo}>
                    Quantity: {item.quantity}{" "}
                    {item.measurement_unit === 1 ? "kg" : "pcs"}
                  </Text>
                  {!isBuyer(user) && (
                    <Text style={styles.itemInfo}>Points: {item.points}</Text>
                  )}
                  <Text style={styles.itemInfo}>Price: {item.price} EGP</Text>
                </View>
              </View>
            ))}
            <Text style={styles.addressText}>
              {order.address.street}, Bldg {order.address.building}, Floor{" "}
              {order.address.floor}, {order.address.area}, {order.address.city}
            </Text>
            {/* Download PDF button for pending orders - for both customers and buyers */}
            {activeTab === "incoming" &&
              order.status?.toLowerCase() === "pending" &&
              isLoggedIn && (
                <TouchableOpacity
                  style={{
                    backgroundColor: "#222",
                    marginTop: 10,
                    marginBottom: 6,
                    borderRadius: 6,
                    padding: 12,
                    alignSelf: "stretch",
                  }}
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
                              if (!html) {
                                Alert.alert("Error", "Could not generate PDF.");
                                return;
                              }
                              await Print.printAsync({ html });
                            } catch (_err) {
                              Alert.alert("Error", "Failed to generate PDF.");
                            }
                          },
                        },
                      ]
                    );
                  }}
                  accessibilityLabel="Download PDF"
                >
                  <Text
                    style={{
                      color: "white",
                      textAlign: "center",
                      fontWeight: "bold",
                      fontSize: 14,
                    }}
                  >
                    Download PDF
                  </Text>
                </TouchableOpacity>
              )}
            {/* Cancel Order button only for customers and only for pending orders */}
            {activeTab === "incoming" &&
              order.status?.toLowerCase() === "pending" &&
              isCustomer(user) && (
                <TouchableOpacity
                  onPress={() => handleCancelOrder(order._id)}
                  style={styles.cancelButton}
                >
                  <Text style={styles.cancelButtonText}>Cancel Order</Text>
                </TouchableOpacity>
              )}
          </View>
        )}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: scaleSize(120),
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          loading ? (
            <View style={{ padding: 32 }}>
              <Loader />
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: scaleSize(35),
    backgroundColor: "#f8fafc", // very light neutral background
    paddingBottom: scaleSize(40),
    flexGrow: 1,
  },
  centered: { justifyContent: "center", alignItems: "center" },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scaleSize(16),
    gap: scaleSize(12),
  },
  userName: { fontSize: scaleSize(20), fontWeight: "600", color: "#1e293b" },
  userInfo: { fontSize: scaleSize(14), color: "#64748b" },
  userInfoSmall: { fontSize: scaleSize(12), color: "#a7f3d0" },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: scaleSize(16),
  },
  statBox: {
    backgroundColor: "#f1f5f9", // very light gray
    padding: scaleSize(12),
    borderRadius: scaleSize(12),
    alignItems: "center",
    flex: 1,
    marginHorizontal: scaleSize(4),
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  statValue: { fontSize: scaleSize(20), fontWeight: "700", color: "#059669" },
  statLabel: { fontSize: scaleSize(12), color: "#64748b" },
  tabsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: "#bbf7d0",
    marginBottom: scaleSize(16),
    backgroundColor: "#f0fdf4",
    borderRadius: scaleSize(12),
    marginHorizontal: scaleSize(4),
    paddingHorizontal: scaleSize(4),
  },
  tab: {
    flex: 1,
    paddingVertical: scaleSize(10),
    alignItems: "center",
    justifyContent: "center",
    borderRadius: scaleSize(8),
    marginHorizontal: scaleSize(2),
    backgroundColor: "transparent",
    minWidth: 0,
  },
  activeTab: {
    flex: 1,
    paddingVertical: scaleSize(10),
    borderBottomWidth: 3,
    borderColor: "#059669",
    backgroundColor: "#bbf7d0",
    borderRadius: scaleSize(8),
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: scaleSize(2),
    minWidth: 0,
  },
  tabText: {
    color: "#059669",
    fontWeight: "500",
    fontSize: scaleSize(15),
    textAlign: "center",
    width: "100%",
    minWidth: scaleSize(90),
    maxWidth: scaleSize(120),
    lineHeight: scaleSize(18),
    flexWrap: "wrap",
  },
  activeTabText: {
    color: "#065f46",
    fontWeight: "700",
    fontSize: scaleSize(15),
    textAlign: "center",
    width: "100%",
    minWidth: scaleSize(90),
    maxWidth: scaleSize(120),
    lineHeight: scaleSize(18),
    flexWrap: "wrap",
  },
  emptyText: {
    textAlign: "center",
    color: "#64748b",
    marginTop: scaleSize(20),
    fontWeight: "600",
  },
  emptyStateContainer: { alignItems: "center", marginTop: scaleSize(20) },
  emptySubtext: {
    textAlign: "center",
    color: "#94a3b8",
    marginTop: scaleSize(8),
    fontSize: scaleSize(14),
  },
  buyerMessageContainer: {
    alignItems: "center",
    marginTop: scaleSize(30),
    paddingHorizontal: scaleSize(20),
    backgroundColor: "#f1f5f9",
    borderRadius: scaleSize(12),
    padding: scaleSize(20),
    marginBottom: scaleSize(20),
    borderWidth: 1,
    borderColor: "#e0e7ef",
  },
  buyerMessageTitle: {
    textAlign: "center",
    color: "#334155",
    fontSize: scaleSize(16),
    fontWeight: "600",
    marginBottom: scaleSize(8),
  },
  buyerMessageSubtitle: {
    textAlign: "center",
    color: "#64748b",
    fontSize: scaleSize(14),
    marginBottom: scaleSize(16),
  },
  startShoppingButton: {
    backgroundColor: "#a7f3d0",
    paddingHorizontal: scaleSize(20),
    paddingVertical: scaleSize(10),
    borderRadius: scaleSize(8),
    marginTop: scaleSize(8),
  },
  startShoppingButtonText: {
    color: "#059669",
    fontSize: scaleSize(14),
    fontWeight: "600",
  },
  orderCard: {
    backgroundColor: "#fff",
    padding: scaleSize(12),
    borderRadius: scaleSize(12),
    marginBottom: scaleSize(12),
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  orderText: { fontSize: scaleSize(12), color: "#64748b" },
  orderStatus: { fontSize: scaleSize(14), fontWeight: "600", color: "#059669" },
  orderItem: {
    flexDirection: "row",
    gap: scaleSize(10),
    backgroundColor: "#f8fafc",
    padding: scaleSize(8),
    borderRadius: scaleSize(8),
    marginVertical: scaleSize(4),
  },
  itemImage: {
    width: scaleSize(64),
    height: scaleSize(64),
    borderRadius: scaleSize(6),
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  itemDetails: { flex: 1 },
  itemName: { fontWeight: "600", color: "#334155" },
  itemInfo: { fontSize: scaleSize(12), color: "#64748b" },
  addressText: {
    fontSize: scaleSize(12),
    color: "#64748b",
    marginTop: scaleSize(6),
  },
  cancelButton: {
    marginTop: scaleSize(12),
    marginBottom: scaleSize(8),
    backgroundColor: "#fee2e2",
    padding: scaleSize(12),
    borderRadius: scaleSize(6),
    alignSelf: "stretch",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  cancelButtonText: {
    color: "#dc2626",
    textAlign: "center",
    fontSize: scaleSize(12),
    fontWeight: "700",
  },
  guestContainer: {
    backgroundColor: "#f8fafc", // match main container
    paddingHorizontal: scaleSize(24),
    paddingVertical: scaleSize(10),
    paddingBottom: scaleSize(40),
    flexGrow: 1,
  },
  guestContent: {
    alignItems: "center",
    maxWidth: scaleSize(400),
    alignSelf: "stretch",
  },
  guestIcon: {
    width: scaleSize(80),
    height: scaleSize(80),
    borderRadius: scaleSize(40),
    backgroundColor: "#e0f2fe",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: scaleSize(24),
    borderWidth: 2,
    borderColor: "#bae6fd",
  },
  guestIconText: {
    fontSize: scaleSize(40),
  },
  guestTitle: {
    fontSize: scaleSize(28),
    fontWeight: "700",
    color: "#334155",
    marginBottom: scaleSize(8),
    textAlign: "center",
  },
  guestSubtitle: {
    fontSize: scaleSize(16),
    color: "#64748b",
    marginBottom: scaleSize(32),
    textAlign: "center",
  },
  benefitsContainer: {
    width: "100%",
    backgroundColor: "#f1f5f9",
    borderRadius: scaleSize(16),
    padding: scaleSize(24),
    marginBottom: scaleSize(32),
    elevation: 2,
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: scaleSize(2) },
    shadowOpacity: 0.06,
    shadowRadius: scaleSize(4),
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  benefitsTitle: {
    fontSize: scaleSize(18),
    fontWeight: "600",
    color: "#334155",
    marginBottom: scaleSize(16),
    textAlign: "center",
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scaleSize(12),
    paddingHorizontal: scaleSize(8),
  },
  benefitIcon: {
    fontSize: scaleSize(20),
    marginRight: scaleSize(12),
    width: scaleSize(24),
  },
  benefitText: {
    fontSize: scaleSize(15),
    color: "#64748b",
    flex: 1,
  },
  guestActions: {
    width: "100%",
    gap: scaleSize(12),
    marginBottom: scaleSize(24),
  },
  loginButton: {
    backgroundColor: "#34d399",
    paddingVertical: scaleSize(16),
    paddingHorizontal: scaleSize(32),
    borderRadius: scaleSize(12),
    elevation: 2,
    shadowColor: "#a7f3d0",
    shadowOffset: { width: 0, height: scaleSize(2) },
    shadowOpacity: 0.08,
    shadowRadius: scaleSize(4),
  },
  loginButtonText: {
    color: "#065f46",
    fontSize: scaleSize(16),
    fontWeight: "600",
    textAlign: "center",
  },
  signupButton: {
    backgroundColor: "#e0f2fe",
    paddingVertical: scaleSize(16),
    paddingHorizontal: scaleSize(32),
    borderRadius: scaleSize(12),
    borderWidth: 2,
    borderColor: "#bae6fd",
  },
  signupButtonText: {
    color: "#0284c7",
    fontSize: scaleSize(16),
    fontWeight: "600",
    textAlign: "center",
  },
  guestBrowse: {
    alignItems: "center",
    paddingTop: scaleSize(16),
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    width: "100%",
  },
  guestBrowseText: {
    fontSize: scaleSize(14),
    color: "#64748b",
    marginBottom: scaleSize(12),
    textAlign: "center",
  },
  browseButton: {
    paddingVertical: scaleSize(8),
    paddingHorizontal: scaleSize(16),
  },
  browseButtonText: {
    color: "#059669",
    fontSize: scaleSize(14),
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  menuButton: {
    padding: scaleSize(8),
    position: "relative",
  },
  menuIcon: {
    fontSize: scaleSize(20),
    color: "#64748b",
  },
  menuDropdown: {
    position: "absolute",
    top: scaleSize(35),
    right: 0,
    backgroundColor: "#fff",
    borderRadius: scaleSize(6),
    elevation: 4,
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: scaleSize(2) },
    shadowOpacity: 0.08,
    shadowRadius: scaleSize(4),
    paddingVertical: scaleSize(4),
    paddingHorizontal: scaleSize(12),
    zIndex: 1000,
    minWidth: scaleSize(80),
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  menuItemButton: {
    paddingVertical: scaleSize(8),
  },
  menuItem: {
    fontSize: scaleSize(14),
    color: "#dc2626",
    fontWeight: "700",
  },
  redeemButton: {
    backgroundColor: "#a7f3d0",
    padding: scaleSize(16),
    borderRadius: scaleSize(12),
    marginVertical: scaleSize(16),
    alignItems: "center",
    elevation: 2,
    shadowColor: "#a7f3d0",
    shadowOffset: { width: 0, height: scaleSize(2) },
    shadowOpacity: 0.08,
    shadowRadius: scaleSize(4),
  },
  redeemButtonText: {
    color: "#059669",
    fontSize: scaleSize(16),
    fontWeight: "700",
  },
});
