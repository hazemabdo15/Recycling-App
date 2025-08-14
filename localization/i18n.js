import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager } from 'react-native';
import ar from './languages/ar';
import en from './languages/en';

const resources = {
  en: { translation: en },
  ar: { translation: ar }
};

const LANGUAGE_KEY = 'selected_language';

// Get device locale, fallback to 'en' if not available
const deviceLocale = Localization.getLocales()[0]?.languageCode || 'en';

// Function to get stored language or device default
const getInitialLanguage = async () => {
  try {
    const storedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (storedLanguage && resources[storedLanguage]) {
      console.log('Using stored language:', storedLanguage);
      return storedLanguage;
    }
    console.log('Using device locale:', deviceLocale);
    return deviceLocale;
  } catch (_error) {
    console.log('Error getting stored language, using device locale:', deviceLocale);
    return deviceLocale;
  }
};

// Initialize i18next
const initI18n = async () => {
  const initialLanguage = await getInitialLanguage();
  
  // Set RTL based on initial language
  const isRTLLanguage = ['ar', 'he', 'ur'].includes(initialLanguage);
  if (isRTLLanguage !== I18nManager.isRTL) {
    I18nManager.forceRTL(isRTLLanguage);
  }
  
  return i18next
    .use(initReactI18next)
    .init({
      resources,
      lng: initialLanguage,
      fallbackLng: 'en',
      compatibilityJSON: 'v3',
      interpolation: {
        escapeValue: false, // React already protects from XSS
      },
      react: {
        useSuspense: false, // Important for async initialization
      },
    });
};

// Initialize the i18n system
initI18n().catch(console.error);

export default i18next;
