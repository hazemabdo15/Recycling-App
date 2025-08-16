import { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { I18nManager } from 'react-native';
import i18next from '../localization/i18n';
import { changeLanguage as handleLanguageChange } from '../localization/languageUtils';
import { getRoleBasedTranslation } from '../localization/roleBasedTranslation';

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
  const [isRTL, setIsRTL] = useState(I18nManager.isRTL);

  useEffect(() => {
    const languageChangedListener = (lng) => {
      setCurrentLanguage(lng);
      setIsRTL(I18nManager.isRTL);
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
