import { router, useLocalSearchParams } from "expo-router";
import { useState, useRef, useEffect } from "react";
import { Alert, StyleSheet, View, Text, TextInput, TouchableOpacity } from "react-native";
import { forgotPassword } from "../services/auth";
import { colors, borderRadius, spacing, shadows, typography } from "../styles/theme";
import { StatusBar } from "expo-status-bar";

export default function ForgotPasswordOtpScreen() {
  const { email } = useLocalSearchParams();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    // Focus first input when screen loads
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleOtpChange = (value, index) => {
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, "");
    
    if (numericValue.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = numericValue;
      setOtp(newOtp);

      // Auto-focus next input
      if (numericValue && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (e, index) => {
    // Handle backspace
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (pastedText) => {
    // Handle paste - extract only numbers
    const numbers = pastedText.replace(/[^0-9]/g, "").slice(0, 6);
    const newOtp = [...otp];
    
    for (let i = 0; i < 6; i++) {
      newOtp[i] = numbers[i] || "";
    }
    
    setOtp(newOtp);
    
    // Focus appropriate input after paste
    const nextEmptyIndex = numbers.length < 6 ? numbers.length : 5;
    inputRefs.current[nextEmptyIndex]?.focus();
  };

  const handleVerifyOtp = async () => {
    const otpCode = otp.join("");
    
    if (otpCode.length !== 6) {
      Alert.alert("Incomplete Code", "Please enter the complete 6-digit code.");
      return;
    }

    setLoading(true);
    
    try {
      console.log("[ForgotPasswordOtp] Verifying OTP:", otpCode);
      console.log("[ForgotPasswordOtp] Email:", email);
      console.log("[ForgotPasswordOtp] Full params:", { email, otpCode });
    
      
      // Navigate to reset password screen
      router.push({
        pathname: "/resetPassword",
        params: { email, otpCode }
      });
      
    } catch (error) {
      console.error("[ForgotPasswordOtp] Verification error:", error);
      Alert.alert(
        "Invalid Code", 
        "The code you entered is incorrect or has expired. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    
    try {
      console.log("[ForgotPasswordOtp] Resending OTP to:", email);
      await forgotPassword(email);
      Alert.alert("Code Sent", "A new verification code has been sent to your email.");
    } catch (error) {
      console.error("[ForgotPasswordOtp] Resend error:", error);
      Alert.alert("Error", "Failed to resend code. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  const isComplete = otp.every(digit => digit !== "");

  return (
    <View style={styles.container}>
      <StatusBar style="dark" backgroundColor="#fff"></StatusBar>
      <View style={styles.header}>
        <Text style={styles.title}>Enter Verification Code</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit code to{"\n"}
          <Text style={styles.email}>{email}</Text>
        </Text>
      </View>

      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => inputRefs.current[index] = ref}
            style={[
              styles.otpInput,
              digit && styles.otpInputFilled
            ]}
            value={digit}
            onChangeText={(value) => handleOtpChange(value, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            keyboardType="numeric"
            maxLength={1}
            textAlign="center"
            editable={!loading}
            onPaste={(e) => {
              if (index === 0) {
                handlePaste(e.nativeEvent.text);
              }
            }}
          />
        ))}
      </View>

      <TouchableOpacity
        style={[styles.button, (!isComplete || loading) && styles.buttonDisabled]}
        onPress={handleVerifyOtp}
        disabled={!isComplete || loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Verifying..." : "Verify Code"}
        </Text>
      </TouchableOpacity>

      <View style={styles.resendContainer}>
        <Text style={styles.resendText}>Didn't receive the code?</Text>
        <TouchableOpacity
          onPress={handleResendOtp}
          disabled={resendLoading}
        >
          <Text style={[styles.resendLink, resendLoading && styles.resendLinkDisabled]}>
            {resendLoading ? "Sending..." : "Resend Code"}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
        disabled={loading}
      >
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xxl,
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
    marginBottom: spacing.sm,
  },
  email: {
    fontWeight: "600",
    color: colors.primary,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  otpInput: {
    width: 50,
    height: 60,
    borderWidth: 1,
    borderColor: colors.base300,
    borderRadius: borderRadius.sm,
    fontSize: 20,
    fontWeight: "600",
    backgroundColor: colors.base100,
    color: colors.text,
    ...shadows.small,
  },
  otpInputFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.white,
    ...shadows.medium,
  },
  button: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    alignItems: "center",
    marginBottom: spacing.lg,
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
  resendContainer: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  resendText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  resendLink: {
    ...typography.body,
    color: colors.primary,
    fontWeight: "600",
  },
  resendLinkDisabled: {
    color: colors.base400,
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