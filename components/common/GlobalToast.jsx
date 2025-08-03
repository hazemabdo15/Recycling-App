import { useCallback, useEffect, useState } from "react";
import { Animated, StyleSheet, Text } from "react-native";
import { colors } from "../../styles";


let showToastFn;

// type: 'success' | 'error' | 'info' | 'warning'
export const showGlobalToast = (message, duration = 1000, type = 'success') => {
  if (showToastFn) showToastFn(message, duration, type);
};


const GlobalToast = () => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState("success");
  const [fadeAnim] = useState(new Animated.Value(0));

  const showToast = useCallback((msg, duration, toastType = 'success') => {
    setMessage(msg);
    setType(toastType);
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

  // Choose style based on type
  let backgroundColor = '#222';
  let icon = null;
  if (type === 'success') {
    backgroundColor = colors.primary;
    icon = '✔️';
  } else if (type === 'error') {
    backgroundColor = colors.error;
    icon = '✖';
  } else if (type === 'warning') {
    backgroundColor = colors.warning;
    icon = '⚠️';
  } else if (type === 'info') {
    backgroundColor = colors.neutral;
    icon = 'ℹ️';
  }

  return (
    <Animated.View style={[styles.toast, { opacity: fadeAnim, backgroundColor }]}> 
      <Text style={styles.toastText}>
        {icon ? icon + ' ' : ''}{message}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    bottom: 60,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  toastText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: 'center',
  },
});

export default GlobalToast;
