"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CalendarDays, CheckCircle2, Lock, UserPlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ProfileImageUploader } from "@/components/profile-image-uploader"
import { EnhancedTagInput } from "@/components/enhanced-tag-input"
import { useAuth } from "@/lib/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

export default function RegisterPage() {
  const { register } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
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
    password: "",
    confirmPassword: "",
  })
  const [skills, setSkills] = useState<string[]>([])
  const [studies, setStudies] = useState<string[]>([])
  const [photo, setPhoto] = useState<string | undefined>(undefined)
  const [remember, setRemember] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!formData.fullName || !formData.username || !formData.email) {
      toast({
        title: "Missing information",
        description: "Please provide your name, username and email.",
        variant: "destructive",
      })
      return
    }

    if (formData.password.length < 6) {
      toast({
        title: "Password too short",
        description: "Please choose a password with at least 6 characters.",
        variant: "destructive",
      })
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please confirm your password before continuing.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      await register({
        fullName: formData.fullName,
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        birthday: formData.birthday,
        preferences: formData.preferences,
        university: formData.university,
        school: formData.school,
        highSchool: formData.highSchool,
        about: formData.about,
        skills,
        studies,
        photo,
        password: formData.password,
        remember,
      })

      toast({
        title: "Account created",
        description: "Your profile is ready. Welcome aboard!",
      })
      router.replace("/")
    } catch (error: any) {
      toast({
        title: "Unable to register",
        description: error?.message || "Please review your details and try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted px-4 py-10">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserPlus className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Create your job hunting workspace</h1>
          <p className="text-sm text-muted-foreground">
            Build a personalised board with your details, job preferences and qualifications. Everything stays on your device.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lock className="h-5 w-5 text-primary" />
                Account security
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Jane Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" name="username" value={formData.username} onChange={handleChange} placeholder="janedoe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 555 0101"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthday">Birthday</Label>
                <Input id="birthday" name="birthday" type="date" value={formData.birthday} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label>Profile photo</Label>
                <ProfileImageUploader value={photo} onChange={setPhoto} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarDays className="h-5 w-5 text-primary" />
                Background & preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="preferences">Work preferences</Label>
                <Textarea
                  id="preferences"
                  name="preferences"
                  value={formData.preferences}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Remote-first teams, product companies, agile environments..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="about">About you</Label>
                <Textarea
                  id="about"
                  name="about"
                  value={formData.about}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Short introduction, passions or experience highlights"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Skills</Label>
                <EnhancedTagInput
                  tags={skills}
                  onTagsChange={setSkills}
                  placeholder="Add skills like React, communication, leadership"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Studies & education focus</Label>
                <EnhancedTagInput
                  tags={studies}
                  onTagsChange={setStudies}
                  placeholder="Computer Science, MBA, UX bootcamp..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="university">University</Label>
                <Input id="university" name="university" value={formData.university} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="school">School</Label>
                <Input id="school" name="school" value={formData.school} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="highSchool">High school</Label>
                <Input id="highSchool" name="highSchool" value={formData.highSchool} onChange={handleChange} />
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-background/80 p-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-1 h-5 w-5 text-primary" />
              <p className="text-sm text-muted-foreground">
                Your details are stored locally in your browser using cookies and local storage. You can export everything at any
                time.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="remember" checked={remember} onCheckedChange={(checked) => setRemember(Boolean(checked))} />
              <Label htmlFor="remember" className="text-sm">
                Keep me signed in on this device
              </Label>
            </div>
            <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting}>
              {isSubmitting ? "Creating account..." : "Create account"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?
              <Link href="/login" className="ml-1 font-medium text-primary underline-offset-4 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
