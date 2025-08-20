import { extractNameFromMultilingual } from '../utils/translationHelpers';
import apiService from "./api/apiService";
let cachedDatabaseItems = new Map(); // Use Map to cache per role
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000;

export async function fetchDatabaseItems(userRole = 'customer') {
  try {
    // Use cached data if available and fresh (cache per role)
    const cacheKey = userRole;
    if (cachedDatabaseItems.has(cacheKey) && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
      console.log('🔍 [Material Verification] Using cached data for role:', userRole);
      return cachedDatabaseItems.get(cacheKey);
    }

    console.log('🔍 [Material Verification] Fetching categories from API for role:', userRole);
    const response = await apiService.get(`/categories?role=${userRole}`);
    
    console.log('📊 [Material Verification] API Response:', {
      response: response,
      type: typeof response,
      isArray: Array.isArray(response),
      hasData: response && response.data,
      dataIsArray: response && response.data && Array.isArray(response.data)
    });

    let categoriesData;
    if (Array.isArray(response)) {

      categoriesData = response;
    } else if (response && response.data && Array.isArray(response.data)) {

      categoriesData = response.data;
    } else if (response && Array.isArray(response.categories)) {

      categoriesData = response.categories;
    } else {
      console.error('🔥 [Material Verification] Unexpected response format:', response);
      throw new Error('Invalid response format from categories API');
    }

    const allItems = [];
    const itemsIndex = new Map();

    categoriesData.forEach(category => {
      console.log('🔍 [Material Verification] Processing category:', {
        name: category.name,
        id: category._id,
        hasItems: !!(category.items),
        itemsCount: category.items ? category.items.length : 0
      });
      
      if (category.items && Array.isArray(category.items)) {
        category.items.forEach(item => {
          // Extract the name from multilingual object safely
          const itemNameExtracted = extractNameFromMultilingual(item.name, 'en');
          
          console.log('📝 [Material Verification] Processing item:', {
            name: item.name,
            extractedName: itemNameExtracted,
            id: item._id,
            measurement_unit: item.measurement_unit,
            points: item.points,
            price: item.price
          });
          
          const itemData = {
            ...item,
            categoryId: category._id,
            categoryName: category.name,
            categoryDescription: category.description,
            available: true
          };
          
          allItems.push(itemData);

          const itemName = itemNameExtracted.toLowerCase().trim();
          itemsIndex.set(itemName, itemData);

          const nameNoSpaces = itemName.replace(/\s+/g, '');
          itemsIndex.set(nameNoSpaces, itemData);

          if (itemName.endsWith('s')) {
            itemsIndex.set(itemName.slice(0, -1), itemData);
          } else {
            itemsIndex.set(itemName + 's', itemData);
          }
        });
      } else if (category.subcategories && Array.isArray(category.subcategories)) {

        category.subcategories.forEach(subcategory => {
          // Extract the name from multilingual object safely
          const subcategoryNameExtracted = extractNameFromMultilingual(subcategory.name, 'en');
          
          const itemData = {
            ...subcategory,
            categoryId: category._id,
            categoryName: category.name,
            categoryDescription: category.description,
            available: true
          };
          
          allItems.push(itemData);

          const itemName = subcategoryNameExtracted.toLowerCase().trim();
          itemsIndex.set(itemName, itemData);

          const nameNoSpaces = itemName.replace(/\s+/g, '');
          itemsIndex.set(nameNoSpaces, itemData);

          if (itemName.endsWith('s')) {
            itemsIndex.set(itemName.slice(0, -1), itemData);
          } else {
            itemsIndex.set(itemName + 's', itemData);
          }
        });
      }
    });

    const result = {
      items: allItems,
      index: itemsIndex,
      categories: categoriesData
    };

    if (allItems.length === 0) {
      console.warn('⚠️ [Material Verification] No items found in categories response');
      console.log('📊 [Material Verification] Categories structure:', categoriesData.map(cat => ({
        name: cat.name,
        keys: Object.keys(cat),
        itemsType: typeof cat.items,
        subcategoriesType: typeof cat.subcategories
      })));
    }

    cachedDatabaseItems.set(userRole, result);
    cacheTimestamp = Date.now();

    console.log(`✅ Database items fetched: ${allItems.length} items from ${categoriesData.length} categories`);
    return result;

  } catch (error) {
    console.error('❌ Error fetching database items:', error);
    throw new Error(`Failed to fetch database items: ${error.message}`);
  }
}

function normalizeName(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ');
}

