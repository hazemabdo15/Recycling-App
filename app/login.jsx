import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import LoginForm from "../components/auth/LoginForm";
import { useAuth } from "../context/AuthContext";
import { loginUser } from "../services/auth";
import { getLoggedInUser } from "../utils/authUtils";

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [checkingUser, setCheckingUser] = useState(true);
  const { login, isLoggedIn, user, deliveryStatus, refreshDeliveryStatus, logout } = useAuth();

  useFocusEffect(
    useCallback(() => {
      const checkUser = async () => {
        try {
          console.log("[LoginScreen] Checking auth state...");
          console.log("[LoginScreen] AuthContext isLoggedIn:", isLoggedIn);
          console.log("[LoginScreen] AuthContext user:", user);

          if (isLoggedIn && user) {
            if (user.role === "delivery") {
              console.log("[LoginScreen] User is delivery, checking delivery status", deliveryStatus);
              const updatedStatus = await refreshDeliveryStatus();
              console.log("[LoginScreen] Delivery status after refresh:", updatedStatus);

              if (updatedStatus === "approved" && user.isApproved) {
                router.replace("/delivery/dashboard");
              } else if (updatedStatus === "pending" || updatedStatus === "declined") {
                router.replace("/waitingForApproval");
              } else {
                await logout();
                router.replace("/login");
                Alert.alert(
                  "Access Denied",
                  "Please contact support for assistance."
                );
              }

            } else {
              console.log(
                "[LoginScreen] User already logged in, redirecting to home"
              );
              router.replace("/home");
            }
            return;
          }

          const savedUser = await getLoggedInUser();
          console.log("[LoginScreen] Saved user result:", savedUser)
          setCheckingUser(false);
        } catch (err) {
          console.error("[LoginScreen] Error checking user:", err);
          setCheckingUser(false);
        }
      };

      checkUser();
    }, [deliveryStatus, isLoggedIn, refreshDeliveryStatus, user])
  );

  if (checkingUser) return null;

  const handleLogin = async ({ email, password }) => {
    email = email.trim().toLowerCase();
    if (loading) {
      console.log(
        "[Login] Already processing login, ignoring duplicate request"
      );
      return;
    }

    setLoading(true);
    console.log("[Login] Starting login process for:", email);

    if (!email || !password) {
      Alert.alert("Missing Fields", "Email and password are required.");
      setLoading(false);
      return;
    }

    try {
      const { user, accessToken, deliveryStatus } = await loginUser({ email, password });
      console.log("[Login] Login API call successful");

      console.log("[Login] user:", user);
      console.log("[Login] accessToken:", accessToken);

      await login(user, accessToken, deliveryStatus);
      console.log("[Login] AuthContext updated successfully");
      console.log("[Login] user after await login:", user);

      if (user.role === "delivery") {
        console.log("[Login] User is delivery, checking delivery status");
        console.log("delivertyStatus:", deliveryStatus);
        if (deliveryStatus === 'pending' || deliveryStatus === 'declined') {
          router.replace("/waitingForApproval");
        }
        else if (user.isApproved && deliveryStatus === 'approved') {
          router.replace("/delivery/dashboard");
        } else {
          await logout();
          Alert.alert(
            "Access Denied",
            "Please contact support for assistance."
          );
          router.replace("/login");
        }
      } else {
        router.replace("/home");
      }
    } catch (_error) {

      Alert.alert(
        "Login failed",
        "Please check your credentials and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <LoginForm onSubmit={handleLogin} loading={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
