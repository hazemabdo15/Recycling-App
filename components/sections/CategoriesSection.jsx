import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useCategories } from '../../hooks/useAPI';
import { CategoryCard } from '../cards';

const CategoriesSection = () => {
    const { categories, loading, error } = useCategories();

    const getCategoryIcon = (categoryName) => {
        const iconMap = {
            'Plastic': { iconName: 'bottle-soda', iconColor: '#FF69B4' },
            'Glass': { iconName: 'glass-fragile', iconColor: '#4FC3F7' },
            'Paper': { iconName: 'file-document', iconColor: '#8BC34A' },
            'Metal': { iconName: 'hammer-wrench', iconColor: '#FF9800' },
            'Electronics': { iconName: 'battery-charging', iconColor: '#F44336' },
            'Textiles': { iconName: 'tshirt-crew', iconColor: '#9C27B0' },
            'Batteries': { iconName: 'car-battery', iconColor: '#795548' },
            'Oil': { iconName: 'oil', iconColor: '#607D8B' },
        };
        return iconMap[categoryName] || { iconName: 'help-circle', iconColor: '#9E9E9E' };
    };

    const handleCategoryPress = (categoryName) => {
        console.log(`${categoryName} category pressed`);
    };

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
                onPress={() => console.log('View all categories pressed')}>
                    <Text style={styles.viewAllText}>View all</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.categoriesGrid}>
                {limitedCategories.map((category) => {
                    const iconData = getCategoryIcon(category.name);
                    return (
                        <CategoryCard
                            key={category._id}
                            iconName={iconData.iconName}
                            iconColor={iconData.iconColor}
                            title={category.name}
                            onPress={() => handleCategoryPress(category.name)}
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
