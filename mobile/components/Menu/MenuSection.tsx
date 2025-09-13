import * as React from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Dimensions,
  ViewStyle,
} from 'react-native';
import { colors, borderRadius, spacing } from '../../theme';
import { Text } from '../Text';
import { MenuItemComponent } from './MenuItem';

type MenuItem = {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  action_type: 'screen' | 'url' | 'action' | 'section';
  action_value?: string;
  is_premium: boolean;
  requires_auth: boolean;
  metadata: Record<string, unknown>;
};

interface MenuSectionProps {
  section: {
    id: string;
    name: string;
    title: string;
    description?: string;
    icon?: string;
    layout: 'grid' | 'list' | 'horizontal';
    is_active: boolean;
    metadata: Record<string, unknown>;
  };
  items: Array<{
    id: string;
    title: string;
    description?: string;
    icon?: string;
    action_type: 'screen' | 'url' | 'action' | 'section';
    action_value?: string;
    is_premium: boolean;
    requires_auth: boolean;
    metadata: Record<string, unknown>;
  }>;
  onItemPress?: (item: MenuItem) => void;
  style?: ViewStyle;
}

export const MenuSection: React.FC<MenuSectionProps> = ({
  section,
  items,
  onItemPress,
  style,
}) => {
  const renderMenuItem = ({ item }: { item: any }) => (
    <MenuItemComponent
      key={item.id}
      title={item.title}
      description={item.description}
      icon={item.icon}
      actionType={item.action_type}
      actionValue={item.action_value}
      isPremium={item.is_premium}
      requiresAuth={item.requires_auth}
      onPress={() => onItemPress?.(item)}
    />
  );

  const getLayoutStyle = () => {
    switch (section.layout) {
      case 'list':
        return styles.listLayout;
      case 'horizontal':
        return styles.horizontalLayout;
      default:
        return styles.gridLayout;
    }
  };

  const getItemSize = () => {
    switch (section.layout) {
      case 'list':
        return { width: Dimensions.get('window').width - 32, height: 80 };
      case 'horizontal':
        return { width: 120, height: 120 };
      default:
        return { width: 150, height: 150 };
    }
  };

  const itemSize = getItemSize();

  return (
    <View style={[styles.container, style]}>
      {/* Section Header */}
      <View style={styles.header}>
        {section.icon && (
          <Text variant="display" style={styles.sectionIcon}>
            {section.icon}
          </Text>
        )}
        <View style={styles.headerContent}>
          <Text variant="h3" color="primary" weight="semibold">
            {section.title}
          </Text>
          {section.description && (
            <Text variant="caption" color="secondary">
              {section.description}
            </Text>
          )}
        </View>
      </View>

      {/* Menu Items */}
      <FlatList
        data={items}
        renderItem={renderMenuItem}
        keyExtractor={(item) => item.id}
        numColumns={section.layout === 'grid' ? 2 : 1}
        horizontal={section.layout === 'horizontal'}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.itemsContainer,
          getLayoutStyle(),
          { minHeight: itemSize.height + 20 }
        ]}
        scrollEnabled={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="body" color="secondary">
              No items available
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.largeLegacy,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.mediumLegacy,
    paddingHorizontal: spacing.smallLegacy,
  },
  sectionIcon: {
    fontSize: 24,
    marginRight: spacing.smallLegacy,
  },
  headerContent: {
    flex: 1,
  },
  itemsContainer: {
    paddingHorizontal: spacing.smallLegacy,
  },
  gridLayout: {
    justifyContent: 'space-between',
  },
  listLayout: {
    flexDirection: 'column',
  },
  horizontalLayout: {
    flexDirection: 'row',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.largeLegacy,
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.largeLegacy,
  },
});