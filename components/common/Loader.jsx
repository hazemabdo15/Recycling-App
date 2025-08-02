import LottieView from 'lottie-react-native';
import { Dimensions, StyleSheet, View } from 'react-native';

const { width } = Dimensions.get('window');

const Loader = ({ style, loop = true, ...props }) => {
  return (
    <View style={[styles.container, style]}>
      <LottieView
        source={require('../../assets/animations/Recycle.json')}
        autoPlay
        loop={loop}
        style={styles.lottie}
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  lottie: {
    width: width * 0.4,
    height: width * 0.4,
  },
});

export default Loader;
