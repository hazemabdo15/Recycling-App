import * as SecureStore from 'expo-secure-store';

export async function getAccessToken() {
  try {
    return await SecureStore.getItemAsync('accessToken');
  } catch {
    return null;
  }
}

export async function setAccessToken(token) {
  try {
    await SecureStore.setItemAsync('accessToken', token);

    try {
      const { default: apiService } = await import('../services/api/apiService');
      await apiService.setAccessToken(token);
      console.log('[authUtils] Token set in both SecureStore and APIService');
    } catch (error) {
      console.warn('[authUtils] Could not update APIService token:', error.message);
    }
  } catch {}
}

export async function getLoggedInUser() {
  try {
    const userString = await SecureStore.getItemAsync('user');
    if (userString) {
      const user = JSON.parse(userString);
      console.log('[authUtils] Retrieved user from SecureStore:', user);
      console.log('[authUtils] Retrieved user role:', user?.role);
      return user;
    }
    console.log('[authUtils] No user found in SecureStore');
    return null;
  } catch (error) {
    console.error('[authUtils] Error retrieving user:', error);
    return null;
  }
}

export async function setLoggedInUser(user) {
  try {
    console.log('[authUtils] Storing user in SecureStore:', user);
    console.log('[authUtils] User role being stored:', user?.role);
    if (user?.role === 'delivery') {
      const userWithStatus = { ...user, deliveryStatus: 'pending' };
      await SecureStore.setItemAsync('user', JSON.stringify(userWithStatus));
    } else {
      await SecureStore.setItemAsync('user', JSON.stringify(user));
    }
  } catch (error) {
    console.error('[authUtils] Error storing user:', error);
  }
}

export async function setDeliveryStatus(status) {
  try  {
    const user = await getLoggedInUser();
    if (user) {
      user.deliveryStatus = status;
      await setLoggedInUser(user);
      console.log('[authUtils] Delivery status updated:', status);
    } else {
      console.warn('[authUtils] No user found to update delivery status');
    }
  } catch (error) {
    console.error('[authUtils] Error updating delivery status:', error);
  }
}

export async function clearSession() {
  try {
    await SecureStore.deleteItemAsync('user');
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('sessionId');
  } catch {}
}
