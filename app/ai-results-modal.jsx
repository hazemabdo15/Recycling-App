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
import { borderRadius, colors, spacing, typography } from '../styles/theme';

const { height } = Dimensions.get('window');
const MODAL_HEIGHT = height * 0.85;
const DISMISS_THRESHOLD = 150;

export default function AIResultsModal() {
  const params = useLocalSearchParams();
  const { extractedMaterials = '[]' } = params;
  
  // Parse the extracted materials from JSON string
  let parsedMaterials = [];
  try {
    parsedMaterials = JSON.parse(extractedMaterials);
  } catch (error) {
    console.error('Error parsing extracted materials:', error);
    parsedMaterials = [];
  }
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  
  const [materials, setMaterials] = useState(parsedMaterials);

  // Safety check - if no materials, go back
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
        // Use 0.25 step for KG, 1 step for pieces
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
    // Navigate to cart with materials - dismiss all modals first
    router.dismissAll();
    router.push({
      pathname: '/(tabs)/cart',
      params: { newItems: JSON.stringify(materials) }
    });
  }, [materials]);

  const browseMore = useCallback(() => {
    // Navigate to explore - dismiss all modals first
    router.dismissAll();
    router.push('/(tabs)/explore');
  }, []);

  const renderMaterialItem = ({ item, index }) => (
    <View style={styles.materialItem}>
      {/* Header row with material name and delete button */}
      <View style={styles.materialHeader}>
        <View style={styles.materialInfo}>
          <Text style={styles.materialName} numberOfLines={2} ellipsizeMode="tail">
            {item.material}
          </Text>
          <Text style={styles.materialUnit}>{item.unit}</Text>
        </View>
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => removeMaterial(index)}
        >
          <MaterialCommunityIcons name="delete-outline" size={22} color={colors.error} />
        </TouchableOpacity>
      </View>
      
      {/* Bottom row with quantity controls */}
      <View style={styles.quantityRow}>
        <View style={styles.quantityLabel}>
          <Text style={styles.quantityLabelText}>Quantity</Text>
        </View>
        
        <View style={styles.quantityControls}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => updateQuantity(index, -1)}
          >
            <MaterialCommunityIcons name="minus" size={20} color={colors.white} />
          </TouchableOpacity>
          
          <Text style={styles.quantityText}>
            {item.unit === 'KG' ? item.quantity.toFixed(2) : item.quantity}
          </Text>
          
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => updateQuantity(index, 1)}
          >
            <MaterialCommunityIcons name="plus" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Safety check - if no materials, show error state
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
              <Text style={styles.browseButtonText}>Browse More</Text>
            </TouchableOpacity>
            
            {materials.length > 0 && (
              <TouchableOpacity style={styles.addToCartButton} onPress={addToCart}>
                <MaterialCommunityIcons name="cart-plus" size={20} color={colors.white} />
                <Text style={styles.addToCartButtonText}>Add to Cart ({materials.length})</Text>
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
    // Elegant modal shadow
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
    // Soft shadow for icon
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
    // Enhanced elegant shadow
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
  materialName: {
    ...typography.subtitle,
    fontSize: 18,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing.xs,
    letterSpacing: 0.3,
    lineHeight: 24,
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
    alignSelf: 'flex-start',
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
    // Enhanced button shadow
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
    // Subtle shadow for delete button
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
    // Enhanced button shadow
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
});
