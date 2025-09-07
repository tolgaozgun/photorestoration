import axios from 'axios';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

export interface MenuSection {
  id: string;
  name: string;
  title: string;
  description?: string;
  icon?: string;
  layout: 'grid' | 'list' | 'horizontal';
  is_active: boolean;
  meta_data: any;
  created_at: string;
  updated_at: string;
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
  meta_data: any;
  created_at: string;
  updated_at: string;
}

export interface MenuData {
  sections: MenuSection[];
  items: MenuItem[];
  success: boolean;
}

class MenuService {
  private async getAuthHeaders() {
    // Add your authentication logic here
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Example: Add auth token if available
    // const token = await SecureStore.getItemAsync('auth_token');
    // if (token) {
    //   headers['Authorization'] = `Bearer ${token}`;
    // }
    
    return headers;
  }

  async getMenu(activeOnly: boolean = true): Promise<MenuData> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.get<MenuData>(
        `${API_BASE_URL}/api/menu?active_only=${activeOnly}`,
        { headers }
      );
      
      if (response.data.success) {
        return response.data;
      }
      
      throw new Error('Failed to fetch menu');
    } catch (error) {
      console.error('Error fetching menu:', error);
      throw error;
    }
  }

  async getSections(activeOnly: boolean = true): Promise<MenuSection[]> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.get<MenuSection[]>(
        `${API_BASE_URL}/api/menu/sections?active_only=${activeOnly}`,
        { headers }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error fetching menu sections:', error);
      throw error;
    }
  }

  async getItems(
    sectionId?: string,
    parentId?: string,
    activeOnly: boolean = true
  ): Promise<MenuItem[]> {
    try {
      const headers = await this.getAuthHeaders();
      const params = new URLSearchParams();
      
      if (sectionId) params.append('section_id', sectionId);
      if (parentId) params.append('parent_id', parentId);
      if (activeOnly) params.append('active_only', 'true');
      
      const response = await axios.get<MenuItem[]>(
        `${API_BASE_URL}/api/menu/items?${params.toString()}`,
        { headers }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error fetching menu items:', error);
      throw error;
    }
  }

  async createSection(sectionData: {
    name: string;
    title: string;
    description?: string;
    icon?: string;
    layout?: 'grid' | 'list' | 'horizontal';
    sort_order?: number;
    is_active?: boolean;
    metadata?: any;
  }): Promise<MenuSection> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.post<MenuSection>(
        `${API_BASE_URL}/api/menu/sections`,
        sectionData,
        { headers }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error creating menu section:', error);
      throw error;
    }
  }

  async updateSection(
    sectionId: string,
    updateData: Partial<{
      name: string;
      title: string;
      description?: string;
      icon?: string;
      layout: 'grid' | 'list' | 'horizontal';
      sort_order: number;
      is_active: boolean;
      meta_data: any;
    }>
  ): Promise<MenuSection> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.put<MenuSection>(
        `${API_BASE_URL}/api/menu/sections/${sectionId}`,
        updateData,
        { headers }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error updating menu section:', error);
      throw error;
    }
  }

  async deleteSection(sectionId: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      await axios.delete(
        `${API_BASE_URL}/api/menu/sections/${sectionId}`,
        { headers }
      );
    } catch (error) {
      console.error('Error deleting menu section:', error);
      throw error;
    }
  }

  async createItem(itemData: {
    title: string;
    description?: string;
    icon?: string;
    action_type: 'screen' | 'url' | 'action' | 'section';
    action_value?: string;
    parent_id?: string;
    section_id?: string;
    sort_order?: number;
    is_active?: boolean;
    is_premium?: boolean;
    requires_auth?: boolean;
    metadata?: any;
  }): Promise<MenuItem> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.post<MenuItem>(
        `${API_BASE_URL}/api/menu/items`,
        itemData,
        { headers }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error creating menu item:', error);
      throw error;
    }
  }

  async updateItem(
    itemId: string,
    updateData: Partial<{
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
      meta_data: any;
    }>
  ): Promise<MenuItem> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.put<MenuItem>(
        `${API_BASE_URL}/api/menu/items/${itemId}`,
        updateData,
        { headers }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error updating menu item:', error);
      throw error;
    }
  }

  async deleteItem(itemId: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      await axios.delete(
        `${API_BASE_URL}/api/menu/items/${itemId}`,
        { headers }
      );
    } catch (error) {
      console.error('Error deleting menu item:', error);
      throw error;
    }
  }

  async reorderSections(sectionOrders: Array<{ section_id: string; sort_order: number }>): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      await axios.post(
        `${API_BASE_URL}/api/menu/sections/reorder`,
        sectionOrders,
        { headers }
      );
    } catch (error) {
      console.error('Error reordering menu sections:', error);
      throw error;
    }
  }

  async reorderItems(itemOrders: Array<{ item_id: string; sort_order: number }>): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      await axios.post(
        `${API_BASE_URL}/api/menu/items/reorder`,
        itemOrders,
        { headers }
      );
    } catch (error) {
      console.error('Error reordering menu items:', error);
      throw error;
    }
  }
}

export const menuService = new MenuService();
export default menuService;