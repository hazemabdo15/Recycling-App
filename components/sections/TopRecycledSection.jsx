import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { memo, useCallback, useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useLocalization } from "../../context/LocalizationContext";
import { orderService } from "../../services/api/orders";
import { scaleSize } from '../../utils/scale';
import { extractNameFromMultilingual, getTranslatedName } from "../../utils/translationHelpers";
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

};

const TopRecycledSection = memo(() => {
  const router = useRouter();
  const { t, currentLanguage } = useLocalization();
  const [topItems, setTopItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function to get translated item name
  const getTranslatedItemName = useCallback((item) => {
    if (!item || !t) return item?._id?.itemName || item?.itemName || "Unknown Item";
    
    const originalName = item._id?.itemName || item.itemName || "Unknown Item";
    // Try multiple possible category name fields and sources
    let categoryName = item.categoryName || item.category || item._id?.categoryName || null;
    
    // If categoryName is not found, try to extract from categoryNames array
    if (!categoryName && item.categoryNames && Array.isArray(item.categoryNames) && item.categoryNames.length > 0) {
      categoryName = item.categoryNames[0]; // Use the first category name
    }
    
    // Debug logging to understand the data structure
    console.log('TopRecycledSection - Item data:', {
      originalName,
      categoryName,
      fullItem: item
    });
    
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

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    orderService.getTopMaterials()
      .then((res) => {
        console.log('Top Recycled Items Response:', res);
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

  // Helper to select the best category route
  function getBestCategoryRoute(categoryNames) {
    if (!Array.isArray(categoryNames) || categoryNames.length === 0) return null;
    // Prefer kebab-case (contains '-')
    const kebab = categoryNames.find(name => name && name.includes('-'));
    if (kebab) return kebab;
    // Fallback: prefer lowercase
    const lower = categoryNames.find(name => name && name === name.toLowerCase());
    if (lower) return lower;
    // Fallback: use the first valid name
    const validName = categoryNames.find(name => name && typeof name === 'string');
    return validName || null;
  }

  const handleItemPress = (item) => {
    const categoryName = getBestCategoryRoute(item.categoryNames);
    if (categoryName) {
      router.push({
        pathname: '/category-details',
        params: { categoryName },
      });
    }
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
              <TouchableOpacity
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
                <Text style={styles.itemName}>{getTranslatedItemName(item)}</Text>
                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <MaterialCommunityIcons
                      name="recycle"
                      size={14}
                      color={colors.primary}
                    />
                    <Text style={styles.recycleCount}>{item.totalQuantity}</Text>
                  </View>
                </View>
              </TouchableOpacity>
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
    marginBottom: scaleSize(15),
    paddingBottom: scaleSize(8),
    marginHorizontal: scaleSize(-20),
    paddingHorizontal: scaleSize(20),
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginBottom: scaleSize(12),
    paddingHorizontal: 0,
  },
  sectionTitle: {
    fontSize: scaleSize(16),
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: -0.3,
    lineHeight: scaleSize(22),
    marginBottom: 0,
  },
  scrollContainer: {
    paddingLeft: scaleSize(20),
    paddingRight: scaleSize(20),
    paddingBottom: scaleSize(10),
  },
  itemCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: scaleSize(borderRadius.lg),
    padding: scaleSize(10),
    marginRight: scaleSize(12),
    width: scaleSize(120),
    minHeight: scaleSize(120),
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: scaleSize(2),
    },
    shadowOpacity: 0.08,
    shadowRadius: scaleSize(6),
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  rankBadge: {
    position: "absolute",
    top: scaleSize(8),
    right: scaleSize(8),
    backgroundColor: colors.primary,
    borderRadius: scaleSize(borderRadius.xs),
    paddingHorizontal: scaleSize(6),
    paddingVertical: scaleSize(2),
  },
  rankText: {
    color: colors.white,
    fontSize: scaleSize(10),
    fontWeight: "bold",
  },
  itemImage: {
    width: scaleSize(56),
    height: scaleSize(56),
    borderRadius: scaleSize(10),
    alignSelf: "center",
    marginTop: scaleSize(8),
    marginBottom: scaleSize(4),
    backgroundColor: colors.base100,
  },
  iconContainer: {
    alignItems: "center",
    marginVertical: scaleSize(6),
  },
  itemName: {
    fontSize: scaleSize(14),
    fontWeight: "600",
    color: colors.black,
    textAlign: "center",
    marginBottom: scaleSize(12),
    lineHeight: scaleSize(18),
  },
  statsContainer: {
    gap: scaleSize(8),
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scaleSize(4),
  },
  recycleCount: {
    fontSize: scaleSize(12),
    color: colors.neutral,
    fontWeight: "500",
  },
  pointsBadge: {
    backgroundColor: colors.accent + "20",
    borderRadius: scaleSize(borderRadius.sm),
    paddingHorizontal: scaleSize(8),
    paddingVertical: scaleSize(4),
    alignItems: "center",
  },
  pointsText: {
    fontSize: scaleSize(11),
    color: colors.accent,
    fontWeight: "bold",
  },
});
export default TopRecycledSection;
