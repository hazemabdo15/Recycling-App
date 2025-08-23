import stockCacheManager from '../utils/stockCacheManager';
import { extractNameFromMultilingual } from '../utils/translationHelpers';
import apiService from "./api/apiService";

let cachedDatabaseItems = new Map(); // Use Map to cache per role
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000;

// Set up cache clearing when stock updates
stockCacheManager.addStockUpdateListener(() => {
  console.log('🔄 [Material Verification] Clearing cache due to stock update');
  cachedDatabaseItems.clear();
  cacheTimestamp = null;
});

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

  // Exact match gets highest score
  if (normalized1 === normalized2) return 100;

  // Split into words for better analysis
  const words1 = normalized1.split(' ');
  const words2 = normalized2.split(' ');

  // Check for exact word sequence match
  if (words1.length === words2.length) {
    let exactWordMatches = 0;
    for (let i = 0; i < words1.length; i++) {
      if (words1[i] === words2[i]) {
        exactWordMatches++;
      }
    }
    if (exactWordMatches === words1.length) return 100;
  }

  // Prioritize longer, more specific matches
  const lengthRatio = Math.min(normalized1.length, normalized2.length) / Math.max(normalized1.length, normalized2.length);
  
  // Enhanced substring checking to avoid false matches
  if (normalized1.includes(normalized2)) {
    // If str2 is much shorter and str1 has additional descriptive words, lower the score
    const word1Count = words1.length;
    const word2Count = words2.length;
    
    // If the longer string has significantly more words, it's likely more specific
    if (word1Count > word2Count && word1Count - word2Count >= 1) {
      // Check if all words from shorter string are in longer string
      const shorterWords = words2;
      const longerWords = words1;
      const matchedWords = shorterWords.filter(word => longerWords.includes(word));
      
      if (matchedWords.length === shorterWords.length) {
        // All words match but longer string is more specific
        return Math.max(60, lengthRatio * 70); // Lower score for partial matches
      }
    }
    
    if (lengthRatio < 0.4) {
      return Math.max(50, lengthRatio * 70); // Further reduced for very different lengths
    } else if (lengthRatio < 0.7) {
      return Math.max(65, lengthRatio * 80);
    }
    return 85; // Reduced from 88
  }
  
  if (normalized2.includes(normalized1)) {
    // Same logic for reverse case
    const word1Count = words1.length;
    const word2Count = words2.length;
    
    if (word2Count > word1Count && word2Count - word1Count >= 1) {
      const shorterWords = words1;
      const longerWords = words2;
      const matchedWords = shorterWords.filter(word => longerWords.includes(word));
      
      if (matchedWords.length === shorterWords.length) {
        return Math.max(60, lengthRatio * 70);
      }
    }
    
    if (lengthRatio < 0.4) {
      return Math.max(50, lengthRatio * 70);
    } else if (lengthRatio < 0.7) {
      return Math.max(65, lengthRatio * 80);
    }
    return 85;
  }

  // Word-based matching with stricter criteria
  let matchingWords = 0;
  let positionScore = 0;
  
  words1.forEach((word1, index1) => {
    words2.forEach((word2, index2) => {
      if (word1 === word2) {
        matchingWords++;
        const positionDiff = Math.abs(index1 - index2);
        const maxIndex = Math.max(words1.length, words2.length);
        positionScore += Math.max(0, 1 - (positionDiff / maxIndex));
      } else if (word1.includes(word2) || word2.includes(word1)) {
        const wordLengthRatio = Math.min(word1.length, word2.length) / Math.max(word1.length, word2.length);
        matchingWords += wordLengthRatio * 0.6; // Reduced from 0.8
      }
    });
  });
  
  const wordScore = (matchingWords / Math.max(words1.length, words2.length)) * 70; // Reduced from 75
  const positionBonus = (positionScore / Math.max(words1.length, words2.length)) * 8; // Reduced from 10

  // Character-level similarity (for typos and variations)
  const maxLen = Math.max(normalized1.length, normalized2.length);
  const minLen = Math.min(normalized1.length, normalized2.length);
  let commonChars = 0;
  
  for (let i = 0; i < minLen; i++) {
    if (normalized1[i] === normalized2[i]) {
      commonChars++;
    }
  }
  
  const charScore = (commonChars / maxLen) * 50; // Reduced from 60
  
  return Math.max(wordScore + positionBonus, charScore);
}

