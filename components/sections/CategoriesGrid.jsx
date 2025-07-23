import { useEffect } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useCategories } from '../../hooks/useAPI';
import { CategoryCard } from '../cards';
import { FadeInView } from '../common';
const CategoriesGrid = ({ searchText = '', onCategoryPress, onFilteredCountChange }) => {
    const { categories, loading, error } = useCategories();
    const filteredCategories = categories.filter(category =>
        category.name.toLowerCase().includes(searchText.toLowerCase())
    );
    useEffect(() => {
        if (onFilteredCountChange) {
            onFilteredCountChange(filteredCategories.length);
        }
    }, [filteredCategories.length, onFilteredCountChange]);
    const handleCategoryPress = (category) => {
        console.log(`${category.name} category pressed`);
        if (onCategoryPress) {
            onCategoryPress(category);
        }
    };
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0E9F6E" />
                <Text style={styles.loadingText}>Loading categories...</Text>
            </View>
        );
    }
    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Error: {error}</Text>
            </View>
        );
    }
    
    if (!categories || categories.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No categories available</Text>
            </View>
        );
    }
    return (
        <FadeInView delay={0}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContainer}
            >
                <View style={styles.categoriesGrid}>
                    {filteredCategories.map((category, index) => {
                        return (
                            <CategoryCard
                                key={category._id}
                                category={category}
                                onPress={() => handleCategoryPress(category)}
                                style={styles.categoryCard}
                            />
                        );
                    })}
                </View>
            </ScrollView>
        </FadeInView>
    );
};
const styles = StyleSheet.create({
    scrollContainer: {
        paddingBottom: 120,
        paddingHorizontal: 5,
        backgroundColor: 'transparent',
    },
    categoriesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        backgroundColor: 'transparent',
    },
    categoryCard: {
        width: '48%',
        marginBottom: 15,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    errorText: {
        fontSize: 16,
        color: '#F44336',
        textAlign: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
});
export default CategoriesGrid;