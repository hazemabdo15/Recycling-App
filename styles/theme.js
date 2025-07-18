export const colors = {
  primary: "#0E9F6E",
  secondary: "#8BC34A", 
  accent: "#FFC107",
  neutral: "#607D8B",
  base100: "#F8FFFE", 
  base300: "#E0E0E0",
  white: "#ffffff",
  black: "#171717",
};

export const borderRadius = {
  xs: 6,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 32,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

export const shadows = {
  small: {
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  medium: {
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
};

export const typography = {
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.black,
  },
  subtitle: {
    fontSize: 16,
    color: colors.neutral,
    lineHeight: 22,
  },
  body: {
    fontSize: 14,
    color: colors.black,
  },
  caption: {
    fontSize: 12,
    color: colors.neutral,
  },
};
