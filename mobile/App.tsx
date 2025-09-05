import React, { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Onboarding screens
import OnboardingFlow from './screens/onboarding/OnboardingFlow';

// Flow screens
import PhotoInputScreen from './screens/flow/PhotoInputScreen';
import ModeSelectionScreen from './screens/flow/ModeSelectionScreen';
import PreviewScreen from './screens/flow/PreviewScreen';
import ResultScreen from './screens/flow/ResultScreen';
import HistoryScreen from './screens/flow/HistoryScreen';

// Legacy screens (for backward compatibility)
import SettingsScreen from './screens/SettingsScreen';
import EmailSyncScreen from './screens/EmailSyncScreen';
import VerificationCodeScreen from './screens/VerificationCodeScreen';

// Contexts
import { UserProvider } from './contexts/UserContext';
import { AnalyticsProvider } from './contexts/AnalyticsContext';
import { FlowProvider } from './contexts/FlowContext';
import { generateUUID } from './utils/uuid';

export type RootStackParamList = {
  Onboarding: undefined;
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
  History: undefined;
  Settings: undefined;
  EmailSync: undefined;
  VerificationCode: {
    email: string;
    deviceId: string;
    deviceName: string;
    deviceType: string;
  };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    initializeApp();
    console.log('i18n object:', i18n);
    i18n.on('initialized', () => {
      setI18nReady(true);
    });
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
    // This will be handled by the navigation after onboarding
    handleOnboardingComplete();
  };

  if (isFirstLaunch === null || !i18nReady) {
    return null; // Loading state
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <I18nextProvider i18n={i18n}>
        <View style={styles.container}>
          {i18nReady ? (
            <Text style={{ color: 'white', fontSize: 24, textAlign: 'center', marginTop: 100 }}>
              i18n is ready! Translation: {i18n.t('common.ok')}
            </Text>
          ) : (
            <Text style={{ color: 'white', fontSize: 24, textAlign: 'center', marginTop: 100 }}>
              Loading i18n...
            </Text>
          )}
        </View>
      </I18nextProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
});