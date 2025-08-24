import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { I18nManager, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalization } from '../context/LocalizationContext';
import { useThemedStyles } from '../hooks/useThemedStyles';

const ContactOptions = () => {
  const { t, language } = useLocalization();
  const { colors } = useThemedStyles();
  const styles = getStyles(colors);

  const EMAIL = 'recyclecrew7@gmail.com';
  const PHONE = '+1126374221';

  return (
    <View style={[
      styles.container,
      language === 'ar' && styles.rtlContainer
    ]}>
      <Text style={[
        styles.sectionTitle,
        language === 'ar' && styles.rtlText
      ]}>
        {t('contact.title')}
      </Text>
      
      <TouchableOpacity 
        style={[
          styles.option,
          language === 'ar' && styles.rtlOption
        ]} 
        onPress={() => Linking.openURL(`mailto:${EMAIL}`)}
      >
        <MaterialIcons name="email" size={22} color={colors.primary} />
        <Text style={[
          styles.optionText,
          language === 'ar' && styles.rtlText
        ]}>
          {t('contact.email')}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[
          styles.option,
          language === 'ar' && styles.rtlOption
        ]} 
        onPress={() => Linking.openURL(`tel:${PHONE}`)}
      >
        <FontAwesome name="phone" size={22} color={colors.primary} />
        <Text style={[
          styles.optionText,
          language === 'ar' && styles.rtlText
        ]}>
          {t('contact.call')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const getStyles = (colors) => StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  rtlContainer: {
    direction: 'rtl'
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
    color: colors.text,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  rtlOption: {
    flexDirection: 'row-reverse'
  },
  optionText: {
    marginLeft: 12,
    fontSize: 16,
    color: colors.text,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  rtlText: {
    textAlign: 'right',
    writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
    marginLeft: I18nManager.isRTL ? 0 : 12,
    marginRight: I18nManager.isRTL ? 12 : 0
  }
});

export default ContactOptions;