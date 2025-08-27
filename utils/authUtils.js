import * as SecureStore from 'expo-secure-store';
// Removed circular dependency: import apiService from '../services/api/apiService';

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

    // Removed circular dependency call: apiService.setAccessToken(token)
    // The API service will get the token when needed via getAccessToken()
  } catch {}
}

export async function getLoggedInUser() {
  try {
    const userString = await SecureStore.getItemAsync('user');
    if (userString) {
      const user = JSON.parse(userString);
      return user;
    }
    return null;
  } catch (_error) {
    return null;
  }
}

export async function setLoggedInUser(user, deliveryStatus = null) {
  try {
    if (user?.role === 'delivery') {
      const userWithStatus = {
        ...user, 
        deliveryStatus: deliveryStatus || user.deliveryStatus || 'pending' 
      };
      await SecureStore.setItemAsync('user', JSON.stringify(userWithStatus));
      console.log('[authUtils] Stored delivery user with status:', userWithStatus.deliveryStatus);
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
