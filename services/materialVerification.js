import apiService from "./api/apiService";
let cachedDatabaseItems = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000;

export async function fetchDatabaseItems() {
  try {

    if (cachedDatabaseItems && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
      return cachedDatabaseItems;
    }

    const response = await apiService.get('/categories');
    
    if (!response.data || !Array.isArray(response.data)) {
      throw new Error('Invalid response format from categories API');
    }

    const allItems = [];
    const itemsIndex = new Map();

    response.data.forEach(category => {
      if (category.items && Array.isArray(category.items)) {
        category.items.forEach(item => {
          const itemData = {
            ...item,
            categoryId: category._id,
            categoryName: category.name,
            categoryDescription: category.description,
            available: true
          };
          
          allItems.push(itemData);

          const itemName = item.name.toLowerCase().trim();
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
      categories: response.data
    };

    cachedDatabaseItems = result;
    cacheTimestamp = Date.now();

    console.log(`✅ Database items fetched: ${allItems.length} items from ${response.data.length} categories`);
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

  if (normalized1 === normalized2) return 100;

  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    return 85;
  }

  const words1 = normalized1.split(' ');
  const words2 = normalized2.split(' ');
  let matchingWords = 0;
  
  words1.forEach(word1 => {
    words2.forEach(word2 => {
      if (word1 === word2 || word1.includes(word2) || word2.includes(word1)) {
        matchingWords++;
      }
    });
  });
  
  const wordScore = (matchingWords / Math.max(words1.length, words2.length)) * 70;

  const maxLen = Math.max(normalized1.length, normalized2.length);
  const minLen = Math.min(normalized1.length, normalized2.length);
  let commonChars = 0;
  
  for (let i = 0; i < minLen; i++) {
    if (normalized1[i] === normalized2[i]) {
      commonChars++;
    }
  }
  
  const charScore = (commonChars / maxLen) * 50;
  
  return Math.max(wordScore, charScore);
}

function findBestMatch(materialName, databaseItems) {
  const normalizedMaterial = normalizeName(materialName);

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

  let bestMatch = null;
  let bestScore = 0;
  const SIMILARITY_THRESHOLD = 70;
  
  databaseItems.items.forEach(item => {
    const score = calculateSimilarity(materialName, item.name);
    if (score > bestScore && score >= SIMILARITY_THRESHOLD) {
      bestScore = score;
      bestMatch = item;
    }
  });
  
  if (bestMatch) {
    return {
      item: bestMatch,
      similarity: bestScore,
      available: true
    };
  }
  
  return null;
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

export async function verifyMaterialsAgainstDatabase(extractedMaterials) {
  try {
    console.log('🔍 Starting material verification...');
    console.log('📝 Extracted materials to verify:', extractedMaterials);
    
    if (!extractedMaterials || !Array.isArray(extractedMaterials) || extractedMaterials.length === 0) {
      console.log('⚠️ No materials to verify');
      return [];
    }

    const databaseItems = await fetchDatabaseItems();
    
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
            categoryId: dbItem._id,
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
  cachedDatabaseItems = null;
  cacheTimestamp = null;
  console.log('🗑️ Material cache cleared');
}
