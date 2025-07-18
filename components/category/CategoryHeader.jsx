import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { categoryHeaderStyles } from '../../styles/components/categoryStyles';
import { colors } from '../../styles/theme';

const CategoryHeader = ({ 
    categoryName, 
    totalItems, 
    totalPoints, 
    totalValue, 
    animatedStyle 
}) => {
    return (
        <Animated.View style={[categoryHeaderStyles.header, animatedStyle]}>
            <View style={categoryHeaderStyles.headerContent}>
                <Text style={categoryHeaderStyles.title}>{categoryName}</Text>
                <Text style={categoryHeaderStyles.subtitle}>
                    {totalItems} {totalItems === 1 ? 'item' : 'items'} available
                </Text>
            </View>
            <View style={categoryHeaderStyles.headerStats}>
                <View style={categoryHeaderStyles.statItem}>
                    <MaterialCommunityIcons 
                        name="package-variant" 
                        size={20} 
                        color={colors.primary} 
                    />
                    <Text style={categoryHeaderStyles.statText}>{totalItems}</Text>
                    <Text style={categoryHeaderStyles.statLabel}>Items</Text>
                </View>
                <View style={categoryHeaderStyles.statItem}>
                    <MaterialCommunityIcons 
                        name="star" 
                        size={20} 
                        color={colors.accent} 
                    />
                    <Text style={categoryHeaderStyles.statText}>{totalPoints}</Text>
                    <Text style={categoryHeaderStyles.statLabel}>Points</Text>
                </View>
                <View style={categoryHeaderStyles.statItem}>
                    <MaterialCommunityIcons 
                        name="cash" 
                        size={20} 
                        color={colors.secondary} 
                    />
                    <Text style={categoryHeaderStyles.statText}>{totalValue} EGP</Text>
                    <Text style={categoryHeaderStyles.statLabel}>Cart Value</Text>
                </View>
            </View>
        </Animated.View>
    );
};

export default CategoryHeader;
