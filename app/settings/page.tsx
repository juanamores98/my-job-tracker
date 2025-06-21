"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { 
  Settings, 
  Palette, 
  Eye, 
  Bell, 
  Database, 
  Download, 
  Upload, 
  Trash2,
  Save,
  RefreshCw,
  Monitor,
  Sun,
  Moon,
  LayoutGrid,
  Table,
  Calendar,
  Globe,
  SortAsc,
  SortDesc,
  Filter
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import { getUserSettings, saveUserSettings, exportToJSON, importFromJSON, getJobStates } from "@/lib/storage"
import type { UserSettings, JobState } from "@/lib/types"

const defaultSettings: UserSettings = {
  theme: "system",
  compactView: false,
  animations: true,
  defaultView: "kanban",
  notifications: {
    email: {
      interviewReminders: true,
      applicationDeadlines: true,
      weeklySummary: false,
    },
    inApp: {
      statusChanges: true,
      followUpReminders: true,
    },
  },
  dataManagement: {
    automaticBackups: false,
    analytics: true,
  },
  language: "en",
  dateFormat: "MM/dd/yyyy",
  defaultJobView: "kanban",
  defaultSortField: "date",
  defaultSortOrder: "desc",
  defaultFilters: {},
  jobStates: [],
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings)
  const [loading, setLoading] = useState(false)
  const [jobStates, setJobStates] = useState<JobState[]>([])
  const [activeTab, setActiveTab] = useState("appearance")
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    // Load settings from localStorage
    const loadedSettings = getUserSettings()
    const loadedJobStates = getJobStates()
    setSettings(loadedSettings)
    setJobStates(loadedJobStates)
  }, [])

  const handleSave = async () => {
    setLoading(true)
    try {
      saveUserSettings(settings)
      if (settings.theme !== theme) {
        setTheme(settings.theme)
      }
      toast({
        title: "Settings saved",
        description: "Your preferences have been saved successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setSettings(defaultSettings)
    toast({
      title: "Settings reset",
      description: "All settings have been reset to default values.",
    })
  }

  const handleExport = () => {
    try {
      const data = exportToJSON()
      const blob = new Blob([data], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `job-tracker-backup-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast({
        title: "Data exported",
        description: "Your data has been exported successfully.",
      })
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const jsonData = e.target?.result as string
        importFromJSON(jsonData)
        toast({
          title: "Data imported",
          description: "Your data has been imported successfully.",
        })
        // Refresh page to reflect changes
        window.location.reload()
      } catch (error) {
        toast({
          title: "Import failed",
          description: "Failed to import data. Please check the file format.",
          variant: "destructive",
        })
      }
    }
    reader.readAsText(file)
  }

  const updateSettings = (key: keyof UserSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const updateNestedSettings = (
    parentKey: keyof UserSettings,
    childKey: string,
    value: any
  ) => {
    setSettings(prev => ({
      ...prev,
      [parentKey]: {
        ...prev[parentKey] as any,
        [childKey]: value,
      },
    }))
  }

  const updateNotificationSettings = (
    category: "email" | "inApp",
    key: string,
    value: boolean
  ) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [category]: {
          ...prev.notifications[category],
          [key]: value,
        },
      },
    }))
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your application preferences and data settings.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="behavior">Behavior</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Theme & Display
              </CardTitle>
              <CardDescription>
                Customize the appearance of your application.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Theme</Label>
                <Select 
                  value={settings.theme} 
                  onValueChange={(value: "light" | "dark" | "system") => updateSettings("theme", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4" />
                        Light
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4" />
                        Dark
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        System
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Compact View</Label>
                  <p className="text-sm text-muted-foreground">
                    Show more information in less space
                  </p>
                </div>
                <Switch
                  checked={settings.compactView}
                  onCheckedChange={(checked) => updateSettings("compactView", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Animations</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable smooth transitions and animations
                  </p>
                </div>
                <Switch
                  checked={settings.animations}
                  onCheckedChange={(checked) => updateSettings("animations", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="behavior" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                View & Navigation
              </CardTitle>
              <CardDescription>
                Configure how you view and interact with your job data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Default View</Label>
                <Select 
                  value={settings.defaultView} 
                  onValueChange={(value: "kanban" | "table" | "calendar") => updateSettings("defaultView", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kanban">
                      <div className="flex items-center gap-2">
                        <LayoutGrid className="h-4 w-4" />
                        Kanban Board
                      </div>
                    </SelectItem>
                    <SelectItem value="table">
                      <div className="flex items-center gap-2">
                        <Table className="h-4 w-4" />
                        Table View
                      </div>
                    </SelectItem>
                    <SelectItem value="calendar">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Calendar View
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Default Sort Field</Label>
                <Select 
                  value={settings.defaultSortField} 
                  onValueChange={(value) => updateSettings("defaultSortField", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date Applied</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="position">Position</SelectItem>
                    <SelectItem value="priority">Priority</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Default Sort Order</Label>
                <Select 
                  value={settings.defaultSortOrder} 
                  onValueChange={(value: "asc" | "desc") => updateSettings("defaultSortOrder", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">
                      <div className="flex items-center gap-2">
                        <SortAsc className="h-4 w-4" />
                        Ascending
                      </div>
                    </SelectItem>
                    <SelectItem value="desc">
                      <div className="flex items-center gap-2">
                        <SortDesc className="h-4 w-4" />
                        Descending
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Language</Label>
                <Select 
                  value={settings.language} 
                  onValueChange={(value) => updateSettings("language", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        English
                      </div>
                    </SelectItem>
                    <SelectItem value="es">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Español
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Date Format</Label>
                <Select 
                  value={settings.dateFormat} 
                  onValueChange={(value) => updateSettings("dateFormat", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MM/dd/yyyy">MM/dd/yyyy (US)</SelectItem>
                    <SelectItem value="dd/MM/yyyy">dd/MM/yyyy (EU)</SelectItem>
                    <SelectItem value="yyyy-MM-dd">yyyy-MM-dd (ISO)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Configure how you receive notifications and reminders.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-base font-medium">Email Notifications</Label>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Interview Reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified before scheduled interviews
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.email.interviewReminders}
                      onCheckedChange={(checked) => updateNotificationSettings("email", "interviewReminders", checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Application Deadlines</Label>
                      <p className="text-sm text-muted-foreground">
                        Reminders for job application deadlines
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.email.applicationDeadlines}
                      onCheckedChange={(checked) => updateNotificationSettings("email", "applicationDeadlines", checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Weekly Summary</Label>
                      <p className="text-sm text-muted-foreground">
                        Weekly digest of your job search progress
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.email.weeklySummary}
                      onCheckedChange={(checked) => updateNotificationSettings("email", "weeklySummary", checked)}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-base font-medium">In-App Notifications</Label>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Status Changes</Label>
                      <p className="text-sm text-muted-foreground">
                        Notifications when job status changes
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.inApp.statusChanges}
                      onCheckedChange={(checked) => updateNotificationSettings("inApp", "statusChanges", checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Follow-up Reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        Reminders to follow up on applications
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.inApp.followUpReminders}
                      onCheckedChange={(checked) => updateNotificationSettings("inApp", "followUpReminders", checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Management
              </CardTitle>
              <CardDescription>
                Manage your data, backups, and privacy settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Automatic Backups</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically backup your data locally
                  </p>
                </div>
                <Switch
                  checked={settings.dataManagement.automaticBackups}
                  onCheckedChange={(checked) => updateNestedSettings("dataManagement", "automaticBackups", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Analytics</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow anonymous usage analytics to improve the app
                  </p>
                </div>
                <Switch
                  checked={settings.dataManagement.analytics}
                  onCheckedChange={(checked) => updateNestedSettings("dataManagement", "analytics", checked)}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <Label className="text-base font-medium">Data Import/Export</Label>
                
                <div className="flex gap-4">
                  <Button onClick={handleExport} variant="outline" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Export Data
                  </Button>
                  
                  <div className="flex-1">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImport}
                      className="hidden"
                      id="import-file"
                    />
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => document.getElementById("import-file")?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Import Data
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label className="text-base font-medium">Job States</Label>
                <p className="text-sm text-muted-foreground">
                  Current job states in your workflow
                </p>
                
                <div className="flex flex-wrap gap-2">
                  {jobStates.map((state) => (
                    <Badge 
                      key={state.id} 
                      variant="secondary"
                      style={{ backgroundColor: state.color + "20", borderColor: state.color }}
                    >
                      {state.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between items-center pt-6 border-t">
        <Button
          variant="outline"
          onClick={handleReset}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Reset to Defaults
        </Button>
        
        <Button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2"
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Settings
        </Button>
      </div>
    </div>
  )
}