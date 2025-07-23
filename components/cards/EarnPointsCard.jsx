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

    const facts = [
        "Recycling one aluminum can saves enough energy to run a TV for 3 hours!",
        "Plastic bottles can take up to 450 years to decompose in a landfill.",
        "Turning off the tap while brushing your teeth can save up to 8 gallons of water a day.",
        "Every ton of recycled paper saves 17 trees.",
        "Composting food scraps reduces landfill waste and creates nutrient-rich soil.",
        "LED bulbs use at least 75% less energy than traditional incandescent lighting.",
        "One mature tree can absorb carbon dioxide at a rate of 48 pounds per year.",
        "Glass can be recycled endlessly without loss in quality or purity.",
        "Producing new plastic from recycled material uses two-thirds less energy than making it from raw materials.",
        "Earthworms improve soil health and help plants grow!",
        "Recycling one ton of plastic saves the equivalent of 1,000–2,000 gallons of gasoline.",
        "A single drip per second from a leaky faucet wastes over 3,000 gallons of water per year.",
        "The average person generates over 4 pounds of trash every day.",
        "Recycling a stack of newspapers just 3 feet high saves one tree.",
        "Bamboo is one of the fastest-growing plants and is a sustainable alternative to wood.",
        "Up to 80% of what Americans throw away is recyclable, yet the recycling rate is only about 30%.",
        "If every American recycled just one-tenth of their newspapers, we could save about 25 million trees each year.",
        "It takes 500,000 trees to produce the Sunday newspapers each week in the U.S.",
        "Recycling one glass bottle saves enough energy to power a computer for 30 minutes.",
        "Aluminum is 100% recyclable and can be recycled indefinitely without losing quality.",
        "The energy saved from recycling one glass bottle will power a 100-watt light bulb for 4 hours.",
        "Recycling cardboard only takes 75% of the energy needed to make new cardboard.",
        "More than 60% of the trash that ends up in the dustbin could be recycled.",
        "Recycling one ton of paper saves 7,000 gallons of water.",
        "Americans use 2,500,000 plastic bottles every hour, most of which are thrown away.",
        "A single recycled tin can saves enough energy to power a television for 3 hours.",
        "The world’s largest landfill is actually in the Pacific Ocean, known as the Great Pacific Garbage Patch.",
        "Recycling helps reduce greenhouse gas emissions that contribute to climate change.",
        "The average glass bottle takes 4,000 years to decompose if not recycled.",
        "Recycling one ton of aluminum saves 14,000 kWh of energy.",
        "Recycled paper produces 73% less air pollution than if it was made from raw materials."
    ];

    const randomIndex = Math.floor(Math.random() * facts.length);
    const fact = facts[randomIndex];

    return (
        <Animated.View style={[styles.earnPointsCard, cardAnimatedStyle]}>
            <LinearGradient
                colors={[colors.white, '#F8FFFE']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
            >
                <View style={styles.cardContent}>
                    <View style={styles.factHeader}>
                        <LinearGradient
                            colors={[colors.primary, colors.secondary]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.factIcon}
                        >
                            <Ionicons name="bulb" size={28} color={colors.white} />
                        </LinearGradient>
                        <Text style={styles.factTitle}>Did You Know?</Text>
                    </View>
                    <Text style={styles.factText}>{fact}</Text>
                </View>
            </LinearGradient>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    earnPointsCard: {
        marginVertical: spacing.xs,
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
        backgroundColor: colors.white,
    },
    cardGradient: {
        padding: spacing.lg,
    },
    cardContent: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
    },
    factHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    factIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
        backgroundColor: colors.primary,
    },
    factTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
        letterSpacing: -0.3,
    },
    factText: {
        fontSize: 15,
        color: colors.textSecondary,
        textAlign: 'center',
        fontWeight: '500',
    },
});

export default EarnPointsCard;