import React, { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Onboarding screens
import OnboardingFlow from './screens/onboarding/OnboardingFlow';

// New Discovery Hub Screens
import HomeScreen from './screens/HomeScreen';
import ModeSelectionScreen from './screens/ModeSelectionScreen';
import AIGenerationScreen from './screens/AIGenerationScreen';
import VideoGenerationScreen from './screens/VideoGenerationScreen';
import MenuScreen from './screens/MenuScreen';

// Essential legacy screens (keeping only what's necessary)
import ProfileScreen from './screens/ProfileScreen';
import PurchaseScreen from './screens/PurchaseScreen';

// Flow screens (keeping essential flow)
import PhotoInputScreen from './screens/flow/PhotoInputScreen';
import PreviewScreen from './screens/flow/PreviewScreen';
import ResultScreen from './screens/flow/ResultScreen';

// Contexts
import { UserProvider } from './contexts/UserContext';
import { AnalyticsProvider } from './contexts/AnalyticsContext';
import { FlowProvider } from './contexts/FlowContext';
import { generateUUID } from './utils/uuid';

// Import our custom components
import { CustomTabBar } from './components/Navigation';
import { Text } from './components/Text';
import { colors } from './theme';

// Types for navigation
export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: undefined;
  PhotoInput: undefined;
  ModeSelection: { imageUri: string };
  Preview: { 
    imageUri: string;
    selectedMode: 'enhance' | 'colorize' | 'de-scratch' | 'enlighten' | 'recreate' | 'combine';
  };
  Result: { 
    originalUri: string;
    enhancedUri: string;
    enhancementId: string;
    watermark: boolean;
    mode: string;
    processingTime: number;
  };
  Profile: undefined;
  Purchase: undefined;
  AIGeneration: { featureId?: string };
  VideoGeneration: { featureId?: string };
  Menu: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Enhance: undefined;
  Create: undefined;
  Videos: undefined;
  Profile: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Main Tab Navigator with Discovery Hub
function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} tabs={[
        {
          name: 'Home',
          label: 'Home',
          icon: <Text style={styles.tabIcon}>🏠</Text>,
          focusedIcon: <Text style={styles.tabIconFocused}>🏠</Text>,
        },
        {
          name: 'Enhance', 
          label: 'Enhance',
          icon: <Text style={styles.tabIcon}>✨</Text>,
          focusedIcon: <Text style={styles.tabIconFocused}>✨</Text>,
        },
        {
          name: 'Create',
          label: 'Create', 
          icon: <Text style={styles.tabIcon}>🤖</Text>,
          focusedIcon: <Text style={styles.tabIconFocused}>🤖</Text>,
        },
        {
          name: 'Videos',
          label: 'Videos',
          icon: <Text style={styles.tabIcon}>🎬</Text>,
          focusedIcon: <Text style={styles.tabIconFocused}>🎬</Text>,
        },
        {
          name: 'Profile',
          label: 'Profile',
          icon: <Text style={styles.tabIcon}>👤</Text>,
          focusedIcon: <Text style={styles.tabIconFocused}>👤</Text>,
        },
      ]} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen 
        name="Enhance" 
        component={PhotoInputScreen}
        options={{ title: 'Enhance Photos' }}
      />
      <Tab.Screen 
        name="Create" 
        component={AIGenerationScreen}
        options={{ title: 'AI Creation' }}
      />
      <Tab.Screen 
        name="Videos" 
        component={VideoGenerationScreen}
        options={{ title: 'Video Generation' }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const [i18nReady, setI18nReady] = useState<boolean>(i18n.isInitialized ?? false);

  useEffect(() => {
    initializeApp();
    if (i18n.isInitialized) {
      setI18nReady(true);
      return;
    }
    const handleInitialized = () => setI18nReady(true);
    i18n.on('initialized', handleInitialized);
    return () => {
      i18n.off('initialized', handleInitialized);
    };
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize user
      let userId = await SecureStore.getItemAsync('userId');
      if (!userId) {
        userId = generateUUID();
        await SecureStore.setItemAsync('userId', userId);
      }

      // Check if this is the first launch
      const hasSeenOnboarding = await SecureStore.getItemAsync('hasSeenOnboarding');
      setIsFirstLaunch(hasSeenOnboarding !== 'true');
    } catch (error) {
      console.error('Error initializing app:', error);
      setIsFirstLaunch(false);
    }
  };

  const handleOnboardingComplete = async () => {
    try {
      await SecureStore.setItemAsync('hasSeenOnboarding', 'true');
      setIsFirstLaunch(false);
    } catch (error) {
      console.error('Error saving onboarding state:', error);
      setIsFirstLaunch(false);
    }
  };

  const handlePhotoSelected = (imageUri: string) => {
    handleOnboardingComplete();
  };

  if (isFirstLaunch === null || !i18nReady) {
    return null; // Loading state
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <I18nextProvider i18n={i18n}>
        <UserProvider>
          <AnalyticsProvider>
            <FlowProvider>
              <View style={styles.container}>
                <NavigationContainer>
                  <Stack.Navigator
                    initialRouteName={isFirstLaunch ? 'Onboarding' : 'MainTabs'}
                    screenOptions={{
                      headerShown: false,
                      cardStyle: { backgroundColor: colors.background.primary },
                    }}
                  >
                    {/* Onboarding Flow */}
                    <Stack.Screen name="Onboarding">
                      {(props) => (
                        <OnboardingFlow
                          {...props}
                          onComplete={handleOnboardingComplete}
                          onPhotoSelected={handlePhotoSelected}
                        />
                      )}
                    </Stack.Screen>

                    {/* Main App with Discovery Hub */}
                    <Stack.Screen name="MainTabs" component={MainTabNavigator} />

                    {/* Enhancement Flow */}
                    <Stack.Screen 
                      name="PhotoInput" 
                      component={PhotoInputScreen}
                      options={{ 
                        headerShown: true,
                        title: 'Select Photo',
                        headerStyle: { backgroundColor: colors.background.secondary },
                        headerTintColor: colors.text.primary,
                      }}
                    />
                    <Stack.Screen 
                      name="ModeSelection" 
                      component={ModeSelectionScreen}
                      options={{ 
                        headerShown: true,
                        title: 'Choose Enhancement',
                        headerStyle: { backgroundColor: colors.background.secondary },
                        headerTintColor: colors.text.primary,
                      }}
                    />
                    <Stack.Screen 
                      name="Preview" 
                      component={PreviewScreen}
                      options={{ 
                        headerShown: true,
                        title: 'Preview',
                        headerStyle: { backgroundColor: colors.background.secondary },
                        headerTintColor: colors.text.primary,
                      }}
                    />
                    <Stack.Screen 
                      name="Result" 
                      component={ResultScreen}
                      options={{ 
                        headerShown: true,
                        title: 'Result',
                        headerStyle: { backgroundColor: colors.background.secondary },
                        headerTintColor: colors.text.primary,
                      }}
                    />

                    {/* AI Generation Features */}
                    <Stack.Screen 
                      name="AIGeneration" 
                      component={AIGenerationScreen}
                      options={{ 
                        headerShown: true,
                        title: 'AI Generation',
                        headerStyle: { backgroundColor: colors.background.secondary },
                        headerTintColor: colors.text.primary,
                      }}
                    />

                    {/* Video Generation Features */}
                    <Stack.Screen 
                      name="VideoGeneration" 
                      component={VideoGenerationScreen}
                      options={{ 
                        headerShown: true,
                        title: 'Video Generation',
                        headerStyle: { backgroundColor: colors.background.secondary },
                        headerTintColor: colors.text.primary,
                      }}
                    />

                    {/* Profile */}
                    <Stack.Screen 
                      name="Profile" 
                      component={ProfileScreen}
                      options={{ 
                        headerShown: true,
                        title: 'Profile',
                        headerStyle: { backgroundColor: colors.background.secondary },
                        headerTintColor: colors.text.primary,
                      }}
                    />

                    {/* Purchase Screen */}
                    <Stack.Screen 
                      name="Purchase" 
                      component={PurchaseScreen}
                      options={{ 
                        headerShown: true,
                        title: 'Get Credits',
                        headerStyle: { backgroundColor: colors.background.secondary },
                        headerTintColor: colors.text.primary,
                      }}
                    />

                    {/* Menu Screen */}
                    <Stack.Screen 
                      name="Menu" 
                      component={MenuScreen}
                      options={{ 
                        headerShown: false,
                      }}
                    />
                  </Stack.Navigator>
                </NavigationContainer>
                <StatusBar style="light" />
              </View>
            </FlowProvider>
          </AnalyticsProvider>
        </UserProvider>
      </I18nextProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  tabBar: {
    backgroundColor: colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: colors.background.tertiary,
    height: 80,
    paddingBottom: 20, // Safe area for iOS
  },
  tabIcon: {
    fontSize: 24,
    color: colors.text.secondary,
  },
  tabIconFocused: {
    fontSize: 24,
    color: colors.text.primary,
  },
});