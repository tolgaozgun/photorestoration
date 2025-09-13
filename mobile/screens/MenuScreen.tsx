import * as React from 'react'
import { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { useAnalytics } from '../contexts/AnalyticsContext';
import { useTranslation } from 'react-i18next';
import { useMenuVersion } from '../contexts/MenuVersionContext';

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
  const { state, loadMenuConfig, refreshMenu, setDevelopmentMode } = useMenuVersion();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    trackEvent('screen_view', { screen: 'menu' });
    loadMenuConfig();
  }, [loadMenuConfig]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshMenu();
    setRefreshing(false);
  };

  const toggleDevelopmentMode = async () => {
    const newMode = !state.isDevelopment;
    await setDevelopmentMode(newMode);
    Alert.alert(
      'Development Mode',
      `Development mode ${newMode ? 'enabled' : 'disabled'}. ${newMode ? 'You will see real-time menu updates.' : 'You are now using production menu.'}`
    );
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
        subtitle={state.currentVersion ? `v${state.currentVersion}${state.fromCache ? ' (cached)' : ''}` : 'Discover all available features'}
        leftAction={
          <NavigationButton
            icon={<Text variant="title">←</Text>}
            onPress={() => navigation.goBack()}
          />
        }
        rightActions={
          <View style={styles.headerActions}>
            {state.hasUpdate && (
              <NavigationButton
                icon={<Text variant="title">📡</Text>}
                onPress={() => Alert.alert('Update Available', `A new menu version (${state.latestVersion}) is available!`)}
              />
            )}
            <NavigationButton
              icon={<Text variant="title">🔄</Text>}
              onPress={handleRefresh}
            />
            {__DEV__ && (
              <NavigationButton
                icon={<Text variant="title">{state.isDevelopment ? '🔧' : '🔨'}</Text>}
                onPress={toggleDevelopmentMode}
              />
            )}
          </View>
        }
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
            {state.isDevelopment && '\n🔧 Development mode is active - you\'ll see real-time updates!'}
            {state.hasUpdate && !state.isDevelopment && '\n📡 A new menu version is available!'}
          </Text>
        </Section>

        {/* Dynamic Menu */}
        {state.menuData && (
          <DynamicMenu
            menuData={state.menuData}
            onItemPress={handleItemPress}
            showRefresh={false}
            isLoading={state.isLoading}
          />
        )}

        {/* Error state */}
        {state.error && (
          <Section style={styles.errorSection}>
            <Text variant="body" color="error" style={styles.errorText}>
              {state.error}
            </Text>
            <Button 
              title="Retry" 
              onPress={refreshMenu}
              variant="outline"
              style={styles.retryButton}
            />
          </Section>
        )}

        <Spacer size="large" />
      </ScrollView>

      {/* Loading Modal */}
      <LoadingModal
        visible={state.isLoading}
        message={state.isDevelopment ? "Loading development menu..." : "Loading menu..."}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorSection: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    minWidth: 100,
  },
});