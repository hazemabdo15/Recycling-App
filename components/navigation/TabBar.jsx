import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLinkBuilder } from "@react-navigation/native";
import { BlurView } from "expo-blur";
import React from "react";
import { Dimensions, StyleSheet, TouchableWithoutFeedback, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const getIconName = (routeName, isFocused) => {
  const icons = {
    index: isFocused ? "home" : "home-outline",
    explore: isFocused ? "recycle" : "recycle", 
    profile: isFocused ? "account" : "account-outline",
  };
  return icons[routeName] || "circle-outline";
};

const colors = {
  primary: "#0E9F6E",
  secondary: "#8BC34A", 
  accent: "#FFC107",
  neutral: "#607D8B",
  base100: "#E8F5E9",
  base300: "#E0E0E0",
  white: "#ffffff",
  black: "#171717",
};


const borderRadius = {
  xs: 6,    
  sm: 12,   
  md: 18,   
  lg: 24,   
  xl: 32,   
};

export function TabBar({ state, descriptors, navigation }) {
  const { buildHref } = useLinkBuilder();
  const insets = useSafeAreaInsets();
  
  const activeIndex = useSharedValue(state.index);
  const tabWidth = (width - 40) / state.routes.length;

  React.useEffect(() => {
    activeIndex.value = withSpring(state.index, {
      damping: 15,
      stiffness: 150,
    });
  }, [state.index, activeIndex]);

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

  const indicatorStyle = useAnimatedStyle(() => {
    const indicatorWidth = tabWidth * 0.7;
    const centerOffset = (tabWidth - indicatorWidth) / 2;
    
    return {
      width: indicatorWidth,
      left: withSpring(activeIndex.value * tabWidth + centerOffset, {
        damping: 15,
        stiffness: 150,
      }),
      transform: []
    };
  });

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom, backgroundColor: 'transparent' }]}>
      <BlurView intensity={80} tint="light" style={styles.blurContainer}>
        <View style={styles.tabContainer}>
          <Animated.View style={[
            styles.indicator,
            indicatorStyle
          ]} />
          
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label =
              options.tabBarLabel !== undefined
                ? options.tabBarLabel
                : options.title !== undefined
                ? options.title
                : route.name;

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
      </BlurView>
    </View>
  );
}

function TabBarItem({ route, label, isFocused, index, onPress, onLongPress, buildHref, options }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(isFocused ? 1 : 0.6);

  React.useEffect(() => {
    scale.value = withSpring(isFocused ? 1.1 : 1, {
      damping: 15,
      stiffness: 200,
    });
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
    <TouchableWithoutFeedback
      onPress={onPress}
      onLongPress={onLongPress}
    >
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
    borderRadius: borderRadius.xl,
    overflow: "hidden",
    backgroundColor: 'transparent',
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  blurContainer: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.base300 + "60", 
    overflow: "hidden",
    backgroundColor: 'rgba(255, 255, 255, 0.7)', 
    borderBottomWidth: 2,
    borderBottomColor: colors.base300 + "80",
  },
  tabContainer: {
    flexDirection: "row",
    paddingVertical: 16,
    paddingHorizontal: 0,
    position: "relative",
    backgroundColor: 'transparent',
  },
  indicator: {
    position: "absolute",
    top: 12,
    bottom: 12,
    backgroundColor: colors.primary + "20",
    borderRadius: borderRadius.md,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    zIndex: 1,
    backgroundColor: 'transparent',
  },
  iconContainer: {
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
});
