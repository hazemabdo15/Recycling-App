import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';

let Animated, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming, isReanimatedAvailable;

try {
  const reanimated = require('react-native-reanimated');
  Animated = reanimated.default;
  useAnimatedStyle = reanimated.useAnimatedStyle;
  useSharedValue = reanimated.useSharedValue;
  withDelay = reanimated.withDelay;
  withSpring = reanimated.withSpring;
  withTiming = reanimated.withTiming;
  isReanimatedAvailable = true;
} catch (_error) {
  console.warn('React Native Reanimated not available in EarnPointsCard, using fallbacks');
  const { View: RNView } = require('react-native');
  isReanimatedAvailable = false;
  Animated = { View: RNView };
  useAnimatedStyle = () => ({});
  useSharedValue = (initialValue) => {
    const ref = { value: initialValue };
    return ref;
  };
  withDelay = (delay, value) => value;
  withSpring = (value) => value;
  withTiming = (value, config, callback) => {
    if (callback) callback();
    return value;
  };
}

const borderRadius = {
    xs: 6,
    sm: 12,
    md: 18,
    lg: 24,
    xl: 32,
};

const EarnPointsCard = () => {
    const cardScale = useSharedValue(0.9);
    const cardOpacity = useSharedValue(0);
    const leafRotation = useSharedValue(0);
    
    useEffect(() => {
        if (!isReanimatedAvailable) return;
        
        cardOpacity.value = withDelay(300, withTiming(1, { duration: 600 }));
        cardScale.value = withDelay(300, withSpring(1, {
            damping: 15,
            stiffness: 150,
        }));
        
        const leafAnimation = () => {
            leafRotation.value = withTiming(15, { duration: 1500 }, () => {
                leafRotation.value = withTiming(-15, { duration: 1500 }, () => {
                    leafRotation.value = withTiming(0, { duration: 1500 });
                });
            });
        };
        
        const timer = setTimeout(leafAnimation, 1000);
        
        return () => clearTimeout(timer);
    }, [cardOpacity, cardScale, leafRotation]);
    
    const cardAnimatedStyle = useAnimatedStyle(() => {
        if (!isReanimatedAvailable) return {};
        return {
            opacity: cardOpacity.value,
            transform: [{ scale: cardScale.value }],
        };
    });
    
    const leafAnimatedStyle = useAnimatedStyle(() => {
        if (!isReanimatedAvailable) return {};
        return {
            transform: [{ rotate: `${leafRotation.value}deg` }],
        };
    });
    
    return (
        <Animated.View style={[styles.earnPointsCard, cardAnimatedStyle]}>
            <ImageBackground
                source={require('../../assets/images/leaves.jpg')}
                resizeMode="cover"
                style={styles.imageBackground}
                imageStyle={styles.imageStyle}
            >
                <View style={styles.overlay} />
                <View style={styles.cardContent}>
                    <View style={styles.textSection}>
                        <Text style={styles.earnPointsTitle}>📦 Ready to Recycle?</Text>
                        <Text style={styles.earnPointsSubtitle}>Turn your recyclables into rewards & help save the planet!</Text>
                    </View>
                    <View style={styles.illustrationSection}>
                        <View style={styles.glowContainer}>
                            <Animated.View style={[styles.leafIcon, leafAnimatedStyle]}>
                                <Ionicons name="earth" size={30} color="white" />
                            </Animated.View>
                        </View>
                    </View>
                </View>
                {}
            </ImageBackground>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    earnPointsCard: {
        backgroundColor: '#E8F5E9',
        borderRadius: borderRadius.md,
        marginVertical: 20,
        overflow: 'hidden',
    },
    imageBackground: {
        flex: 1,
        padding: 20,
        justifyContent: 'space-between',
    },
    imageStyle: {
        borderRadius: borderRadius.md,
        
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: borderRadius.md,
    },
    cardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    textSection: {
        flex: 1,
        paddingRight: 10,
    },
    earnPointsTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 5,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    earnPointsSubtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    illustrationSection: {
        alignItems: 'flex-end',
    },
    glowContainer: {
        borderRadius: 25,
        padding: 5,
        shadowColor: '#0E9F6E',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 20,
        elevation: 10,
    },
    leafIcon: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 20,
        padding: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        shadowColor: '#0E9F6E',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 15,
        elevation: 8,

        backdropFilter: 'blur(10px)',
    },
});

export default EarnPointsCard;