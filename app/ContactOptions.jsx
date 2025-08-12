import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const EMAIL = 'support@recyclingapp.com';
const PHONE = '+1234567890';

const ContactOptions = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Contact Support</Text>
      <TouchableOpacity style={styles.option} onPress={() => Linking.openURL(`mailto:${EMAIL}`)}>
        <MaterialIcons name="email" size={22} color="#388e3c" />
        <Text style={styles.optionText}>Email Us</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.option} onPress={() => Linking.openURL(`tel:${PHONE}`)}>
        <FontAwesome name="phone" size={22} color="#388e3c" />
        <Text style={styles.optionText}>Call Us</Text>
      </TouchableOpacity>
      {/* Optionally add in-app chat if available */}
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
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  optionText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#222',
  },
});

export default ContactOptions;
