import { useCallback, useEffect, useState } from "react";
import { Animated, StyleSheet, Text } from "react-native";

let showToastFn;

export const showGlobalToast = (message, duration = 3000) => {
  if (showToastFn) showToastFn(message, duration);
};

const GlobalToast = () => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [fadeAnim] = useState(new Animated.Value(0));

  const showToast = useCallback((msg, duration) => {
    setMessage(msg);
    setVisible(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => setVisible(false));
      }, duration);
    });
  }, [fadeAnim]);

  useEffect(() => {
    showToastFn = showToast;
    return () => {
      showToastFn = null;
    };
  }, [showToast]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.toast, { opacity: fadeAnim }]}> 
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    bottom: 60,
    left: 20,
    right: 20,
    backgroundColor: "#222",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    zIndex: 9999,
    elevation: 10,
  },
  toastText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default GlobalToast;
