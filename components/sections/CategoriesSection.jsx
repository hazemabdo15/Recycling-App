import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CategoryCard } from '../cards';

const CategoriesSection = () => {
    const categories = [
        { id: 1, iconName: 'bottle-soda', iconColor: '#FF69B4', title: 'Plastic' },
        { id: 2, iconName: 'glass-fragile', iconColor: '#4FC3F7', title: 'Glass' },
        { id: 3, iconName: 'file-document', iconColor: '#8BC34A', title: 'Paper' },
        { id: 4, iconName: 'hammer-wrench', iconColor: '#FF9800', title: 'Metal' },
    ];

    const handleCategoryPress = (categoryTitle) => {
        console.log(`${categoryTitle} category pressed`);
        
    };

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
                {categories.map((category) => (
                    <CategoryCard
                        key={category.id}
                        iconName={category.iconName}
                        iconColor={category.iconColor}
                        title={category.title}
                        onPress={() => handleCategoryPress(category.title)}
                    />
                ))}
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
});

export default CategoriesSection;
