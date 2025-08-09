import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../styles/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scaleSize = (size) => (SCREEN_WIDTH / 375) * size;

const RegisterForm = ({ onSubmit, loading }) => {
    const [name, setName] = useState('');
    const [number, setNumber] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [confirmShowPassword, setConfirmShowPassword] = useState(false);
    const [role, setRole] = useState('customer');
    const router = useRouter();
    const insets = useSafeAreaInsets();

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[colors.primary, colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />

            {/* Header Section */}
            <View style={[styles.headerSection, { paddingTop: insets.top + scaleSize(20) }]}>
                <View style={styles.logoContainer}>
                    <MaterialCommunityIcons name="account-plus" size={scaleSize(50)} color={colors.white} />
                </View>
                <Text style={styles.title}>Join EcoRecycle</Text>
                <Text style={styles.subtitle}>Create your account to start your eco journey</Text>
            </View>

            {/* Form Card */}
            <KeyboardAwareScrollView
                style={styles.formCard}
                contentContainerStyle={{ flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
                bounces={false}
                enableOnAndroid
                extraScrollHeight={20}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.formContent}>
                    {/* Name Input */}
                    <View style={styles.inputWrapper}>
                        <Ionicons name="person-outline" size={scaleSize(20)} color={colors.neutral} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Full Name"
                            placeholderTextColor={colors.neutral}
                            value={name}
                            onChangeText={setName}
                        />
                    </View>

                    {/* Phone Input */}
                    <View style={styles.inputWrapper}>
                        <Ionicons name="call-outline" size={scaleSize(20)} color={colors.neutral} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Mobile Number (01xxxxxxxxx)"
                            placeholderTextColor={colors.neutral}
                            value={number}
                            keyboardType="phone-pad"
                            onChangeText={setNumber}
                        />
                    </View>

                    {/* Email Input */}
                    <View style={styles.inputWrapper}>
                        <Ionicons name="mail-outline" size={scaleSize(20)} color={colors.neutral} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Email address"
                            placeholderTextColor={colors.neutral}
                            value={email}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            onChangeText={setEmail}
                        />
                    </View>

                    {/* Password Input */}
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

                    {/* Confirm Password Input */}
                    <View style={styles.inputWrapper}>
                        <Ionicons name="lock-closed-outline" size={scaleSize(20)} color={colors.neutral} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Confirm Password"
                            placeholderTextColor={colors.neutral}
                            secureTextEntry={!confirmShowPassword}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                        />
                        <Pressable
                            onPress={() => setConfirmShowPassword(!confirmShowPassword)}
                            style={styles.eyeIcon}
                            accessibilityLabel={confirmShowPassword ? 'Hide password' : 'Show password'}
                        >
                            <Ionicons name={confirmShowPassword ? 'eye-off' : 'eye'} size={scaleSize(20)} color={colors.neutral} />
                        </Pressable>
                    </View>

                    {/* Role Selection */}
                    <View style={styles.roleSection}>
                        <Text style={styles.roleLabel}>I am registering as:</Text>
                        <View style={styles.roleContainer}>
                            <Pressable
                                style={[styles.roleOption, role === 'customer' && styles.roleOptionActive]}
                                onPress={() => setRole('customer')}
                            >
                                <MaterialCommunityIcons
                                    name="account"
                                    size={scaleSize(24)}
                                    color={role === 'customer' ? colors.white : colors.primary}
                                />
                                <Text style={[styles.roleText, role === 'customer' && styles.roleTextActive]}>
                                    Customer
                                </Text>
                                <Text style={[styles.roleSubtext, role === 'customer' && styles.roleSubtextActive]}>
                                    Sell recyclables
                                </Text>
                            </Pressable>

                            <Pressable
                                style={[styles.roleOption, role === 'buyer' && styles.roleOptionActive]}
                                onPress={() => setRole('buyer')}
                            >
                                <MaterialCommunityIcons
                                    name="domain"
                                    size={scaleSize(24)}
                                    color={role === 'buyer' ? colors.white : colors.primary}
                                />
                                <Text style={[styles.roleText, role === 'buyer' && styles.roleTextActive]}>
                                    Buyer
                                </Text>
                                <Text style={[styles.roleSubtext, role === 'buyer' && styles.roleSubtextActive]}>
                                    Buy recyclables
                                </Text>
                            </Pressable>

                            <Pressable
                                style={[styles.roleOption, role === 'delivery' && styles.roleOptionActive]}
                                onPress={() => setRole('delivery')}
                            >
                                <MaterialCommunityIcons
                                    name="truck-delivery"
                                    size={scaleSize(24)}
                                    color={role === 'delivery' ? colors.white : colors.primary}
                                />
                                <Text style={[styles.roleText, role === 'delivery' && styles.roleTextActive]}>
                                    Delivery
                                </Text>
                                <Text style={[styles.roleSubtext, role === 'delivery' && styles.roleSubtextActive]}>
                                    Pickup & deliver
                                </Text>
                            </Pressable>
                        </View>
                    </View>

                    {/* Register Button */}
                    <Pressable
                        disabled={loading}
                        onPress={() => onSubmit({ name, number, email, password, confirmPassword, role })}
                        style={[styles.registerButton, loading && styles.registerButtonDisabled]}
                        android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
                    >
                        <LinearGradient
                            colors={loading ? [colors.neutral, colors.neutral] : [colors.primary, colors.secondary]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.registerButtonGradient}
                        >
                            {loading && <View style={styles.loadingSpinner} />}
                            <Text style={styles.registerText}>
                                {loading ? "Creating Account..." : "Create Account"}
                            </Text>
                        </LinearGradient>
                    </Pressable>

                    {/* Login Link */}
                    <Pressable onPress={() => router.push('/login')} style={styles.loginLinkContainer}>
                        <Text style={styles.loginLinkText}>
                            Already have an account? <Text style={styles.loginLinkBold}>Sign In</Text>
                        </Text>
                    </Pressable>
                </View>
            </KeyboardAwareScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.base100,
    },
    headerSection: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: scaleSize(20),
        paddingBottom: scaleSize(20),
        minHeight: scaleSize(200),
    },
    logoContainer: {
        width: scaleSize(80),
        height: scaleSize(80),
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: scaleSize(40),
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: scaleSize(16),
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: scaleSize(4) },
        shadowOpacity: 0.3,
        shadowRadius: scaleSize(8),
        elevation: 50,
    },
    title: {
        fontSize: scaleSize(26),
        fontWeight: 'bold',
        color: colors.white,
        textAlign: 'center',
        marginBottom: scaleSize(8),
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    subtitle: {
        fontSize: scaleSize(15),
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
        lineHeight: scaleSize(20),
    },
    formCard: {
        flex: 1,
        backgroundColor: colors.white,
        borderTopLeftRadius: scaleSize(25),
        borderTopRightRadius: scaleSize(25),
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: -scaleSize(4) },
        shadowOpacity: 0.1,
        shadowRadius: scaleSize(12),
        elevation: 12,
    },
    formContent: {
        paddingHorizontal: scaleSize(24),
        paddingTop: scaleSize(24),
        paddingBottom: scaleSize(40),
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.base50,
        borderRadius: scaleSize(14),
        marginBottom: scaleSize(14),
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
        fontSize: scaleSize(15),
        color: colors.black,
        paddingVertical: scaleSize(14),
    },
    eyeIcon: {
        padding: scaleSize(8),
    },
    roleSection: {
        marginVertical: scaleSize(20),
    },
    roleLabel: {
        fontSize: scaleSize(16),
        fontWeight: '600',
        color: colors.black,
        marginBottom: scaleSize(12),
        textAlign: 'center',
    },
    roleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: scaleSize(12),
    },
    roleOption: {
        flex: 1,
        backgroundColor: colors.base50,
        borderRadius: scaleSize(16),
        padding: scaleSize(16),
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.base200,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: scaleSize(2) },
        shadowOpacity: 0.05,
        shadowRadius: scaleSize(4),
        elevation: 2,
    },
    roleOptionActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
        shadowColor: colors.primary,
        shadowOpacity: 0.3,
        elevation: 6,
    },
    roleText: {
        fontSize: scaleSize(13),
        fontWeight: '600',
        color: colors.black,
        marginTop: scaleSize(8),
    },
    roleTextActive: {
        color: colors.white,
    },
    roleSubtext: {
        fontSize: scaleSize(12),
        color: colors.neutral,
        marginTop: scaleSize(4),
        textAlign: 'center',
    },
    roleSubtextActive: {
        color: 'rgba(255, 255, 255, 0.9)',
    },
    registerButton: {
        borderRadius: scaleSize(16),
        marginTop: scaleSize(20),
        marginBottom: scaleSize(20),
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: scaleSize(4) },
        shadowOpacity: 0.3,
        shadowRadius: scaleSize(8),
        elevation: 8,
    },
    registerButtonDisabled: {
        shadowOpacity: 0.1,
        elevation: 2,
    },
    registerButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: scaleSize(16),
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
    registerText: {
        color: colors.white,
        fontWeight: 'bold',
        fontSize: scaleSize(16),
        letterSpacing: 0.5,
    },
    loginLinkContainer: {
        alignItems: 'center',
        paddingVertical: scaleSize(16),
    },
    loginLinkText: {
        fontSize: scaleSize(14),
        color: colors.neutral,
        textAlign: 'center',
    },
    loginLinkBold: {
        fontWeight: 'bold',
        color: colors.primary,
    },
})

export default RegisterForm;
