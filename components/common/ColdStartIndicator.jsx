import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalization } from '../../context/LocalizationContext';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { scaleSize } from '../../utils/scale';

const ColdStartIndicator = ({
  visible = false,
  message = '',
  onRetry = null,
  retrying = false,
  type = 'warming' // 'warming', 'error', 'retrying'
}) => {
  const { t } = useLocalization();
  const { colors } = useThemedStyles();

  if (!visible) return null;

  const getIcon = () => {
    switch (type) {
      case 'warming':
        return 'server-network';
      case 'retrying':
        return 'reload';
      case 'error':
        return 'server-network-off';
      default:
        return 'server-network';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'warming':
        return colors.warning;
      case 'retrying':
        return colors.primary;
      case 'error':
        return colors.error;
      default:
        return colors.warning;
    }
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.cardBackground,
      margin: scaleSize(16),
      padding: scaleSize(16),
      borderRadius: scaleSize(12),
      borderWidth: 1,
      borderColor: getIconColor() + '30',
      shadowColor: colors.shadow,
      shadowOffset: {
        width: 0,
        height: scaleSize(2),
      },
      shadowOpacity: 0.1,
      shadowRadius: scaleSize(4),
      elevation: 3,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconContainer: {
      marginRight: scaleSize(12),
    },
    textContainer: {
      flex: 1,
    },
    title: {
      fontSize: scaleSize(14),
      fontWeight: '600',
      color: colors.text,
      marginBottom: scaleSize(4),
    },
    message: {
      fontSize: scaleSize(12),
      color: colors.textSecondary,
      lineHeight: scaleSize(16),
    },
    retryButton: {
      marginTop: scaleSize(12),
      backgroundColor: colors.primary,
      paddingHorizontal: scaleSize(16),
      paddingVertical: scaleSize(8),
      borderRadius: scaleSize(8),
      alignSelf: 'flex-start',
    },
    retryButtonDisabled: {
      backgroundColor: colors.neutral + '50',
    },
    retryButtonText: {
      color: colors.white,
      fontSize: scaleSize(12),
      fontWeight: '600',
    },
    retryButtonTextDisabled: {
      color: colors.textSecondary,
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: scaleSize(8),
    },
    loadingText: {
      marginLeft: scaleSize(8),
      fontSize: scaleSize(12),
      color: colors.textSecondary,
    },
  });

  const getTitle = () => {
    switch (type) {
      case 'warming':
        return t('coldStart.warming.title', 'Server Starting');
      case 'retrying':
        return t('coldStart.retrying.title', 'Retrying Connection');
      case 'error':
        return t('coldStart.error.title', 'Connection Issue');
      default:
        return t('coldStart.default.title', 'Please Wait');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name={getIcon()}
            size={scaleSize(24)}
            color={getIconColor()}
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{getTitle()}</Text>
          {message && <Text style={styles.message}>{message}</Text>}
          
          {retrying && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>
                {t('coldStart.retrying.message', 'Attempting to reconnect...')}
              </Text>
            </View>
          )}
          
          {onRetry && !retrying && (
            <TouchableOpacity
              style={[styles.retryButton, retrying && styles.retryButtonDisabled]}
              onPress={onRetry}
              disabled={retrying}
              activeOpacity={0.7}
            >
              <Text style={[styles.retryButtonText, retrying && styles.retryButtonTextDisabled]}>
                {t('coldStart.retry', 'Try Again')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

export default ColdStartIndicator;
