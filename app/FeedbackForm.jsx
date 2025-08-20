import { useState } from 'react';
import { Alert, I18nManager, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLocalization } from '../context/LocalizationContext';
import { useThemedStyles } from '../hooks/useThemedStyles';

const FeedbackForm = () => {
  const { t, language } = useLocalization();
  const { colors } = useThemedStyles();
  const styles = getStyles(colors);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      Alert.alert(t('feedback.alerts.empty'));
      return;
    }
    setSubmitting(true);
    try {
      // TODO: Replace with real API endpoint
      // await fetch('https://api.recyclingapp.com/feedback', { method: 'POST', body: JSON.stringify({ feedback }) });
      setTimeout(() => {
        setSubmitting(false);
        setFeedback('');
        Alert.alert(t('feedback.alerts.success'));
      }, 1000);
    } catch (_e) {
      setSubmitting(false);
      Alert.alert(t('feedback.alerts.error'));
    }
  };

  return (
    <View style={[
      styles.container,
      language === 'ar' && styles.rtlContainer
    ]}>
      <Text style={[
        styles.sectionTitle,
        language === 'ar' && styles.rtlText
      ]}>
        {t('feedback.title')}
      </Text>
      <TextInput
        style={[
          styles.input,
          language === 'ar' && styles.rtlText
        ]}
        placeholder={t('feedback.placeholder')}
        value={feedback}
        onChangeText={setFeedback}
        multiline
        editable={!submitting}
        textAlignVertical="top"
        textAlign={language === 'ar' ? 'right' : 'left'}
      />
      <TouchableOpacity 
        style={styles.button} 
        onPress={handleSubmit} 
        disabled={submitting}
      >
        <Text style={styles.buttonText}>
          {submitting ? t('feedback.submitting') : t('feedback.submit')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const getStyles = (colors) => StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 32,
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
  input: {
    backgroundColor: colors.helpCardBg,
    borderRadius: 10,
    padding: 14,
    minHeight: 80,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.helpBorderColor,
    writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
    color: colors.text,
  },
  rtlText: {
    textAlign: I18nManager.isRTL ? 'right' : 'left',
    writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr'
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FeedbackForm;