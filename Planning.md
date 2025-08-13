# Feature: Achievements/Tiers Page

## Objective
Implement a modern, sleek Achievements page that showcases user tiers based on recycling activity. The page should display available tiers, benefits, current progress, and include a beautiful tier badge in the profile card. This enhances user engagement and gamification of the recycling experience.

---

## Current Structure Analysis
Based on your workspace structure:
- **Navigation**: The page will be created in the `app` folder as `achievements.jsx`
- **Components**: Reusable components will go in `components/achievements/`
- **Utils**: Tier calculation logic in `utils/tiers.js`
- **Styles**: Following existing pattern with inline StyleSheet
- **Integration**: Connect with existing `ProfileMenu.jsx` and `ProfileCard.jsx`

---

## Tier Configuration

### Reward Levels (Fixed)
```javascript
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
    minRecycles: 50, // Fixed from 20
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
```

---

## Tasks

### 1. **Core Implementation**

#### A. Create Tier Logic (`utils/tiers.js`)
```javascript
export const rewardLevels = [
  // Tier definitions above
];

export const calculateUserTier = (totalRecycles) => {
  return rewardLevels.find(tier => 
    totalRecycles >= tier.minRecycles && totalRecycles <= tier.maxRecycles
  ) || rewardLevels[0];
};

export const getNextTier = (currentTier) => {
  const currentIndex = rewardLevels.findIndex(tier => tier.id === currentTier.id);
  return currentIndex < rewardLevels.length - 1 ? rewardLevels[currentIndex + 1] : null;
};

export const calculateProgress = (totalRecycles, currentTier, nextTier) => {
  if (!nextTier) return 100; // Max tier reached
  const progress = ((totalRecycles - currentTier.minRecycles) / (nextTier.minRecycles - currentTier.minRecycles)) * 100;
  return Math.min(Math.max(progress, 0), 100);
};
```

#### B. Main Achievements Page (`app/achievements.jsx`)
- **Header Section**: Gradient background with user's current tier and progress
- **Progress Section**: Animated progress bar to next tier
- **Tiers Grid**: Display all available tiers with benefits
- **Current Tier Highlight**: Special styling for user's current tier
- **Benefits Modal**: Detailed view when tapping on a tier

#### C. Tier Badge Component (`components/achievements/TierBadge.jsx`)
- Animated badge with tier name
- Gradient background based on tier level
- Icon/symbol for each tier
- Integration with `ProfileCard.jsx`

#### D. Tier Card Component (`components/achievements/TierCard.jsx`)
- Individual tier display with benefits
- Lock/unlock states
- Progress indicators
- Tap to view details

### 2. **Enhanced Features**

#### A. Animations & Micro-interactions
- **Progress Bar Animation**: Smooth fill animation using React Native Reanimated
- **Tier Unlock Celebration**: Confetti/particle effects when reaching new tier
- **Badge Shimmer**: Subtle shine effect on current tier badge
- **Card Hover**: Scale and shadow effects on tier cards

#### B. Achievement Milestones
```javascript
export const achievementMilestones = [
  { id: 1, name: "First Steps", description: "Complete your first recycling order", threshold: 1, icon: "leaf" },
  { id: 2, name: "Getting Started", description: "Complete 5 recycling orders", threshold: 5, icon: "sprout" },
  { id: 3, name: "Eco Warrior", description: "Complete 25 recycling orders", threshold: 25, icon: "shield" },
  { id: 4, name: "Planet Saver", description: "Complete 50 recycling orders", threshold: 50, icon: "earth" },
  { id: 5, name: "Green Legend", description: "Complete 100 recycling orders", threshold: 100, icon: "crown" }
];
```

#### C. Statistics Dashboard
- Total environmental impact (CO2 saved, trees planted equivalent)
- Monthly recycling streaks
- Recycling habits chart
- Comparison with other users (optional)

### 3. **UI/UX Design Specifications**

#### A. Color Scheme & Gradients
```javascript
export const tierColors = {
  "Eco Beginner": { primary: "#10B981", secondary: "#34D399", gradient: ["#10B981", "#34D399"] },
  "Eco Starter": { primary: "#3B82F6", secondary: "#60A5FA", gradient: ["#3B82F6", "#60A5FA"] },
  "Green Helper": { primary: "#8B5CF6", secondary: "#A78BFA", gradient: ["#8B5CF6", "#A78BFA"] },
  "Silver Recycler": { primary: "#6B7280", secondary: "#9CA3AF", gradient: ["#6B7280", "#9CA3AF"] },
  "Gold Guardian": { primary: "#F59E0B", secondary: "#FBBF24", gradient: ["#F59E0B", "#FBBF24"] },
  "Platinum Pioneer": { primary: "#8B5CF6", secondary: "#C084FC", gradient: ["#8B5CF6", "#C084FC"] },
  "Diamond Elite": { primary: "#EC4899", secondary: "#F472B6", gradient: ["#EC4899", "#F472B6"] }
};
```

