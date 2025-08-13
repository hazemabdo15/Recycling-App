
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareFlatList } from 'react-native-keyboard-aware-scroll-view';
import { colors } from '../styles';
import ContactOptions from './ContactOptions';
import FAQList from './FAQList';
import FeedbackForm from './FeedbackForm';
import QuickLinks from './QuickLinks';

import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { scaleSize } from '../utils/scale';

const HelpSupportScreen = () => {
  const router = useRouter();
  const sections = [
    { key: 'header', render: () => (
      <LinearGradient
        colors={[colors.primary, colors.neutral]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.heroBackButton}
          >
            <MaterialIcons
              name="arrow-back-ios"
              size={scaleSize(22)}
              color={"#fff"}
            />
          </TouchableOpacity>
          <View style={styles.headerTextFlex}>
            <Text style={styles.title}>Help & Support</Text>
            <Text style={styles.subtitle}>How can we help you today?</Text>
          </View>
        </View>
      </LinearGradient>
    ) },
    { key: 'faq', render: () => <FAQList /> },
    { key: 'contact', render: () => <ContactOptions /> },
    { key: 'quicklinks', render: () => <QuickLinks /> },
    { key: 'feedback', render: () => <FeedbackForm /> },
  ];

  return (
    <KeyboardAwareFlatList
      style={styles.container}
      data={sections}
      keyExtractor={item => item.key}
      renderItem={({ item }) => item.render()}
      enableOnAndroid
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      extraScrollHeight={200}
    />
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
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroBackButton: {
    marginRight: scaleSize(12),
    padding: scaleSize(6),
    // marginTop removed for alignment in row
    alignSelf: 'center',
  },
  headerTextFlex: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  marginLeft: -scaleSize(36), // shift further left to visually center
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: scaleSize(2),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#e0f2f1',
    marginTop: 0,
    textAlign: 'center',
  },
});

export default HelpSupportScreen;
