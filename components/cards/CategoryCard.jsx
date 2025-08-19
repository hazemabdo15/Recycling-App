import { memo, useCallback } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalization } from '../../context/LocalizationContext';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { getCategoryImageProps } from '../../utils/categoryUtils';
import { extractNameFromMultilingual } from '../../utils/translationHelpers';
import { CategoryImage } from '../ui';

let Animated, useSharedValue, useAnimatedStyle, withSpring;

try {
  const reanimated = require('react-native-reanimated');
  Animated = reanimated.default;
  useSharedValue = reanimated.useSharedValue;
  useAnimatedStyle = reanimated.useAnimatedStyle;
  withSpring = reanimated.withSpring;
} catch (_error) {
  console.warn('React Native Reanimated not available in CategoryCard, using fallbacks');

  Animated = { 
    View: View,
    createAnimatedComponent: (Component) => Component 
  };
  useSharedValue = (value) => ({ value });
  useAnimatedStyle = () => ({});
  withSpring = (value) => value;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scaleSize = (size) => (SCREEN_WIDTH / 375) * size;

// Dynamic styles function for CategoryCard
const getCategoryCardStyles = (colors) => StyleSheet.create({
    categoryCard: {
        width: '48%',
        backgroundColor: colors.surface,
        borderColor: colors.border,
    },
    touchableArea: {
        width: '100%',
        overflow: 'hidden',
        backgroundColor: colors.surface,
    },
    cardContent: {
        alignItems: 'center',
        width: '100%',
        backgroundColor: 'transparent',
    },
    categoryIcon: {},
    categoryText: {
        fontWeight: '600',
        color: colors.text,
        textAlign: 'center',
    },
});

const CategoryCard = memo(({ category, onPress }) => {
    const { currentLanguage } = useLocalization();
    const { colors } = useThemedStyles();
    const scale = useSharedValue(1);
    
    // Get category image props with multilingual support
    const imageProps = getCategoryImageProps(category, currentLanguage);
    
    // Extract category name for accessibility
    const categoryDisplayName = extractNameFromMultilingual(category.name, currentLanguage);

    const handlePressIn = useCallback(() => {
        scale.value = withSpring(0.96, { damping: 20, stiffness: 300 });
    }, [scale]);

    const handlePressOut = useCallback(() => {
        scale.value = withSpring(1, { damping: 20, stiffness: 300 });
    }, [scale]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const styles = getCategoryCardStyles(colors);

    return (
        <Animated.View style={[styles.categoryCard, {
            borderRadius: scaleSize(18),
            marginBottom: scaleSize(15),
            borderWidth: scaleSize(1),
        }, animatedStyle]}>
            <Pressable
                style={({ pressed }) => [
                    styles.touchableArea,
                    { borderRadius: scaleSize(18), opacity: pressed ? 0.85 : 1 },
                ]}
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                android_ripple={{ color: '#e0e0e0', borderless: false }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`${categoryDisplayName} category`}
                accessibilityHint={`Navigate to ${categoryDisplayName} recycling items`}
            >
                <Animated.View style={[styles.cardContent, { padding: scaleSize(20) }]}
                >
                    <CategoryImage
                        {...imageProps}
                        size={scaleSize(60)}
                        style={[styles.categoryIcon, { marginBottom: scaleSize(12) }]}
                    />
                    <Text style={[styles.categoryText, { fontSize: scaleSize(16) }]}>{imageProps.title}</Text>
                </Animated.View>
            </Pressable>
        </Animated.View>
    );
});

CategoryCard.displayName = 'CategoryCard';

export default CategoryCard;