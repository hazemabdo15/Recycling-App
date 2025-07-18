import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { getCategoryIcon } from '../../utils/categoryUtils';

const borderRadius = {
  xs: 6,    
  sm: 12,   
  md: 18,   
  lg: 24,   
  xl: 32,   
};

const CategoryImage = ({ 
    imageUri, 
    iconName, 
    iconColor,
    title,
    size = 60,
    style 
}) => {
    const [imageError, setImageError] = useState(false);
    
    // If iconName/iconColor not provided, get from category name
    const iconData = iconName && iconColor ? 
        { iconName, iconColor } : 
        getCategoryIcon(title);

    const handleImageError = () => {
        setImageError(true);
    };

    const handleImageLoad = () => {
        setImageError(false);
    };

    const containerStyle = {
        width: size,
        height: size,
        borderRadius: borderRadius.xl,
        backgroundColor: '#F7FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    };

    return (
        <View style={[containerStyle, style]}>
            {imageUri && !imageError ? (
                <Image 
                    source={{ uri: imageUri }}
                    style={styles.image}
                    resizeMode="cover"
                    onError={handleImageError}
                    onLoad={handleImageLoad}
                />
            ) : (
                <MaterialCommunityIcons 
                    name={iconData.iconName} 
                    size={size * 0.53} // Proportional icon size
                    color={iconData.iconColor} 
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    image: {
        width: '100%',
        height: '100%',
    },
});

export default CategoryImage;
