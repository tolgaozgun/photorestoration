import * as React from 'react'
import { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { useAnalytics } from '../contexts/AnalyticsContext';
import { useTranslation } from 'react-i18next';

// Import our new components
import { Container, Section, Spacer } from '../components/Layout';
import { Text } from '../components/Text';
import { DynamicMenu } from '../components/Menu';
import { MenuItem } from '../data/menuData';
import { getMenuData } from '../data/menuData';

type MenuScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Menu'>;

export default function MenuScreen() {
  const navigation = useNavigation<MenuScreenNavigationProp>();
  const { trackEvent } = useAnalytics();
  const [refreshing, setRefreshing] = useState(false);
  const menuData = getMenuData();

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleItemPress = (item: MenuItem) => {
    trackEvent('menu_item_tap', {
      item_id: item.id,
      title: item.title,
      action_type: item.action_type
    });

    // Handle different action types
    switch (item.action_type) {
      case 'screen':
        // Navigate to screen if it exists
        try {
          // @ts-ignore - Dynamic navigation
          navigation.navigate(item.action_value);
        } catch {
          Alert.alert('Coming Soon', `${item.title} feature is coming soon!`);
        }
        break;

      case 'url':
        // Handle URL navigation (would need Linking or WebView)
        Alert.alert('External Link', `Would open: ${item.action_value}`);
        break;

      case 'action':
        // Handle custom actions
        switch (item.action_value) {
          case 'settings':
            navigation.navigate('Settings');
            break;
          default:
            Alert.alert('Action', `Would execute: ${item.action_value}`);
        }
        break;

      case 'section':
        // Handle section navigation
        Alert.alert('Section', `Would navigate to section: ${item.action_value}`);
        break;

      default:
        Alert.alert('Unknown Action', `This action type is not supported yet.`);
    }
  };

  return (
    <Container>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Features</Text>
        <Text style={styles.headerSubtitle}>Explore all available features</Text>
      </View>

      <Spacer size={16} />

      {/* Menu Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      >
        <DynamicMenu
          menuData={menuData}
          onItemPress={handleItemPress}
        />

        {/* Bottom spacing for tab bar */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
  },
  content: {
    flex: 1,
  },
  bottomSpacing: {
    height: 96,
  },
});