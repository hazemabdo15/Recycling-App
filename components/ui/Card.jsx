import { Text, View } from 'react-native';
import { cardStyles } from '../../styles/components/commonStyles';
const Card = ({ 
    title, 
    subtitle, 
    children, 
    headerRight,
    ...props 
}) => {
    return (
        <View style={[cardStyles.card, props.style]}>
            {(title || subtitle || headerRight) && (
                <View style={cardStyles.cardHeader}>
                    <View style={{ flex: 1 }}>
                        {title && <Text style={cardStyles.cardTitle}>{title}</Text>}
                        {subtitle && <Text style={cardStyles.cardSubtitle}>{subtitle}</Text>}
                    </View>
                    {headerRight && headerRight}
                </View>
            )}
            {children && (
                <View style={cardStyles.cardContent}>
                    {children}
                </View>
            )}
        </View>
    );
};
export default Card;

