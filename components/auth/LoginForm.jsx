import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../styles/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const scaleSize = (size) => (SCREEN_WIDTH / 375) * size;

export default function LoginForm({ onSubmit, loading }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (loading) return;
    console.log('Login button pressed', email, password);
    await onSubmit({ email, password });
  };

  const handleSkip = () => {
    router.push('/home');
  };

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      enableOnAndroid
      extraScrollHeight={20}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Top decorative section */}
        <View style={[styles.topSection, { paddingTop: insets.top + scaleSize(40) }]}> 
          <View style={styles.logoContainer}>
            <MaterialCommunityIcons name="recycle" size={scaleSize(60)} color={colors.white} />
          </View>
          <Text style={styles.title}>Welcome Back!</Text>
          <Text style={styles.subtitle}>Sign in to continue your eco journey</Text>
        </View>

        {/* Main form card */}
        <View style={styles.formCard}>
          <View style={styles.formContent}>
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={scaleSize(20)} color={colors.neutral} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email address"
                  placeholderTextColor={colors.neutral}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={scaleSize(20)} color={colors.neutral} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={colors.neutral}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={scaleSize(20)} color={colors.neutral} />
                </Pressable>
              </View>
            </View>

            <Pressable
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
            >
              <LinearGradient
                colors={loading ? [colors.neutral, colors.neutral] : [colors.primary, colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginButtonGradient}
              >
                {loading && <View style={styles.loadingSpinner} />}
                <Text style={styles.loginText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
              </LinearGradient>
            </Pressable>

            <View style={styles.linksContainer}>
              <Pressable onPress={() => router.push('/register')}>
                <Text style={styles.linkText}>
                  Don&apos;t have an account? <Text style={styles.linkTextBold}>Sign Up</Text>
                </Text>
              </Pressable>

              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.divider} />
              </View>

              <Pressable onPress={handleSkip} style={styles.skipButton}>
                <Text style={styles.skipText}>Continue as Guest</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.base100,
  },
  topSection: {
    flex: 0.4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scaleSize(20),
  },
  logoContainer: {
    width: scaleSize(100),
    height: scaleSize(100),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: scaleSize(50),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scaleSize(20),
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: scaleSize(4) },
    shadowOpacity: 0.3,
    shadowRadius: scaleSize(8),
    elevation: 50,
  },
  title: {
    fontSize: scaleSize(28),
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
    marginBottom: scaleSize(8),
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: scaleSize(16),
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: scaleSize(22),
  },
  formCard: {
    flex: 0.6,
    backgroundColor: colors.white,
    borderTopLeftRadius: scaleSize(30),
    borderTopRightRadius: scaleSize(30),
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -scaleSize(4) },
    shadowOpacity: 0.1,
    shadowRadius: scaleSize(12),
    elevation: 12,
  },
  formContent: {
    flex: 1,
    paddingHorizontal: scaleSize(24),
    paddingTop: scaleSize(32),
    paddingBottom: scaleSize(20),
  },
  inputContainer: {
    marginBottom: scaleSize(24),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.base50,
    borderRadius: scaleSize(16),
    marginBottom: scaleSize(16),
    paddingHorizontal: scaleSize(16),
    paddingVertical: scaleSize(4),
    borderWidth: 1,
    borderColor: colors.base200,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: scaleSize(2) },
    shadowOpacity: 0.05,
    shadowRadius: scaleSize(4),
    elevation: 2,
  },
  inputIcon: {
    marginRight: scaleSize(12),
  },
  input: {
    flex: 1,
    fontSize: scaleSize(16),
    color: colors.black,
    paddingVertical: scaleSize(16),
  },
  eyeIcon: {
    padding: scaleSize(8),
  },
  loginButton: {
    borderRadius: scaleSize(16),
    marginBottom: scaleSize(24),
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: scaleSize(4) },
    shadowOpacity: 0.3,
    shadowRadius: scaleSize(8),
    elevation: 8,
  },
  loginButtonDisabled: {
    shadowOpacity: 0.1,
    elevation: 2,
  },
  loginButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scaleSize(18),
    borderRadius: scaleSize(16),
  },
  loadingSpinner: {
    width: scaleSize(20),
    height: scaleSize(20),
    borderRadius: scaleSize(10),
    borderWidth: 2,
    borderColor: colors.white,
    borderTopColor: 'transparent',
    marginRight: scaleSize(8),
  },
  loginText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: scaleSize(16),
    letterSpacing: 0.5,
  },
  linksContainer: {
    flex: 1,
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  linkText: {
    fontSize: scaleSize(14),
    color: colors.neutral,
    textAlign: 'center',
  },
  linkTextBold: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: scaleSize(16),
    width: '100%',
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.base200,
  },
  dividerText: {
    marginHorizontal: scaleSize(16),
    fontSize: scaleSize(14),
    color: colors.neutral,
  },
  skipButton: {
    paddingVertical: scaleSize(12),
    paddingHorizontal: scaleSize(24),
    borderRadius: scaleSize(12),
    borderWidth: 1,
    borderColor: colors.base200,
    backgroundColor: colors.base50,
  },
  skipText: {
    color: colors.neutral,
    fontSize: scaleSize(14),
    fontWeight: '500',
  },
});
