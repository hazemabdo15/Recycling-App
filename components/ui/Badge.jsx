import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { badgeStyles } from '../../styles/components/commonStyles';
import { colors } from '../../styles/theme';
const Badge = ({
    text,
    count,
    variant = 'primary',
    icon,
    size = 'medium',
    ...props
}) => {
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