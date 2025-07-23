import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CategoriesGrid } from '../../components/sections';
import { SearchBar } from '../../components/ui';
import { colors, spacing } from '../../styles/theme';

const Explore = () => {
    const [searchText, setSearchText] = useState('');
    const [filteredCount, setFilteredCount] = useState(0);
    const [showItemsMode, setShowItemsMode] = useState(false); // false: show categories, true: show all items
    const insets = useSafeAreaInsets();

    useFocusEffect(useCallback(() => {

        return () => {
        };
    }, []));

    const handleSearch = (text) => {
        setSearchText(text);
    };
    const handleFilter = () => {
        setShowItemsMode((prev) => !prev);
    };
    const handleCategoryPress = (category) => {
        router.push({
            pathname: '/category-details',
            params: { categoryName: category.name }
        });
    };
    const handleFilteredCountChange = (count) => {
        setFilteredCount(count);
    };
    // Unify hero section height with home page
    const tabBarHeight = 140 + insets.bottom;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            <LinearGradient
                colors={[colors.primary, colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.heroSection, { paddingTop: insets.top + 20, paddingBottom: spacing.lg }]}
            >
                <View style={styles.heroContent}>
                    <Text style={styles.heroTitle}>🔍 What Can You Recycle?</Text>
                    <Text style={styles.heroSubtitle}>
                        {searchText ? `${filteredCount} ${showItemsMode ? 'items' : 'categories'} found` : 'Browse materials and find what you can recycle at home'}
                    </Text>
                </View>
            </LinearGradient>
            <ScrollView
                style={styles.contentContainer}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    paddingBottom: tabBarHeight,
                    justifyContent: 'space-between',
                    marginHorizontal: spacing.lg,
                }}
            >
                <SearchBar
                    placeholder="Search recyclable materials..."
                    onSearch={handleSearch}
                    onFilter={handleFilter}
                />
                <CategoriesGrid
                    searchText={searchText}
                    onCategoryPress={handleCategoryPress}
                    onFilteredCountChange={handleFilteredCountChange}
                    showItemsMode={showItemsMode}
                />
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
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    heroContent: {
        alignItems: 'center',
        paddingTop: spacing.sm,
    },
    heroTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: colors.white,
        textAlign: 'center',
        marginBottom: spacing.sm,
        letterSpacing: -0.5,
    },
    heroSubtitle: {
        fontSize: 15,
        color: colors.white,
        textAlign: 'center',
        opacity: 0.85,
        lineHeight: 22,
        maxWidth: 280,
    },
    contentContainer: {
        flex: 1,
        paddingTop: spacing.md,
    },
});

export default Explore;