import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
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
import { useCart } from "../hooks/useCart";
import { usePickupWorkflow } from "../hooks/usePickupWorkflow";
import { isAuthenticated } from "../services/auth";
import { colors, spacing, typography } from "../styles/theme";
import { getProgressStepLabel } from "../utils/roleLabels";
import { isBuyer } from "../utils/roleUtils";
import { scaleSize } from "../utils/scale";

// const prepareOrderItems = async (cartItems, cartItemDetails, accessToken) => {
//   let orderItems = [];

//   try {
//     if (cartItemDetails && Object.keys(cartItemDetails).length > 0) {
//       console.log(
//         "INFO",
//         "Using cart item details directly, no API call needed"
//       );

//       orderItems = Object.entries(cartItems).map(([itemId, quantity]) => {
//         const itemDetails = cartItemDetails[itemId];
//         console.log(
//           `[Pickup] Preparing order item for ID ${itemId} with quantity ${quantity}`,
//           itemDetails
//         );
//         if (itemDetails) {
//           return {
//             _id: itemDetails._id,
//             categoryId: itemDetails.categoryId,
//             quantity: Number(quantity),
//             name: itemDetails.name || itemDetails.itemName || "Unknown Item",
//             categoryName: itemDetails.categoryName || "Unknown Category",
//             measurement_unit: Number(itemDetails.measurement_unit),
//             points: Number(itemDetails.points) || 10,
//             price: Number(itemDetails.price) || 5.0,
//             image: itemDetails.image || "placeholder.png",
//           };
//         } else {
//           console.log(
//             "WARN",
//             `Missing details for item ${itemId}, using basic data`
//           );
//           return {
//             _id: itemId,
//             categoryId: itemId,
//             quantity: Number(quantity),
//             name: "Unknown Item",
//             categoryName: "Unknown Category",
//             measurement_unit: 1,
//             points: 10,
//             price: 5.0,
//             image: "placeholder.png",
//           };
//         }
//       });

//       console.log(
//         "INFO",
//         "Prepared order items from cart context:",
//         orderItems.length
//       );
//     } else {
//       console.log(
//         "WARN",
//         "Cart item details not available, fetching from backend cart"
//       );
//       const backendCartResponse = await fetch(`${API_BASE_URL}/api/cart`, {
//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//           "Content-Type": "application/json",
//         },
//       });

//       if (backendCartResponse.ok) {
//         const backendCartData = await backendCartResponse.json();
//         const backendItems = backendCartData.items || [];

//         orderItems = backendItems.map((item) => ({
//           _id: item._id,
//           categoryId: item.categoryId,
//           quantity: Number(item.quantity),
//           name: item.name || item.itemName || "Unknown Item",
//           categoryName: item.categoryName || "Unknown Category",
//           measurement_unit: Number(item.measurement_unit),
//           points: Number(item.points) || 10,
//           price: Number(item.price) || 5.0,
//           image: item.image || "placeholder.png",
//         }));

//         console.log(
//           "INFO",
//           "Using backend cart items for order:",
//           orderItems.length
//         );
//       }
//     }
//   } catch (error) {
//     console.log("ERROR", "Failed to prepare order items:", error.message);
//     throw new Error("Failed to prepare order data");
//   }

//   if (orderItems.length === 0) {
//     throw new Error("No items found for order creation");
//   }

//   console.log("INFO", "Final order items:", JSON.stringify(orderItems));
//   return orderItems;
// };

export default function Pickup() {
  const insets = useSafeAreaInsets();
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
  const [, setCreatingOrder] = useState(false);

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
        try {
          setCreatingOrder(true);

          // ✅ Check if we have address in workflow state, if not try to restore from previous state
          if (!selectedAddress) {
            console.warn(
              "No selected address found in deep link handler, attempting to use last known address"
            );
            // Let the createOrder function handle the validation and show appropriate error
          }

          // ✅ Single order creation call through unified workflow
          // Only pass paymentMethod if user is a buyer
          let orderOptions = {
            paymentStatus: "success",
            paymentIntentId,
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
          if (setCurrentPhase) {
            setCurrentPhase(3);
          }
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
        }
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
    [createOrder, setCurrentPhase, selectedAddress]
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

  const handleAddressSelect = useCallback(
    (address) => {
      console.log("[Pickup] handleAddressSelect called with:", address);
      setSelectedAddress(address);
    },
    [setSelectedAddress]
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
    return () => reset();
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
          colors={[colors.primary, colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 20 }]}
        >
          <Text style={styles.headerTitle}>Loading...</Text>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.messageContainer}>
            <MaterialCommunityIcons
              name="loading"
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
          colors={[colors.primary, colors.secondary]}
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
        return getProgressStepLabel(1, user?.role);
      case 2:
        return getProgressStepLabel(2, user?.role);
      case 3:
        return getProgressStepLabel(3, user?.role);
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
          return (
            <ConfirmationPhase
              order={orderData}
              onFinish={() => {
                reset();
                router.push("/(tabs)/home");
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
            <Text style={{ color: colors.white, fontWeight: "bold" }}>
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
        colors={[colors.primary, colors.secondary]}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: scaleSize(spacing.xl),
    paddingBottom: scaleSize(spacing.xl),
    borderBottomLeftRadius: scaleSize(24),
    borderBottomRightRadius: scaleSize(24),
  },
  headerTitle: {
    ...typography.title,
    fontSize: scaleSize(24),
    fontWeight: "bold",
    color: colors.white,
    textAlign: "center",
    marginBottom: scaleSize(spacing.lg),
  },
  content: {
    flex: 1,
    backgroundColor: colors.base100,
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
    backgroundColor: colors.white,
    borderColor: colors.white,
  },
  progressText: {
    ...typography.caption,
    fontSize: scaleSize(14),
    fontWeight: "bold",
    color: colors.white,
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
    backgroundColor: colors.white,
  },
});
