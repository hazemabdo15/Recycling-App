import AsyncStorage from '@react-native-async-storage/async-storage';
import { isDevelopment, isProduction } from '../../config/env';
import { clearSession, getAccessToken as getStoredAccessToken } from "../../utils/authUtils";
import { validateQuantity } from "../../utils/cartUtils.js";
import logger from '../../utils/logger';
import { measureApiCall } from '../../utils/performanceMonitor';
import { BASE_URLS } from "./config";

const BASE_URL = BASE_URLS.CART;

let cachedToken = null;
let tokenCacheTime = 0;
const TOKEN_CACHE_DURATION = isProduction ? 60000 : 30000;

export async function clearAuthData() {
  try {
    await clearSession();
    cachedToken = null;
    tokenCacheTime = 0;
    
    if (!isProduction) {
      logger.auth('Cart auth data cleared');
    }
  } catch (error) {
    logger.auth('Error clearing cart auth data', { error: error.message }, 'ERROR');
  }
}

async function getSessionId() {
  try {
    const sessionId = await AsyncStorage.getItem("sessionId");
    
    if (!isProduction) {
      logger.debug(`Session ID retrieved: ${sessionId ? 'found' : 'not found'}`, null, 'CART');
    }
    
    return sessionId;
  } catch (error) {
    logger.cart('Error retrieving sessionId', { error: error.message }, 'ERROR');
    return null;
  }
}

export { getSessionId };

async function getAccessToken() {
  try {
    const now = Date.now();

    if (cachedToken && now - tokenCacheTime < TOKEN_CACHE_DURATION) {
      if (isTokenExpired(cachedToken)) {
        logger.auth('Cached token expired, clearing cache', null, 'WARN');
        cachedToken = null;
        tokenCacheTime = 0;
      } else {
        return cachedToken;
      }
    }

    const token = await getStoredAccessToken();
    if (token && !isTokenExpired(token)) {
      cachedToken = token;
      tokenCacheTime = now;
      logger.debug('Token retrieved and cached', null, 'CART');
      return token;
    }

    cachedToken = null;
    tokenCacheTime = 0;
    return null;
  } catch (error) {
    logger.auth('Error retrieving access token', { error: error.message }, 'ERROR');
    return null;
  }
}

function isTokenExpired(token) {
  if (!token) return true;

  try {
    let decoded;

    if (token.startsWith("mock.")) {
      const parts = token.split(".");
      if (parts.length >= 2) {
        decoded = atob(parts[1]);
      } else {
        return false;
      }
    } else {

      const parts = token.split(".");
      if (parts.length !== 3) return true;

      const base64 = parts[1];
      const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);

      try {
        decoded = atob(padded);

        if (decoded.includes("�") || decoded.includes("?")) {
          const uint8Array = new Uint8Array(
            atob(base64)
              .split("")
              .map((char) => char.charCodeAt(0))
          );
          const result = new TextDecoder("utf-8").decode(uint8Array);
          if (result.includes("�") || result.includes("\uFFFD")) {
            decoded = new TextDecoder("iso-8859-1").decode(uint8Array);
          } else {
            decoded = result;
          }
        }
      } catch (decodeError) {
        logger.auth('Token decode error', { error: decodeError.message }, 'ERROR');
        return true;
      }
    }

    const payload = JSON.parse(decoded);
    const currentTime = Math.floor(Date.now() / 1000);
    const isExpired = currentTime >= payload.exp;

    if (isDevelopment() && Math.random() < 0.1) {
      logger.debug('Token expiration check', {
        currentTime,
        tokenExp: payload.exp,
        isExpired,
        timeUntilExpiry: payload.exp - currentTime,
      }, 'CART');
    }

    return isExpired;
  } catch (error) {
    logger.auth('Error checking token expiration', { error: error.message }, 'ERROR');
    return true;
  }
}

