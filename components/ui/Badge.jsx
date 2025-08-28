import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { getBadgeStyles } from '../../styles/components/commonStyles';
const Badge = ({
    text,
    count,
    variant = 'primary',
    icon,
    size = 'medium',
    ...props
}) => {
    const { colors, isDarkMode } = useThemedStyles();
    const badgeStyles = getBadgeStyles(isDarkMode);
    
    const getBadgeStyle = () => {
        switch (variant) {
            case 'secondary':
                return badgeStyles.badgeSecondary;
            case 'neutral':
                return badgeStyles.badgeNeutral;
            default:
                return badgeStyles.badge;
        }
    };
    const content = count !== undefined ? count : text;
    return (
        <View style={[badgeStyles.badge, getBadgeStyle(), props.style]}>
            {icon && (
                <MaterialCommunityIcons
                    name={icon}
                    size={12}
                    color={colors.white}
                    style={{ marginRight: content ? 4 : 0 }}
                />
            )}
            {content && (
                <Text style={badgeStyles.badgeText}>
                    {content}
                </Text>
            )}
        </View>
    );
};
export default Badge;