import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, shadows } from "../../styles/theme";
import { scaleSize } from "../../utils/scale";

let Animated, runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming;

try {
  const reanimated = require("react-native-reanimated");
  Animated = reanimated.default;
  runOnJS = reanimated.runOnJS;
  useAnimatedStyle = reanimated.useAnimatedStyle;
  useSharedValue = reanimated.useSharedValue;
  withSpring = reanimated.withSpring;
  withTiming = reanimated.withTiming;
} catch (_error) {
  const { View: RNView } = require("react-native");
  Animated = { View: RNView };
  runOnJS = (fn) => fn;
  useAnimatedStyle = () => ({});
  useSharedValue = (value) => ({ value });
  withSpring = (value) => value;
  withTiming = (value) => value;
}

const Toast = ({
  visible,
  message,
  type = "success",
  onHide,
  duration = 3000,
}) => {
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  const hideToast = React.useCallback(() => {
    translateY.value = withTiming(-100, { duration: 300 });
    opacity.value = withTiming(0, { duration: 300 }, () => {
      if (onHide) {
        runOnJS(onHide)();
      }
    });
    scale.value = withTiming(0.8, { duration: 300 });
  }, [translateY, opacity, scale, onHide]);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withSpring(1, { damping: 12, stiffness: 200 });

      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration, hideToast, translateY, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  const getToastConfig = () => {
    switch (type) {
      case "success":
        return {
          backgroundColor: colors.primary,
          icon: "check-circle",
          iconColor: colors.white,
        };
      case "error":
        return {
          backgroundColor: "#ef4444",
          icon: "alert-circle",
          iconColor: colors.white,
        };
      case "warning":
        return {
          backgroundColor: "#f59e0b",
          icon: "alert",
          iconColor: colors.white,
        };
      case "info":
        return {
          backgroundColor: "#3b82f6",
          icon: "information",
          iconColor: colors.white,
        };
      default:
        return {
          backgroundColor: colors.primary,
          icon: "check-circle",
          iconColor: colors.white,
        };
    }
  };

  const config = getToastConfig();

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.toast,
          { backgroundColor: config.backgroundColor },
          animatedStyle,
        ]}
      >
        <MaterialCommunityIcons
          name={config.icon}
          size={20}
          color={config.iconColor}
          style={styles.icon}
        />
        <Text style={styles.message}>{message}</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: scaleSize(60),
    left: scaleSize(20),
    right: scaleSize(20),
    zIndex: 1000,
    alignItems: "center",
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scaleSize(16),
    paddingVertical: scaleSize(12),
    borderRadius: scaleSize(12),
    minHeight: scaleSize(48),
    maxWidth: "90%",
    ...shadows.medium,
  },
  icon: {
    marginRight: scaleSize(8),
  },
  message: {
    color: colors.white,
    fontSize: scaleSize(14),
    fontWeight: "600",
    flex: 1,
    textAlign: "left",
  },
});

export default Toast;
