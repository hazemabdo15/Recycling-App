import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { Linking, StyleSheet, Text, TouchableOpacity, View, I18nManager } from 'react-native';
import { useLocalization } from '../context/LocalizationContext';

const ContactOptions = () => {
  const { t, language } = useLocalization();
  
  const EMAIL = 'support@recyclingapp.com';
  const PHONE = '+1234567890';

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
        <MaterialIcons name="email" size={22} color="#388e3c" />
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
        <FontAwesome name="phone" size={22} color="#388e3c" />
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

const styles = StyleSheet.create({
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
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
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
    color: '#222',
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