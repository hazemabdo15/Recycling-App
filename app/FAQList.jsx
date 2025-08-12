import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQ_DATA = [
  { question: 'How do I schedule a pickup?', answer: 'Go to the Pickup tab and fill in your details to schedule a recycling pickup.' },
  { question: 'How do I earn points?', answer: 'Earn points by recycling items and completing challenges in the app.' },
  { question: 'How can I contact support?', answer: 'You can contact support via email, phone, or in-app chat from the Help & Support page.' },
];

const FAQList = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (idx) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>FAQs</Text>
      {FAQ_DATA.map((faq, idx) => (
        <View key={idx} style={styles.card}>
          <TouchableOpacity onPress={() => toggle(idx)}>
            <Text style={styles.question}>{faq.question}</Text>
          </TouchableOpacity>
          {openIndex === idx && (
            <Text style={styles.answer}>{faq.answer}</Text>
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  question: {
    fontSize: 16,
    fontWeight: '600',
  },
  answer: {
    marginTop: 8,
    fontSize: 15,
    color: '#555',
  },
});

export default FAQList;