function calculateSimilarity(str1, str2) {
  const normalized1 = normalizeName(str1);
  const normalized2 = normalizeName(str2);

  // Exact match
  if (normalized1 === normalized2) return 100;

  // Calculate length ratio to avoid unfair matches between very different lengths
  const maxLen = Math.max(normalized1.length, normalized2.length);
  const minLen = Math.min(normalized1.length, normalized2.length);
  const lengthRatio = minLen / maxLen;

  // Word-based matching (more accurate for multi-word terms)
  const words1 = normalized1.split(' ');
  const words2 = normalized2.split(' ');
  
  // Calculate exact word matches
  let exactWordMatches = 0;
  words1.forEach(word1 => {
    if (words2.includes(word1)) {
      exactWordMatches++;
    }
  });
  
  // If we have exact word matches, calculate score based on that
  if (exactWordMatches > 0) {
    const wordMatchRatio = exactWordMatches / Math.max(words1.length, words2.length);
    let wordScore = wordMatchRatio * 90;
    
    // Bonus for longer, more specific matches
    if (words1.length > words2.length && exactWordMatches === words2.length) {
      // All words of the shorter term are contained in the longer term
      // Reduce score based on how much longer the first term is
      const specificityPenalty = (words1.length - words2.length) * 10;
      wordScore = Math.max(60, wordScore - specificityPenalty);
    } else if (words2.length > words1.length && exactWordMatches === words1.length) {
      // All words of the shorter term are contained in the longer term
      const specificityPenalty = (words2.length - words1.length) * 10;
      wordScore = Math.max(60, wordScore - specificityPenalty);
    }
    
    return wordScore;
  }

  // Fallback to substring matching, but with length consideration
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    // Penalize matches where one string is much shorter than the other
    const substringScore = 85 * lengthRatio;
    return Math.max(60, substringScore);
  }

  // Calculate partial word matches for fuzzy matching
  let partialWordMatches = 0;
  words1.forEach(word1 => {
    words2.forEach(word2 => {
      if (word1.includes(word2) || word2.includes(word1)) {
        partialWordMatches++;
      }
    });
  });
  
  const partialWordScore = (partialWordMatches / Math.max(words1.length, words2.length)) * 60;

  // Character-based similarity for very fuzzy matches
  let commonChars = 0;
  for (let i = 0; i < minLen; i++) {
    if (normalized1[i] === normalized2[i]) {
      commonChars++;
    }
  }
  
  const charScore = (commonChars / maxLen) * 40;
  
  return Math.max(partialWordScore, charScore);
}

function findBestMatch(materialName, databaseItems) {
  const normalizedMaterial = normalizeName(materialName);

  // Check for exact matches first
  if (databaseItems.index.has(normalizedMaterial)) {
    return {
      item: databaseItems.index.get(normalizedMaterial),
      similarity: 100,
      available: true
    };
  }

  const noSpaces = normalizedMaterial.replace(/\s+/g, '');
  if (databaseItems.index.has(noSpaces)) {
    return {
      item: databaseItems.index.get(noSpaces),
      similarity: 95,
      available: true
    };
  }

  // Find all potential matches and sort them
  let potentialMatches = [];
  const SIMILARITY_THRESHOLD = 70;
  
  databaseItems.items.forEach(item => {
    // Extract names from multilingual object safely
    const itemNameEnglish = extractNameFromMultilingual(item.name, 'en');
    const itemNameArabic = extractNameFromMultilingual(item.name, 'ar');
    
    // Calculate similarity against both English and Arabic names
    const scoreEnglish = calculateSimilarity(materialName, itemNameEnglish);
    const scoreArabic = calculateSimilarity(materialName, itemNameArabic);
    
    // Use the higher score
    const bestScore = Math.max(scoreEnglish, scoreArabic);
    const matchedLanguage = scoreArabic > scoreEnglish ? 'Arabic' : 'English';
    const matchedName = scoreArabic > scoreEnglish ? itemNameArabic : itemNameEnglish;
    
    console.log(`🔍 [Similarity] "${materialName}" vs "${itemNameEnglish}" (EN): ${scoreEnglish}%`);
    console.log(`🔍 [Similarity] "${materialName}" vs "${itemNameArabic}" (AR): ${scoreArabic}%`);
    console.log(`🎯 [Best Score] "${materialName}" -> "${matchedName}" (${matchedLanguage}): ${bestScore}%`);
    
    if (bestScore >= SIMILARITY_THRESHOLD) {
      potentialMatches.push({
        item,
        score: bestScore,
        nameLength: matchedName.length,
        wordCount: matchedName.split(' ').length,
        itemName: itemNameEnglish,
        matchedName: matchedName,
        matchedLanguage: matchedLanguage
      });
    }
  });
  
  if (potentialMatches.length === 0) {
    console.log(`❌ [Match] No matches found for "${materialName}" above ${SIMILARITY_THRESHOLD}% threshold`);
    return null;
  }

  console.log(`🎯 [Match] Found ${potentialMatches.length} potential matches for "${materialName}":`, 
    potentialMatches.map(m => `${m.itemName} via ${m.matchedLanguage} "${m.matchedName}" (${m.score}%)`));

  // Sort matches by:
  // 1. Similarity score (descending)
  // 2. Word count (prefer more specific terms - descending)
  // 3. Name length (prefer longer, more specific names - descending)
  potentialMatches.sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score;
    if (a.wordCount !== b.wordCount) return b.wordCount - a.wordCount;
    return b.nameLength - a.nameLength;
  });

  const bestMatch = potentialMatches[0];
  
  console.log(`✅ [Match] Best match for "${materialName}": ${bestMatch.itemName} via ${bestMatch.matchedLanguage} "${bestMatch.matchedName}" (${bestMatch.score}%)`);
  
  return {
    item: bestMatch.item,
    similarity: bestMatch.score,
    available: true
  };
}

