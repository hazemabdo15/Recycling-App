import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

const SplashDebug = ({ message = "Debug Splash Screen Visible" }) => {
  console.log('🚨 [DEBUG-SPLASH] Rendering debug splash screen:', message);
  
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0E9F6E', '#8BC34A', '#FFC107']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <MaterialCommunityIcons
            name="recycle"
            size={100}
            color="white"
            style={styles.icon}
          />
          <Text style={styles.title}>RecycleApp</Text>
          <Text style={styles.debug}>DEBUG MODE</Text>
          <Text style={styles.message}>{message}</Text>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99999,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  debug: {
    fontSize: 16,
    color: 'yellow',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  message: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default SplashDebug;
