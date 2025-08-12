import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const LINKS = [
  { label: 'How to Recycle Guide', url: 'https://recyclingapp.com/guide', icon: 'book-open-page-variant' },
  { label: 'Troubleshooting', url: 'https://recyclingapp.com/troubleshoot', icon: 'alert-circle-outline' },
  { label: 'Tutorials', url: 'https://recyclingapp.com/tutorials', icon: 'play-circle-outline' },
];

const QuickLinks = () => (
  <View style={styles.container}>
    <Text style={styles.sectionTitle}>Quick Links</Text>
    {LINKS.map((link, idx) => (
      <TouchableOpacity key={idx} style={styles.link} onPress={() => Linking.openURL(link.url)}>
        <MaterialCommunityIcons name={link.icon} size={22} color="#1976d2" />
        <Text style={styles.linkText}>{link.label}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

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
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  linkText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#1976d2',
  },
});

export default QuickLinks;
