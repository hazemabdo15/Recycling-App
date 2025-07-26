import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CategoriesGrid } from "../../components/sections";
import { SearchBar } from "../../components/ui";
import { colors, spacing } from "../../styles/theme";

const Explore = () => {
  const [searchText, setSearchText] = useState("");
  const [filteredCount, setFilteredCount] = useState(0);
  const [showItemsMode, setShowItemsMode] = useState(false);
  const insets = useSafeAreaInsets();

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

  const tabBarHeight = 140 + insets.bottom;

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
          colors={[colors.primary, colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, styles.heroSectionBg]}
        />
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>🔍 What Can You Recycle?</Text>
          <Text style={styles.heroSubtitle}>
            {searchText
              ? `${filteredCount} ${
                  showItemsMode ? "items" : "categories"
                } found`
              : "Browse materials and find what you can recycle at home"}
          </Text>
        </View>
        <View style={styles.searchBarWrapper}>
          <SearchBar
            placeholder="Search recyclable materials..."
            onSearch={handleSearch}
            onFilter={handleFilter}
          />
        </View>
      </View>
      <ScrollView
        style={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: tabBarHeight,
          marginHorizontal: spacing.lg,
        }}
      >
        <View style={{ marginTop: 10 }}>
          <CategoriesGrid
            searchText={searchText}
            onCategoryPress={handleCategoryPress}
            onFilteredCountChange={handleFilteredCountChange}
            showItemsMode={showItemsMode}
          />
        </View>
      </ScrollView>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  heroSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 12,
    backgroundColor: colors.primary + '10',
  },
  heroSectionBg: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: "hidden",
  },
  heroContent: {
    alignItems: "center",
    paddingTop: spacing.sm,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.white,
    textAlign: "center",
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 14,
    color: colors.white,
    textAlign: "center",
    opacity: 0.85,
    lineHeight: 22,
    maxWidth: 280,
  },
  contentContainer: {
    flex: 1,
    paddingTop: 0,
  },
  searchBarWrapper: {
    marginTop: spacing.md,
    marginBottom: 0,
    zIndex: 11,
  },
});

export default Explore;
