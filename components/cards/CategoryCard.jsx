import { memo, useCallback } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { getCategoryImageProps } from '../../utils/categoryUtils';
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

const CategoryCard = memo(({ category, onPress }) => {
    const scale = useSharedValue(1);
    const imageProps = getCategoryImageProps(category);

    const handlePressIn = useCallback(() => {
        scale.value = withSpring(0.96, { damping: 20, stiffness: 300 });
    }, [scale]);

    const handlePressOut = useCallback(() => {
        scale.value = withSpring(1, { damping: 20, stiffness: 300 });
    }, [scale]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handleResponderRelease = useCallback(() => {
        handlePressOut();
        onPress && onPress();
    }, [handlePressOut, onPress]);

    return (
        <Animated.View style={[styles.categoryCard, {
            borderRadius: scaleSize(18),
            marginBottom: scaleSize(15),
            borderWidth: scaleSize(1),
        }, animatedStyle]}>
            <Animated.View
                style={[
                    styles.touchableArea,
                    { borderRadius: scaleSize(18) },
                ]}
                onTouchStart={handlePressIn}
                onTouchEnd={handlePressOut}
                onTouchCancel={handlePressOut}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`${category.name} category`}
                accessibilityHint={`Navigate to ${category.name} recycling items`}
            >
                <Animated.View
                    style={[styles.cardContent, { padding: scaleSize(20) }]}
                    onStartShouldSetResponder={() => true}
                    onResponderGrant={handlePressIn}
                    onResponderRelease={handleResponderRelease}
                    onResponderTerminate={handlePressOut}
                >
                    <CategoryImage
                        {...imageProps}
                        size={scaleSize(60)}
                        style={[styles.categoryIcon, { marginBottom: scaleSize(12) }]}
                    />
                    <Text style={[styles.categoryText, { fontSize: scaleSize(16) }]}>{category.name}</Text>
                </Animated.View>
            </Animated.View>
        </Animated.View>
    );
});

CategoryCard.displayName = 'CategoryCard';

const styles = StyleSheet.create({
    categoryCard: {
        width: '48%',
        backgroundColor: '#FFFFFF',
        borderColor: '#F3F4F6',
    },
    touchableArea: {
        width: '100%',
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
    },
    cardContent: {
        alignItems: 'center',
        width: '100%',
        backgroundColor: 'transparent',
    },
    categoryIcon: {},
    categoryText: {
        fontWeight: '600',
        color: '#5F4B1E',
        textAlign: 'center',
    },
});

export default CategoryCard;