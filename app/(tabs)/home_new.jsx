import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EarnPointsCard } from '../../components/cards';
import { ErrorBoundary } from '../../components/common';
import { CategoriesSection, TopRecycledSection } from '../../components/sections';
import { colors, spacing } from '../../styles/theme';

const Index = () => {
    const insets = useSafeAreaInsets();

    useFocusEffect(useCallback(() => {
        return () => {
        };
    }, []));

    return (
        <ErrorBoundary>
            <View style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
                
                {/* Hero Section with Gradient */}
                <LinearGradient
                    colors={[colors.primary, colors.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.heroSection, { paddingTop: insets.top + 20 }]}
                >
                    <View style={styles.heroContent}>
                        <Text style={styles.welcomeText}>Welcome Back!</Text>
                        <Text style={styles.heroTitle}>Make Every Item Count</Text>
                        <Text style={styles.heroSubtitle}>
                            Turn your recyclables into rewards and help save our planet
                        </Text>
                    </View>
                </LinearGradient>

                <ScrollView
                    style={styles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    bounces={true}
                >
                    {/* Quick Stats Section */}
                    <View style={styles.statsSection}>
                        <EarnPointsCard />
                    </View>

                    {/* Popular Items Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>🔥 Trending This Week</Text>
                            <Text style={styles.sectionSubtitle}>Most recycled items in your area</Text>
                        </View>
                        <TopRecycledSection />
                    </View>

                    {/* Categories Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>🌱 Start Recycling</Text>
                            <Text style={styles.sectionSubtitle}>Choose what you want to recycle today</Text>
                        </View>
                        <CategoriesSection />
                    </View>

                    {/* Bottom Spacing */}
                    <View style={styles.bottomSpacer} />
                </ScrollView>
            </View>
        </ErrorBoundary>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    heroSection: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xl,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    heroContent: {
        alignItems: 'center',
        paddingTop: spacing.lg,
    },
    welcomeText: {
        fontSize: 16,
        fontWeight: '500',
        color: colors.white,
        opacity: 0.9,
        marginBottom: spacing.xs,
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.white,
        textAlign: 'center',
        marginBottom: spacing.sm,
        letterSpacing: -0.5,
    },
    heroSubtitle: {
        fontSize: 16,
        color: colors.white,
        textAlign: 'center',
        opacity: 0.85,
        lineHeight: 24,
        maxWidth: 280,
    },
    scrollContainer: {
        flex: 1,
        marginTop: -16, // Overlap with hero section
    },
    scrollContent: {
        paddingBottom: 120,
    },
    statsSection: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        marginBottom: spacing.md,
    },
    section: {
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.xl,
    },
    sectionHeader: {
        marginBottom: spacing.lg,
        paddingHorizontal: spacing.xs,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: spacing.xs,
        letterSpacing: -0.3,
    },
    sectionSubtitle: {
        fontSize: 15,
        color: colors.textSecondary,
        lineHeight: 22,
        fontWeight: '400',
    },
    bottomSpacer: {
        height: spacing.xl,
    },
});

export default Index;
