import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { menuService, MenuData } from '../services/MenuService';
import { menuStorageService } from '../services/MenuStorageService';

interface MenuVersionState {
  currentVersion: string | null;
  environment: string;
  isDevelopment: boolean;
  hasUpdate: boolean;
  latestVersion?: string;
  isLoading: boolean;
  error: string | null;
  menuData: MenuData | null;
  fromCache: boolean;
}

type MenuVersionAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_MENU_DATA'; payload: { menuData: MenuData; version: string; fromCache: boolean } }
  | { type: 'SET_VERSION_INFO'; payload: Partial<MenuVersionState> }
  | { type: 'SET_DEVELOPMENT_MODE'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_CACHE' }
  | { type: 'CHECK_FOR_UPDATES'; payload: { hasUpdate: boolean; latestVersion?: string } };

const initialState: MenuVersionState = {
  currentVersion: null,
  environment: 'production',
  isDevelopment: false,
  hasUpdate: false,
  isLoading: false,
  error: null,
  menuData: null,
  fromCache: false,
};

function menuVersionReducer(state: MenuVersionState, action: MenuVersionAction): MenuVersionState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_MENU_DATA':
      return {
        ...state,
        menuData: action.payload.menuData,
        currentVersion: action.payload.version,
        fromCache: action.payload.fromCache,
        isLoading: false,
        error: null,
      };
    
    case 'SET_VERSION_INFO':
      return { ...state, ...action.payload };
    
    case 'SET_DEVELOPMENT_MODE':
      return { ...state, isDevelopment: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'CLEAR_CACHE':
      return { ...state, menuData: null, currentVersion: null, fromCache: false };
    
    case 'CHECK_FOR_UPDATES':
      return {
        ...state,
        hasUpdate: action.payload.hasUpdate,
        latestVersion: action.payload.latestVersion,
      };
    
    default:
      return state;
  }
}

interface MenuVersionContextType {
  state: MenuVersionState;
  loadMenuConfig: (forceRefresh?: boolean) => Promise<void>;
  checkForUpdates: () => Promise<void>;
  setDevelopmentMode: (enabled: boolean) => Promise<void>;
  updateMenuVersion: (increment?: 'major' | 'minor' | 'patch', changelog?: string) => Promise<boolean>;
  clearCache: () => Promise<void>;
  refreshMenu: () => Promise<void>;
}

const MenuVersionContext = createContext<MenuVersionContextType | undefined>(undefined);

interface MenuVersionProviderProps {
  children: ReactNode;
  environment?: string;
  autoCheckUpdates?: boolean;
  updateCheckInterval?: number; // in milliseconds
}

export function MenuVersionProvider({ 
  children, 
  environment = 'production',
  autoCheckUpdates = true,
  updateCheckInterval = 5 * 60 * 1000, // 5 minutes
}: MenuVersionProviderProps) {
  const [state, dispatch] = useReducer(menuVersionReducer, {
    ...initialState,
    environment,
  });

  // Load initial version info
  useEffect(() => {
    const loadInitialInfo = async () => {
      try {
        const versionInfo = await menuService.getCurrentVersionInfo();
        dispatch({ type: 'SET_VERSION_INFO', payload: versionInfo });
      } catch (error) {
        console.error('Error loading initial version info:', error);
      }
    };

    loadInitialInfo();
  }, []);

  // Auto-check for updates
  useEffect(() => {
    if (!autoCheckUpdates || !state.currentVersion) return;

    const interval = setInterval(async () => {
      try {
        const updateInfo = await menuService.checkForUpdates(state.currentVersion!, state.environment);
        dispatch({ type: 'CHECK_FOR_UPDATES', payload: updateInfo });
      } catch (error) {
        console.error('Error checking for updates:', error);
      }
    }, updateCheckInterval);

    return () => clearInterval(interval);
  }, [autoCheckUpdates, state.currentVersion, state.environment, updateCheckInterval]);

  const loadMenuConfig = async (forceRefresh = false) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const result = await menuService.getMenuConfig(
        state.environment,
        state.isDevelopment,
        forceRefresh
      );

      dispatch({
        type: 'SET_MENU_DATA',
        payload: {
          menuData: result.menuData,
          version: result.version,
          fromCache: result.fromCache,
        },
      });

      // Check for updates if we got fresh data
      if (!result.fromCache) {
        const updateInfo = await menuService.checkForUpdates(result.version, state.environment);
        dispatch({ type: 'CHECK_FOR_UPDATES', payload: updateInfo });
      }
    } catch (error) {
      console.error('Error loading menu config:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to load menu config' });
    }
  };

  const checkForUpdates = async () => {
    if (!state.currentVersion) return;

    try {
      const updateInfo = await menuService.checkForUpdates(state.currentVersion, state.environment);
      dispatch({ type: 'CHECK_FOR_UPDATES', payload: updateInfo });
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
  };

  const setDevelopmentMode = async (enabled: boolean) => {
    try {
      await menuService.setDevelopmentMode(enabled);
      dispatch({ type: 'SET_DEVELOPMENT_MODE', payload: enabled });
      
      // Reload menu config when development mode changes
      await loadMenuConfig(true);
    } catch (error) {
      console.error('Error setting development mode:', error);
    }
  };

  const updateMenuVersion = async (increment: 'major' | 'minor' | 'patch' = 'patch', changelog?: string) => {
    try {
      const result = await menuService.updateMenuVersion(state.environment, increment, changelog);
      
      if (result.success) {
        // Reload menu config to get the new version
        await loadMenuConfig(true);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error updating menu version:', error);
      return false;
    }
  };

  const clearCache = async () => {
    try {
      await menuStorageService.clearCache();
      dispatch({ type: 'CLEAR_CACHE' });
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  };

  const refreshMenu = async () => {
    await loadMenuConfig(true);
  };

  const value: MenuVersionContextType = {
    state,
    loadMenuConfig,
    checkForUpdates,
    setDevelopmentMode,
    updateMenuVersion,
    clearCache,
    refreshMenu,
  };

  return (
    <MenuVersionContext.Provider value={value}>
      {children}
    </MenuVersionContext.Provider>
  );
}

export function useMenuVersion() {
  const context = useContext(MenuVersionContext);
  if (context === undefined) {
    throw new Error('useMenuVersion must be used within a MenuVersionProvider');
  }
  return context;
}

export default MenuVersionProvider;