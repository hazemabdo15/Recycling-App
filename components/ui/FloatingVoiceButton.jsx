import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVoiceModal } from '../../hooks/useVoiceModal';
import { colors, shadows, spacing } from '../../styles/theme';
const FloatingVoiceButton = ({ style }) => {
  const insets = useSafeAreaInsets();
  const { openVoiceModal } = useVoiceModal();
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scale.value = withSpring(0.9, { damping: 15, stiffness: 400 }, () => {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    });
    rotation.value = withTiming(360, { duration: 300 }, () => {
      rotation.value = 0;
    });
    openVoiceModal();
  };
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));
  const gradientStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scale.value, [0.9, 1], [0.8, 1]),
  }));
  return (
    <Animated.View
      style={[
        styles.container,
        {
          bottom: insets.bottom + spacing.xl,
          right: spacing.xl,
        },
        style,
        animatedStyle,
      ]}
    >
      <TouchableOpacity
        style={styles.button}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Animated.View style={[styles.gradient, gradientStyle]} />
        <MaterialCommunityIcons
          name="microphone"
          size={28}
          color={colors.white}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1000,
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.large,
    elevation: 8,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
    backgroundColor: `${colors.primary}20`,
  },
});
export default FloatingVoiceButton;