import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Linking, StyleSheet, Text, TouchableOpacity, View, I18nManager } from 'react-native';
import { useLocalization } from '../context/LocalizationContext';

const QuickLinks = () => {
  const { t, language } = useLocalization();

  const LINKS = [
    { 
      label: t('quickLinks.guide'), 
      url: 'https://recyclingapp.com/guide', 
      icon: 'book-open-page-variant' 
    },
    { 
      label: t('quickLinks.troubleshooting'), 
      url: 'https://recyclingapp.com/troubleshoot', 
      icon: 'alert-circle-outline' 
    },
    { 
      label: t('quickLinks.tutorials'), 
      url: 'https://recyclingapp.com/tutorials', 
      icon: 'play-circle-outline' 
    },
  ];

  return (
    <View style={[
      styles.container,
      language === 'ar' && styles.rtlContainer
    ]}>
      <Text style={[
        styles.sectionTitle,
        language === 'ar' && styles.rtlText
      ]}>
        {t('quickLinks.title')}
      </Text>
      
      {LINKS.map((link, idx) => (
        <TouchableOpacity 
          key={idx} 
          style={[
            styles.link,
            language === 'ar' && styles.rtlLink
          ]} 
          onPress={() => Linking.openURL(link.url)}
        >
          <MaterialCommunityIcons name={link.icon} size={22} color="#1976d2" />
          <Text style={[
            styles.linkText,
            language === 'ar' && styles.rtlText
          ]}>
            {link.label}
          </Text>
        </TouchableOpacity>
      ))}
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
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  rtlLink: {
    flexDirection: 'row-reverse'
  },
  linkText: {
    marginLeft: I18nManager.isRTL ? 0 : 12,
    marginRight: I18nManager.isRTL ? 12 : 0,
    fontSize: 16,
    color: '#1976d2',
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  rtlText: {
    writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr'
  }
});

export default QuickLinks;