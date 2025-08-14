```markdown
# React Native Expo Localization Implementation Plan

## Overview
This plan outlines the steps needed to implement comprehensive localization support in the recycling app, accommodating both English and Arabic languages with proper RTL support. The implementation will handle both static UI text and dynamic content from the backend API.

## 1. Install Required Dependencies

```bash
npx expo install expo-localization expo-secure-store
npm install i18next react-i18next @formatjs/intl-pluralrules
```

## 2. Localization Structure

```
root/
├── locales/
│   ├── index.js                # i18n configuration
│   ├── languageDetector.js     # Custom language detector with persistence
│   ├── en/
│   │   ├── common.json         # Common UI elements (buttons, errors, etc.)
│   │   ├── pickup.json         # Pickup workflow strings
│   │   ├── cart.json           # Cart-related strings 
│   │   ├── profile.json        # Profile-related strings
│   │   └── categories.json     # Category browsing static strings
│   └── ar/
│       ├── [same structure as en]
```

## 3. Language Detector for Persistence

```javascript
// filepath: locales/languageDetector.js
import * as SecureStore from 'expo-secure-store';
import * as Localization from 'expo-localization';
import { I18nManager } from 'react-native';

const LANGUAGE_KEY = 'user-language';

const languageDetector = {
  type: 'languageDetector',
  async: true,
  detect: async (callback) => {
    try {
      // Try to get stored language
      const language = await SecureStore.getItemAsync(LANGUAGE_KEY);
      
      if (language) {
        return callback(language);
      }
    } catch (error) {
      console.error('Error reading language preference:', error);
    }
    
    // Fallback to device locale
    const deviceLanguage = Localization.locale.split('-')[0];
    // Only use supported languages (en, ar)
    const supportedLanguage = ['en', 'ar'].includes(deviceLanguage) ? deviceLanguage : 'en';
    return callback(supportedLanguage);
  },
  
  cacheUserLanguage: async (language) => {
    try {
      await SecureStore.setItemAsync(LANGUAGE_KEY, language);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  }
};

export default languageDetector;
```

## 4. i18n Configuration

```javascript
// filepath: locales/index.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import languageDetector from './languageDetector';
import { I18nManager } from 'react-native';
import * as Updates from 'expo-updates';

// Import translation files
import enCommon from './en/common.json';
import enPickup from './en/pickup.json';
import enCart from './en/cart.json';
import enProfile from './en/profile.json';
import enCategories from './en/categories.json';

import arCommon from './ar/common.json';
import arPickup from './ar/pickup.json';
import arCart from './ar/cart.json';
import arProfile from './ar/profile.json';
import arCategories from './ar/categories.json';

const resources = {
  en: {
    common: enCommon,
    pickup: enPickup,
    cart: enCart,
    profile: enProfile,
    categories: enCategories,
  },
  ar: {
    common: arCommon,
    pickup: arPickup,
    cart: arCart,
    profile: arProfile,
    categories: arCategories,
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    
    interpolation: {
      escapeValue: false,
    },
    
    react: {
      useSuspense: false,
    },
  });

// Handle initial RTL setup
const isRTL = i18n.language === 'ar';
if (I18nManager.isRTL !== isRTL) {
  I18nManager.forceRTL(isRTL);
  if (process.env.NODE_ENV !== 'development') {
    try {
      Updates.reloadAsync();
    } catch (error) {
      console.log('Error reloading app:', error);
    }
  }
}

export default i18n;
```

## 5. Translation Files

### English Common Strings (Example)
```json
{
  "buttons": {
    "login": "Login",
    "logout": "Logout",
    "submit": "Submit",
    "cancel": "Cancel",
    "continue": "Continue",
    "back": "Back",
    "add": "Add",
    "remove": "Remove",
    "checkout": "Checkout",
    "schedule": "Schedule Pickup"
  },
  "errors": {
    "loginRequired": "Login Required",
    "networkError": "Network Error",
    "genericError": "Something went wrong",
    "emptyCart": "Your cart is empty"
  },
  "units": {
    "kg": "KG",
    "piece": "Piece",
    "pieces": "Pieces"
  },
  "loading": "Loading...",
  "success": "Success!",
  "language": {
    "en": "English",
    "ar": "Arabic"
  },
  "points": "Points",
  "price": "EGP",
  "quantity": "Quantity"
}
```

### Arabic Common Strings (Example)
```json
{
  "buttons": {
    "login": "تسجيل الدخول",
    "logout": "تسجيل الخروج",
    "submit": "إرسال",
    "cancel": "إلغاء",
    "continue": "متابعة",
    "back": "رجوع",
    "add": "إضافة",
    "remove": "إزالة",
    "checkout": "الدفع",
    "schedule": "جدولة الاستلام"
  },
  "errors": {
    "loginRequired": "يجب تسجيل الدخول",
    "networkError": "خطأ في الشبكة",
    "genericError": "حدث خطأ ما",
    "emptyCart": "سلة التسوق فارغة"
  },
  "units": {
    "kg": "كجم",
    "piece": "قطعة",
    "pieces": "قطع"
  },
  "loading": "جاري التحميل...",
  "success": "تم بنجاح!",
  "language": {
    "en": "الإنجليزية",
    "ar": "العربية"
  },
  "points": "نقاط",
  "price": "جنيه",
  "quantity": "الكمية"
}
```

## 6. Enhanced Translation Hook

```javascript
// filepath: hooks/useTranslation.js
import { useTranslation as useI18nTranslation } from 'react-i18next';
import { I18nManager } from 'react-native';
import { useCallback } from 'react';
import * as Updates from 'expo-updates';
import * as SecureStore from 'expo-secure-store';

const LANGUAGE_KEY = 'user-language';

export const useTranslation = (namespace = 'common') => {
  const { t, i18n } = useI18nTranslation(namespace);
  
  const changeLanguage = useCallback(async (language) => {
    const isRTL = language === 'ar';
    const needsReload = isRTL !== I18nManager.isRTL;
    
    try {
      // Always save the language preference
      await SecureStore.setItemAsync(LANGUAGE_KEY, language);
      
      // Change language in i18n
      await i18n.changeLanguage(language);
      
      // If RTL setting needs to change, force it and reload
      if (needsReload) {
        I18nManager.allowRTL(isRTL);
        I18nManager.forceRTL(isRTL);
        
        // In development, alert instead of reload
        if (process.env.NODE_ENV === 'development') {
          alert('Please restart the app to apply RTL changes');
        } else {
          await Updates.reloadAsync();
        }
      }
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  }, [i18n]);
  
  const currentLanguage = i18n.language;
  const isRTL = currentLanguage === 'ar';
  
  // Helper for measurement units (based on your API responses)
  const getMeasurementUnit = useCallback((unit) => {
    return unit === 1 ? t('units.kg') : t('units.piece');
  }, [t]);
  
  return {
    t,
    changeLanguage,
    currentLanguage,
    isRTL,
    getMeasurementUnit,
  };
};
```

## 7. API Integration

```javascript
// filepath: services/api.js
import axios from 'axios';
import i18n from '../locales';

const baseURL = 'http://192.168.0.165:5000/api';

const api = axios.create({
  baseURL,
  timeout: 10000,
});

// Add language parameter to all requests
api.interceptors.request.use((config) => {
  // Get current language
  const language = i18n.language || 'en';
  
  // Add language to query parameters
  config.params = {
    ...config.params,
    lang: language,
  };
  
  return config;
});

export default api;
```

## 8. Language Switcher Component

```javascript
// filepath: components/common/LanguageSwitcher.jsx
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTranslation } from '../../hooks/useTranslation';

const LanguageSwitcher = () => {
  const { changeLanguage, currentLanguage, t } = useTranslation();
  
  const languages = [
    { code: 'en', name: t('language.en') },
    { code: 'ar', name: t('language.ar') },
  ];
  
  return (
    <View style={styles.container}>
      {languages.map((lang) => (
        <TouchableOpacity
          key={lang.code}
          style={[
            styles.button,
            currentLanguage === lang.code && styles.activeButton,
          ]}
          onPress={() => changeLanguage(lang.code)}
        >
          <Text style={[
            styles.buttonText,
            currentLanguage === lang.code && styles.activeText
          ]}>
            {lang.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  activeButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    fontSize: 14,
  },
  activeText: {
    color: 'white',
    fontWeight: 'bold',
  }
});

export default LanguageSwitcher;
```

## 9. RTL Style Utilities

```javascript
// filepath: utils/styleUtils.js
import { I18nManager } from 'react-native';
import { useTranslation } from '../hooks/useTranslation';

export const getFlexDirection = (direction = 'row') => {
  if (direction === 'row') {
    return I18nManager.isRTL ? 'row-reverse' : 'row';
  }
  return direction;
};

export const getTextAlign = (align = 'left') => {
  if (align === 'left') {
    return I18nManager.isRTL ? 'right' : 'left';
  }
  if (align === 'right') {
    return I18nManager.isRTL ? 'left' : 'right';
  }
  return align;
};

// React hook for RTL-aware styles
export const useRTLStyles = () => {
  const { isRTL } = useTranslation();
  
  return {
    flexRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
    },
    textAlign: {
      textAlign: isRTL ? 'right' : 'left',
    },
    paddingStart: (value) => ({
      [isRTL ? 'paddingRight' : 'paddingLeft']: value,
    }),
    paddingEnd: (value) => ({
      [isRTL ? 'paddingLeft' : 'paddingRight']: value,
    }),
    marginStart: (value) => ({
      [isRTL ? 'marginRight' : 'marginLeft']: value,
    }),
    marginEnd: (value) => ({
      [isRTL ? 'marginLeft' : 'marginRight']: value,
    }),
  };
};
```

## 10. App Layout Integration

```javascript
// filepath: app/_layout.jsx
import '../locales'; // Import i18n configuration
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useTranslation } from '../hooks/useTranslation';
// Import other necessary providers/contexts

export default function RootLayout() {
  const { t, isRTL } = useTranslation();
  
  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: true,
          headerBackTitle: t('buttons.back'),
          // RTL-specific navigation adjustments as needed
        }}
      />
    </SafeAreaProvider>
  );
}
```

## 11. Handling Dynamic API Content

Based on the API responses, the backend already supports localization with the `lang` parameter. Create a custom hook to handle this:

```javascript
// filepath: hooks/useLocalizedData.js
import { useState, useEffect } from 'react';
import { useTranslation } from './useTranslation';
import api from '../services/api';

