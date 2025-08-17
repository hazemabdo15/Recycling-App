// Helper to extract name from multilingual object or string
const extractNameFromMultilingual = (nameObject, currentLanguage = 'en') => {
  if (!nameObject) return '';
  
  // If it's already a string, return it
  if (typeof nameObject === 'string') return nameObject;
  
  // If it's an object with language keys, extract the appropriate one
  if (typeof nameObject === 'object') {
    // Try current language first, then fallback to English, then Arabic, then any available
    return nameObject[currentLanguage] || 
           nameObject.en || 
           nameObject.ar || 
           Object.values(nameObject)[0] || 
           '';
  }
  
  return String(nameObject);
};

// Shared translation helper for categories and subcategories
export const getTranslatedName = (t, originalName, type = 'categories', options = {}) => {
  if (!originalName) return originalName;

  const currentLanguage = options.currentLanguage || 'en';

  // First, extract the actual name from the multilingual structure
  const extractedName = extractNameFromMultilingual(originalName, currentLanguage);
  
  // If we have a multilingual object and found a translation, use it directly (preserving spaces)
  if (typeof originalName === 'object' && extractedName) {
    return extractedName;
  }

  // Fallback to the old translation system for legacy data
  const nameToUse = extractedName || originalName;
  
  // Normalize key: lowercase and replace spaces with hyphens for translation key lookup only
  const key = String(nameToUse).toLowerCase().replace(/\s+/g, '-');

  // For subcategories, prefer a category-scoped translation if categoryName is provided
  if (type === 'subcategories') {
    if (options.categoryName) {
      const scoped = t(`items.${options.categoryName}.${key}`, { defaultValue: null });
      if (scoped) return scoped;
    }

    // Fallback to generic items.<key>
    const generic = t(`items.${key}`, { defaultValue: null });
    if (generic) return generic;
    return nameToUse; // Return original name with spaces preserved
  }

  // For categories, use categories.<key>.name
  const translated = t(`categories.${key}.name`, { defaultValue: null });

  // Special-case: if translation missing and key is 'paper', try the paper translation
  if (!translated && key === 'paper') {
    const paperTranslation = t(`categories.paper.name`, { defaultValue: null });
    if (paperTranslation) return paperTranslation;
  }

  if (translated) return translated;
  return nameToUse; // Return original name with spaces preserved
};

// Export the helper for direct use
export { extractNameFromMultilingual };

