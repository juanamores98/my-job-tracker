"use client"

import { cn } from "@/lib/utils"

import type React from "react"

import { useState, useEffect, useRef } from "react" // Added useRef
import { X, Calendar, MapPin, Star, Link2, Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge" // Re-add Badge import
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { JobData, JobState } from "@/lib/types"
import { EnhancedTagInput } from "./enhanced-tag-input" // Import EnhancedTagInput
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import { MapSearch } from "./map-search"
import { analyzeJobDescription } from "@/lib/job-analyzer"
import { useToast } from "@/hooks/use-toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getJobStates } from "@/lib/storage"
import { useLanguage } from "@/lib/i18n" // Import useLanguage

interface EditJobModalProps {
  job: JobData
  open: boolean
  onOpenChange: (open: boolean) => void
  onJobUpdate: (updatedJob: JobData) => void
  jobStates?: JobState[]
}

export function EditJobModal({ job, open, onOpenChange, onJobUpdate, jobStates: propJobStates }: EditJobModalProps) {
  const [formData, setFormData] = useState<JobData>({ ...job })
  const [showLocationSearch, setShowLocationSearch] = useState(false)
  const [date, setDate] = useState<Date | undefined>(job.date ? new Date(job.date) : undefined)
  const [activeTab, setActiveTab] = useState("details")
  const [jobStates, setJobStates] = useState<JobState[]>([])
  const [extractedTags, setExtractedTags] = useState<{
    technicalSkills: string[]
    softSkills: string[]
    requirements: string[]
  }>({
    technicalSkills: [],
    softSkills: [],
    requirements: [],
  })
  const [isScrapingUrl, setIsScrapingUrl] = useState(false)
  const { toast } = useToast()
  const { t } = useLanguage() // Initialize t function
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Update form data when job changes
  useEffect(() => {
    setFormData({ ...job })
    setDate(job.date ? new Date(job.date) : undefined)
    // Clear extracted tags when job changes to avoid showing old extracted tags for a new job
    setExtractedTags({ technicalSkills: [], softSkills: [], requirements: [] })
  }, [job])

  // Load job states when modal opens
  useEffect(() => {
    if (open) {
      // Use prop job states if provided, otherwise load from storage
      if (propJobStates) {
        setJobStates(propJobStates)
      } else {
        const states = getJobStates()
        setJobStates(states)
      }
    }
  }, [open, propJobStates])

  // Debounced auto-tag generation from description
  useEffect(() => {
    if (formData.description && formData.description.length > 50) { // Only analyze if description is somewhat substantial
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
      debounceTimeoutRef.current = setTimeout(() => {
        const extracted = analyzeJobDescription(formData.description!) // formData.description is checked
        // We only want to auto-add, not replace manually set extractedTags state for UI display
        const existingTags = formData.tags || []
        const newAutoTags = Array.from(
          new Set([...extracted.technicalSkills, ...extracted.softSkills, ...extracted.requirements])
        )
        const allTags = Array.from(new Set([...existingTags, ...newAutoTags]))
        
        // Only update if new tags were found to avoid unnecessary re-renders
        if (allTags.length > existingTags.length) {
          setFormData((prev) => ({
            ...prev,
            tags: allTags,
          }))
          // Optionally, show a subtle toast that tags were auto-added
          // toast({ title: "Skills Auto-detected", description: "Relevant skills have been added from the description." });
        }
      }, 1500) // 1.5 seconds debounce
    }

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [formData.description, formData.tags]) // Rerun if description or existing tags change

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleTagsChange = (newTags: string[]) => {
    setFormData((prev) => ({ ...prev, tags: newTags }))
  }

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    if (selectedDate) {
      setFormData((prev) => ({
        ...prev,
        date: format(selectedDate, "yyyy-MM-dd"),
      }))
    }
  }

  const handleLocationSelect = (location: string) => {
    setFormData((prev) => ({
      ...prev,
      location,
    }))
    setShowLocationSearch(false)
  }

  const handlePriorityChange = (priority: number) => {
    setFormData((prev) => ({
      ...prev,
      priority,
    }))
  }

  // Function to extract job description from URL
  const handleScrapeUrl = async () => {
    if (!formData.url) {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive",
      })
      return
    }

    setIsScrapingUrl(true)

    try {
      const response = await fetch("/api/job-scraper", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: formData.url }),
      })

      const data = await response.json()

      if (data.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        })
        return
      }

      if (data.description) {
        setFormData((prev) => ({
          ...prev,
          description: data.description,
        }))

        // Automatically switch to description tab
        setActiveTab("description")

        toast({
          title: "Description Extracted",
          description: "The job description has been extracted successfully",
        })
      } else {
        toast({
          title: "No Results",
          description: "Could not extract job description from this URL",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error scraping job URL:", error)
      toast({
        title: "Error",
        description: "An error occurred while processing the URL",
        variant: "destructive",
      })
    } finally {
      setIsScrapingUrl(false)
    }
  }

  const handleAnalyzeDescription = () => {
    if (!formData.description) return

    const extracted = analyzeJobDescription(formData.description)
    setExtractedTags(extracted)

    // Combine all extracted tags with existing tags
    const existingTags = formData.tags || []
    const allTags = Array.from(
      new Set([...existingTags, ...extracted.technicalSkills, ...extracted.softSkills, ...extracted.requirements]),
    )

    setFormData((prev) => ({
      ...prev,
      tags: allTags,
    }))

    toast({
      title: "Analysis Completed",
      description: `Found ${extracted.technicalSkills.length} technical skills, ${extracted.softSkills.length} soft skills, and ${extracted.requirements.length} requirements`,
    })
  }

  const handleAddSkills = (skills: string[]) => {
    const existingTags = formData.tags || []
    const allTags = Array.from(new Set([...existingTags, ...skills]))

    setFormData((prev) => ({
      ...prev,
      tags: allTags,
    }))
  }

  const handleAddExtractedCategory = (category: "technicalSkills" | "softSkills" | "requirements") => {
    const existingTags = formData.tags || []
    const newTags = extractedTags[category]
    const allTags = Array.from(new Set([...existingTags, ...newTags]))

    setFormData((prev) => ({
      ...prev,
      tags: allTags,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onJobUpdate(formData)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            {activeTab !== "details" && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 mr-1" onClick={() => setActiveTab("details")}>
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>{t("backToJobDetailsTooltip")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <div>
              <DialogTitle>{t("editJobDetails")}</DialogTitle> {/* Assuming this key exists or will be added */}
              <DialogDescription>{t("updateJobApplicationDetails")}</DialogDescription> {/* Assuming this key exists or will be added */}
            </div>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-full"
                  onClick={() => onOpenChange(false)}
                  aria-label={t("closeDialogTooltip")}
                >
                  <X className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{t("closeDialogTooltip")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="details">{t("jobDetails")}</TabsTrigger>
            <TabsTrigger value="description">{t("description")}</TabsTrigger>
            <TabsTrigger value="skills">{t("skillsKeywordsAndRequirements")}</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="space-y-4">
            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Company *</Label>
                  <Input id="company" name="company" value={formData.company} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Position *</Label>
                  <Input id="position" name="position" value={formData.position} onChange={handleChange} required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="relative flex-1">
                    <Input
                      id="location"
                      name="location"
                      value={formData.location || ""}
                      onChange={handleChange}
                      className="pr-8"
                    />
                    <button
                      type="button"
                      aria-label="Search location"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowLocationSearch(true)}
                    >
                      <MapPin className="h-4 w-4" />
                    </button>
                  </div>
                  {showLocationSearch && (
                    <MapSearch onLocationSelect={handleLocationSelect} onClose={() => setShowLocationSearch(false)} />
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salary">Salary</Label>
                  <Input
                    id="salary"
                    name="salary"
                    value={formData.salary || ""}
                    onChange={handleChange}
                    placeholder="e.g. $80k - $100k"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Select
                          name="status"
                          value={formData.status}
                          onValueChange={(value) => handleSelectChange("status", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            {jobStates.map((state) => (
                              <SelectItem key={state.id} value={state.id}>
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: state.color }} />
                                  <span>{state.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>Select the current status of your application</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateApplied">Date Applied</Label> {/* Changed label */}
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal" id="dateApplied">
                          <Calendar className="mr-2 h-4 w-4" />
                          {date ? format(date, "PPP") : <span>Select date applied</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent mode="single" selected={date} onSelect={handleDateSelect} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="workMode">Work Mode</Label>
                  <Select
                    name="workMode"
                    value={formData.workMode || "remote"}
                    onValueChange={(value) => handleSelectChange("workMode", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select work mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="remote">Remote</SelectItem>
                      <SelectItem value="onsite">On-site</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                      <SelectItem value="flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url">Job URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="url"
                      name="url"
                      value={formData.url || ""}
                      onChange={handleChange}
                      placeholder="https://example.com/job"
                      className="flex-1"
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleScrapeUrl}
                            disabled={isScrapingUrl || !formData.url}
                          >
                            {isScrapingUrl ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Link2 className="h-4 w-4" />
                            )}
                            <span className="ml-2">Extract</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t("attemptExtractFromUrlTooltip")}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <div className="flex items-center space-x-1 h-10">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <TooltipProvider key={value}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              aria-label={`Set priority to ${value}`}
                              onClick={() => handlePriorityChange(value)}
                              className="focus:outline-none"
                            >
                              <Star
                                className={cn(
                                  "h-6 w-6 transition-colors",
                                  value <= (formData.priority || 0)
                                    ? "text-yellow-400 fill-yellow-400"
                                    : "text-gray-300 hover:text-yellow-200",
                                )}
                              />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Priority {value}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes || ""}
                    onChange={handleChange}
                    placeholder="Add any notes about this application"
                    className="min-h-[80px]"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="description" className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="description">Job Description</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAnalyzeDescription}
                          disabled={!formData.description}
                        >
                          Analyze
                        </Button>
                      </TooltipTrigger>
                        <TooltipContent>
                          <p>{t("analyzeDescriptionTooltip")}</p>
                        </TooltipContent>
                      </Tooltip>
                  </TooltipProvider>
                </div>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description || ""}
                  onChange={handleChange}
                  placeholder="Paste the job description here"
                  className="min-h-[300px]"
                />
                <p className="text-xs text-muted-foreground">
                  Paste the full job description to automatically extract skills and requirements.
                </p>
              </div>

              {(extractedTags.technicalSkills.length > 0 ||
                extractedTags.softSkills.length > 0 ||
                extractedTags.requirements.length > 0) && (
                <div className="border rounded-md p-4 space-y-4">
                  <h3 className="text-sm font-medium">Extracted Skills and Requirements</h3>

                  {extractedTags.technicalSkills.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-medium">
                          Technical Skills ({extractedTags.technicalSkills.length})
                        </h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddExtractedCategory("technicalSkills")}
                        >
                          Add All
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {extractedTags.technicalSkills.map((skill, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {extractedTags.softSkills.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-medium">Soft Skills ({extractedTags.softSkills.length})</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddExtractedCategory("softSkills")}
                        >
                          Add All
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {extractedTags.softSkills.map((skill, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {extractedTags.requirements.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-medium">Requirements ({extractedTags.requirements.length})</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddExtractedCategory("requirements")}
                        >
                          Add All
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {extractedTags.requirements.map((req, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {req}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="skills" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tags">{t("skillsKeywordsAndRequirements")}</Label>
                <EnhancedTagInput
                  tags={formData.tags || []}
                  onTagsChange={handleTagsChange}
                  placeholder={t("addCustomTagPlaceholder")}
                />
                <p className="text-xs text-muted-foreground">
                  {t("addRelevantSkillsInfo")} {/* Assuming this key exists or will be added */}
                </p>
              </div>
            </TabsContent>

            <div className="pt-4 flex justify-end">
              <Button type="submit">{t("saveChanges")}</Button> {/* Assuming this key exists or will be added */}
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
