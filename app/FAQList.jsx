import { useState } from 'react';
import {
    I18nManager,
    LayoutAnimation,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    UIManager,
    View
} from 'react-native';
import { useLocalization } from '../context/LocalizationContext';
import { useThemedStyles } from '../hooks/useThemedStyles';

// Enable layout animations on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQList = () => {
  const { t, language } = useLocalization();
  const { colors } = useThemedStyles();
  const styles = getStyles(colors);
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (idx) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenIndex(openIndex === idx ? null : idx);
  };

  // Get localized FAQ data
  const FAQ_DATA = [
    { 
      question: t('faqs.schedulePickup.question'), 
      answer: t('faqs.schedulePickup.answer') 
    },
    { 
      question: t('faqs.earnPoints.question'), 
      answer: t('faqs.earnPoints.answer') 
    },
    { 
      question: t('faqs.contactSupport.question'), 
      answer: t('faqs.contactSupport.answer') 
    },
  ];

  return (
    <View style={[
      styles.container,
      language === 'ar' && styles.rtlContainer
    ]}>
      <Text style={styles.sectionTitle}>{t('faq.title')}</Text>
      {FAQ_DATA.map((faq, idx) => (
        <View 
          key={idx} 
          style={[
            styles.card,
            language === 'ar' && styles.rtlCard
          ]}
        >
          <TouchableOpacity onPress={() => toggle(idx)}>
            <Text style={[
              styles.question,
              language === 'ar' && styles.rtlText
            ]}>
              {faq.question}
            </Text>
          </TouchableOpacity>
          {openIndex === idx && (
            <Text style={[
              styles.answer,
              language === 'ar' && styles.rtlText
            ]}>
              {faq.answer}
            </Text>
          )}
        </View>
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
  card: {
    backgroundColor: colors.helpCardBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: colors.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.helpBorderColor,
  },
  rtlCard: {
    textAlign: 'right'
  },
  question: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: I18nManager.isRTL ? 'right' : 'left',
    color: colors.text,
  },
  rtlText: {
    textAlign: 'right',
    writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr'
  },
  answer: {
    marginTop: 8,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
});

export default FAQList;