async function setSessionIdFromResponse(response) {
  try {
    const setCookie =
      response.headers.get("set-cookie") || response.headers.get("Set-Cookie");

    if (setCookie) {
      const sessionMatch =
        setCookie.match(/sessionId=([^;,\s]+)/) ||
        setCookie.match(/connect\.sid=([^;,\s]+)/);
      if (sessionMatch) {
        const sessionId = sessionMatch[1];
        await AsyncStorage.setItem("sessionId", sessionId);
        logger.debug('Session ID set from cookie', { sessionId: sessionId.substring(0, 8) + '...' }, 'CART');
      }
    }

    try {
      const responseClone = response.clone();
      const responseData = await responseClone.json();
      if (responseData.sessionId) {
        await AsyncStorage.setItem("sessionId", responseData.sessionId);
        logger.debug('Session ID set from response body', null, 'CART');
      }
    } catch (_parseError) {

    }
  } catch (error) {
    logger.cart('Error setting sessionId', { error: error.message }, 'ERROR');
  }
}

async function getAuthHeaders(isLoggedIn, sessionId) {
  const headers = { "Content-Type": "application/json" };
  
  if (isLoggedIn) {
    const token = await getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
      logger.debug('Auth headers set with token', null, 'CART');
    } else {
      logger.auth('No valid token found - user may need to re-authenticate', null, 'WARN');
    }
  } else if (sessionId) {
    headers["Cookie"] = `sessionId=${sessionId}`;
    logger.debug('Auth headers set with session cookie', null, 'CART');
  }

  if (isDevelopment()) {
    logger.debug('Final auth headers', { 
      hasAuth: !!headers.Authorization,
      hasCookie: !!headers.Cookie
    }, 'CART');
  }

  return headers;
}

export async function getCart(isLoggedIn) {
  return measureApiCall(
    async () => {
      try {
        const sessionId = isLoggedIn ? null : await getSessionId();
        const headers = await getAuthHeaders(isLoggedIn, sessionId);

        const response = await fetch(BASE_URL, {
          method: "GET",
          headers,
          credentials: "include",
        });

        await setSessionIdFromResponse(response);

        if (!response.ok) {
          throw new Error(
            `Failed to get cart: ${response.status} ${response.statusText}`
          );
        }

        const result = await response.json();
        logger.cart('Cart retrieved successfully', {
          itemCount: result.items?.length || 0,
          userType: isLoggedIn ? 'authenticated' : 'guest'
        });

        return result;
      } catch (error) {
        logger.cart('Error retrieving cart', {
          error: error.message,
          userType: isLoggedIn ? 'authenticated' : 'guest'
        }, 'ERROR');
        throw error;
      }
    },
    'cart-get'
  );
}

export async function addItemToCart(item, isLoggedIn) {
  return measureApiCall(
    async () => {
      try {
        logger.cart('Adding item to cart', {
          itemName: item.name,
          categoryId: item.categoryId,
          quantity: item.quantity,
          userType: isLoggedIn ? 'authenticated' : 'guest'
        });

        validateQuantity(item);

        const sessionId = isLoggedIn ? null : await getSessionId();
        let headers = await getAuthHeaders(isLoggedIn, sessionId);

        if (!isLoggedIn && !sessionId) {
          logger.debug('Creating session for guest user', null, 'CART');
          try {
            const sessionResponse = await fetch(BASE_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
            });
            await setSessionIdFromResponse(sessionResponse);
            const newSessionId = await getSessionId();
            if (newSessionId) {
              logger.success('Session created successfully for guest user', null, 'CART');
              headers = await getAuthHeaders(isLoggedIn, newSessionId);
            }
          } catch (sessionError) {
            logger.cart('Error creating session', { 
              error: sessionError.message 
            }, 'ERROR');
          }
        }

        const payload = {
          _id: item._id,
          categoryId: item.categoryId,
          categoryName: item.categoryName,
          name: item.name,
          image: item.image,
          points: item.points,
          price: item.price,
          measurement_unit: item.measurement_unit,
          quantity: item.quantity,
        };

        if (item.categoryId) {
          logger.cart('Sending cart item with categoryId', {
            itemId: item._id,
            categoryId: item.categoryId,
            itemName: item.name
          });
        } else {
          logger.cart('WARNING: Missing categoryId in cart item', {
            itemId: item._id,
            itemName: item.name
          }, 'WARN');
        }

        const response = await fetch(BASE_URL, {
          method: "POST",
          headers,
          credentials: "include",
          body: JSON.stringify(payload),
        });

        await setSessionIdFromResponse(response);

        if (!response.ok) {
          const errorText = await response.text();
          
          if (response.status === 401) {
            logger.auth('Authentication failed - token expired', null, 'ERROR');
            await clearSession();
            cachedToken = null;
            tokenCacheTime = 0;
            throw new Error("Authentication failed - please login again");
          }

          let backendError = `HTTP ${response.status}: ${response.statusText}`;
          try {
            const errorData = JSON.parse(errorText);
            backendError = errorData.message || errorData.error || backendError;
          } catch (_parseError) {
            if (errorText && errorText.trim()) {
              backendError = errorText;
            }
          }

          logger.cart('Failed to add item to cart', {
            itemName: item.name,
            status: response.status,
            error: backendError
          }, 'ERROR');

          throw new Error(backendError);
        }

        const result = await response.json();
        logger.success('Item added to cart successfully', {
          itemName: item.name,
          categoryId: item.categoryId
        }, 'CART');

        return result;
      } catch (error) {
        logger.cart('Add item to cart failed', {
          itemName: item?.name || 'unknown',
          error: error.message
        }, 'ERROR');
        throw error;
      }
    },
    'cart-add-item'
  );
}

