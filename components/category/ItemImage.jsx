import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getItemImageStyles } from '../../styles/components/categoryStyles';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { isBuyer } from '../../utils/roleUtils';

const ItemImage = ({ imageUri, points, placeholder = "recycle" }) => {
    const { user } = useAuth();
    const { colors, isDarkMode } = useThemedStyles();
    const itemImageStyles = getItemImageStyles(isDarkMode);
    
    return (
        <View style={itemImageStyles.itemImageContainer}>
            {imageUri ? (
                <Image
                    source={{ uri: imageUri }}
                    style={itemImageStyles.itemImage}
                    resizeMode="contain"
                />
            ) : (
                <View style={itemImageStyles.placeholderImage}>
                    <MaterialCommunityIcons
                        name={placeholder}
                        size={40}
                        color={colors.primary}
                    />
                </View>
            )}
            {!isBuyer(user) && (
                <View style={itemImageStyles.pointsBadge}>
                    <MaterialCommunityIcons
                        name="star"
                        size={12}
                        color={colors.white}
                    />
                    <Text style={itemImageStyles.pointsText}>{points}</Text>
                </View>
            )}
        </View>
    );
};
export default ItemImage;