import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';

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
    }, []);
    
    const cardAnimatedStyle = useAnimatedStyle(() => ({
        opacity: cardOpacity.value,
        transform: [{ scale: cardScale.value }],
    }));
    
    const leafAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${leafRotation.value}deg` }],
    }));
    
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
                        <Text style={styles.earnPointsTitle}>Start Greener Habits</Text>
                        <Text style={styles.earnPointsSubtitle}>Collect points by recycling responsibly</Text>
                    </View>
                    <View style={styles.illustrationSection}>
                        <Animated.View style={[styles.leafIcon, leafAnimatedStyle]}>
                            <Ionicons name="leaf" size={30} color="#0E9F6E" />
                        </Animated.View>
                    </View>
                </View>
                {/* Removed the RecyclingIllustration component */}
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
        backgroundColor: 'rgba(0, 0, 0, 0.25)',
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
    leafIcon: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 20,
        padding: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
});

export default EarnPointsCard;