import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View, I18nManager } from 'react-native';
import { useLocalization } from '../context/LocalizationContext';
import { colors } from '../styles';

const FeedbackForm = () => {
  const { t, language } = useLocalization();
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

const styles = StyleSheet.create({
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
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 14,
    minHeight: 80,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#c8e6c9',
    writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
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