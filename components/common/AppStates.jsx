import { ActivityIndicator, Text, View } from 'react-native';
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

const ErrorState = ({ message = "An error occurred" }) => {
    const { isDarkMode } = useThemedStyles();
    const errorStateStyles = getErrorStateStyles(isDarkMode);
    
    return (
        <View style={errorStateStyles.errorContainer}>
            <Text style={errorStateStyles.errorText}>{message}</Text>
        </View>
    );
};
export { ErrorState, LoadingState };
