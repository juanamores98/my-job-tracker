"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react" // Added useRef
import { Plus, Star, X, Calendar, MapPin, Link2, Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ColumnType, JobData, JobState } from "@/lib/types"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { SkillSelector } from "./skill-selector"
import { analyzeJobDescription } from "@/lib/job-analyzer"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { getJobStates } from "@/lib/storage"
import { EnhancedJobExtractor } from "./enhanced-job-extractor"
import { MapSearch } from "./map-search"
import { useLanguage } from "@/lib/i18n"
import { KeywordSuggestions } from "./keyword-suggestions"
import { EnhancedTagInput } from "./enhanced-tag-input"

interface AddJobModalProps {
  onAddJob: (job: JobData) => void
  initialStatus?: string
  buttonVariant?: "default" | "outline" | "secondary" | "ghost" | "link"
  buttonSize?: "default" | "sm" | "lg" | "icon"
  buttonClassName?: string
  buttonIcon?: React.ReactNode
  buttonLabel?: string
  open?: boolean
  onClose?: () => void
  jobStates?: JobState[]
}

export function AddJobModal({
  onAddJob,
  initialStatus,
  buttonVariant = "default",
  buttonSize = "default",
  buttonClassName = "",
  buttonIcon,
  buttonLabel = "Add Job",
  open: controlledOpen,
  onClose,
  jobStates: propJobStates,
}: AddJobModalProps) {
  const [open, setOpen] = useState(false)
  const [newTag, setNewTag] = useState("")
  const [activeTab, setActiveTab] = useState("details")
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [jobStates, setJobStates] = useState<JobState[]>([])
  const [showLocationSearch, setShowLocationSearch] = useState(false)
  const [isScrapingUrl, setIsScrapingUrl] = useState(false)
  const [formData, setFormData] = useState<Partial<JobData>>({
    company: "",
    position: "",
    location: "",
    salary: "",
    status: initialStatus || "wishlist",
    priority: 3,
    tags: [],
    description: "",
    url: "",
    date: new Date().toISOString().split("T")[0],
    workMode: "remote",
  })
  const { toast } = useToast()
  const { t } = useLanguage()
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)


  // Handle controlled open state
  useEffect(() => {
    if (controlledOpen !== undefined) {
      setOpen(controlledOpen)
    }
  }, [controlledOpen])

  // Load job states when modal opens
  const handleOpenChange = (isOpen: boolean) => {
    if (controlledOpen === undefined) {
      setOpen(isOpen)
    }

    if (onClose && !isOpen) {
      onClose()
    }

    if (isOpen) {
      // Use prop job states if provided, otherwise load from storage
      const states = propJobStates || getJobStates()
      setJobStates(states)

      // Set default status to initialStatus, or the first state with isDefault=true, or the first state
      const defaultState = initialStatus
        ? states.find((s) => s.id === initialStatus)
        : states.find((s) => s.isDefault) || states[0]

      if (defaultState) {
        setFormData((prev) => ({
          ...prev,
          status: defaultState.id,
        }))
      }
    } else {
      // Reset form when closing
      setFormData({
        company: "",
        position: "",
        location: "",
        salary: "",
        status: initialStatus || "wishlist",
        priority: 3,
        tags: [],
        description: "",
        url: "",
        date: new Date().toISOString().split("T")[0],
        workMode: "remote",
      })
      setDate(new Date())
      setActiveTab("details")
      setNewTag("")
      setShowLocationSearch(false)
      setIsScrapingUrl(false)
    }
  }

  // Debounced auto-tag generation from description
  useEffect(() => {
    if (formData.description && formData.description.length > 50) { // Only analyze if description is somewhat substantial
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
      debounceTimeoutRef.current = setTimeout(() => {
        const extracted = analyzeJobDescription(formData.description!)
        const existingTags = formData.tags || []
        const newAutoTags = Array.from(
          new Set([...extracted.technicalSkills, ...extracted.softSkills, ...extracted.requirements])
        )
        const allTags = Array.from(new Set([...existingTags, ...newAutoTags]))
        
        if (allTags.length > existingTags.length) {
          setFormData((prev) => ({
            ...prev,
            tags: allTags,
          }))
          // toast({ title: t("skillsAutoDetected"), description: t("relevantSkillsAddedFromDescription") });
        }
      }, 1500) // 1.5 seconds debounce
    }

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [formData.description, formData.tags, t])


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
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

  const handleScrapeUrl = async () => {
    if (!formData.url) {
      toast({
        title: t("error"),
        description: t("pleaseEnterValidUrl"),
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
          title: t("error"),
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

        // Switch to description tab
        setActiveTab("description")

        toast({
          title: t("descriptionExtracted"),
          description: t("jobDescriptionExtractedSuccessfully"),
        })
      } else {
        toast({
          title: t("noResults"),
          description: t("couldNotExtractJobDescription"),
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error scraping job URL:", error)
      toast({
        title: t("error"),
        description: t("errorProcessingUrl"),
        variant: "destructive",
      })
    } finally {
      setIsScrapingUrl(false)
    }
  }

  const handleAnalyzeDescription = () => {
    if (!formData.description) return

    const { technicalSkills, softSkills, requirements } = analyzeJobDescription(formData.description)

    // Combine all extracted tags with existing tags
    const existingTags = formData.tags || []
    const allTags = Array.from(new Set([...existingTags, ...technicalSkills, ...softSkills, ...requirements]))

    setFormData((prev) => ({
      ...prev,
      tags: allTags,
    }))

    // Switch to skills tab
    setActiveTab("skills")

    toast({
      title: t("analysisComplete"),
      description: t("foundSkillsAndRequirements", {
        technicalCount: technicalSkills.length,
        softCount: softSkills.length,
        requirementsCount: requirements.length,
      }),
    })
  }

  const handleAddKeywords = (keywords: string[]) => {
    const existingTags = formData.tags || []
    const allTags = Array.from(new Set([...existingTags, ...keywords]))

    setFormData((prev) => ({
      ...prev,
      tags: allTags,
    }))
  }

  const handleExtractedData = (extractedData: Partial<JobData>) => {
    setFormData((prev) => ({
      ...prev,
      ...extractedData,
    }))

    // If description was extracted, switch to description tab
    if (extractedData.description) {
      setActiveTab("description")
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newJob: JobData = {
      id: Date.now().toString(),
      company: formData.company || "",
      position: formData.position || "",
      location: formData.location,
      salary: formData.salary,
      date: formData.date,
      status: formData.status as ColumnType,
      notes: formData.notes,
      url: formData.url,
      priority: formData.priority,
      tags: formData.tags,
      description: formData.description,
      workMode: formData.workMode,
    }

    onAddJob(newJob)
    setFormData({
      company: "",
      position: "",
      location: "",
      salary: "",
      status: initialStatus || "wishlist",
      priority: 3,
      tags: [],
      description: "",
      url: "",
      date: new Date().toISOString().split("T")[0],
      workMode: "remote",
    })
    setDate(new Date())

    if (controlledOpen === undefined) {
      setOpen(false)
    } else if (onClose) {
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {controlledOpen === undefined && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DialogTrigger asChild>
                <Button variant={buttonVariant} size={buttonSize} className={buttonClassName}>
                  {buttonIcon || <Plus className="mr-2 h-4 w-4" />}
                  {buttonLabel}
                </Button>
              </DialogTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("addNewJobApplication")}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

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
              <DialogTitle>{t("addNewJobApplication")}</DialogTitle>
              <DialogDescription>{t("enterJobApplicationDetails")}</DialogDescription>
            </div>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-full"
                  onClick={() => handleOpenChange(false)}
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
              <div className="flex justify-end">
                <EnhancedJobExtractor
                  onExtracted={handleExtractedData}
                  initialUrl={formData.url}
                  buttonLabel={t("extractFromUrl")}
                  buttonVariant="outline"
                  buttonSize="sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company">{t("company")} *</Label>
                  <Input id="company" name="company" value={formData.company} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">{t("position")} *</Label>
                  <Input id="position" name="position" value={formData.position} onChange={handleChange} required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">{t("location")}</Label>
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
                      aria-label={t("searchLocation") || "Search location"}
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
                  <Label htmlFor="salary">{t("salary")}</Label>
                  <Input
                    id="salary"
                    name="salary"
                    value={formData.salary || ""}
                    onChange={handleChange}
                    placeholder={t("salaryPlaceholder")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">{t("status")} *</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Select
                          name="status"
                          value={formData.status}
                          onValueChange={(value) => handleSelectChange("status", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t("selectStatus")} />
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
                        <p>{t("selectTheCurrentStatusOfYourApplication")}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateApplied">{t("dateApplied")}</Label> {/* Changed label */}
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal" id="dateApplied">
                          <Calendar className="mr-2 h-4 w-4" />
                          {date ? format(date, "PPP") : <span>{t("selectDateApplied")}</span>}
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
                  <Label htmlFor="workMode">{t("workMode")}</Label>
                  <Select
                    name="workMode"
                    value={formData.workMode}
                    onValueChange={(value) => handleSelectChange("workMode", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("selectWorkMode")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="remote">{t("remote")}</SelectItem>
                      <SelectItem value="onsite">{t("onsite")}</SelectItem>
                      <SelectItem value="hybrid">{t("hybrid")}</SelectItem>
                      <SelectItem value="flexible">{t("flexible")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url">{t("jobUrl")}</Label>
                  <div className="flex gap-2">
                    <Input
                      id="url"
                      name="url"
                      value={formData.url || ""}
                      onChange={handleChange}
                      placeholder={t("jobUrlPlaceholder")}
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
                            <span className="ml-2">{t("extract")}</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p>{t("attemptExtractFromUrlTooltip")}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">{t("priority")}</Label>
                  <div className="flex items-center space-x-1 h-10">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <TooltipProvider key={value}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              aria-label={`${t("priority")} ${value}`}
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
                            <p>
                              {t("priority")} {value}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">{t("notes")}</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes || ""}
                    onChange={handleChange}
                    placeholder={t("notesPlaceholder")}
                    className="min-h-[80px]"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="description" className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="description">{t("jobDescription")}</Label>
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
                          {t("analyze")}
                        </Button>
                      </TooltipTrigger>
                        <TooltipContent side="top">
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
                  placeholder={t("pasteJobDescriptionHere")}
                  className="min-h-[300px]"
                />
                <p className="text-xs text-muted-foreground">{t("pasteFullJobDescription")}</p>

                {/* Keyword suggestions as user types */}
                <KeywordSuggestions text={formData.description || ""} onAddKeywords={handleAddKeywords} />
              </div>
            </TabsContent>

            <TabsContent value="skills" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("skillsKeywordsAndRequirements")}</Label>
                  <EnhancedTagInput
                    tags={formData.tags || []}
                    onTagsChange={(tags) => setFormData({ ...formData, tags })}
                    placeholder={t("addCustomTagPlaceholder")}
                  />
                   <p className="text-xs text-muted-foreground">
                    {t("addRelevantSkillsInfo")}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>{t("addSkillsQuickly")}</Label>
                  <SkillSelector onSkillsSelected={handleAddKeywords} />
                </div>
              </div>
            </TabsContent>

            <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit">{t("saveJob")}</Button>
            </DialogFooter>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
