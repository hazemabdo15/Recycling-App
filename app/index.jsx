import { router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { colors } from "../styles/theme";

export default function Index() {
  useEffect(() => {

    const timer = setTimeout(() => {
      router.replace("/(tabs)/home");
    }, 100);

    return () => clearTimeout(timer);
  }, []);

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