import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, StatusBar, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CategoryHeader, EmptyState, ItemCard } from '../components/category';
import { ErrorState, LoadingState } from '../components/common';
import { useCategoryItems } from '../hooks/useAPI';
import { useCart } from '../hooks/useCart';
import { layoutStyles } from '../styles/components/commonStyles';
import { colors } from '../styles/theme';
import { calculateCartStats, normalizeItemData } from '../utils/cartUtils';
const CategoryDetails = () => {
    const { categoryName } = useLocalSearchParams();
    const navigation = useNavigation();

    const [pendingOperations, setPendingOperations] = useState({});

    useEffect(() => {
        navigation.setOptions({ headerShown: false });
    }, [navigation]);

    const { items, loading, error } = useCategoryItems(categoryName);
    const insets = useSafeAreaInsets();
    const { cartItems, handleIncreaseQuantity, handleDecreaseQuantity, handleFastIncreaseQuantity, handleFastDecreaseQuantity } = useCart();

    const mergedItems = items.map((item) => {
        const normalizedItem = normalizeItemData(item);
        const { categoryId } = normalizedItem;

        const quantity = cartItems[categoryId] || 0;
        
        return {
            ...normalizedItem,
            quantity,
        };
    });

    const headerOpacity = useSharedValue(0);
    const contentTranslateY = useSharedValue(50);

    useEffect(() => {
        headerOpacity.value = withTiming(1, { duration: 600 });
        contentTranslateY.value = withSpring(0, {
            damping: 15,
            stiffness: 100,
        });
    }, [headerOpacity, contentTranslateY]);

    const headerAnimatedStyle = useAnimatedStyle(() => ({
        opacity: headerOpacity.value,
    }));

    const contentAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: contentTranslateY.value }],
    }));

    const { totalItems, totalPoints, totalValue } = calculateCartStats(mergedItems, cartItems);

    const renderItem = ({ item }) => {
        const itemPendingAction = pendingOperations[item.categoryId];
        
        return (
            <ItemCard
                item={item}
                quantity={item.quantity}
                disabled={!!itemPendingAction}
                pendingAction={itemPendingAction}
                onIncrease={async () => {

                    if (itemPendingAction) return;

                    const timeoutId = setTimeout(() => {
                        setPendingOperations(prev => {
                            const newState = { ...prev };
                            delete newState[item.categoryId];
                            return newState;
                        });
                    }, 2000);
                    
                    try {
                        setPendingOperations(prev => ({ ...prev, [item.categoryId]: 'increase' }));
                        await handleIncreaseQuantity(item);
                    } catch (err) {
                        console.error('[CategoryDetails] Error increasing quantity:', err);

                    } finally {
                        clearTimeout(timeoutId);
                        setPendingOperations(prev => {
                            const newState = { ...prev };
                            delete newState[item.categoryId];
                            return newState;
                        });
                    }
                }}
                onDecrease={async () => {

                    if (itemPendingAction) return;

                    const timeoutId = setTimeout(() => {
                        setPendingOperations(prev => {
                            const newState = { ...prev };
                            delete newState[item.categoryId];
                            return newState;
                        });
                    }, 2000);
                    
                    try {
                        setPendingOperations(prev => ({ ...prev, [item.categoryId]: 'decrease' }));
                        await handleDecreaseQuantity(item);
                    } catch (err) {
                        console.error('[CategoryDetails] Error decreasing quantity:', err);

                    } finally {
                        clearTimeout(timeoutId);
                        setPendingOperations(prev => {
                            const newState = { ...prev };
                            delete newState[item.categoryId];
                            return newState;
                        });
                    }
                }}
                onFastIncrease={async () => {

                    if (itemPendingAction) return;

                    const timeoutId = setTimeout(() => {
                        setPendingOperations(prev => {
                            const newState = { ...prev };
                            delete newState[item.categoryId];
                            return newState;
                        });
                    }, 2000);
                    
                    try {
                        setPendingOperations(prev => ({ ...prev, [item.categoryId]: 'fastIncrease' }));
                        await handleFastIncreaseQuantity(item);
                    } catch (err) {
                        console.error('[CategoryDetails] Error fast increasing quantity:', err);
                    } finally {
                        clearTimeout(timeoutId);
                        setPendingOperations(prev => {
                            const newState = { ...prev };
                            delete newState[item.categoryId];
                            return newState;
                        });
                    }
                }}
                onFastDecrease={async () => {

                    if (itemPendingAction) return;

                    const timeoutId = setTimeout(() => {
                        setPendingOperations(prev => {
                            const newState = { ...prev };
                            delete newState[item.categoryId];
                            return newState;
                        });
                    }, 2000);
                    
                    try {
                        setPendingOperations(prev => ({ ...prev, [item.categoryId]: 'fastDecrease' }));
                        await handleFastDecreaseQuantity(item);
                    } catch (err) {
                        console.error('[CategoryDetails] Error fast decreasing quantity:', err);
                    } finally {
                        clearTimeout(timeoutId);
                        setPendingOperations(prev => {
                            const newState = { ...prev };
                            delete newState[item.categoryId];
                            return newState;
                        });
                    }
                }}
            />
        );
    };
    const handleAddItem = () => {
        console.log('Add item to', categoryName);
    };
    if (loading) {
        return (
            <View style={[layoutStyles.container, { paddingTop: insets.top }]}>
                <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
                <LoadingState message={`Loading ${categoryName} items...`} />
            </View>
        );
    }
    if (error) {
        return (
            <View style={[layoutStyles.container, { paddingTop: insets.top }]}>
                <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
                <ErrorState message={`Error loading ${categoryName} items`} />
            </View>
        );
    }
    return (
        <View style={[layoutStyles.container, { paddingTop: insets.top, backgroundColor: colors.base100 }]}> 
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
            {}
            <CategoryHeader
                categoryName={categoryName}
                totalItems={totalItems}
                totalPoints={totalPoints}
                totalValue={totalValue}
                animatedStyle={headerAnimatedStyle}
                headerOpacity={headerOpacity}
                onGoBack={() => navigation && navigation.goBack && navigation.goBack()}
            />
            <Animated.View style={[layoutStyles.content, contentAnimatedStyle, styles.animatedCard]}> 
                {mergedItems.length === 0 ? (
                    <EmptyState
                        categoryName={categoryName}
                        onAddItem={handleAddItem}
                    />
                ) : (
                    <FlatList
                        data={mergedItems}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.categoryId}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={[layoutStyles.listContainer, { paddingBottom: 32 }]}
                        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
                        extraData={cartItems}
                    />
                )}
            </Animated.View>
        </View>
    );
};
const styles = StyleSheet.create({
    animatedCard: {
        borderRadius: 24,
        backgroundColor: colors.white,
        marginTop: 12,
        padding: 8,
        shadowColor: colors.primary,
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
});

export default CategoryDetails;