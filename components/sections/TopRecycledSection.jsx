import { MaterialCommunityIcons } from "@expo/vector-icons";
import { memo, useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { orderService } from "../../services/api/orders";
const colors = {
  primary: "#0E9F6E",
  secondary: "#8BC34A",
  accent: "#FFC107",
  neutral: "#607D8B",
  base100: "#F8F9FA",
  base300: "#E0E0E0",
  white: "#ffffff",
  black: "#171717",
};
const borderRadius = {
  xs: 6,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 32,
};

const ICON_MAP = {
  Plastic: { name: "bottle-soda", color: "#FF69B4" },
  "Aluminum": { name: "cup", color: "#9E9E9E" },
  "Cardboard": { name: "package-variant", color: "#8BC34A" },
  "Glass": { name: "glass-fragile", color: "#4FC3F7" },
  "Paper": { name: "file-document", color: "#FF9800" },
  // Add more mappings as needed
};

const TopRecycledSection = memo(() => {
  const [topItems, setTopItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    orderService.getTopMaterials()
      .then((res) => {
        if (mounted && res?.success) {
          setTopItems(res.data || []);
        } else if (mounted) {
          setError("Failed to load data");
        }
      })
      .catch((err) => {
        setError("Failed to load data");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  const handleItemPress = (item) => {
    // You can add navigation or modal here
    console.log(`${item._id?.itemName || item.itemName} pressed`);
  };

  return (
    <View style={styles.section}>
      <View style={styles.headerContainer}></View>
      {loading ? (
        <Text style={{ textAlign: "center", color: colors.neutral, marginVertical: 16 }}>Loading...</Text>
      ) : error ? (
        <Text style={{ textAlign: "center", color: "#dc2626", marginVertical: 16 }}>{error}</Text>
      ) : topItems.length === 0 ? (
        <Text style={{ textAlign: "center", color: colors.neutral, marginVertical: 16 }}>No data available.</Text>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          {topItems.map((item, index) => {
            const iconInfo = ICON_MAP[item.categoryName] || { name: "recycle", color: colors.primary };
            return (
              <View
                key={item._id?.itemName || item._id || index}
                style={[
                  styles.itemCard,
                  index === topItems.length - 1 && { marginRight: 0 },
                ]}
                onPress={() => handleItemPress(item)}
                activeOpacity={0.8}
              >
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>#{index + 1}</Text>
                </View>
                {item.image ? (
                  <Image
                    source={{ uri: item.image }}
                    style={styles.itemImage}
                    resizeMode="cover"
                  />
                ) : null}
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons
                    name={iconInfo.name}
                    size={28}
                    color={iconInfo.color}
                  />
                </View>
                <Text style={styles.itemName}>{item._id?.itemName || item.itemName}</Text>
                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <MaterialCommunityIcons
                      name="recycle"
                      size={14}
                      color={colors.primary}
                    />
                    <Text style={styles.recycleCount}>{item.totalQuantity}</Text>
                  </View>
                  {/* <View style={styles.pointsBadge}>
                    <Text style={styles.pointsText}>+{item.totalPoints} pts</Text>
                  </View> */}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
});

TopRecycledSection.displayName = "TopRecycledSection";
const styles = StyleSheet.create({
  section: {
    marginBottom: 15,
    paddingBottom: 8,
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: -0.3,
    lineHeight: 22,
    marginBottom: 0,
  },
  scrollContainer: {
    paddingLeft: 20,
    paddingRight: 20,
    paddingBottom: 10,
  },
  itemCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: borderRadius.lg,
    padding: 16,
    marginRight: 15,
    width: 150,
    minHeight: 160,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  rankBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  rankText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "bold",
  },
  itemImage: {
    width: 56,
    height: 56,
    borderRadius: 10,
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 4,
    backgroundColor: colors.base100,
  },
  iconContainer: {
    alignItems: "center",
    marginVertical: 6,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.black,
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 18,
  },
  statsContainer: {
    gap: 8,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  recycleCount: {
    fontSize: 12,
    color: colors.neutral,
    fontWeight: "500",
  },
  pointsBadge: {
    backgroundColor: colors.accent + "20",
    borderRadius: borderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: "center",
  },
  pointsText: {
    fontSize: 11,
    color: colors.accent,
    fontWeight: "bold",
  },
});
export default TopRecycledSection;
