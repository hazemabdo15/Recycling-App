import AsyncStorage from '@react-native-async-storage/async-storage';

export function getAccessToken() {
  try {
    return AsyncStorage.getItem('accessToken');
  } catch (error) {
    return null;
  }
}

export async function getAccessTokenAsync() {
  try {
    return await AsyncStorage.getItem('accessToken');
  } catch (error) {
    return null;
  }
}

export const getLoggedInUser = async () => {
  const userString = await AsyncStorage.getItem('user');
  if (userString) return JSON.parse(userString);
  return null;
};
