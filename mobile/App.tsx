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

// New 5-Tab Structure Screens
import EnhanceScreen from './screens/tabs/EnhanceScreen';
import AIPhotosScreen from './screens/tabs/AIPhotosScreen';
import AIFiltersScreen from './screens/tabs/AIFiltersScreen';
import AIVideosScreen from './screens/tabs/AIVideosScreen';
import CustomAIEDitsScreen from './screens/tabs/CustomAIEDitsScreen';

// Essential legacy screens (keeping only what's necessary)
// import ProfileScreen from './screens/ProfileScreen';
import MenuScreen from './screens/MenuScreen';
import PurchaseScreen from './screens/PurchaseScreen';
import VideoGalleryScreen from './screens/VideoGalleryScreen';
import EmailSyncScreen from './screens/EmailSyncScreen';
import VerificationCodeScreen from './screens/VerificationCodeScreen';
import CustomAIEditInputScreen from './screens/CustomAIEditInputScreen';
import ExportScreen from './screens/ExportScreen';
import SettingsScreen from './screens/SettingsScreen';
import SaveAndShareScreen from './screens/SaveAndShareScreen';
import RestorationPreviewScreen from './screens/RestorationPreviewScreen';

// Flow screens (keeping essential flow)
import PhotoInputScreen from './screens/flow/PhotoInputScreen';
import ModeSelectionScreen from './screens/flow/ModeSelectionScreen';
import SmartModeSelectionScreen from './screens/SmartModeSelectionScreen';
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
// import { CustomTabBar } from './components/Navigation';
import { Text } from './components/Text';
import { colors } from './theme';

// Universal screens
import UniversalProcessingScreen from './screens/UniversalProcessingScreen';
import UniversalResultScreen from './screens/UniversalResultScreen';

// Types for navigation
export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: undefined;
  PhotoInput: undefined;
  ModeSelection: { imageUri: string };
  SmartModeSelection: { imageUri: string };
    RestorationPreview: { imageUri: string };
  Preview: { 
    imageUri: string;
    selectedMode: 'enhance' | 'colorize' | 'de-scratch' | 'enlighten' | 'recreate' | 'combine';
  };
  UniversalProcessing: { 
    imageUri: string;
    processingType: 'enhance' | 'filter' | 'video' | 'custom-edit' | 'ai-generation';
    estimatedTime?: number;
  };
  UniversalResult: { 
    originalUri: string;
    enhancedUri: string;
    enhancementId: string;
    watermark: boolean;
    mode: 'enhance' | 'filter' | 'video' | 'custom-edit' | 'ai-generation';
    processingTime: number;
    processingType?: string;
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
  CustomAIEDitsHome: undefined;
  CustomAIEditInput: { imageUri: string; };
  EnhanceHome: undefined;
  ModeSelection: { imageUri: string; };
  PhotoInput: undefined;
  RestorationPreview: { imageUri: string; };
  Preview: { originalUri: string; enhancedUri: string; };
  Result: {
    originalUri: string;
    enhancedUri: string;
    enhancementId: string;
    watermark: boolean;
    mode: string;
    processingTime: number;
  };
  SmartModeSelection: { imageUri: string; };
};

export type MainTabParamList = {
  Enhance: undefined;
  AIPhotos: undefined;
  AIFilters: undefined;
  AIVideos: undefined;
  CustomAIEDits: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Enhance Stack Navigator type
interface EnhanceStackParamList {
  EnhanceHome: undefined;
  ModeSelection: { imageUri: string };
  PhotoInput: undefined;
  RestorationPreview: { imageUri: string };
  Preview: { originalUri: string; enhancedUri: string };
  Result: {
    originalUri: string;
    enhancedUri: string;
    enhancementId: string;
    watermark: boolean;
    mode: string;
    processingTime: number;
  };
  SmartModeSelection: { imageUri: string };
}


// Enhance Stack Navigator
function EnhanceStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="EnhanceHome"
        component={EnhanceScreen}
      />
      <Stack.Screen
        name="ModeSelection"
        component={ModeSelectionScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="PhotoInput"
        component={PhotoInputScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="RestorationPreview"
        component={RestorationPreviewScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Preview"
        component={PreviewScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Result"
        component={ResultScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

// Custom AI Edits Stack Navigator
function CustomAIEDitsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="CustomAIEDitsHome"
        component={CustomAIEDitsScreen}
      />
      <Stack.Screen
        name="CustomAIEditInput"
        component={CustomAIEditInputScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

// Main Tab Navigator with new 5-Tab structure
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tab.Screen
        name="Enhance"
        options={{
          tabBarLabel: 'Enhance',
          tabBarIcon: ({ focused }) => (
            <Text style={[
              styles.tabIcon,
              focused && styles.tabIconFocused
            ]}>✨</Text>
          ),
        }}
      >
        {(props) => (
          <EnhanceStack {...props} />
        )}
      </Tab.Screen>
      <Tab.Screen 
        name="AIPhotos" 
        component={AIPhotosScreen}
        options={{
          tabBarLabel: 'AI Photos',
          tabBarIcon: ({ focused }) => (
            <Text style={[
              styles.tabIcon,
              focused && styles.tabIconFocused
            ]}>👤</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="AIFilters" 
        component={AIFiltersScreen}
        options={{
          tabBarLabel: 'AI Filters',
          tabBarIcon: ({ focused }) => (
            <Text style={[
              styles.tabIcon,
              focused && styles.tabIconFocused
            ]}>🎨</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="AIVideos" 
        component={AIVideosScreen}
        options={{
          tabBarLabel: 'AI Videos',
          tabBarIcon: ({ focused }) => (
            <Text style={[
              styles.tabIcon,
              focused && styles.tabIconFocused
            ]}>🎬</Text>
          ),
        }}
      />
      <Tab.Screen
        name="CustomAIEDits"
        options={{
          tabBarLabel: 'Custom AI',
          tabBarIcon: ({ focused }) => (
            <Text style={[
              styles.tabIcon,
              focused && styles.tabIconFocused
            ]}>✏️</Text>
          ),
        }}
      >
        {(props) => (
          <CustomAIEDitsStack {...props} />
        )}
      </Tab.Screen>
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

  const handlePhotoSelected = (_imageUri: string) => {
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
                        headerShown: false,
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
                        headerShown: false,
                      }}
                    />

                    {/* Email Sync Screen */}
                    <Stack.Screen
                      name="EmailSync"
                      component={EmailSyncScreen}
                      options={{
                        headerShown: false,
                      }}
                    />

                    {/* Verification Code Screen */}
                    <Stack.Screen
                      name="VerificationCode"
                      component={VerificationCodeScreen}
                      options={{
                        headerShown: false,
                      }}
                    />

                    {/* Custom AI Edit Input Screen */}
                    {/* Universal Processing and Result Screens */}
                    <Stack.Screen 
                      name="UniversalProcessing" 
                      component={UniversalProcessingScreen}
                      options={{ 
                        headerShown: false,
                      }}
                    />
                    <Stack.Screen 
                      name="UniversalResult" 
                      component={UniversalResultScreen}
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
    height: 80,
    backgroundColor: '#000000',
    borderTopWidth: 1,
    borderTopColor: '#333333',
    paddingBottom: 20,
  },
  tabIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  tabIconFocused: {
    fontSize: 24,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  tabBarItem: {
    paddingVertical: 4,
  },
});