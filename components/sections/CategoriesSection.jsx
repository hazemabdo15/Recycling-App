import { router } from 'expo-router';
import { memo, useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useCategories } from '../../hooks/useAPI';
import { colors } from '../../styles/theme';
import { CategoryCard } from '../cards';
import { CategoriesGridSkeleton } from '../ui';
const CategoriesSection = memo(() => {
    const { categories, loading, error } = useCategories();

    const handleCategoryPress = useCallback((category) => {
        router.push({
            pathname: '/category-details',
            params: { categoryName: category.name }
        });
    }, []);

    const handleViewAllPress = useCallback(() => {
        router.push('/explore');
    }, []);

    const limitedCategories = categories.slice(0, 4);
    if (loading) {
        return (
            <View style={styles.categoriesSection}>
                <View style={styles.categoriesHeader}>
                    <Text style={styles.categoriesTitle}>What are you recycling today?</Text>
                    <TouchableOpacity onPress={handleViewAllPress}>
                        <Text style={styles.viewAllText}>View all</Text>
                    </TouchableOpacity>
                </View>
                <CategoriesGridSkeleton />
            </View>
        );
    }
    if (error) {
        return (
            <View style={styles.categoriesSection}>
                <View style={styles.categoriesHeader}>
                    <Text style={styles.categoriesTitle}>What are you recycling today?</Text>
                    <TouchableOpacity onPress={handleViewAllPress}>
                        <Text style={styles.viewAllText}>View all</Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.errorText}>Error loading categories</Text>
            </View>
        );
    }
    return (
        <View style={styles.categoriesSection}>
            <View style={styles.categoriesHeader}>
                <Text style={styles.categoriesTitle}>What are you recycling today?</Text>
                <TouchableOpacity
                onPress={handleViewAllPress}>
                    <Text style={styles.viewAllText}>View all</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.categoriesGrid}>
                {limitedCategories.map((category) => {
                    return (
                        <CategoryCard
                            key={category._id}
                            category={category}
                            onPress={() => handleCategoryPress(category)}
                        />
                    );
                })}
            </View>
        </View>
    );
});

CategoriesSection.displayName = 'CategoriesSection';
const styles = StyleSheet.create({
    categoriesSection: {
        marginBottom: 30,
    },
    categoriesHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    categoriesTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.primary,
        letterSpacing: -0.5,
        lineHeight: 34,
        marginBottom: 8,
        textTransform: 'uppercase',
        includeFontPadding: false,
    },
    viewAllText: {
        fontSize: 16,
        color: colors.primary,
        fontWeight: '700',
        lineHeight: 34,
    },
    categoriesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginTop: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#F44336',
        textAlign: 'center',
        marginTop: 20,
    },
});
export default CategoriesSection;