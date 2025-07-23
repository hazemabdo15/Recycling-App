import { memo, useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getCategoryImageProps } from '../../utils/categoryUtils';
import { CategoryImage } from '../ui';

let Animated, useSharedValue, useAnimatedStyle, withTiming, withSpring;

try {
  const reanimated = require('react-native-reanimated');
  Animated = reanimated.default;
  useSharedValue = reanimated.useSharedValue;
  useAnimatedStyle = reanimated.useAnimatedStyle;
  withTiming = reanimated.withTiming;
  withSpring = reanimated.withSpring;
} catch (_error) {
  console.warn('React Native Reanimated not available in CategoryCard, using fallbacks');

  Animated = { 
    View: View,
    createAnimatedComponent: (Component) => Component 
  };
  useSharedValue = (value) => ({ value });
  useAnimatedStyle = () => ({});
  withTiming = (value) => value;
  withSpring = (value) => value;
}

const borderRadius = {
    xs: 6,
    sm: 12,
    md: 18,
    lg: 24,
    xl: 32,
};

const CategoryCard = memo(({ category, onPress }) => {
    const scale = useSharedValue(1);
    const shadowOpacity = useSharedValue(0.1);
    const imageProps = getCategoryImageProps(category);

    const handlePressIn = useCallback(() => {
        scale.value = withSpring(0.96, { damping: 20, stiffness: 300 });
        shadowOpacity.value = withTiming(0.2, { duration: 100 });
    }, [scale, shadowOpacity]);

    const handlePressOut = useCallback(() => {
        scale.value = withSpring(1, { damping: 20, stiffness: 300 });
        shadowOpacity.value = withTiming(0.1, { duration: 100 });
    }, [scale, shadowOpacity]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        shadowOpacity: shadowOpacity.value,
    }));

    const handleResponderRelease = useCallback(() => {
        handlePressOut();
        onPress && onPress();
    }, [handlePressOut, onPress]);

    return (
        <Animated.View style={[styles.categoryCard, animatedStyle]}>
            <Animated.View
                style={styles.touchableArea}
                onTouchStart={handlePressIn}
                onTouchEnd={handlePressOut}
                onTouchCancel={handlePressOut}
            >
                <Animated.View
                    style={styles.cardContent}
                    onStartShouldSetResponder={() => true}
                    onResponderGrant={handlePressIn}
                    onResponderRelease={handleResponderRelease}
                    onResponderTerminate={handlePressOut}
                >
                    <CategoryImage
                        {...imageProps}
                        size={60}
                        style={styles.categoryIcon}
                    />
                    <Text style={styles.categoryText}>{category.name}</Text>
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
        borderRadius: borderRadius.md,
        marginBottom: 15,
        // iOS shadow
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 3,
        shadowOpacity: 0.1,
        // Android shadow
        elevation: 2,
        // Border to prevent shadow rendering issues
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    touchableArea: {
        width: '100%',
        borderRadius: borderRadius.md,
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
    },
    cardContent: {
        padding: 20,
        alignItems: 'center',
        width: '100%',
        backgroundColor: 'transparent',
    },
    categoryIcon: {
        marginBottom: 12,
    },
    categoryText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#5F4B1E',
        textAlign: 'center',
    },
});

export default CategoryCard;