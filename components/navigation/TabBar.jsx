import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLinkBuilder } from "@react-navigation/native";
import { BlurView } from "expo-blur";
import * as Haptics from 'expo-haptics';
import React from "react";
import { Dimensions, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../hooks/useCart";
import { useVoiceModal } from "../../hooks/useVoiceModal";
import { colors, shadows } from "../../styles/theme";
import { getLabel } from "../../utils/roleLabels";
import { scaleSize } from '../../utils/scale';

let Animated, useSharedValue, useAnimatedStyle, withTiming, withSpring, withRepeat, withSequence;

try {
  const reanimated = require('react-native-reanimated');
  Animated = reanimated.default;
  useSharedValue = reanimated.useSharedValue;
  useAnimatedStyle = reanimated.useAnimatedStyle;
  withTiming = reanimated.withTiming;
  withSpring = reanimated.withSpring;
  withRepeat = reanimated.withRepeat;
  withSequence = reanimated.withSequence;
} catch (_error) {

  Animated = { 
    View: View,
    createAnimatedComponent: (Component) => Component 
  };
  useSharedValue = (value) => ({ value });
  useAnimatedStyle = () => ({});
  withTiming = (value) => value;
  withSpring = (value) => value;
  withRepeat = (value) => value;
  withSequence = (...values) => values[0];
}

const { width } = Dimensions.get("window");

const getIconName = (routeName, isFocused, userRole = 'customer') => {

  const customerIcons = {
    home: isFocused ? "home" : "home-outline",
    explore: isFocused ? "magnify" : "magnify",
    cart: isFocused ? "truck-delivery" : "truck-delivery-outline",
    profile: isFocused ? "account" : "account-outline",
  };
  
  const buyerIcons = {
    home: isFocused ? "home" : "home-outline",
    explore: isFocused ? "store" : "store-outline",
    cart: isFocused ? "cart" : "cart-outline",
    profile: isFocused ? "account" : "account-outline",
  };
  
  const icons = userRole === 'buyer' ? buyerIcons : customerIcons;
  return icons[routeName] || "circle-outline";
};
export function TabBar({ state, descriptors, navigation }) {
  const { buildHref } = useLinkBuilder();
  const insets = useSafeAreaInsets();
  const { openVoiceModal } = useVoiceModal();
  const { user } = useAuth();
  const { cartItems } = useCart(user);

  const getTabLabel = (routeName) => {
    return getLabel(`tabLabels.${routeName}`, user?.role) || routeName;
  };

  const cartItemsCount = cartItems ? Object.keys(cartItems).filter(key => {
    const quantity = cartItems[key];
    return typeof quantity === 'number' && quantity > 0;
  }).length : 0;
  
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
      containerPadding + sideWidth + centerSpacerWidth + 0 * tabWidth + centerOffset,
      containerPadding + sideWidth + centerSpacerWidth + 1 * tabWidth + centerOffset,
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
  // Only show voice button on these tabs
  const allowedTabs = ['home', 'explore', 'cart', 'profile'];
  const currentRoute = state.routes[state.index]?.name;
  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}> 
      {allowedTabs.includes(currentRoute) && (
        <View pointerEvents="box-none" style={styles.voiceButtonWrapper}>
          <TouchableOpacity
            style={styles.mainActionButtonContainer}
            onPress={handleMainActionPress}
            activeOpacity={1}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Voice input"
            accessibilityHint="Open voice recording to add recycling items"
          >
            <Animated.View style={[styles.mainActionButton, mainButtonAnimatedStyle]}>
              <MaterialCommunityIcons
                name="microphone"
                size={28}
                color={colors.white}
              />
            </Animated.View>
          </TouchableOpacity>
        </View>
      )}
      <BlurView intensity={90} tint="light" style={styles.blurContainer}>
          {/* ...existing code... */}
          <View style={styles.notchIndicatorLeft} />
          <View style={styles.notchIndicatorRight} />
          <View style={styles.tabContainer}>
            <Animated.View style={[styles.indicator, indicatorStyle]} />
            <View style={styles.sideTabsContainer}>
              {leftRoutes.map((route, index) => {
                const { options } = descriptors[route.key];
                const label = getTabLabel(route.name);
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
                    badgeCount={route.name === 'cart' ? cartItemsCount : 0}
                    userRole={user?.role}
                  />
                );
              })}
            </View>
            <View style={styles.centerSpacer} />
            <View style={styles.sideTabsContainer}>
              {rightRoutes.map((route, originalIndex) => {
                const index = originalIndex + 2;
                const { options } = descriptors[route.key];
                const label = getTabLabel(route.name);
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
                    badgeCount={route.name === 'cart' ? cartItemsCount : 0}
                    userRole={user?.role}
                  />
                );
              })}
            </View>
          </View>
        </BlurView>
    </View>
  );
}
function TabBarItem({ route, label, isFocused, index, onPress, onLongPress, buildHref, options, badgeCount = 0, userRole = 'customer' }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(isFocused ? 1 : 0.6);
  const badgeScale = useSharedValue(1);
  
  React.useEffect(() => {
    scale.value = withSpring(isFocused ? 1.1 : 1, { damping: 20, stiffness: 300 });
    opacity.value = withTiming(isFocused ? 1 : 0.6, { duration: 150 });
  }, [isFocused, scale, opacity]);

  React.useEffect(() => {
    if (badgeCount > 0) {
      badgeScale.value = withSequence(
        withSpring(1.3, { damping: 15, stiffness: 300 }),
        withSpring(1, { damping: 15, stiffness: 300 })
      );
    }
  }, [badgeCount, badgeScale]);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const badgeAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: badgeScale.value }],
    };
  });
  
  const iconColor = isFocused ? colors.primary : colors.neutral;
  const textColor = isFocused ? colors.primary : colors.neutral;
  
  return (
    <TouchableWithoutFeedback 
      onPress={onPress} 
      onLongPress={onLongPress}
      accessible={true}
      accessibilityRole="tab"
      accessibilityLabel={`${label} tab`}
      accessibilityState={{ selected: isFocused }}
      accessibilityHint={`Navigate to ${label} screen`}
    >
      <Animated.View style={[styles.tabItem, animatedStyle]}>
        <Animated.View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name={getIconName(route.name, isFocused, userRole)}
            size={24}
            color={iconColor}
          />
          {badgeCount > 0 && (
            <Animated.View style={[styles.badge, badgeAnimatedStyle]}>
              <Text style={styles.badgeText}>
                {badgeCount > 99 ? '99+' : badgeCount}
              </Text>
            </Animated.View>
          )}
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
    bottom: scaleSize(5),
    left: scaleSize(20),
    right: scaleSize(20),
    height: scaleSize(90),
    backgroundColor: 'transparent',
  },
  blurContainer: {
    flex: 1,
    borderRadius: scaleSize(28),
    overflow: "hidden",
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    ...shadows.large,
    position: 'relative',
  },
  notchIndicatorLeft: {
    position: 'absolute',
    top: scaleSize(-8),
    left: '50%',
    marginLeft: scaleSize(-45),
    width: scaleSize(20),
    height: scaleSize(20),
    backgroundColor: 'transparent',
    borderBottomRightRadius: scaleSize(20),
    borderBottomWidth: scaleSize(3),
    borderRightWidth: scaleSize(3),
    borderColor: colors.primary + "20",
    zIndex: 1,
  },
  notchIndicatorRight: {
    position: 'absolute',
    top: scaleSize(-8),
    left: '50%',
    marginLeft: scaleSize(25),
    width: scaleSize(20),
    height: scaleSize(20),
    backgroundColor: 'transparent',
    borderBottomLeftRadius: scaleSize(20),
    borderBottomWidth: scaleSize(3),
    borderLeftWidth: scaleSize(3),
    borderColor: colors.primary + "20",
    zIndex: 1,
  },
  tabContainer: {
    flexDirection: "row",
    paddingVertical: scaleSize(10),
    paddingHorizontal: scaleSize(10),
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
    top: scaleSize(12),
    bottom: scaleSize(12),
    backgroundColor: 'transparent',
    borderRadius: scaleSize(20),
    zIndex: 0,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scaleSize(6),
    borderRadius: scaleSize(20),
    zIndex: 1,
  },
  iconContainer: {
    marginBottom: scaleSize(4),
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: scaleSize(-8),
    right: scaleSize(-8),
    backgroundColor: colors.primary,
    borderRadius: scaleSize(10),
    minWidth: scaleSize(20),
    height: scaleSize(20),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: scaleSize(2),
    borderColor: colors.white,
  },
  badgeText: {
    color: colors.white,
    fontSize: scaleSize(11),
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tabLabel: {
    fontSize: scaleSize(12),
    fontWeight: "600",
    textAlign: "center",
  },
  voiceButtonWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
    pointerEvents: 'box-none',
  },
  mainActionButtonContainer: {
    position: 'absolute',
    top: scaleSize(-20),
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 31,
    width: scaleSize(56),
    height: scaleSize(56),
  },
  mainActionButton: {
    width: scaleSize(56),
    height: scaleSize(56),
    borderRadius: scaleSize(28),
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.large,
    borderWidth: scaleSize(4),
    borderColor: colors.white,
  },
  centerSpacer: {
    width: scaleSize(70),
  },
});