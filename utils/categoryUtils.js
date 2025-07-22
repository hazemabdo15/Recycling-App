export const getCategoryIcon = (categoryName) => {
    const iconMap = {
        'Plastic': { iconName: 'bottle-soda', iconColor: '#FF69B4' },
        'Glass': { iconName: 'glass-fragile', iconColor: '#4FC3F7' },
        'Paper': { iconName: 'file-document', iconColor: '#8BC34A' },
        'Metal': { iconName: 'hammer-wrench', iconColor: '#FF9800' },
        'Electronics': { iconName: 'battery-charging', iconColor: '#F44336' },
        'Textiles': { iconName: 'tshirt-crew', iconColor: '#9C27B0' },
        'Batteries': { iconName: 'car-battery', iconColor: '#795548' },
        'Oil': { iconName: 'oil', iconColor: '#607D8B' },
        'Tires': { iconName: 'tire', iconColor: '#424242' },
        'Bulbs': { iconName: 'lightbulb', iconColor: '#FFC107' },
        'Mobile Phones': { iconName: 'cellphone', iconColor: '#00BCD4' },
        'Computers': { iconName: 'laptop', iconColor: '#3F51B5' },
        'Cardboard': { iconName: 'package-variant', iconColor: '#8D6E63' },
        'Organic': { iconName: 'leaf', iconColor: '#4CAF50' },
        'Hazardous': { iconName: 'chemical-weapon', iconColor: '#F44336' },
        'Furniture': { iconName: 'chair-rolling', iconColor: '#795548' },
        'Appliances': { iconName: 'washing-machine', iconColor: '#9E9E9E' },
        'Books': { iconName: 'book-open', iconColor: '#FF7043' },
        'CDs/DVDs': { iconName: 'disc', iconColor: '#AB47BC' },
        'Shoes': { iconName: 'shoe-formal', iconColor: '#5D4037' },
    };
    return iconMap[categoryName] || { iconName: 'help-circle', iconColor: '#9E9E9E' };
};
export const getCategoryImageProps = (category) => {
    const iconData = getCategoryIcon(category.name);
    return {
        imageUri: category.image,
        iconName: iconData.iconName,
        iconColor: iconData.iconColor,
        title: category.name,
    };
};