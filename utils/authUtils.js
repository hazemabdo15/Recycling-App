import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getAccessToken() {
  try {
    return await AsyncStorage.getItem('accessToken');
  } catch {
    return null;
  }
}

export async function setAccessToken(token) {
  try {
    await AsyncStorage.setItem('accessToken', token);
    
    // Also update the APIService instance
    try {
      const { default: apiService } = await import('../services/api/apiService');
      await apiService.setAccessToken(token);
      console.log('[authUtils] Token set in both AsyncStorage and APIService');
    } catch (error) {
      console.warn('[authUtils] Could not update APIService token:', error.message);
    }
  } catch {}
}

export async function getLoggedInUser() {
  try {
    const userString = await AsyncStorage.getItem('user');
    if (userString) {
      const user = JSON.parse(userString);
      console.log('[authUtils] Retrieved user from AsyncStorage:', user);
      console.log('[authUtils] Retrieved user role:', user?.role);
      return user;
    }
    console.log('[authUtils] No user found in AsyncStorage');
    return null;
  } catch (error) {
    console.error('[authUtils] Error retrieving user:', error);
    return null;
  }
}

export async function setLoggedInUser(user) {
  try {
    console.log('[authUtils] Storing user in AsyncStorage:', user);
    console.log('[authUtils] User role being stored:', user?.role);
    await AsyncStorage.setItem('user', JSON.stringify(user));
  } catch (error) {
    console.error('[authUtils] Error storing user:', error);
  }
}

export async function clearSession() {
  try {
    await AsyncStorage.multiRemove(['user', 'accessToken', 'sessionId']);
  } catch {}
}
