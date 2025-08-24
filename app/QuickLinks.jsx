import { MaterialCommunityIcons } from '@expo/vector-icons';
import { I18nManager, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalization } from '../context/LocalizationContext';
import { useThemedStyles } from '../hooks/useThemedStyles';

const QuickLinks = () => {
  const { t, language } = useLocalization();
  const { colors } = useThemedStyles();
  const styles = getStyles(colors);

  const LINKS = [
    { 
      label: t('quickLinks.guide'), 
      url: 'https://www.youtube.com/watch?v=-WA5SVF6wMw', 
      icon: 'book-open-page-variant' 
    },
    { 
      label: t('quickLinks.troubleshooting'), 
      url: 'https://youtu.be/GvFlq2NIhWs?si=LxLcLOED1h_Ozg-o', 
      icon: 'alert-circle-outline' 
    },
    { 
      label: t('quickLinks.tutorials'), 
      url: 'https://youtu.be/cNPEH0GOhRw?si=yBacpuLDK65Jtifx', 
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
          <MaterialCommunityIcons name={link.icon} size={22} color={colors.info} />
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
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.infoLight,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.infoBorder,
  },
  rtlLink: {
    flexDirection: 'row-reverse'
  },
  linkText: {
    marginLeft: I18nManager.isRTL ? 0 : 12,
    marginRight: I18nManager.isRTL ? 12 : 0,
    fontSize: 16,
    color: colors.info,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  rtlText: {
    writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr'
  }
});

export default QuickLinks;