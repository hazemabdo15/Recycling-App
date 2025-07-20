import { useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { FlatList, StatusBar, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CategoryHeader, EmptyState, ItemCard } from '../components/category';
import { ErrorState, LoadingState } from '../components/common';
import { useCategoryItems } from '../hooks/useAPI';
import { useCart } from '../hooks/useCart';
import { layoutStyles } from '../styles/components/commonStyles';
import { calculateCartStats } from '../utils/cartUtils';
const CategoryDetails = () => {
    const { categoryName } = useLocalSearchParams();
    const { items, loading, error } = useCategoryItems(categoryName);
    const insets = useSafeAreaInsets();
    // Use cart hook for cart management
    const { cartItems, getItemQuantity, handleIncreaseQuantity, handleDecreaseQuantity } = useCart();
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
    // Calculate cart statistics
    const { totalItems, totalPoints, totalValue } = calculateCartStats(items, cartItems);
    const renderItem = ({ item }) => (
        <ItemCard
            item={item}
            quantity={getItemQuantity(item._id)}
            onIncrease={() => handleIncreaseQuantity(item)}
            onDecrease={() => handleDecreaseQuantity(item)}
        />
    );
    const handleAddItem = () => {
        console.log('Add item to', categoryName);
        // TODO: Implement add item functionality
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
        <View style={[layoutStyles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
            <CategoryHeader
                categoryName={categoryName}
                totalItems={totalItems}
                totalPoints={totalPoints}
                totalValue={totalValue}
                animatedStyle={headerAnimatedStyle}
                headerOpacity={headerOpacity}
            />
            <Animated.View style={[layoutStyles.content, contentAnimatedStyle]}>
                {items.length === 0 ? (
                    <EmptyState
                        categoryName={categoryName}
                        onAddItem={handleAddItem}
                    />
                ) : (
                    <FlatList
                        data={items}
                        renderItem={renderItem}
                        keyExtractor={(item) => item._id}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={layoutStyles.listContainer}
                        ItemSeparatorComponent={() => <View style={layoutStyles.separator} />}
                    />
                )}
            </Animated.View>
        </View>
    );
};
export default CategoryDetails;

