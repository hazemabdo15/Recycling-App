import LottieView from 'lottie-react-native';
import { Dimensions, StyleSheet, View } from 'react-native';
import { useThemedStyles } from '../../hooks/useThemedStyles';

const { width } = Dimensions.get('window');

const Loader = ({ style, loop = true, ...props }) => {
  const { colors } = useThemedStyles();
  const styles = getStyles(colors);
  
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

const getStyles = (colors) => StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    backgroundColor: colors.background,
  },
  lottie: {
    width: width * 0.4,
    height: width * 0.4,
  },
});

export default Loader;
