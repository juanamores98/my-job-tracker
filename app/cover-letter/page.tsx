"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Download, Plus, Trash2, Edit } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { CoverLetterData } from "@/lib/types"
import { getCoverLetters, addCoverLetter, updateCoverLetter, deleteCoverLetter } from "@/lib/storage"
import { useToast } from "@/hooks/use-toast"

export default function CoverLetterPage() {
  const [coverLetters, setCoverLetters] = useState<CoverLetterData[]>([])
  const [newLetterTitle, setNewLetterTitle] = useState("")
  const [newLetterCompany, setNewLetterCompany] = useState("")
  const [newLetterContent, setNewLetterContent] = useState("")
  const [editLetterId, setEditLetterId] = useState<string | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  // AI Generator fields
  const [jobTitle, setJobTitle] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [jobDescription, setJobDescription] = useState("")
  const [keySkills, setKeySkills] = useState("")
  const [tone, setTone] = useState("professional")
  const [generatedLetter, setGeneratedLetter] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  const { toast } = useToast()

  useEffect(() => {
    // Load cover letters from localStorage
    const loadedLetters = getCoverLetters()
    setCoverLetters(loadedLetters)
  }, [])

  const handleAddLetter = () => {
    if (!newLetterTitle.trim() || !newLetterContent.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title and content for your cover letter",
        variant: "destructive",
      })
      return
    }

    const newLetter: CoverLetterData = {
      id: Date.now().toString(),
      title: newLetterTitle,
      company: newLetterCompany,
      lastUpdated: new Date().toISOString().split("T")[0],
      content: newLetterContent,
    }

    const updatedLetters = addCoverLetter(newLetter)
    setCoverLetters(updatedLetters)
    setNewLetterTitle("")
    setNewLetterCompany("")
    setNewLetterContent("")
    setAddDialogOpen(false)

    toast({
      title: "Cover Letter Added",
      description: "Your cover letter has been added successfully",
    })
  }

  const handleEditLetter = () => {
    if (!editLetterId || !newLetterTitle.trim() || !newLetterContent.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title and content for your cover letter",
        variant: "destructive",
      })
      return
    }

    const updatedLetter: CoverLetterData = {
      id: editLetterId,
      title: newLetterTitle,
      company: newLetterCompany,
      lastUpdated: new Date().toISOString().split("T")[0],
      content: newLetterContent,
    }

    const updatedLetters = updateCoverLetter(updatedLetter)
    setCoverLetters(updatedLetters)
    setEditLetterId(null)
    setNewLetterTitle("")
    setNewLetterCompany("")
    setNewLetterContent("")
    setEditDialogOpen(false)

    toast({
      title: "Cover Letter Updated",
      description: "Your cover letter has been updated successfully",
    })
  }

  const handleDeleteLetter = (id: string) => {
    const updatedLetters = deleteCoverLetter(id)
    setCoverLetters(updatedLetters)

    toast({
      title: "Cover Letter Deleted",
      description: "Your cover letter has been deleted",
    })
  }

  const handleEditClick = (letter: CoverLetterData) => {
    setEditLetterId(letter.id)
    setNewLetterTitle(letter.title)
    setNewLetterCompany(letter.company || "")
    setNewLetterContent(letter.content)
    setEditDialogOpen(true)
  }

  const handleDownload = (letter: CoverLetterData) => {
    // Create a blob with the letter content
    const blob = new Blob([letter.content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = `${letter.title}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Cover Letter Downloaded",
      description: "Your cover letter has been downloaded",
    })
  }

  const handleGenerateLetter = () => {
    if (!jobTitle || !companyName || !jobDescription) {
      toast({
        title: "Error",
        description: "Please fill in the job title, company name, and job description",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

    // Simulate AI generation with a timeout
    setTimeout(() => {
      const generatedContent = generateCoverLetter(jobTitle, companyName, jobDescription, keySkills, tone)
      setGeneratedLetter(generatedContent)
      setIsGenerating(false)

      toast({
        title: "Cover Letter Generated",
        description: "Your cover letter has been generated successfully",
      })
    }, 2000)
  }

  const handleSaveGeneratedLetter = () => {
    if (!generatedLetter) return

    const newLetter: CoverLetterData = {
      id: Date.now().toString(),
      title: `${jobTitle} - ${companyName}`,
      company: companyName,
      lastUpdated: new Date().toISOString().split("T")[0],
      content: generatedLetter,
    }

    const updatedLetters = addCoverLetter(newLetter)
    setCoverLetters(updatedLetters)

    // Reset generator fields
    setJobTitle("")
    setCompanyName("")
    setJobDescription("")
    setKeySkills("")
    setTone("professional")
    setGeneratedLetter("")

    toast({
      title: "Cover Letter Saved",
      description: "Your generated cover letter has been saved",
    })
  }

  // Helper function to generate a cover letter based on inputs
  const generateCoverLetter = (
    jobTitle: string,
    companyName: string,
    jobDescription: string,
    keySkills: string,
    tone: string,
  ): string => {
    const currentDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    const skills = keySkills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean)

    const salutation = "Dear Hiring Manager,"
    let openingTone = ""
    let closingTone = ""

    switch (tone) {
      case "conversational":
        openingTone = "I'm excited to apply for"
        closingTone = "I'd love the opportunity to discuss how my skills align with your needs."
        break
      case "enthusiastic":
        openingTone = "I'm thrilled to apply for"
        closingTone =
          "I'm incredibly excited about the possibility of joining your team and would welcome the chance to discuss my qualifications further."
        break
      case "formal":
        openingTone = "I am writing to apply for"
        closingTone =
          "I would appreciate the opportunity to further discuss my qualifications and how they align with your organization's needs."
        break
      default: // professional
        openingTone = "I am writing to express my interest in"
        closingTone =
          "I welcome the opportunity to discuss how my background, skills, and accomplishments would be an asset to your organization."
    }

    let skillsSection = ""
    if (skills.length > 0) {
      skillsSection = `\n\nMy expertise in ${skills.slice(0, -1).join(", ")}${skills.length > 1 ? " and " + skills[skills.length - 1] : ""} aligns perfectly with the requirements outlined in the job description.`
    }

    return `${currentDate}

${salutation}

${openingTone} the ${jobTitle} position at ${companyName}. With my background and experience, I believe I would be a strong candidate for this role.${skillsSection}

Based on the job description, I understand you're looking for someone who can contribute to your team's success. Throughout my career, I've demonstrated the ability to [relevant achievement based on job description]. Additionally, I've [another relevant achievement or skill].

What particularly draws me to ${companyName} is [something specific about the company, like its mission, products, culture, or recent achievements]. I'm confident that my skills in problem-solving, collaboration, and [another relevant skill] would make me a valuable addition to your team.

${closingTone}

Thank you for considering my application.

Sincerely,
[Your Name]
[Your Phone]
[Your Email]`
  }

  return (
    <main className="flex min-h-screen flex-col">
      <DashboardHeader />
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Cover Letters</h2>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Create New
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Cover Letter</DialogTitle>
                <DialogDescription>Create a new cover letter from scratch</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newLetterTitle}
                      onChange={(e) => setNewLetterTitle(e.target.value)}
                      placeholder="e.g. Frontend Developer Cover Letter"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company">Company (Optional)</Label>
                    <Input
                      id="company"
                      value={newLetterCompany}
                      onChange={(e) => setNewLetterCompany(e.target.value)}
                      placeholder="e.g. Acme Inc."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={newLetterContent}
                    onChange={(e) => setNewLetterContent(e.target.value)}
                    placeholder="Write your cover letter here"
                    className="min-h-[300px]"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddLetter}>Save Cover Letter</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Edit Cover Letter</DialogTitle>
                <DialogDescription>Make changes to your cover letter</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-title">Title</Label>
                    <Input id="edit-title" value={newLetterTitle} onChange={(e) => setNewLetterTitle(e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-company">Company (Optional)</Label>
                    <Input
                      id="edit-company"
                      value={newLetterCompany}
                      onChange={(e) => setNewLetterCompany(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-content">Content</Label>
                  <Textarea
                    id="edit-content"
                    value={newLetterContent}
                    onChange={(e) => setNewLetterContent(e.target.value)}
                    className="min-h-[300px]"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEditLetter}>Update Cover Letter</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="my-letters" className="space-y-4">
          <TabsList>
            <TabsTrigger value="my-letters">My Cover Letters</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="generator">AI Generator</TabsTrigger>
          </TabsList>

          <TabsContent value="my-letters" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {coverLetters.map((letter) => (
                <Card key={letter.id}>
                  <CardHeader className="pb-2">
                    <CardTitle>{letter.title}</CardTitle>
                    <CardDescription>{letter.company || "General"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-[3/4] bg-slate-100 rounded-md flex items-center justify-center mb-2 p-4 text-xs text-slate-500 overflow-hidden">
                      <p className="line-clamp-[12]">{letter.content}</p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>Last edited: {letter.lastUpdated}</p>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" size="sm" onClick={() => handleDownload(letter)}>
                      <Download className="mr-2 h-4 w-4" /> Download
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditClick(letter)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteLetter(letter.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}

              <Card className="border-dashed flex flex-col items-center justify-center p-6">
                <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Upload Cover Letter</h3>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Drag and drop your file or click to browse
                </p>
                <Button onClick={() => setAddDialogOpen(true)}>Create New</Button>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Professional Template</CardTitle>
                  <CardDescription>Formal and traditional</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-[3/4] bg-slate-100 rounded-md flex items-center justify-center mb-2 p-4 text-xs text-slate-500 overflow-hidden">
                    <p className="line-clamp-[12]">
                      [Your Name]
                      <br />
                      [Your Address]
                      <br />
                      [City, State ZIP]
                      <br />
                      [Your Email]
                      <br />
                      [Your Phone]
                      <br />
                      <br />
                      [Date]
                      <br />
                      <br />
                      [Recipient's Name]
                      <br />
                      [Title]
                      <br />
                      [Company Name]
                      <br />
                      [Address]
                      <br />
                      [City, State ZIP]
                      <br />
                      <br />
                      Dear [Recipient's Name],
                      <br />
                      <br />I am writing to express my interest in the [Position] role at [Company Name], as advertised
                      on [Where You Found the Job]. With [X] years of experience in [Your Field/Industry] and a proven
                      track record of [Key Achievement], I am confident in my ability to make a valuable contribution to
                      your team.
                      <br />
                      <br />
                      [Middle paragraphs with specific examples of your relevant experience, achievements, and skills
                      that match the job requirements]
                      <br />
                      <br />I am particularly drawn to [Company Name] because of [Something Specific About the Company
                      That Interests You]. I am excited about the opportunity to bring my [Relevant Skills/Experience]
                      to your organization and help [Specific Goal or Challenge the Company is Facing].
                      <br />
                      <br />
                      Thank you for considering my application. I welcome the opportunity to further discuss how my
                      background, skills, and accomplishments would be an asset to [Company Name]. Please find my resume
                      attached for your review.
                      <br />
                      <br />
                      Sincerely,
                      <br />
                      <br />
                      [Your Name]
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={() => {
                      setNewLetterTitle("Professional Cover Letter")
                      setNewLetterContent(`[Your Name]
[Your Address]
[City, State ZIP]
[Your Email]
[Your Phone]

[Date]

[Recipient's Name]
[Title]
[Company Name]
[Address]
[City, State ZIP]

Dear [Recipient's Name],

I am writing to express my interest in the [Position] role at [Company Name], as advertised on [Where You Found the Job]. With [X] years of experience in [Your Field/Industry] and a proven track record of [Key Achievement], I am confident in my ability to make a valuable contribution to your team.

[Middle paragraphs with specific examples of your relevant experience, achievements, and skills that match the job requirements]

I am particularly drawn to [Company Name] because of [Something Specific About the Company That Interests You]. I am excited about the opportunity to bring my [Relevant Skills/Experience] to your organization and help [Specific Goal or Challenge the Company is Facing].

Thank you for considering my application. I welcome the opportunity to further discuss how my background, skills, and accomplishments would be an asset to [Company Name]. Please find my resume attached for your review.

Sincerely,

[Your Name]`)
                      setAddDialogOpen(true)
                    }}
                  >
                    Use Template
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Modern Template</CardTitle>
                  <CardDescription>Clean and concise</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-[3/4] bg-slate-100 rounded-md flex items-center justify-center mb-2 p-4 text-xs text-slate-500 overflow-hidden">
                    <p className="line-clamp-[12]">
                      [Your Name]
                      <br />
                      [Your Email] | [Your Phone] | [Your LinkedIn]
                      <br />
                      <br />
                      [Date]
                      <br />
                      <br />
                      Dear [Hiring Manager's Name/Hiring Team],
                      <br />
                      <br />
                      I'm excited to apply for the [Position] role at [Company Name]. As a [Your Current Position] with
                      expertise in [Key Skill 1], [Key Skill 2], and [Key Skill 3], I'm confident I can help [Company
                      Name] [Achieve Specific Goal].
                      <br />
                      <br />
                      In my current role at [Current/Previous Company], I:
                      <br />• [Achievement 1 with quantifiable results]
                      <br />• [Achievement 2 with quantifiable results]
                      <br />• [Achievement 3 with quantifiable results]
                      <br />
                      <br />
                      What excites me most about [Company Name] is [Specific Aspect of the Company]. I'm particularly
                      impressed by [Recent Company Achievement or Initiative], and I'd love to contribute to similar
                      successes.
                      <br />
                      <br />
                      I'd welcome the opportunity to discuss how my background aligns with your needs. Thank you for
                      your consideration.
                      <br />
                      <br />
                      Best regards,
                      <br />
                      <br />
                      [Your Name]
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={() => {
                      setNewLetterTitle("Modern Cover Letter")
                      setNewLetterContent(`[Your Name]
[Your Email] | [Your Phone] | [Your LinkedIn]

[Date]

Dear [Hiring Manager's Name/Hiring Team],

I'm excited to apply for the [Position] role at [Company Name]. As a [Your Current Position] with expertise in [Key Skill 1], [Key Skill 2], and [Key Skill 3], I'm confident I can help [Company Name] [Achieve Specific Goal].

In my current role at [Current/Previous Company], I:
• [Achievement 1 with quantifiable results]
• [Achievement 2 with quantifiable results]
• [Achievement 3 with quantifiable results]

What excites me most about [Company Name] is [Specific Aspect of the Company]. I'm particularly impressed by [Recent Company Achievement or Initiative], and I'd love to contribute to similar successes.

I'd welcome the opportunity to discuss how my background aligns with your needs. Thank you for your consideration.

Best regards,

[Your Name]`)
                      setAddDialogOpen(true)
                    }}
                  >
                    Use Template
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Creative Template</CardTitle>
                  <CardDescription>Stand out from the crowd</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-[3/4] bg-slate-100 rounded-md flex items-center justify-center mb-2 p-4 text-xs text-slate-500 overflow-hidden">
                    <p className="line-clamp-[12]">
                      [Your Name]
                      <br />
                      [Your Email] | [Your Phone] | [Your Portfolio]
                      <br />
                      <br />
                      [Date]
                      <br />
                      <br />
                      Hello [Company Name] Team!
                      <br />
                      <br />
                      When I discovered the [Position] opening at [Company Name], I couldn't help but feel it was the
                      perfect match for my skills and passion. As someone who [Personal Connection to the
                      Industry/Role], I've been following [Company Name]'s [Recent Project/Product/Service] with great
                      interest.
                      <br />
                      <br />
                      My journey as a [Your Profession] has equipped me with a unique perspective on [Industry/Field].
                      At [Current/Previous Company], I transformed [Specific Challenge] into [Positive Outcome] by
                      [Action You Took]. This experience taught me the value of [Important Skill/Lesson], which I'm
                      excited to bring to your team.
                      <br />
                      <br />
                      What sets me apart:
                      <br />• [Unique Skill/Approach 1]
                      <br />• [Unique Skill/Approach 2]
                      <br />• [Unique Skill/Approach 3]
                      <br />
                      <br />
                      I'm particularly drawn to [Company Name]'s commitment to [Company Value/Mission] and would be
                      thrilled to contribute to [Specific Project/Goal]. I've attached my resume and
                      [Portfolio/Additional Materials] that showcase how my creative approach has delivered results.
                      <br />
                      <br />
                      I'd love to discuss how my [Key Strengths] can help [Company Name] continue to [Company Goal].
                      Thank you for considering my application.
                      <br />
                      <br />
                      Creatively yours,
                      <br />
                      <br />
                      [Your Name]
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={() => {
                      setNewLetterTitle("Creative Cover Letter")
                      setNewLetterContent(`[Your Name]
[Your Email] | [Your Phone] | [Your Portfolio]

[Date]

Hello [Company Name] Team!

When I discovered the [Position] opening at [Company Name], I couldn't help but feel it was the perfect match for my skills and passion. As someone who [Personal Connection to the Industry/Role], I've been following [Company Name]'s [Recent Project/Product/Service] with great interest.

My journey as a [Your Profession] has equipped me with a unique perspective on [Industry/Field]. At [Current/Previous Company], I transformed [Specific Challenge] into [Positive Outcome] by [Action You Took]. This experience taught me the value of [Important Skill/Lesson], which I'm excited to bring to your team.

What sets me apart:
• [Unique Skill/Approach 1]
• [Unique Skill/Approach 2]
• [Unique Skill/Approach 3]

I'm particularly drawn to [Company Name]'s commitment to [Company Value/Mission] and would be thrilled to contribute to [Specific Project/Goal]. I've attached my resume and [Portfolio/Additional Materials] that showcase how my creative approach has delivered results.

I'd love to discuss how my [Key Strengths] can help [Company Name] continue to [Company Goal]. Thank you for considering my application.

Creatively yours,

[Your Name]`)
                      setAddDialogOpen(true)
                    }}
                  >
                    Use Template
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="generator" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>AI Cover Letter Generator</CardTitle>
                <CardDescription>
                  Create a personalized cover letter based on your resume and the job description
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="job-title">Job Title</Label>
                  <Input
                    id="job-title"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Frontend Developer"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input
                    id="company-name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Acme Inc."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="job-description">Job Description</Label>
                  <Textarea
                    id="job-description"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the job description here"
                    className="min-h-[120px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="key-skills">Key Skills to Highlight</Label>
                  <Input
                    id="key-skills"
                    value={keySkills}
                    onChange={(e) => setKeySkills(e.target.value)}
                    placeholder="e.g. React, TypeScript, Team Leadership"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tone">Tone</Label>
                  <select
                    id="tone"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                  >
                    <option value="professional">Professional</option>
                    <option value="conversational">Conversational</option>
                    <option value="enthusiastic">Enthusiastic</option>
                    <option value="formal">Formal</option>
                  </select>
                </div>

                {generatedLetter && (
                  <div className="space-y-2 border rounded-md p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Generated Cover Letter</h3>
                      <Button variant="outline" size="sm" onClick={handleSaveGeneratedLetter}>
                        Save Letter
                      </Button>
                    </div>
                    <Textarea
                      value={generatedLetter}
                      onChange={(e) => setGeneratedLetter(e.target.value)}
                      className="min-h-[300px]"
                    />
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={handleGenerateLetter} disabled={isGenerating}>
                  {isGenerating ? "Generating..." : "Generate Cover Letter"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
