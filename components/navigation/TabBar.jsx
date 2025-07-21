import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLinkBuilder } from "@react-navigation/native";
import { BlurView } from "expo-blur";
import * as Haptics from 'expo-haptics';
import React from "react";
import { Dimensions, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useVoiceModal } from "../../hooks/useVoiceModal";
import { colors, shadows } from "../../styles/theme";
const { width } = Dimensions.get("window");
const getIconName = (routeName, isFocused) => {
  const icons = {
    home: isFocused ? "home" : "home-outline",
    explore: isFocused ? "recycle" : "recycle",
    cart: isFocused ? "shopping" : "shopping-outline",
    profile: isFocused ? "account" : "account-outline",
  };
  return icons[routeName] || "circle-outline";
};
export function TabBar({ state, descriptors, navigation }) {
  const { buildHref } = useLinkBuilder();
  const insets = useSafeAreaInsets();
  const { openVoiceModal } = useVoiceModal();
  const activeIndex = useSharedValue(state.index);
  const containerWidth = width - 40;
  const availableWidth = containerWidth - 32;
  const centerSpacerWidth = 90;
  const sideWidth = (availableWidth - centerSpacerWidth) / 2;
  const tabWidth = sideWidth / 2;
  const pulseScale = useSharedValue(1);
  React.useEffect(() => {
    activeIndex.value = withSpring(state.index, {
      damping: 15,
      stiffness: 150,
    });
  }, [state.index, activeIndex]);
  React.useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withSpring(1.05, { damping: 30, stiffness: 100 }),
        withSpring(1, { damping: 30, stiffness: 100 })
      ),
      -1,
      true
    );
  }, [pulseScale]);
  const handlePress = (index, route) => {
    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });
    if (state.index !== index && !event.defaultPrevented) {
      navigation.navigate(route.name, route.params);
    }
  };
  const handleLongPress = (route) => {
    navigation.emit({
      type: "tabLongPress",
      target: route.key,
    });
  };
  const handleMainActionPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    openVoiceModal();
  };
  const indicatorStyle = useAnimatedStyle(() => {
    const indicatorWidth = tabWidth * 0.8;
    const centerOffset = (tabWidth - indicatorWidth) / 2;
    const containerPadding = 16;
    const positions = [
      containerPadding + 0 * tabWidth + centerOffset,
      containerPadding + 1 * tabWidth + centerOffset,
      containerPadding + sideWidth + centerSpacerWidth + 0 * tabWidth + centerOffset, // Cart
      containerPadding + sideWidth + centerSpacerWidth + 1 * tabWidth + centerOffset, // Profile
    ];
    const targetPosition = positions[Math.round(activeIndex.value)] || positions[0];
    return {
      width: indicatorWidth,
      left: withSpring(targetPosition, {
        damping: 20,
        stiffness: 300,
      }),
    };
  });
  const mainButtonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: pulseScale.value }
      ],
    };
  });
  const leftRoutes = state.routes.slice(0, 2);
  const rightRoutes = state.routes.slice(2);
  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {}
      <TouchableOpacity
        style={styles.mainActionButtonContainer}
        onPress={handleMainActionPress}
        activeOpacity={1}
      >
        <Animated.View style={[styles.mainActionButton, mainButtonAnimatedStyle]}>
          <MaterialCommunityIcons
            name="microphone"
            size={28}
            color={colors.white}
          />
        </Animated.View>
      </TouchableOpacity>
        {}
        <BlurView intensity={90} tint="light" style={styles.blurContainer}>
          {}
          <View style={styles.notchIndicatorLeft} />
          <View style={styles.notchIndicatorRight} />
          <View style={styles.tabContainer}>
            <Animated.View style={[styles.indicator, indicatorStyle]} />
            <View style={styles.sideTabsContainer}>
              {leftRoutes.map((route, index) => {
                const { options } = descriptors[route.key];
                const label = options.tabBarLabel !== undefined ? options.tabBarLabel : options.title !== undefined ? options.title : route.name;
                const isFocused = state.index === index;
                return (
                  <TabBarItem
                    key={route.key}
                    route={route}
                    label={label}
                    isFocused={isFocused}
                    index={index}
                    onPress={() => handlePress(index, route)}
                    onLongPress={() => handleLongPress(route)}
                    buildHref={buildHref}
                    options={options}
                  />
                );
              })}
            </View>
            <View style={styles.centerSpacer} />
            <View style={styles.sideTabsContainer}>
              {rightRoutes.map((route, originalIndex) => {
                const index = originalIndex + 2;
                const { options } = descriptors[route.key];
                const label = options.tabBarLabel !== undefined ? options.tabBarLabel : options.title !== undefined ? options.title : route.name;
                const isFocused = state.index === index;
                return (
                  <TabBarItem
                    key={route.key}
                    route={route}
                    label={label}
                    isFocused={isFocused}
                    index={index}
                    onPress={() => handlePress(index, route)}
                    onLongPress={() => handleLongPress(route)}
                    buildHref={buildHref}
                    options={options}
                  />
                );
              })}
            </View>
          </View>
        </BlurView>
      </View>
    );
  }
function TabBarItem({ route, label, isFocused, index, onPress, onLongPress, buildHref, options }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(isFocused ? 1 : 0.6);
  React.useEffect(() => {
    scale.value = withSpring(isFocused ? 1.1 : 1, { damping: 15, stiffness: 200 });
    opacity.value = withTiming(isFocused ? 1 : 0.6, { duration: 200 });
  }, [isFocused, scale, opacity]);
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });
  const iconColor = isFocused ? colors.primary : colors.neutral;
  const textColor = isFocused ? colors.primary : colors.neutral;
  return (
    <TouchableWithoutFeedback onPress={onPress} onLongPress={onLongPress}>
      <Animated.View style={[styles.tabItem, animatedStyle]}>
        <Animated.View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name={getIconName(route.name, isFocused)}
            size={24}
            color={iconColor}
          />
        </Animated.View>
        <Animated.Text style={[styles.tabLabel, { color: textColor }]}>
          {label}
        </Animated.Text>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}
const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    height: 100,
    backgroundColor: 'transparent',
  },
  blurContainer: {
    flex: 1,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    ...shadows.large,
    position: 'relative',
  },
  notchIndicatorLeft: {
    position: 'absolute',
    top: -8,
    left: '50%',
    marginLeft: -45,
    width: 20,
    height: 20,
    backgroundColor: 'transparent',
    borderBottomRightRadius: 20,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: colors.primary + "20",
    zIndex: 1,
  },
  notchIndicatorRight: {
    position: 'absolute',
    top: -8,
    left: '50%',
    marginLeft: 25,
    width: 20,
    height: 20,
    backgroundColor: 'transparent',
    borderBottomLeftRadius: 20,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: colors.primary + "20",
    zIndex: 1,
  },
  tabContainer: {
    flexDirection: "row",
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    height: '100%',
    zIndex: 2,
  },
  sideTabsContainer: {
    flexDirection: "row",
    flex: 1,
  },
  indicator: {
    position: "absolute",
    top: 12,
    bottom: 12,
    backgroundColor: colors.primary + "15",
    borderRadius: 20,
    zIndex: 0,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 1,
  },
  iconContainer: {
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  mainActionButtonContainer: {
    position: 'absolute',
    top: -20,
    left: '50%',
    marginLeft: -32,
    zIndex: 30,
  },
  mainActionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.large,
    borderWidth: 5,
    borderColor: colors.white,
  },
  centerSpacer: {
    width: 90,
  },
});