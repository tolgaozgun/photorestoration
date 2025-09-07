import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { useAnalytics } from '../contexts/AnalyticsContext';
import { useTranslation } from 'react-i18next';

// Import our new components
import { Container, Section, Spacer } from '../components/Layout';
import { Text, SectionHeader } from '../components/Text';
import { Button, IconButton } from '../components/Button';
import { Header, NavigationButton, FloatingActionButton } from '../components/Navigation';
import { DynamicMenu } from '../components/Menu';
import { LoadingModal } from '../components/Modal';
import menuService, { MenuItem } from '../services/MenuService';

type MenuScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Menu'>;

export default function MenuScreen() {
  const navigation = useNavigation<MenuScreenNavigationProp>();
  const { t } = useTranslation();
  const { trackEvent } = useAnalytics();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [menuData, setMenuData] = useState<any>(null);

  useEffect(() => {
    trackEvent('screen_view', { screen: 'menu' });
    loadMenuData();
  }, []);

  const loadMenuData = async () => {
    try {
      setLoading(true);
      const data = await menuService.getMenu();
      setMenuData(data);
    } catch (error) {
      console.error('Error loading menu:', error);
      Alert.alert('Error', 'Failed to load menu. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMenuData();
    setRefreshing(false);
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
        } catch (error) {
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
          case 'refresh_menu':
            handleRefresh();
            break;
          case 'settings':
            navigation.navigate('Profile');
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
      <Header
        title="Features"
        subtitle="Discover all available features"
        leftAction={
          <NavigationButton
            icon={<Text variant="title">←</Text>}
            onPress={() => navigation.goBack()}
          />
        }
        rightAction={
          <NavigationButton
            icon={<Text variant="title">🔄</Text>}
            onPress={handleRefresh}
          />
        }
      />

      {/* Main Content */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#666"
          />
        }
      >
        {/* Welcome Section */}
        <Section style={styles.welcomeSection}>
          <Text variant="h2" color="primary" weight="bold" style={styles.welcomeTitle}>
            Welcome to PhotoRestore
          </Text>
          <Text variant="body" color="secondary" style={styles.welcomeText}>
            Explore our AI-powered photo enhancement and creative tools. 
            New features are added regularly!
          </Text>
        </Section>

        {/* Dynamic Menu */}
        <DynamicMenu
          onItemPress={handleItemPress}
          showRefresh={false}
        />

        <Spacer size="large" />
      </ScrollView>

      {/* Loading Modal */}
      <LoadingModal
        visible={loading}
        message="Loading menu..."
      />
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  welcomeSection: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  welcomeTitle: {
    marginBottom: 8,
  },
  welcomeText: {
    lineHeight: 20,
  },
});