function convertMeasurementUnit(measurementUnit) {

  switch (measurementUnit) {
    case 1:
      return 'KG';
    case 2:
      return 'piece';
    default:
      return 'piece';
  }
}

export async function verifyMaterialsAgainstDatabase(extractedMaterials, userRole = 'customer') {
  try {
    console.log('🔍 Starting material verification for role:', userRole);
    console.log('📝 Extracted materials to verify:', extractedMaterials);
    
    if (!extractedMaterials || !Array.isArray(extractedMaterials) || extractedMaterials.length === 0) {
      console.log('⚠️ No materials to verify');
      return [];
    }

    const databaseItems = await fetchDatabaseItems(userRole);
    
    const verifiedMaterials = [];
    
    for (const extractedMaterial of extractedMaterials) {
      const { material: materialName, quantity, unit } = extractedMaterial;
      
      console.log(`🔍 Verifying: ${materialName}`);

      const match = findBestMatch(materialName, databaseItems);
      
      if (match && match.item) {

        const dbItem = match.item;
        const dbUnit = convertMeasurementUnit(dbItem.measurement_unit);

        let adjustedQuantity = quantity;
        let finalUnit = unit;

        if (unit !== dbUnit) {
          console.log(`⚠️ Unit mismatch for ${materialName}: AI=${unit}, DB=${dbUnit}`);
          finalUnit = dbUnit;

        }
        
        const verifiedItem = {

          material: materialName,
          quantity: adjustedQuantity,
          unit: finalUnit,

          available: true,
          databaseItem: {
            _id: dbItem._id,
            name: dbItem.name,
            points: dbItem.points,
            price: dbItem.price,
            measurement_unit: dbItem.measurement_unit,
            image: dbItem.image,
            categoryId: dbItem.categoryId,
            categoryName: dbItem.categoryName
          },

          matchSimilarity: match.similarity,
          originalMaterialName: materialName,
          databaseMaterialName: dbItem.name,
          unitMatched: unit === dbUnit
        };
        
        console.log(`✅ Material verified: ${materialName} -> ${dbItem.name} (${match.similarity}% match)`);
        verifiedMaterials.push(verifiedItem);
        
      } else {

        const unverifiedItem = {

          material: materialName,
          quantity: quantity,
          unit: unit,

          available: false,
          databaseItem: null,

          matchSimilarity: 0,
          originalMaterialName: materialName,
          databaseMaterialName: null,
          unitMatched: false
        };
        
        console.log(`❌ Material not found in database: ${materialName}`);
        verifiedMaterials.push(unverifiedItem);
      }
    }
    
    console.log('✅ Material verification completed');
    console.log('📊 Verification summary:', {
      total: verifiedMaterials.length,
      available: verifiedMaterials.filter(item => item.available).length,
      unavailable: verifiedMaterials.filter(item => !item.available).length
    });
    
    return verifiedMaterials;
    
  } catch (error) {
    console.error('❌ Material verification error:', error);

    return extractedMaterials.map(material => ({
      ...material,
      available: false,
      databaseItem: null,
      matchSimilarity: 0,
      originalMaterialName: material.material,
      databaseMaterialName: null,
      unitMatched: false,
      error: error.message
    }));
  }
}

export function filterAvailableMaterials(verifiedMaterials) {
  return verifiedMaterials
    .filter(material => material.available && material.databaseItem)
    .map(material => ({
      ...material.databaseItem,
      quantity: material.quantity,
      unit: convertMeasurementUnit(material.databaseItem.measurement_unit)
    }));
}

export function clearMaterialCache() {
  cachedDatabaseItems.clear();
  cacheTimestamp = null;
  console.log('🗑️ Material cache cleared');
}
