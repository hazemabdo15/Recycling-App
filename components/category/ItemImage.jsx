import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image, Text, View } from 'react-native';
import { itemImageStyles } from '../../styles/components/categoryStyles';
import { colors } from '../../styles/theme';
const ItemImage = ({ imageUri, points, placeholder = "recycle" }) => {
    return (
        <View style={itemImageStyles.itemImageContainer}>
            {imageUri ? (
                <Image
                    source={{ uri: imageUri }}
                    style={itemImageStyles.itemImage}
                    resizeMode="cover"
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
            <View style={itemImageStyles.pointsBadge}>
                <MaterialCommunityIcons
                    name="star"
                    size={12}
                    color={colors.white}
                />
                <Text style={itemImageStyles.pointsText}>{points}</Text>
            </View>
        </View>
    );
};
export default ItemImage;