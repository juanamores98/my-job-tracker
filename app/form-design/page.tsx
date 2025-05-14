"use client"

import { useState } from "react"
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  Briefcase, 
  Calendar, 
  DollarSign,
  Search,
  Lock,
  Eye,
  EyeOff,
  Info,
  CheckCircle2
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { EnhancedFormField } from "@/components/ui/enhanced-form-field"
import { TwoColumnForm, FormSection } from "@/components/ui/two-column-form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function FormDesignPage() {
  // Personal information
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [bio, setBio] = useState("")
  
  // Job information
  const [company, setCompany] = useState("")
  const [position, setPosition] = useState("")
  const [location, setLocation] = useState("")
  const [workMode, setWorkMode] = useState("")
  const [startDate, setStartDate] = useState("")
  const [salary, setSalary] = useState("")
  const [currency, setCurrency] = useState("USD")
  
  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [smsNotifications, setSmsNotifications] = useState(false)
  const [pushNotifications, setPushNotifications] = useState(true)
  
  // Form state
  const [isLoading, setIsLoading] = useState(false)
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      alert("Form submitted successfully!")
    }, 1500)
  }
  
  // Clear input handlers
  const clearFirstName = () => setFirstName("")
  const clearLastName = () => setLastName("")
  const clearEmail = () => setEmail("")
  const clearPhone = () => setPhone("")
  const clearUsername = () => setUsername("")
  const clearPassword = () => setPassword("")
  const clearBio = () => setBio("")
  const clearCompany = () => setCompany("")
  const clearPosition = () => setPosition("")
  const clearLocation = () => setLocation("")
  const clearSalary = () => setSalary("")
  
  // Toggle password visibility
  const togglePasswordVisibility = () => setShowPassword(!showPassword)
  
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-2">Form Design</h1>
      <p className="text-muted-foreground mb-8">
        A comprehensive form design example with various input states and layouts.
      </p>
      
      <Tabs defaultValue="user-profile">
        <TabsList className="mb-6">
          <TabsTrigger value="user-profile">User Profile</TabsTrigger>
          <TabsTrigger value="job-application">Job Application</TabsTrigger>
          <TabsTrigger value="input-states">Input States</TabsTrigger>
        </TabsList>
        
        {/* User Profile Tab */}
        <TabsContent value="user-profile">
          <TwoColumnForm
            title="User Profile"
            description="Update your personal information and account settings."
            id="user-profile-form"
            onSubmit={handleSubmit}
            submitText="Save Changes"
            cancelText="Cancel"
            onCancel={() => alert("Cancelled")}
            isLoading={isLoading}
          >
            <FormSection title="Personal Information">
              <EnhancedFormField
                name="first-name"
                label="First Name"
                value={firstName}
                required
                showClear={true}
                onClear={clearFirstName}
                startIcon={<User className="h-4 w-4" />}
              >
                <Input
                  id="first-name"
                  placeholder="Enter first name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="border-0 shadow-none"
                />
              </EnhancedFormField>
              
              <EnhancedFormField
                name="last-name"
                label="Last Name"
                value={lastName}
                required
                showClear={true}
                onClear={clearLastName}
                startIcon={<User className="h-4 w-4" />}
              >
                <Input
                  id="last-name"
                  placeholder="Enter last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="border-0 shadow-none"
                />
              </EnhancedFormField>
            </FormSection>
            
            <FormSection title="Contact Information">
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
              
              <EnhancedFormField
                name="phone"
                label="Phone"
                value={phone}
                optional
                showClear={true}
                onClear={clearPhone}
                startIcon={<Phone className="h-4 w-4" />}
              >
                <Input
                  id="phone"
                  placeholder="Enter phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="border-0 shadow-none"
                />
              </EnhancedFormField>
            </FormSection>
            
            <FormSection title="Account Information">
              <EnhancedFormField
                name="username"
                label="Username"
                value={username}
                required
                showClear={true}
                onClear={clearUsername}
                startIcon={<User className="h-4 w-4" />}
                state={username ? "success" : "default"}
                success={username ? "Username is available!" : undefined}
              >
                <Input
                  id="username"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="border-0 shadow-none"
                />
              </EnhancedFormField>
              
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
            </FormSection>
            
            <FormSection title="Bio" fullWidth>
              <EnhancedFormField
                name="bio"
                label="About Me"
                value={bio}
                optional
                showClear={true}
                onClear={clearBio}
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
            </FormSection>
            
            <FormSection title="Notification Preferences" fullWidth>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications" className="text-base">
                      Email Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="sms-notifications" className="text-base">
                      SMS Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via text message
                    </p>
                  </div>
                  <Switch
                    id="sms-notifications"
                    checked={smsNotifications}
                    onCheckedChange={setSmsNotifications}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="push-notifications" className="text-base">
                      Push Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications on your device
                    </p>
                  </div>
                  <Switch
                    id="push-notifications"
                    checked={pushNotifications}
                    onCheckedChange={setPushNotifications}
                  />
                </div>
              </div>
            </FormSection>
          </TwoColumnForm>
        </TabsContent>
        
        {/* Job Application Tab */}
        <TabsContent value="job-application">
          <TwoColumnForm
            title="Job Application"
            description="Enter your employment details."
            id="job-application-form"
            onSubmit={handleSubmit}
            submitText="Submit Application"
            cancelText="Cancel"
            onCancel={() => alert("Cancelled")}
            isLoading={isLoading}
          >
            <FormSection title="Company Information">
              <EnhancedFormField
                name="company"
                label="Company"
                value={company}
                required
                showClear={true}
                onClear={clearCompany}
                startIcon={<Building className="h-4 w-4" />}
              >
                <Input
                  id="company"
                  placeholder="Enter company name"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="border-0 shadow-none"
                />
              </EnhancedFormField>
              
              <EnhancedFormField
                name="position"
                label="Position"
                value={position}
                required
                showClear={true}
                onClear={clearPosition}
                startIcon={<Briefcase className="h-4 w-4" />}
              >
                <Input
                  id="position"
                  placeholder="Enter job title"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="border-0 shadow-none"
                />
              </EnhancedFormField>
            </FormSection>
            
            <FormSection title="Job Details">
              <EnhancedFormField
                name="location"
                label="Location"
                value={location}
                optional
                showClear={true}
                onClear={clearLocation}
                startIcon={<MapPin className="h-4 w-4" />}
              >
                <Input
                  id="location"
                  placeholder="Enter location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="border-0 shadow-none"
                />
              </EnhancedFormField>
              
              <EnhancedFormField
                name="work-mode"
                label="Work Mode"
                required
              >
                <Select value={workMode} onValueChange={setWorkMode}>
                  <SelectTrigger className="border-0 shadow-none">
                    <SelectValue placeholder="Select work mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="onsite">On-site</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                    <SelectItem value="flexible">Flexible</SelectItem>
                  </SelectContent>
                </Select>
              </EnhancedFormField>
            </FormSection>
            
            <FormSection title="Additional Details">
              <EnhancedFormField
                name="start-date"
                label="Start Date"
                optional
                startIcon={<Calendar className="h-4 w-4" />}
              >
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border-0 shadow-none"
                />
              </EnhancedFormField>
              
              <EnhancedFormField
                name="salary"
                label="Salary Expectation"
                optional
                startIcon={<DollarSign className="h-4 w-4" />}
              >
                <div className="flex">
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="w-20 rounded-r-none border-0 shadow-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="CAD">CAD</SelectItem>
                      <SelectItem value="AUD">AUD</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    id="salary"
                    type="number"
                    placeholder="Enter amount"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    className="flex-1 rounded-l-none border-0 shadow-none"
                  />
                </div>
              </EnhancedFormField>
            </FormSection>
          </TwoColumnForm>
        </TabsContent>
        
        {/* Input States Tab */}
        <TabsContent value="input-states">
          <div className="max-w-xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Input States</CardTitle>
                <CardDescription>
                  Examples of different input states and variations.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Default Input */}
                <EnhancedFormField
                  name="default-input"
                  label="Default Input"
                  helpText="This is the default state of an input field."
                >
                  <Input
                    id="default-input"
                    placeholder="Default Input"
                    className="border-0 shadow-none"
                  />
                </EnhancedFormField>
                
                {/* Active Input */}
                <EnhancedFormField
                  name="active-input"
                  label="Active Input"
                  state="active"
                  helpText="This input is currently focused/active."
                >
                  <Input
                    id="active-input"
                    placeholder="Active Input"
                    className="border-0 shadow-none"
                    defaultValue="Active"
                  />
                </EnhancedFormField>
                
                {/* Filled Input */}
                <EnhancedFormField
                  name="filled-input"
                  label="Filled Input"
                  state="filled"
                  helpText="This input has a value entered."
                >
                  <Input
                    id="filled-input"
                    placeholder="Filled Input"
                    className="border-0 shadow-none"
                    defaultValue="Filled"
                  />
                </EnhancedFormField>
                
                {/* Error Input */}
                <EnhancedFormField
                  name="error-input"
                  label="Error Input"
                  error="This username is not available. Try a suggested username or enter a new one"
                  showResultCount={true}
                  resultCount={0}
                >
                  <Input
                    id="error-input"
                    placeholder="Error Input"
                    className="border-0 shadow-none"
                    defaultValue="Error"
                  />
                </EnhancedFormField>
                
                {/* Success Input */}
                <EnhancedFormField
                  name="success-input"
                  label="Success Input"
                  success="This username is available!"
                >
                  <Input
                    id="success-input"
                    placeholder="Success Input"
                    className="border-0 shadow-none"
                    defaultValue="Success"
                  />
                </EnhancedFormField>
                
                {/* Input with Help Text and Character Count */}
                <EnhancedFormField
                  name="help-text-input"
                  label="With Help Text"
                  helpText="This is some helpful text about this field."
                  showCharCount={true}
                  maxLength={60}
                >
                  <Input
                    id="help-text-input"
                    placeholder="With help text"
                    className="border-0 shadow-none"
                    defaultValue="With help text"
                    maxLength={60}
                  />
                </EnhancedFormField>
                
                {/* Input with Button */}
                <EnhancedFormField
                  name="button-input"
                  label="With Button"
                  endButton={
                    <Button size="icon" variant="ghost" className="h-8 w-8">
                      <Search className="h-4 w-4" />
                    </Button>
                  }
                >
                  <Input
                    id="button-input"
                    placeholder="With Button"
                    className="border-0 shadow-none"
                    defaultValue="With Button"
                  />
                </EnhancedFormField>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
