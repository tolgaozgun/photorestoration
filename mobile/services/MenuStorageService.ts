import * as SecureStore from 'expo-secure-store';
import { MenuData } from '../services/MenuService';

export interface MenuCacheEntry {
  version: string;
  menuData: MenuData;
  timestamp: number;
  environment: string;
  isDevelopment: boolean;
}

export interface MenuVersionInfo {
  currentVersion: string;
  environment: string;
  isDevelopment: boolean;
  lastUpdated: number;
  hasUpdate: boolean;
  latestVersion?: string;
}

export const MENU_CACHE_KEYS = {
  CURRENT_VERSION: 'menu_current_version',
  MENU_CACHE: 'menu_cache',
  VERSION_INFO: 'menu_version_info',
  DEVELOPMENT_MODE: 'menu_development_mode',
};

class MenuStorageService {
  private async setSecureStore(key: string, value: any): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await SecureStore.setItemAsync(key, jsonValue);
    } catch (error) {
      console.error(`Error storing ${key}:`, error);
      throw error;
    }
  }

  private async getSecureStore<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const value = await SecureStore.getItemAsync(key);
      return value ? JSON.parse(value) : defaultValue;
    } catch (error) {
      console.error(`Error retrieving ${key}:`, error);
      return defaultValue;
    }
  }

  async cacheMenuData(entry: MenuCacheEntry): Promise<void> {
    try {
      const existingCache = await this.getSecureStore<MenuCacheEntry[]>(MENU_CACHE_KEYS.MENU_CACHE, []);
      
      // Remove old entries for the same environment
      const filteredCache = existingCache.filter(
        cache => cache.environment !== entry.environment || cache.version !== entry.version
      );
      
      // Add new entry
      filteredCache.push(entry);
      
      // Keep only last 10 versions
      const limitedCache = filteredCache
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10);
      
      await this.setSecureStore(MENU_CACHE_KEYS.MENU_CACHE, limitedCache);
      await this.setSecureStore(MENU_CACHE_KEYS.CURRENT_VERSION, entry.version);
      
      // Update version info
      const versionInfo: MenuVersionInfo = {
        currentVersion: entry.version,
        environment: entry.environment,
        isDevelopment: entry.isDevelopment,
        lastUpdated: entry.timestamp,
        hasUpdate: false,
      };
      
      await this.setSecureStore(MENU_CACHE_KEYS.VERSION_INFO, versionInfo);
    } catch (error) {
      console.error('Error caching menu data:', error);
      throw error;
    }
  }

  async getCachedMenuData(environment: string = 'production', version?: string): Promise<MenuCacheEntry | null> {
    try {
      const cache = await this.getSecureStore<MenuCacheEntry[]>(MENU_CACHE_KEYS.MENU_CACHE, []);
      
      if (version) {
        // Find specific version
        return cache.find(entry => 
          entry.environment === environment && entry.version === version
        ) || null;
      }
      
      // Get latest version for environment
      const environmentCache = cache
        .filter(entry => entry.environment === environment)
        .sort((a, b) => b.timestamp - a.timestamp);
      
      return environmentCache[0] || null;
    } catch (error) {
      console.error('Error retrieving cached menu data:', error);
      return null;
    }
  }

  async getCurrentVersion(): Promise<string | null> {
    try {
      return await this.getSecureStore(MENU_CACHE_KEYS.CURRENT_VERSION, null);
    } catch (error) {
      console.error('Error getting current version:', error);
      return null;
    }
  }

  async getVersionInfo(): Promise<MenuVersionInfo | null> {
    try {
      return await this.getSecureStore(MENU_CACHE_KEYS.VERSION_INFO, null);
    } catch (error) {
      console.error('Error getting version info:', error);
      return null;
    }
  }

  async updateVersionInfo(versionInfo: Partial<MenuVersionInfo>): Promise<void> {
    try {
      const currentInfo = await this.getVersionInfo() || {
        currentVersion: '',
        environment: 'production',
        isDevelopment: false,
        lastUpdated: Date.now(),
        hasUpdate: false,
      };
      
      const updatedInfo = { ...currentInfo, ...versionInfo };
      await this.setSecureStore(MENU_CACHE_KEYS.VERSION_INFO, updatedInfo);
    } catch (error) {
      console.error('Error updating version info:', error);
      throw error;
    }
  }

  async setDevelopmentMode(enabled: boolean): Promise<void> {
    try {
      await this.setSecureStore(MENU_CACHE_KEYS.DEVELOPMENT_MODE, enabled);
    } catch (error) {
      console.error('Error setting development mode:', error);
      throw error;
    }
  }

  async getDevelopmentMode(): Promise<boolean> {
    try {
      return await this.getSecureStore(MENU_CACHE_KEYS.DEVELOPMENT_MODE, false);
    } catch (error) {
      console.error('Error getting development mode:', error);
      return false;
    }
  }

  async clearCache(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(MENU_CACHE_KEYS.MENU_CACHE);
      await SecureStore.deleteItemAsync(MENU_CACHE_KEYS.CURRENT_VERSION);
      await SecureStore.deleteItemAsync(MENU_CACHE_KEYS.VERSION_INFO);
      await SecureStore.deleteItemAsync(MENU_CACHE_KEYS.DEVELOPMENT_MODE);
    } catch (error) {
      console.error('Error clearing menu cache:', error);
      throw error;
    }
  }

  async clearOldCache(keepVersions: number = 5): Promise<void> {
    try {
      const cache = await this.getSecureStore<MenuCacheEntry[]>(MENU_CACHE_KEYS.MENU_CACHE, []);
      
      // Group by environment and keep only recent versions
      const environmentCache: Record<string, MenuCacheEntry[]> = {};
      
      cache.forEach(entry => {
        if (!environmentCache[entry.environment]) {
          environmentCache[entry.environment] = [];
        }
        environmentCache[entry.environment].push(entry);
      });
      
      // Keep only recent versions for each environment
      const cleanedCache: MenuCacheEntry[] = [];
      Object.values(environmentCache).forEach(entries => {
        const sortedEntries = entries.sort((a, b) => b.timestamp - a.timestamp);
        cleanedCache.push(...sortedEntries.slice(0, keepVersions));
      });
      
      await this.setSecureStore(MENU_CACHE_KEYS.MENU_CACHE, cleanedCache);
    } catch (error) {
      console.error('Error clearing old cache:', error);
      throw error;
    }
  }

  // Compare versions to check if update is available
  compareVersions(current: string, latest: string): number {
    const currentParts = current.split('.').map(Number);
    const latestParts = latest.split('.').map(Number);
    
    for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
      const currentPart = currentParts[i] || 0;
      const latestPart = latestParts[i] || 0;
      
      if (currentPart < latestPart) return -1; // Update available
      if (currentPart > latestPart) return 1; // Current is newer
    }
    
    return 0; // Same version
  }

  // Check if cache is expired (default: 7 days)
  isCacheExpired(timestamp: number, maxAge: number = 7 * 24 * 60 * 60 * 1000): boolean {
    return Date.now() - timestamp > maxAge;
  }
}

export const menuStorageService = new MenuStorageService();
export default menuStorageService;