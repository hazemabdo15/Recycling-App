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
import { useCartValidation } from "../hooks/useCartValidation";
import { usePickupWorkflow } from "../hooks/usePickupWorkflow";
import { useThemedStyles } from "../hooks/useThemedStyles";
import { isAuthenticated } from "../services/auth";
import { spacing, typography } from "../styles/theme";
import { isBuyer } from "../utils/roleUtils";
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
  
  // Add cart validation for critical pickup screen - DISABLED during order flow to prevent conflicts
  const { validateCart, quickValidateCart } = useCartValidation({
    validateOnFocus: false, // Disabled to prevent interference with payment flow
    validateOnAppActivation: false, // Disabled - handled by GlobalCartValidator with payment flow check
    autoCorrect: false, // DISABLED - Don't auto-correct during order completion to prevent conflicts
    showMessages: false, // DISABLED - Don't show messages during order flow to prevent confusion
    source: 'pickupScreen'
  });
  
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [dialogShown, setDialogShown] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [, setCreatingOrder] = useState(false);
  
  // Add flag to prevent multiple deep link processing
  const isProcessingPaymentRef = useRef(false);
  const deepLinkTimeoutRef = useRef(null);

  // Animation for loading spinner  
  const orderSpinValue = useRef(new Animated.Value(0)).current;

  const cartItemsRef = useRef(cartItems);

  useEffect(() => {
    cartItemsRef.current = cartItems;
  }, [cartItems]);

  useFocusEffect(
    useCallback(() => {
      console.log("INFO", "Pickup screen focused");
      setIsFocused(true);
      return () => {
        console.log("INFO", "Pickup screen unfocused");
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
        console.log("[Pickup] isAuthenticated() result:", authStatus);

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

  const handleDeepLink = useCallback(
    async (event) => {
      const urlObj = new URL(event.url);
      const paymentStatus = urlObj.searchParams.get("payment");
      const paymentIntentId = urlObj.searchParams.get("payment_intent");

      // Only process payment-related URLs
      const isPaymentRelatedURL =
        paymentStatus ||
        paymentIntentId ||
        event.url.includes("canceled=true") ||
        event.url.includes("cancelled=true");

      if (!isPaymentRelatedURL) {
        console.log("INFO", "URL is not payment-related, ignoring");
        return;
      }

      console.log("Processing payment deep link", {
        paymentStatus,
        paymentIntentId,
      });

      if (paymentStatus === "success" || paymentIntentId) {
        // Prevent multiple processing of the same payment
        if (isProcessingPaymentRef.current) {
          console.log("Payment already being processed, ignoring duplicate deep link");
          return;
        }
        
        // Clear any existing timeout
        if (deepLinkTimeoutRef.current) {
          clearTimeout(deepLinkTimeoutRef.current);
        }
        
        // Add small delay to prevent race conditions with button clicks
        deepLinkTimeoutRef.current = setTimeout(async () => {
          if (isProcessingPaymentRef.current) {
            console.log("Payment processing started during timeout, ignoring");
            return;
          }
          
          isProcessingPaymentRef.current = true;
          
          try {
            setCreatingOrder(true);
            
            // ✅ Immediately set to confirmation phase for better UX
            if (setCurrentPhase) {
              setCurrentPhase(3);
            }

            // ✅ Check if we have address in workflow state, if not try to restore from previous state
            let addressToUse = selectedAddress;
            if (!addressToUse) {
              console.warn(
                "No selected address found in deep link handler, attempting to restore from saved workflow state"
              );
              // Try to restore from saved workflow state
              const savedState = await workflowStateUtils.restoreWorkflowState();
              if (savedState && savedState.selectedAddress) {
                console.log("Found saved address in workflow state:", savedState.selectedAddress);
                addressToUse = savedState.selectedAddress;
                setSelectedAddress(savedState.selectedAddress);
              } else {
                console.error("No address found in workflow state either");
                // ✅ Fallback: Try to get the most recently created address
                if (workflowHook && workflowHook.addresses && workflowHook.addresses.length > 0) {
                  const mostRecentAddress = workflowHook.addresses[workflowHook.addresses.length - 1];
                  console.log("Using most recent address as fallback:", mostRecentAddress);
                  addressToUse = mostRecentAddress;
                  setSelectedAddress(mostRecentAddress);
                } else {
                  throw new Error("Please select your delivery address and try again");
                }
              }
            }

            // ✅ Single order creation call through unified workflow
            // Only pass paymentMethod if user is a buyer
            let orderOptions = {
              paymentStatus: "success",
              paymentIntentId,
              address: addressToUse, // Pass the address directly
            };
            if (isBuyer(user)) {
              orderOptions = {
                ...orderOptions,
                paymentMethod: "credit-card",
              };
            } else {
              // Remove paymentMethod if present for customers
              if (orderOptions.paymentMethod) delete orderOptions.paymentMethod;
            }
            console.log('[Pickup] Creating order with options:', orderOptions, 'User role:', user?.role);
            const orderResult = await createOrder(orderOptions);

            console.log("Deep link order created", {
              orderId: orderResult?._id || orderResult?.data?._id,
              hasOrderData: !!orderResult,
            });

            // ✅ Order data should now be properly stored in workflow hook
            // Phase is already set to 3 at the beginning of this block
          } catch (error) {
            console.error("Deep link order failed", { error: error.message });

            // Enhanced error handling for specific cases
            if (error.message.includes("Please select an address first")) {
              Alert.alert(
                "Address Required",
                "Please select your delivery address and try again.",
                [
                  {
                    text: "Select Address",
                    onPress: () => {
                      if (setCurrentPhase) {
                        setCurrentPhase(1); // Go back to address selection
                      }
                    },
                  },
                ]
              );
            } else {
              Alert.alert(
                "Order Status Unclear",
                "There was an issue processing your order. Please check your order history.",
                [{ text: "OK" }]
              );
            }
          } finally {
            setCreatingOrder(false);
            isProcessingPaymentRef.current = false; // Reset the flag
          }
        }, 300); // Small delay to prevent race conditions
      } else if (
        event.url.includes("canceled=true") ||
        event.url.includes("cancelled=true")
      ) {
        Alert.alert("Payment Cancelled", "Your payment was cancelled.");
        if (setCurrentPhase) {
          setCurrentPhase(2); // Back to review
        }
      }
    },
    [selectedAddress, user, createOrder, setCurrentPhase, setSelectedAddress, workflowHook]
  );

  useEffect(() => {
    console.log("INFO", "Setting up deep link handler");

    Linking.getInitialURL()
      .then((url) => {
        if (url) {
          console.log("INFO", "Initial URL detected:", url);

          const isPaymentURL =
            url.includes("payment=") ||
            url.includes("payment_intent=") ||
            url.includes("session_id=") ||
            url.includes("canceled=true") ||
            url.includes("cancelled=true");

          if (isPaymentURL) {
            console.log(
              "INFO",
              "Initial URL appears to be payment-related, processing..."
            );
            handleDeepLink({ url });
          } else {
            console.log(
              "INFO",
              "Initial URL is not payment-related, skipping deep link processing"
            );
          }
        } else {
          console.log("INFO", "No initial URL found");
        }
      })
      .catch((error) => {
        console.log("ERROR", "Failed to get initial URL:", error.message);
      });

    console.log("INFO", "Setting up deep link handler");
    const subscription = Linking.addEventListener("url", handleDeepLink);

    return () => {
      console.log("INFO", "Cleaning up deep link handler");
      subscription?.remove();
    };
  }, [handleDeepLink]);

  useEffect(() => {
    console.log("INFO", "Phase changed to:", currentPhase.toString());
    console.log(
      "INFO",
      "Selected address:",
      selectedAddress ? "present" : "null"
    );
  }, [currentPhase, selectedAddress]);

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
        console.log("💾 [Pickup] Workflow state saved after address selection");
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
    return () => {
      reset();
      // Cleanup timeout if component unmounts
      if (deepLinkTimeoutRef.current) {
        clearTimeout(deepLinkTimeoutRef.current);
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
    console.log("[Pickup] Rendering phase:", phase);

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
