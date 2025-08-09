import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { StatusBar, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CategoriesGrid } from "../../components/sections";
import { SearchBar } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { colors, spacing } from "../../styles/theme";
import { getLabel } from "../../utils/roleLabels";
import { scaleSize } from "../../utils/scale";

const Explore = () => {
  const [searchText, setSearchText] = useState("");
  const [filteredCount, setFilteredCount] = useState(0);
  const [showItemsMode, setShowItemsMode] = useState(false);
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  useFocusEffect(
    useCallback(() => {
      return () => {};
    }, [])
  );

  const handleSearch = (text) => {
    setSearchText(text);
  };
  const handleFilter = () => {
    setShowItemsMode((prev) => !prev);
  };
  const handleCategoryPress = (category) => {
    router.push({
      pathname: "/category-details",
      params: { categoryName: category.name },
    });
  };
  const handleFilteredCountChange = (count) => {
    setFilteredCount(count);
  };

  // Use a more accurate tab bar height for proper bottom padding
  const tabBarHeight = 80 + insets.bottom;

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <View
        style={[
          styles.heroSection,
          { paddingTop: insets.top + 20, paddingBottom: spacing.lg },
        ]}
      >
        <LinearGradient
          colors={[colors.primary, colors.neutral]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, styles.heroSectionBg]}
        />
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>
            {getLabel("exploreTitle", user?.role)}
          </Text>
          <Text style={styles.heroSubtitle}>
            {searchText
              ? `${filteredCount} ${
                  showItemsMode ? "items" : "categories"
                } found`
              : getLabel("exploreSubtitle", user?.role)}
          </Text>
        </View>
        <View style={styles.searchBarWrapper}>
          <SearchBar
            placeholder={getLabel("searchPlaceholder", user?.role)}
            onSearch={handleSearch}
            onFilter={handleFilter}
          />
        </View>
      </View>
      {/* Remove extra wrappers and let CategoriesGrid fill the rest of the page */}
      <View
        style={[
          styles.contentContainer,
          { flex: 1, paddingBottom: 0, marginHorizontal: 0 },
        ]}
      >
        <CategoriesGrid
          searchText={searchText}
          onCategoryPress={handleCategoryPress}
          onFilteredCountChange={handleFilteredCountChange}
          showItemsMode={showItemsMode}
          flatListBottomPadding={tabBarHeight + 24} // Pass extra bottom padding for FlatList
        />
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  heroSection: {
    paddingHorizontal: scaleSize(spacing.lg),
    paddingBottom: scaleSize(spacing.lg),
    borderBottomLeftRadius: scaleSize(32),
    borderBottomRightRadius: scaleSize(32),
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: scaleSize(4) },
    shadowOpacity: 0.18,
    shadowRadius: scaleSize(16),
    elevation: 12,
    backgroundColor: colors.primary + "10",
  },
  heroSectionBg: {
    borderBottomLeftRadius: scaleSize(32),
    borderBottomRightRadius: scaleSize(32),
    overflow: "hidden",
  },
  heroContent: {
    alignItems: "center",
    paddingTop: scaleSize(spacing.sm),
  },
  heroTitle: {
    fontSize: scaleSize(24),
    fontWeight: "bold",
    color: colors.white,
    textAlign: "center",
    marginBottom: scaleSize(spacing.sm),
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: scaleSize(14),
    color: colors.white,
    textAlign: "center",
    opacity: 0.85,
    lineHeight: scaleSize(22),
    maxWidth: scaleSize(280),
  },
  contentContainer: {
    flex: 1,
    paddingTop: 0,
    marginTop: scaleSize(spacing.lg),
  },
  searchBarWrapper: {
    marginTop: scaleSize(spacing.md),
    marginBottom: 0,
    zIndex: 11,
  },
});

export default Explore;
