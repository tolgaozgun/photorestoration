import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';
import { colors, typography, getFontFamily } from '../../theme';

interface CustomTextProps extends TextProps {
  variant?: 'display' | 'title' | 'subtitle' | 'body' | 'caption';
  weight?: keyof typeof typography.fontWeight;
  color?: keyof typeof colors.text;
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  numberOfLines?: number;
}

export const Text: React.FC<CustomTextProps> = ({
  variant = 'body',
  weight = 'regular',
  color = 'primary',
  align = 'left',
  style,
  children,
  ...props
}) => {
  const getFontSize = () => {
    switch (variant) {
      case 'display':
        return typography.fontSize.display.large;
      case 'title':
        return typography.fontSize.display.medium;
      case 'subtitle':
        return typography.fontSize.display.small;
      case 'body':
        return typography.fontSize.body.large;
      case 'caption':
        return typography.fontSize.body.small;
      default:
        return typography.fontSize.body.large;
    }
  };

  const getLineHeight = () => {
    switch (variant) {
      case 'display':
      case 'title':
        return typography.lineHeight.tight;
      case 'subtitle':
        return typography.lineHeight.normal;
      case 'body':
        return typography.lineHeight.normal;
      case 'caption':
        return typography.lineHeight.tight;
      default:
        return typography.lineHeight.normal;
    }
  };

  const styles = StyleSheet.create({
    text: {
      fontSize: getFontSize(),
      fontWeight: typography.fontWeight[weight],
      color: colors.text[color],
      textAlign: align,
      lineHeight: getLineHeight() * getFontSize(),
      fontFamily: getFontFamily(weight),
    },
  });

  return (
    <RNText style={[styles.text, style]} {...props}>
      {children}
    </RNText>
  );
};

// Pre-styled text components for common use cases
export const DisplayText: React.FC<Omit<CustomTextProps, 'variant'>> = (props) => (
  <Text variant="display" weight="bold" {...props} />
);

export const TitleText: React.FC<Omit<CustomTextProps, 'variant'>> = (props) => (
  <Text variant="title" weight="semibold" {...props} />
);

export const SubtitleText: React.FC<Omit<CustomTextProps, 'variant'>> = (props) => (
  <Text variant="subtitle" weight="medium" {...props} />
);

export const BodyText: React.FC<Omit<CustomTextProps, 'variant'>> = (props) => (
  <Text variant="body" {...props} />
);

export const CaptionText: React.FC<Omit<CustomTextProps, 'variant'>> = (props) => (
  <Text variant="caption" {...props} />
);

// Section header with emoji support
interface SectionHeaderProps extends Omit<CustomTextProps, 'variant'> {
  emoji?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ 
  emoji, 
  children, 
  style,
  ...props 
}) => (
  <Text 
    variant="title" 
    weight="semibold" 
    style={[styles.sectionHeader, style]} 
    {...props}
  >
    {emoji} {children}
  </Text>
);

// Metadata text (uppercase, smaller)
export const MetadataText: React.FC<Omit<CustomTextProps, 'variant'>> = (props) => (
  <Text 
    variant="caption" 
    weight="medium" 
    style={styles.metadata}
    {...props}
  />
);

const styles = StyleSheet.create({
  sectionHeader: {
    // No margin here - spacing is handled by parent container
  },
  metadata: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default Text;