import { MenuData, MenuItem, MenuSection, getMenuData } from '../data/menuData';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, MainTabParamList } from '../App';
// import { useMenuVersion } from '../contexts/MenuVersionContext';

export interface NavigationItem {
  id: string;
  title: string;
  description?: string;
  icon: string;
  screen?: keyof RootStackParamList | keyof MainTabParamList;
  action_type: 'screen' | 'url' | 'action' | 'section';
  action_value: string;
  params?: Record<string, unknown>;
  is_premium: boolean;
  requires_auth: boolean;
  meta_data: Record<string, unknown>;
}

export class NavigationService {
  private static instance: NavigationService;
  private menuData: MenuData | null = null;
  private isLoading = false;

  static getInstance(): NavigationService {
    if (!NavigationService.instance) {
      NavigationService.instance = new NavigationService();
    }
    return NavigationService.instance;
  }

  async loadMenuData(forceRefresh = false): Promise<void> {
    if (this.menuData && !forceRefresh) return;
    
    this.isLoading = true;
    try {
      // Use static menu data instead of API call
      this.menuData = getMenuData();
    } catch (error) {
      console.error('Failed to load menu data:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  setMenuData(menuData: MenuData): void {
    this.menuData = menuData;
  }

  getMenuData(): MenuData | null {
    return this.menuData;
  }

  getTabNavigationItems(): NavigationItem[] {
    if (!this.menuData) return this.getDefaultTabItems();

    const homeSection = this.menuData.sections.find((s: MenuSection) => 
      s.meta_data?.screen === 'home'
    );
    
    if (!homeSection) return this.getDefaultTabItems();

    return this.menuData.items
      .filter((item: MenuItem) => 
        item.section_id === homeSection.id && 
        item.meta_data?.navigation_type === 'tab'
      )
      .map((item: MenuItem) => this.mapToNavigationItem(item));
  }

  getScreenItems(screenName: string): NavigationItem[] {
    if (!this.menuData) return [];

    const screenSection = this.menuData.sections.find((s: MenuSection) => 
      s.meta_data?.screen === screenName
    );
    
    if (!screenSection) return [];

    return this.menuData.items
      .filter((item: MenuItem) => item.section_id === screenSection.id)
      .map((item: MenuItem) => this.mapToNavigationItem(item));
  }

  getAllNavigationItems(): NavigationItem[] {
    if (!this.menuData) return [];

    return this.menuData.items.map((item: MenuItem) => this.mapToNavigationItem(item));
  }

  getNavigationItemById(id: string): NavigationItem | null {
    if (!this.menuData) return null;

    const item = this.menuData.items.find((item: MenuItem) => item.id === id);
    return item ? this.mapToNavigationItem(item) : null;
  }

  getNavigationItemByActionValue(actionValue: string): NavigationItem | null {
    if (!this.menuData) return null;

    const item = this.menuData.items.find((item: MenuItem) => item.action_value === actionValue);
    return item ? this.mapToNavigationItem(item) : null;
  }

  async navigateToItem(
    item: NavigationItem | string, 
    navigation: StackNavigationProp<RootStackParamList>,
    params?: Record<string, unknown>
  ): Promise<void> {
    const navItem = typeof item === 'string' 
      ? this.getNavigationItemById(item) || this.getNavigationItemByActionValue(item)
      : item;

    if (!navItem) {
      console.error('Navigation item not found:', item);
      return;
    }

    // Check authentication
    if (navItem.requires_auth) {
      // TODO: Implement authentication check
      // const isAuthenticated = await authService.isAuthenticated();
      // if (!isAuthenticated) {
      //   navigation.navigate('Auth', { 
      //     redirectTo: navItem.screen,
      //     params: { ...params, ...navItem.params }
      //   });
      //   return;
      // }
    }

    // Check premium
    if (navItem.is_premium) {
      // TODO: Implement premium check
      // const isPremium = await userService.isPremium();
      // if (!isPremium) {
      //   navigation.navigate('Purchase', { 
      //     feature: navItem.id,
      //     credits: navItem.meta_data?.credits
      //   });
      //   return;
      // }
    }

    // Navigate based on action type
    switch (navItem.action_type) {
      case 'screen':
        if (navItem.screen) {
          navigation.navigate(navItem.screen as keyof RootStackParamList, {
            ...params,
            ...navItem.params,
            menuItem: navItem
          });
        }
        break;
      
      case 'url':
        // TODO: Implement URL navigation
        // Linking.openURL(navItem.action_value);
        break;
      
      case 'action':
        // TODO: Implement custom actions
        // this.handleCustomAction(navItem.action_value, params);
        break;
      
      case 'section':
        // Navigate to section screen
        navigation.navigate('Section', {
          sectionId: navItem.action_value,
          title: navItem.title,
          ...params
        });
        break;
      
      default:
        console.warn('Unknown action type:', navItem.action_type);
    }
  }

  private mapToNavigationItem(item: MenuItem): NavigationItem {
    return {
      id: item.id,
      title: item.title,
      description: item.description,
      icon: item.icon || '📱',
      screen: this.mapActionValueToScreen(item.action_value),
      action_type: item.action_type,
      action_value: item.action_value,
      is_premium: item.is_premium,
      requires_auth: item.requires_auth,
      meta_data: item.meta_data || {},
      params: {
        supported_formats: item.meta_data?.supported_formats,
        processing_type: item.meta_data?.processing_type,
        enhancement_type: item.meta_data?.enhancement_type,
        generation_type: item.meta_data?.generation_type,
        credits: item.meta_data?.credits,
        processing_time: item.meta_data?.processing_time
      }
    };
  }

  private mapActionValueToScreen(actionValue: string): keyof RootStackParamList | keyof MainTabParamList | undefined {
    const screenMap: Record<string, keyof RootStackParamList | keyof MainTabParamList> = {
      'RecentProjects': 'Home',
      'AIGeneration': 'AIGeneration',
      'VideoGeneration': 'VideoGeneration',
      'PhotoEnhancement': 'ModeSelection',
      'ColorizePhoto': 'ModeSelection',
      'RemoveScratches': 'ModeSelection',
      'Enlighten': 'ModeSelection',
      'Recreate': 'ModeSelection',
      'Combine': 'ModeSelection',
      'FaceEnhancement': 'ModeSelection',
      'AIUpscale': 'ModeSelection',
      'FutureBaby': 'AIGeneration',
      'RemoveElements': 'AIGeneration',
      'OutfitTryOn': 'AIGeneration',
      'DigitalTwin': 'AIGeneration',
      'PixelTrend': 'AIGeneration',
      'ChibiStickers': 'AIGeneration',
      'AnimateOldPhotos': 'VideoGeneration',
      'FaceAnimation': 'VideoGeneration',
      'PhotoToVideo': 'VideoGeneration',
      'VideoEnhancement': 'VideoGeneration',
      'VideoColorize': 'VideoGeneration',
      'VideoUpscale': 'VideoGeneration',
      'GIFCreator': 'VideoGeneration',
      'VideoStabilization': 'VideoGeneration',
      'ImageToImage': 'AIGeneration',
      'BackgroundGenerator': 'AIGeneration',
      'LogoGenerator': 'AIGeneration',
    };

    return screenMap[actionValue];
  }

  private getDefaultTabItems(): NavigationItem[] {
    return [
      {
        id: 'home-tab',
        title: 'Home',
        icon: '🏠',
        screen: 'Home',
        action_type: 'screen',
        action_value: 'Home',
        is_premium: false,
        requires_auth: false,
        meta_data: { navigation_type: 'tab' }
      },
      {
        id: 'enhance-tab',
        title: 'Enhance',
        icon: '✨',
        screen: 'Enhance',
        action_type: 'screen',
        action_value: 'Enhance',
        is_premium: false,
        requires_auth: false,
        meta_data: { navigation_type: 'tab' }
      },
      {
        id: 'create-tab',
        title: 'Create',
        icon: '🤖',
        screen: 'Create',
        action_type: 'screen',
        action_value: 'Create',
        is_premium: false,
        requires_auth: false,
        meta_data: { navigation_type: 'tab' }
      },
      {
        id: 'videos-tab',
        title: 'Videos',
        icon: '🎬',
        screen: 'Videos',
        action_type: 'screen',
        action_value: 'Videos',
        is_premium: false,
        requires_auth: false,
        meta_data: { navigation_type: 'tab' }
      },
      {
        id: 'profile-tab',
        title: 'Profile',
        icon: '👤',
        screen: 'Profile',
        action_type: 'screen',
        action_value: 'Profile',
        is_premium: false,
        requires_auth: false,
        meta_data: { navigation_type: 'tab' }
      }
    ];
  }

  // Utility methods for feature discovery
  getFeaturesByCategory(category: string): NavigationItem[] {
    if (!this.menuData) return [];

    return this.menuData.items
      .filter((item: MenuItem) => item.meta_data?.content_type === category)
      .map((item: MenuItem) => this.mapToNavigationItem(item));
  }

  getFeaturesByFormat(format: string): NavigationItem[] {
    if (!this.menuData) return [];

    return this.menuData.items
      .filter((item: MenuItem) => 
        item.meta_data?.supported_formats?.includes(format)
      )
      .map((item: MenuItem) => this.mapToNavigationItem(item));
  }

  getPremiumFeatures(): NavigationItem[] {
    if (!this.menuData) return [];

    return this.menuData.items
      .filter((item: MenuItem) => item.is_premium)
      .map((item: MenuItem) => this.mapToNavigationItem(item));
  }

  getRecentFeatures(): NavigationItem[] {
    if (!this.menuData) return [];

    return this.menuData.items
      .filter((item: MenuItem) => item.meta_data?.content_type === 'recent')
      .map((item: MenuItem) => this.mapToNavigationItem(item));
  }
}