import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalization } from '../context/LocalizationContext';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { spacing } from '../styles/theme';
import { scaleSize } from '../utils/scale';

export default function LanguageSettings() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, currentLanguage, changeLanguage, isRTL } = useLocalization();
  const { colors } = useThemedStyles();
  const styles = getStyles(colors);

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  ];

  const handleLanguageChange = async (languageCode) => {
    if (languageCode !== currentLanguage) {
      await changeLanguage(languageCode);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Hero Section with Gradient */}
      <LinearGradient
        colors={colors.heroGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.heroSection,
          {
            paddingTop: insets.top + scaleSize(20),
            borderTopLeftRadius: scaleSize(24),
            borderTopRightRadius: scaleSize(24),
          },
        ]}
      >
        <View style={styles.heroHeaderRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="arrow-back-ios"
              size={scaleSize(22)}
              color={colors.white}
              style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }}
            />
          </TouchableOpacity>
          <Text style={styles.heroTitle}>{t('settings.language')}</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      {/* Content Section */}
      <ScrollView
        style={styles.contentSection}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>{t('settings.changeLanguage')}</Text>

        <View style={styles.languageList}>
          {languages.map((language) => (
            <TouchableOpacity
              key={language.code}
              style={[
                styles.languageItem,
                currentLanguage === language.code && styles.activeLanguageItem,
              ]}
              onPress={() => handleLanguageChange(language.code)}
              activeOpacity={0.8}
            >
              <View style={styles.languageInfo}>
                <Text style={[styles.languageName, currentLanguage === language.code && styles.activeLanguageName]}>
                  {language.nativeName}
                </Text>
                <Text style={[styles.languageSubtitle, currentLanguage === language.code && styles.activeLanguageSubtitle]}>
                  {language.name}
                </Text>
              </View>
              {currentLanguage === language.code && (
                <MaterialIcons
                  name="check-circle"
                  size={scaleSize(24)}
                  color={colors.primary}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoContainer}>
          <MaterialIcons
            name="info-outline"
            size={scaleSize(20)}
            color={colors.textSecondary}
          />
          <Text style={styles.infoText}>
            {t('settings.language')} changes will apply immediately. Some changes may require an app restart for full effect.
          </Text>
        </View>
        {/* Spacer for bottom margin */}
        <View style={{ height: scaleSize(40) + insets.bottom }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  heroSection: {
    paddingHorizontal: scaleSize(spacing.lg),
    paddingBottom: scaleSize(spacing.xl),
    borderTopLeftRadius: scaleSize(24),
    borderTopRightRadius: scaleSize(24),
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: scaleSize(spacing.md),
  },
  backButton: {
    padding: scaleSize(spacing.sm),
    borderRadius: scaleSize(20),
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  heroTitle: {
    fontSize: scaleSize(24),
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
    flex: 1,
  },
  placeholder: {
    width: scaleSize(40),
  },
  contentSection: {
    backgroundColor: colors.background,
    borderTopLeftRadius: scaleSize(24),
    borderTopRightRadius: scaleSize(24),
    marginTop: scaleSize(-24),
    paddingHorizontal: scaleSize(spacing.md),
    paddingTop: scaleSize(spacing.lg),
    paddingBottom: scaleSize(24),
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  sectionTitle: {
    fontSize: scaleSize(16),
    fontWeight: '600',
    color: colors.text,
    marginTop: scaleSize(24),
    marginBottom: scaleSize(16),
    textAlign: 'center',
  },
  languageList: {
    backgroundColor: colors.itemCardBg,
    borderRadius: scaleSize(12),
    overflow: 'hidden',
    marginBottom: scaleSize(24),
    borderWidth: 1,
    borderColor: colors.border,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleSize(20),
    paddingVertical: scaleSize(16),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  activeLanguageItem: {
    backgroundColor: colors.primaryLight,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: scaleSize(16),
    fontWeight: '500',
    color: colors.text,
    marginBottom: scaleSize(4),
  },
  activeLanguageName: {
    color: colors.primary,
  },
  languageSubtitle: {
    fontSize: scaleSize(14),
    color: colors.textSecondary,
  },
  activeLanguageSubtitle: {
    color: colors.primary,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: scaleSize(24),
    paddingHorizontal: scaleSize(16),
    paddingVertical: scaleSize(16),
    backgroundColor: colors.itemCardBg,
    borderRadius: scaleSize(12),
    marginBottom: scaleSize(24),
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoText: {
    flex: 1,
    fontSize: scaleSize(14),
    color: colors.textSecondary,
    marginStart: scaleSize(12),
    lineHeight: scaleSize(20),
  },
});
