import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

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

const colors = {
    primary: "#0E9F6E",
    secondary: "#8BC34A",
    accent: "#FFC107",
    white: "#ffffff",
    background: "#FAFAFA",
    text: "#171717",
    textSecondary: "#607D8B",
};

const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
};

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
    const iconScale = useSharedValue(0.8);
    
    useEffect(() => {
        if (!isReanimatedAvailable) return;
        
        cardOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
        cardScale.value = withDelay(200, withSpring(1, {
            damping: 15,
            stiffness: 150,
        }));
        
        iconScale.value = withDelay(800, withSpring(1, {
            damping: 12,
            stiffness: 200,
        }));
    }, [cardOpacity, cardScale, iconScale]);
    
    const cardAnimatedStyle = useAnimatedStyle(() => {
        if (!isReanimatedAvailable) return {};
        return {
            opacity: cardOpacity.value,
            transform: [{ scale: cardScale.value }],
        };
    });
    
    const iconAnimatedStyle = useAnimatedStyle(() => {
        if (!isReanimatedAvailable) return {};
        return {
            transform: [{ scale: iconScale.value }],
        };
    });
    
    return (
        <Animated.View style={[styles.earnPointsCard, cardAnimatedStyle]}>
            <LinearGradient
                colors={[colors.white, '#F8FFFE']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
            >
                <View style={styles.cardContent}>
                    <View style={styles.textSection}>
                        <Text style={styles.earnPointsTitle}>🍃 Start Your Journey</Text>
                        <Text style={styles.earnPointsSubtitle}>
                            Every item you recycle makes a difference. Begin your eco-friendly journey today!
                        </Text>
                        <View style={styles.benefitsRow}>
                            <View style={styles.benefitItem}>
                                <Text style={styles.benefitIcon}>🏆</Text>
                                <Text style={styles.benefitText}>Earn Rewards</Text>
                            </View>
                            <View style={styles.benefitItem}>
                                <Text style={styles.benefitIcon}>🌍</Text>
                                <Text style={styles.benefitText}>Save Planet</Text>
                            </View>
                            <View style={styles.benefitItem}>
                                <Text style={styles.benefitIcon}>📈</Text>
                                <Text style={styles.benefitText}>Track Impact</Text>
                            </View>
                        </View>
                    </View>
                    <Animated.View style={[styles.iconSection, iconAnimatedStyle]}>
                        <LinearGradient
                            colors={[colors.primary, colors.secondary]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.iconGradient}
                        >
                            <Ionicons name="rocket" size={28} color={colors.white} />
                        </LinearGradient>
                    </Animated.View>
                </View>
            </LinearGradient>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    earnPointsCard: {
        marginVertical: spacing.md,
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    cardGradient: {
        padding: spacing.lg,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },
    textSection: {
        flex: 1,
        paddingRight: spacing.md,
    },
    earnPointsTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: spacing.xs,
        letterSpacing: -0.3,
    },
    earnPointsSubtitle: {
        fontSize: 14,
        color: colors.textSecondary,
        lineHeight: 20,
        marginBottom: spacing.lg,
        fontWeight: '400',
    },
    benefitsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingRight: spacing.md,
    },
    benefitItem: {
        alignItems: 'center',
        flex: 1,
    },
    benefitIcon: {
        fontSize: 20,
        marginBottom: spacing.xs / 2,
    },
    benefitText: {
        fontSize: 11,
        color: colors.textSecondary,
        fontWeight: '600',
        textAlign: 'center',
    },
    iconSection: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconGradient: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
});

export default EarnPointsCard;