import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useLocalization } from '../../context/LocalizationContext';
import { colors } from '../../styles/theme';

export default function LanguageSelector({ style, iconColor = colors.white, textColor = colors.white }) {
  const { currentLanguage, changeLanguage } = useLocalization();

  const handleLanguageToggle = () => {
    const newLanguage = currentLanguage === 'en' ? 'ar' : 'en';
    changeLanguage(newLanguage);
  };

  const getDisplayText = () => {
    return currentLanguage === 'en' ? 'العربية' : 'English';
  };

  return (
    <Pressable
      style={[styles.container, style]}
      onPress={handleLanguageToggle}
      android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
    >
      <Ionicons name="language" size={20} color={iconColor} />
      <Text style={[styles.text, { color: textColor }]}>
        {getDisplayText()}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  text: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
});
