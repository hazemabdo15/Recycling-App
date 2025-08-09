
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Dimensions, PanResponder, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../../styles";

// Toast singleton system
let addToastFn;
let dismissToastFn;

// type: 'success' | 'error' | 'info' | 'warning'
export const showGlobalToast = (message, duration = 1200, type = 'success') => {
  if (dismissToastFn) dismissToastFn(); // Dismiss current toast immediately
  if (addToastFn) addToastFn({ message, duration, type });
};

const getToastStyle = (type) => {
  switch (type) {
    case 'success':
      return {
        backgroundColor: colors.primary || '#0E9F6E',
        icon: '🎉',
        label: 'Success!'
      };
    case 'error':
      return {
        backgroundColor: colors.error || '#F44336',
        icon: '⛔',
        label: 'Error!'
      };
    case 'warning':
      return {
        backgroundColor: colors.warning || '#FFA000',
        icon: '🚧',
        label: 'Warning!'
      };
    case 'info':
      return {
        backgroundColor: colors.neutral || '#607D8B',
        icon: '💡',
        label: 'Info'
      };
    default:
      return {
        backgroundColor: '#222',
        icon: '🔔',
        label: ''
      };
  }
};


const TOAST_HEIGHT = 56;




const Toast = ({ toast, onDismiss }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const translateY = useRef(new Animated.Value(40)).current;
  const pan = useRef(new Animated.Value(0)).current;
  const [dismissed, setDismissed] = useState(false);
  const mounted = useRef(true);
  const timerRef = useRef(null);
  const animRef = useRef(null);
  // No stacking offset needed

  useEffect(() => {
    mounted.current = true;

    // Fast, smooth pop-in animation for new toasts
    animRef.current = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 120, // Fast entry
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 28,
        bounciness: 10,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 120, // Fast entry
        useNativeDriver: true,
      }),
    ]);
    animRef.current.start();

    timerRef.current = setTimeout(() => handleDismiss(), toast.duration);
    return () => {
      mounted.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (animRef.current) animRef.current.stop && animRef.current.stop();
    };
    // eslint-disable-next-line
  }, []);

  const handleDismiss = useCallback(() => {
    if (dismissed || !mounted.current) return;
    setDismissed(true);
    // Always schedule the state update asynchronously to avoid React warnings
    setTimeout(() => {
      if (!mounted.current) return;
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 120, // Fast exit
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.92,
          duration: 120, // Fast exit
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 30,
          duration: 120, // Fast exit
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (mounted.current) onDismiss(toast.id);
      });
    }, 0);
  }, [dismissed, fadeAnim, scaleAnim, translateY, onDismiss, toast.id]);

  // Swipe to dismiss
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 10,
      onPanResponderMove: Animated.event([
        null,
        { dx: pan },
      ], { useNativeDriver: false }),
      onPanResponderRelease: (_, gestureState) => {
        if (Math.abs(gestureState.dx) > 60) {
          // Always dismiss asynchronously to avoid React warnings
          setTimeout(() => handleDismiss(), 0);
        } else {
          Animated.spring(pan, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const { backgroundColor, icon, label } = getToastStyle(toast.type);

  // No stacking offset needed
  // Friendly, modern message wording
  let message = toast.message;
  // Only fallback if the message is empty or whitespace
  if (!message || /^\s*$/.test(message)) {
    if (toast.type === 'success') {
      message = 'Action completed successfully!';
    } else if (toast.type === 'error') {
      message = 'Something went wrong.';
    } else if (toast.type === 'warning') {
      message = 'Please check your input.';
    } else if (toast.type === 'info') {
      message = 'Here is some information.';
    } else {
      message = 'Notification.';
    }
  }

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.toast,
        {
          backgroundColor,
          opacity: fadeAnim,
          transform: [
            { translateY: translateY },
            { scale: scaleAnim },
            { translateX: pan },
          ],
        },
      ]}
      accessibilityRole="alert"
    >
      <TouchableOpacity style={styles.toastContent} activeOpacity={0.8} onPress={() => setTimeout(() => handleDismiss(), 0)}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
        <View style={styles.textContainer}>
          {label ? <Text style={styles.label}>{label}</Text> : null}
          <Text style={styles.toastText} numberOfLines={3} ellipsizeMode="tail">{message}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const GlobalToast = () => {
  const [toast, setToast] = useState(null);
  const toastId = useRef(0);
  const dismissRef = useRef(null);

  // Dismiss current toast immediately
  const dismissToast = useCallback(() => {
    if (dismissRef.current) {
      dismissRef.current();
    }
  }, []);

  // Add new toast, replacing any current one
  const addToast = useCallback((toastData) => {
    const id = ++toastId.current;
    setToast({ ...toastData, id });
  }, []);

  const removeToast = useCallback((id) => {
    setToast((prev) => (prev && prev.id === id ? null : prev));
  }, []);

  useEffect(() => {
    addToastFn = addToast;
    dismissToastFn = dismissToast;
    return () => {
      addToastFn = null;
      dismissToastFn = null;
    };
  }, [addToast, dismissToast]);

  if (!toast) return null;

  return (
    <View pointerEvents="box-none" style={styles.container}>
      <Toast
        key={toast.id}
        toast={toast}
        onDismiss={removeToast}
        ref={(ref) => {
          // Expose dismiss method for immediate removal
          if (ref) dismissRef.current = ref.handleDismiss;
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 60,
    alignItems: "center",
    zIndex: 9999,
    elevation: 20,
    pointerEvents: "box-none",
  },
  toast: {
    minWidth: Dimensions.get('window').width * 0.7,
    maxWidth: Dimensions.get('window').width * 0.95,
    borderRadius: 16,
    marginBottom: 0, // no margin, overlap instead
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
    backgroundColor: '#222',
    overflow: 'hidden',
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    minHeight: TOAST_HEIGHT,
    paddingVertical: 0,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.13)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  icon: {
    fontSize: 22,
    color: '#fff',
    opacity: 0.98,
  },
  textContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  label: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    opacity: 0.85,
    marginBottom: 1,
    letterSpacing: 0.2,
  },
  toastText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: 'left',
    opacity: 0.98,
    letterSpacing: 0.1,
    lineHeight: 19,
    flexWrap: 'wrap',
    paddingRight: 2,
    width: '100%',
  },
});

export default GlobalToast;
