"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getUserProfile, saveUserProfile, getUserSettings, saveUserSettings } from "@/lib/storage"
import { useToast } from "@/hooks/use-toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { HelpCircle } from "lucide-react"
import { useLanguage, LANGUAGES } from "@/lib/i18n"

export default function SettingsPage() {
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    title: "",
    avatar: "",
  })

  const [settings, setSettings] = useState({
    theme: "system",
    language: "en",
    compactView: false,
    animations: true,
  })

  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const { toast } = useToast()
  const { language: currentLanguage, setLanguage } = useLanguage()

  useEffect(() => {
    // Load user profile and settings
    const loadedProfile = getUserProfile()
    const loadedSettings = getUserSettings()

    setProfile({
      firstName: loadedProfile.firstName || "",
      lastName: loadedProfile.lastName || "",
      email: loadedProfile.email || "",
      title: loadedProfile.title || "",
      avatar: loadedProfile.avatar || "",
    })

    setSettings({
      theme: loadedSettings.theme || "system",
      language: currentLanguage, // Use the current language from context
      compactView: loadedSettings.compactView || false,
      animations: loadedSettings.animations || true,
    })

    // Set avatar preview if exists
    if (loadedProfile.avatar) {
      setAvatarPreview(loadedProfile.avatar)
    }
  }, [currentLanguage])

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setAvatarFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onload = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleThemeChange = (theme: string) => {
    setSettings((prev) => ({
      ...prev,
      theme,
    }))
  }

  const handleLanguageChange = (language: string) => {
    setSettings((prev) => ({
      ...prev,
      language,
    }))

    // Update language in context
    setLanguage(language)

    // Show toast for language change
    const selectedLanguage = LANGUAGES.find((lang) => lang.code === language)

    toast({
      title: "Language Changed",
      description: `Language set to ${selectedLanguage?.name || language}`,
    })
  }

  const handleToggleChange = (setting: "compactView" | "animations") => {
    setSettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }))
  }

  const saveProfile = () => {
    // Save avatar if changed
    const updatedProfile = {
      ...profile,
      avatar: avatarPreview || profile.avatar,
    }

    saveUserProfile({
      firstName: updatedProfile.firstName,
      lastName: updatedProfile.lastName,
      email: updatedProfile.email,
      title: updatedProfile.title,
      bio: "",
      skills: [],
      social: {},
      avatar: updatedProfile.avatar,
    })

    toast({
      title: "Profile Saved",
      description: "Your profile has been updated successfully",
    })
  }

  const saveSettings = () => {
    const updatedSettings = {
      theme: settings.theme,
      language: settings.language,
      compactView: settings.compactView,
      animations: settings.animations,
      defaultView: "kanban",
      notifications: {
        email: {
          interviewReminders: true,
          applicationDeadlines: true,
          weeklySummary: true,
        },
        inApp: {
          statusChanges: true,
          followUpReminders: true,
        },
      },
      dataManagement: {
        automaticBackups: true,
        analytics: true,
      },
    }

    saveUserSettings(updatedSettings)

    toast({
      title: "Settings Saved",
      description: "Your settings have been updated successfully",
    })
  }

  return (
    <main className="flex min-h-screen flex-col">
      <DashboardHeader />
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        </div>

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
                  <div className="flex flex-col items-center space-y-2">
                    <Avatar className="h-24 w-24">
                      {avatarPreview ? (
                        <AvatarImage
                          src={avatarPreview || "/placeholder.svg"}
                          alt={`${profile.firstName} ${profile.lastName}`}
                        />
                      ) : (
                        <AvatarImage
                          src="/placeholder.svg?height=96&width=96"
                          alt={`${profile.firstName} ${profile.lastName}`}
                        />
                      )}
                      <AvatarFallback>
                        {profile.firstName.charAt(0)}
                        {profile.lastName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <Input
                        type="file"
                        accept="image/*"
                        id="avatar-upload"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => document.getElementById("avatar-upload")?.click()}
                            >
                              Change Avatar
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Upload a profile picture</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>

                  <div className="space-y-4 flex-1">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="first-name">First name</Label>
                        <Input
                          id="first-name"
                          name="firstName"
                          value={profile.firstName}
                          onChange={handleProfileChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last-name">Last name</Label>
                        <Input id="last-name" name="lastName" value={profile.lastName} onChange={handleProfileChange} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" name="email" value={profile.email} onChange={handleProfileChange} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="title">Professional Title</Label>
                      <Input id="title" name="title" value={profile.title} onChange={handleProfileChange} />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={saveProfile}>Save Changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize how Job Tracker looks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="mb-2 text-sm font-medium">Theme</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <div
                        className={`flex flex-col items-center space-y-2 cursor-pointer ${settings.theme === "light" ? "opacity-100" : "opacity-60"}`}
                        onClick={() => handleThemeChange("light")}
                      >
                        <div
                          className={`h-16 w-16 rounded-md bg-white border-2 ${settings.theme === "light" ? "border-primary" : "border-muted"}`}
                        ></div>
                        <span className="text-xs">Light</span>
                      </div>
                      <div
                        className={`flex flex-col items-center space-y-2 cursor-pointer ${settings.theme === "dark" ? "opacity-100" : "opacity-60"}`}
                        onClick={() => handleThemeChange("dark")}
                      >
                        <div
                          className={`h-16 w-16 rounded-md bg-slate-950 border-2 ${settings.theme === "dark" ? "border-primary" : "border-muted"}`}
                        ></div>
                        <span className="text-xs">Dark</span>
                      </div>
                      <div
                        className={`flex flex-col items-center space-y-2 cursor-pointer ${settings.theme === "system" ? "opacity-100" : "opacity-60"}`}
                        onClick={() => handleThemeChange("system")}
                      >
                        <div
                          className={`h-16 w-16 rounded-md bg-gradient-to-b from-white to-slate-950 border-2 ${settings.theme === "system" ? "border-primary" : "border-muted"}`}
                        ></div>
                        <span className="text-xs">System</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="language" className="text-sm font-medium">
                        Language
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <HelpCircle className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Change the application language</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <select
                      id="language"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={settings.language}
                      onChange={(e) => handleLanguageChange(e.target.value)}
                    >
                      {LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium">Compact View</h4>
                        <p className="text-sm text-muted-foreground">Use a more compact layout for job cards</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={settings.compactView}
                          onChange={() => handleToggleChange("compactView")}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium">Animations</h4>
                        <p className="text-sm text-muted-foreground">Enable animations throughout the application</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={settings.animations}
                          onChange={() => handleToggleChange("animations")}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={saveSettings}>Save Preferences</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
