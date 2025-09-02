import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AddressPhase from "../components/pickup/AddressPhase";
import ConfirmationPhase from "../components/pickup/ConfirmationPhase";
import ReviewPhase from "../components/pickup/ReviewPhase";
import { useAuth } from "../context/AuthContext";
import { useLocalization } from "../context/LocalizationContext";
import { useCart } from "../hooks/useCart";
import { usePickupWorkflow } from "../hooks/usePickupWorkflow";
import { useThemedStyles } from "../hooks/useThemedStyles";
import { isAuthenticated } from "../services/auth";
import { spacing, typography } from "../styles/theme";
import { paymentDeduplicationManager } from "../utils/paymentDeduplication";
import { scaleSize } from "../utils/scale";
import { workflowStateUtils } from "../utils/workflowStateUtils";

export default function Pickup() {
  const insets = useSafeAreaInsets();
  const { tRole } = useLocalization();
  const { colors } = useThemedStyles();
  const styles = getPickupStyles(colors);
  const {
    user,
    isLoggedIn,
    accessToken,
    loading: authContextLoading,
  } = useAuth();
  const { cartItems } = useCart(user);
  
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [dialogShown, setDialogShown] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const deepLinkTimeoutRef = useRef(null);

  // Animation for loading spinner  
  const orderSpinValue = useRef(new Animated.Value(0)).current;

  const cartItemsRef = useRef(cartItems);

  useEffect(() => {
    cartItemsRef.current = cartItems;
  }, [cartItems]);

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => {
        setIsFocused(false);
        setDialogShown(false);
      };
    }, [])
  );

  useEffect(() => {
    if (!isFocused) {
      return;
    }

    const checkAuth = async () => {
      try {
        if (authContextLoading) {
          return;
        }

        if (!isLoggedIn || !user) {
          setAuthError("LOGIN_REQUIRED");
          setAuthLoading(false);
          return;
        }

        const authStatus = await isAuthenticated();

        if (!authStatus) {
          setAuthError("TOKEN_EXPIRED");
          setAuthLoading(false);
          return;
        }

        setAuthError(null);
        setAuthLoading(false);
      } catch (error) {
        console.error("[Pickup] Authentication check failed:", error);
        setAuthError("AUTH_ERROR");
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, [isLoggedIn, user, accessToken, authContextLoading, isFocused]);

  const workflowHook = usePickupWorkflow();

  const {
    currentPhase = 1,
    selectedAddress = null,
    orderData = null,
    nextPhase = () => {},
    previousPhase = () => {},
    setSelectedAddress = () => {},
    createOrder = () => {},
    reset = () => {},
    setCurrentPhase = () => {},
    cartItemDetails = {},
  } = workflowHook || {};

  // Stable refs for deep link handling to prevent multiple handlers
  const deepLinkDataRef = useRef({
    selectedAddress,
    createOrder,
    setCurrentPhase,
    setSelectedAddress,
    workflowHook
  });

  // Get cart clearing function
  const { handleClearCart } = useCart(user);

  // Update refs when dependencies change
  useEffect(() => {
    deepLinkDataRef.current = {
      selectedAddress,
      createOrder,
      setCurrentPhase,
      setSelectedAddress,
      workflowHook,
      handleClearCart
    };
  }, [selectedAddress, createOrder, setCurrentPhase, setSelectedAddress, workflowHook, handleClearCart]);

  // Stable deep link handler that uses refs
  const stableHandleDeepLink = useCallback(async (event) => {
    const {
      selectedAddress: currentSelectedAddress,
      createOrder: currentCreateOrder,
      setCurrentPhase: currentSetCurrentPhase,
      setSelectedAddress: currentSetSelectedAddress,
      handleClearCart: currentHandleClearCart,
    } = deepLinkDataRef.current;

    const urlObj = new URL(event.url);
    const paymentStatus = urlObj.searchParams.get("payment");
    const paymentIntentId = urlObj.searchParams.get("payment_intent");
    const sessionId = urlObj.searchParams.get("session_id");

    // Only process payment-related URLs
    const isPaymentRelatedURL =
      paymentStatus ||
      paymentIntentId ||
      sessionId ||
      event.url.includes("canceled=true") ||
      event.url.includes("cancelled=true");

    if (!isPaymentRelatedURL) {
      console.log("[Pickup] Non-payment URL, ignoring:", event.url);
      return;
    }

    console.log("[Pickup] Processing payment deep link:", event.url);
    console.log("[Pickup] Payment parameters:", { paymentStatus, paymentIntentId, sessionId });

    // Generate payment key for deduplication
    const paymentKey = paymentIntentId || sessionId || `${paymentStatus}_${Date.now()}`;

    try {
      paymentDeduplicationManager.startProcessing(paymentKey);
      console.log("[Pickup] Processing payment deep link:", paymentKey);

      if (paymentStatus === "success") {
        // Successful payment - create order
        console.log("[Pickup] Payment successful, creating order...");
        
        // ✅ Immediately set phase to confirmation to prevent ReviewPhase flash
        if (currentSetCurrentPhase) {
          console.log("[Pickup] Setting phase to confirmation immediately to prevent ReviewPhase flash");
          currentSetCurrentPhase(3);
        }
        
        if (!currentSelectedAddress) {
          console.log(
            "[Pickup] No selected address found in deep link handler, attempting to restore from saved workflow state"
          );
          
          const savedState = await workflowStateUtils.getWorkflowState();
          if (savedState?.selectedAddress) {
            console.log("[Pickup] Restored address from saved state:", savedState.selectedAddress);
            if (currentSetSelectedAddress) {
              currentSetSelectedAddress(savedState.selectedAddress);
            }
            // Use the restored address for order creation
            try {
              const orderResult = await currentCreateOrder({
                address: savedState.selectedAddress,
                paymentMethod: "credit-card",
                paymentIntentId: paymentIntentId || sessionId, // Use either payment_intent or session_id
              });
              console.log("[Pickup] Deep link order created", orderResult);
              
              // Clear cart after successful order creation
              if (currentHandleClearCart) {
                console.log("[Pickup] Clearing cart after successful order creation");
                try {
                  await currentHandleClearCart();
                  console.log("[Pickup] Cart cleared successfully");
                } catch (clearError) {
                  console.error("[Pickup] Failed to clear cart:", clearError);
                }
              }
            } catch (orderError) {
              console.error("[Pickup] Order creation failed:", orderError);
              // On error, go back to review phase
              if (currentSetCurrentPhase) {
                console.log("[Pickup] Order creation failed, returning to review phase");
                currentSetCurrentPhase(2);
              }
              Alert.alert("Order Failed", "Failed to create order. Please try again.");
            }
          } else {
            console.error("[Pickup] No saved address state found, cannot proceed");
            // On error, go back to review phase
            if (currentSetCurrentPhase) {
              console.log("[Pickup] No address found, returning to review phase");
              currentSetCurrentPhase(2);
            }
            Alert.alert(
              "Error",
              "Unable to complete order. Please try again."
            );
          }
        } else {
          try {
            const orderResult = await currentCreateOrder({
              address: currentSelectedAddress,
              paymentMethod: "credit-card",
              paymentIntentId: paymentIntentId || sessionId, // Use either payment_intent or session_id
            });
            console.log("[Pickup] Deep link order created", orderResult);
            
            // Clear cart after successful order creation
            if (currentHandleClearCart) {
              console.log("[Pickup] Clearing cart after successful order creation");
              try {
                await currentHandleClearCart();
                console.log("[Pickup] Cart cleared successfully");
              } catch (clearError) {
                console.error("[Pickup] Failed to clear cart:", clearError);
              }
            }
          } catch (orderError) {
            console.error("[Pickup] Order creation failed:", orderError);
            // On error, go back to review phase
            if (currentSetCurrentPhase) {
              console.log("[Pickup] Order creation failed, returning to review phase");
              currentSetCurrentPhase(2);
            }
            Alert.alert("Order Failed", "Failed to create order. Please try again.");
          }
        }
      } else if (
        paymentStatus === "cancelled" ||
        event.url.includes("canceled=true") ||
        event.url.includes("cancelled=true")
      ) {
        Alert.alert("Payment Cancelled", "Your payment was cancelled.");
        if (currentSetCurrentPhase) {
          currentSetCurrentPhase(2); // Back to review
        }
      }

      paymentDeduplicationManager.completeProcessing(paymentKey, true);
    } catch (error) {
      console.error("[Pickup] Deep link processing error:", error);
      paymentDeduplicationManager.completeProcessing(paymentKey, false);
      
      // Only show error if it's not a duplicate processing error
      if (!error.message?.includes("already being processed")) {
        Alert.alert("Error", "Failed to process payment. Please try again.");
      }
    }
  }, []); // Empty dependency array - uses refs for data

  // Set up deep link handler only once
  useEffect(() => {
    console.log("INFO", "Setting up stable deep link handler");

    // Handle initial URL
    Linking.getInitialURL()
      .then((url) => {
        if (url) {
          const isPaymentURL =
            url.includes("payment=") ||
            url.includes("payment_intent=") ||
            url.includes("session_id=") ||
            url.includes("canceled=true") ||
            url.includes("cancelled=true");

          if (isPaymentURL) {
            console.log("INFO", "Initial URL appears to be payment-related, processing...");
            stableHandleDeepLink({ url });
          } else {
            console.log("INFO", "Initial URL is not payment-related, skipping deep link processing");
          }
        } else {
          console.log("INFO", "No initial URL found");
        }
      })
      .catch((error) => {
        console.log("ERROR", "Failed to get initial URL:", error.message);
      });

    // Set up listener
    const subscription = Linking.addEventListener("url", stableHandleDeepLink);

    return () => {
      console.log("INFO", "Cleaning up stable deep link handler");
      subscription?.remove();
    };
  }, [stableHandleDeepLink]); // Include stableHandleDeepLink dependency

  useEffect(() => {
    // Phase changed - handle any side effects here if needed
  }, [currentPhase, selectedAddress]);

  // Debug order data changes
  useEffect(() => {
    // Order data changed - handle any side effects here if needed
  }, [orderData, currentPhase]);

  // Animation effect for loading spinner in phase 3
  useEffect(() => {
    if (currentPhase === 3) {
      const spinAnimation = Animated.loop(
        Animated.timing(orderSpinValue, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        { iterations: -1 } // Infinite loop
      );
      spinAnimation.start();
      return () => {
        spinAnimation.stop();
      };
    } else {
      // Reset animation when not in phase 3
      orderSpinValue.setValue(0);
    }
  }, [currentPhase, orderSpinValue]);

  const handleAddressSelect = useCallback(
    async (address) => {
      console.log("[Pickup] handleAddressSelect called with:", address);
      setSelectedAddress(address);
      
      // ✅ Automatically save workflow state when address is selected
      try {
        await workflowStateUtils.saveWorkflowState({
          selectedAddress: address,
          currentPhase,
          cartItemDetails: cartItemDetails || {}
        });
      } catch (error) {
        console.warn("⚠️ [Pickup] Failed to save workflow state after address selection:", error);
      }
    },
    [setSelectedAddress, currentPhase, cartItemDetails]
  );

  const handleNextPhase = useCallback(() => {
    console.log(
      "[Pickup] handleNextPhase called, current phase:",
      currentPhase
    );
    nextPhase();
  }, [nextPhase, currentPhase]);

  useEffect(() => {
    if (!isFocused || !authError || dialogShown) {
      return;
    }

    setDialogShown(true);

    if (authError === "LOGIN_REQUIRED") {
      Alert.alert(
        "Login Required",
        "You need to be logged in to schedule a pickup. Please log in to continue.",
        [
          {
            text: "Cancel",
            onPress: () => {
              setDialogShown(false);
              router.back();
            },
          },
          {
            text: "Login",
            onPress: () => {
              setDialogShown(false);
              router.push("/login");
            },
          },
        ]
      );
    } else if (authError === "TOKEN_EXPIRED") {
      Alert.alert(
        "Session Expired",
        "Your session has expired. Please log in again to schedule a pickup.",
        [
          {
            text: "OK",
            onPress: () => {
              setDialogShown(false);
              router.push("/login");
            },
          },
        ]
      );
    } else if (authError === "AUTH_ERROR") {
      Alert.alert(
        "Authentication Error",
        "There was an issue verifying your session. Please try logging in again.",
        [
          {
            text: "OK",
            onPress: () => {
              setDialogShown(false);
              router.push("/login");
            },
          },
        ]
      );
    }
  }, [authError, dialogShown, isFocused]);

  useEffect(() => {
    const currentTimeoutId = deepLinkTimeoutRef.current;
    return () => {
      reset();
      // Cleanup timeout if component unmounts
      if (currentTimeoutId) {
        clearTimeout(currentTimeoutId);
      }
    };
  }, [reset]);

  if (authLoading || authContextLoading) {
    return (
      <View style={styles.container}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />

        <LinearGradient
          colors={[colors.primary, colors.neutral]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 20 }]}
        >
          <Text style={styles.headerTitle}>Loading...</Text>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.messageContainer}>
            <MaterialCommunityIcons
              sto
              size={64}
              color={colors.primary}
            />
            <Text style={styles.messageTitle}>Preparing Pickup</Text>
            <Text style={styles.messageText}>
              Verifying your session and setting up pickup workflow...
            </Text>
          </View>
        </View>
      </View>
    );
  }

  if (authError) {
    return (
      <View style={styles.container}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />

        <LinearGradient
          colors={[colors.primary, colors.neutral]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 20 }]}
        >
          <Text style={styles.headerTitle}>Authentication Required</Text>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.messageContainer}>
            <MaterialCommunityIcons
              name="account-alert"
              size={64}
              color={colors.primary}
            />
            <Text style={styles.messageTitle}>Login Required</Text>
            <Text style={styles.messageText}>
              You need to be logged in to schedule a pickup.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  const getPhaseTitle = () => {
    switch (currentPhase) {
      case 1:
        return tRole("progressSteps.1", user?.role) || "Address";
      case 2:
        return tRole("progressSteps.2", user?.role) || "Review";
      case 3:
        return tRole("progressSteps.3", user?.role) || "Confirmation";
      default:
        return "Schedule Pickup";
    }
  };

  const renderProgressIndicator = () => (
    <View style={styles.progressContainer}>
      {[1, 2, 3].map((phase) => (
        <View key={phase} style={styles.progressStep}>
          <View
            style={[
              styles.progressCircle,
              currentPhase >= phase && styles.progressCircleActive,
            ]}
          >
            <Text
              style={[
                styles.progressText,
                currentPhase >= phase && styles.progressTextActive,
              ]}
            >
              {phase}
            </Text>
          </View>
          {phase < 3 && (
            <View
              style={[
                styles.progressLine,
                currentPhase > phase && styles.progressLineActive,
              ]}
            />
          )}
        </View>
      ))}
    </View>
  );

  const renderCurrentPhase = (phase = currentPhase) => {
    try {
      switch (phase) {
        case 1:
          return (
            <AddressPhase
              user={user}
              selectedAddress={selectedAddress}
              onAddressSelect={handleAddressSelect}
              onNext={handleNextPhase}
              onBack={() => router.back()}
              pickupWorkflow={workflowHook}
            />
          );
        case 2:
          if (!selectedAddress) {
            console.log("[Pickup] No selected address, staying in phase 1");
            return renderCurrentPhase(1);
          }
          if (!cartItems || Object.keys(cartItems).length === 0) {
            console.log("[Pickup] No cart items, redirecting to cart");
            router.push("/(tabs)/cart");
            return null;
          }

          console.log("[Pickup] Rendering ReviewPhase with:", {
            user: !!user,
            cartItems: Object.keys(cartItems).length,
            selectedAddress: !!selectedAddress,
            loading: workflowHook?.loading,
            selectedAddressKeys: selectedAddress
              ? Object.keys(selectedAddress)
              : [],
            userType: typeof user,
            cartItemsType: typeof cartItems,
          });

          if (typeof createOrder !== "function") {
            console.error(
              "[Pickup] createOrder is not a function:",
              typeof createOrder
            );
            return (
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  padding: 20,
                }}
              >
                <Text style={{ color: "red", textAlign: "center" }}>
                  Configuration error: Invalid createOrder function
                </Text>
              </View>
            );
          }

          if (typeof previousPhase !== "function") {
            console.error(
              "[Pickup] previousPhase is not a function:",
              typeof previousPhase
            );
            return (
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  padding: 20,
                }}
              >
                <Text style={{ color: "red", textAlign: "center" }}>
                  Configuration error: Invalid previousPhase function
                </Text>
              </View>
            );
          }

          console.log("[Pickup] Creating ReviewPhase directly...");
          return (
            <ReviewPhase
              user={user}
              cartItems={cartItems}
              selectedAddress={selectedAddress}
              onConfirm={createOrder}
              onBack={previousPhase}
              loading={workflowHook?.loading || false}
              pickupWorkflow={workflowHook}
              accessToken={accessToken}
            />
          );
        case 3:
          // Show loading state if order data is not yet available
          if (!orderData) {
            return (
              <View style={styles.messageContainer}>
                <Animated.View 
                  style={{
                    transform: [{
                      rotate: orderSpinValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      })
                    }]
                  }}
                >
                  <MaterialCommunityIcons
                    name="refresh"
                    size={64}
                    color={colors.primary}
                  />
                </Animated.View>
                <Text style={styles.messageTitle}>Processing Order</Text>
                <Text style={styles.messageText}>
                  Please wait while we finalize your order...
                </Text>
              </View>
            );
          }
          return (
            <ConfirmationPhase
              order={orderData}
              onFinish={() => {
                // Navigate immediately for better UX
                router.push("/(tabs)/home");
                // Reset in background
                setTimeout(() => {
                  reset();
                }, 100);
              }}
            />
          );
        default:
          return null;
      }
    } catch (error) {
      console.error("[Pickup] Error rendering phase:", phase, error);
      return (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <Text
            style={{
              color: colors.error,
              textAlign: "center",
              marginBottom: 20,
            }}
          >
            An error occurred while loading this phase. Please try again.
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: colors.primary,
              paddingVertical: 12,
              paddingHorizontal: 24,
              borderRadius: 8,
            }}
            onPress={() => {
              console.log("[Pickup] Retrying phase render");

              if (phase > 1) {
                previousPhase();
              }
            }}
          >
            <Text style={{ color: colors.title, fontWeight: "bold" }}>
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <LinearGradient
        colors={[colors.primary, colors.neutral]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <Text style={styles.headerTitle}>{getPhaseTitle()}</Text>
        {renderProgressIndicator()}
      </LinearGradient>

      <View style={styles.content}>{renderCurrentPhase()}</View>
    </View>
  );
}

