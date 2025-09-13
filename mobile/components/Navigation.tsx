import * as React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, spacing, borderRadius, shadows, typography, components } from '../theme';

interface CustomTabBarProps extends BottomTabBarProps {
  tabs: Array<{
    name: string;
    label: string;
    icon: React.ReactNode;
    focusedIcon: React.ReactNode;
  }>;
}

export function CustomTabBar({ state, descriptors, navigation, tabs }: CustomTabBarProps) {
  return (
    <View style={styles.container}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;

        const tab = tabs.find(t => t.name === route.name);
        const icon = isFocused ? tab?.focusedIcon : tab?.icon;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tab}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
          >
            <View style={[styles.tabContent, isFocused && styles.tabContentFocused]}>
              {icon}
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelFocused]}>
                {typeof label === 'string' ? label : route.name}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

interface HeaderProps {
  title: string;
  subtitle?: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  style?: ViewStyle;
}

export function Header({ title, subtitle, leftAction, rightAction, style }: HeaderProps) {
  return (
    <View style={[styles.header, style]}>
      {leftAction && (
        <View style={styles.headerLeft}>
          {leftAction}
        </View>
      )}
      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle && (
          <Text style={styles.headerSubtitle}>{subtitle}</Text>
        )}
      </View>
      {rightAction && (
        <View style={styles.headerRight}>
          {rightAction}
        </View>
      )}
    </View>
  );
}

interface NavigationButtonProps {
  icon: React.ReactNode;
  onPress: () => void;
  style?: ViewStyle;
}

export function NavigationButton({ icon, onPress, style }: NavigationButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.navButton, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon}
    </TouchableOpacity>
  );
}

interface FloatingActionButtonProps {
  icon: React.ReactNode;
  onPress: () => void;
  style?: ViewStyle;
}

export function FloatingActionButton({ icon, onPress, style }: FloatingActionButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.fab, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.background.floating,
    position: 'absolute',
    bottom: spacing['6xl'],
    left: spacing['2xl'],
    right: spacing['2xl'],
    height: components.tabBar.height,
    borderRadius: components.tabBar.borderRadius,
    ...shadows.xl,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: components.tabItem.borderRadius,
    minWidth: components.tabItem.minWidth,
    minHeight: components.tabItem.minHeight,
  },
  tabContentFocused: {
    backgroundColor: `${colors.primary}33`,
  },
  tabLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
    fontWeight: typography.fontWeight.medium as TextStyle['fontWeight'],
  },
  tabLabelFocused: {
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold as TextStyle['fontWeight'],
  },
  tabIcon: {
    fontSize: typography.fontSize['3xl'],
    color: colors.text.tertiary,
  },
  tabIconFocused: {
    fontSize: typography.fontSize['3xl'],
    color: colors.primary,
  },
  
  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xlLegacy,
    paddingVertical: spacing.lg,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  headerLeft: {
    flex: 1,
  },
  headerCenter: {
    flex: 2,
    alignItems: 'center',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold as TextStyle['fontWeight'],
    color: colors.text.primary,
    textAlign: 'center',
    letterSpacing: typography.letterSpacing.wide,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  
  // Navigation button styles
  navButton: {
    width: components.navButton.width,
    height: components.navButton.height,
    borderRadius: components.navButton.borderRadius,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  
  // Floating action button styles
  fab: {
    position: 'absolute',
    right: spacing.xlLegacy,
    bottom: spacing['4xl'],
    width: components.fab.width,
    height: components.fab.height,
    borderRadius: components.fab.borderRadius,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
});