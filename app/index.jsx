import { router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { colors } from "../styles/theme";

export default function Index() {
  const { user, isLoggedIn, loading, deliveryStatus } = useAuth();

  useEffect(() => {
    const handleNavigation = async () => {
      // Wait for auth context to finish loading
      if (loading) {
        return;
      }

      // If user is logged in, redirect based on their role and status
      if (isLoggedIn && user) {
        if (user.role === "delivery") {
          // For delivery users, check their status
          // If user is approved but deliveryStatus is still pending, prioritize isApproved
          if (user.isApproved === true || (deliveryStatus === "approved" && user.isApproved)) {
            router.replace("/delivery/dashboard");
          } else if (deliveryStatus === "pending" || deliveryStatus === "declined") {
            router.replace("/waitingForApproval");
          } else {
            router.replace("/login");
          }
        } else {
          // For regular users, go to home
          router.replace("/(tabs)/home");
        }
      } else {
        // Not logged in, go to login
        router.replace("/login");
      }
    };

    const timer = setTimeout(handleNavigation, 100);
    return () => clearTimeout(timer);
  }, [user, isLoggedIn, loading, deliveryStatus]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.primary,
      }}
    >
      <ActivityIndicator size="large" color={colors.white} />
    </View>
  );
}