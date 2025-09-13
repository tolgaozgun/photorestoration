import * as React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View, ViewStyle, TextStyle } from 'react-native';
import { colors, spacing, borderRadius, typography, components } from '../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'tertiary' | 'premium';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
}: ButtonProps) {
  const getButtonStyle = () => {
    const baseStyle: any[] = [styles.button];
    
    switch (variant) {
      case 'outline':
        baseStyle.push(styles.buttonOutline);
        break;
      case 'ghost':
        baseStyle.push(styles.buttonGhost);
        break;
      case 'secondary':
        baseStyle.push(styles.buttonSecondary);
        break;
      case 'tertiary':
        baseStyle.push(styles.buttonTertiary);
        break;
      case 'premium':
        baseStyle.push(styles.buttonPremium);
        break;
      default:
        baseStyle.push(styles.buttonPrimary);
    }
    
    switch (size) {
      case 'small':
        baseStyle.push(styles.buttonSmall);
        break;
      case 'large':
        baseStyle.push(styles.buttonLarge);
        break;
    }
    
    if (disabled) {
      baseStyle.push(styles.buttonDisabled);
    }
    
    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle: any[] = [styles.buttonText];
    
    switch (variant) {
      case 'outline':
      case 'ghost':
      case 'tertiary':
        baseStyle.push(styles.buttonTextOutline);
        break;
      case 'secondary':
        baseStyle.push(styles.buttonTextSecondary);
        break;
      case 'premium':
        baseStyle.push(styles.buttonTextPremium);
        break;
    }
    
    if (disabled) {
      baseStyle.push(styles.buttonTextDisabled);
    }
    
    return baseStyle;
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? colors.primary : colors.text.primary} />
      ) : (
        <>
          {icon && <View style={styles.buttonIcon}>{icon}</View>}
          <Text style={getTextStyle()}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

interface IconButtonProps {
  icon: React.ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  style?: ViewStyle;
}

export function IconButton({
  icon,
  onPress,
  variant = 'ghost',
  size = 'medium',
  disabled = false,
  style,
}: IconButtonProps) {
  const getButtonStyle = () => {
    const baseStyle: any[] = [styles.iconButton];
    
    switch (size) {
      case 'small':
        baseStyle.push(styles.iconButtonSmall);
        break;
      case 'large':
        baseStyle.push(styles.iconButtonLarge);
        break;
    }
    
    if (disabled) {
      baseStyle.push(styles.buttonDisabled);
    }
    
    return baseStyle;
  };

  return (
    <TouchableOpacity
      style={[...getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {icon}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Button styles
  button: {
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonSecondary: {
    backgroundColor: colors.secondary,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
  },
  buttonTertiary: {
    backgroundColor: 'transparent',
  },
  buttonPremium: {
    backgroundColor: colors.accent.primary,
  },
  buttonSmall: {
    ...components.button.small,
    borderRadius: borderRadius.md,
  },
  buttonMedium: {
    ...components.button.medium,
    borderRadius: borderRadius.largeLegacy,
  },
  buttonLarge: {
    ...components.button.large,
    borderRadius: borderRadius.xlLegacy,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  
  // Button text styles
  buttonText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold as TextStyle['fontWeight'],
    textAlign: 'center',
    color: colors.text.primary,
    letterSpacing: typography.letterSpacing.wide,
  },
  buttonTextOutline: {
    color: colors.primary,
  },
  buttonTextSecondary: {
    color: colors.text.primary,
  },
  buttonTextTertiary: {
    color: colors.primary,
  },
  buttonTextPremium: {
    color: colors.text.primary,
  },
  buttonTextDisabled: {
    color: colors.text.tertiary,
  },
  
  // Button icon styles
  buttonIcon: {
    marginRight: spacing.lg,
  },
  
  // Icon button styles
  iconButton: {
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconButtonSmall: {
    width: 32,
    height: 32,
  },
  iconButtonMedium: {
    width: 40,
    height: 40,
  },
  iconButtonLarge: {
    width: 48,
    height: 48,
  },
});