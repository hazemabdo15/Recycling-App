import { useEffect, useRef } from 'react';
import { Pressable, View } from 'react-native';
import { ANIMATION_CONFIG } from '../../utils/animations';

let Animated, useSharedValue, useAnimatedStyle, withTiming, withSpring, isReanimatedAvailable;

try {
  const reanimated = require('react-native-reanimated');
  Animated = reanimated.default;
  useSharedValue = reanimated.useSharedValue;
  useAnimatedStyle = reanimated.useAnimatedStyle;
  withTiming = reanimated.withTiming;
  withSpring = reanimated.withSpring;
  isReanimatedAvailable = true;
} catch (_error) {
  console.warn('React Native Reanimated not available, using fallback components');
  isReanimatedAvailable = false;

  Animated = { 
    View: View,
    createAnimatedComponent: (Component) => Component 
  };

  useSharedValue = (value) => {
    const ref = useRef({ value });
    return ref.current;
  };
  
  useAnimatedStyle = (callback) => {
    try {
      return callback ? callback() : {};
    } catch {
      return {};
    }
  };
  
  withTiming = (value) => value;
  withSpring = (value) => value;
}

const AnimatedPressable = Animated.createAnimatedComponent ? 
  Animated.createAnimatedComponent(Pressable) : 
  Pressable;

export const AnimatedCard = ({ 
  children, 
  onPress, 
  onLongPress,
  style,
  delay = 0,
  disabled = false,
  pressScale = ANIMATION_CONFIG.cardPress.scale.pressed,
  ...props 
}) => {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const pressedScale = useSharedValue(1);

  useEffect(() => {
    if (!isReanimatedAvailable) return;
    
    const timer = setTimeout(() => {
      scale.value = withSpring(1, ANIMATION_CONFIG.cardPress.timing);
      opacity.value = withTiming(1, { duration: ANIMATION_CONFIG.fade.duration });
      translateY.value = withSpring(0, ANIMATION_CONFIG.slide);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, scale, opacity, translateY]);

  const handlePressIn = () => {
    if (!disabled && isReanimatedAvailable) {
      pressedScale.value = withSpring(pressScale, ANIMATION_CONFIG.button.timing);
    }
  };

  const handlePressOut = () => {
    if (!disabled) {
      pressedScale.value = withSpring(1, ANIMATION_CONFIG.button.timing);
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    if (!isReanimatedAvailable) return {};
    
    return {
      transform: [
        { scale: scale.value * pressedScale.value },
        { translateY: translateY.value }
      ],
      opacity: opacity.value,
    };
  });

  return (
    <AnimatedPressable
      style={[animatedStyle, style]}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      {...props}
    >
      {children}
    </AnimatedPressable>
  );
};

export const AnimatedButton = ({ 
  children, 
  onPress, 
  style,
  disabled = false,
  ...props 
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(disabled ? 0.6 : 1);

  useEffect(() => {
    if (!isReanimatedAvailable) return;
    opacity.value = withTiming(disabled ? 0.6 : 1, { duration: 200 });
  }, [disabled, opacity]);

  const handlePressIn = () => {
    if (!disabled && isReanimatedAvailable) {
      scale.value = withSpring(ANIMATION_CONFIG.button.scale.pressed, ANIMATION_CONFIG.button.timing);
    }
  };

  const handlePressOut = () => {
    if (!disabled && isReanimatedAvailable) {
      scale.value = withSpring(ANIMATION_CONFIG.button.scale.normal, ANIMATION_CONFIG.button.timing);
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    if (!isReanimatedAvailable) return {};
    
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  return (
    <AnimatedPressable
      style={[animatedStyle, style]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      {...props}
    >
      {children}
    </AnimatedPressable>
  );
};

export const AnimatedListItem = ({
  children,
  style,
  onPress,
  ...props
}) => {
  if (onPress) {
    return (
      <Pressable style={style} onPress={onPress} {...props}>
        {children}
      </Pressable>
    );
  }
  return (
    <View style={style} {...props}>
      {children}
    </View>
  );
};

export const FadeInView = ({ 
  children, 
  delay = 0, 
  duration = ANIMATION_CONFIG.fade.duration,
  style,
  ...props 
}) => {
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!isReanimatedAvailable) return;
    
    const timer = setTimeout(() => {
      opacity.value = withTiming(1, { duration });
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, duration, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    if (!isReanimatedAvailable) return {};
    
    return {
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View style={[animatedStyle, style]} {...props}>
      {children}
    </Animated.View>
  );
};
