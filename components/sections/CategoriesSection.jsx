import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useCategories } from '../../hooks/useAPI';
import { CategoryCard } from '../cards';

const CategoriesSection = () => {
    const { categories, loading, error } = useCategories();

    const handleCategoryPress = (category) => {
        console.log(`${category.name} category pressed`);
        // Navigate to category details page
        router.push({
            pathname: '/category-details',
            params: { categoryName: category.name }
        });
    };

    const handleViewAllPress = () => {
        console.log('View all categories pressed');
        // Navigate to explore page (all categories)
        router.push('/explore');
    };

    // Show only first 4 categories as preview
    const limitedCategories = categories.slice(0, 4);

    if (loading) {
        return (
            <View style={styles.categoriesSection}>
                <Text style={styles.categoriesTitle}>Categories</Text>
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.categoriesSection}>
                <Text style={styles.categoriesTitle}>Categories</Text>
                <Text style={styles.errorText}>Error loading categories</Text>
            </View>
        );
    }

    return (
        <View style={styles.categoriesSection}>
            <View style={styles.categoriesHeader}>
                <Text style={styles.categoriesTitle}>Categories</Text>
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
};

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
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2D3748',
    },
    viewAllText: {
        fontSize: 16,
        color: '#4299E1',
        fontWeight: '600',
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
