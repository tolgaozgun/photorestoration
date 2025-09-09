import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { colors, spacing } from '../../theme';
import { Text } from '../Text';
import { MenuSection } from './MenuSection';
import { LoadingModal } from '../Modal';
import { MenuData } from '../../services/MenuService';

interface DynamicMenuProps {
  menuData?: MenuData | null;
  onItemPress?: (item: any) => void;
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
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh?.();
    setRefreshing(false);
  };

  const handleItemPress = (item: any) => {
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
    return menuData?.items.filter(item => item.section_id === sectionId) || [];
  };

  if (isLoading && !menuData) {
    return (
      <View style={[styles.container, style]}>
        <LoadingModal visible={true} message="Loading menu..." />
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          showRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.text.primary}
            />
          ) : undefined
        }
      >
        {menuData?.sections.map((section) => (
          <MenuSection
            key={section.id}
            section={section}
            items={getItemsForSection(section.id)}
            onItemPress={handleItemPress}
          />
        ))}
        
        {!menuData?.sections.length && (
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
    paddingVertical: spacing.medium,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.large,
  },
  emptyTitle: {
    marginBottom: spacing.small,
  },
});