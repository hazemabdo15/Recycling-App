import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { showGlobalToast } from '../components/common/GlobalToast';
import { useAuth } from '../context/AuthContext';
import { useLocalization } from '../context/LocalizationContext';
import itemsData from '../data/items.json'; // Import items data for Arabic name lookup
import { useAllItems } from '../hooks/useAPI';
import { useCart } from '../hooks/useCart';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { borderRadius, spacing, typography } from '../styles/theme';
import { isBuyer } from '../utils/roleUtils';
import { extractNameFromMultilingual, getTranslatedName } from '../utils/translationHelpers';

let Reanimated, interpolate, runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming;

try {
  const reanimated = require('react-native-reanimated');
  Reanimated = reanimated.default;
  interpolate = reanimated.interpolate;
  runOnJS = reanimated.runOnJS;
  useAnimatedStyle = reanimated.useAnimatedStyle;
  useSharedValue = reanimated.useSharedValue;
  withSpring = reanimated.withSpring;
  withTiming = reanimated.withTiming;
} catch (_error) {
  const { View: RNView } = require('react-native');
  Reanimated = { View: RNView };
  interpolate = (value, input, output) => output[0];
  runOnJS = (fn) => fn;
  useAnimatedStyle = () => ({});
  useSharedValue = (value) => ({ value });
  withSpring = (value) => value;
  withTiming = (value) => value;
}

const { height } = Dimensions.get('window');
const MODAL_HEIGHT = height * 0.85;
const DISMISS_THRESHOLD = 150;

