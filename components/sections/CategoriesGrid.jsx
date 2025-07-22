import { useEffect } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useCategories } from '../../hooks/useAPI';
import { CategoryCard } from '../cards';
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
    return (
        <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContainer}
        >
            <View style={styles.categoriesGrid}>
                {filteredCategories.map((category) => {
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
    );
};
const styles = StyleSheet.create({
    scrollContainer: {
        paddingBottom: 120,
        paddingHorizontal: 5,
    },
    categoriesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
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
});
export default CategoriesGrid;