#### B. Icons & Symbols
- Use Material Community Icons for tier symbols
- Eco Beginner: `leaf-outline`
- Eco Starter: `sprout-outline`
- Green Helper: `hand-heart-outline`
- Silver Recycler: `medal-outline`
- Gold Guardian: `crown-outline`
- Platinum Pioneer: `diamond-outline`
- Diamond Elite: `star-circle-outline`

#### C. Layout Structure
1. **Header**: Current tier badge, progress, next tier info
2. **Stats Section**: Quick stats cards (total orders, points earned, etc.)
3. **Tiers Grid**: 2-column grid showing all tiers
4. **Achievements**: Horizontal scrollable list of milestones

### 4. **Integration Points**

#### A. Profile Card Enhancement
- Add tier badge next to user name in `ProfileCard.jsx`
- Replace static tier display with dynamic badge
- Add subtle animation to badge

#### B. Profile Menu Navigation
- Update `ProfileMenu.jsx` achievements handler
- Remove "Coming soon" alert
- Navigate to achievements page

#### C. Data Integration
- Use existing `useUserPoints.js` hook
- Extend to include total completed orders
- Calculate tier based on `totalRecycled` value

### 5. **File Structure**
```
app/
├── achievements.jsx                 # Main achievements page

components/
├── achievements/
│   ├── TierBadge.jsx               # Reusable tier badge component
│   ├── TierCard.jsx                # Individual tier display
│   ├── ProgressBar.jsx             # Animated progress bar
│   ├── AchievementItem.jsx         # Achievement milestone item
│   └── StatsCard.jsx               # Statistics display card

utils/
├── tiers.js                        # Tier calculation logic
├── achievements.js                 # Achievement logic

styles/
├── achievements.js                 # Centralized styles (optional)
```

### 6. **Acceptance Criteria**

#### Core Functionality
- [ ] Display all available tiers with benefits
- [ ] Show user's current tier with progress to next tier
- [ ] Animated progress bar showing advancement
- [ ] Tier badge integration in profile card
- [ ] Navigation from profile menu

#### Enhanced Features
- [ ] Achievement milestones tracking
- [ ] Smooth animations and micro-interactions
- [ ] Statistics dashboard
- [ ] Responsive design for different screen sizes
- [ ] Error handling for data fetching

#### Visual Requirements
- [ ] Modern, sleek design consistent with app theme
- [ ] Gradient backgrounds and smooth animations
- [ ] Clear tier progression visualization
- [ ] Accessibility compliance (proper contrast, labels)

### 7. **Technical Considerations**

#### A. Performance Optimization
- Lazy load tier images/icons
- Memoize tier calculations
- Optimize animation performance

#### B. State Management
- Local state for UI interactions
- Global state for user tier data
- Cache tier calculations

#### C. Error Handling
- Graceful fallbacks for missing data
- Loading states for data fetching
- Network error handling

---

## Implementation Priority

1. **Phase 1**: Core tier logic and basic achievements page
   - Create `utils/tiers.js` with tier calculation logic
   - Build main `app/achievements.jsx` page
   - Implement basic tier display without animations

2. **Phase 2**: Tier badge integration in profile card
   - Create `TierBadge.jsx` component
   - Integrate with `ProfileCard.jsx`
   - Update `ProfileMenu.jsx` navigation

3. **Phase 3**: Enhanced animations and micro-interactions
   - Add progress bar animations
   - Implement tier card interactions
   - Add celebration effects

4. **Phase 4**: Achievement milestones and statistics dashboard
   - Create achievement system
   - Add statistics tracking
   - Implement environmental impact calculations

---

## Notes for Implementation

### Data Flow
1. User profile data → Total completed orders calculation
2. Total orders → Current tier calculation via `calculateUserTier()`
3. Current tier → Progress calculation for next tier
4. Display tier badge in profile and full achievements page

### Key Components to Modify
- `app/(tabs)/profile.jsx` - Add tier badge
- `components/profile/ProfileCard.jsx` - Integrate TierBadge
- `components/profile/ProfileMenu.jsx` - Add navigation to achievements
- `hooks/useUserPoints.js` - Extend for tier calculations

### Design Consistency
- Follow existing app color scheme
- Use consistent spacing and typography
- Maintain current navigation patterns
- Ensure accessibility standards

This implementation will create a comprehensive, engaging achievements system that motivates users to recycle more while providing a modern, visually