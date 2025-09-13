// Theme system based on the UI/UX Design System Guide
import { Dimensions, Platform } from 'react-native';

// Color Tokens
export const colors = {
  // Background Colors
  background: {
    primary: '#000000',      // Pure Black
    secondary: '#1C1C1E',    // Dark Gray
    tertiary: '#2C2C2E',     // Medium Gray
  },
  
  // Accent Colors
  accent: {
    primary: '#FF3B30',      // Primary Red
    secondary: '#FF6B6B',    // Secondary Red
  },
  
  // Text Colors
  text: {
    primary: '#FFFFFF',      // Pure White
    secondary: '#8E8E93',    // Light Gray
    tertiary: '#48484A',     // Medium Gray
  },
  
  // Interactive States
  interactive: {
    active: '#FFFFFF',
    disabled: 'rgba(255, 255, 255, 0.3)',
    error: '#FF3B30',
    success: '#34C759',
  },
  
  // Premium Colors
  premium: {
    background: '#FFFFFF',
    text: '#000000',
    badge: '#FF3B30',
  },
};

// Typography Scale
export const typography = {
  // Font Family
  fontFamily: {
    ios: {
      regular: 'SF Pro Text',
      medium: 'SF Pro Text-Medium',
      semibold: 'SF Pro Text-Semibold',
      bold: 'SF Pro Text-Bold',
    },
    android: {
      regular: 'Roboto',
      medium: 'Roboto-Medium',
      semibold: 'Roboto-Medium',
      bold: 'Roboto-Bold',
    },
  },
  
  // Font Sizes
  fontSize: {
    display: {
      large: 24,  // App Title
      medium: 20, // Section Headers
      small: 18,  // Subsection Headers
    },
    body: {
      large: 16,  // Primary Body, Button Labels
      medium: 14, // Secondary Body, Tab Labels
      small: 12,  // Caption Text
    },
  },
  
  // Font Weights
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  
  // Line Height
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.8,
  },
};

// Spacing System
export const spacing = {
  // Base spacing unit
  base: 4,
  
  // Derived spacing
  micro: 4,    // 1x base
  small: 8,    // 2x base
  medium: 16,  // 4x base
  large: 24,   // 6x base
  extraLarge: 32, // 8x base
  huge: 48,    // 12x base
};

// Border Radius
export const borderRadius = {
  small: 6,      // Badges and indicators
  medium: 8,     // Secondary buttons
  large: 12,     // Photo/video thumbnails
  extraLarge: 16, // Main content cards
  huge: 20,      // Modal containers
  pill: 26,      // Primary buttons (pill shape)
};

// Layout Dimensions
export const layout = {
  // Screen margins
  screenMargin: spacing.medium,
  
  // Card dimensions
  card: {
    standardWidth: 140,
    aspectRatios: {
      photo: '4:3',
      video: '16:9',
      square: '1:1',
    },
    internalPadding: spacing.medium,
    gap: spacing.small,
  },
  
  // Button dimensions
  button: {
    primary: {
      height: 52,
      horizontalMargin: spacing.large * 2, // 32px
    },
    secondary: {
      height: 36,
      horizontalPadding: spacing.large * 1.5, // 24px
    },
    icon: {
      size: 44,
    },
  },
  
  // Navigation
  navigation: {
    bottomTab: {
      height: 80, // Including safe area
      iconSize: 24,
      iconMargin: spacing.small,
    },
    header: {
      height: 44,
      actionButton: 44,
    },
  },
  
  // Modal dimensions
  modal: {
    fullScreen: {
      topRadius: borderRadius.huge,
      closeButtonMargin: spacing.extraLarge,
    },
    content: {
      horizontalMargin: spacing.extraLarge * 2, // 64px
      maxWidth: Dimensions.get('window').width - 64,
    },
  },
};

// Animation Timing
export const animation = {
  duration: {
    fast: 150,   // Tab switching
    medium: 200, // Button interactions
    normal: 250, // Screen transitions
    slow: 300,   // Modal presentations
    extraSlow: 500, // Complex animations
  },
  easing: {
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
};

// Breakpoints for responsive design
export const breakpoints = {
  small: 375,   // iPhone SE
  medium: 414,  // iPhone 12/13/14
  large: 768,   // iPad
};

// Platform-specific styles
export const platform = {
  ios: {
    defaultFontFamily: typography.fontFamily.ios,
  },
  android: {
    defaultFontFamily: typography.fontFamily.android,
  },
};

// Create a function to get platform-specific font family
export const getFontFamily = (weight: keyof typeof typography.fontWeight = 'regular') => {
  const platform = Platform.OS as 'ios' | 'android';
  const fontFamily = platform === 'ios' 
    ? typography.fontFamily.ios 
    : typography.fontFamily.android;
  
  return fontFamily[weight] || fontFamily.regular;
};

// Create a function to get responsive spacing
export const getResponsiveSpacing = (baseSpacing: number) => {
  const screenWidth = Dimensions.get('window').width;
  
  if (screenWidth <= breakpoints.small) {
    return Math.max(baseSpacing * 0.75, spacing.micro);
  } else if (screenWidth >= breakpoints.large) {
    return baseSpacing * 1.5;
  }
  
  return baseSpacing;
};

// Create a function to get responsive card width
export const getResponsiveCardWidth = () => {
  const screenWidth = Dimensions.get('window').width;
  
  if (screenWidth <= breakpoints.small) {
    return 120; // Reduced card size for small devices
  } else if (screenWidth >= breakpoints.large) {
    return 180; // Increased card size for large devices
  }
  
  return layout.card.standardWidth;
};

// Export default theme
export default {
  colors,
  typography,
  spacing,
  borderRadius,
  layout,
  animation,
  breakpoints,
  platform,
  getFontFamily,
  getResponsiveSpacing,
  getResponsiveCardWidth,
};