export function useCategoryData(slug = null, limit = 10) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentLanguage } = useTranslation();
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const endpoint = slug 
          ? `/categories/get-items/${slug}` 
          : '/categories';
          
        const response = await api.get(endpoint, {
          params: { limit }
        });
        
        setData(response.data);
        setError(null);
      } catch (err) {
        setError(err);
        console.error('Error fetching category data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [slug, limit, currentLanguage]); // Re-fetch when language changes
  
  return { data, loading, error };
}
```

## 12. Implementation Phases

### Phase 1: Foundation (Days 1-2)
- Install dependencies
- Create folder structure
- Set up i18n configuration and language detection
- Create basic translation files with common terms

### Phase 2: API Integration (Days 3-4)
- Update API service to include language parameter
- Create custom hooks for fetching localized data
- Test API responses with different language settings

### Phase 3: Component Updates (Days 5-8)
- Implement language switcher component
- Update common components with translation support
- Update screen components one by one:
  - Category screens
  - Cart and checkout screens
  - Pickup flow screens
  - Profile and settings screens

### Phase 4: RTL Support (Days 9-10)
- Implement RTL style utilities
- Update layouts for proper RTL support
- Test navigation and UI in both LTR and RTL modes
- Fix layout issues specific to RTL mode

### Phase 5: Testing & Refinement (Days 11-12)
- Test on real devices with different languages
- Verify language persistence across app restarts
- Optimize performance if needed
- Final bug fixes and cleanup

## 13. Key Considerations

### Dynamic Content
- All API requests should include the current language parameter
- Re-fetch data when language changes
- Use translation namespaces to organize translations logically

### RTL Support
- Use RTL-aware style utilities consistently
- Test navigation, modals, and custom components in RTL mode
- Pay special attention to:
  - Lists and scrollable content
  - Icons that indicate direction
  - Input fields and form layouts

### Performance
- Load translations asynchronously
- Use namespaces to load only needed translations
- Cache translations to improve startup time

### Accessibility
- Ensure localized content maintains proper accessibility features
- Test screen readers with localized content
- Verify text scaling works properly in all languages
