import { ActivityIndicator, Text, View } from 'react-native';
import { errorStateStyles, loadingStateStyles } from '../../styles/components/commonStyles';
import { colors } from '../../styles/theme';
const LoadingState = ({ message = "Loading..." }) => {
    return (
        <View style={loadingStateStyles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={loadingStateStyles.loadingText}>{message}</Text>
        </View>
    );
};
const ErrorState = ({ message = "An error occurred" }) => {
    return (
        <View style={errorStateStyles.errorContainer}>
            <Text style={errorStateStyles.errorText}>{message}</Text>
        </View>
    );
};
export { ErrorState, LoadingState };