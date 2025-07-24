import AsyncStorage from '@react-native-async-storage/async-storage';
import { validateQuantity } from '../../utils/cartUtils.js';
import { API_ENDPOINTS, BASE_URLS } from './config';

const BASE_URL = BASE_URLS.CART;

// Token caching variables
import AsyncStorage from '@react-native-async-storage/async-storage';
import { validateQuantity } from '../../utils/cartUtils.js';
import { API_ENDPOINTS, BASE_URLS } from './config';

const BASE_URL = BASE_URLS.CART;

// Token caching variables
let cachedToken = null;
let tokenCacheTime = 0;

export async function clearAuthData() {
  try {
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('sessionId');
    cachedToken = null;
    tokenCacheTime = 0;
  } catch (_err) {
    console.error('[cart API] Error clearing auth data:', _err.message);
  }
} tokenCacheTime = 0;

export async function clearAuthData() {
  try {
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('sessionId');
    cachedToken = null;
    tokenCacheTime = 0;
  } catch (_err) {
    console.error('[cart API] Error clearing auth data:', _err.message);
  }
}
export async function testMinimalPost(isLoggedIn) {
  try {
    const sessionId = isLoggedIn ? null : await getSessionId();
    const headers = await getAuthHeaders(isLoggedIn, sessionId);
    
    console.log('[cart API] Testing minimal POST request...');

    const testPayloads = [

      { categoryId: "687d76ddba6a94b1537a1aed", quantity: 1 },

      { categoryId: "687d76ddba6a94b1537a1aed", quantity: 1, measurement_unit: 1 },

      { id: "687d76ddba6a94b1537a1aed", quantity: 1 },

      { categoryId: "687d76ddba6a94b1537a1aed", image: "https://res.cloudinary.com/dyz4a4ume/image/upload/v1753052721/recycling/subcategories/image/gqm4f6ivbryfmlvykeue.png", measurement_unit: 1, name: "shredded paper", points: 110, price: 5, quantity: 1 }
    ];
    
    for (let i = 0; i < testPayloads.length; i++) {
      const testItem = testPayloads[i];
      console.log(`[cart API] Testing payload format ${i + 1}:`, testItem);
      
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(testItem),
      });
      
      console.log(`[cart API] Test POST ${i + 1} - Response:`, {
        status: response.status,
        statusText: response.statusText
      });
      
      const responseText = await response.text();
      console.log(`[cart API] Test POST ${i + 1} - Response body:`, responseText);
      
      if (response.ok) {
        console.log(`[cart API] SUCCESS with payload format ${i + 1}!`);
        return true;
      }
    }
    
    return false;
  } catch (_err) {
    console.error('[cart API] Test POST failed:', _err.message);
    return false;
  }
}
export async function testBackendConnectivity() {
  try {
    console.log('[cart API] Testing backend connectivity to:', BASE_URL);

    const response = await fetch(API_ENDPOINTS.CATEGORIES, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('[cart API] Connectivity test response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    if (response.ok) {
      const result = await response.text();
      console.log('[cart API] Connectivity test result:', result);
    } else {
      const errorText = await response.text();
      console.error('[cart API] Connectivity test failed:', errorText);
    }
    
    return response.ok;
  } catch (_err) {
    console.error('[cart API] Backend connectivity test failed:', _err.message);
    return false;
  }
}

async function getSessionId() {
  try {
    const sessionId = await AsyncStorage.getItem('sessionId');
    return sessionId;
  } catch (_err) {
    return null;
  }
}

const TOKEN_CACHE_DURATION = 30000;

async function getAccessToken() {
  try {
    const now = Date.now();
    if (cachedToken && (now - tokenCacheTime) < TOKEN_CACHE_DURATION) {

      if (isTokenExpired(cachedToken)) {
        console.warn('[cart API] Cached token has expired, clearing cache');
        cachedToken = null;
        tokenCacheTime = 0;
        return null;
      }
      return cachedToken;
    }
    
    const token = await AsyncStorage.getItem('accessToken');
    if (token && isTokenExpired(token)) {
      console.warn('[cart API] Stored token has expired, removing from storage');
      await AsyncStorage.removeItem('accessToken');
      return null;
    }
    
    cachedToken = token;
    tokenCacheTime = now;
    return token;
  } catch (_err) {
    return null;
  }
}

function isTokenExpired(token) {
  try {
    if (!token) return true;

    const parts = token.split('.');
    if (parts.length !== 3) return true;
    
    const base64Payload = parts[1];

    const paddedPayload = base64Payload + '='.repeat((4 - base64Payload.length % 4) % 4);

    let decoded = '';
    try {

      if (typeof atob !== 'undefined') {
        decoded = atob(paddedPayload);
      } else {

        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        let result = '';
        for (let i = 0; i < paddedPayload.length; i += 4) {
          const chunk = paddedPayload.slice(i, i + 4);
          let num = 0;
          for (let j = 0; j < chunk.length; j++) {
            if (chunk[j] !== '=') {
              num = (num << 6) | chars.indexOf(chunk[j]);
            }
          }
          for (let j = 16; j >= 0; j -= 8) {
            if (((num >> j) & 255) !== 0 || j === 0) {
              result += String.fromCharCode((num >> j) & 255);
            }
          }
        }
        decoded = result;
      }
    } catch (_e) {
      return true;
    }
    
    const payload = JSON.parse(decoded);
    const currentTime = Math.floor(Date.now() / 1000);
    
    return currentTime >= payload.exp;
  } catch (_err) {
    console.error('[cart API] Error checking token expiration:', _err.message);
    return true;
  }
}

async function setSessionIdFromResponse(response) {
  try {
    const setCookie = response.headers.get('set-cookie') || response.headers.get('Set-Cookie');
    
    if (setCookie) {
      const sessionMatch = setCookie.match(/sessionId=([^;,\s]+)/) || setCookie.match(/connect\.sid=([^;,\s]+)/);
      if (sessionMatch) {
        const sessionId = sessionMatch[1];
        await AsyncStorage.setItem('sessionId', sessionId);
      }
    }

    try {
      const responseClone = response.clone();
      const responseData = await responseClone.json();
      if (responseData.sessionId) {
        await AsyncStorage.setItem('sessionId', responseData.sessionId);
      }
    } catch (_parseErr) {
      // Ignore parsing errors
    }
  } catch (_err) {
    console.error('[cart API] Error setting sessionId:', _err.message);
  }
}

async function getAuthHeaders(isLoggedIn, sessionId) {
  const headers = { 'Content-Type': 'application/json' };
  if (isLoggedIn) {
    const token = await getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  } else if (sessionId) {
    headers['Cookie'] = `sessionId=${sessionId}`;
  }
  return headers;
}

export async function getCart(isLoggedIn) {
  try {
    const sessionId = isLoggedIn ? null : await getSessionId();
    const headers = await getAuthHeaders(isLoggedIn, sessionId);
    const response = await fetch(BASE_URL, { method: 'GET', headers, credentials: 'include' });
    
    if (!response.ok) {
      console.warn(`[cart API] getCart failed with status ${response.status}, returning empty cart`);
      return { items: [] };
    }
    
    await setSessionIdFromResponse(response);
    const cartData = await response.json();
    return cartData;
  } catch (error) {
    console.warn('[cart API] getCart network error, returning empty cart:', error.message);
    return { items: [] };
  }
}

export async function addItemToCart(item, isLoggedIn) {
  try {
    // Validate quantity before sending request
    validateQuantity(item);
    
    const sessionId = isLoggedIn ? null : await getSessionId();
    let headers = await getAuthHeaders(isLoggedIn, sessionId);

    if (!isLoggedIn && !sessionId) {
      console.log('[cart API] No sessionId found for guest user, attempting to create session...');
      try {
        const sessionResponse = await fetch(BASE_URL, { 
          method: 'GET', 
          headers: { 'Content-Type': 'application/json' }, 
          credentials: 'include' 
        });
        await setSessionIdFromResponse(sessionResponse);
        const newSessionId = await getSessionId();
        if (newSessionId) {
          headers = await getAuthHeaders(isLoggedIn, newSessionId);
        }
      } catch (sessionError) {
        console.error('[cart API] Error creating session:', sessionError.message);
      }
    }
    
    // Fixed payload structure according to backend API requirements
    const fixedPayload = {
      categoryId: item.categoryId,
      categoryName: item.categoryName, // Required by backend
      itemName: item.name, // Backend expects itemName, not name
      image: item.image,
      points: item.points,
      price: item.price,
      measurement_unit: item.measurement_unit,
      quantity: item.quantity
    };
    
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(fixedPayload),
    });
    
    await setSessionIdFromResponse(response);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[cart API] addItemToCart - Error response:', errorText);

      if (response.status === 401) {
        console.error('[cart API] Authentication failed - token may be expired');
        await AsyncStorage.removeItem('accessToken');
        cachedToken = null;
        tokenCacheTime = 0;
        throw new Error('Authentication failed - please login again');
      }
      
      // Try to parse backend error message
      let backendError = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.message) {
          backendError = errorData.message;
        } else if (errorData.error) {
          backendError = errorData.error;
        }
      } catch (_parseError) {
        // If parsing fails, use the raw error text
        if (errorText && errorText.trim()) {
          backendError = errorText;
        }
      }
      
      throw new Error(backendError);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.warn('[cart API] addItemToCart error:', error.message);
    throw error;
  }
}

