"use client"

import { useState, useEffect, useRef } from "react"
import { z } from "zod"
import {
  Building2,
  Briefcase,
  MapPin,
  Link,
  Calendar,
  DollarSign,
  Star,
  Tags,
  FileText,
  StickyNote,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Globe,
  Clock,
  Send,
  Save,
  X,
  Plus,
  Edit3,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format, parseISO } from "date-fns"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { getJobStates } from "@/lib/storage"
import { useLanguage } from "@/lib/i18n"
import { useMediaQuery } from "@/hooks/use-media-query"
import type { ColumnType, JobData, JobState, WorkMode } from "@/lib/types"

// Zod Schema for Job Validation
const jobSchema = z.object({
  company: z.string().min(1, "Company name is required"),
  position: z.string().min(1, "Position is required"),
  location: z.string().optional(),
  url: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  status: z.string().optional().default("wishlist"),
  date: z.string().optional(),
  applyDate: z.string().optional(),
  followUpDate: z.string().optional(),

  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  salaryCurrency: z.string().optional().default("USD"),

  workMode: z.enum(["remote", "onsite", "hybrid", "flexible"]).optional().default("onsite"),
  priority: z.number().min(0).max(5).optional(),
  tags: z.array(z.string()).optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
})

interface ModernJobModalProps {
  onAddJob: (job: JobData) => void
  onEditJob?: (job: JobData) => void
  jobToEdit?: JobData | null
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

const initialFormData: Partial<JobData> = {
  company: "",
  position: "",
  location: "",
  salaryMin: undefined,
  salaryMax: undefined,
  salaryCurrency: "USD",
  status: "wishlist", // Default to wishlist
  priority: 3,
  tags: [],
  description: "",
  notes: "",
  url: "",
  date: new Date().toISOString().split("T")[0],
  applyDate: new Date().toISOString().split("T")[0],
  workMode: "onsite", // Default to onsite
}

// Helper to convert string to number or undefined
const toNumberOrUndefined = (val: unknown): number | undefined => {
  if (val === undefined || val === null || val === "") return undefined;
  const num = Number(val);
  return isNaN(num) ? undefined : num;
};

export function ModernJobModal({
  onAddJob,
  onEditJob,
  jobToEdit,
  initialStatus,
  buttonVariant = "default",
  buttonSize = "default",
  buttonClassName = "",
  buttonIcon,
  buttonLabel = "Add Job",
  open: controlledOpen,
  onClose,
  jobStates: propJobStates,
}: ModernJobModalProps) {
  const [open, setOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [formData, setFormData] = useState<Partial<JobData>>(initialFormData)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({})
  const [activeTab, setActiveTab] = useState("basic")
  const [jobStates, setJobStates] = useState<JobState[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [tagInput, setTagInput] = useState("")
  const [showSalaryRange, setShowSalaryRange] = useState(false)

  // Predefined locations for autocomplete
  const predefinedLocations = [
    "New York, USA",
    "San Francisco, USA",
    "London, UK",
    "Berlin, Germany",
    "Tokyo, Japan",
    "Sydney, Australia",
    "Toronto, Canada",
    "Paris, France",
    "Singapore",
    "Remote"
  ]

  const firstInputRef = useRef<HTMLInputElement>(null)
  const isMobile = useMediaQuery("(max-width: 768px)")
  const { toast } = useToast()
  const { t } = useLanguage()

  // Load job states
  useEffect(() => {
    if (propJobStates) {
      setJobStates(propJobStates)
    } else {
      setJobStates(getJobStates())
    }
  }, [propJobStates])

  // Handle controlled open state
  useEffect(() => {
    if (controlledOpen !== undefined) {
      setOpen(controlledOpen)
    }
  }, [controlledOpen])

  // Initialize form data when editing
  useEffect(() => {
    if (jobToEdit) {
      setIsEditMode(true)
      setFormData({
        ...initialFormData,
        ...jobToEdit,
      })
    } else {
      setIsEditMode(false)
      setFormData({
        ...initialFormData,
        status: initialStatus || "wishlist",
      })
    }
  }, [jobToEdit, initialStatus])

  // Focus first input when modal opens
  useEffect(() => {
    if (open && firstInputRef.current) {
      setTimeout(() => {
        firstInputRef.current?.focus()
      }, 100)
    }
  }, [open])

  // Handle open state changes
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen && onClose) {
      onClose()
    }
  }

  // Form change handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    validateField(name, value)
    setTouchedFields((prev) => ({ ...prev, [name]: true }))
  }

  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const numValue = value === "" ? undefined : Number(value)
    setFormData((prev) => ({ ...prev, [name]: numValue }))
    validateField(name, numValue)
    setTouchedFields((prev) => ({ ...prev, [name]: true }))
  }

  const handleSelectChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    validateField(name, value)
    setTouchedFields((prev) => ({ ...prev, [name]: true }))
  }

  const handleDateChange = (name: string, date: Date | undefined) => {
    const dateString = date ? format(date, "yyyy-MM-dd") : undefined
    setFormData((prev) => ({ ...prev, [name]: dateString }))
    validateField(name, dateString)
    setTouchedFields((prev) => ({ ...prev, [name]: true }))
  }

  // Tag handling
  const handleAddTag = (tag: string) => {
    if (!tag.trim()) return

    const currentTags = formData.tags || []
    if (!currentTags.includes(tag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...currentTags, tag.trim()]
      }))
    }
    setTagInput("")
  }

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = formData.tags || []
    setFormData((prev) => ({
      ...prev,
      tags: currentTags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      handleAddTag(tagInput)
    }
  }

  // Field validation
  const validateField = (name: string, value: any) => {
    setFormErrors((prev) => {
      const newErrors = { ...prev }

      try {
        // Create a partial schema for just this field
        const fieldSchema = z.object({ [name]: jobSchema.shape[name as keyof typeof jobSchema.shape] })
        fieldSchema.parse({ [name]: value })
        delete newErrors[name]
      } catch (error) {
        if (error instanceof z.ZodError) {
          const fieldError = error.errors.find(err => err.path[0] === name)
          if (fieldError) {
            newErrors[name] = fieldError.message
          }
        }
      }

      return newErrors
    })
  }

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      // Validate all fields
      const validationResult = jobSchema.safeParse(formData)

      if (!validationResult.success) {
        const errors: Record<string, string> = {}
        validationResult.error.errors.forEach(err => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message
          }
        })

        setFormErrors(errors)

        // Focus the first field with an error
        const firstErrorField = Object.keys(errors)[0]
        const element = document.getElementById(firstErrorField)
        if (element) {
          element.focus()
          setActiveTab(getTabForField(firstErrorField))
        }

        setIsSaving(false)
        return
      }

      // Generate ID if not editing
      const jobData: JobData = {
        id: formData.id || Date.now().toString(),
        company: formData.company || "",
        position: formData.position || "",
        status: formData.status || "wishlist",
        ...formData,
      } as JobData

      if (isEditMode && onEditJob) {
        onEditJob(jobData)
        toast({
          title: "Job updated",
          description: `${jobData.company} - ${jobData.position} has been updated.`,
        })
      } else {
        onAddJob(jobData)
        toast({
          title: "Job added",
          description: `${jobData.company} - ${jobData.position} has been added.`,
        })
      }

      handleOpenChange(false)
    } catch (error) {
      console.error("Error saving job:", error)
      toast({
        title: "Error occurred",
        description: "There was a problem saving the job.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Helper to determine which tab contains a field
  const getTabForField = (fieldName: string): string => {
    const basicFields = ["company", "position", "status", "location", "url", "applyDate", "workMode"]
    const detailsFields = ["salaryMin", "salaryMax", "salaryCurrency", "priority", "tags", "notes"]

    if (basicFields.includes(fieldName)) return "basic"
    if (detailsFields.includes(fieldName)) return "details"
    return "description"
  }

  // Trigger button for uncontrolled mode
  const triggerButton = controlledOpen === undefined ? (
    <Button
      variant={buttonVariant}
      size={buttonSize}
      className={buttonClassName}
      onClick={() => setOpen(true)}
    >
      {buttonIcon || <Plus className="mr-2 h-4 w-4" />}
      {buttonLabel}
    </Button>
  ) : null

  // Custom form field component
  const FormField = ({
    name,
    label,
    children,
    error,
    required = false,
    icon,
    tip,
  }: {
    name: string
    label: string
    children: React.ReactNode
    error?: string
    required?: boolean
    icon?: React.ReactNode
    tip?: string
  }) => (
    <div className="space-y-1.5 mb-4">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          {icon && <span className="text-muted-foreground">{icon}</span>}
          <Label
            htmlFor={name}
            className={cn(
              "text-sm font-medium",
              required && "after:content-['*'] after:ml-0.5 after:text-destructive"
            )}
          >
            {label}
          </Label>
        </div>

        {tip && (
          <span className="text-xs text-muted-foreground">{tip}</span>
        )}
      </div>

      {children}

      {error && (
        <div className="flex items-center gap-1 text-xs text-destructive mt-1 absolute -mt-1">
          <AlertCircle className="h-3 w-3" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )

  return (
    <>
      {controlledOpen === undefined && triggerButton}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md md:max-w-xl lg:max-w-2xl p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="text-xl flex items-center gap-2">
              {isEditMode ? (
                <>
                  <Edit3 className="h-5 w-5 text-primary" />
                  Edit Job
                </>
              ) : (
                <>
                  <Briefcase className="h-5 w-5 text-primary" />
                  Add New Job
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {isEditMode
                ? "Update job details"
                : "Enter job details"}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="px-6">
              <TabsList className="grid grid-cols-3 mb-1 w-full">
                <TabsTrigger value="basic" className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  <span>Basic Info</span>
                </TabsTrigger>
                <TabsTrigger value="details" className="flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5" />
                  <span>Details</span>
                </TabsTrigger>
                <TabsTrigger value="description" className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  <span>Description</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="max-h-[70vh] px-6 pb-6">
              <form id="job-form" onSubmit={handleSubmit} className="space-y-6 py-4">
                <TabsContent value="basic" className="mt-2">
                  {/* Company */}
                  <FormField
                    name="company"
                    label="Company"
                    required
                    error={formErrors.company}
                    icon={<Building2 className="h-4 w-4" />}
                  >
                    <div className="relative">
                      <Input
                        id="company"
                        name="company"
                        ref={firstInputRef}
                        value={formData.company || ""}
                        onChange={handleChange}
                        placeholder="Enter company name"
                        className={cn(
                          "pl-8 h-10 transition-all",
                          formErrors.company ? "border-destructive" :
                          touchedFields.company && !formErrors.company ? "border-green-500" : ""
                        )}
                      />
                      <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      {touchedFields.company && !formErrors.company && (
                        <CheckCircle2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                      )}
                    </div>
                  </FormField>

                  {/* Position */}
                  <FormField
                    name="position"
                    label="Job Title"
                    required
                    error={formErrors.position}
                    icon={<Briefcase className="h-4 w-4" />}
                  >
                    <div className="relative">
                      <Input
                        id="position"
                        name="position"
                        value={formData.position || ""}
                        onChange={handleChange}
                        placeholder="Enter job title"
                        className={cn(
                          "pl-8 h-10 transition-all",
                          formErrors.position ? "border-destructive" :
                          touchedFields.position && !formErrors.position ? "border-green-500" : ""
                        )}
                      />
                      <Briefcase className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      {touchedFields.position && !formErrors.position && (
                        <CheckCircle2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                      )}
                    </div>
                  </FormField>

                  {/* Status */}
                  <FormField
                    name="status"
                    label="Status"
                    error={formErrors.status}
                    icon={<Clock className="h-4 w-4" />}
                  >
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleSelectChange("status", value)}
                      defaultValue="wishlist"
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {jobStates.map((state) => (
                          <SelectItem
                            key={state.id}
                            value={state.id}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: state.color }}
                              />
                              {state.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>

                  {/* Location */}
                  <FormField
                    name="location"
                    label="Location"
                    error={formErrors.location}
                    icon={<MapPin className="h-4 w-4" />}
                    tip="City, Country"
                  >
                    <div className="relative">
                      <Select
                        value={formData.location}
                        onValueChange={(value) => handleSelectChange("location", value)}
                      >
                        <SelectTrigger className="h-10 pl-8">
                          <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <SelectValue placeholder="Select or enter location" />
                        </SelectTrigger>
                        <SelectContent>
                          {predefinedLocations.map((location) => (
                            <SelectItem key={location} value={location}>
                              {location}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </FormField>

                  {/* URL */}
                  <FormField
                    name="url"
                    label="Job URL"
                    error={formErrors.url}
                    icon={<Link className="h-4 w-4" />}
                  >
                    <div className="relative">
                      <Input
                        id="url"
                        name="url"
                        value={formData.url || ""}
                        onChange={handleChange}
                        placeholder="https://example.com/jobs"
                        className={cn(
                          "pl-8 h-10",
                          formErrors.url && "border-destructive"
                        )}
                      />
                      <Link className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </FormField>

                  {/* Date */}
                  <FormField
                    name="applyDate"
                    label="Date"
                    error={formErrors.applyDate}
                    icon={<Calendar className="h-4 w-4" />}
                  >
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal h-10 pl-8"
                        >
                          <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          {formData.applyDate ? (
                            format(new Date(formData.applyDate), "PPP")
                          ) : (
                            <span className="text-muted-foreground">Select date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={formData.applyDate ? new Date(formData.applyDate) : undefined}
                          onSelect={(date) => handleDateChange("applyDate", date)}
                          defaultMonth={new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </FormField>

                  {/* Work Mode */}
                  <FormField
                    name="workMode"
                    label="Work Mode"
                    error={formErrors.workMode}
                    icon={<Globe className="h-4 w-4" />}
                  >
                    <Select
                      value={formData.workMode}
                      onValueChange={(value) => handleSelectChange("workMode", value as WorkMode)}
                      defaultValue="onsite"
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select work mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="onsite">On-site</SelectItem>
                        <SelectItem value="remote">Remote</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                        <SelectItem value="flexible">Flexible</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                </TabsContent>

                <TabsContent value="details" className="mt-2">
                  {/* Salary */}
                  <FormField
                    name="salary"
                    label="Salary"
                    error={formErrors.salaryMin || formErrors.salaryMax}
                    icon={<DollarSign className="h-4 w-4" />}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant={!showSalaryRange ? "default" : "outline"}
                          size="sm"
                          onClick={() => setShowSalaryRange(false)}
                          className="text-xs h-8"
                        >
                          Single Value
                        </Button>
                        <Button
                          type="button"
                          variant={showSalaryRange ? "default" : "outline"}
                          size="sm"
                          onClick={() => setShowSalaryRange(true)}
                          className="text-xs h-8"
                        >
                          Salary Range
                        </Button>
                      </div>

                      {!showSalaryRange ? (
                        <div className="relative">
                          <Input
                            id="salaryMin"
                            name="salaryMin"
                            type="number"
                            value={formData.salaryMin === undefined ? "" : formData.salaryMin}
                            onChange={handleNumericChange}
                            placeholder="Enter salary amount"
                            className="pl-8 h-10"
                          />
                          <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <Input
                              id="salaryMin"
                              name="salaryMin"
                              type="number"
                              value={formData.salaryMin === undefined ? "" : formData.salaryMin}
                              onChange={handleNumericChange}
                              placeholder="Min"
                              className="pl-8 h-10"
                            />
                            <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          </div>
                          <span className="text-muted-foreground">-</span>
                          <div className="relative flex-1">
                            <Input
                              id="salaryMax"
                              name="salaryMax"
                              type="number"
                              value={formData.salaryMax === undefined ? "" : formData.salaryMax}
                              onChange={handleNumericChange}
                              placeholder="Max"
                              className="pl-8 h-10"
                            />
                            <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      )}

                      <Select
                        value={formData.salaryCurrency || "USD"}
                        onValueChange={(value) => handleSelectChange("salaryCurrency", value)}
                        defaultValue="USD"
                      >
                        <SelectTrigger className="h-10 w-full">
                          <SelectValue placeholder="Currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD - United States Dollar</SelectItem>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                          <SelectItem value="GBP">GBP - British Pound</SelectItem>
                          <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                          <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                          <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </FormField>

                  {/* Priority/Rating */}
                  <FormField
                    name="priority"
                    label="Priority / Rating"
                    error={formErrors.priority}
                    icon={<Star className="h-4 w-4" />}
                    tip="How important is this job to you?"
                  >
                    <div className="flex items-center justify-center gap-2 bg-muted/20 rounded-md p-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Button
                          key={star}
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSelectChange("priority", star)}
                          className={cn(
                            "h-10 w-10 p-0",
                            (formData.priority || 0) >= star
                              ? "text-yellow-500 hover:text-yellow-600"
                              : "text-muted-foreground hover:text-yellow-500"
                          )}
                        >
                          <Star className="h-7 w-7" fill={(formData.priority || 0) >= star ? "currentColor" : "none"} />
                        </Button>
                      ))}
                    </div>
                  </FormField>

                  {/* Tags */}
                  <FormField
                    name="tags"
                    label=""
                    error={formErrors.tags}
                    icon={<Tags className="h-4 w-4 text-muted-foreground" />}
                    tip="Add relevant skills or keywords"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2 min-h-[38px] p-2 border rounded-md bg-background">
                        {(formData.tags || []).map((tag) => (
                          <Badge key={tag} variant="outline" className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                            {tag}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 p-0 ml-1 text-primary hover:text-primary/80"
                              onClick={() => handleRemoveTag(tag)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                      <div className="relative">
                        <Input
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={handleTagInputKeyDown}
                          placeholder="Type and press Enter to add tags"
                          className="pl-8 h-10"
                        />
                        <Tags className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground hover:text-foreground"
                          onClick={() => handleAddTag(tagInput)}
                          disabled={!tagInput.trim()}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </FormField>

                  {/* Notes */}
                  <FormField
                    name="notes"
                    label="Notes"
                    error={formErrors.notes}
                    icon={<StickyNote className="h-4 w-4" />}
                    tip="Add your personal notes about this job"
                  >
                    <Textarea
                      id="notes"
                      name="notes"
                      value={formData.notes || ""}
                      onChange={handleChange}
                      placeholder="Add your thoughts, interview prep, or anything else you want to remember"
                      className="min-h-[100px] resize-y"
                    />
                  </FormField>
                </TabsContent>

                <TabsContent value="description" className="mt-2">
                  {/* Job Description */}
                  <FormField
                    name="description"
                    label="Job Description"
                    error={formErrors.description}
                    icon={<FileText className="h-4 w-4" />}
                    tip="Copy and paste the job description here"
                  >
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description || ""}
                      onChange={handleChange}
                      placeholder="Paste the full job description here"
                      className="min-h-[300px] resize-y"
                    />
                  </FormField>
                </TabsContent>
              </form>
            </ScrollArea>

            <DialogFooter className="px-6 py-4 border-t">
              <div className="flex justify-between w-full">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  className="gap-1.5"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  form="job-form"
                  disabled={isSaving}
                  className="gap-1.5"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : isEditMode ? (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Add Job
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  )
}
