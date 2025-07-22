import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Dimensions,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Reanimated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '../hooks/useCart';
import { borderRadius, colors, spacing, typography } from '../styles/theme';

const { height } = Dimensions.get('window');
const MODAL_HEIGHT = height * 0.85;
const DISMISS_THRESHOLD = 150;

export default function AIResultsModal() {
  const { handleAddToCart } = useCart();
  const params = useLocalSearchParams();
  const { 
    extractedMaterials = '[]', 
    verifiedMaterials = '[]'
  } = params;

  let parsedExtractedMaterials = [];
  let parsedVerifiedMaterials = [];
  
  try {
    parsedExtractedMaterials = JSON.parse(extractedMaterials);
  } catch (error) {
    console.error('Error parsing extracted materials:', error);
    parsedExtractedMaterials = [];
  }
  
  try {
    parsedVerifiedMaterials = JSON.parse(verifiedMaterials);
  } catch (error) {
    console.error('Error parsing verified materials:', error);
    parsedVerifiedMaterials = [];
  }
  
  console.log('📋 AI Results Modal - Extracted:', parsedExtractedMaterials);
  console.log('📋 AI Results Modal - Verified:', parsedVerifiedMaterials);
  
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  const initialMaterials = parsedVerifiedMaterials.length > 0 ? parsedVerifiedMaterials : parsedExtractedMaterials;
  const [materials, setMaterials] = useState(initialMaterials);

  const safeMaterials = materials || [];
  const availableCount = safeMaterials.filter(material => material.available !== false).length;
  const unavailableCount = safeMaterials.length - availableCount;

  const hasMaterials = materials && materials.length > 0;

  const dismissModal = useCallback(() => {
    translateY.value = withTiming(MODAL_HEIGHT, { duration: 300 });
    opacity.value = withTiming(0, { duration: 300 }, () => {
      runOnJS(router.back)();
    });
  }, [translateY, opacity]);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
        opacity.value = interpolate(
          event.translationY,
          [0, DISMISS_THRESHOLD],
          [1, 0.5]
        );
      }
    })
    .onEnd((event) => {
      if (event.translationY > DISMISS_THRESHOLD || event.velocityY > 500) {
        runOnJS(dismissModal)();
      } else {
        translateY.value = withSpring(0);
        opacity.value = withSpring(1);
      }
    });

  const animatedModalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const updateQuantity = useCallback((index, delta) => {
    setMaterials(prev => prev.map((item, i) => {
      if (i === index) {

        const step = item.unit === 'KG' ? 0.25 : 1;
        const minValue = item.unit === 'KG' ? 0.25 : 1;
        const newQuantity = Math.max(minValue, item.quantity + (delta * step));
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(item => item.quantity > 0));
  }, []);

  const removeMaterial = useCallback((index) => {
    setMaterials(prev => prev.filter((_, i) => i !== index));
  }, []);

  const addToCart = useCallback(() => {

    const availableMaterials = materials.filter(item => item.available && item.databaseItem);
    if (availableMaterials.length === 0) {
      alert('No available materials to add to cart. Items marked in red are not yet in our database.');
      return;
    }

    const cartItems = availableMaterials.map(item => ({
      categoryId: item.databaseItem.categoryId,
      name: item.databaseItem.name,
      image: item.databaseItem.image,
      points: item.databaseItem.points,
      price: item.databaseItem.price,
      measurement_unit: item.databaseItem.measurement_unit,
      quantity: item.quantity
    }));
    
    console.log('🚀 [AI Results Modal] Starting cart addition process');
    console.log('📦 [AI Results Modal] Items to add:', cartItems);
    console.log('📋 [AI Results Modal] Available materials from AI:', availableMaterials);
    console.log('🔄 [AI Results Modal] These items will be merged with existing cart items');

    handleAddToCart(cartItems);

    router.dismissAll();
    router.push('/(tabs)/cart');
  }, [materials, handleAddToCart]);

  const browseMore = useCallback(() => {

    router.dismissAll();
    router.push('/(tabs)/explore');
  }, []);

  const renderMaterialItem = ({ item, index }) => {
    const isAvailable = item.available !== false;
    const displayName = isAvailable && item.databaseItem 
      ? item.databaseItem.name 
      : item.material;

    return (
      <View style={[styles.materialItem, !isAvailable && styles.materialItemUnavailableRefined]}>
        <View style={styles.materialHeader}>
          <View style={styles.materialInfo}>
            <View style={styles.materialNameRow}>
              <Text
                style={[styles.materialName, !isAvailable && styles.materialNameUnavailableRefined]}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {displayName ? String(displayName) : ''}
              </Text>
              {}
              <View style={[styles.availabilityIndicator, isAvailable ? styles.availabilityIndicatorAvailable : styles.availabilityIndicatorUnavailableRefined, { marginLeft: 4 }]}> 
                <MaterialCommunityIcons
                  name={isAvailable ? "check-circle" : "alert-circle-outline"}
                  size={16}
                  color={isAvailable ? colors.success : colors.error + 'B0'}
                  style={!isAvailable ? { opacity: 0.7 } : undefined}
                />
              </View>
            </View>
            <View style={styles.materialMeta}>
              {item.unit ? (
                <Text style={[styles.materialUnit, !isAvailable && styles.materialUnitUnavailableRefined]}>
                  {String(item.unit)}
                </Text>
              ) : null}
              {}
              {item.matchSimilarity && item.matchSimilarity < 100 ? (
                <Text style={[styles.matchInfo, !isAvailable && styles.matchInfoUnavailableRefined]}>
                  {String(item.matchSimilarity)}% match
                </Text>
              ) : null}
              {!isAvailable ? (
                <Text style={styles.unavailableLabelRefined}>
                  Not Available
                </Text>
              ) : null}
            </View>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => removeMaterial(index)}
          >
            <MaterialCommunityIcons name="delete-outline" size={22} color={colors.error + 'B0'} style={{ opacity: 0.7 }} />
          </TouchableOpacity>
        </View>
      {}
      <View style={styles.quantityRow}>
        <View style={styles.quantityLabel}>
          <Text style={[styles.quantityLabelText, !isAvailable && { color: colors.neutral + '80' } ]}>Quantity</Text>
        </View>
        <View style={styles.quantityControls}>
          <TouchableOpacity
            style={[styles.quantityButton, !isAvailable && { backgroundColor: colors.base200 }]}
            onPress={() => updateQuantity(index, -1)}
            disabled={!isAvailable}
          >
            <MaterialCommunityIcons name="minus" size={20} color={isAvailable ? colors.white : colors.neutral + '80'} />
          </TouchableOpacity>
          <Text style={[styles.quantityText, !isAvailable && { color: colors.neutral + '80' } ]}>
            {item.unit === 'KG' ? item.quantity.toFixed(2) : item.quantity}
          </Text>
          <TouchableOpacity
            style={[styles.quantityButton, !isAvailable && { backgroundColor: colors.base200 }]}
            onPress={() => updateQuantity(index, 1)}
            disabled={!isAvailable}
          >
            <MaterialCommunityIcons name="plus" size={20} color={isAvailable ? colors.white : colors.neutral + '80'} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

  if (!hasMaterials) {
    return (
      <GestureHandlerRootView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => router.back()} />
        <View style={[styles.modal, { paddingTop: insets.top + 20 }]}>
          <View style={styles.handleBar} />
          <View style={styles.header}>
            <Text style={styles.title}>No Materials Found</Text>
          </View>
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons name="alert-circle-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.errorText}>No materials were extracted from the recording.</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => router.back()}
            >
              <Text style={styles.retryButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <TouchableOpacity 
        style={styles.backdrop} 
        activeOpacity={1} 
        onPress={dismissModal}
      />

      <Reanimated.View 
        style={[styles.modal, animatedModalStyle, { paddingTop: insets.top + 20 }]}
      >
        <GestureDetector gesture={panGesture}>
          <View>
            <View style={styles.handleBar} />
            
            <View style={styles.header}>
              <View style={styles.aiIcon}>
                <MaterialCommunityIcons name="robot" size={32} color={colors.white} />
              </View>
              <Text style={styles.title}>AI Found These Items</Text>
              <Text style={styles.subtitle}>Review and edit your recycling items</Text>
              
              {}
              <View style={styles.summaryContainer}>
                <View style={styles.summaryItem}>
                  <MaterialCommunityIcons name="check-circle" size={20} color={colors.success} />
                  <Text style={styles.summaryText}>
                    {`${availableCount} available`}
                  </Text>
                </View>
                {unavailableCount > 0 && (
                  <View style={styles.summaryItem}>
                    <MaterialCommunityIcons name="alert-circle" size={20} color={colors.error} />
                    <Text style={styles.summaryText}>
                      {`${unavailableCount} not available`}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </GestureDetector>

        <View style={styles.materialsContainer}>
          {materials.length > 0 ? (
            <FlatList
              data={materials}
              renderItem={renderMaterialItem}
              keyExtractor={(item, index) => `${item.material}-${index}`}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.materialsList}
              style={styles.flatListContainer}
              scrollEnabled={true}
              nestedScrollEnabled={true}
              bounces={true}
            />
          ) : (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="recycle" size={64} color={colors.base300} />
                <Text style={styles.emptyTitle}>No items found</Text>
                <Text style={styles.emptySubtitle}>Try recording again or browse our catalog</Text>
              </View>
            )}
          </View>

          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.browseButton} onPress={browseMore}>
              <MaterialCommunityIcons name="magnify" size={20} color={colors.primary} />
              <Text style={styles.browseButtonText}>Browse Items</Text>
            </TouchableOpacity>
            
            {materials.length > 0 && (
              <TouchableOpacity style={styles.addToCartButton} onPress={addToCart}>
                <MaterialCommunityIcons name="cart-plus" size={20} color={colors.white} />
                <Text style={styles.addToCartButtonText}>{`Add to Cart (${availableCount})`}</Text>
              </TouchableOpacity>
            )}
          </View>
        </Reanimated.View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },
  modal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: MODAL_HEIGHT,
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,

    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  handleBar: {
    width: 50,
    height: 5,
    backgroundColor: colors.base300,
    borderRadius: 3,
    alignSelf: 'center',
    marginVertical: spacing.sm,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 0,
    marginBottom: spacing.lg,
    backgroundColor: `${colors.primary}08`,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.md,
  },
  aiIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,

    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    ...typography.title,
    fontSize: 24,
    fontWeight: '800',
    color: colors.black,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.subtitle,
    color: colors.neutral,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
  },
  transcriptionContainer: {
    backgroundColor: colors.base100,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  transcriptionLabel: {
    ...typography.subtitle,
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral,
    marginBottom: spacing.xs,
  },
  transcriptionText: {
    ...typography.body,
    color: colors.black,
    fontStyle: 'italic',
  },
  materialsContainer: {
    flex: 1,
    marginBottom: spacing.lg,
  },
  flatListContainer: {
    flex: 1,
    minHeight: 200,
  },
  materialsList: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.xl,
  },
  materialItem: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    marginHorizontal: spacing.sm,

    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.base200,
  },

  materialItemUnavailableRefined: {
    borderColor: colors.base200,
    backgroundColor: colors.base100,
    opacity: 1,
  },
  materialNameUnavailableRefined: {
    color: colors.error + 'B0',
    opacity: 0.7,
  },
  materialUnitUnavailableRefined: {
    backgroundColor: colors.base200,
    color: colors.neutral + '80',
    opacity: 0.7,
  },
  availabilityIndicatorUnavailableRefined: {
    backgroundColor: colors.base200,
    opacity: 0.7,
  },
  matchInfoUnavailableRefined: {
    backgroundColor: colors.base200,
    color: colors.neutral + '80',
    opacity: 0.7,
  },
  unavailableLabelRefined: {
    ...typography.caption,
    fontSize: 10,
    color: colors.error + 'B0',
    fontWeight: '600',
    backgroundColor: colors.base200,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
    opacity: 0.7,
    marginLeft: spacing.sm,
  },
  materialHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  materialInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  materialNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: spacing.xs,
  },
  materialName: {
    ...typography.subtitle,
    fontSize: 18,
    fontWeight: '700',
    color: colors.black,
    letterSpacing: 0.3,
    lineHeight: 24,

  },
  materialNameUnavailable: {
    color: colors.error,
  },
  materialMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  materialUnit: {
    ...typography.caption,
    fontSize: 12,
    color: colors.neutral,
    textTransform: 'uppercase',
    fontWeight: '600',
    backgroundColor: colors.base100,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  materialUnitUnavailable: {
    backgroundColor: colors.error + '10',
    color: colors.error,
  },
  availabilityIndicator: {
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  availabilityIndicatorAvailable: {
    backgroundColor: colors.success + '10',
  },
  availabilityIndicatorUnavailable: {
    backgroundColor: colors.error + '10',
  },
  matchInfo: {
    ...typography.caption,
    fontSize: 10,
    color: colors.neutral,
    fontWeight: '500',
    backgroundColor: colors.base200,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  unavailableLabel: {
    ...typography.caption,
    fontSize: 10,
    color: colors.error,
    fontWeight: '600',
    backgroundColor: colors.error + '10',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.base200,
  },
  quantityLabel: {
    flex: 1,
  },
  quantityLabelText: {
    ...typography.caption,
    fontSize: 14,
    color: colors.neutral,
    fontWeight: '600',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',

    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  quantityText: {
    ...typography.title,
    fontSize: 18,
    fontWeight: '700',
    color: colors.black,
    marginHorizontal: spacing.lg,
    minWidth: 50,
    textAlign: 'center',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.base100,
    justifyContent: 'center',
    alignItems: 'center',

    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyTitle: {
    ...typography.title,
    fontSize: 20,
    fontWeight: '600',
    color: colors.neutral,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    ...typography.subtitle,
    color: colors.neutral,
    textAlign: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  browseButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  browseButtonText: {
    ...typography.subtitle,
    fontSize: 15,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  addToCartButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,

    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addToCartButtonText: {
    ...typography.subtitle,
    fontSize: 16,
    color: colors.white,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginLeft: spacing.sm,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginVertical: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    ...typography.subtitle,
    color: colors.white,
    fontWeight: '600',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
    gap: spacing.sm,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background + '80',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.background + '60',
  },
  summaryText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
});
