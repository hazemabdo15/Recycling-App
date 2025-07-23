import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, StatusBar, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CategoryHeader, EmptyState, ItemCard } from '../components/category';
import { ErrorState, LoadingState } from '../components/common';
import { Toast } from '../components/ui';
import { useCategoryItems } from '../hooks/useAPI';
import { useCart } from '../hooks/useCart';
import { useToast } from '../hooks/useToast';
import { layoutStyles } from '../styles/components/commonStyles';
import { colors } from '../styles/theme';
import { calculateCartStats, getIncrementStep, normalizeItemData } from '../utils/cartUtils';

let Animated, useAnimatedStyle, useSharedValue, withSpring, withTiming;

try {
  const reanimated = require('react-native-reanimated');
  Animated = reanimated.default;
  useAnimatedStyle = reanimated.useAnimatedStyle;
  useSharedValue = reanimated.useSharedValue;
  withSpring = reanimated.withSpring;
  withTiming = reanimated.withTiming;
} catch (_error) {
  const { View: RNView } = require('react-native');
  Animated = { View: RNView };
  useAnimatedStyle = () => ({});
  useSharedValue = (value) => ({ value });
  withSpring = (value) => value;
  withTiming = (value) => value;
}

const CategoryDetails = () => {
    const { categoryName } = useLocalSearchParams();
    const navigation = useNavigation();
    const { toast, showSuccess, showError, hideToast } = useToast();

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

    const renderItem = ({ item, index }) => {
        const itemPendingAction = pendingOperations[item.categoryId];
        
        return (
            <ItemCard
                item={item}
                quantity={item.quantity}
                disabled={!!itemPendingAction}
                pendingAction={itemPendingAction}
                index={index}
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

                        const normalizedItem = normalizeItemData(item);
                        const step = getIncrementStep(normalizedItem.measurement_unit);
                        const unit = normalizedItem.measurement_unit === 1 ? 'kg' : '';
                        showSuccess(`Added ${step}${unit} ${item.name || 'item'} to pickup`, 2500);
                    } catch (err) {
                        console.error('[CategoryDetails] Error increasing quantity:', err);
                        showError('Failed to add item to pickup');
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

                        const normalizedItem = normalizeItemData(item);
                        const step = getIncrementStep(normalizedItem.measurement_unit);
                        const unit = normalizedItem.measurement_unit === 1 ? 'kg' : '';
                        if (item.quantity > step) {
                            showSuccess(`Reduced ${item.name || 'item'} by ${step}${unit}`, 2000);
                        } else {
                            showSuccess(`Removed ${item.name || 'item'} from pickup`, 2000);
                        }
                    } catch (err) {
                        console.error('[CategoryDetails] Error decreasing quantity:', err);
                        showError('Failed to update item quantity');
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

                        const normalizedItem = normalizeItemData(item);
                        const unit = normalizedItem.measurement_unit === 1 ? 'kg' : '';
                        showSuccess(`Added 5${unit} ${item.name || 'items'} to pickup`, 2500);
                    } catch (err) {
                        console.error('[CategoryDetails] Error fast increasing quantity:', err);
                        showError('Failed to add items to pickup');
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

                        const normalizedItem = normalizeItemData(item);
                        const unit = normalizedItem.measurement_unit === 1 ? 'kg' : '';
                        const remainingQuantity = item.quantity - 5;
                        if (remainingQuantity > 0) {
                            showSuccess(`Reduced ${item.name || 'item'} by 5${unit}`, 2000);
                        } else {
                            showSuccess(`Removed ${item.name || 'item'} from pickup`, 2000);
                        }
                    } catch (err) {
                        console.error('[CategoryDetails] Error fast decreasing quantity:', err);
                        showError('Failed to update item quantity');
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
            <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onHide={hideToast}
                duration={toast.duration}
            />
            
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