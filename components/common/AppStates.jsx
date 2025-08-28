import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { getErrorStateStyles, getLoadingStateStyles } from '../../styles/components/commonStyles';

const LoadingState = ({ message = "Loading..." }) => {
    const { colors, isDarkMode } = useThemedStyles();
    const loadingStateStyles = getLoadingStateStyles(isDarkMode);
    
    return (
        <View style={loadingStateStyles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={loadingStateStyles.loadingText}>{message}</Text>
        </View>
    );
};

const ErrorState = ({ message = "An error occurred", onRetry, retrying = false }) => {
    const { colors, isDarkMode } = useThemedStyles();
    const errorStateStyles = getErrorStateStyles(isDarkMode);
    
    return (
        <View style={errorStateStyles.errorContainer}>
            <MaterialCommunityIcons 
                name="wifi-off" 
                size={48} 
                color={colors.error} 
                style={{ marginBottom: 16 }}
            />
            <Text style={errorStateStyles.errorText}>{message}</Text>
            {onRetry && (
                <TouchableOpacity 
                    style={errorStateStyles.retryButton}
                    onPress={onRetry}
                    disabled={retrying}
                >
                    <MaterialCommunityIcons 
                        name="refresh" 
                        size={16} 
                        color={colors.white} 
                        style={{ marginRight: 8 }}
                    />
                    <Text style={errorStateStyles.retryButtonText}>
                        {retrying ? 'Retrying...' : 'Retry'}
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
};
export { ErrorState, LoadingState };
