import React, { useState, useEffect } from 'react';
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

interface MenuData {
  sections: Array<{
    id: string;
    name: string;
    title: string;
    description?: string;
    icon?: string;
    layout: 'grid' | 'list' | 'horizontal';
    is_active: boolean;
    metadata: any;
  }>;
  items: Array<{
    id: string;
    title: string;
    description?: string;
    icon?: string;
    action_type: 'screen' | 'url' | 'action' | 'section';
    action_value?: string;
    is_premium: boolean;
    requires_auth: boolean;
    metadata: any;
    section_id?: string;
  }>;
  success: boolean;
}

interface DynamicMenuProps {
  onItemPress?: (item: any) => void;
  style?: any;
  showRefresh?: boolean;
}

export const DynamicMenu: React.FC<DynamicMenuProps> = ({
  onItemPress,
  style,
  showRefresh = true,
}) => {
  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMenuData = async () => {
    try {
      setLoading(true);
      // Replace with your actual API call
      const response = await fetch(`${process.env.API_BASE_URL || 'http://localhost:8000'}/api/menu`);
      const data = await response.json();
      
      if (data.success) {
        setMenuData(data);
      } else {
        Alert.alert('Error', 'Failed to load menu');
      }
    } catch (error) {
      console.error('Error fetching menu:', error);
      Alert.alert('Error', 'Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMenuData();
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

  if (loading && !menuData) {
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