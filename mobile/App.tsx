import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, Text } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import HomeScreen from './screens/HomeScreen';
import RecentsScreen from './screens/RecentsScreen';
import SettingsScreen from './screens/SettingsScreen';
import RestorationPreviewScreen from './screens/RestorationPreviewScreen';
import ExportScreen from './screens/ExportScreen';
import { UserProvider } from './contexts/UserContext';
import { AnalyticsProvider } from './contexts/AnalyticsContext';
import { generateUUID } from './utils/uuid';

export type RootStackParamList = {
  MainTabs: undefined;
  RestorationPreview: { imageUri: string };
  Export: { 
    originalUri: string;
    enhancedUri: string;
    enhancementId: string;
    watermark: boolean;
  };
};

export type TabParamList = {
  Home: undefined;
  Recents: undefined;
  Settings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1a1a1a',
          borderTopColor: '#2a2a2a',
          borderTopWidth: 1,
          position: 'absolute',
          elevation: 0,
        },
        tabBarActiveTintColor: '#FF6B6B',
        tabBarInactiveTintColor: '#888',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginBottom: 2,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarLabel: 'Restore',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 22, color }}>
              {focused ? '✨' : '💫'}
            </Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Recents" 
        component={RecentsScreen}
        options={{
          tabBarLabel: 'Recent',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 22, color }}>
              {focused ? '🕐' : '⏰'}
            </Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22, color }}>⚙️</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

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
                    backgroundColor: '#1a1a1a',
                  },
                  headerTintColor: '#fff',
                  headerTitleStyle: {
                    fontWeight: '600',
                  },
                }}
              >
                <Stack.Screen 
                  name="MainTabs" 
                  component={TabNavigator}
                  options={{ headerShown: false }}
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
    backgroundColor: '#0a0a0a',
  },
});