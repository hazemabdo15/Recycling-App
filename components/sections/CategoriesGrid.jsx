import { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { CategoryCard } from '../cards';

const CategoriesGrid = ({ searchText = '', onCategoryPress, onFilteredCountChange }) => {
    const allCategories = [
        { id: 1, iconName: 'bottle-soda', iconColor: '#FF69B4', title: 'Plastic' },
        { id: 2, iconName: 'glass-fragile', iconColor: '#4FC3F7', title: 'Glass' },
        { id: 3, iconName: 'file-document', iconColor: '#8BC34A', title: 'Paper' },
        { id: 4, iconName: 'hammer-wrench', iconColor: '#FF9800', title: 'Metal' },
        { id: 5, iconName: 'battery-charging', iconColor: '#F44336', title: 'Electronics' },
        { id: 6, iconName: 'tshirt-crew', iconColor: '#9C27B0', title: 'Textiles' },
        { id: 7, iconName: 'car-battery', iconColor: '#795548', title: 'Batteries' },
        { id: 8, iconName: 'oil', iconColor: '#607D8B', title: 'Oil' },
        { id: 9, iconName: 'tire', iconColor: '#424242', title: 'Tires' },
        { id: 10, iconName: 'lightbulb', iconColor: '#FFC107', title: 'Bulbs' },
        { id: 11, iconName: 'cellphone', iconColor: '#00BCD4', title: 'Mobile Phones' },
        { id: 12, iconName: 'laptop', iconColor: '#3F51B5', title: 'Computers' },
    ];

    const filteredCategories = allCategories.filter(category =>
        category.title.toLowerCase().includes(searchText.toLowerCase())
    );

    useEffect(() => {
        if (onFilteredCountChange) {
            onFilteredCountChange(filteredCategories.length);
        }
    }, [filteredCategories.length, onFilteredCountChange]);

    const handleCategoryPress = (category) => {
        console.log(`${category.title} category pressed`);
        if (onCategoryPress) {
            onCategoryPress(category);
        }
    };

    return (
        <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContainer}
        >
            <View style={styles.categoriesGrid}>
                {filteredCategories.map((category) => (
                    <CategoryCard
                        key={category.id}
                        iconName={category.iconName}
                        iconColor={category.iconColor}
                        title={category.title}
                        onPress={() => handleCategoryPress(category)}
                        style={styles.categoryCard}
                    />
                ))}
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
});

export default CategoriesGrid;
