import React from 'react';
import { 
  TouchableOpacity, 
  TouchableOpacityProps, 
  StyleSheet, 
  ActivityIndicator, 
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { colors, borderRadius, layout, animation } from '../../theme';
import { Text } from '../Text';

interface ButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'premium';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  children,
  style,
  ...props
}) => {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      ...styles.base,
      opacity: disabled ? 0.5 : 1,
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: colors.text.primary,
          ...styles.primary,
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: colors.background.tertiary,
          ...styles.secondary,
        };
      case 'tertiary':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          ...styles.tertiary,
        };
      case 'premium':
        return {
          ...baseStyle,
          backgroundColor: colors.premium.background,
          ...styles.premium,
        };
      default:
        return baseStyle;
    }
  };

  const getTextStyle = (): TextStyle => {
    switch (variant) {
      case 'primary':
        return {
          color: colors.background.primary,
          ...styles.primaryText,
        };
      case 'secondary':
        return {
          color: colors.text.primary,
          ...styles.secondaryText,
        };
      case 'tertiary':
        return {
          color: colors.text.primary,
          ...styles.tertiaryText,
        };
      case 'premium':
        return {
          color: colors.premium.text,
          ...styles.premiumText,
        };
      default:
        return styles.primaryText;
    }
  };

  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case 'small':
        return {
          height: layout.button.secondary.height,
          paddingHorizontal: layout.button.secondary.horizontalPadding,
          ...styles.small,
        };
      case 'large':
        return {
          height: layout.button.primary.height,
          paddingHorizontal: layout.button.primary.horizontalMargin,
          ...styles.large,
        };
      default: // medium
        return {
          height: layout.button.primary.height,
          paddingHorizontal: layout.button.primary.horizontalMargin,
          ...styles.medium,
        };
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator 
          color={variant === 'primary' ? colors.background.primary : colors.text.primary} 
          size="small" 
        />
      );
    }

    return (
      <>
        {icon && iconPosition === 'left' && (
          <View style={styles.iconLeft}>{icon}</View>
        )}
        <Text style={getTextStyle()} weight="medium">
          {children}
        </Text>
        {icon && iconPosition === 'right' && (
          <View style={styles.iconRight}>{icon}</View>
        )}
      </>
    );
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), getSizeStyle(), style]}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

// IconButton component for icon-only buttons
interface IconButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary' | 'tertiary';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
}

export const IconButton: React.FC<IconButtonProps> = ({
  variant = 'secondary',
  size = 'medium',
  loading = false,
  disabled = false,
  children,
  style,
  ...props
}) => {
  const getSize = () => {
    switch (size) {
      case 'small':
        return 32;
      case 'large':
        return 56;
      default:
        return layout.button.icon.size;
    }
  };

  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary':
        return colors.text.primary;
      case 'secondary':
        return colors.background.tertiary;
      case 'tertiary':
        return 'transparent';
      default:
        return colors.background.tertiary;
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'primary':
        return colors.background.primary;
      case 'secondary':
        return colors.text.primary;
      case 'tertiary':
        return colors.text.primary;
      default:
        return colors.text.primary;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.iconButton,
        {
          width: getSize(),
          height: getSize(),
          backgroundColor: getBackgroundColor(),
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator 
          color={getIconColor()} 
          size="small" 
        />
      ) : (
        <View style={styles.iconButtonContent}>
          {React.cloneElement(children as React.ReactElement, {
            color: getIconColor(),
            size: getSize() * 0.5,
          })}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.pill,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    minWidth: 120,
  },
  
  primary: {
    shadowColor: colors.text.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  secondary: {
    borderWidth: 1,
    borderColor: colors.background.tertiary,
  },
  
  tertiary: {
    borderWidth: 0,
  },
  
  premium: {
    shadowColor: colors.premium.text,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  
  primaryText: {
    fontSize: 16,
  },
  
  secondaryText: {
    fontSize: 14,
  },
  
  tertiaryText: {
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  
  premiumText: {
    fontSize: 16,
  },
  
  small: {
    minWidth: 80,
  },
  
  medium: {
    minWidth: 120,
  },
  
  large: {
    minWidth: 160,
  },
  
  iconLeft: {
    marginRight: 8,
  },
  
  iconRight: {
    marginLeft: 8,
  },
  
  iconButton: {
    borderRadius: borderRadius.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  iconButtonContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Button;