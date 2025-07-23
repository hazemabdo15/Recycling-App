import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EarnPointsCard } from '../../components/cards';
import { Header } from '../../components/common';
import { CategoriesSection, TopRecycledSection } from '../../components/sections';
import { colors } from '../../styles/theme';

const Index = () => {
    const insets = useSafeAreaInsets();

    useFocusEffect(useCallback(() => {

        return () => {
        };
    }, []));

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
            <View style={[styles.headerContainer]}>
                <Header/>
            </View>
            <ScrollView
                style={[styles.content]}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <EarnPointsCard />
                <TopRecycledSection />
                <CategoriesSection />
            </ScrollView>
        </View>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.base100,
    },
    headerContainer: {
        backgroundColor: colors.base100,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    scrollContent: {
        paddingBottom: 120,
    },
})
export default Index;