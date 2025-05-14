"use client"

import { useState } from "react"
import { 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff,
  Info,
  Star
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { EnhancedFormField } from "@/components/ui/enhanced-form-field"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function FormDesignDemo() {
  // State for form inputs
  const [defaultInput, setDefaultInput] = useState("")
  const [activeInput, setActiveInput] = useState("Active")
  const [filledInput, setFilledInput] = useState("Filled")
  const [errorInput, setErrorInput] = useState("Error")
  const [successInput, setSuccessInput] = useState("Success")
  const [helpTextInput, setHelpTextInput] = useState("With help text")
  const [buttonInput, setButtonInput] = useState("With Button")
  const [bodyInput, setBodyInput] = useState("Input Body")
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState("password123")
  const [email, setEmail] = useState("user@example.com")
  const [username, setUsername] = useState("johndoe")
  const [bio, setBio] = useState("")
  const [darkMode, setDarkMode] = useState(false)
  const [sidebarColor, setSidebarColor] = useState("purple")

  // Clear input handlers
  const clearDefaultInput = () => setDefaultInput("")
  const clearActiveInput = () => setActiveInput("")
  const clearFilledInput = () => setFilledInput("")
  const clearErrorInput = () => setErrorInput("")
  const clearSuccessInput = () => setSuccessInput("")
  const clearHelpTextInput = () => setHelpTextInput("")
  const clearButtonInput = () => setButtonInput("")
  const clearBodyInput = () => setBodyInput("")
  const clearPassword = () => setPassword("")
  const clearEmail = () => setEmail("")
  const clearUsername = () => setUsername("")

  // Toggle password visibility
  const togglePasswordVisibility = () => setShowPassword(!showPassword)

  // Sidebar color options
  const sidebarColors = [
    { name: "purple", color: "#7C3AED" },
    { name: "black", color: "#000000" },
    { name: "blue", color: "#0EA5E9" },
    { name: "teal", color: "#14B8A6" },
    { name: "orange", color: "#F97316" },
    { name: "red", color: "#EF4444" },
  ]

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-2">Form Design Demo</h1>
      <p className="text-muted-foreground mb-8">
        Showcasing different form field states and layouts based on the provided design.
      </p>

      <Tabs defaultValue="input-states">
        <TabsList className="mb-6">
          <TabsTrigger value="input-states">Input States</TabsTrigger>
          <TabsTrigger value="two-column">Two-Column Form</TabsTrigger>
          <TabsTrigger value="configurator">Configurator Example</TabsTrigger>
        </TabsList>

        {/* Input States Tab */}
        <TabsContent value="input-states">
          <div className="max-w-xl mx-auto space-y-6">
            {/* Default Input */}
            <EnhancedFormField
              name="default-input"
              label="Default Input"
              value={defaultInput}
              showClear={true}
              onClear={clearDefaultInput}
            >
              <Input
                id="default-input"
                placeholder="Default Input"
                value={defaultInput}
                onChange={(e) => setDefaultInput(e.target.value)}
                className="border-0 shadow-none"
              />
            </EnhancedFormField>

            {/* Active Input */}
            <EnhancedFormField
              name="active-input"
              label="Active Input"
              value={activeInput}
              state="active"
              showClear={true}
              onClear={clearActiveInput}
            >
              <Input
                id="active-input"
                placeholder="Active Input"
                value={activeInput}
                onChange={(e) => setActiveInput(e.target.value)}
                className="border-0 shadow-none"
              />
            </EnhancedFormField>

            {/* Filled Input */}
            <EnhancedFormField
              name="filled-input"
              label="Filled Input"
              value={filledInput}
              state="filled"
              showClear={true}
              onClear={clearFilledInput}
            >
              <Input
                id="filled-input"
                placeholder="Filled Input"
                value={filledInput}
                onChange={(e) => setFilledInput(e.target.value)}
                className="border-0 shadow-none"
              />
            </EnhancedFormField>

            {/* Error Input */}
            <EnhancedFormField
              name="error-input"
              label="Error Input"
              value={errorInput}
              error="This username is not available. Try a suggested username or enter a new one"
              showClear={true}
              onClear={clearErrorInput}
              showResultCount={true}
              resultCount={0}
            >
              <Input
                id="error-input"
                placeholder="Error Input"
                value={errorInput}
                onChange={(e) => setErrorInput(e.target.value)}
                className="border-0 shadow-none"
              />
            </EnhancedFormField>

            {/* Success Input */}
            <EnhancedFormField
              name="success-input"
              label="Success Input"
              value={successInput}
              success="This username is available!"
              showClear={true}
              onClear={clearSuccessInput}
            >
              <Input
                id="success-input"
                placeholder="Success Input"
                value={successInput}
                onChange={(e) => setSuccessInput(e.target.value)}
                className="border-0 shadow-none"
              />
            </EnhancedFormField>

            {/* Input with Help Text */}
            <EnhancedFormField
              name="help-text-input"
              label="With help text"
              value={helpTextInput}
              helpText="This is some helpful text about this field."
              showClear={true}
              onClear={clearHelpTextInput}
              showCharCount={true}
              maxLength={60}
            >
              <Input
                id="help-text-input"
                placeholder="With help text"
                value={helpTextInput}
                onChange={(e) => setHelpTextInput(e.target.value)}
                className="border-0 shadow-none"
                maxLength={60}
              />
            </EnhancedFormField>

            {/* Input with Button */}
            <EnhancedFormField
              name="button-input"
              label="With Button"
              value={buttonInput}
              showClear={false}
              endButton={
                <Button size="icon" variant="ghost" className="h-8 w-8">
                  <Search className="h-4 w-4" />
                </Button>
              }
            >
              <Input
                id="button-input"
                placeholder="With Button"
                value={buttonInput}
                onChange={(e) => setButtonInput(e.target.value)}
                className="border-0 shadow-none"
              />
            </EnhancedFormField>

            {/* Textarea */}
            <EnhancedFormField
              name="body-input"
              label="Input Body"
              value={bodyInput}
              showClear={true}
              onClear={clearBodyInput}
            >
              <Textarea
                id="body-input"
                placeholder="Input Body"
                value={bodyInput}
                onChange={(e) => setBodyInput(e.target.value)}
                className="border-0 shadow-none min-h-[100px]"
              />
            </EnhancedFormField>
          </div>
        </TabsContent>

        {/* Two-Column Form Tab */}
        <TabsContent value="two-column">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle>User Profile</CardTitle>
              <CardDescription>
                Update your personal information and preferences.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Username */}
                  <EnhancedFormField
                    name="username"
                    label="Username"
                    value={username}
                    required
                    showClear={true}
                    onClear={clearUsername}
                    startIcon={<User className="h-4 w-4" />}
                  >
                    <Input
                      id="username"
                      placeholder="Enter username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="border-0 shadow-none"
                    />
                  </EnhancedFormField>

                  {/* Email */}
                  <EnhancedFormField
                    name="email"
                    label="Email"
                    value={email}
                    required
                    showClear={true}
                    onClear={clearEmail}
                    startIcon={<Mail className="h-4 w-4" />}
                  >
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border-0 shadow-none"
                    />
                  </EnhancedFormField>

                  {/* Password */}
                  <EnhancedFormField
                    name="password"
                    label="Password"
                    value={password}
                    required
                    showClear={true}
                    onClear={clearPassword}
                    startIcon={<Lock className="h-4 w-4" />}
                    endIcon={
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={togglePasswordVisibility}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    }
                    helpText="Password must be at least 8 characters long"
                  >
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="border-0 shadow-none"
                    />
                  </EnhancedFormField>

                  {/* Bio */}
                  <div className="md:col-span-2">
                    <EnhancedFormField
                      name="bio"
                      label="Bio"
                      value={bio}
                      optional
                      showCharCount={true}
                      maxLength={200}
                    >
                      <Textarea
                        id="bio"
                        placeholder="Tell us about yourself"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="border-0 shadow-none min-h-[100px]"
                        maxLength={200}
                      />
                    </EnhancedFormField>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit">Save Changes</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configurator Example Tab */}
        <TabsContent value="configurator">
          <Card className="max-w-sm mx-auto">
            <CardHeader>
              <CardTitle>Argon Configurator</CardTitle>
              <CardDescription>See our dashboard options.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Sidebar Colors */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Sidebar Colors</h3>
                <div className="flex gap-2">
                  {sidebarColors.map((color) => (
                    <button
                      key={color.name}
                      className="w-8 h-8 rounded-full transition-all"
                      style={{ backgroundColor: color.color }}
                      onClick={() => setSidebarColor(color.name)}
                      aria-label={`${color.name} sidebar color`}
                    >
                      {sidebarColor === color.name && (
                        <CheckCircle2 className="h-4 w-4 text-white mx-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sidenav Type */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Sidenav Type</h3>
                <p className="text-xs text-muted-foreground">
                  Choose between 2 different sidenav types.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant={darkMode ? "outline" : "default"} onClick={() => setDarkMode(false)}>
                    White
                  </Button>
                  <Button variant={darkMode ? "default" : "outline"} onClick={() => setDarkMode(true)}>
                    Dark
                  </Button>
                </div>
              </div>

              {/* Toggle Options */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="navbar-fixed" className="cursor-pointer">
                    Navbar Fixed
                  </Label>
                  <Switch id="navbar-fixed" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sidenav-mini" className="cursor-pointer">
                    Sidenav Mini
                  </Label>
                  <Switch id="sidenav-mini" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="light-dark" className="cursor-pointer">
                    Light / Dark
                  </Label>
                  <Switch id="light-dark" checked={darkMode} onCheckedChange={setDarkMode} />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-4">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">Buy now</Button>
                <Button variant="outline" className="w-full">Free demo</Button>
                <Button variant="outline" className="w-full">View documentation</Button>
              </div>

              {/* Star Rating */}
              <div className="flex items-center justify-center gap-2 pt-2">
                <div className="flex items-center gap-1 border rounded-md px-2 py-1">
                  <Star className="h-4 w-4 fill-current text-yellow-500" />
                  <span className="text-sm">3</span>
                </div>
              </div>

              {/* Thank You Message */}
              <div className="text-center pt-2">
                <p className="text-sm font-medium">Thank you for sharing!</p>
                <div className="flex justify-center gap-2 mt-2">
                  <Button variant="outline" size="sm" className="px-4 py-2 h-auto">
                    Tweet
                  </Button>
                  <Button variant="outline" size="sm" className="px-4 py-2 h-auto">
                    Share
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