export default function AIResultsModal() {
  const { user } = useAuth();
  const { t, currentLanguage } = useLocalization();
  const { colors } = useThemedStyles();
  const { handleAddToCart, cartItems } = useCart(user);
  const { items: allItems } = useAllItems();
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

  // Helper function to get translated item names consistently
  const getTranslatedItemName = useCallback((item) => {
    // If the item has a database item with multilingual name, use that directly
    if (item.databaseItem && item.databaseItem.name) {
      return extractNameFromMultilingual(item.databaseItem.name, currentLanguage);
    }
    
    // If the item itself has a multilingual name object, use that
    if (item.name && typeof item.name === 'object') {
      return extractNameFromMultilingual(item.name, currentLanguage);
    }
    
    // For unmatched materials from AI extraction, prefer originalText if available and language is Arabic
    if (!item.databaseItem && item.originalText && currentLanguage === 'ar') {
      return item.originalText;
    }
    
    // For unmatched materials from AI extraction, check if we have Arabic name in items.json
    if (!item.databaseItem && (item.material || item.name)) {
      const materialName = item.material || item.name;
      
      // If language is Arabic, try to find the Arabic name in items.json
      if (currentLanguage === 'ar') {
        // Look for the material in items.json (case-insensitive)
        const itemKey = Object.keys(itemsData).find(key => 
          key.toLowerCase() === materialName.toLowerCase()
        );
        
        if (itemKey && itemsData[itemKey].arname) {
          return itemsData[itemKey].arname;
        }
      }
      
      // Return the original material name
      return materialName;
    }
    
    // For AI-extracted materials that don't have database matches yet
    const originalName = item.name || item.material || "Unknown Item";
    const categoryName = item.categoryName || item.category || null;
    
    // If it's a string name, it might be from AI extraction - try translation as fallback
    if (typeof originalName === 'string') {
      // If language is Arabic, try to find the Arabic name in items.json first
      if (currentLanguage === 'ar') {
        const itemKey = Object.keys(itemsData).find(key => 
          key.toLowerCase() === originalName.toLowerCase()
        );
        
        if (itemKey && itemsData[itemKey].arname) {
          return itemsData[itemKey].arname;
        }
      }
      
      // Safely extract category name from multilingual structure
      const categoryNameForTranslation = categoryName 
        ? extractNameFromMultilingual(categoryName, currentLanguage) 
        : null;
      
      const translatedName = getTranslatedName(t, originalName, 'subcategories', { 
        categoryName: categoryNameForTranslation
          ? categoryNameForTranslation.toLowerCase().replace(/\s+/g, '-')
          : null,
        currentLanguage
      });
      
      // Only use translated name if it's different from the key pattern
      // If it returns something like "items.shredded-paper", use original instead
      if (translatedName && !translatedName.includes('items.') && translatedName !== originalName) {
        return translatedName;
      }
      
      return originalName;
    }
    
    return originalName;
  }, [t, currentLanguage]);

  const safeMaterials = useMemo(() => materials || [], [materials]);
  const availableCount = safeMaterials.filter(material => material.available !== false).length;
  const unavailableCount = safeMaterials.length - availableCount;

  const validationResults = useMemo(() => {
    const validationErrors = [];
    const validItems = [];
    
    safeMaterials.forEach((material, index) => {
      if (material.available !== false) {

        const measurementUnit = material.databaseItem?.measurement_unit;
        
        console.log(`[AI Results Modal] Validating material ${index}:`, {
          material: material.material,
          quantity: material.quantity,
          unit: material.unit,
          databaseMeasurementUnit: measurementUnit,
          databaseItemName: material.databaseItem?.name
        });

        if (measurementUnit !== undefined) {
          const minQuantity = measurementUnit === 1 ? 0.25 : 1; // Use 0.25 for kg items, 1 for pieces
          
          console.log(`[AI Results Modal] Min quantity for measurement_unit ${measurementUnit}:`, minQuantity);
          
          if (material.quantity < minQuantity) {
            validationErrors.push({
              index,
              material: material.material,
              currentQuantity: material.quantity,
              minQuantity,
              unit: material.unit
            });
          } else {
            validItems.push(material);
          }
        } else {

          validItems.push(material);
        }
      }
    });
    
    return {
      hasErrors: validationErrors.length > 0,
      errors: validationErrors,
      validItems,
      totalErrors: validationErrors.length
    };
  }, [safeMaterials]);

  const hasMaterials = materials && materials.length > 0;
  const styles = getAIResultsModalStyles(colors);

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

        const measurementUnit = item.databaseItem?.measurement_unit;
        const step = measurementUnit === 1 ? 0.25 : 1;
        const minValue = measurementUnit === 1 ? 0.25 : 1; // Use 0.25 for kg items, 1 for pieces
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
    if (validationResults.hasErrors) {
      const errorMessage = `Please fix quantity issues:\n${validationResults.errors.map(error => 
        `• ${error.material}: minimum ${error.minQuantity} ${error.unit}`
      ).join('\n')}`;
      alert(errorMessage);
      return;
    }

    console.log('🚀 [AI Results Modal] Starting cart addition with stock validation');
    
    const availableMaterials = materials.filter(item => item.available && item.databaseItem);
    if (availableMaterials.length === 0) {
      alert(t('aiResults.noAvailableMaterials'));
      return;
    }
    
    // Only apply stock validation for buyer users
    const applyStockValidation = isBuyer(user);
    
    // Create a map of stock quantities for quick lookup (only if needed for buyers)
    const stockMap = {};
    if (applyStockValidation) {
      allItems.forEach(item => {
        // Fix: Handle 0 values properly - use nullish coalescing and explicit checks
        let stockQuantity;
        if (item.quantity !== undefined && item.quantity !== null) {
          stockQuantity = item.quantity;
        } else if (item.available_quantity !== undefined && item.available_quantity !== null) {
          stockQuantity = item.available_quantity;
        } else if (item.stock_quantity !== undefined && item.stock_quantity !== null) {
          stockQuantity = item.stock_quantity;
        } else if (item.quantity_available !== undefined && item.quantity_available !== null) {
          stockQuantity = item.quantity_available;
        }
        
        // Include items with 0 stock in the map
        if (stockQuantity !== undefined && stockQuantity !== null) {
          stockMap[item._id] = stockQuantity;
        }
      });
    }
    
    // Create a map of current cart quantities for quick lookup (only if needed for buyers)
    const currentCartQuantities = {};
    if (applyStockValidation) {
      Object.entries(cartItems).forEach(([itemId, quantity]) => {
        currentCartQuantities[itemId] = quantity;
      });
    }
    
    const processedItems = [];
    const stockWarnings = [];
    
    availableMaterials.forEach((material, index) => {
      const itemId = material.databaseItem._id;
      const requestedQuantity = material.quantity;
      
      // Find the original item from allItems to get the English name
      const originalItem = allItems.find(item => item._id === itemId);
      const itemName = originalItem ? originalItem.name : material.databaseItem.name;
      
      // Debug: Log the item names to understand what we're working with
      console.log('🔍 [AI Results Modal] Item name analysis:', {
        originalMaterial: material.material,
        databaseItemName: material.databaseItem.name,
        allItemsName: originalItem?.name,
        finalItemName: itemName,
        databaseItemId: material.databaseItem._id,
        categoryName: material.databaseItem.categoryName
      });
      
      // For customers (non-buyers), add full requested quantity without stock checks
      if (!applyStockValidation) {
        processedItems.push({
          _id: material.databaseItem._id,
          categoryId: material.databaseItem.categoryId,
          categoryName: material.databaseItem.categoryName,
          name: itemName, // Use original English name from allItems or fallback to database
          image: material.databaseItem.image,
          points: material.databaseItem.points,
          price: material.databaseItem.price,
          measurement_unit: material.databaseItem.measurement_unit,
          quantity: requestedQuantity
        });
        return;
      }
      
      // For buyers, apply stock validation
      const currentCartQuantity = currentCartQuantities[itemId] || 0;
      const stockQuantity = stockMap[itemId];
      
      if (stockQuantity === undefined) {
        // No stock limit, add full quantity
        processedItems.push({
          _id: material.databaseItem._id,
          categoryId: material.databaseItem.categoryId,
          categoryName: material.databaseItem.categoryName,
          name: itemName, // Use original English name from allItems or fallback to database
          image: material.databaseItem.image,
          points: material.databaseItem.points,
          price: material.databaseItem.price,
          measurement_unit: material.databaseItem.measurement_unit,
          quantity: requestedQuantity
        });
        return;
      }
      
      // Check if item is out of stock (stock quantity is 0 or negative)
      if (stockQuantity <= 0) {
        // Don't add out of stock items, but record as discarded
        const unitText = material.databaseItem.measurement_unit === 1 ? 'kg' : 'pieces';
        const translatedItemName = getTranslatedItemName(material.databaseItem);
        stockWarnings.push({
          name: translatedItemName, // Use translated name for user messages
          discarded: requestedQuantity,
          unit: unitText,
          availableStock: stockQuantity,
          currentInCart: currentCartQuantity,
          reason: 'out_of_stock'
        });
        return;
      }
      
      // Calculate how much we can actually add
      const availableToAdd = Math.max(0, stockQuantity - currentCartQuantity);
      const quantityToAdd = Math.min(requestedQuantity, availableToAdd);
      const discardedQuantity = requestedQuantity - quantityToAdd;
      
      if (quantityToAdd > 0) {
        processedItems.push({
          _id: material.databaseItem._id,
          categoryId: material.databaseItem.categoryId,
          categoryName: material.databaseItem.categoryName,
          name: itemName, // Use original English name from allItems or fallback to database
          image: material.databaseItem.image,
          points: material.databaseItem.points,
          price: material.databaseItem.price,
          measurement_unit: material.databaseItem.measurement_unit,
          quantity: quantityToAdd
        });
      }
      
      if (discardedQuantity > 0) {
        const unitText = material.databaseItem.measurement_unit === 1 ? 'kg' : 'pieces';
        const translatedItemName = getTranslatedItemName(material.databaseItem);
        stockWarnings.push({
          name: translatedItemName, // Use translated name for user messages
          discarded: discardedQuantity,
          unit: unitText,
          availableStock: stockQuantity,
          currentInCart: currentCartQuantity
        });
      }
    });
    
    console.log('📦 [AI Results Modal] Final processed items:', processedItems);
    console.log('⚠️ [AI Results Modal] Stock warnings:', stockWarnings);
    
    // Add items to cart if we have any to add
    if (processedItems.length > 0) {
      console.log('🔄 [AI Results Modal] Adding items to cart:', processedItems);
      handleAddToCart(processedItems);
      
      // Show appropriate message based on role and stock warnings (only for buyers)
      if (applyStockValidation && stockWarnings.length > 0) {
        const outOfStockWarnings = stockWarnings.filter(w => w.reason === 'out_of_stock');
        const limitWarnings = stockWarnings.filter(w => w.reason !== 'out_of_stock');
        
        if (stockWarnings.length === 1) {
          const warning = stockWarnings[0];
          if (warning.reason === 'out_of_stock') {
            showGlobalToast(
              t('toast.ai.outOfStockNotAdded', { itemName: warning.name }),
              1200,
              'error'
            );
          } else {
            const availableToAdd = warning.availableStock - warning.currentInCart;
            showGlobalToast(
              t('toast.ai.limitedStockReduced', { 
                itemName: warning.name, 
                availableToAdd: availableToAdd, 
                unit: warning.unit, 
                discarded: warning.discarded 
              }),
              1200,
              'warning'
            );
          }
        } else {
          // Multiple items with stock issues
          const addedCount = processedItems.length;
          let message = t('toast.ai.multipleItemsAdded', { 
            addedCount, 
            s: addedCount > 1 ? 's' : '' 
          });
          
          if (outOfStockWarnings.length > 0) {
            message += t('toast.ai.multipleItemsWithOutOfStock', { 
              outOfStockCount: outOfStockWarnings.length, 
              s: outOfStockWarnings.length > 1 ? 's were' : ' was' 
            });
          }
          
          if (limitWarnings.length > 0) {
            message += t('toast.ai.multipleItemsWithLimits', { 
              limitCount: limitWarnings.length, 
              s: limitWarnings.length > 1 ? 's had' : ' had' 
            });
          }
          
          showGlobalToast(message, 1200, 'warning');
        }
      } else {
        // No stock issues or customer user, show regular success message
        const addedCount = processedItems.length;
        showGlobalToast(
          t('toast.ai.singleItemAdded', { 
            addedCount, 
            s: addedCount > 1 ? 's' : '' 
          }),
          1200,
          'success'
        );
      }
    } else if (stockWarnings.length > 0) {
      // No items added but we have warnings (all items were out of stock or limited)
      showGlobalToast(t('toast.ai.noItemsStockLimitations'), 1200, 'error');
    } else {
      // No items and no warnings - shouldn't happen but just in case
      showGlobalToast(t('toast.ai.noItemsAdded'), 1200, 'error');
    }

    // Use back navigation first to close modal, then navigate to cart
    router.back();
    setTimeout(() => {
      router.push('/(tabs)/cart');
    }, 100);
  }, [materials, handleAddToCart, validationResults, cartItems, allItems, user, t, getTranslatedItemName]);

  const browseMore = useCallback(() => {
    // Use back navigation first to close modal, then navigate to explore
    router.back();
    setTimeout(() => {
      router.push('/(tabs)/explore');
    }, 100);
  }, []);

  const renderMaterialItem = ({ item, index }) => {
    const isAvailable = item.available !== false;
    
    // Get the appropriate item object for translation
    const itemForTranslation = isAvailable && item.databaseItem ? item.databaseItem : item;
    const translatedName = getTranslatedItemName(itemForTranslation);
    const displayName = translatedName || item.material || "Unknown Item";

    const validationError = validationResults.errors.find(error => error.index === index);
    const hasValidationError = !!validationError;

    return (
      <View style={[
        styles.materialItem, 
        !isAvailable && styles.materialItemUnavailableRefined,
        hasValidationError && styles.materialItemValidationError
      ]}>
        <View style={styles.materialHeader}>
          <View style={styles.materialInfo}>
            <View style={styles.materialNameRow}>
              <Text
                style={[
                  styles.materialName, 
                  !isAvailable && styles.materialNameUnavailableRefined,
                  hasValidationError && styles.materialNameValidationError
                ]}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {displayName ? String(displayName) : ''}
              </Text>
              {}
              <View style={[
                styles.availabilityIndicator, 
                isAvailable ? styles.availabilityIndicatorAvailable : styles.availabilityIndicatorUnavailableRefined, 
                { marginLeft: 4 }
              ]}> 
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
                <Text style={[
                  styles.materialUnit, 
                  !isAvailable && styles.materialUnitUnavailableRefined,
                  hasValidationError && styles.materialUnitValidationError
                ]}>
                  {String(item.unit)}
                </Text>
              ) : null}
              {}
              {item.matchSimilarity && item.matchSimilarity < 100 ? (
                <Text style={[
                  styles.matchInfo, 
                  !isAvailable && styles.matchInfoUnavailableRefined,
                  hasValidationError && styles.matchInfoValidationError
                ]}>
                  {String(item.matchSimilarity)}% match
                </Text>
              ) : null}
              {!isAvailable ? (
                <Text style={styles.unavailableLabelRefined}>
                  Not Available
                </Text>
              ) : null}
              {hasValidationError ? (
                <Text style={styles.validationErrorLabel}>
                  Min: {validationError.minQuantity} {validationError.unit}
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
          <Text style={[
            styles.quantityLabelText, 
            !isAvailable && { color: colors.neutral + '80' },
            hasValidationError && styles.quantityLabelValidationError
          ]}>
            Quantity {hasValidationError && (
              <MaterialCommunityIcons name="alert" size={14} color={colors.warning} />
            )}
          </Text>
        </View>
        <View style={styles.quantityControls}>
          <TouchableOpacity
            style={[
              styles.quantityButton, 
              !isAvailable && { backgroundColor: colors.base200 }
            ]}
            onPress={() => updateQuantity(index, -1)}
            disabled={!isAvailable}
          >
            <MaterialCommunityIcons name="minus" size={20} color={isAvailable ? colors.white : colors.neutral + '80'} />
          </TouchableOpacity>
          <Text style={[
            styles.quantityText, 
            !isAvailable && { color: colors.neutral + '80' },
            hasValidationError && styles.quantityTextValidationError
          ]}>
            {item.unit === 'KG' ? item.quantity.toFixed(2) : item.quantity}
          </Text>
          <TouchableOpacity
            style={[
              styles.quantityButton, 
              !isAvailable && { backgroundColor: colors.base200 }
            ]}
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
            <Text style={styles.title}>{t('aiResults.noMaterialsFound')}</Text>
          </View>
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons name="alert-circle-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.errorText}>{t('aiResults.noMaterialsExtracted')}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => router.back()}
            >
              <Text style={styles.retryButtonText}>{t('aiResults.goBack')}</Text>
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
              <Text style={styles.title}>{t('aiResults.title')}</Text>
              <Text style={styles.subtitle}>{t('aiResults.subtitle')}</Text>
              
              {}
              <View style={styles.summaryContainer}>
                <View style={styles.summaryItem}>
                  <MaterialCommunityIcons name="check-circle" size={20} color={colors.success} />
                  <Text style={styles.summaryText}>
                    {`${availableCount} ${t('aiResults.available')}`}
                  </Text>
                </View>
                {unavailableCount > 0 && (
                  <View style={styles.summaryItem}>
                    <MaterialCommunityIcons name="alert-circle" size={20} color={colors.error} />
                    <Text style={styles.summaryText}>
                      {`${unavailableCount} ${t('aiResults.notAvailable')}`}
                    </Text>
                  </View>
                )}
                {validationResults.hasErrors && (
                  <View style={styles.summaryItem}>
                    <MaterialCommunityIcons name="alert" size={20} color={colors.warning} />
                    <Text style={styles.summaryText}>
                      {`${validationResults.errors.length} ${t('aiResults.needMinQuantity', { s: validationResults.errors.length > 1 ? '' : 's' })}`}
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
                <Text style={styles.emptyTitle}>{t('aiResults.noItemsFound')}</Text>
                <Text style={styles.emptySubtitle}>{t('aiResults.noItemsSubtitle')}</Text>
              </View>
            )}
          </View>

          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.browseButton} onPress={browseMore}>
              <MaterialCommunityIcons name="magnify" size={20} color={colors.primary} />
              <Text style={styles.browseButtonText}>{t('aiResults.browseItems')}</Text>
            </TouchableOpacity>
            
            {materials.length > 0 && (
              <TouchableOpacity 
                style={[
                  styles.addToCartButton,
                  validationResults.hasErrors && styles.addToCartButtonDisabled
                ]}
                onPress={addToCart}
                disabled={validationResults.hasErrors}
              >
                <MaterialCommunityIcons 
                  name={validationResults.hasErrors ? "alert" : "cart-plus"} 
                  size={20} 
                  color={validationResults.hasErrors ? colors.warning : colors.white} 
                />
                <Text style={[
                  styles.addToCartButtonText,
                  validationResults.hasErrors && styles.addToCartButtonTextDisabled
                ]}>
                  {validationResults.hasErrors 
                    ? t('aiResults.fixItemsFirst', { 
                        count: validationResults.errors.length,
                        s: validationResults.errors.length > 1 ? 's' : ''
                      })
                    : `${t('aiResults.addToCart')} (${availableCount})`
                  }
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Reanimated.View>
    </GestureHandlerRootView>
  );
}

const getAIResultsModalStyles = (colors) => StyleSheet.create({
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
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.subtitle,
    color: colors.textSecondary,
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
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  transcriptionText: {
    ...typography.body,
    color: colors.textPrimary,
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
    backgroundColor: colors.surface,
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
    borderColor: colors.border,
  },

  materialItemUnavailableRefined: {
    borderColor: colors.border,
    backgroundColor: colors.base100,
    opacity: 1,
  },
  materialNameUnavailableRefined: {
    color: colors.error + 'B0',
    opacity: 0.7,
  },
  materialUnitUnavailableRefined: {
    backgroundColor: colors.base200,
    color: colors.textSecondary + '80',
    opacity: 0.7,
  },
  availabilityIndicatorUnavailableRefined: {
    backgroundColor: colors.base200,
    opacity: 0.7,
  },
  matchInfoUnavailableRefined: {
    backgroundColor: colors.base200,
    color: colors.textSecondary + '80',
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
    color: colors.textPrimary,
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
    color: colors.textSecondary,
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
    color: colors.textSecondary,
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
    borderTopColor: colors.border,
  },
  quantityLabel: {
    flex: 1,
  },
  quantityLabelText: {
    ...typography.caption,
    fontSize: 14,
    color: colors.textSecondary,
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
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 0,
  },
  quantityText: {
    ...typography.title,
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
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
    color: colors.textSecondary,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    ...typography.subtitle,
    color: colors.textSecondary,
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
    backgroundColor: colors.surface,
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
    gap: spacing.xs,
  },
  summaryText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  materialItemValidationError: {
    borderColor: colors.warning + '60',
    borderWidth: 1,
    backgroundColor: colors.surface,

    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  materialNameValidationError: {
    color: colors.warning,
    fontWeight: '700',
  },
  materialUnitValidationError: {
    color: colors.warning,
    backgroundColor: colors.warning + '12',
    borderWidth: 0,
  },
  matchInfoValidationError: {
    color: colors.warning,
    backgroundColor: colors.warning + '12',
  },
  quantityLabelValidationError: {
    color: colors.warning,
    fontWeight: '700',
  },
  quantityTextValidationError: {
    color: colors.warning,
    fontWeight: '800',
  },
  validationErrorLabel: {
    ...typography.caption,
    color: colors.warning,
    fontWeight: '700',
    fontSize: 10,
    backgroundColor: colors.warning + '15',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  addToCartButtonDisabled: {
    backgroundColor: colors.base200,
    shadowColor: colors.base400,
    shadowOpacity: 0.1,
    elevation: 2,
  },
  addToCartButtonTextDisabled: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