// Dynamic styles function for Pickup
const getPickupStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: scaleSize(spacing.xl),
    paddingBottom: scaleSize(spacing.xl),
    borderBottomLeftRadius: scaleSize(24),
    borderBottomRightRadius: scaleSize(24),
    backgroundColor: 'transparent',
  },
  headerTitle: {
    ...typography.title,
    fontSize: scaleSize(24),
    fontWeight: "bold",
    color: colors.title,
    textAlign: "center",
    marginBottom: scaleSize(spacing.lg),
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
  },
  messageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: scaleSize(spacing.xl),
  },
  messageTitle: {
    ...typography.title,
    fontSize: scaleSize(22),
    fontWeight: "bold",
    color: colors.primary,
    marginTop: scaleSize(spacing.lg),
    marginBottom: scaleSize(spacing.md),
    textAlign: "center",
  },
  messageText: {
    ...typography.body,
    color: colors.neutral,
    textAlign: "center",
    lineHeight: scaleSize(22),
    marginBottom: scaleSize(spacing.lg),
  },

  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: scaleSize(spacing.md),
  },
  progressStep: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressCircle: {
    width: scaleSize(32),
    height: scaleSize(32),
    borderRadius: scaleSize(16),
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  progressCircleActive: {
    backgroundColor: colors.title,
    borderColor: colors.title,
  },
  progressText: {
    ...typography.caption,
    fontSize: scaleSize(14),
    fontWeight: "bold",
    color: colors.title,
  },
  progressTextActive: {
    color: colors.primary,
  },
  progressLine: {
    width: scaleSize(40),
    height: scaleSize(2),
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    marginHorizontal: scaleSize(spacing.sm),
  },
  progressLineActive: {
    backgroundColor: colors.title,
  },
});