export async function updateCartItem(item, quantity, isLoggedIn, measurementUnit = null) {
  return measureApiCall(
    async () => {
      try {
        // Ensure we have a valid measurementUnit
        let finalMeasurementUnit = measurementUnit || item.measurement_unit;
        
        // If still null/undefined, try to infer from item.unit or default to 2 (pieces)
        if (finalMeasurementUnit === null || finalMeasurementUnit === undefined) {
          if (item.unit && typeof item.unit === 'string') {
            finalMeasurementUnit = item.unit.toUpperCase() === 'KG' ? 1 : 2;
          } else {
            finalMeasurementUnit = 2; // Default to pieces
          }
        }
        
        // Ensure it's a number
        finalMeasurementUnit = Number(finalMeasurementUnit);
        
        logger.cart('Updating cart item', {
          itemId: item._id || item.itemId,
          categoryId: item.categoryId,
          quantity,
          measurementUnit: finalMeasurementUnit,
          userType: isLoggedIn ? 'authenticated' : 'guest'
        });

        validateQuantity({ quantity, measurement_unit: finalMeasurementUnit });

        const sessionId = isLoggedIn ? null : await getSessionId();
        const headers = await getAuthHeaders(isLoggedIn, sessionId);

        // Include all required fields for creating new items
        const payload = { 
          _id: item._id || item.itemId,
          quantity, 
          measurement_unit: finalMeasurementUnit,
          // Required fields for new item creation
          categoryId: item.categoryId,
          categoryName: item.categoryName,
          name: item.name,
          image: item.image,
          points: item.points,
          price: item.price,
        };

        if (!item.categoryId) {
          logger.cart('WARNING: Missing categoryId in updateCartItem', {
            itemId: item._id || item.itemId,
            itemData: item
          }, 'WARN');
        }

        const response = await fetch(BASE_URL, {
          method: "PUT",
          headers,
          credentials: "include",
          body: JSON.stringify(payload),
        });

        await setSessionIdFromResponse(response);

        if (!response.ok) {
          const errorText = await response.text();
          logger.cart('Failed to update cart item', {
            itemId: item._id || item.itemId,
            status: response.status,
            error: errorText
          }, 'ERROR');
          throw new Error(
            `Failed to update cart item: ${response.status} ${response.statusText}`
          );
        }

        const result = await response.json();
        logger.success('Cart item updated successfully', {
          itemId: item._id || item.itemId,
          newQuantity: quantity
        }, 'CART');

        return result;
      } catch (error) {
        logger.cart('Update cart item failed', {
          itemId: item._id || item.itemId,
          error: error.message
        }, 'ERROR');
        throw error;
      }
    },
    'cart-update-item'
  );
}

