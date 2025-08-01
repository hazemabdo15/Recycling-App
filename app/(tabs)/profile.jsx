﻿import { useRouter } from "expo-router";
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
import { Loader } from '../../components/common';
import RecyclingModal from "../../components/Modals/RecyclingModal";
import { useAuth } from "../../context/AuthContext";
import { useUserPoints } from "../../hooks/useUserPoints";
import { orderService } from "../../services/api/orders";
import { getLabel, isBuyer, isCustomer } from '../../utils/roleLabels';
import { scaleSize } from '../../utils/scale';


const tabs = ["incoming", "completed", "cancelled"];

export default function Profile() {
  return <ProfileContent />;
}

function ProfileContent() {
  const { user, loading: authLoading, logout, isLoggedIn } = useAuth();
  const router = useRouter();
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("incoming");
  const [menuVisible, setMenuVisible] = useState(false);
  const { userPoints, getUserPoints } = useUserPoints({
    userId: isLoggedIn && user?._id ? user._id : null,
    name: isLoggedIn && user?.name ? user.name : null,
    email: isLoggedIn && user?.email ? user.email : null,
  });
  const [modalVisible, setModalVisible] = useState(false);

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
      console.log('[Profile] Orders API response:', response);

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
      setMenuVisible(false);
      await logout();
      router.replace("/login");
    } catch (error) {
      console.error("Logout failed", error);
      Alert.alert(
        "Logout Failed",
        "There was an error logging out. Please try again."
      );
    }
  };

  if (authLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Loader />
      </View>
    );
  }

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

  return (
    <ScrollView
      contentContainerStyle={isGuest ? styles.guestContainer : styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.profileHeader}>
        {!isGuest && (
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{user?.name || "Guest"}</Text>
            <Text style={styles.userInfo}>
              {user?.email || "No email available"}
            </Text>
            <Text style={styles.userInfo}>
              {user?.phoneNumber?.padStart(11, "0") || "No phone number"}
            </Text>
            <Text style={styles.userInfoSmall}>Cairo, July 2025</Text>
          </View>
        )}
        {!isGuest && (
          <TouchableOpacity
            onPress={() => setMenuVisible(!menuVisible)}
            style={styles.menuButton}
          >
            <Text style={styles.menuIcon}>☰</Text>
            {menuVisible && (
              <View style={styles.menuDropdown}>
                <TouchableOpacity
                  onPress={handleLogout}
                  style={styles.menuItemButton}
                >
                  <Text style={styles.menuItem}>Logout</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>

      {isGuest ? (
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
                  console.log("Login button pressed");
                  router.push("/login");
                }}
                style={styles.loginButton}
              >
                <Text style={styles.loginButtonText}>
                  Login to Your Account
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  console.log("Sign up button pressed");
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
      ) : (
        <>
          <View style={styles.statsContainer}>
            <StatBox label="Total Recycles" value={stats.totalRecycles} />
            {!isBuyer(user) && (
              <StatBox
                label="Points Collected"
                value={userPoints ? userPoints : 0}
              />
            )}
            <StatBox label="Membership Tier" value={stats.tier} />
          </View>


          {isCustomer(user) && (
            <>
              <TouchableOpacity
                style={styles.redeemButton}
                onPress={() => setModalVisible(true)}
              >
                <Text style={styles.redeemButtonText}>Redeem and Return</Text>
              </TouchableOpacity>
              
              <RecyclingModal 
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                totalPoints={userPoints}
                onPointsUpdated={getUserPoints}
              />
             
            </>
          )}

          <View style={styles.tabsContainer}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={activeTab === tab ? styles.activeTab : styles.tab}
              >
                <Text
                  style={
                    activeTab === tab ? styles.activeTabText : styles.tabText
                  }
                >
                  {getTabDisplayName(tab)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {loading ? (
            <Loader style={{ marginTop: 20 }} />
          ) : filteredOrders.length === 0 ? (
            user?.role === "buyer" ? (
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
            )
          ) : (
            filteredOrders.map((order) => (
              <View key={order._id} style={styles.orderCard}>
                <Text style={styles.orderText}>
                  Date: {new Date(order.createdAt).toLocaleDateString()}
                </Text>
                <Text style={styles.orderStatus}>Status: {order.status}</Text>
                {order.items.map((item, i) => (
                  <View key={item._id || i} style={styles.orderItem}>
                    <Image
                      source={{ uri: item.image }}
                      style={styles.itemImage}
                    />
                    <View style={styles.itemDetails}>
                      <Text style={styles.itemName}>{item.itemName}</Text>
                      <Text style={styles.itemInfo}>
                        Quantity: {item.quantity}{" "}
                        {item.measurement_unit === 1 ? "kg" : "pcs"}
                      </Text>
                      {!isBuyer(user) && (
                        <Text style={styles.itemInfo}>Points: {item.points}</Text>
                      )}
                      <Text style={styles.itemInfo}>
                        Price: {item.price} EGP
                      </Text>
                    </View>
                  </View>
                ))}
                <Text style={styles.addressText}>
                  {order.address.street}, Bldg {order.address.building}, Floor{" "}
                  {order.address.floor}, {order.address.area},{" "}
                  {order.address.city}
                </Text>
                {activeTab === "incoming" &&
                  order.status?.toLowerCase() !== "accepted" && (
                    <TouchableOpacity
                      onPress={() => handleCancelOrder(order._id)}
                      style={styles.cancelButton}
                    >
                      <Text style={styles.cancelButtonText}>Cancel Order</Text>
                    </TouchableOpacity>
                  )}
              </View>
            ))
          )}
        </>
      )}
    </ScrollView>
  );
}

function StatBox({ label, value }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: scaleSize(35), backgroundColor: "#f0fdf4", paddingBottom: scaleSize(100) },
  centered: { justifyContent: "center", alignItems: "center" },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scaleSize(16),
    gap: scaleSize(12),
  },
  userName: { fontSize: scaleSize(20), fontWeight: "600", color: "#065f46" },
  userInfo: { fontSize: scaleSize(14), color: "#6b7280" },
  userInfoSmall: { fontSize: scaleSize(12), color: "#9ca3af" },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: scaleSize(16),
  },
  statBox: {
    backgroundColor: "#dcfce7",
    padding: scaleSize(12),
    borderRadius: scaleSize(12),
    alignItems: "center",
    flex: 1,
    marginHorizontal: scaleSize(4),
  },
  statValue: { fontSize: scaleSize(20), fontWeight: "700", color: "#065f46" },
  statLabel: { fontSize: scaleSize(12), color: "#065f46" },
  tabsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderBottomWidth: 1,
    borderColor: "#d1d5db",
    marginBottom: scaleSize(16),
  },
  tab: { 
    paddingVertical: scaleSize(8),
    paddingHorizontal: scaleSize(4),
    minWidth: scaleSize(100),
    maxWidth: scaleSize(120),
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    paddingVertical: scaleSize(8),
    borderBottomWidth: 2,
    paddingHorizontal: scaleSize(4),
    minWidth: scaleSize(100),
    maxWidth: scaleSize(120),
    borderColor: "#059669",
  },
  tabText: { color: "#6b7280", fontWeight: "500", },
  activeTabText: { color: "#065f46", fontWeight: "600" },
  emptyText: { textAlign: "center", color: "#9ca3af", marginTop: scaleSize(20) },
  emptyStateContainer: { alignItems: "center", marginTop: scaleSize(20) },
  emptySubtext: {
    textAlign: "center",
    color: "#6b7280",
    marginTop: scaleSize(8),
    fontSize: scaleSize(14),
  },
  buyerMessageContainer: {
    alignItems: "center",
    marginTop: scaleSize(30),
    paddingHorizontal: scaleSize(20),
    backgroundColor: "#f0f9ff",
    borderRadius: scaleSize(12),
    padding: scaleSize(20),
    marginBottom: scaleSize(20),
  },
  buyerMessageTitle: {
    textAlign: "center",
    color: "#0369a1",
    fontSize: scaleSize(16),
    fontWeight: "600",
    marginBottom: scaleSize(8),
  },
  buyerMessageSubtitle: {
    textAlign: "center",
    color: "#075985",
    fontSize: scaleSize(14),
    marginBottom: scaleSize(16),
  },
  startShoppingButton: {
    backgroundColor: "#0ea5e9",
    paddingHorizontal: scaleSize(20),
    paddingVertical: scaleSize(10),
    borderRadius: scaleSize(8),
    marginTop: scaleSize(8),
  },
  startShoppingButtonText: {
    color: "white",
    fontSize: scaleSize(14),
    fontWeight: "600",
  },
  orderCard: {
    backgroundColor: "#e6f4ea",
    padding: scaleSize(12),
    borderRadius: scaleSize(12),
    marginBottom: scaleSize(12),
  },
  orderText: { fontSize: scaleSize(12), color: "#6b7280" },
  orderStatus: { fontSize: scaleSize(14), fontWeight: "600", color: "#047857" },
  orderItem: {
    flexDirection: "row",
    gap: scaleSize(10),
    backgroundColor: "white",
    padding: scaleSize(8),
    borderRadius: scaleSize(8),
    marginVertical: scaleSize(4),
  },
  itemImage: { width: scaleSize(64), height: scaleSize(64), borderRadius: scaleSize(6) },
  itemDetails: { flex: 1 },
  itemName: { fontWeight: "600", color: "#065f46" },
  itemInfo: { fontSize: scaleSize(12), color: "#4b5563" },
  addressText: { fontSize: scaleSize(12), color: "#6b7280", marginTop: scaleSize(6) },
  cancelButton: {
    marginTop: scaleSize(12),
    marginBottom: scaleSize(8),
    backgroundColor: "#dc2626",
    padding: scaleSize(12),
    borderRadius: scaleSize(6),
    alignSelf: "stretch",
  },
  cancelButtonText: { color: "white", textAlign: "center", fontSize: scaleSize(12) },
  guestContainer: {
    backgroundColor: "#f0fdf4",
    paddingHorizontal: scaleSize(24),
    paddingVertical: scaleSize(10),
    paddingBottom: scaleSize(75),
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
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: scaleSize(24),
    borderWidth: 2,
    borderColor: "#bbf7d0",
  },
  guestIconText: {
    fontSize: scaleSize(40),
  },
  guestTitle: {
    fontSize: scaleSize(28),
    fontWeight: "700",
    color: "#065f46",
    marginBottom: scaleSize(8),
    textAlign: "center",
  },
  guestSubtitle: {
    fontSize: scaleSize(16),
    color: "#6b7280",
    marginBottom: scaleSize(32),
    textAlign: "center",
  },
  benefitsContainer: {
    width: "100%",
    backgroundColor: "white",
    borderRadius: scaleSize(16),
    padding: scaleSize(24),
    marginBottom: scaleSize(32),
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: scaleSize(2) },
    shadowOpacity: 0.1,
    shadowRadius: scaleSize(4),
  },
  benefitsTitle: {
    fontSize: scaleSize(18),
    fontWeight: "600",
    color: "#065f46",
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
    color: "#374151",
    flex: 1,
  },
  guestActions: {
    width: "100%",
    gap: scaleSize(12),
    marginBottom: scaleSize(24),
  },
  loginButton: {
    backgroundColor: "#059669",
    paddingVertical: scaleSize(16),
    paddingHorizontal: scaleSize(32),
    borderRadius: scaleSize(12),
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: scaleSize(2) },
    shadowOpacity: 0.1,
    shadowRadius: scaleSize(4),
  },
  loginButtonText: {
    color: "white",
    fontSize: scaleSize(16),
    fontWeight: "600",
    textAlign: "center",
  },
  signupButton: {
    backgroundColor: "white",
    paddingVertical: scaleSize(16),
    paddingHorizontal: scaleSize(32),
    borderRadius: scaleSize(12),
    borderWidth: 2,
    borderColor: "#059669",
  },
  signupButtonText: {
    color: "#059669",
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
    color: "#9ca3af",
    marginBottom: scaleSize(12),
    textAlign: "center",
  },
  browseButton: {
    paddingVertical: scaleSize(8),
    paddingHorizontal: scaleSize(16),
  },
  browseButtonText: {
    color: "#6b7280",
    fontSize: scaleSize(14),
    fontWeight: "500",
    textDecorationLine: "underline",
  },
  menuButton: {
    padding: scaleSize(8),
    position: "relative",
  },
  menuIcon: {
    fontSize: scaleSize(20),
    color: "#065f46",
  },
  menuDropdown: {
    position: "absolute",
    top: scaleSize(35),
    right: 0,
    backgroundColor: "white",
    borderRadius: scaleSize(6),
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: scaleSize(2) },
    shadowOpacity: 0.25,
    shadowRadius: scaleSize(4),
    paddingVertical: scaleSize(4),
    paddingHorizontal: scaleSize(12),
    zIndex: 1000,
    minWidth: scaleSize(80),
  },
  menuItemButton: {
    paddingVertical: scaleSize(8),
  },
  menuItem: {
    fontSize: scaleSize(14),
    color: "#dc2626",
  },
  redeemButton: {
    backgroundColor: "#059669",
    padding: scaleSize(16),
    borderRadius: scaleSize(12),
    marginVertical: scaleSize(16),
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: scaleSize(2) },
    shadowOpacity: 0.25,
    shadowRadius: scaleSize(4),
  },
  redeemButtonText: {
    color: "white",
    fontSize: scaleSize(16),
    fontWeight: "600",
  },
});
