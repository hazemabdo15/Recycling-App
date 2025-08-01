﻿import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { itemImageStyles } from '../../styles/components/categoryStyles';
import { colors } from '../../styles/theme';
import { isBuyer } from '../../utils/roleLabels';

const ItemImage = ({ imageUri, points, placeholder = "recycle" }) => {
    const { user } = useAuth();
    
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