export async function updateCartItem(categoryId, quantity, isLoggedIn, measurementUnit = null) {
  try {
    // If measurement unit is provided, validate quantity
    if (measurementUnit !== null) {
      validateQuantity({ quantity, measurement_unit: measurementUnit });
    }
    
    const sessionId = isLoggedIn ? null : await getSessionId();
    const headers = await getAuthHeaders(isLoggedIn, sessionId);
  
    console.log('🔄 [cart API] updateCartItem - Request:', {
      categoryId,
      quantity,
      isLoggedIn,
      measurementUnit,
      headers,
      url: BASE_URL
    });
    
    console.log(`📝 [cart API] UPDATING: ${categoryId} to quantity ${quantity}`);
    
    const response = await fetch(BASE_URL, {
      method: 'PUT',
      headers,
      credentials: 'include',
      body: JSON.stringify({ categoryId, quantity }),
    });
    
    console.log('📊 [cart API] updateCartItem - Response status:', response.status);
    
    await setSessionIdFromResponse(response);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [cart API] updateCartItem - Error response:', errorText);
      console.error('❌ [cart API] updateCartItem - Full request details:', {
        method: 'PUT',
        url: BASE_URL,
        headers,
        body: JSON.stringify({ categoryId, quantity }),
        status: response.status,
        statusText: response.statusText
      });

      if (response.status === 401) {
        console.error('🔒 [cart API] Authentication failed - token may be expired');
        await AsyncStorage.removeItem('accessToken');
        cachedToken = null;
        tokenCacheTime = 0;
        throw new Error('Authentication failed - please login again');
      }
      
      // Try to parse backend error message
      let backendError = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.message) {
          backendError = errorData.message;
        } else if (errorData.error) {
          backendError = errorData.error;
        }
      } catch (_parseError) {
        // If parsing fails, use the raw error text
        if (errorText && errorText.trim()) {
          backendError = errorText;
        }
      }
      
      throw new Error(backendError);
    }
    
    const result = await response.json();
    console.log('✅ [cart API] updateCartItem - Success response:', result);

    if (result.items && Array.isArray(result.items)) {
      console.log('🔍 [cart API] Updated cart items:');
      result.items.forEach(item => {
        console.log(`   - ${item.categoryId}: ${item.quantity} (${item.itemName || item.name})`);
      });
    }
    
    return result;
  } catch (error) {
    console.warn('[cart API] updateCartItem error:', error.message);
    throw error;
  }
}

