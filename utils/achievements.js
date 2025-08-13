// Achievement milestones configuration and utility functions

export const achievementMilestones = [
  { 
    id: 1, 
    name: "First Steps", 
    description: "Complete your first recycling order", 
    threshold: 1, 
    icon: "leaf",
    points: 25
  },
  { 
    id: 2, 
    name: "Getting Started", 
    description: "Complete 5 recycling orders", 
    threshold: 5, 
    icon: "sprout",
    points: 50
  },
  { 
    id: 3, 
    name: "Eco Warrior", 
    description: "Complete 25 recycling orders", 
    threshold: 25, 
    icon: "shield",
    points: 100
  },
  { 
    id: 4, 
    name: "Planet Saver", 
    description: "Complete 50 recycling orders", 
    threshold: 50, 
    icon: "earth",
    points: 200
  },
  { 
    id: 5, 
    name: "Green Legend", 
    description: "Complete 100 recycling orders", 
    threshold: 100, 
    icon: "crown",
    points: 500
  }
];

/**
 * Get completed achievements based on total recycling orders
 * @param {number} totalRecycles - Total number of completed recycling orders
 * @returns {array} Array of completed achievement objects
 */
export const getCompletedAchievements = (totalRecycles) => {
  return achievementMilestones.filter(achievement => totalRecycles >= achievement.threshold);
};

/**
 * Get next achievement to unlock
 * @param {number} totalRecycles - Total number of completed recycling orders
 * @returns {object|null} Next achievement object or null if all completed
 */
export const getNextAchievement = (totalRecycles) => {
  return achievementMilestones.find(achievement => totalRecycles < achievement.threshold) || null;
};

/**
 * Calculate total points earned from achievements
 * @param {number} totalRecycles - Total number of completed recycling orders
 * @returns {number} Total points from achievements
 */
export const calculateAchievementPoints = (totalRecycles) => {
  const completedAchievements = getCompletedAchievements(totalRecycles);
  return completedAchievements.reduce((total, achievement) => total + achievement.points, 0);
};

/**
 * Calculate environmental impact statistics
 * @param {number} totalRecycles - Total number of completed recycling orders
 * @returns {object} Environmental impact statistics
 */
export const calculateEnvironmentalImpact = (totalRecycles) => {
  // Estimated values per recycling order
  const co2SavedPerOrder = 2.5; // kg CO2
  const treesEquivalentPerOrder = 0.1; // trees
  const waterSavedPerOrder = 15; // liters
  const energySavedPerOrder = 5; // kWh
  
  return {
    co2Saved: Math.round(totalRecycles * co2SavedPerOrder * 10) / 10, // kg CO2
    treesEquivalent: Math.round(totalRecycles * treesEquivalentPerOrder * 10) / 10, // trees
    waterSaved: Math.round(totalRecycles * waterSavedPerOrder), // liters
    energySaved: Math.round(totalRecycles * energySavedPerOrder), // kWh
  };
};

/**
 * Check if user has reached a new achievement
 * @param {number} previousRecycles - Previous total recycling orders
 * @param {number} currentRecycles - Current total recycling orders
 * @returns {array} Array of newly unlocked achievements
 */
export const getNewlyUnlockedAchievements = (previousRecycles, currentRecycles) => {
  const previousAchievements = getCompletedAchievements(previousRecycles);
  const currentAchievements = getCompletedAchievements(currentRecycles);
  
  return currentAchievements.filter(achievement => 
    !previousAchievements.some(prev => prev.id === achievement.id)
  );
};
