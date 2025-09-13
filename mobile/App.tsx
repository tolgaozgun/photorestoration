import * as React from 'react'
import { useEffect, useState } from 'react';
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
import MenuScreen from './screens/MenuScreen';

// Essential legacy screens (keeping only what's necessary)
import ProfileScreen from './screens/ProfileScreen';
import PurchaseScreen from './screens/PurchaseScreen';
import VideoGalleryScreen from './screens/VideoGalleryScreen';
import EmailSyncScreen from './screens/EmailSyncScreen';
import VerificationCodeScreen from './screens/VerificationCodeScreen';
import ExportScreen from './screens/ExportScreen';
import SettingsScreen from './screens/SettingsScreen';
import SaveAndShareScreen from './screens/SaveAndShareScreen';
import RestorationPreviewScreen from './screens/RestorationPreviewScreen';

// Flow screens (keeping essential flow)
import PhotoInputScreen from './screens/flow/PhotoInputScreen';
import ModeSelectionScreen from './screens/flow/ModeSelectionScreen';
import SmartModeSelectionScreen from './screens/SmartModeSelectionScreen';
import PreviewAndAdjustScreen from './screens/PreviewAndAdjustScreen';
import PreviewScreen from './screens/flow/PreviewScreen';
import ResultScreen from './screens/flow/ResultScreen';

// New AI Generation Flow Screens
import SelfieUploadScreen from './screens/flow/SelfieUploadScreen';
import AITrainingScreen from './screens/flow/AITrainingScreen';
import StyleSelectionScreen from './screens/flow/StyleSelectionScreen';
import AIGenerationResultScreen from './screens/flow/AIGenerationResultScreen';

// Contexts
import { UserProvider } from './contexts/UserContext';
import { AnalyticsProvider } from './contexts/AnalyticsContext';
import { FlowProvider } from './contexts/FlowContext';
import { generateUUID } from './utils/uuid';

// Import our custom components
import { CustomTabBar } from './components/Navigation';
import { Text } from './components/Text';
import { colors, spacing } from './theme';

