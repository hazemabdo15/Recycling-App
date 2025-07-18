# Components Folder Structure

This folder contains all the React Native components organized by functionality for better maintainability and reusability.

## 📁 Folder Structure

```
components/
├── index.js              # Main export file for all components
├── navigation/           # Navigation related components
│   ├── index.js         # Navigation components exports
│   └── TabBar.jsx       # Custom tab bar with animations
├── profile/             # Profile page components
│   ├── index.js         # Profile components exports
│   ├── ProfileHeader.jsx # User profile header with avatar
│   ├── ProfileMenu.jsx   # Profile menu with actions
│   └── StatsCard.jsx     # User recycling statistics
├── ui/                  # Reusable UI components
│   ├── index.js         # UI components exports
│   └── SearchBar.jsx    # Search input with filter
├── cards/               # Card components
│   ├── index.js         # Card components exports
│   ├── EarnPointsCard.jsx # Points earning card
│   └── CategoryCard.jsx  # Category display card
├── sections/            # Page sections
│   ├── index.js         # Section components exports
│   ├── CategoriesSection.jsx # Home categories section
│   ├── CategoriesGrid.jsx    # Explore categories grid
│   └── TopRecycledSection.jsx # Top recycled items section
└── common/              # Common shared components
    ├── index.js         # Common components exports
    ├── Header.jsx       # Page header component
    └── RecyclingIllustration.jsx # Recycling SVG illustration
```

## 🚀 Usage Examples

### Import specific components:
```javascript
import { ProfileHeader, StatsCard } from '../components/profile';
import { SearchBar } from '../components/ui';
import { TabBar } from '../components/navigation';
```

### Import from main index:
```javascript
import { ProfileHeader, SearchBar, TabBar } from '../components';
```

### Import individual component:
```javascript
import { ProfileHeader } from '../components/profile/ProfileHeader';
```

## 📋 Component Categories

### 🧭 **Navigation** (`navigation/`)
- Components related to app navigation
- Tab bars, menu items, navigation helpers

### 👤 **Profile** (`profile/`)
- User profile related components
- Profile headers, statistics, menu items

### 🎨 **UI** (`ui/`)
- Reusable interface components
- Search bars, buttons, inputs, modals

### 🃏 **Cards** (`cards/`)
- Card-based components
- Information cards, action cards, display cards

### 📄 **Sections** (`sections/`)
- Page sections and layouts
- Category grids, content sections, list views

### 🔧 **Common** (`common/`)
- Shared utility components
- Headers, illustrations, common layouts

## ✅ Benefits

- **Better Organization**: Components grouped by functionality
- **Easier Maintenance**: Find and update components quickly
- **Improved Reusability**: Clear separation of concerns
- **Scalability**: Easy to add new components to appropriate folders
- **Clean Imports**: Simplified import statements
- **Team Collaboration**: Clear structure for team development
