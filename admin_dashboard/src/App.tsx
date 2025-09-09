import { useState, useEffect } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MenuItemManager } from "./components/menu-item-manager"
import { MenuItemForm } from "./components/menu-item-form"
import { AnalyticsDashboard } from "./components/analytics-dashboard"
import { MenuDeploymentManager } from "./components/menu-deployment-manager"
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card"
import { Button } from "./components/ui/button"
import { Input } from "./components/ui/input"
import { 
  Menu, 
  BarChart3, 
  Settings, 
  Plus,
  LayoutDashboard,
  Image as ImageIcon,
  Rocket
} from "lucide-react"
import type { MenuItem, MenuSection } from "./lib/schemas"
import { api } from "./lib/api"

const queryClient = new QueryClient()

type Tab = "dashboard" | "menu" | "deployment" | "analytics" | "settings"

function App() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard")
  const [sections, setSections] = useState<MenuSection[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [showItemForm, setShowItemForm] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [sectionsData, itemsData] = await Promise.all([
        api.getSections(),
        api.getItems()
      ])
      setSections(sectionsData)
      setItems(itemsData)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleItemsReorder = async (reorderedItems: MenuItem[]) => {
    try {
      await api.reorderItems(reorderedItems.map(item => item.id))
      setItems(reorderedItems)
    } catch (error) {
      console.error("Error reordering items:", error)
    }
  }

  const handleItemSave = (item: MenuItem) => {
    if (editingItem) {
      setItems(prev => prev.map(i => i.id === item.id ? item : i))
    } else {
      setItems(prev => [...prev, item])
    }
    setShowItemForm(false)
    setEditingItem(null)
  }

  const handleItemDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this item?")) {
      try {
        await api.deleteItem(id)
        setItems(prev => prev.filter(item => item.id !== id))
      } catch (error) {
        console.error("Error deleting item:", error)
      }
    }
  }

  const handleItemEdit = (item: MenuItem) => {
    setEditingItem(item)
    setShowItemForm(true)
  }

  const handleItemCreate = () => {
    setEditingItem(null)
    setShowItemForm(true)
  }

  const getItemsBySection = (sectionId: string) => {
    return items
      .filter(item => item.section_id === sectionId)
      .sort((a, b) => a.sort_order - b.sort_order)
  }

  if (showItemForm) {
    return (
      <div className="min-h-screen bg-background p-4">
        <MenuItemForm
          item={editingItem || undefined}
          sections={sections}
          onSave={handleItemSave}
          onCancel={() => {
            setShowItemForm(false)
            setEditingItem(null)
          }}
        />
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <ImageIcon className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold">Photo Restoration Admin</h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-muted-foreground">
                  {items.length} items • {sections.length} sections
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="flex">
          {/* Sidebar */}
          <nav className="w-64 border-r bg-card min-h-screen p-4">
            <div className="space-y-2">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "dashboard"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => setActiveTab("menu")}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "menu"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                <Menu className="h-4 w-4" />
                <span>Menu Management</span>
              </button>

              <button
                onClick={() => setActiveTab("deployment")}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "deployment"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                <Rocket className="h-4 w-4" />
                <span>Menu Deployment</span>
              </button>

              <button
                onClick={() => setActiveTab("analytics")}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "analytics"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                <span>Analytics</span>
              </button>

              <button
                onClick={() => setActiveTab("settings")}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "settings"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </button>
            </div>
          </nav>

          {/* Main Content */}
          <main className="flex-1 p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                {activeTab === "dashboard" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                      <p className="text-muted-foreground">
                        Welcome to your photo restoration admin dashboard
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Total Menu Items</CardTitle>
                          <Menu className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{items.length}</div>
                          <p className="text-xs text-muted-foreground">
                            {items.filter(item => item.is_active).length} active
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Menu Sections</CardTitle>
                          <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{sections.length}</div>
                          <p className="text-xs text-muted-foreground">
                            {sections.filter(section => section.is_active).length} active
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Premium Items</CardTitle>
                          <Settings className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{items.filter(item => item.is_premium).length}</div>
                          <p className="text-xs text-muted-foreground">
                            {Math.round((items.filter(item => item.is_premium).length / items.length) * 100)}% of total
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Authentication Required</CardTitle>
                          <Settings className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{items.filter(item => item.requires_auth).length}</div>
                          <p className="text-xs text-muted-foreground">
                            {Math.round((items.filter(item => item.requires_auth).length / items.length) * 100)}% of total
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Recent Menu Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {items.slice(0, 5).map(item => (
                              <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                                <div>
                                  <p className="font-medium">{item.title}</p>
                                  <p className="text-sm text-muted-foreground">{item.action_type}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {item.is_premium && (
                                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                                      Premium
                                    </span>
                                  )}
                                  {item.requires_auth && (
                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                      Auth
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <Button 
                            onClick={() => setActiveTab("menu")} 
                            className="w-full justify-start"
                          >
                            <Menu className="h-4 w-4 mr-2" />
                            Manage Menu Items
                          </Button>
                          <Button 
                            onClick={() => setActiveTab("analytics")} 
                            variant="outline" 
                            className="w-full justify-start"
                          >
                            <BarChart3 className="h-4 w-4 mr-2" />
                            View Analytics
                          </Button>
                          <Button 
                            onClick={handleItemCreate} 
                            variant="outline" 
                            className="w-full justify-start"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Menu Item
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {activeTab === "menu" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-3xl font-bold tracking-tight">Menu Management</h2>
                        <p className="text-muted-foreground">
                          Manage your app's menu structure and items
                        </p>
                      </div>
                      <Button onClick={handleItemCreate}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Menu Item
                      </Button>
                    </div>

                    <div className="space-y-8">
                      {sections.map(section => (
                        <MenuItemManager
                          key={section.id}
                          section={section}
                          items={getItemsBySection(section.id)}
                          onItemsReorder={handleItemsReorder}
                          onItemEdit={handleItemEdit}
                          onItemDelete={handleItemDelete}
                          onItemCreate={handleItemCreate}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "deployment" && (
                  <MenuDeploymentManager 
                    onEditVersion={(version) => {
                      setActiveTab("menu")
                      // TODO: You could store the version context in state if needed
                      console.log("Editing version:", version)
                    }} 
                  />
                )}

                {activeTab === "analytics" && (
                  <AnalyticsDashboard />
                )}

                {activeTab === "settings" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                      <p className="text-muted-foreground">
                        Configure your admin dashboard settings
                      </p>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle>API Configuration</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              Backend API URL
                            </label>
                            <Input
                              value={import.meta.env.VITE_BACKEND_API || "Not configured"}
                              readOnly
                              className="bg-muted"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Configure this in your .env file
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </QueryClientProvider>
  )
}

export default App
