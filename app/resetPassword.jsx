import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { resetPassword } from "../services/auth";
import { colors } from "../styles";

export default function ResetPasswordScreen() {
  const { email, otpCode } = useLocalSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const validatePassword = (password) => {
    // Minimum 8 characters, at least one letter and one number
    const minLength = password.length >= 8;
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    
    return {
      isValid: minLength && hasLetter && hasNumber,
      minLength,
      hasLetter,
      hasNumber
    };
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert("Missing Fields", "Please fill in all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match.");
      return;
    }

    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      Alert.alert(
        "Invalid Password", 
        "Password must be at least 8 characters long and contain both letters and numbers."
      );
      return;
    }

    setLoading(true);
    
    try {
      await resetPassword({
        email: String(email),
        otpCode: String(otpCode),
        newPassword
      });
      
      Alert.alert(
        "Success!", 
        "Your password has been reset successfully.",
        [
          {
            text: "Login Now!",
            onPress: () => router.replace("/login")
          }
        ]
      );
      
    } catch (error) {
      console.error("[ResetPassword] Error:", error);
      Alert.alert(
        "Reset Failed", 
        "Failed to reset password. The code may have expired. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const passwordValidation = validatePassword(newPassword);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" backgroundColor="#fff"></StatusBar>
      <View style={styles.header}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          Enter your new password for{"\n"}
          <Text style={styles.email}>{email}</Text>
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showNewPassword}
            editable={!loading}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowNewPassword(!showNewPassword)}
          >
            <Ionicons
              name={showNewPassword ? "eye-off" : "eye"}
              size={20}
              color="#666"
            />
          </TouchableOpacity>
        </View>

        {newPassword.length > 0 && (
          <View style={styles.validationContainer}>
            <Text style={[
              styles.validationText,
              passwordValidation.minLength ? styles.validationValid : styles.validationInvalid
            ]}>
              ✓ At least 8 characters
            </Text>
            <Text style={[
              styles.validationText,
              passwordValidation.hasLetter ? styles.validationValid : styles.validationInvalid
            ]}>
              ✓ Contains letters
            </Text>
            <Text style={[
              styles.validationText,
              passwordValidation.hasNumber ? styles.validationValid : styles.validationInvalid
            ]}>
              ✓ Contains numbers
            </Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            editable={!loading}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <Ionicons
              name={showConfirmPassword ? "eye-off" : "eye"}
              size={20}
              color="#666"
            />
          </TouchableOpacity>
        </View>

        {confirmPassword.length > 0 && newPassword !== confirmPassword && (
          <Text style={styles.errorText}>Passwords do not match</Text>
        )}

        <TouchableOpacity
          style={[
            styles.button,
            (!passwordValidation.isValid || newPassword !== confirmPassword || loading) && styles.buttonDisabled
          ]}
          onPress={handleResetPassword}
          disabled={!passwordValidation.isValid || newPassword !== confirmPassword || loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Resetting..." : "Reset Password"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    justifyContent: "center",
  },
  header: {
    marginBottom: 40,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
  email: {
    fontWeight: "600",
    color: "#007bff",
  },
  form: {
    width: "100%",
  },
  inputContainer: {
    position: "relative",
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 15,
    paddingRight: 50,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  eyeIcon: {
    position: "absolute",
    right: 15,
    top: 15,
    padding: 5,
  },
  validationContainer: {
    marginBottom: 15,
    paddingLeft: 5,
  },
  validationText: {
    fontSize: 12,
    marginBottom: 2,
  },
  validationValid: {
    color: "#28a745",
  },
  validationInvalid: {
    color: "#dc3545",
  },
  errorText: {
    color: "#dc3545",
    fontSize: 12,
    marginTop: -10,
    marginBottom: 15,
    paddingLeft: 5,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  backButton: {
    alignItems: "center",
    padding: 10,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 16,
  },
});