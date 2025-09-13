import * as React from 'react';
import { Text as NativeText, TextStyle, View, TextProps, ViewStyle, FlexAlignType, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../theme';

interface CustomTextProps {
  children: React.ReactNode;
  style?: TextStyle;
  variant?: 'primary' | 'secondary' | 'muted' | 'error' | 'display' | 'title' | 'caption' | 'h2' | 'h3' | 'body' | 'tertiary' | 'photo' | 'video';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  color?: 'primary' | 'secondary' | 'muted' | 'error' | 'inverse';
  numberOfLines?: number;
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';
}

export function Text({ children, style, variant = 'primary', weight = 'normal', color, ...props }: CustomTextProps) {
  const getTextColor = () => {
    if (color) {
      switch (color) {
        case 'primary': return '#007AFF';
        case 'secondary': return '#666';
        case 'muted': return '#999';
        case 'error': return '#FF3B30';
        case 'inverse': return '#000';
      }
    }
    
    switch (variant) {
      case 'secondary':
        return '#666';
      case 'muted':
        return '#999';
      case 'error':
        return '#FF3B30';
      default:
        return '#fff';
    }
  };

  const getFontSize = () => {
    switch (variant) {
      case 'display': return typography.fontSize['6xl'];
      case 'title': return typography.fontSize['4xl'];
      case 'h2': return typography.fontSize['5xl'];
      case 'h3': return typography.fontSize['3xl'];
      case 'body': return typography.fontSize.xl;
      case 'caption': return typography.fontSize.base;
      case 'tertiary': return typography.fontSize.lg;
      case 'photo': return typography.fontSize.xl;
      case 'video': return typography.fontSize.xl;
      default: return typography.fontSize.xl;
    }
  };

  const getFontWeight = (): TextStyle['fontWeight'] => {
    switch (weight) {
      case 'medium': return typography.fontWeight.medium as TextStyle['fontWeight'];
      case 'semibold': return typography.fontWeight.semibold as TextStyle['fontWeight'];
      case 'bold': return typography.fontWeight.bold as TextStyle['fontWeight'];
      default: return typography.fontWeight.normal as TextStyle['fontWeight'];
    }
  };

  const getLineHeight = () => {
    const fontSize = getFontSize();
    return fontSize * typography.lineHeight.normal;
  };

  return (
    <NativeText
      style={[
        {
          color: getTextColor(),
          fontSize: getFontSize(),
          fontWeight: getFontWeight(),
          lineHeight: getLineHeight(),
        },
        style,
      ]}
      {...props}
    >
      {children}
    </NativeText>
  );
}

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  emoji?: string;
  style?: TextStyle;
}

export function SectionHeader({ title, subtitle, emoji, style, ...props }: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleContainer}>
        {emoji && (
          <Text style={styles.sectionEmoji}>
            {emoji}
          </Text>
        )}
        <Text style={StyleSheet.flatten([styles.sectionTitle, style])} {...props}>
          {title}
        </Text>
      </View>
      {subtitle && (
        <Text style={styles.sectionSubtitle}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

const styles: {
  sectionHeader: ViewStyle;
  sectionTitleContainer: ViewStyle;
  sectionEmoji: TextStyle;
  sectionTitle: TextStyle;
  sectionSubtitle: TextStyle;
} = {
  sectionHeader: {
    marginBottom: spacing.xlLegacy,
  },
  sectionTitleContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as FlexAlignType,
    marginBottom: spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  sectionEmoji: {
    fontSize: typography.fontSize['3xl'],
    marginRight: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold as TextStyle['fontWeight'],
    letterSpacing: typography.letterSpacing.tight,
    flex: 1,
    color: colors.text.primary,
    minWidth: 0,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
};