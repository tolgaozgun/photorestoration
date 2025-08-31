import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import HomeScreen from './screens/HomeScreen';
import RestorationPreviewScreen from './screens/RestorationPreviewScreen';
import ExportScreen from './screens/ExportScreen';
import { UserProvider } from './contexts/UserContext';
import { AnalyticsProvider } from './contexts/AnalyticsContext';
import { generateUUID } from './utils/uuid';
import { API_BASE_URL } from './config/api';

export type RootStackParamList = {
  Home: undefined;
  RestorationPreview: { imageUri: string };
  Export: { 
    originalUri: string;
    enhancedUri: string;
    enhancementId: string;
    watermark: boolean;
  };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  useEffect(() => {
    initializeUser();
  }, []);

  const initializeUser = async () => {
    try {
      let userId = await SecureStore.getItemAsync('userId');
      if (!userId) {
        userId = generateUUID();
        await SecureStore.setItemAsync('userId', userId);
      }
    } catch (error) {
      console.error('Error initializing user:', error);
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <UserProvider>
        <AnalyticsProvider>
          <View style={styles.container}>
            <NavigationContainer>
              <Stack.Navigator
                screenOptions={{
                  headerStyle: {
                    backgroundColor: '#000',
                  },
                  headerTintColor: '#fff',
                  headerTitleStyle: {
                    fontWeight: 'bold',
                  },
                }}
              >
                <Stack.Screen 
                  name="Home" 
                  component={HomeScreen}
                  options={{ title: 'Photo Restoration' }}
                />
                <Stack.Screen 
                  name="RestorationPreview" 
                  component={RestorationPreviewScreen}
                  options={{ title: 'Preview' }}
                />
                <Stack.Screen 
                  name="Export" 
                  component={ExportScreen}
                  options={{ title: 'Export' }}
                />
              </Stack.Navigator>
            </NavigationContainer>
            <StatusBar style="light" />
          </View>
        </AnalyticsProvider>
      </UserProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
