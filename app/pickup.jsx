import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    Alert,
    AppState,
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
import { API_BASE_URL } from "../services/api/config";
import { isAuthenticated } from "../services/auth";
import { colors, spacing, typography } from "../styles/theme";
import { getProgressStepLabel } from "../utils/roleLabels";
import { scaleSize } from '../utils/scale';

const prepareOrderItems = async (cartItems, cartItemDetails, accessToken, user, logWithTimestamp) => {
  let orderItems = [];
  
  try {

    if (cartItemDetails && Object.keys(cartItemDetails).length > 0) {
      logWithTimestamp('INFO', 'Using cart item details directly, no API call needed');

      orderItems = Object.entries(cartItems).map(([itemId, quantity]) => {
        const itemDetails = cartItemDetails[itemId];
        
        if (itemDetails) {
          return {
            _id: itemDetails._id,
            categoryId: itemDetails.categoryId,
            quantity: Number(quantity),
            name: itemDetails.name || itemDetails.itemName || 'Unknown Item',
            categoryName: itemDetails.categoryName || 'Unknown Category',
            measurement_unit: Number(itemDetails.measurement_unit),
            points: Number(itemDetails.points) || 10,
            price: Number(itemDetails.price) || 5.0,
            image: itemDetails.image || 'placeholder.png',
          };
        } else {

          logWithTimestamp('WARN', `Missing details for item ${itemId}, using basic data`);
          return {
            _id: itemId,
            categoryId: itemId,
            quantity: Number(quantity),
            name: 'Unknown Item',
            categoryName: 'Unknown Category',
            measurement_unit: 1,
            points: 10,
            price: 5.0,
            image: 'placeholder.png',
          };
        }
      });
      
      logWithTimestamp('INFO', 'Prepared order items from cart context:', orderItems.length);
    } else {

      logWithTimestamp('WARN', 'Cart item details not available, fetching from backend cart');
      const backendCartResponse = await fetch(`${API_BASE_URL}/api/cart`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (backendCartResponse.ok) {
        const backendCartData = await backendCartResponse.json();
        const backendItems = backendCartData.items || [];

        orderItems = backendItems.map(item => ({
          _id: item._id,
          categoryId: item.categoryId,
          quantity: Number(item.quantity),
          name: item.name || item.itemName || 'Unknown Item',
          categoryName: item.categoryName || 'Unknown Category',
          measurement_unit: Number(item.measurement_unit),
          points: Number(item.points) || 10,
          price: Number(item.price) || 5.0,
          image: item.image || 'placeholder.png',
        }));
        
        logWithTimestamp('INFO', 'Using backend cart items for order:', orderItems.length);
      }
    }
  } catch (error) {
    logWithTimestamp('ERROR', 'Failed to prepare order items:', error.message);
    throw new Error('Failed to prepare order data');
  }
  
  if (orderItems.length === 0) {
    throw new Error('No items found for order creation');
  }
  
  logWithTimestamp('INFO', 'Final order items:', JSON.stringify(orderItems));
  return orderItems;
};

export default function Pickup() {

  const logWithTimestamp = (level, ...args) => {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [PICKUP-${level}]`;
    
    if (level === 'ERROR') {
      console.error(logEntry, ...args);
    } else if (level === 'WARN') {
      console.warn(logEntry, ...args);
    } else {
      console.log(logEntry, ...args);
    }

    try {
      const logData = {
        timestamp,
        level,
        message: args.join(' '),
        appState: AppState.currentState
      };

      const logKey = `pickup_log_${Date.now()}`;
      AsyncStorage.setItem(logKey, JSON.stringify(logData)).catch(() => {});

      AsyncStorage.getItem('pickup_debug_logs').then(existingLogs => {
        let logs = [];
        if (existingLogs) {
          try {
            logs = JSON.parse(existingLogs);
          } catch (_e) {
            logs = [];
          }
        }
        
        logs.push(logData);

        if (logs.length > 50) {
          logs = logs.slice(-50);
        }
        
        AsyncStorage.setItem('pickup_debug_logs', JSON.stringify(logs)).catch(() => {});
      }).catch(() => {});
      
    } catch (_e) {}
  };



  logWithTimestamp('INFO', 'Component initialized/re-rendered');

  global.checkPickupLogs = async () => {
    try {
      const storedLogs = await AsyncStorage.getItem('pickup_debug_logs');
      if (storedLogs) {
        const logs = JSON.parse(storedLogs);
        console.log('=== PICKUP DEBUG LOGS ===');
        logs.forEach((log, index) => {
          console.log(`${index + 1}. [${log.timestamp}] [${log.level}] ${log.message} (AppState: ${log.appState})`);
        });
        console.log('=== END PICKUP LOGS ===');
        return logs;
      } else {
        console.log('No stored pickup logs found');
        return [];
      }
    } catch (error) {
      console.error('Failed to retrieve pickup logs:', error);
      return [];
    }
  };
  
  global.clearPickupLogs = async () => {
    try {
      await AsyncStorage.removeItem('pickup_debug_logs');
      console.log('Pickup logs cleared');
    } catch (error) {
      console.error('Failed to clear pickup logs:', error);
    }
  };
  
  const insets = useSafeAreaInsets();
  const {
    user,
    isLoggedIn,
    accessToken,
    loading: authContextLoading,
  } = useAuth();
  const { cartItems, cartItemDetails, fetchBackendCart, handleClearCart } = useCart(user);

  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [dialogShown, setDialogShown] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);

  const cartItemsRef = useRef(cartItems);

  useEffect(() => {
    cartItemsRef.current = cartItems;
  }, [cartItems]);

  useEffect(() => {

  }, [isLoggedIn, user, accessToken, authContextLoading]);

  useFocusEffect(
    useCallback(() => {
      logWithTimestamp('INFO', "Pickup screen focused");
      setIsFocused(true);

      const checkStoredLogs = async () => {
        try {
          const storedLogs = await AsyncStorage.getItem('pickup_debug_logs');
          if (storedLogs) {
            const logs = JSON.parse(storedLogs);
            console.log('[Pickup] Retrieved stored logs:', logs.slice(-15));

            const recentCritical = logs.filter(log => 
              log.level === 'CRITICAL' && 
              (Date.now() - new Date(log.timestamp).getTime()) < 5 * 60 * 1000
            );
            
            if (recentCritical.length > 0) {
              console.log('[Pickup] Recent critical events found:', recentCritical);
            }
          }
        } catch (error) {
          console.warn('[Pickup] Failed to retrieve stored logs:', error.message);
        }
      };
      
      checkStoredLogs();

      return () => {
        logWithTimestamp('INFO', "Pickup screen unfocused");
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
    setOrderData = () => {},
  } = workflowHook || {};

  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      logWithTimestamp('INFO', "App state changed to:", nextAppState);
      if (nextAppState === 'active') {
        logWithTimestamp('INFO', "App became active, checking for pending payments");

        if (fetchBackendCart && isLoggedIn) {
          fetchBackendCart().catch(error => {
            console.error('[Pickup] Failed to refresh cart on app foreground:', error);
          });
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [fetchBackendCart, isLoggedIn]);

  useEffect(() => {
    logWithTimestamp('INFO', 'Setting up deep link handler');
    
    const handleDeepLink = async (event) => {
      logWithTimestamp('CRITICAL', '===== DEEP LINK RECEIVED =====');
      const { queryParams } = Linking.parse(event.url);
      logWithTimestamp('INFO', "Deep link URL received:", event.url);
      logWithTimestamp('INFO', "Query params:", JSON.stringify(queryParams));

      const isPaymentRelatedURL = 
        event.url.includes('payment=') ||
        event.url.includes('payment_intent=') ||
        event.url.includes('session_id=') ||
        event.url.includes('canceled=true') ||
        event.url.includes('cancelled=true') ||
        (queryParams.phase && queryParams.payment);
      
      if (!isPaymentRelatedURL) {
        logWithTimestamp('INFO', 'URL is not payment-related, ignoring deep link handler');
        return;
      }

      logWithTimestamp('INFO', "Current app state when deep link received:", JSON.stringify({
        currentPhase,
        hasUser: !!user,
        hasSelectedAddress: !!selectedAddress,
        cartItemsCount: cartItemsRef.current ? Object.keys(cartItemsRef.current).length : 0,
        creatingOrder,
        appState: AppState.currentState,
        userId: user?._id
      }));
      
      if (
        queryParams.phase === "confirmation" &&
        queryParams.payment === "success"
      ) {
        if (setCurrentPhase && typeof setCurrentPhase === "function") {
          logWithTimestamp('INFO', "Payment successful, moving to confirmation phase");
          setCurrentPhase(3);
        }
        logWithTimestamp('INFO', "Payment successful, creating order... checking requirements");

        const processOrderCreation = async () => {
          if (typeof createOrder === "function" && cartItemsRef.current && user && selectedAddress && !creatingOrder) {
            setCreatingOrder(true);
            logWithTimestamp('INFO', 'Starting order creation after successful payment');
            
            try {

              logWithTimestamp('INFO', 'Refreshing cart data before order creation...');
              if (fetchBackendCart) {
                try {
                  await fetchBackendCart();
                  logWithTimestamp('INFO', 'Cart data refreshed successfully');
                } catch (refreshError) {
                  logWithTimestamp('WARN', 'Failed to refresh cart:', refreshError.message);
                }
              }

              const orderItems = await prepareOrderItems(cartItemsRef.current, cartItemDetails, accessToken, user, logWithTimestamp);

              const userData = {
                userId: user._id || user.userId,
                phoneNumber: user.phoneNumber || user.phone || '',
                userName: user.name || user.userName || '',
                email: user.email || '',
                imageUrl: (typeof user.imageUrl === 'string' && user.imageUrl && user.imageUrl.trim())
                  || (typeof user.image === 'string' && user.image && user.image.trim())
                  || 'https://via.placeholder.com/150/0000FF/808080?text=User',
                role: user.role,
              };

              logWithTimestamp('INFO', 'Calling createOrder function...');
              logWithTimestamp('INFO', 'Order data being sent:', JSON.stringify({
                itemCount: orderItems.length,
                userRole: userData.role,
                selectedAddressId: selectedAddress._id,
                firstItemCategoryId: orderItems[0]?.categoryId
              }));
              
              const orderResult = await createOrder(orderItems, userData);
              
              logWithTimestamp('CRITICAL', 'Order creation completed successfully without error:', JSON.stringify(orderResult));

              try {
                if (handleClearCart) {
                  await handleClearCart();
                  logWithTimestamp('INFO', 'Cart cleared after successful order creation');
                }
              } catch (cartError) {
                logWithTimestamp('WARN', 'Failed to clear cart after successful order:', cartError.message);
              }

              if (setCurrentPhase && typeof setCurrentPhase === "function") {
                setCurrentPhase(3);
              }
              
              return true;
              
            } catch (error) {

              if (error.message && error.message.includes('Category with ID') && error.message.includes('not found')) {
                logWithTimestamp('INFO', 'Detected "Category not found" error - this is the known backend validation issue. Proceeding with order verification...');

                const categoryIdMatch = error.message.match(/Category with ID (\w+) not found/);
                if (categoryIdMatch) {
                  logWithTimestamp('INFO', 'Problematic category ID:', categoryIdMatch[1]);
                }
              } else {

                logWithTimestamp('ERROR', 'Order creation failed:', error.message);
                logWithTimestamp('ERROR', 'Error details:', JSON.stringify({
                  errorName: error.name,
                  errorMessage: error.message,
                  errorStack: error.stack?.split('\n')[0],
                  cartItemsCount: cartItemsRef.current ? Object.keys(cartItemsRef.current).length : 0,
                  userId: user?._id || 'unknown'
                }));
              }

              try {
                logWithTimestamp('INFO', 'Verifying if order was created despite error...');

                await new Promise(resolve => setTimeout(resolve, 500));

                const ordersResponse = await fetch(`${API_BASE_URL}/api/orders?skip=0&limit=5`, {
                  headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                  }
                });
                
                if (ordersResponse.ok) {
                  const ordersData = await ordersResponse.json();
                  const recentOrders = ordersData.data || ordersData.orders || ordersData;
                  
                  if (Array.isArray(recentOrders) && recentOrders.length > 0) {

                    const recentOrder = recentOrders.find(order => {
                      const orderTime = new Date(order.createdAt).getTime();
                      const timeDiff = Date.now() - orderTime;
                      return timeDiff < 2 * 60 * 1000;
                    });
                    
                    if (recentOrder) {
                      logWithTimestamp('CRITICAL', 'Found recent order despite error! Treating as success:', recentOrder._id);

                      if (setOrderData && typeof setOrderData === 'function') {
                        setOrderData(recentOrder);
                        logWithTimestamp('INFO', 'Order data set in workflow hook:', recentOrder._id);
                      }

                      try {
                        if (handleClearCart) {
                          await handleClearCart();
                          logWithTimestamp('INFO', 'Cart cleared after successful order verification');
                        }
                      } catch (cartError) {
                        logWithTimestamp('WARN', 'Failed to clear cart after order success:', cartError.message);
                      }
                      
                      if (setCurrentPhase && typeof setCurrentPhase === "function") {
                        setCurrentPhase(3);
                      }

                      logWithTimestamp('INFO', 'User successfully redirected to confirmation phase, no alert needed');
                      
                      return true;
                    }
                  }
                }
              } catch (verifyError) {
                logWithTimestamp('ERROR', 'Failed to verify order creation:', verifyError.message);
              }

              Alert.alert(
                "Order Status Unclear",
                "There was an issue during order processing. Please check your order history to see if the order was created, or try again.",
                [{ text: "OK" }]
              );
              
              return false;
            } finally {
              setCreatingOrder(false);
            }
          } else {
            logWithTimestamp('WARN', 'Order creation skipped - missing requirements:', JSON.stringify({
              createOrderFunction: typeof createOrder === "function",
              cartItemsExists: !!cartItemsRef.current,
              cartItemsCount: cartItemsRef.current ? Object.keys(cartItemsRef.current).length : 0,
              userExists: !!user,
              selectedAddressExists: !!selectedAddress,
              creatingOrderInProgress: creatingOrder
            }));
            return false;
          }
        };

        processOrderCreation();
      } else if (
        queryParams.phase === "review" &&
        queryParams.payment === "cancelled"
      ) {
        if (setCurrentPhase && typeof setCurrentPhase === "function") {
          setCurrentPhase(2);
        }
        Alert.alert("Payment Cancelled", "Your payment was cancelled.");
      } else if (event.url.includes("payment_intent=")) {
        logWithTimestamp('INFO', "Payment intent found in URL");

        const match = event.url.match(/payment_intent=([^&]+)/);
        if (match) {
          const paymentIntentId = match[1];
          logWithTimestamp('INFO', "Payment intent ID extracted:", paymentIntentId);

          if (setCurrentPhase && typeof setCurrentPhase === "function") {
            logWithTimestamp('INFO', "Payment intent successful, moving to confirmation phase");
            setCurrentPhase(3);
          }

          if (typeof createOrder === "function" && cartItemsRef.current && user && selectedAddress && !creatingOrder) {
            setCreatingOrder(true);
            logWithTimestamp('INFO', 'Starting order creation after payment intent success');
            
            try {

              logWithTimestamp('INFO', 'Refreshing cart data before order creation...');
              if (fetchBackendCart) {
                try {
                  await fetchBackendCart();
                  logWithTimestamp('INFO', 'Cart data refreshed successfully');
                } catch (refreshError) {
                  logWithTimestamp('WARN', 'Failed to refresh cart:', refreshError.message);
                }
              }

              const orderItems = await prepareOrderItems(cartItemsRef.current, cartItemDetails, accessToken, user, logWithTimestamp);

              const userData = {
                userId: user._id || user.userId,
                phoneNumber: user.phoneNumber || user.phone || '',
                userName: user.name || user.userName || '',
                email: user.email || '',
                imageUrl: (typeof user.imageUrl === 'string' && user.imageUrl && user.imageUrl.trim())
                  || (typeof user.image === 'string' && user.image && user.image.trim())
                  || 'https://via.placeholder.com/150/0000FF/808080?text=User',
                role: user.role,
              };

              logWithTimestamp('INFO', 'Calling createOrder function...');
              const orderResult = await createOrder(orderItems, userData);
              
              logWithTimestamp('INFO', 'Order creation completed:', JSON.stringify(orderResult));

              try {
                if (handleClearCart) {
                  await handleClearCart();
                  logWithTimestamp('INFO', 'Cart cleared after successful order creation (payment_intent flow)');
                }
              } catch (cartError) {
                logWithTimestamp('WARN', 'Failed to clear cart after successful order (payment_intent flow):', cartError.message);
              }

              if (setCurrentPhase && typeof setCurrentPhase === "function") {
                setCurrentPhase(3);
              }
              
            } catch (error) {

              if (error.message && error.message.includes('Category with ID') && error.message.includes('not found')) {
                logWithTimestamp('INFO', 'Detected "Category not found" error in payment_intent flow - this is the known backend validation issue. Proceeding with order verification...');
              } else {

                logWithTimestamp('ERROR', 'Order creation failed:', error.message);
              }

              try {
                logWithTimestamp('INFO', 'Verifying if order was created despite error...');

                await new Promise(resolve => setTimeout(resolve, 500));

                const ordersResponse = await fetch(`${API_BASE_URL}/api/orders?limit=5`, {
                  headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                  }
                });
                
                if (ordersResponse.ok) {
                  const ordersData = await ordersResponse.json();
                  const recentOrders = ordersData.data || ordersData.orders || ordersData;
                  
                  if (Array.isArray(recentOrders) && recentOrders.length > 0) {

                    const recentOrder = recentOrders.find(order => {
                      const orderTime = new Date(order.createdAt).getTime();
                      const timeDiff = Date.now() - orderTime;
                      return timeDiff < 2 * 60 * 1000;
                    });
                    
                    if (recentOrder) {
                      logWithTimestamp('CRITICAL', 'Found recent order despite error! Treating as success:', recentOrder._id);

                      try {
                        if (handleClearCart) {
                          await handleClearCart();
                          logWithTimestamp('INFO', 'Cart cleared after successful order verification (payment_intent flow)');
                        }
                      } catch (cartError) {
                        logWithTimestamp('WARN', 'Failed to clear cart after order success (payment_intent flow):', cartError.message);
                      }
                      
                      if (setCurrentPhase && typeof setCurrentPhase === "function") {
                        setCurrentPhase(3);
                      }

                      logWithTimestamp('INFO', 'User successfully redirected to confirmation phase, no alert needed (payment_intent flow)');
                      
                      return;
                    }
                  }
                }
              } catch (verifyError) {
                logWithTimestamp('ERROR', 'Failed to verify order creation:', verifyError.message);
              }

              Alert.alert(
                "Order Status Unclear",
                "There was an issue during order processing. Please check your order history to see if the order was created, or try again.",
                [{ text: "OK" }]
              );
              
            } finally {
              setCreatingOrder(false);
            }
          } else {
            logWithTimestamp('WARN', 'Order creation skipped - missing requirements:', JSON.stringify({
              createOrderFunction: typeof createOrder === "function",
              cartItemsExists: !!cartItemsRef.current,
              cartItemsCount: cartItemsRef.current ? Object.keys(cartItemsRef.current).length : 0,
              userExists: !!user,
              selectedAddressExists: !!selectedAddress,
              creatingOrderInProgress: creatingOrder
            }));
          }
        }
      } else if (event.url.includes("canceled=true") || event.url.includes("cancelled=true")) {
        logWithTimestamp('WARN', "Payment was canceled");
        Alert.alert("Payment Canceled", "Your payment was canceled. Please try again.");
      } else {
        logWithTimestamp('WARN', "Unexpected payment-related URL pattern:", event.url);

        Alert.alert(
          "Payment Status Unclear",
          "We received a payment notification but couldn't determine the status. Please check your order history to confirm if your payment was processed.",
          [{ text: "OK" }]
        );
      }
    };

    Linking.getInitialURL().then((url) => {
      if (url) {
        logWithTimestamp('INFO', "Initial URL detected:", url);

        const isPaymentURL = 
          url.includes('payment=') ||
          url.includes('payment_intent=') ||
          url.includes('session_id=') ||
          url.includes('canceled=true') ||
          url.includes('cancelled=true');
          
        if (isPaymentURL) {
          logWithTimestamp('INFO', "Initial URL appears to be payment-related, processing...");
          handleDeepLink({ url });
        } else {
          logWithTimestamp('INFO', "Initial URL is not payment-related, skipping deep link processing");
        }
      } else {
        logWithTimestamp('INFO', "No initial URL found");
      }
    }).catch(error => {
      logWithTimestamp('ERROR', "Failed to get initial URL:", error.message);
    });

    logWithTimestamp('INFO', "Setting up deep link handler");
    const subscription = Linking.addEventListener("url", handleDeepLink);
    
    return () => {
      logWithTimestamp('INFO', "Cleaning up deep link handler");
      subscription?.remove();
    };
  }, [
    setCurrentPhase,
    createOrder,
    cartItems,
    cartItemDetails,
    user,
    selectedAddress,
    creatingOrder,
    currentPhase,
    fetchBackendCart,
    accessToken,
    handleClearCart,
    setOrderData,
  ]);





  useEffect(() => {
    logWithTimestamp('INFO', "Phase changed to:", currentPhase.toString());
    logWithTimestamp('INFO', "Selected address:", selectedAddress ? "present" : "null");
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
