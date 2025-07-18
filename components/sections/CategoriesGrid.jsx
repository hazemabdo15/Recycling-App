import { useEffect } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useCategories } from '../../hooks/useAPI';
import { CategoryCard } from '../cards';

const CategoriesGrid = ({ searchText = '', onCategoryPress, onFilteredCountChange }) => {
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
            'Tires': { iconName: 'tire', iconColor: '#424242' },
            'Bulbs': { iconName: 'lightbulb', iconColor: '#FFC107' },
            'Mobile Phones': { iconName: 'cellphone', iconColor: '#00BCD4' },
            'Computers': { iconName: 'laptop', iconColor: '#3F51B5' },
        };
        return iconMap[categoryName] || { iconName: 'help-circle', iconColor: '#9E9E9E' };
    };

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
                    const iconData = getCategoryIcon(category.name);
                    return (
                        <CategoryCard
                            key={category._id}
                            iconName={iconData.iconName}
                            iconColor={iconData.iconColor}
                            title={category.name}
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
