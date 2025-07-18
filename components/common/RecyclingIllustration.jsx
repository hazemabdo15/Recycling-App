import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

const RecyclingIllustration = () => {
    return (
        <View style={styles.recyclingIllustration}>
            <View style={styles.person1}>
                <View style={styles.personAvatar} />
                <View style={styles.trashBag} />
            </View>
            <View style={styles.recyclingBin}>
                <Ionicons name="trash" size={40} color="#fff" />
            </View>
            <View style={styles.person2}>
                <View style={styles.personAvatar} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    recyclingIllustration: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    person1: {
        alignItems: 'center',
    },
    person2: {
        alignItems: 'center',
    },
    personAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFB6C1',
        marginBottom: 10,
    },
    trashBag: {
        width: 30,
        height: 35,
        borderRadius: 15,
        backgroundColor: '#8BC34A',
    },
    recyclingBin: {
        width: 60,
        height: 70,
        backgroundColor: '#0E9F6E',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 20,
    },
});

export default RecyclingIllustration;
