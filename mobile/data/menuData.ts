// Hard-coded menu data for the PhotoRestore app
export interface MenuSection {
  id: string;
  name: string;
  title: string;
  description?: string;
  icon?: string;
  layout: 'grid' | 'list' | 'horizontal';
  is_active: boolean;
  metadata: Record<string, unknown>;
}

export interface MenuItem {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  action_type: 'screen' | 'url' | 'action' | 'section';
  action_value?: string;
  parent_id?: string;
  section_id?: string;
  sort_order: number;
  is_active: boolean;
  is_premium: boolean;
  requires_auth: boolean;
  metadata: Record<string, unknown>;
}

export interface MenuData {
  sections: MenuSection[];
  items: MenuItem[];
  success: boolean;
}

// Hard-coded menu data
export const HARDCODED_MENU_DATA: MenuData = {
  sections: [
    {
      id: 'photo-enhancement',
      name: 'photo_enhancement',
      title: 'Photo Enhancement',
      description: 'AI-powered photo restoration and enhancement tools',
      icon: '📸',
      layout: 'grid',
      is_active: true,
      metadata: {
        screen: 'Menu',
        category: 'photo'
      }
    },
    {
      id: 'video-enhancement', 
      name: 'video_enhancement',
      title: 'Video Enhancement',
      description: 'Advanced video quality improvement features',
      icon: '🎬',
      layout: 'grid',
      is_active: true,
      metadata: {
        screen: 'Menu',
        category: 'video'
      }
    },
    {
      id: 'creative-tools',
      name: 'creative_tools',
      title: 'Creative Tools',
      description: 'Transform your media with AI-powered creative effects',
      icon: '🎨',
      layout: 'grid',
      is_active: true,
      metadata: {
        screen: 'Menu',
        category: 'creative'
      }
    },
    {
      id: 'account-settings',
      name: 'account_settings',
      title: 'Account & Settings',
      description: 'Manage your account and app preferences',
      icon: '⚙️',
      layout: 'list',
      is_active: true,
      metadata: {
        screen: 'Menu',
        category: 'settings'
      }
    }
  ],
  items: [
    // Photo Enhancement Items
    {
      id: 'enhance-photo',
      title: 'Enhance Photo',
      description: 'Improve photo quality with AI',
      icon: '✨',
      action_type: 'screen',
      action_value: 'ModeSelection',
      section_id: 'photo-enhancement',
      sort_order: 1,
      is_active: true,
      is_premium: false,
      requires_auth: false,
      metadata: {
        processing_type: 'enhancement',
        supported_formats: ['jpg', 'jpeg', 'png', 'webp'],
        enhancement_type: 'general'
      }
    },
    {
      id: 'colorize-photo',
      title: 'Colorize Photo',
      description: 'Add color to black & white photos',
      icon: '🎨',
      action_type: 'screen',
      action_value: 'ModeSelection',
      section_id: 'photo-enhancement',
      sort_order: 2,
      is_active: true,
      is_premium: true,
      requires_auth: false,
      metadata: {
        processing_type: 'colorization',
        supported_formats: ['jpg', 'jpeg', 'png'],
        enhancement_type: 'colorization'
      }
    },
    {
      id: 'remove-scratches',
      title: 'Remove Scratches',
      description: 'Fix damaged photos and remove imperfections',
      icon: '🔧',
      action_type: 'screen',
      action_value: 'ModeSelection',
      section_id: 'photo-enhancement',
      sort_order: 3,
      is_active: true,
      is_premium: true,
      requires_auth: false,
      metadata: {
        processing_type: 'restoration',
        supported_formats: ['jpg', 'jpeg', 'png'],
        enhancement_type: 'scratch_removal'
      }
    },
    {
      id: 'deblur-photo',
      title: 'Deblur Photo',
      description: 'Sharpen blurry images with AI',
      icon: '🔍',
      action_type: 'screen',
      action_value: 'ModeSelection',
      section_id: 'photo-enhancement',
      sort_order: 4,
      is_active: true,
      is_premium: false,
      requires_auth: false,
      metadata: {
        processing_type: 'enhancement',
        supported_formats: ['jpg', 'jpeg', 'png', 'webp'],
        enhancement_type: 'deblurring'
      }
    },

    // Video Enhancement Items
    {
      id: 'enhance-video',
      title: 'Enhance Video',
      description: 'Improve video quality and resolution',
      icon: '📹',
      action_type: 'screen',
      action_value: 'ModeSelection',
      section_id: 'video-enhancement',
      sort_order: 1,
      is_active: true,
      is_premium: true,
      requires_auth: false,
      metadata: {
        processing_type: 'enhancement',
        supported_formats: ['mp4', 'mov', 'avi'],
        enhancement_type: 'video_quality'
      }
    },
    {
      id: 'video-stabilization',
      title: 'Stabilize Video',
      description: 'Reduce camera shake and smooth motion',
      icon: '🎯',
      action_type: 'screen',
      action_value: 'ModeSelection',
      section_id: 'video-enhancement',
      sort_order: 2,
      is_active: true,
      is_premium: true,
      requires_auth: false,
      metadata: {
        processing_type: 'stabilization',
        supported_formats: ['mp4', 'mov'],
        enhancement_type: 'stabilization'
      }
    },

    // Creative Tools Items
    {
      id: 'ai-art-generator',
      title: 'AI Art Generator',
      description: 'Create stunning artwork from text prompts',
      icon: '🎭',
      action_type: 'screen',
      action_value: 'ModeSelection',
      section_id: 'creative-tools',
      sort_order: 1,
      is_active: true,
      is_premium: true,
      requires_auth: false,
      metadata: {
        processing_type: 'generation',
        supported_formats: ['jpg', 'jpeg', 'png'],
        generation_type: 'art'
      }
    },
    {
      id: 'style-transfer',
      title: 'Style Transfer',
      description: 'Apply artistic styles to your photos',
      icon: '🖼️',
      action_type: 'screen',
      action_value: 'ModeSelection',
      section_id: 'creative-tools',
      sort_order: 2,
      is_active: true,
      is_premium: true,
      requires_auth: false,
      metadata: {
        processing_type: 'style_transfer',
        supported_formats: ['jpg', 'jpeg', 'png'],
        generation_type: 'style_transfer'
      }
    },
    {
      id: 'background-remover',
      title: 'Background Remover',
      description: 'Remove or replace image backgrounds',
      icon: '✂️',
      action_type: 'screen',
      action_value: 'ModeSelection',
      section_id: 'creative-tools',
      sort_order: 3,
      is_active: true,
      is_premium: true,
      requires_auth: false,
      metadata: {
        processing_type: 'background_removal',
        supported_formats: ['jpg', 'jpeg', 'png'],
        enhancement_type: 'background_removal'
      }
    },

    // Account & Settings Items
    {
      id: 'subscription',
      title: 'Subscription',
      description: 'Manage your premium subscription',
      icon: '💳',
      action_type: 'screen',
      action_value: 'Purchase',
      section_id: 'account-settings',
      sort_order: 1,
      is_active: true,
      is_premium: false,
      requires_auth: true,
      metadata: {
        requires_auth: true,
        auth_level: 'user'
      }
    },
    {
      id: 'settings',
      title: 'Settings',
      description: 'App preferences and configuration',
      icon: '⚙️',
      action_type: 'action',
      action_value: 'settings',
      section_id: 'account-settings',
      sort_order: 2,
      is_active: true,
      is_premium: false,
      requires_auth: false,
      metadata: {
        action_type: 'navigation',
        target: 'settings'
      }
    },
    {
      id: 'profile',
      title: 'Profile',
      description: 'View and edit your profile',
      icon: '👤',
      action_type: 'screen',
      action_value: 'Profile',
      section_id: 'account-settings',
      sort_order: 3,
      is_active: true,
      is_premium: false,
      requires_auth: true,
      metadata: {
        requires_auth: true,
        auth_level: 'user'
      }
    },
    {
      id: 'help-support',
      title: 'Help & Support',
      description: 'Get help and contact support',
      icon: '❓',
      action_type: 'url',
      action_value: 'https://support.photorestore.com',
      section_id: 'account-settings',
      sort_order: 4,
      is_active: true,
      is_premium: false,
      requires_auth: false,
      metadata: {
        external_link: true,
        link_type: 'support'
      }
    },
    {
      id: 'about',
      title: 'About',
      description: 'Learn about PhotoRestore',
      icon: 'ℹ️',
      action_type: 'action',
      action_value: 'about',
      section_id: 'account-settings',
      sort_order: 5,
      is_active: true,
      is_premium: false,
      requires_auth: false,
      metadata: {
        action_type: 'info',
        content_type: 'about'
      }
    }
  ],
  success: true
};

// Utility function to get menu data
export const getMenuData = (): MenuData => {
  return HARDCODED_MENU_DATA;
};

// Utility function to get items for a specific section
export const getItemsForSection = (sectionId: string): MenuItem[] => {
  return HARDCODED_MENU_DATA.items
    .filter(item => item.section_id === sectionId && item.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);
};

// Utility function to get supported formats for a menu item
export const getSupportedFormatsForItem = (item: MenuItem): string[] => {
  return (item.metadata?.supported_formats as string[]) || [];
};

// Utility function to validate file format for a menu item
export const isFileSupportedForItem = (fileName: string, item: MenuItem): boolean => {
  const supportedFormats = getSupportedFormatsForItem(item);
  const fileExtension = fileName.split('.').pop()?.toLowerCase();
  return supportedFormats.includes(fileExtension || '');
};