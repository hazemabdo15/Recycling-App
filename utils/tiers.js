// Tier system configuration and utility functions
export const rewardLevels = [
  {
    id: 1,
    name: "Eco Beginner",
    minRecycles: 0,
    maxRecycles: 4,
    bonusPerOrder: 1,
    bonusPerReachedTier: 50,
  },
  {
    id: 2,
    name: "Eco Starter",
    minRecycles: 5,
    maxRecycles: 14,
    bonusPerOrder: 5,
    bonusPerReachedTier: 150,
  },
  {
    id: 3,
    name: "Green Helper",
    minRecycles: 15,
    maxRecycles: 29,
    bonusPerOrder: 10,
    bonusPerReachedTier: 300,
  },
  {
    id: 4,
    name: "Silver Recycler",
    minRecycles: 30,
    maxRecycles: 49,
    bonusPerOrder: 15,
    bonusPerReachedTier: 500,
  },
  {
    id: 5,
    name: "Gold Guardian",
    minRecycles: 50,
    maxRecycles: 74,
    bonusPerOrder: 20,
    bonusPerReachedTier: 700,
  },
  {
    id: 6,
    name: "Platinum Pioneer",
    minRecycles: 75,
    maxRecycles: 99,
    bonusPerOrder: 25,
    bonusPerReachedTier: 850,
  },
  {
    id: 7,
    name: "Diamond Elite",
    minRecycles: 100,
    maxRecycles: 999999,
    bonusPerOrder: 30,
    bonusPerReachedTier: 1000,
  },
];

// Color scheme for each tier
export const tierColors = {
  "Eco Beginner": { 
    primary: "#10B981", 
    secondary: "#34D399", 
    gradient: ["#10B981", "#34D399"],
    lightGradient: ["#e8f5e8", "#f1f8e9"]
  },
  "Eco Starter": { 
    primary: "#3B82F6", 
    secondary: "#60A5FA", 
    gradient: ["#3B82F6", "#60A5FA"],
    lightGradient: ["#e3f2fd", "#f3e5f5"]
  },
  "Green Helper": { 
    primary: "#8B5CF6", 
    secondary: "#A78BFA", 
    gradient: ["#8B5CF6", "#A78BFA"],
    lightGradient: ["#f3e8ff", "#faf5ff"]
  },
  "Silver Recycler": { 
    primary: "#6B7280", 
    secondary: "#9CA3AF", 
    gradient: ["#6B7280", "#9CA3AF"],
    lightGradient: ["#f1f5f9", "#f8fafc"]
  },
  "Gold Guardian": { 
    primary: "#F59E0B", 
    secondary: "#FBBF24", 
    gradient: ["#F59E0B", "#FBBF24"],
    lightGradient: ["#fff3e0", "#fce4ec"]
  },
  "Platinum Pioneer": { 
    primary: "#8B5CF6", 
    secondary: "#C084FC", 
    gradient: ["#8B5CF6", "#C084FC"],
    lightGradient: ["#f3e8ff", "#fdf4ff"]
  },
  "Diamond Elite": { 
    primary: "#EC4899", 
    secondary: "#F472B6", 
    gradient: ["#EC4899", "#F472B6"],
    lightGradient: ["#fdf2f8", "#fef7ff"]
  }
};

// Icons for each tier
export const tierIcons = {
  "Eco Beginner": "leaf",
  "Eco Starter": "sprout",
  "Green Helper": "hand-heart",
  "Silver Recycler": "medal",
  "Gold Guardian": "crown",
  "Platinum Pioneer": "diamond-stone",
  "Diamond Elite": "star-circle"
};

/**
 * Calculate user's current tier based on total recycling orders
 * @param {number} totalRecycles - Total number of completed recycling orders
 * @returns {object} Current tier object
 */
export const calculateUserTier = (totalRecycles) => {
  return rewardLevels.find(tier => 
    totalRecycles >= tier.minRecycles && totalRecycles <= tier.maxRecycles
  ) || rewardLevels[0];
};

/**
 * Get the next tier for progression
 * @param {object} currentTier - Current tier object
 * @returns {object|null} Next tier object or null if at max tier
 */
export const getNextTier = (currentTier) => {
  const currentIndex = rewardLevels.findIndex(tier => tier.id === currentTier.id);
  return currentIndex < rewardLevels.length - 1 ? rewardLevels[currentIndex + 1] : null;
};

/**
 * Calculate progress percentage to next tier
 * @param {number} totalRecycles - Total recycling orders
 * @param {object} currentTier - Current tier object
 * @param {object} nextTier - Next tier object
 * @returns {number} Progress percentage (0-100)
 */
export const calculateProgress = (totalRecycles, currentTier, nextTier) => {
  if (!nextTier) return 100; // Max tier reached
  
  const progress = ((totalRecycles - currentTier.minRecycles) / (nextTier.minRecycles - currentTier.minRecycles)) * 100;
  return Math.min(Math.max(progress, 0), 100);
};

/**
 * Get tier colors for a specific tier
 * @param {string} tierName - Name of the tier
 * @returns {object} Color configuration for the tier
 */
export const getTierColors = (tierName) => {
  return tierColors[tierName] || tierColors["Eco Beginner"];
};

/**
 * Get tier icon for a specific tier
 * @param {string} tierName - Name of the tier
 * @returns {string} Icon name for the tier
 */
export const getTierIcon = (tierName) => {
  return tierIcons[tierName] || tierIcons["Eco Beginner"];
};

/**
 * Calculate total points earned from tier bonuses
 * @param {number} totalRecycles - Total recycling orders
 * @param {object} currentTier - Current tier object
 * @returns {number} Total bonus points earned
 */
export const calculateTierBonusPoints = (totalRecycles, currentTier) => {
  let totalBonus = 0;
  
  // Add bonus for reaching current tier
  totalBonus += currentTier.bonusPerReachedTier;
  
  // Add bonus per order for current tier
  const ordersInCurrentTier = totalRecycles - currentTier.minRecycles;
  totalBonus += ordersInCurrentTier * currentTier.bonusPerOrder;
  
  // Add bonuses from previous tiers
  const previousTiers = rewardLevels.filter(tier => tier.id < currentTier.id);
  previousTiers.forEach(tier => {
    totalBonus += tier.bonusPerReachedTier;
    const ordersInTier = tier.maxRecycles - tier.minRecycles + 1;
    totalBonus += ordersInTier * tier.bonusPerOrder;
  });
  
  return totalBonus;
};
