import type { MenuItem, MenuSection } from "./schemas"

const API_BASE_URL = import.meta.env.VITE_BACKEND_API || "http://localhost:8000/api"

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // Menu Sections
  async getSections(activeOnly: boolean = false): Promise<MenuSection[]> {
    const params = new URLSearchParams()
    if (activeOnly) params.append("active_only", "true")
    
    return this.request<MenuSection[]>(`/menu/sections?${params}`)
  }

  async getSection(id: string): Promise<MenuSection> {
    return this.request<MenuSection>(`/menu/sections/${id}`)
  }

  async createSection(section: Omit<MenuSection, "id" | "created_at" | "updated_at">): Promise<MenuSection> {
    return this.request<MenuSection>("/menu/sections", {
      method: "POST",
      body: JSON.stringify(section),
    })
  }

  async updateSection(id: string, section: Partial<MenuSection>): Promise<MenuSection> {
    return this.request<MenuSection>(`/menu/sections/${id}`, {
      method: "PUT",
      body: JSON.stringify(section),
    })
  }

  async deleteSection(id: string): Promise<void> {
    return this.request<void>(`/menu/sections/${id}`, {
      method: "DELETE",
    })
  }

  async reorderSections(sectionIds: string[]): Promise<void> {
    return this.request<void>("/menu/sections/reorder", {
      method: "POST",
      body: JSON.stringify({ section_ids: sectionIds }),
    })
  }

  // Menu Items
  async getItems(sectionId?: string, parentId?: string, activeOnly: boolean = false): Promise<MenuItem[]> {
    const params = new URLSearchParams()
    if (sectionId) params.append("section_id", sectionId)
    if (parentId) params.append("parent_id", parentId)
    if (activeOnly) params.append("active_only", "true")
    
    return this.request<MenuItem[]>(`/menu/items?${params}`)
  }

  async getItem(id: string): Promise<MenuItem> {
    return this.request<MenuItem>(`/menu/items/${id}`)
  }

  async createItem(item: Omit<MenuItem, "id" | "created_at" | "updated_at">): Promise<MenuItem> {
    return this.request<MenuItem>("/menu/items", {
      method: "POST",
      body: JSON.stringify(item),
    })
  }

  async updateItem(id: string, item: Partial<MenuItem>): Promise<MenuItem> {
    return this.request<MenuItem>(`/menu/items/${id}`, {
      method: "PUT",
      body: JSON.stringify(item),
    })
  }

  async deleteItem(id: string): Promise<void> {
    return this.request<void>(`/menu/items/${id}`, {
      method: "DELETE",
    })
  }

  async reorderItems(itemIds: string[]): Promise<void> {
    return this.request<void>("/menu/items/reorder", {
      method: "POST",
      body: JSON.stringify({ item_ids: itemIds }),
    })
  }

  // Complete Menu
  async getCompleteMenu(): Promise<{ sections: MenuSection[]; items: MenuItem[] }> {
    return this.request<{ sections: MenuSection[]; items: MenuItem[] }>("/menu")
  }

  // File Upload
  async uploadIcon(file: File): Promise<{ url: string; key: string }> {
    const formData = new FormData()
    formData.append("file", file)
    
    const response = await fetch(`${this.baseUrl}/upload/icon`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Upload Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // Analytics
  async getAnalytics(startDate?: string, endDate?: string): Promise<any> {
    const params = new URLSearchParams()
    if (startDate) params.append("start_date", startDate)
    if (endDate) params.append("end_date", endDate)
    
    return this.request<any>(`/analytics?${params}`)
  }

  async getAnalyticsEvents(params?: {
    page?: number
    limit?: number
    event_type?: string
    user_id?: string
    start_date?: string
    end_date?: string
  }): Promise<any> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append("page", params.page.toString())
    if (params?.limit) queryParams.append("limit", params.limit.toString())
    if (params?.event_type) queryParams.append("event_type", params.event_type)
    if (params?.user_id) queryParams.append("user_id", params.user_id)
    if (params?.start_date) queryParams.append("start_date", params.start_date)
    if (params?.end_date) queryParams.append("end_date", params.end_date)
    
    return this.request<any>(`/analytics/events?${queryParams}`)
  }

  async getUserAnalytics(userId: string, days?: number): Promise<any> {
    const queryParams = new URLSearchParams()
    if (days) queryParams.append("days", days.toString())
    
    return this.request<any>(`/analytics/users/${userId}?${queryParams}`)
  }

  async getFeatureUsage(startDate?: string, endDate?: string): Promise<any> {
    const params = new URLSearchParams()
    if (startDate) params.append("start_date", startDate)
    if (endDate) params.append("end_date", endDate)
    
    return this.request<any>(`/analytics/features?${params}`)
  }

  async exportAnalytics(format: 'json' | 'csv' = 'json', startDate?: string, endDate?: string): Promise<any> {
    const params = new URLSearchParams()
    params.append("format", format)
    if (startDate) params.append("start_date", startDate)
    if (endDate) params.append("end_date", endDate)
    
    return this.request<any>(`/analytics/export?${params}`)
  }

  // Menu Configuration Management
  async getMenuConfig(environment: string = 'production', developmentMode: boolean = false): Promise<any> {
    const params = new URLSearchParams()
    params.append("environment", environment)
    if (developmentMode) params.append("development_mode", "true")
    
    return this.request<any>(`/menu/config?${params}`)
  }

  async createMenuVersion(version: string, environment: string, changelog?: string, isDevelopment?: boolean): Promise<any> {
    return this.request<any>('/menu/versions', {
      method: 'POST',
      body: JSON.stringify({
        version,
        environment,
        changelog,
        is_development: isDevelopment
      })
    })
  }

  async getMenuVersions(environment?: string): Promise<any> {
    const params = new URLSearchParams()
    if (environment) params.append("environment", environment)
    
    return this.request<any>(`/menu/versions?${params}`)
  }

  async deployMenuVersion(versionId: string, environment: string): Promise<any> {
    return this.request<any>('/menu/deploy', {
      method: 'POST',
      body: JSON.stringify({
        version_id: versionId,
        environment
      })
    })
  }

  async getMenuDeployments(environment?: string): Promise<any> {
    const params = new URLSearchParams()
    if (environment) params.append("environment", environment)
    
    return this.request<any>(`/menu/deployments?${params}`)
  }

  async setDevelopmentVersion(versionId: string): Promise<any> {
    return this.request<any>('/menu/development/set', {
      method: 'POST',
      body: JSON.stringify({
        version_id: versionId
      })
    })
  }

  async autoCreateMenuVersion(environment: string = 'production', versionIncrement: string = 'patch', changelog?: string): Promise<any> {
    return this.request<any>('/menu/versions/auto-create', {
      method: 'POST',
      body: JSON.stringify({
        environment,
        version_increment: versionIncrement,
        changelog
      })
    })
  }

  async checkMenuVersion(currentVersion: string, environment: string = 'production'): Promise<any> {
    const params = new URLSearchParams()
    params.append("current_version", currentVersion)
    params.append("environment", environment)
    
    return this.request<any>(`/menu/config/check-version?${params}`)
  }

  // Health Check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>("/health")
  }
}

export const api = new ApiClient()
export default ApiClient