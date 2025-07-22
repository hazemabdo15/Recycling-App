import AsyncStorage from '@react-native-async-storage/async-storage';

export function getAccessToken() {
  try {

    return AsyncStorage.getItem('accessToken');
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
}

export async function getAccessTokenAsync() {
  try {
    return await AsyncStorage.getItem('accessToken');
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
}
