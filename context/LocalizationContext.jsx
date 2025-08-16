import { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18next from '../localization/i18n';
import { changeLanguage as handleLanguageChange } from '../localization/languageUtils';
import { getRoleBasedTranslation } from '../localization/roleBasedTranslation';

// RTL languages list (should match the one in languageUtils.js)
const RTL_LANGUAGES = ['ar', 'he', 'ur'];

const LocalizationContext = createContext();

export const useLocalization = () => {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
};

export function LocalizationProvider({ children }) {
  const { t } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18next.language);
  
  // Calculate RTL based on current language instead of just I18nManager.isRTL
  const isLanguageRTL = RTL_LANGUAGES.includes(currentLanguage);
  const [isRTL, setIsRTL] = useState(isLanguageRTL);

  useEffect(() => {
    const languageChangedListener = (lng) => {
      console.log('Language changed to:', lng);
      setCurrentLanguage(lng);
      
      // Update RTL state based on the new language
      const newIsRTL = RTL_LANGUAGES.includes(lng);
      setIsRTL(newIsRTL);
      console.log('RTL state updated to:', newIsRTL);
    };
    
    // Listen for language changes from i18next
    i18next.on('languageChanged', languageChangedListener);

    // Cleanup listener on unmount
    return () => {
      i18next.off('languageChanged', languageChangedListener);
    };
  }, []);

  const value = {
    t,
    tRole: getRoleBasedTranslation, // New function for role-based translations
    currentLanguage,
    isRTL,
    changeLanguage: handleLanguageChange, // Use the utility function directly
  };

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
}
