import { format } from "date-fns";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useState } from "react";
import { Alert, FlatList, RefreshControl, Text, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import apiService from "../services/api/apiService";
import { colors } from "../styles";
import styles from "../styles/redeemHistory";

const filterRedeemHistory = (pointsHistory = []) => {
  return pointsHistory.filter(
    (entry) =>
      entry.type === "deducted" &&
      entry.reason &&
      (entry.reason.includes("Voucher redeemed") ||
        entry.reason.includes("Cashback") ||
        entry.reason.includes("Points deducted"))
  );
};

export default function RedeemHistoryScreen() {
  const { user, setUser } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Use local pointsHistory for immediate UI update after refresh
  const [localPointsHistory, setLocalPointsHistory] = useState(
    user?.pointsHistory || []
  );

  // Update localPointsHistory if user.pointsHistory changes (e.g., on login)
  useEffect(() => {
    setLocalPointsHistory(user?.pointsHistory || []);
  }, [user?.pointsHistory]);

  const redeemHistory = useMemo(() => {
    const filtered = filterRedeemHistory(localPointsHistory);
    // Sort by timestamp descending (newest first)
    return filtered.slice().sort((a, b) => {
      const dateA = new Date(a.timestamp?.$date || a.timestamp || a.date);
      const dateB = new Date(b.timestamp?.$date || b.timestamp || b.date);
      return dateB - dateA;
    });
  }, [localPointsHistory]);

  const handleRefresh = async () => {
    if (!user?._id) return;
    setIsRefreshing(true);
    try {
      const response = await apiService.get(`/users/${user._id}`);
      if (response && Array.isArray(response.pointsHistory)) {
        setLocalPointsHistory(response.pointsHistory);
        if (setUser)
          setUser((prev) => ({
            ...prev,
            pointsHistory: response.pointsHistory,
          }));
      } else {
        Alert.alert("Error", "Failed to fetch latest redeem history.");
      }
    } catch (_err) {
      Alert.alert("Error", "Failed to fetch latest redeem history.");
    }
    setIsRefreshing(false);
  };

  const renderItem = ({ item }) => {
    let dateStr = "Unknown date";
    // Support both MongoDB extended JSON and plain ISO string
    const rawDate = item.timestamp?.$date || item.timestamp || item.date;
    if (rawDate) {
      const parsedDate = new Date(rawDate);
      if (!isNaN(parsedDate.getTime())) {
        dateStr = format(parsedDate, "dd MMM yyyy, hh:mm a");
      }
    }
    return (
      <View style={styles.itemContainer}>
        <Text style={styles.reason}>{item.reason}</Text>
        <Text style={styles.points}>-{item.points}</Text>
        <Text style={styles.date}>{dateStr}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors?.primary || "#4CAF50", colors?.neutral || "#2196F3"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroSection}
      >
        <Text style={styles.heroTitle}>Redeem History</Text>
        <Text style={styles.heroSubtitle}>
          All your redeemed points in one place
        </Text>
      </LinearGradient>
      <FlatList
        data={redeemHistory}
        keyExtractor={(item, idx) => item.id?.toString() || idx.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No redeem history found.</Text>
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />
    </View>
  );
}
