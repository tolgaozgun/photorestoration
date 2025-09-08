import React from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Platform, 
  ViewStyle,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, spacing, borderRadius, layout } from '../../theme';
import { Text } from '../Text';

interface TabItem {
  name: string;
  label: string;
  icon: React.ReactNode;
  focusedIcon?: React.ReactNode;
}

interface CustomTabBarProps extends BottomTabBarProps {
  tabs: TabItem[];
}

export const CustomTabBar: React.FC<CustomTabBarProps> = ({
  state,
  descriptors,
  navigation,
  tabs,
}) => {
  return (
    <View style={styles.tabBar}>
      {tabs.map((tab, index) => {
        const { options } = descriptors[state.routes[index].key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: state.routes[index].key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(state.routes[index].name, state.routes[index].params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: state.routes[index].key,
          });
        };

        return (
          <TouchableOpacity
            key={tab.name}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabItem}
          >
            <View style={[styles.tabContent, isFocused && styles.tabContentFocused]}>
              {isFocused && tab.focusedIcon ? tab.focusedIcon : tab.icon}
              <Text
                variant="caption"
                color={isFocused ? 'primary' : 'secondary'}
                weight={isFocused ? 'medium' : 'regular'}
                style={styles.tabLabel}
              >
                {tab.label}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

interface HeaderProps {
  title?: string;
  subtitle?: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  style?: ViewStyle;
  transparent?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  leftAction,
  rightAction,
  style,
  transparent = false,
}) => {
  return (
    <View style={[styles.header, transparent && styles.headerTransparent, style]}>
      <View style={styles.headerContent}>
        {/* Left Action */}
        <View style={styles.headerLeft}>
          {leftAction}
        </View>

        {/* Title */}
        <View style={styles.headerCenter}>
          {title && (
            <Text 
              variant="subtitle" 
              color="primary" 
              weight="medium"
              style={styles.headerTitle}
              numberOfLines={1}
            >
              {title}
            </Text>
          )}
          {subtitle && (
            <Text 
              variant="caption" 
              color="secondary"
              style={styles.headerSubtitle}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>

        {/* Right Action */}
        <View style={styles.headerRight}>
          {rightAction}
        </View>
      </View>
    </View>
  );
};

interface NavigationButtonProps {
  icon: React.ReactNode;
  onPress?: () => void;
  variant?: 'back' | 'close' | 'settings' | 'profile';
  badge?: string | number;
}

export const NavigationButton: React.FC<NavigationButtonProps> = ({
  icon,
  onPress,
  variant = 'back',
  badge,
}) => {
  return (
    <TouchableOpacity 
      style={styles.navButton} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon}
      {badge && (
        <View style={styles.navBadge}>
          <Text variant="caption" color="primary" weight="medium">
            {badge}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

interface FloatingActionButtonProps {
  icon: React.ReactNode;
  onPress?: () => void;
  variant?: 'primary' | 'secondary';
  style?: ViewStyle;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  icon,
  onPress,
  variant = 'primary',
  style,
}) => {
  return (
    <TouchableOpacity 
      style={[
        styles.fab,
        variant === 'primary' ? styles.fabPrimary : styles.fabSecondary,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {icon}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: colors.background.tertiary,
    height: layout.navigation.bottomTab.height,
    paddingBottom: Platform.select({
      ios: 20,
      android: 0,
    }),
  },

  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.small,
  },

  tabContentFocused: {
    // Add subtle animation or scaling for focused state
  },

  tabLabel: {
    marginTop: spacing.micro,
    fontSize: 12,
  },

  header: {
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.tertiary,
    height: Platform.select({
      ios: 60, // Header content with padding
      android: 72,  // Header content with padding
    }),
    marginBottom: spacing.medium,
  },

  headerTransparent: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
  },

  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.large,
    marginTop: Platform.select({
      ios: 0,
      android: 0,
    }),
    paddingVertical: spacing.small,
  },

  headerLeft: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },

  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.medium,
  },

  headerRight: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },

  headerTitle: {
    textAlign: 'center',
  },

  headerSubtitle: {
    textAlign: 'center',
    marginTop: 2,
  },

  navButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.medium,
  },

  navBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.accent.primary,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
  },

  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 90, // Above tab bar
    right: spacing.medium,
    shadowColor: colors.text.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },

  fabPrimary: {
    backgroundColor: colors.accent.primary,
  },

  fabSecondary: {
    backgroundColor: colors.background.tertiary,
  },
});

export default CustomTabBar;