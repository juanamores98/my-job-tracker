"use client"

import { useState, useEffect, type ChangeEvent } from "react"
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
  Filter,
  UserPlus,
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { EnhancedTagInput } from "@/components/enhanced-tag-input"
import { ProfileImageUploader } from "@/components/profile-image-uploader"
import { toast } from "@/hooks/use-toast"
import {
  getUserSettings,
  saveUserSettings,
  exportToJSON,
  importFromJSON,
  getJobStates,
  getUserProfile,
  exportJobsToJSON,
  exportUserProfileToJSON,
  exportUserSettingsToJSON,
  importJobsFromJSON,
  importUserProfileFromJSON,
  importUserSettingsFromJSON,
  exportToCSV,
  createDefaultSettings,
} from "@/lib/storage"
import { useAuth } from "@/lib/contexts/auth-context"
import type { UserSettings, JobState, UserProfile } from "@/lib/types"

const baseSettings = createDefaultSettings()

const defaultSettings: UserSettings = {
  ...baseSettings,
  notifications: {
    ...baseSettings.notifications,
    email: {
      ...baseSettings.notifications.email,
      weeklySummary: false,
    },
  },
  dataManagement: {
    ...baseSettings.dataManagement,
    automaticBackups: false,
  },
  jobStates: [],
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings)
  const [loading, setLoading] = useState(false)
  const [jobStates, setJobStates] = useState<JobState[]>([])
  const [activeTab, setActiveTab] = useState("appearance")
  const { theme, setTheme } = useTheme()
  const { updateProfile } = useAuth()
  const [profileForm, setProfileForm] = useState<UserProfile>({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    birthday: "",
    preferences: "",
    university: "",
    school: "",
    highSchool: "",
    about: "",
    skills: [],
    studies: [],
    photo: undefined,
  })
  const [profileSkills, setProfileSkills] = useState<string[]>([])
  const [profileStudies, setProfileStudies] = useState<string[]>([])
  const [profilePhoto, setProfilePhoto] = useState<string | undefined>(undefined)
  const [isProfileSaving, setIsProfileSaving] = useState(false)

  const loadProfile = () => {
    const loadedProfile = getUserProfile()
    setProfileForm({
      fullName: loadedProfile.fullName || "",
      username: loadedProfile.username || "",
      email: loadedProfile.email || "",
      phone: loadedProfile.phone || "",
      birthday: loadedProfile.birthday || "",
      preferences: loadedProfile.preferences || "",
      university: loadedProfile.university || "",
      school: loadedProfile.school || "",
      highSchool: loadedProfile.highSchool || "",
      about: loadedProfile.about || "",
      skills: loadedProfile.skills || [],
      studies: loadedProfile.studies || [],
      photo: loadedProfile.photo,
    })
    setProfileSkills(loadedProfile.skills || [])
    setProfileStudies(loadedProfile.studies || [])
    setProfilePhoto(loadedProfile.photo)
  }

  useEffect(() => {
    // Load settings from localStorage
    const loadedSettings = getUserSettings()
    const loadedJobStates = getJobStates()
    setSettings(loadedSettings)
    setJobStates(loadedJobStates)
    loadProfile()
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

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleExportAll = () => {
    try {
      const data = exportToJSON()
      downloadFile(data, `job-tracker-backup-${new Date().toISOString().split("T")[0]}.json`, "application/json")

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

  const handleImportAll = (event: ChangeEvent<HTMLInputElement>) => {
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
        loadProfile()
        setSettings(getUserSettings())
        setJobStates(getJobStates())
      } catch (error) {
        toast({
          title: "Import failed",
          description: "Failed to import data. Please check the file format.",
          variant: "destructive",
        })
      }
    }
    reader.readAsText(file)
    event.target.value = ""
  }

  const handleExportJobs = () => {
    try {
      const data = exportJobsToJSON()
      downloadFile(data, `job-tracker-jobs-${new Date().toISOString().split("T")[0]}.json`, "application/json")
      toast({ title: "Jobs exported", description: "All job records saved as JSON." })
    } catch (error) {
      toast({ title: "Export failed", description: "Unable to export jobs.", variant: "destructive" })
    }
  }

  const handleExportJobsCsv = () => {
    try {
      const csv = exportToCSV()
      downloadFile(csv, `job-tracker-jobs-${new Date().toISOString().split("T")[0]}.csv`, "text/csv")
      toast({ title: "Jobs exported", description: "Jobs exported as CSV." })
    } catch (error) {
      toast({ title: "Export failed", description: "Unable to export jobs.", variant: "destructive" })
    }
  }

  const handleExportProfile = () => {
    try {
      const data = exportUserProfileToJSON()
      downloadFile(data, `job-tracker-profile-${new Date().toISOString().split("T")[0]}.json`, "application/json")
      toast({ title: "Profile exported", description: "Your profile has been saved as JSON." })
    } catch (error) {
      toast({ title: "Export failed", description: "Unable to export profile.", variant: "destructive" })
    }
  }

  const handleExportSettingsOnly = () => {
    try {
      const data = exportUserSettingsToJSON()
      downloadFile(data, `job-tracker-settings-${new Date().toISOString().split("T")[0]}.json`, "application/json")
      toast({ title: "Settings exported", description: "Your preferences have been saved." })
    } catch (error) {
      toast({ title: "Export failed", description: "Unable to export settings.", variant: "destructive" })
    }
  }

  const handleImportJobs = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const jsonData = e.target?.result as string
        importJobsFromJSON(jsonData)
        toast({ title: "Jobs imported", description: "Job board updated." })
      } catch (error) {
        toast({ title: "Import failed", description: "Unable to import jobs.", variant: "destructive" })
      }
    }
    reader.readAsText(file)
    event.target.value = ""
  }

  const handleImportProfile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const jsonData = e.target?.result as string
        importUserProfileFromJSON(jsonData)
        loadProfile()
        toast({ title: "Profile imported", description: "Your profile information has been updated." })
      } catch (error) {
        toast({ title: "Import failed", description: "Unable to import profile.", variant: "destructive" })
      }
    }
    reader.readAsText(file)
    event.target.value = ""
  }

  const handleImportSettingsOnly = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const jsonData = e.target?.result as string
        importUserSettingsFromJSON(jsonData)
        const freshSettings = getUserSettings()
        setSettings(freshSettings)
        setJobStates(getJobStates())
        toast({ title: "Settings imported", description: "Preferences updated." })
      } catch (error) {
        toast({ title: "Import failed", description: "Unable to import settings.", variant: "destructive" })
      }
    }
    reader.readAsText(file)
    event.target.value = ""
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

  const handleProfileFieldChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target
    setProfileForm(prev => ({ ...prev, [name]: value }))
  }

  const handleProfileSave = async () => {
    setIsProfileSaving(true)
    try {
      await updateProfile({
        fullName: profileForm.fullName,
        username: profileForm.username,
        email: profileForm.email,
        phone: profileForm.phone,
        birthday: profileForm.birthday,
        preferences: profileForm.preferences,
        university: profileForm.university,
        school: profileForm.school,
        highSchool: profileForm.highSchool,
        about: profileForm.about,
        skills: profileSkills,
        studies: profileStudies,
        photo: profilePhoto,
      })

      toast({
        title: "Profile updated",
        description: "Your personal information has been saved.",
      })
    } catch (error) {
      toast({
        title: "Unable to save profile",
        description: "Please try again in a moment.",
        variant: "destructive",
      })
    } finally {
      setIsProfileSaving(false)
    }
  }

  const handleProfileReset = () => {
    loadProfile()
    toast({
      title: "Profile reset",
      description: "We restored the last saved version of your profile.",
    })
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="behavior">Behavior</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Personal information
              </CardTitle>
              <CardDescription>Update how employers see you across your workspace.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="md:col-span-2 space-y-2">
                <Label>Profile photo</Label>
                <ProfileImageUploader value={profilePhoto} onChange={setProfilePhoto} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-fullName">Full name</Label>
                <Input
                  id="profile-fullName"
                  name="fullName"
                  value={profileForm.fullName}
                  onChange={handleProfileFieldChange}
                  placeholder="Jane Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-username">Username</Label>
                <Input
                  id="profile-username"
                  name="username"
                  value={profileForm.username}
                  onChange={handleProfileFieldChange}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-email">Email</Label>
                <Input
                  id="profile-email"
                  name="email"
                  type="email"
                  value={profileForm.email}
                  onChange={handleProfileFieldChange}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-phone">Phone</Label>
                <Input
                  id="profile-phone"
                  name="phone"
                  value={profileForm.phone}
                  onChange={handleProfileFieldChange}
                  placeholder="+1 555 0101"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-birthday">Birthday</Label>
                <Input
                  id="profile-birthday"
                  name="birthday"
                  type="date"
                  value={profileForm.birthday}
                  onChange={handleProfileFieldChange}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                Background & preferences
              </CardTitle>
              <CardDescription>Summarise your studies, interests and what you are looking for.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="profile-preferences">Work preferences</Label>
                  <Textarea
                    id="profile-preferences"
                    name="preferences"
                    rows={4}
                    value={profileForm.preferences}
                    onChange={handleProfileFieldChange}
                    placeholder="Remote-friendly teams, fast-paced startups, product-led companies..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-about">About</Label>
                  <Textarea
                    id="profile-about"
                    name="about"
                    rows={4}
                    value={profileForm.about}
                    onChange={handleProfileFieldChange}
                    placeholder="Tell your story, experience, goals or fun facts."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-university">University</Label>
                  <Input
                    id="profile-university"
                    name="university"
                    value={profileForm.university}
                    onChange={handleProfileFieldChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-school">School</Label>
                  <Input
                    id="profile-school"
                    name="school"
                    value={profileForm.school}
                    onChange={handleProfileFieldChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-highSchool">High school</Label>
                  <Input
                    id="profile-highSchool"
                    name="highSchool"
                    value={profileForm.highSchool}
                    onChange={handleProfileFieldChange}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Skills</Label>
                <EnhancedTagInput
                  tags={profileSkills}
                  onTagsChange={setProfileSkills}
                  placeholder="React, TypeScript, collaboration, leadership..."
                />
              </div>
              <div className="space-y-2">
                <Label>Studies & education focus</Label>
                <EnhancedTagInput
                  tags={profileStudies}
                  onTagsChange={setProfileStudies}
                  placeholder="Computer Science, UX Design, MBA..."
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
            <Button type="button" variant="outline" onClick={handleProfileReset} disabled={isProfileSaving}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reset changes
            </Button>
            <Button type="button" onClick={handleProfileSave} disabled={isProfileSaving}>
              <Save className="mr-2 h-4 w-4" />
              Save profile
            </Button>
          </div>
        </TabsContent>

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
                <Label className="text-base font-medium">Job tracker data</Label>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={handleExportJobs} variant="outline" className="flex-1 min-w-[180px]">
                    <Download className="mr-2 h-4 w-4" /> Export jobs (JSON)
                  </Button>
                  <Button onClick={handleExportJobsCsv} variant="outline" className="flex-1 min-w-[180px]">
                    <Download className="mr-2 h-4 w-4" /> Export jobs (CSV)
                  </Button>
                  <div className="flex-1 min-w-[180px]">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportJobs}
                      className="hidden"
                      id="import-jobs"
                    />
                    <Button variant="outline" className="w-full" onClick={() => document.getElementById("import-jobs")?.click()}>
                      <Upload className="mr-2 h-4 w-4" /> Import jobs
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-medium">User profile</Label>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={handleExportProfile} variant="outline" className="flex-1 min-w-[180px]">
                    <Download className="mr-2 h-4 w-4" /> Export profile
                  </Button>
                  <div className="flex-1 min-w-[180px]">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportProfile}
                      className="hidden"
                      id="import-profile"
                    />
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => document.getElementById("import-profile")?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" /> Import profile
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-medium">Preferences & backups</Label>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={handleExportSettingsOnly} variant="outline" className="flex-1 min-w-[180px]">
                    <Download className="mr-2 h-4 w-4" /> Export settings
                  </Button>
                  <Button onClick={handleExportAll} variant="outline" className="flex-1 min-w-[180px]">
                    <Download className="mr-2 h-4 w-4" /> Export everything
                  </Button>
                  <div className="flex-1 min-w-[180px]">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportSettingsOnly}
                      className="hidden"
                      id="import-settings"
                    />
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => document.getElementById("import-settings")?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" /> Import settings
                    </Button>
                  </div>
                  <div className="flex-1 min-w-[180px]">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportAll}
                      className="hidden"
                      id="import-all"
                    />
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => document.getElementById("import-all")?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" /> Import everything
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