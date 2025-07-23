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

const CategoryCard = ({ category, onPress }) => {
    const scale = useSharedValue(1);
    const shadowOpacity = useSharedValue(0.08);
    const imageProps = getCategoryImageProps(category);

    const handlePressIn = () => {
        scale.value = withSpring(0.96, { damping: 20, stiffness: 300 });
        shadowOpacity.value = withTiming(0.15, { duration: 100 });
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, { damping: 20, stiffness: 300 });
        shadowOpacity.value = withTiming(0.08, { duration: 100 });
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        shadowOpacity: shadowOpacity.value,
    }));

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
                    onResponderRelease={() => {
                        handlePressOut();
                        onPress && onPress();
                    }}
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
};

const styles = StyleSheet.create({
    categoryCard: {
        width: '48%',
        backgroundColor: '#FFFFFF',
        borderRadius: borderRadius.md,
        marginBottom: 15,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 4,
        shadowOpacity: 0.08,
        elevation: 3,
        borderWidth: 0.5,
        borderColor: '#E5E7EB',
    },
    touchableArea: {
        width: '100%',
        borderRadius: borderRadius.md,
        overflow: 'hidden',
    },
    cardContent: {
        padding: 20,
        alignItems: 'center',
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: borderRadius.md,
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