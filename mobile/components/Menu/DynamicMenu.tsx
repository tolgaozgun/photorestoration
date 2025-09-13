import * as React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { colors, spacing } from '../../theme';
import { Text } from '../Text';
import { MenuSection } from './MenuSection';
import { MenuData, MenuItem } from '../../data/menuData';

interface DynamicMenuProps {
  menuData: MenuData;
  onItemPress?: (item: MenuItem) => void;
  style?: any;
  showRefresh?: boolean;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export const DynamicMenu: React.FC<DynamicMenuProps> = ({
  menuData,
  onItemPress,
  style,
  showRefresh = true,
  isLoading = false,
  onRefresh,
}) => {

  const handleItemPress = (item: MenuItem) => {
    // Handle different action types
    switch (item.action_type) {
      case 'screen':
        // Navigate to screen
        console.log('Navigate to screen:', item.action_value);
        break;
      case 'url':
        // Open URL
        console.log('Open URL:', item.action_value);
        break;
      case 'action':
        // Execute action
        console.log('Execute action:', item.action_value);
        break;
      case 'section':
        // Navigate to section
        console.log('Navigate to section:', item.action_value);
        break;
      default:
        console.log('Unknown action type:', item.action_type);
    }
    
    onItemPress?.(item);
  };

  const getItemsForSection = (sectionId: string) => {
    return menuData.items.filter(item => item.section_id === sectionId && item.is_active) || [];
  };

  return (
    <View style={[styles.container, style]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {menuData.sections.map((section) => (
          <MenuSection
            key={section.id}
            section={section}
            items={getItemsForSection(section.id)}
            onItemPress={handleItemPress}
          />
        ))}
        
        {!menuData.sections.length && (
          <View style={styles.emptyContainer}>
            <Text variant="h3" color="secondary" style={styles.emptyTitle}>
              No Menu Available
            </Text>
            <Text variant="body" color="secondary">
              Check back later for new features
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: spacing.mediumLegacy,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.largeLegacy,
  },
  emptyTitle: {
    marginBottom: spacing.smallLegacy,
  },
});