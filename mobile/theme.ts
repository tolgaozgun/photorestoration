// Comprehensive theme system for the app
export const colors = {
  // Background colors
  background: {
    primary: '#0a0a0a',
    secondary: '#1a1a1a',
    tertiary: '#2a2a2a',
    card: '#1C1C1E',
    overlay: 'rgba(0, 0, 0, 0.8)',
    floating: 'rgba(15, 15, 15, 0.98)',
    transparent: 'transparent',
  },
  
  // Text colors
  text: {
    primary: '#FFFFFF',
    secondary: '#666666',
    tertiary: '#999999',
    muted: '#8E8E93',
    inverse: '#000000',
    error: '#FF3B30',
    success: '#34C759',
    warning: '#FF9500',
  },
  
  // Brand colors
  primary: '#007AFF',
  secondary: '#6C757D',
  success: '#28A745',
  warning: '#FFC107',
  error: '#DC3545',
  info: '#17A2B8',
  
  // Border colors
  border: {
    primary: '#3a3a3a',
    borderPrimary: 'rgba(255, 255, 255, 0.1)',
    borderSecondary: 'rgba(255, 255, 255, 0.05)',
    borderTertiary: 'rgba(255, 255, 255, 0.02)',
  },
  
  // Semantic colors
  focus: '#007AFF',
  active: '#E9ECEF',
  disabled: '#6C757D',
  
  // Accent colors
  accent: {
    primary: '#FF6B6B',
    secondary: '#4ECDC4',
    success: '#45B7D1',
    warning: '#FFA726',
    error: '#EF5350',
  },
  
  // Shadow colors
  shadow: {
    light: 'rgba(0, 0, 0, 0.08)',
    medium: 'rgba(0, 0, 0, 0.15)',
    dark: 'rgba(0, 0, 0, 0.25)',
  },
};

export const typography = {
  fontFamily: {
    primary: 'SF Pro Display',
    secondary: 'SF Pro Text',
    mono: 'SF Mono',
  },
  
  fontSize: {
    xs: 10,
    sm: 11,
    base: 12,
    lg: 14,
    xl: 16,
    '2xl': 18,
    '3xl': 20,
    '4xl': 22,
    '5xl': 26,
    '6xl': 34,
  },
  
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    black: '900',
  },
  
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
  
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
  },
};

export const spacing = {
  xs: 2,
  sm: 4,
  md: 6,
  base: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  '4xl': 32,
  '5xl': 40,
  '6xl': 48,
  '7xl': 56,
  '8xl': 64,
  
  // Legacy spacing for compatibility
  micro: 4,
  smallLegacy: 8,
  mediumLegacy: 16,
  largeLegacy: 24,
  xlLegacy: 32,
  xxlLegacy: 48,
};

export const borderRadius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
  
  // Legacy for compatibility
  smallLegacy: 4,
  mediumLegacy: 8,
  largeLegacy: 12,
  xlLegacy: 16,
};

export const shadows = {
  sm: {
    shadowColor: colors.shadow.light,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: colors.shadow.medium,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  lg: {
    shadowColor: colors.shadow.dark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  xl: {
    shadowColor: colors.shadow.dark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
};

export const components = {
  // Header
  header: {
    height: 56,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.borderPrimary,
  },
  
  // Navigation buttons
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.secondary,
    ...shadows.sm,
  },
  
  // Floating action button
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    ...shadows.lg,
  },
  
  // Bottom tab bar
  tabBar: {
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.background.floating,
    paddingHorizontal: 20,
    paddingVertical: 0,
    marginHorizontal: 20,
    marginBottom: 24,
    ...shadows.xl,
    borderWidth: 1,
    borderColor: colors.border.borderPrimary,
  },
  
  // Tab items
  tabItem: {
    minWidth: 60,
    minHeight: 60,
    borderRadius: 20,
    paddingHorizontal: 2,
    paddingVertical: 6,
  },
  
  // Cards
  card: {
    borderRadius: 16,
    backgroundColor: colors.background.card,
    ...shadows.md,
  },
  
  galleryCard: {
    small: {
      width: 120,
      height: 150,
    },
    medium: {
      width: 160,
      height: 190,
    },
    large: {
      width: 200,
      height: 210,
    },
  },
  
  // Buttons
  button: {
    small: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      minHeight: 36,
      borderRadius: 8,
    },
    medium: {
      paddingHorizontal: 20,
      paddingVertical: 12,
      minHeight: 44,
      borderRadius: 12,
    },
    large: {
      paddingHorizontal: 24,
      paddingVertical: 16,
      minHeight: 52,
      borderRadius: 16,
    },
  },
  
  // Sections
  section: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  
  // Inputs
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.borderPrimary,
    backgroundColor: colors.background.secondary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: typography.fontSize.base,
  },
};

export const animation = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  easing: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
};

export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};

// Export theme object
export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  components,
  animation,
  breakpoints,
};

// Export default
export default theme;