export async function removeItemFromCart(itemId, isLoggedIn) {
  return measureApiCall(
    async () => {
      try {
        logger.cart('Removing item from cart', {
          itemId,
          userType: isLoggedIn ? 'authenticated' : 'guest'
        });

        const sessionId = isLoggedIn ? null : await getSessionId();
        const headers = await getAuthHeaders(isLoggedIn, sessionId);

        const response = await fetch(`${BASE_URL}/${itemId}`, {
          method: "DELETE",
          headers,
          credentials: "include",
        });

        await setSessionIdFromResponse(response);

        if (!response.ok) {
          const errorText = await response.text();
          logger.cart('Failed to remove item from cart', {
            itemId,
            status: response.status,
            error: errorText
          }, 'ERROR');
          throw new Error(
            `Failed to remove item from cart: ${response.status} ${response.statusText}`
          );
        }

        const result = await response.json();
        logger.success('Item removed from cart successfully', {
          itemId
        }, 'CART');

        return result;
      } catch (error) {
        logger.cart('Remove item from cart failed', {
          itemId,
          error: error.message
        }, 'ERROR');
        throw error;
      }
    },
    'cart-remove-item'
  );
}

export async function clearCart(isLoggedIn) {
  return measureApiCall(
    async () => {
      try {
        logger.cart('Clearing cart', {
          userType: isLoggedIn ? 'authenticated' : 'guest'
        });

        const sessionId = isLoggedIn ? null : await getSessionId();
        const headers = await getAuthHeaders(isLoggedIn, sessionId);

        const response = await fetch(`${BASE_URL}/`, {
          method: "DELETE",
          headers,
          credentials: "include",
        });

        await setSessionIdFromResponse(response);

        if (!response.ok) {
          const errorText = await response.text();
          logger.cart('Failed to clear cart', {
            status: response.status,
            error: errorText
          }, 'ERROR');
          throw new Error(
            `Failed to clear cart: ${response.status} ${response.statusText}`
          );
        }

        const result = await response.json();
        logger.success('Cart cleared successfully', null, 'CART');

        return result;
      } catch (error) {
        logger.cart('Clear cart failed', {
          error: error.message
        }, 'ERROR');
        throw error;
      }
    },
    'cart-clear'
  );
}

export async function saveCart(cartItems, isLoggedIn) {
  return measureApiCall(
    async () => {
      try {
        logger.cart('Saving entire cart', {
          itemCount: cartItems.length,
          userType: isLoggedIn ? 'authenticated' : 'guest'
        });

        const sessionId = isLoggedIn ? null : await getSessionId();
        const headers = await getAuthHeaders(isLoggedIn, sessionId);

        // Validate all items before sending
        const validatedItems = cartItems.map(item => {
          validateQuantity(item);
          return {
            _id: item._id,
            categoryId: item.categoryId,
            categoryName: item.categoryName,
            name: item.name,
            image: item.image,
            points: item.points,
            price: item.price,
            measurement_unit: item.measurement_unit,
            quantity: item.quantity,
          };
        });

        const response = await fetch(`${BASE_URL}/save`, {
          method: "POST",
          headers,
          credentials: "include",
          body: JSON.stringify({ items: validatedItems }),
        });

        await setSessionIdFromResponse(response);

        if (!response.ok) {
          const errorText = await response.text();
          
          if (response.status === 401) {
            logger.auth('Authentication failed - token expired', null, 'ERROR');
            await clearSession();
            cachedToken = null;
            tokenCacheTime = 0;
            throw new Error("Authentication failed - please login again");
          }

          let backendError = `HTTP ${response.status}: ${response.statusText}`;
          try {
            const errorData = JSON.parse(errorText);
            backendError = errorData.message || errorData.error || backendError;
          } catch (_parseError) {
            if (errorText && errorText.trim()) {
              backendError = errorText;
            }
          }

          logger.cart('Failed to save cart', {
            itemCount: cartItems.length,
            status: response.status,
            error: backendError
          }, 'ERROR');

          throw new Error(backendError);
        }

        const result = await response.json();
        logger.success('Cart saved successfully', {
          itemCount: cartItems.length
        }, 'CART');

        return result;
      } catch (error) {
        logger.cart('Save cart failed', {
          itemCount: cartItems?.length || 0,
          error: error.message
        }, 'ERROR');
        throw error;
      }
    },
    'cart-save'
  );
}
