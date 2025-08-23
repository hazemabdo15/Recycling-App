import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import { Alert, I18nManager } from 'react-native';
import i18next from './i18n';

const RTL_LANGUAGES = ['ar', 'he', 'ur'];
const LANGUAGE_KEY = 'selected_language';

export const isRTL = (language) => {
  return RTL_LANGUAGES.includes(language);
};

export const saveLanguage = async (language) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, language);
  } catch (error) {
    console.error('Failed to save language', error);
  }
};

export const getStoredLanguage = async () => {
  try {
    const language = await AsyncStorage.getItem(LANGUAGE_KEY);
    return language;
  } catch (error) {
    console.error('Failed to get stored language', error);
    return null;
  }
};

export const changeLanguage = async (lng) => {
  try {
    // 1. Save the language preference
    await saveLanguage(lng);
    
    // 2. Change i18next language for text translations
    await i18next.changeLanguage(lng);
    
    // 3. Determine if the new language requires RTL layout
    const isNewLangRTL = isRTL(lng);

    // 4. Always force RTL change to ensure it takes effect
    I18nManager.forceRTL(isNewLangRTL);
    
    Alert.alert(
      "Language Changed",
      "The app will reload to apply the language and layout changes. You will be returned to your previous screen.",
      [{
        text: "Reload Now",
        onPress: async () => {
          try {
            // In production, this reloads the app automatically
            if (!__DEV__) {
              await Updates.reloadAsync();
            } 
            // else {
            //   // In development, guide the user to reload manually
            //   Alert.alert(
            //     "Development Mode",
            //     "Please manually reload the app from the Expo developer menu:\n\n" +
            //     "• Shake device or press:\n" +
            //     "• iOS: ⌘ + D\n" +
            //     "• Android: ⌘ + M (Mac) / Ctrl + M (Windows)\n" +
            //     "• Then select 'Reload'",
            //     [{
            //       text: "OK",
            //       onPress: () => {
            //         // Force exit the app in development to ensure clean reload
            //         if (__DEV__) {
            //           console.log('Language changed to:', lng, 'RTL:', isNewLangRTL);
            //         }
            //       }
            //     }]
            //   );
            // }
          } catch (error) {
            console.error('Failed to reload app', error);
          }
        }
        }]
      );
  } catch (error) {
    console.error('Language change failed', error);
  }
};export const getCurrentLanguage = () => {
  return i18next.language;
};
