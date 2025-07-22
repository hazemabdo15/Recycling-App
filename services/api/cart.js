import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://192.168.1.11:5000/api/cart';

export async function clearAuthData() {
  try {
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('sessionId');
    cachedToken = null;
    tokenCacheTime = 0;
    console.log('[cart API] All authentication data cleared');
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
    const response = await fetch(BASE_URL.replace('/cart', '/health') || 'http://192.168.0.165:5000/api/health', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('[cart API] Health check response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    if (response.ok) {
      const result = await response.text();
      console.log('[cart API] Health check result:', result);
    } else {
      const errorText = await response.text();
      console.error('[cart API] Health check failed:', errorText);
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
    console.log('[cart API] Retrieved sessionId:', sessionId ? 'Session found' : 'No session');
    return sessionId;
  } catch (_err) {
    console.error('[cart API] Error retrieving sessionId:', _err.message);
    return null;
  }
}

let cachedToken = null;
let tokenCacheTime = 0;
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
    
    console.log('[cart API] Token expiration check:', {
      currentTime,
      tokenExp: payload.exp,
      isExpired: currentTime >= payload.exp,
      timeUntilExpiry: payload.exp - currentTime
    });
    
    return currentTime >= payload.exp;
  } catch (_err) {
    console.error('[cart API] Error checking token expiration:', _err.message);
    return true;
  }
}

async function setSessionIdFromResponse(response) {
  try {

    const setCookie = response.headers.get('set-cookie') || response.headers.get('Set-Cookie');
    console.log('[cart API] Response set-cookie header:', setCookie);
    
    if (setCookie) {

      const sessionMatch = setCookie.match(/sessionId=([^;,\s]+)/) || setCookie.match(/connect\.sid=([^;,\s]+)/);
      if (sessionMatch) {
        const sessionId = sessionMatch[1];
        await AsyncStorage.setItem('sessionId', sessionId);
        console.log('[cart API] SessionId stored:', sessionId);
      } else {
        console.warn('[cart API] No sessionId found in set-cookie header');
      }
    }

    try {
      const responseClone = response.clone();
      const responseData = await responseClone.json();
      if (responseData.sessionId) {
        await AsyncStorage.setItem('sessionId', responseData.sessionId);
        console.log('[cart API] SessionId from response body stored:', responseData.sessionId);
      }
    } catch (_parseErr) {

    }
  } catch (_err) {

    console.error('[cart API] Error setting sessionId:', _err.message);
  }
}

async function getAuthHeaders(isLoggedIn, sessionId) {
  const headers = { 'Content-Type': 'application/json' };
  if (isLoggedIn) {
    const token = await getAccessToken();
    console.log('[cart API] Retrieved access token:', token ? 'Token found' : 'No token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      console.warn('[cart API] No valid token found - user may need to re-authenticate');

    }
  } else if (sessionId) {
    headers['Cookie'] = `sessionId=${sessionId}`;
  }
  console.log('[cart API] Final headers:', headers);
  return headers;
}

export async function getCart(isLoggedIn) {
  const sessionId = isLoggedIn ? null : await getSessionId();
  const headers = await getAuthHeaders(isLoggedIn, sessionId);
  const response = await fetch(BASE_URL, { method: 'GET', headers, credentials: 'include' });
  await setSessionIdFromResponse(response);
  return response.json();
}

export async function addItemToCart(item, isLoggedIn) {
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
        console.log('[cart API] Session created successfully:', newSessionId);
        headers = await getAuthHeaders(isLoggedIn, newSessionId);
      } else {
        console.warn('[cart API] Failed to create session for guest user');
      }
    } catch (sessionError) {
      console.error('[cart API] Error creating session:', sessionError.message);
    }
  }
  
  console.log('[cart API] addItemToCart - Request:', {
    item,
    isLoggedIn,
    headers,
    url: BASE_URL
  });

  const fixedPayload = {
    categoryId: item.categoryId,
    itemName: item.name,
    image: item.image,
    points: item.points,
    price: item.price,
    measurement_unit: item.measurement_unit,
    quantity: item.quantity
  };
  
  console.log('[cart API] FIXED: Using correct field names:', fixedPayload);
  
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify(fixedPayload),
  });
  
  console.log('[cart API] addItemToCart - Response status:', response.status);
  console.log('[cart API] addItemToCart - Response headers:', Object.fromEntries(response.headers.entries()));
  
  await setSessionIdFromResponse(response);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[cart API] addItemToCart - Error response:', errorText);
    console.error('[cart API] addItemToCart - Full request details:', {
      method: 'POST',
      url: BASE_URL,
      headers,
      body: JSON.stringify(item),
      status: response.status,
      statusText: response.statusText
    });

    if (response.status === 401) {
      console.error('[cart API] Authentication failed - token may be expired');

      await AsyncStorage.removeItem('accessToken');
      cachedToken = null;
      tokenCacheTime = 0;
      throw new Error('Authentication failed - please login again');
    }
    
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }
  
  const result = await response.json();
  console.log('✅ [cart API] addItemToCart - Success response:', result);

  if (result.items && Array.isArray(result.items)) {
    console.log('🔍 [cart API] Current cart after adding item:');
    result.items.forEach(item => {
      console.log(`   - ${item.categoryId}: ${item.quantity} (${item.itemName || item.name})`);
    });
  }
  
  return result;
}

export async function updateCartItem(categoryId, quantity, isLoggedIn) {
  const sessionId = isLoggedIn ? null : await getSessionId();
  const headers = await getAuthHeaders(isLoggedIn, sessionId);
  
  console.log('🔄 [cart API] updateCartItem - Request:', {
    categoryId,
    quantity,
    isLoggedIn,
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
    
    throw new Error(`HTTP ${response.status}: ${errorText}`);
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
}

export async function removeCartItem(categoryId, isLoggedIn) {
  const sessionId = isLoggedIn ? null : await getSessionId();
  const headers = await getAuthHeaders(isLoggedIn, sessionId);
  const response = await fetch(`${BASE_URL}/${categoryId}`, {
    method: 'DELETE',
    headers,
    credentials: 'include',
  });
  await setSessionIdFromResponse(response);
  return response.json();
}

export async function clearCart(isLoggedIn) {
  const sessionId = isLoggedIn ? null : await getSessionId();
  const headers = await getAuthHeaders(isLoggedIn, sessionId);
  const response = await fetch(BASE_URL, {
    method: 'DELETE',
    headers,
    credentials: 'include',
  });
  await setSessionIdFromResponse(response);
  return response.json();
}
