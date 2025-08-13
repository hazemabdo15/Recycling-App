import { router } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, View, Text, TextInput, TouchableOpacity } from "react-native";
import { forgotPassword } from "../services/auth";
import { colors, borderRadius, spacing, shadows, typography } from "../styles/theme";
import { scaleSize } from "../utils/scale";
import { StatusBar } from "expo-status-bar";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    
    if (!trimmedEmail) {
      Alert.alert("Missing Email", "Please enter your email address.");
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    setLoading(true);
    
    try {
      console.log("[ForgotPassword] Sending OTP to:", trimmedEmail);
      await forgotPassword(trimmedEmail);
      
      // Navigate to OTP verification screen with email parameter
      router.push({
        pathname: "/forgotPasswordotp",
        params: { email: trimmedEmail }
      });
      
    } catch (error) {
      console.error("[ForgotPassword] Error:", error);
      Alert.alert(
        "Error", 
        "Failed to send reset code. Please check your email and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" backgroundColor="#fff"></StatusBar>
      <View style={styles.header}>
        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.subtitle}>
          Enter your email address and we'll send you a code to reset your password.
        </Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          placeholderTextColor={colors.textTertiary}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleForgotPassword}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Sending..." : "Send Reset Code"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text style={styles.backButtonText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: scaleSize(30),
    justifyContent: "center",
  },
  header: {
    marginBottom: spacing.xxl,
    alignItems: "center",
  },
  title: {
    ...typography.title,
    marginBottom: spacing.sm,
    color: colors.text,
  },
  subtitle: {
    ...typography.subtitle,
    textAlign: "center",
  },
  form: {
    width: "100%",
  },
  input: {
    borderWidth: 1,
    borderColor: colors.base300,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    fontSize: 16,
    marginBottom: spacing.lg,
    backgroundColor: colors.base100,
    color: colors.text,
    ...shadows.small,
  },
  button: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    alignItems: "center",
    marginBottom: spacing.md,
    ...shadows.small,
  },
  buttonDisabled: {
    backgroundColor: colors.base400,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  backButton: {
    alignItems: "center",
    padding: spacing.sm,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "500",
  },
});