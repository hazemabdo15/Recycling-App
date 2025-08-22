import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Easing,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { colors, typography } from '../../styles/theme';

const SplashScreen = ({ progress = 0, statusText = "Initializing..." }) => {

  const window = Dimensions.get('window');
  const leafY = useRef(new Animated.Value(-80)).current;
  const leafProgress = useRef(new Animated.Value(0)).current;
  const leafOpacity = useRef(new Animated.Value(1)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const delayAnim = useRef(new Animated.Value(0)).current;

  const textSectionHeight = 80;
  const leafFinalY = window.height / 2 - textSectionHeight - 48;
  const centerX = window.width / 2;

  useEffect(() => {

    leafY.setValue(-80);
    leafProgress.setValue(0);
    leafOpacity.setValue(1);
    textOpacity.setValue(0);
    leafOpacity.setValue(1);
    delayAnim.setValue(0);
    Animated.sequence([
      Animated.parallel([
        Animated.timing(leafY, {
          toValue: leafFinalY,
          duration: 6000,
          easing: Easing.bezier(0.3, 0.7, 0.4, 1),
          useNativeDriver: true,
        }),
        Animated.timing(leafProgress, {
          toValue: 1,
          duration: 6000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(delayAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(leafOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 700,
        useNativeDriver: false,
      }),
    ]).start();
  }, [delayAnim, leafFinalY, leafOpacity, leafProgress, leafY, textOpacity]);

  const keyframes = 21;
  const inputRange = Array.from({ length: keyframes }, (_, i) => i / (keyframes - 1));

  const maxAmp = window.width * 0.14;
  const swing = inputRange.map(t => Math.sin(t * Math.PI * 3) * maxAmp * (1 - t * 0.7));
  const rot = inputRange.map(t => `${Math.sin(t * Math.PI * 3) * 22 * (1 - t * 0.7)}deg`);
  const leafX = leafProgress.interpolate({
    inputRange,
    outputRange: swing,
  });
  const leafRotate = leafProgress.interpolate({
    inputRange,
    outputRange: rot,
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={[colors.primary, colors.neutral]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Animated.View
          style={[
            styles.leafContainer,
            {
              top: 0,
              left: centerX - 32,
              opacity: leafOpacity,
              position: 'absolute',
              transform: [
                { translateY: leafY },
                { translateX: leafX },
                { rotate: leafRotate },
              ]
            }
          ]}
        >
          <MaterialCommunityIcons name="leaf" size={64} color="#fff" />
        </Animated.View>

        <Animated.View
          style={[
            styles.textSection,
            {
              opacity: 1,
              top: leafFinalY + 64 + 12,
              left: 0,
              right: 0,
              position: 'absolute',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
            },
          ]}
        >
          <Text style={styles.title}>Karakeeb</Text>
          <Text style={styles.subtitle}>Sustainable Living Made Simple</Text>
        </Animated.View>

        <View style={styles.statusSection}>
          <Text style={styles.statusText}>{statusText}</Text>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    position: 'relative',
  },
  leafContainer: {
    position: 'absolute',
    width: 64,
    height: 64,
    zIndex: 2,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    zIndex: 1,
  },
  textSection: {
    alignItems: 'center',
    justifyContent: 'center',

  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: typography.fontFamily || 'System',
    letterSpacing: 1.2,
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.92)',
    textAlign: 'center',
    fontFamily: typography.fontFamily || 'System',
    letterSpacing: 0.7,
    textShadowColor: 'rgba(0,0,0,0.10)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  statusSection: {
    alignItems: 'center',
    width: '100%',
    position: 'absolute',
    bottom: 120,
  },
  statusText: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.95)',
    marginBottom: 30,
    textAlign: 'center',
    fontFamily: typography.fontFamily,
    letterSpacing: 0.5,
    fontWeight: '500',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.white,
    marginHorizontal: 6,
    shadowColor: colors.white,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default SplashScreen;
