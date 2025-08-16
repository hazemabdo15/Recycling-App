// Shared translation helper for categories and subcategories
export const getTranslatedName = (t, originalName, type = 'categories', options = {}) => {
  if (!originalName) return originalName;

  const hyphenateOutput = !!options.hyphenate;

  // helper to hyphenate a string (trim + single hyphen between words)
  const hyphenate = (s) => String(s).trim().replace(/\s+/g, '-');

  // Normalize key: lowercase and replace spaces with hyphens for more robust matching
  const key = String(originalName).toLowerCase().replace(/\s+/g, '-');

  // For subcategories, prefer a category-scoped translation if categoryName is provided
  if (type === 'subcategories') {
    if (options.categoryName) {
      const scoped = t(`items.${options.categoryName}.${key}`, { defaultValue: null });
      if (scoped) return scoped;
    }

  // Fallback to generic items.<key>
  const generic = t(`items.${key}`, { defaultValue: null });
  if (generic) return generic;
  return hyphenateOutput ? hyphenate(originalName) : originalName;
  }

  // For categories, use categories.<key>.name
  const translated = t(`categories.${key}.name`, { defaultValue: null });

  // Special-case: if translation missing and key is 'paper', try the paper translation
  if (!translated && key === 'paper') {
    const paperTranslation = t(`categories.paper.name`, { defaultValue: null });
    if (paperTranslation) return paperTranslation;
  }

  if (translated) return translated;
  return hyphenateOutput ? hyphenate(originalName) : originalName;
};
