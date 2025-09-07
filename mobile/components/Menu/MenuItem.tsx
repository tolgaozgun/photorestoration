import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TouchableOpacityProps,
  Dimensions,
} from 'react-native';
import { colors, borderRadius, spacing } from '../../theme';
import { Text } from '../Text';

interface MenuItemProps extends TouchableOpacityProps {
  title: string;
  description?: string;
  icon?: string;
  actionType: 'screen' | 'url' | 'action' | 'section';
  actionValue?: string;
  isPremium?: boolean;
  requiresAuth?: boolean;
  size?: 'small' | 'medium' | 'large';
  onPress?: () => void;
}

export const MenuItemComponent: React.FC<MenuItemProps> = ({
  title,
  description,
  icon,
  actionType,
  actionValue,
  isPremium = false,
  requiresAuth = false,
  size = 'medium',
  onPress,
  style,
  ...props
}) => {
  const getItemSize = () => {
    switch (size) {
      case 'small':
        return { width: 120, height: 120 };
      case 'large':
        return { width: 180, height: 180 };
      default:
        return { width: 150, height: 150 };
    }
  };

  const itemSize = getItemSize();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { width: itemSize.width, height: itemSize.height },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
      {...props}
    >
      {/* Icon */}
      {icon && (
        <View style={styles.iconContainer}>
          <Text variant="display" style={styles.icon}>
            {icon}
          </Text>
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        <Text
          variant="body"
          color="primary"
          weight="semibold"
          numberOfLines={2}
          style={styles.title}
        >
          {title}
        </Text>
        
        {description && (
          <Text
            variant="caption"
            color="secondary"
            numberOfLines={2}
            style={styles.description}
          >
            {description}
          </Text>
        )}
      </View>

      {/* Badges */}
      <View style={styles.badges}>
        {isPremium && (
          <View style={styles.premiumBadge}>
            <Text variant="caption" color="primary" weight="medium">
              PRO
            </Text>
          </View>
        )}
        
        {requiresAuth && (
          <View style={styles.authBadge}>
            <Text variant="caption" color="primary" weight="medium">
              🔒
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.large,
    padding: spacing.small,
    margin: spacing.micro,
    shadowColor: colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.medium,
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  icon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    marginBottom: 2,
  },
  description: {
    fontSize: 10,
  },
  badges: {
    position: 'absolute',
    top: spacing.small,
    right: spacing.small,
    flexDirection: 'row',
    gap: spacing.micro,
  },
  premiumBadge: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.micro,
    paddingVertical: 2,
    borderRadius: borderRadius.small,
  },
  authBadge: {
    backgroundColor: colors.background.tertiary,
    paddingHorizontal: spacing.micro,
    paddingVertical: 2,
    borderRadius: borderRadius.small,
  },
});