function findBestMatch(materialName, databaseItems) {
  const normalizedMaterial = normalizeName(materialName);

  // First, check for exact matches
  if (databaseItems.index.has(normalizedMaterial)) {
    return {
      item: databaseItems.index.get(normalizedMaterial),
      similarity: 100,
      available: true
    };
  }

  // Check for exact matches without spaces
  const noSpaces = normalizedMaterial.replace(/\s+/g, '');
  if (databaseItems.index.has(noSpaces)) {
    return {
      item: databaseItems.index.get(noSpaces),
      similarity: 95,
      available: true
    };
  }

  // Find all potential matches with their scores
  const candidates = [];
  const SIMILARITY_THRESHOLD = 75; // Increased from 65 to be more strict
  
  databaseItems.items.forEach(item => {
    const itemNameExtracted = extractNameFromMultilingual(item.name, 'en');
    const score = calculateSimilarity(materialName, itemNameExtracted);
    if (score >= SIMILARITY_THRESHOLD) {
      candidates.push({
        item,
        similarity: score,
        itemName: itemNameExtracted,
        nameLength: itemNameExtracted.length,
        wordCount: itemNameExtracted.split(' ').length
      });
    }
  });
  
  if (candidates.length === 0) {
    console.log(`❌ No candidates found for "${materialName}" above threshold ${SIMILARITY_THRESHOLD}%`);
    return null;
  }

  // Enhanced sorting to prefer more specific matches
  candidates.sort((a, b) => {
    // If scores are very close (within 5 points), prefer more specific items
    if (Math.abs(a.similarity - b.similarity) <= 5) {
      const normalizedInput = normalizeName(materialName);
      const inputWordCount = normalizedInput.split(' ').length;
      
      // Prefer items with similar word count to input
      const aWordDiff = Math.abs(a.wordCount - inputWordCount);
      const bWordDiff = Math.abs(b.wordCount - inputWordCount);
      
      if (aWordDiff !== bWordDiff) {
        return aWordDiff - bWordDiff;
      }
      
      // If word counts are similar, prefer longer names (more specific)
      return b.nameLength - a.nameLength;
    }
    
    // Primary sort by similarity score
    return b.similarity - a.similarity;
  });

  console.log(`🔍 Match candidates for "${materialName}":`, 
    candidates.slice(0, 3).map(c => `${c.itemName} (${c.similarity.toFixed(1)}%)`).join(', ')
  );
  
  return {
    item: candidates[0].item,
    similarity: candidates[0].similarity,
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
    
    console.log('🗃️ Database items available:', databaseItems.items.length);
    console.log('🗃️ Sample database items:', databaseItems.items.slice(0, 5).map(item => ({
      name: item.name,
      extractedName: extractNameFromMultilingual(item.name, 'en'),
      id: item._id
    })));
    
    const verifiedMaterials = [];
    
    for (const extractedMaterial of extractedMaterials) {
      const { material: materialName, quantity, unit } = extractedMaterial;
      
      console.log(`🔍 Verifying: "${materialName}"`);

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
        
        console.log(`✅ Material verified: ${materialName} -> ${extractNameFromMultilingual(dbItem.name, 'en')} (${match.similarity}% match)`);
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
        console.log(`❌ Attempted to match against ${databaseItems.items.length} database items`);
        console.log(`❌ Sample matches attempted:`, databaseItems.items.slice(0, 10).map(item => {
          const itemName = extractNameFromMultilingual(item.name, 'en');
          return `${itemName} (${calculateSimilarity(materialName, itemName).toFixed(1)}%)`;
        }));
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
