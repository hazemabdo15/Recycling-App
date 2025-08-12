import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Loader } from "../components/common";
import { useAuth } from "../context/AuthContext";
import { orderService } from "../services/api/orders";
import { colors } from "../styles";
import { getLabel, isBuyer } from "../utils/roleLabels";
import { scaleSize } from "../utils/scale";

const tabs = ["incoming", "completed", "cancelled"];

export default function RecyclingHistory() {
  const { user, isLoggedIn } = useAuth();
  const router = useRouter();
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("incoming");
  const [refreshing, setRefreshing] = useState(false);

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
    } catch (error) {
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
        return getLabel("profileLabels.incomingTab", user?.role);
      case "completed":
        return getLabel("profileLabels.completedTab", user?.role);
      case "cancelled":
        return getLabel("profileLabels.cancelledTab", user?.role);
      default:
        return tab;
    }
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

  return (
    <View style={{ flex: 1, backgroundColor: "#f0fdf4" }}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>{"<"}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recycling History</Text>
      </View>
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={activeTab === tab ? styles.activeTab : styles.tab}
          >
            <Text style={activeTab === tab ? styles.activeTabText : styles.tabText}>
              {getTabDisplayName(tab)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={loading ? [] : filteredOrders}
        keyExtractor={(order) => order._id}
        renderItem={loading ? undefined : ({ item: order }) => (
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
                    Quantity: {item.quantity} {item.measurement_unit === 1 ? "kg" : "pcs"}
                  </Text>
                  {!isBuyer(user) && (
                    <Text style={styles.itemInfo}>Points: {item.points}</Text>
                  )}
                  <Text style={styles.itemInfo}>Price: {item.price} EGP</Text>
                </View>
              </View>
            ))}
            <Text style={styles.addressText}>
              {order.address.street}, Bldg {order.address.building}, Floor {order.address.floor}, {order.address.area}, {order.address.city}
            </Text>
          </View>
        )}
        contentContainerStyle={{
          paddingHorizontal: 16,
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
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyText}>No orders found.</Text>
            </View>
          )
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: scaleSize(24),
    paddingBottom: scaleSize(8),
    paddingHorizontal: scaleSize(12),
    backgroundColor: "#f0fdf4",
  },
  backButton: {
    marginRight: scaleSize(8),
    padding: scaleSize(6),
  },
  backButtonText: {
    fontSize: scaleSize(20),
    color: colors.primary,
    fontWeight: "bold",
  },
  headerTitle: {
    fontSize: scaleSize(18),
    fontWeight: "700",
    color: colors.primary,
  },
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
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: "bold",
  },
  tabText: {
    color: colors.gray,
  },
  orderCard: {
    backgroundColor: colors.white,
    borderRadius: scaleSize(12),
    padding: scaleSize(12),
    marginBottom: scaleSize(12),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  orderText: {
    fontSize: scaleSize(13),
    color: colors.primary,
    fontWeight: "600",
    marginBottom: 2,
  },
  orderStatus: {
    fontSize: scaleSize(12),
    color: colors.gray,
    marginBottom: 6,
  },
  orderItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  itemImage: {
    width: scaleSize(36),
    height: scaleSize(36),
    borderRadius: scaleSize(8),
    marginRight: scaleSize(8),
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontWeight: "600",
    color: colors.primary,
  },
  itemInfo: {
    fontSize: scaleSize(11),
    color: colors.gray,
  },
  addressText: {
    fontSize: scaleSize(11),
    color: colors.gray,
    marginTop: 4,
  },
  emptyStateContainer: {
    alignItems: "center",
    marginTop: scaleSize(40),
  },
  emptyText: {
    color: colors.gray,
    fontSize: scaleSize(14),
    fontWeight: "600",
  },
});
