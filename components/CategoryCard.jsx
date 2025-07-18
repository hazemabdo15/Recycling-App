import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';


const borderRadius = {
  xs: 6,    
  sm: 12,   
  md: 18,   
  lg: 24,   
  xl: 32,   
};

const CategoryCard = ({ iconName, iconColor, title, onPress }) => {
    const scale = useSharedValue(1);
    const shadowOpacity = useSharedValue(0.05);

    const handlePressIn = () => {
        scale.value = withSpring(0.95, { damping: 15, stiffness: 200 });
        shadowOpacity.value = withTiming(0.15, { duration: 150 });
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, { damping: 15, stiffness: 200 });
        shadowOpacity.value = withTiming(0.05, { duration: 150 });
    };

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
            shadowOpacity: shadowOpacity.value,
        };
    });

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
                    <View style={styles.categoryIcon}>
                        <MaterialCommunityIcons name={iconName} size={32} color={iconColor} />
                    </View>
                    <Text style={styles.categoryText}>{title}</Text>
                </Animated.View>
            </Animated.View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    categoryCard: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: borderRadius.md,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
        elevation: 2,
    },
    touchableArea: {
        width: '100%',
    },
    cardContent: {
        padding: 20,
        alignItems: 'center',
        width: '100%',
    },
    categoryIcon: {
        width: 60,
        height: 60,
        borderRadius: borderRadius.xl,
        backgroundColor: '#F7FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    categoryText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2D3748',
    },
});

export default CategoryCard;
