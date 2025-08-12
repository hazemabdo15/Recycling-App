
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import FAQList from './FAQList';
import ContactOptions from './ContactOptions';
import QuickLinks from './QuickLinks';
import FeedbackForm from './FeedbackForm';

const HelpSupportScreen = () => {
  return (
    <ScrollView style={styles.container}>
      {/* Gradient Header Area */}
      <View style={styles.header}>
        <Text style={styles.title}>Help & Support</Text>
        <Text style={styles.subtitle}>How can we help you today?</Text>
        {/* Optionally add an icon here */}
      </View>
      <FAQList />
      <ContactOptions />
      <QuickLinks />
      <FeedbackForm />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 48,
    paddingBottom: 24,
    paddingHorizontal: 20,
    // TODO: Add gradient background style from Home
    backgroundColor: '#4CAF50', // placeholder
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#e0f2f1',
    marginTop: 8,
  },
});

export default HelpSupportScreen;
