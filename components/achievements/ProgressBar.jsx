import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

const ProgressBar = ({ progress, colors = ['#10B981', '#34D399'], height = 8 }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: progress,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [progress, animatedValue]);

  const widthInterpolated = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.container, { height }]}>
      <View style={[styles.background, { borderRadius: height / 2 }]} />
      <Animated.View
        style={[
          styles.progressContainer,
          {
            width: widthInterpolated,
            borderRadius: height / 2,
          },
        ]}
      >
        <LinearGradient
          colors={colors}
          style={[styles.progress, { borderRadius: height / 2 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    justifyContent: 'center',
  },
  background: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E7EB',
  },
  progressContainer: {
    height: '100%',
    overflow: 'hidden',
  },
  progress: {
    width: '100%',
    height: '100%',
  },
});

export default ProgressBar;
