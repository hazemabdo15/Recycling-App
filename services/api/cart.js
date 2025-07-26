import AsyncStorage from "@react-native-async-storage/async-storage";
import { validateQuantity } from "../../utils/cartUtils.js";
import { BASE_URLS } from "./config";

const BASE_URL = BASE_URLS.CART;

let cachedToken = null;
let tokenCacheTime = 0;
const TOKEN_CACHE_DURATION = 30000;

export async function clearAuthData() {
  try {
    await AsyncStorage.removeItem("accessToken");
    await AsyncStorage.removeItem("sessionId");
    cachedToken = null;
    tokenCacheTime = 0;
  } catch (_err) {
    console.error("[cart API] Error clearing auth data:", _err.message);
  }
}

async function getSessionId() {
  try {
    const sessionId = await AsyncStorage.getItem("sessionId");
    console.log(
      "[cart API] Retrieved sessionId:",
      sessionId ? "Session found" : "No session"
    );
    return sessionId;
  } catch (_err) {
    console.error("[cart API] Error retrieving sessionId:", _err.message);
    return null;
  }
}

async function getAccessToken() {
  try {
    const now = Date.now();
    if (cachedToken && now - tokenCacheTime < TOKEN_CACHE_DURATION) {
      if (isTokenExpired(cachedToken)) {
        console.warn("[cart API] Cached token has expired, clearing cache");
        cachedToken = null;
        tokenCacheTime = 0;
      } else {
        return cachedToken;
      }
    }

    const token = await AsyncStorage.getItem("accessToken");
    if (token && !isTokenExpired(token)) {
      cachedToken = token;
      tokenCacheTime = now;
      return token;
    }

    cachedToken = null;
    tokenCacheTime = 0;
    return null;
  } catch (_err) {
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
            const isoDecoded = new TextDecoder("iso-8859-1").decode(uint8Array);
            decoded = isoDecoded;
          } else {
            decoded = result;
          }
        }
      } catch (_e) {
        return true;
      }
    }

    const payload = JSON.parse(decoded);
    const currentTime = Math.floor(Date.now() / 1000);

    if (Math.random() < 0.1) {

      console.log("[cart API] Token expiration check:", {
        currentTime,
        tokenExp: payload.exp,
        isExpired: currentTime >= payload.exp,
        timeUntilExpiry: payload.exp - currentTime,
      });
    }

    return currentTime >= payload.exp;
  } catch (_err) {
    console.error("[cart API] Error checking token expiration:", _err.message);
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
      }
    }

    try {
      const responseClone = response.clone();
      const responseData = await responseClone.json();
      if (responseData.sessionId) {
        await AsyncStorage.setItem("sessionId", responseData.sessionId);
      }
    } catch (_parseErr) {

    }
  } catch (_err) {
    console.error("[cart API] Error setting sessionId:", _err.message);
  }
}

async function getAuthHeaders(isLoggedIn, sessionId) {
  const headers = { "Content-Type": "application/json" };
  if (isLoggedIn) {
    const token = await getAccessToken();
    console.log(
      "[cart API] Retrieved access token:",
      token ? "Token found" : "No token"
    );
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    } else {
      console.warn(
        "[cart API] No valid token found - user may need to re-authenticate"
      );
    }
  } else if (sessionId) {
    headers["Cookie"] = `sessionId=${sessionId}`;
    console.log("[cart API] Using session cookie for guest user");
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[cart API] Final headers:", headers);
  }

  return headers;
}

export async function getCart(isLoggedIn) {
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

    return await response.json();
  } catch (error) {
    console.error("[cart API] getCart error:", error.message);
    throw error;
  }
}

export async function addItemToCart(item, isLoggedIn) {
  try {
    console.log("[cart API] addItemToCart - Starting request for:", item.name);


    validateQuantity(item);

    const sessionId = isLoggedIn ? null : await getSessionId();
    let headers = await getAuthHeaders(isLoggedIn, sessionId);

    if (!isLoggedIn && !sessionId) {
      console.log(
        "[cart API] No sessionId found for guest user, attempting to create session..."
      );
      try {
        const sessionResponse = await fetch(BASE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        await setSessionIdFromResponse(sessionResponse);
        const newSessionId = await getSessionId();
        if (newSessionId) {
          console.log("[cart API] Session created successfully");
          headers = await getAuthHeaders(isLoggedIn, newSessionId);
        }
      } catch (sessionError) {
        console.error(
          "[cart API] Error creating session:",
          sessionError.message
        );
      }
    }

    const fixedPayload = {
      categoryId: item.categoryId,
      categoryName: item.categoryName,
      itemName: item.name,
      image: item.image,
      points: item.points,
      price: item.price,
      measurement_unit: item.measurement_unit,
      quantity: item.quantity,
    };

    console.log("[cart API] Sending request with payload for:", item.name);

    const response = await fetch(BASE_URL, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify(fixedPayload),
    });

    await setSessionIdFromResponse(response);

    console.log("[cart API] addItemToCart - Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[cart API] addItemToCart - Error response:", errorText);

      if (response.status === 401) {
        console.error(
          "[cart API] Authentication failed - token may be expired"
        );
        await AsyncStorage.removeItem("accessToken");
        cachedToken = null;
        tokenCacheTime = 0;
        throw new Error("Authentication failed - please login again");
      }

      let backendError = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.message) {
          backendError = errorData.message;
        } else if (errorData.error) {
          backendError = errorData.error;
        }
      } catch (_parseError) {
        if (errorText && errorText.trim()) {
          backendError = errorText;
        }
      }

      throw new Error(backendError);
    }

    const result = await response.json();
    console.log("✅ [cart API] addItemToCart - Successfully added:", item.name);

    return result;
  } catch (error) {
    console.warn(
      "[cart API] addItemToCart error for",
      item?.name || "unknown item",
      ":",
      error.message
    );
    throw error;
  }
}

export async function updateCartItem(
  categoryId,
  quantity,
  isLoggedIn,
  measurementUnit = null
) {
  try {

    validateQuantity({ quantity, measurement_unit: measurementUnit });

    const sessionId = isLoggedIn ? null : await getSessionId();
    const headers = await getAuthHeaders(isLoggedIn, sessionId);

    console.log('[cart API] updateCartItem - Payload:', { quantity, measurement_unit: measurementUnit });

    const response = await fetch(BASE_URL, {
      method: "PUT",
      headers,
      credentials: "include",
      body: JSON.stringify({ quantity, measurement_unit: measurementUnit, categoryId }),
    });

    await setSessionIdFromResponse(response);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[cart API] updateCartItem error:", errorText);
      throw new Error(
        `Failed to update cart item: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("[cart API] updateCartItem error:", error.message);
    throw error;
  }
}

export async function removeItemFromCart(categoryId, isLoggedIn) {
  try {
    const sessionId = isLoggedIn ? null : await getSessionId();
    const headers = await getAuthHeaders(isLoggedIn, sessionId);

    const response = await fetch(`${BASE_URL}/${categoryId}`, {
      method: "DELETE",
      headers,
      credentials: "include",
    });

    await setSessionIdFromResponse(response);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[cart API] removeItemFromCart error:", errorText);
      throw new Error(
        `Failed to remove item from cart: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("[cart API] removeItemFromCart error:", error.message);
    throw error;
  }
}

export async function clearCart(isLoggedIn) {
  try {
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
      console.error("[cart API] clearCart error:", errorText);
      throw new Error(
        `Failed to clear cart: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("[cart API] clearCart error:", error.message);
    throw error;
  }
}
