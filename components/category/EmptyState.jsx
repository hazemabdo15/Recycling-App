import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';
import { emptyStateStyles } from '../../styles/components/categoryStyles';
import { colors } from '../../styles/theme';

const EmptyState = ({ 
    categoryName, 
    onAddItem,
    iconName = "package-variant-closed",
    title = "No Items Yet",
    showAddButton = true 
}) => {
    return (
        <View style={emptyStateStyles.emptyState}>
            <MaterialCommunityIcons 
                name={iconName} 
                size={80} 
                color={colors.base300} 
            />
            <Text style={emptyStateStyles.emptyTitle}>{title}</Text>
            <Text style={emptyStateStyles.emptySubtitle}>
                Be the first to add items to the {categoryName} category!
            </Text>
            {showAddButton && (
                <TouchableOpacity style={emptyStateStyles.addButton} onPress={onAddItem}>
                    <MaterialCommunityIcons 
                        name="plus" 
                        size={20} 
                        color={colors.white} 
                    />
                    <Text style={emptyStateStyles.addButtonText}>Add Item</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

export default EmptyState;
