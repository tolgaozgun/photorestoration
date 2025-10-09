import { useEffect, useCallback } from 'react';
import { BackHandler } from 'react-native';
import { useNavigation, useRoute, useIsFocused } from '@react-navigation/native';

/**
 * A hook for debugging navigation and back button issues
 * Provides comprehensive logging for navigation state changes and back button events
 */
export const useNavigationDebugger = (screenName: string) => {
  const navigation = useNavigation();
  const route = useRoute();
  const isFocused = useIsFocused();

  // Log navigation state with detailed information
  const logNavigationState = useCallback(() => {
    try {
      const state = navigation.getState();
      const parentState = navigation.getParent()?.getState();

      console.log(`🧭 [${screenName}] Navigation State:`, {
        isFocused,
        currentRoute: route.name,
        stackSize: state.routes.length,
        index: state.index,
        routeNames: state.routes.map(r => r.name),
        routeKeys: state.routes.map(r => r.key),
        history: state.history,
        type: state.type,
        stale: state.stale,
        canGoBack: state.index > 0,
        parent: parentState ? {
          stackSize: parentState.routes.length,
          index: parentState.index,
          routeNames: parentState.routes.map(r => r.name),
          canGoBack: parentState.index > 0
        } : 'No parent'
      });
    } catch (error) {
      console.error(`❌ [${screenName}] Error getting navigation state:`, error);
    }
  }, [navigation, route.name, isFocused, screenName]);

  // Set up back button debugging
  useEffect(() => {
    console.log(`🚀 [${screenName}] Setting up navigation debugging`);

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      console.log(`🔙 [${screenName}] Hardware back button pressed`, {
        timestamp: new Date().toISOString(),
        isFocused
      });
      logNavigationState();
      return false; // Don't prevent default behavior
    });

    // Navigation event listeners
    const unsubscribeBeforeRemove = navigation.addListener('beforeRemove', (e) => {
      console.log(`🚪 [${screenName}] Navigation beforeRemove event:`, {
        timestamp: new Date().toISOString(),
        action: {
          type: e.data.action.type,
          payload: e.data.action.payload
        },
        navigationState: navigation.getState()
      });
    });

    const unsubscribeStateChange = navigation.addListener('state', (state) => {
      console.log(`📊 [${screenName}] Navigation state changed:`, {
        timestamp: new Date().toISOString(),
        state: state.data
      });
    });

    // Log initial state
    logNavigationState();

    return () => {
      console.log(`🧹 [${screenName}] Cleaning up navigation debugging`);
      backHandler.remove();
      unsubscribeBeforeRemove();
      unsubscribeStateChange();
    };
  }, [navigation, logNavigationState, screenName]);

  // Focus/unfocus logging
  useEffect(() => {
    console.log(`📱 [${screenName}] Focus state changed:`, { isFocused });
  }, [isFocused, screenName]);

  return {
    logNavigationState,
    isFocused,
    navigationState: navigation.getState(),
    routeName: route.name
  };
};