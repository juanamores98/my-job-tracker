"use client"

import { useState } from "react"
import { 
  Search, 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff,
  Star,
  CheckCircle2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { FormField } from "@/components/ui/form-field"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function FormExamplesPage() {
  // Form states
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [search, setSearch] = useState("")
  const [darkMode, setDarkMode] = useState(false)
  const [sidebarColor, setSidebarColor] = useState("purple")

  // Clear input handlers
  const clearUsername = () => setUsername("")
  const clearEmail = () => setEmail("")
  const clearPassword = () => setPassword("")
  const clearSearch = () => setSearch("")

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

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    alert("Form submitted!")
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-2">Form Examples</h1>
      <p className="text-muted-foreground mb-8">
        Examples of form fields and layouts based on the provided design.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Input States Card */}
        <Card>
          <CardHeader>
            <CardTitle>Input States</CardTitle>
            <CardDescription>
              Examples of different input states and variations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Default Input */}
            <FormField
              name="default-input"
              label="Default Input"
              placeholder="Default Input"
              helpText="This is the default state of an input field."
            />
            
            {/* Active Input */}
            <FormField
              name="active-input"
              label="Active Input"
              placeholder="Active Input"
              value="Active"
              state="active"
              showClear={true}
              onClear={() => {}}
              helpText="This input is currently focused/active."
            />
            
            {/* Filled Input */}
            <FormField
              name="filled-input"
              label="Filled Input"
              placeholder="Filled Input"
              value="Filled"
              state="filled"
              showClear={true}
              onClear={() => {}}
              helpText="This input has a value entered."
            />
            
            {/* Error Input */}
            <FormField
              name="error-input"
              label="Error Input"
              placeholder="Error Input"
              value="Error"
              error="This username is not available. Try a suggested username or enter a new one"
              showClear={true}
              onClear={() => {}}
              showResultCount={true}
              resultCount={0}
            />
            
            {/* Success Input */}
            <FormField
              name="success-input"
              label="Success Input"
              placeholder="Success Input"
              value="Success"
              success="This username is available!"
              showClear={true}
              onClear={() => {}}
            />
            
            {/* Input with Help Text and Character Count */}
            <FormField
              name="help-text-input"
              label="With Help Text"
              placeholder="With help text"
              value="With help text"
              helpText="This is some helpful text about this field."
              showClear={true}
              onClear={() => {}}
              showCharCount={true}
              maxLength={60}
            />
            
            {/* Input with Button */}
            <FormField
              name="button-input"
              label="With Button"
              placeholder="With Button"
              value="With Button"
              showClear={false}
              endButton={
                <Button size="icon" variant="ghost" className="h-8 w-8">
                  <Search className="h-4 w-4" />
                </Button>
              }
            />
          </CardContent>
        </Card>

        {/* Login Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>Login Form</CardTitle>
            <CardDescription>
              Enter your credentials to sign in to your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField
                name="username"
                label="Username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                showClear={!!username}
                onClear={clearUsername}
                startIcon={<User className="h-4 w-4" />}
              />
              
              <FormField
                name="email"
                label="Email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                showClear={!!email}
                onClear={clearEmail}
                startIcon={<Mail className="h-4 w-4" />}
              />
              
              <FormField
                name="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                showClear={!!password}
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
              />
              
              <div className="flex items-center space-x-2 pt-2">
                <Switch id="remember-me" />
                <Label htmlFor="remember-me">Remember me</Label>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-end gap-3">
            <Button variant="outline">Cancel</Button>
            <Button type="submit" form="login-form">Sign In</Button>
          </CardFooter>
        </Card>

        {/* Search Form */}
        <Card>
          <CardHeader>
            <CardTitle>Search</CardTitle>
            <CardDescription>
              Search for content across the platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              name="search"
              label="Search"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              showClear={!!search}
              onClear={clearSearch}
              startIcon={<Search className="h-4 w-4" />}
            />
          </CardContent>
        </Card>

        {/* Configurator Example */}
        <Card>
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
      </div>
    </div>
  )
}
