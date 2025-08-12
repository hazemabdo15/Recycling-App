import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';

const FeedbackForm = () => {
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      Alert.alert('Please enter your feedback.');
      return;
    }
    setSubmitting(true);
    try {
      // TODO: Replace with real API endpoint
      // await fetch('https://api.recyclingapp.com/feedback', { method: 'POST', body: JSON.stringify({ feedback }) });
      setTimeout(() => {
        setSubmitting(false);
        setFeedback('');
        Alert.alert('Thank you for your feedback!');
      }, 1000);
    } catch (_e) {
      setSubmitting(false);
      Alert.alert('Failed to submit feedback.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Send Feedback</Text>
      <TextInput
        style={styles.input}
        placeholder="Let us know your thoughts..."
        value={feedback}
        onChangeText={setFeedback}
        multiline
        editable={!submitting}
      />
      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={submitting}>
        <Text style={styles.buttonText}>{submitting ? 'Submitting...' : 'Submit'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
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
  },
  button: {
    backgroundColor: '#388e3c',
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
