import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, TouchableOpacity } from 'react-native';
import { getButtonStyles } from '../../styles/components/commonStyles';
import { useThemedStyles } from '../../hooks/useThemedStyles';
const Button = ({
    title,
    onPress,
    variant = 'primary',
    icon,
    disabled = false,
    size = 'medium',
    ...props
}) => {
    const { colors, isDarkMode } = useThemedStyles();
    const buttonStyles = getButtonStyles(isDarkMode);
    
    const getButtonStyle = () => {
        switch (variant) {
            case 'secondary':
                return buttonStyles.secondaryButton;
            case 'icon':
                return buttonStyles.iconButton;
            default:
                return buttonStyles.primaryButton;
        }
    };
    const getTextStyle = () => {
        switch (variant) {
            case 'secondary':
                return buttonStyles.secondaryButtonText;
            case 'icon':
                return { color: colors.primary };
            default:
                return buttonStyles.primaryButtonText;
        }
    };
    return (
        <TouchableOpacity
            style={[
                getButtonStyle(),
                disabled && { opacity: 0.6 },
                props.style
            ]}
            onPress={onPress}
            disabled={disabled}
            {...props}
        >
            {icon && (
                <MaterialCommunityIcons
                    name={icon}
                    size={20}
                    color={variant === 'secondary' ? colors.primary : colors.white}
                    style={{ marginRight: title ? 8 : 0 }}
                />
            )}
            {title && <Text style={getTextStyle()}>{title}</Text>}
        </TouchableOpacity>
    );
};
export default Button;