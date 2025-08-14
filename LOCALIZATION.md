Based on the localization system we've implemented, here's the complete guide for translating text in your app:

## 📋 **Step-by-Step Translation Guide**

### **1. Add Translation to Language Files**

First, add your translation keys to both language files:

**English** (en.js):
```javascript
// Add your translation key in the appropriate section
export default {
  // Common section for general UI elements
  common: {
    myNewButton: "My New Button",
    // ... existing translations
  },
  
  // Or create a new section for your feature
  myFeature: {
    title: "Feature Title",
    description: "Feature description text",
    action: "Take Action",
  },
};
```

**Arabic** (ar.js):
```javascript
// Add corresponding Arabic translations
export default {
  common: {
    myNewButton: "الزر الجديد",
    // ... existing translations
  },
  
  myFeature: {
    title: "عنوان الميزة",
    description: "وصف نص الميزة",
    action: "اتخاذ إجراء",
  },
};
```

### **2. Import Localization in Your Component**

Add the localization import to your React component:

```javascript
import { useLocalization } from '../context/LocalizationContext';
// Adjust the path based on your file location:
// - From app/: '../context/LocalizationContext'
// - From components/: '../context/LocalizationContext'
// - From nested folders: '../../context/LocalizationContext'
```

### **3. Use the Translation Function**

Inside your component, get the translation function:

```javascript
const MyComponent = () => {
  const { t } = useLocalization();
  
  return (
    <View>
      {/* Basic translation */}
      <Text>{t('common.myNewButton')}</Text>
      
      {/* Translation with nested keys */}
      <Text>{t('myFeature.title')}</Text>
      
      {/* Translation in props */}
      <TextInput 
        placeholder={t('forms.enterName')}
      />
      
      {/* Translation in alerts */}
      <TouchableOpacity onPress={() => 
        Alert.alert(t('common.success'), t('messages.saved'))
      }>
        <Text>{t('common.save')}</Text>
      </TouchableOpacity>
    </View>
  );
};
```

### **4. Translation Patterns & Examples**

#### **For Form Elements:**
```javascript
// Placeholders
<TextInput placeholder={t('forms.email')} />
<TextInput placeholder={t('forms.password')} />

// Labels
<Text style={styles.label}>{t('forms.firstName')}</Text>

// Validation messages
{errors.email && <Text>{t('validation.emailRequired')}</Text>}
```

#### **For Buttons and Actions:**
```javascript
<TouchableOpacity onPress={handleSave}>
  <Text>{t('common.save')}</Text>
</TouchableOpacity>

<TouchableOpacity onPress={handleCancel}>
  <Text>{t('common.cancel')}</Text>
</TouchableOpacity>
```

#### **For Alert Dialogs:**
```javascript
Alert.alert(
  t('dialogs.confirmTitle'),
  t('dialogs.confirmMessage'),
  [
    { text: t('common.cancel'), style: 'cancel' },
    { text: t('common.confirm'), onPress: handleConfirm }
  ]
);
```

#### **For Dynamic Text with Variables:**
```javascript
// In language files:
// en.js: { itemsFound: "Found {{count}} items" }
// ar.js: { itemsFound: "تم العثور على {{count}} عناصر" }

// In component:
<Text>{t('search.itemsFound', { count: results.length })}</Text>
```

### **5. Organization Best Practices**

#### **Group Related Translations:**
```javascript
// Good organization structure
export default {
  // Authentication related
  auth: {
    login: "Login",
    register: "Register",
    forgotPassword: "Forgot Password",
  },
  
  // Navigation
  navigation: {
    home: "Home",
    profile: "Profile",
    settings: "Settings",
  },
  
  // Forms
  forms: {
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
  },
  
  // Messages and feedback
  messages: {
    success: "Success!",
    error: "Something went wrong",
    loading: "Loading...",
  }
};
```

### **6. Quick Reference for Common Sections**

Here are the existing sections you can use:

- `common.*` - General UI elements (save, cancel, ok, etc.)
- `auth.*` - Authentication related text
- `navigation.*` - Tab bar and navigation labels
- `forms.*` - Form labels and placeholders
- `validation.*` - Form validation messages
- `profile.*` - Profile screen elements
- `notifications.*` - Notification related text
- `help.*` - Help and support content

### **7. Testing Your Translations**

1. **Language Switch**: Test by changing language in app settings
2. **RTL Layout**: Verify Arabic text displays correctly with RTL layout
3. **Text Length**: Ensure translations fit in UI components
4. **Context**: Verify translations make sense in context

### **8. Example: Adding a New Feature Translation**

Let's say you want to add a "Favorites" feature:

**Step 1**: Add to en.js:
```javascript
favorites: {
  title: "My Favorites",
  empty: "No favorites yet",
  add: "Add to Favorites",
  remove: "Remove from Favorites",
  addedSuccess: "Added to favorites!",
},
```

**Step 2**: Add to ar.js:
```javascript
favorites: {
  title: "المفضلة لدي",
  empty: "لا توجد مفضلات بعد",
  add: "إضافة للمفضلة",
  remove: "إزالة من المفضلة",
  addedSuccess: "تم إضافة للمفضلة!",
},
```

**Step 3**: Use in component:
```javascript
import { useLocalization } from '../context/LocalizationContext';

const FavoritesScreen = () => {
  const { t } = useLocalization();
  
  return (
    <View>
      <Text style={styles.title}>{t('favorites.title')}</Text>
      {favorites.length === 0 ? (
        <Text>{t('favorites.empty')}</Text>
      ) : (
        <FlatList data={favorites} ... />
      )}
      <TouchableOpacity onPress={addToFavorites}>
        <Text>{t('favorites.add')}</Text>
      </TouchableOpacity>
    </View>
  );
};
```

That's it! The localization system will automatically handle language switching and RTL layout for Arabic text. Always remember to add translations to both language files to maintain consistency across your app.