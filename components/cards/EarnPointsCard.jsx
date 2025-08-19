import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { scaleSize } from "../../utils/scale";
import { useLocalization } from "../../context/LocalizationContext";

let Animated,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
  isReanimatedAvailable;

try {
  const reanimated = require("react-native-reanimated");
  Animated = reanimated.default;
  useAnimatedStyle = reanimated.useAnimatedStyle;
  useSharedValue = reanimated.useSharedValue;
  withDelay = reanimated.withDelay;
  withSpring = reanimated.withSpring;
  withTiming = reanimated.withTiming;
  isReanimatedAvailable = true;
} catch (_error) {
  console.warn(
    "React Native Reanimated not available in EarnPointsCard, using fallbacks"
  );
  const { View: RNView } = require("react-native");
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
  const { t } = useLocalization();
  const cardScale = useSharedValue(0.9);
  const cardOpacity = useSharedValue(0);
  const iconScale = useSharedValue(0.8);

  useEffect(() => {
    if (!isReanimatedAvailable) return;

    cardOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
    cardScale.value = withDelay(
      200,
      withSpring(1, {
        damping: 15,
        stiffness: 150,
      })
    );

    iconScale.value = withDelay(
      800,
      withSpring(1, {
        damping: 12,
        stiffness: 200,
      })
    );
  }, [cardOpacity, cardScale, iconScale]);

  const cardAnimatedStyle = useAnimatedStyle(() => {
    if (!isReanimatedAvailable) return {};
    return {
      opacity: cardOpacity.value,
      transform: [{ scale: cardScale.value }],
    };
  });

  const facts = [
    t("earnPointsCard.fact_0"),
    t("earnPointsCard.fact_1"),
    t("earnPointsCard.fact_2"),
    t("earnPointsCard.fact_3"),
    t("earnPointsCard.fact_4"),
    t("earnPointsCard.fact_5"),
    t("earnPointsCard.fact_6"),
    t("earnPointsCard.fact_7"),
    t("earnPointsCard.fact_8"),
    t("earnPointsCard.fact_9"),
    t("earnPointsCard.fact_10"),
    t("earnPointsCard.fact_11"),
    t("earnPointsCard.fact_12"),
    t("earnPointsCard.fact_13"),
    t("earnPointsCard.fact_14"),
    t("earnPointsCard.fact_15"),
    t("earnPointsCard.fact_16"),
    t("earnPointsCard.fact_17"),
    t("earnPointsCard.fact_18"),
    t("earnPointsCard.fact_19"),
    t("earnPointsCard.fact_20"),
    t("earnPointsCard.fact_21"),
    t("earnPointsCard.fact_22"),
    t("earnPointsCard.fact_23"),
    t("earnPointsCard.fact_24"),
    t("earnPointsCard.fact_25"),
    t("earnPointsCard.fact_26"),
    t("earnPointsCard.fact_27"),
    t("earnPointsCard.fact_28"),
    t("earnPointsCard.fact_29"),
    t("earnPointsCard.fact_30"),
  ];

  const randomIndex = Math.floor(Math.random() * facts.length);
  const fact = facts[randomIndex];

  return (
    <Animated.View style={[styles.earnPointsCard, cardAnimatedStyle]}>
      <LinearGradient
        colors={[colors.white, "#F8FFFE"]}
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
            <Text style={styles.factTitle}>{t("earnPointsCard.title")}</Text>
          </View>
          <Text style={styles.factText}>{fact}</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  earnPointsCard: {
    marginVertical: scaleSize(spacing.xs),
    borderRadius: scaleSize(borderRadius.lg),
    overflow: "hidden",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: scaleSize(4) },
    shadowOpacity: 0.15,
    shadowRadius: scaleSize(12),
    elevation: 8,
    backgroundColor: colors.white,
  },
  cardGradient: {
    padding: scaleSize(spacing.lg),
  },
  cardContent: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  factHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scaleSize(spacing.xs),
  },
  factIcon: {
    width: scaleSize(40),
    height: scaleSize(40),
    borderRadius: scaleSize(20),
    alignItems: "center",
    justifyContent: "center",
    marginRight: scaleSize(spacing.md),
    backgroundColor: colors.primary,
  },
  factTitle: {
    fontSize: scaleSize(18),
    fontWeight: "bold",
    color: colors.text,
  },
  factText: {
    fontSize: scaleSize(15),
    color: colors.textSecondary,
    textAlign: "center",
    fontWeight: "500",
  },
});

export default EarnPointsCard;
