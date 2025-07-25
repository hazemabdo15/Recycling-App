import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { categoryHeaderStyles } from '../../styles/components/categoryStyles';
import { colors } from '../../styles/theme';

const CategoryHeader = ({
    categoryName,
    totalItems,
    totalPoints,
    totalValue,
    animatedStyle,
    headerOpacity,
    onGoBack
}) => {
    return (
        <View style={[categoryHeaderStyles.header, animatedStyle]}>
            <View style={categoryHeaderStyles.headerContentRow}>
                <MaterialCommunityIcons
                    name="arrow-left"
                    size={28}
                    color={colors.primary}
                    style={{ marginRight: 8 }}
                    onPress={onGoBack}
                />
                <Text style={categoryHeaderStyles.title}>{categoryName}</Text>
            </View>
            <View style={[categoryHeaderStyles.headerStats]}>
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
                    <Text style={categoryHeaderStyles.statLabel}>Eco Points</Text>
                </View>
                <View style={categoryHeaderStyles.statItem}>
                    <MaterialCommunityIcons
                        name="cash"
                        size={20}
                        color={colors.secondary}
                    />
                    <Text style={categoryHeaderStyles.statText}>{totalValue} EGP</Text>
                    <Text style={categoryHeaderStyles.statLabel}>You&apos;ll Earn</Text>
                </View>
            </View>
        </View>
    );
};
export default CategoryHeader;