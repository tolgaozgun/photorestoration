import * as React from 'react'
import { useState, useEffect } from 'react';
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
import { Text, SectionHeader } from '../components/Text';
import { Button, IconButton } from '../components/Button';
import { Header, NavigationButton, FloatingActionButton } from '../components/Navigation';
import { DynamicMenu } from '../components/Menu';
import { MenuItem, getMenuData } from '../data/menuData';

type MenuScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Menu'>;

export default function MenuScreen() {
  const navigation = useNavigation<MenuScreenNavigationProp>();
  const { t } = useTranslation();
  const { trackEvent } = useAnalytics();
  const menuData = getMenuData();

  useEffect(() => {
    trackEvent('screen_view', { screen: 'menu' });
  }, []);

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
        title=""
        subtitle=""
        leftAction={<View />}
        rightAction={<View />}
      />

      {/* Main Content */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
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
          menuData={menuData}
          onItemPress={handleItemPress}
          showRefresh={false}
        />

        <Spacer size="large" />
      </ScrollView>
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