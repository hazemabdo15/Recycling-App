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
  } catch {}
}

export async function getLoggedInUser() {
  try {
    const userString = await AsyncStorage.getItem('user');
    if (userString) return JSON.parse(userString);
    return null;
  } catch {
    return null;
  }
}

export async function setLoggedInUser(user) {
  try {
    await AsyncStorage.setItem('user', JSON.stringify(user));
  } catch {}
}

export async function clearSession() {
  try {
    await AsyncStorage.multiRemove(['user', 'accessToken']);
  } catch {}
}