export async function removeCartItem(categoryId, isLoggedIn) {
  try {
    const sessionId = isLoggedIn ? null : await getSessionId();
    const headers = await getAuthHeaders(isLoggedIn, sessionId);
    const response = await fetch(`${BASE_URL}/${categoryId}`, {
      method: 'DELETE',
      headers,
      credentials: 'include',
    });
    
    if (!response.ok) {
      console.warn(`[cart API] removeCartItem failed with status ${response.status} for item ${categoryId}`);
      return { success: false, error: `Failed to remove item: ${response.status}` };
    }
    
    await setSessionIdFromResponse(response);
    return await response.json();
  } catch (error) {
    console.warn('[cart API] removeCartItem network error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function clearCart(isLoggedIn) {
  try {
    const sessionId = isLoggedIn ? null : await getSessionId();
    const headers = await getAuthHeaders(isLoggedIn, sessionId);
    const response = await fetch(BASE_URL, {
      method: 'DELETE',
      headers,
      credentials: 'include',
    });
    
    if (!response.ok) {
      console.warn(`[cart API] clearCart failed with status ${response.status}`);
      return { success: false, error: `Failed to clear cart: ${response.status}` };
    }
    
    await setSessionIdFromResponse(response);
    return await response.json();
  } catch (error) {
    console.warn('[cart API] clearCart network error:', error.message);
    return { success: false, error: error.message };
  }
}