// Types for navigation
export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: undefined;
  PhotoInput: undefined;
  ModeSelection: { imageUri: string };
  SmartModeSelection: { imageUri: string };
  PreviewAndAdjust: { 
    imageUri: string;
    mode: string;
  };
  RestorationPreview: { imageUri: string };
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
  Export: { 
    originalUri: string;
    enhancedUri: string;
    enhancementId: string;
    watermark: boolean;
  };
  SaveAndShare: { enhancedImageUri: string };
  SelfieUpload: { 
    featureId: string;
    featureTitle: string;
    featureDescription: string;
  };
  AITraining: { 
    featureId: string;
    featureTitle: string;
    featureDescription: string;
    photoUris: string[];
  };
  StyleSelection: { 
    featureId: string;
    featureTitle: string;
    featureDescription: string;
    photoUris: string[];
  };
  AIGenerationResult: { 
    featureId: string;
    featureTitle: string;
    photoUris: string[];
    selectedStyle: string;
    styleTitle: string;
    processingTime: number;
  };
  Profile: undefined;
  Purchase: undefined;
  Settings: undefined;
  Menu: undefined;
  VideoGallery: undefined;
  EmailSync: undefined;
  VerificationCode: { 
    email: string; 
    deviceId: string; 
    deviceName: string; 
    deviceType: "ios" | "android" | "windows" | "macos" | "web"; 
  };
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
          label: 'Fix',
          icon: <Text style={styles.tabIcon}>✨</Text>,
          focusedIcon: <Text style={styles.tabIconFocused}>✨</Text>,
        },
        {
          name: 'Create',
          label: 'AI', 
          icon: <Text style={styles.tabIcon}>🎨</Text>,
          focusedIcon: <Text style={styles.tabIconFocused}>🎨</Text>,
        },
        {
          name: 'Videos',
          label: 'Vids',
          icon: <Text style={styles.tabIcon}>🎬</Text>,
          focusedIcon: <Text style={styles.tabIconFocused}>🎬</Text>,
        },
        {
          name: 'Profile',
          label: 'Me',
          icon: <Text style={styles.tabIcon}>👤</Text>,
          focusedIcon: <Text style={styles.tabIconFocused}>👤</Text>,
        },
      ]} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' }, // Hide default tab bar
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen 
        name="Enhance" 
        component={PhotoInputScreen}
        options={{ title: 'Fix' }}
      />
      <Tab.Screen 
        name="Create" 
        component={MenuScreen}
        options={{ title: 'AI' }}
      />
      <Tab.Screen 
        name="Videos" 
        component={MenuScreen}
        options={{ title: 'Vids' }}
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
                      name="RestorationPreview" 
                      component={RestorationPreviewScreen}
                      options={{ 
                        headerShown: true,
                        title: 'Restoration Preview',
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
                      name="SmartModeSelection" 
                      component={SmartModeSelectionScreen}
                      options={{ 
                        headerShown: true,
                        title: 'Smart Mode Selection',
                        headerStyle: { backgroundColor: colors.background.secondary },
                        headerTintColor: colors.text.primary,
                      }}
                    />
                    <Stack.Screen 
                      name="PreviewAndAdjust" 
                      component={PreviewAndAdjustScreen}
                      options={{ 
                        headerShown: true,
                        title: 'Preview & Adjust',
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

                    {/* Export Screen */}
                    <Stack.Screen 
                      name="Export" 
                      component={ExportScreen}
                      options={{ 
                        headerShown: true,
                        title: 'Export',
                        headerStyle: { backgroundColor: colors.background.secondary },
                        headerTintColor: colors.text.primary,
                      }}
                    />

                    {/* Save and Share Screen */}
                    <Stack.Screen 
                      name="SaveAndShare" 
                      component={SaveAndShareScreen}
                      options={{ 
                        headerShown: true,
                        title: 'Save & Share',
                        headerStyle: { backgroundColor: colors.background.secondary },
                        headerTintColor: colors.text.primary,
                      }}
                    />

                    {/* AI Generation Flow */}
                    <Stack.Screen 
                      name="SelfieUpload" 
                      component={SelfieUploadScreen}
                      options={{ 
                        headerShown: true,
                        title: 'Upload Selfies',
                        headerStyle: { backgroundColor: colors.background.secondary },
                        headerTintColor: colors.text.primary,
                      }}
                    />
                    <Stack.Screen 
                      name="AITraining" 
                      component={AITrainingScreen}
                      options={{ 
                        headerShown: true,
                        title: 'AI Training',
                        headerStyle: { backgroundColor: colors.background.secondary },
                        headerTintColor: colors.text.primary,
                      }}
                    />
                    <Stack.Screen 
                      name="StyleSelection" 
                      component={StyleSelectionScreen}
                      options={{ 
                        headerShown: true,
                        title: 'Choose Style',
                        headerStyle: { backgroundColor: colors.background.secondary },
                        headerTintColor: colors.text.primary,
                      }}
                    />
                    <Stack.Screen 
                      name="AIGenerationResult" 
                      component={AIGenerationResultScreen}
                      options={{ 
                        headerShown: true,
                        title: 'Results',
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

                    {/* Settings Screen */}
                    <Stack.Screen 
                      name="Settings" 
                      component={SettingsScreen}
                      options={{ 
                        headerShown: true,
                        title: 'Settings',
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

                    {/* Video Gallery Screen */}
                    <Stack.Screen 
                      name="VideoGallery" 
                      component={VideoGalleryScreen}
                      options={{ 
                        headerShown: true,
                        title: 'AI Video Gallery',
                        headerStyle: { backgroundColor: colors.background.secondary },
                        headerTintColor: colors.text.primary,
                      }}
                    />

                    {/* Email Sync Screen */}
                    <Stack.Screen 
                      name="EmailSync" 
                      component={EmailSyncScreen}
                      options={{ 
                        headerShown: true,
                        title: 'Email Sync',
                        headerStyle: { backgroundColor: colors.background.secondary },
                        headerTintColor: colors.text.primary,
                      }}
                    />

                    {/* Verification Code Screen */}
                    <Stack.Screen 
                      name="VerificationCode" 
                      component={VerificationCodeScreen}
                      options={{ 
                        headerShown: true,
                        title: 'Verification Code',
                        headerStyle: { backgroundColor: colors.background.secondary },
                        headerTintColor: colors.text.primary,
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
  tabIcon: {
    fontSize: 22,
    color: colors.text.tertiary,
  },
  tabIconFocused: {
    fontSize: 22,
    color: colors.primary,
  },
});