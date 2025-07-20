import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { RecyclingIllustration } from '../common';
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
        setTimeout(() => {
            leafRotation.value = withTiming(15, { duration: 1500 }, () => {
                leafRotation.value = withTiming(-15, { duration: 1500 }, () => {
                    leafRotation.value = withTiming(0, { duration: 1500 });
                });
            });
        }, 1000);
    }, [cardScale, cardOpacity, leafRotation]);
    const cardAnimatedStyle = useAnimatedStyle(() => {
        return {
            opacity: cardOpacity.value,
            transform: [{ scale: cardScale.value }],
        };
    });
    const leafAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ rotate: `${leafRotation.value}deg` }],
        };
    });
    return (
        <Animated.View style={[styles.earnPointsCard, cardAnimatedStyle]}>
            <View style={styles.cardContent}>
                <View style={styles.textSection}>
                    <Text style={styles.earnPointsTitle}>Earn Points</Text>
                    <Text style={styles.earnPointsSubtitle}>for discarded trash</Text>
                </View>
                <View style={styles.illustrationSection}>
                    <Animated.View style={[styles.leafIcon, leafAnimatedStyle]}>
                        <Ionicons name="leaf" size={30} color="#0E9F6E" />
                    </Animated.View>
                </View>
            </View>
            <RecyclingIllustration />
        </Animated.View>
    );
};
const styles = StyleSheet.create({
    earnPointsCard: {
        backgroundColor: '#E8F5E9',
        borderRadius: borderRadius.md,
        padding: 20,
        marginTop: 20,
        marginBottom: 30,
    },
    cardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    textSection: {
        flex: 1,
    },
    earnPointsTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2D3748',
        marginBottom: 5,
    },
    earnPointsSubtitle: {
        fontSize: 16,
        color: '#718096',
    },
    illustrationSection: {
        alignItems: 'flex-end',
    },
    leafIcon: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
});
export default EarnPointsCard;