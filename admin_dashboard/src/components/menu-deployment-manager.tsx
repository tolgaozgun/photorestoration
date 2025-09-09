import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Rocket, 
  GitBranch, 
  Settings, 
  CheckCircle,
  AlertCircle,
  Plus,
  Edit
} from "lucide-react"
import { api } from "@/lib/api"

interface MenuVersion {
  id: string
  version: string
  environment: string
  changelog?: string
  is_active: boolean
  is_development: boolean
  created_at: string
  deployed_at?: string
  created_by?: string
}

interface MenuDeployment {
  id: string
  version_id: string
  environment: string
  status: string
  deployed_at: string
  deployed_by?: string
}

interface MenuDeploymentManagerProps {
  onEditVersion?: (version: MenuVersion) => void
}

export function MenuDeploymentManager({ onEditVersion }: MenuDeploymentManagerProps) {
  const [versions, setVersions] = useState<MenuVersion[]>([])
  const [deployments, setDeployments] = useState<MenuDeployment[]>([])
  const [loading, setLoading] = useState(true)
  const [deploying, setDeploying] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [newVersion, setNewVersion] = useState({ 
    version: "", 
    environment: "production", 
    changelog: "" 
  })

  useEffect(() => {
    console.log("🚀 MenuDeploymentManager component mounted")
    console.log("🔧 Props received:", { 
      onEditVersion: typeof onEditVersion,
      hasOnEditVersion: !!onEditVersion 
    })
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [versionsData, deploymentsData] = await Promise.all([
        api.getMenuVersions(),
        api.getMenuDeployments()
      ])
      setVersions(versionsData)
      setDeployments(deploymentsData)
    } catch (error) {
      console.error("Error loading menu deployment data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeploy = async (versionId: string, environment: string) => {
    try {
      setDeploying(versionId)
      await api.deployMenuVersion(versionId, environment)
      await loadData()
    } catch (error) {
      console.error("Error deploying version:", error)
    } finally {
      setDeploying(null)
    }
  }

  const handleSetDevelopment = async (versionId: string) => {
    try {
      await api.setDevelopmentVersion(versionId)
      await loadData()
    } catch (error) {
      console.error("Error setting development version:", error)
    }
  }

  const handleAutoCreate = async (environment: string, increment: string = "patch") => {
    try {
      setCreating(true)
      await api.autoCreateMenuVersion(environment, increment, `Auto-generated ${increment} version`)
      await loadData()
      setNewVersion({ version: "", environment: "production", changelog: "" })
    } catch (error) {
      console.error("Error creating version:", error)
    } finally {
      setCreating(false)
    }
  }

  const handleCreateVersion = async () => {
    try {
      setCreating(true)
      await api.createMenuVersion(
        newVersion.version,
        newVersion.environment,
        newVersion.changelog,
        newVersion.environment === "development"
      )
      await loadData()
      setNewVersion({ version: "", environment: "production", changelog: "" })
    } catch (error) {
      console.error("Error creating version:", error)
    } finally {
      setCreating(false)
    }
  }

  const handleEditVersion = (version: MenuVersion) => {
    console.log("🚀 MenuDeploymentManager: handleEditVersion called")
    console.log("📋 Version details:", {
      id: version.id,
      version: version.version,
      environment: version.environment,
      changelog: version.changelog,
      is_active: version.is_active,
      is_development: version.is_development,
      created_at: version.created_at,
      created_by: version.created_by
    })
    
    console.log("🔍 Checking if onEditVersion callback exists:", !!onEditVersion)
    
    if (onEditVersion) {
      console.log("✅ Calling onEditVersion callback with version")
      onEditVersion(version)
      console.log("📞 onEditVersion callback completed")
    } else {
      console.error("❌ onEditVersion callback is not available!")
      console.log("🛠️  Available props:", { onEditVersion: typeof onEditVersion })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString() + " " + new Date(dateString).toLocaleTimeString()
  }

  const getEnvironmentColor = (env: string) => {
    switch (env) {
      case "production": return "bg-red-100 text-red-800"
      case "staging": return "bg-yellow-100 text-yellow-800"
      case "development": return "bg-blue-100 text-blue-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Menu Deployment</h2>
          <p className="text-muted-foreground">Manage menu versions and deployments</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => handleAutoCreate("production", "patch")}
            disabled={creating}
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Auto Create Patch
          </Button>
          <Button 
            onClick={() => handleAutoCreate("production", "minor")}
            disabled={creating}
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Auto Create Minor
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Production Version</CardTitle>
            <Rocket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {versions.find(v => v.environment === "production" && v.is_active) ? (
              <div>
                <div className="text-2xl font-bold">
                  {versions.find(v => v.environment === "production" && v.is_active)?.version}
                </div>
                <p className="text-xs text-muted-foreground">
                  Active since {versions.find(v => v.environment === "production" && v.is_active)?.deployed_at ? 
                    formatDate(versions.find(v => v.environment === "production" && v.is_active)!.deployed_at!) : 
                    "Unknown"}
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">No active version</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Development Version</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {versions.find(v => v.is_development) ? (
              <div>
                <div className="text-2xl font-bold">
                  {versions.find(v => v.is_development)?.version}
                </div>
                <p className="text-xs text-muted-foreground">
                  Real-time updates
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">No development version</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Versions</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{versions.length}</div>
            <p className="text-xs text-muted-foreground">
              {deployments.length} deployments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Create New Version */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Version</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Version (e.g., 1.0.1)"
              value={newVersion.version}
              onChange={(e) => setNewVersion(prev => ({ ...prev, version: e.target.value }))}
              className="flex-1"
            />
            <select
              value={newVersion.environment}
              onChange={(e) => setNewVersion(prev => ({ ...prev, environment: e.target.value }))}
              className="px-3 py-2 border rounded-md"
            >
              <option value="development">Development</option>
              <option value="staging">Staging</option>
              <option value="production">Production</option>
            </select>
            <Input
              placeholder="Changelog (optional)"
              value={newVersion.changelog}
              onChange={(e) => setNewVersion(prev => ({ ...prev, changelog: e.target.value }))}
              className="flex-1"
            />
            <Button 
              onClick={handleCreateVersion}
              disabled={creating || !newVersion.version}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Versions List */}
      <Card>
        <CardHeader>
          <CardTitle>Versions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {versions.map((version) => (
              <div key={version.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium">{version.version}</h3>
                      <span className={`px-2 py-1 rounded text-xs ${getEnvironmentColor(version.environment)}`}>
                        {version.environment}
                      </span>
                      {version.is_active && (
                        <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1 inline" />
                          Active
                        </span>
                      )}
                      {version.is_development && (
                        <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                          <GitBranch className="h-3 w-3 mr-1 inline" />
                          Dev
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {version.changelog || "No changelog"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Created {formatDate(version.created_at)} by {version.created_by || "Unknown"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      console.log("🖱️  Edit Menu button clicked for version:", version.version)
                      console.log("🎯 Button event details:", {
                        type: e.type,
                        target: e.target,
                        currentTarget: e.currentTarget
                      })
                      handleEditVersion(version)
                    }}
                    variant="outline"
                    size="sm"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit Menu
                  </Button>
                  {version.environment !== "development" && !version.is_development && (
                    <Button
                      onClick={() => handleSetDevelopment(version.id)}
                      variant="outline"
                      size="sm"
                    >
                      <GitBranch className="h-4 w-4 mr-1" />
                      Set Dev
                    </Button>
                  )}
                  <Button
                    onClick={() => handleDeploy(version.id, version.environment)}
                    disabled={deploying === version.id || version.is_active}
                    variant={version.is_active ? "outline" : "default"}
                    size="sm"
                  >
                    {deploying === version.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                    ) : (
                      <Rocket className="h-4 w-4 mr-1" />
                    )}
                    Deploy
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Deployment History */}
      <Card>
        <CardHeader>
          <CardTitle>Deployment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {deployments.map((deployment) => (
              <div key={deployment.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium">
                        {versions.find(v => v.id === deployment.version_id)?.version || deployment.version_id}
                      </h3>
                      <span className={`px-2 py-1 rounded text-xs ${getEnvironmentColor(deployment.environment)}`}>
                        {deployment.environment}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        deployment.status === "success" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      }`}>
                        {deployment.status === "success" ? (
                          <CheckCircle className="h-3 w-3 mr-1 inline" />
                        ) : (
                          <AlertCircle className="h-3 w-3 mr-1 inline" />
                        )}
                        {deployment.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Deployed {formatDate(deployment.deployed_at)} by {deployment.deployed_by || "Unknown"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}