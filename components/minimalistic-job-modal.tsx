"use client"

import * as React from "react"
import { useState, useEffect, useRef } from "react"
import { z } from "zod"
import { format } from "date-fns"
import {
  Building2,
  Briefcase,
  Calendar,
  MapPin,
  ExternalLink,
  Star,
  CheckCircle2,
  X,
  Search,
  Plus,
  Edit3,
  DollarSign,
  FileText,
  Tags,
  Code,
  Heart,
  Award,
  Mail,
  Phone,
  GraduationCap,
  UserRound,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-media-query"
import { EnhancedTagInput } from "./enhanced-tag-input"
import { LocationSearch } from "./location-search"
import { getJobStates } from "@/lib/storage"
import { analyzeJobDescription } from "@/lib/job-analyzer"
import * as skillsData from "@/lib/skills"
import type { JobData, JobState, WorkMode } from "@/lib/types"

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

  salary: z.string().optional(),
  salaryCurrency: z.string().optional().default("USD"),

  // Keep these for backward compatibility
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),

  workMode: z.enum(["remote", "onsite", "hybrid", "flexible"]).optional().default("onsite"),
  priority: z.number().min(0).max(5).optional(),
  tags: z.array(z.string()).optional(),
  softSkills: z.array(z.string()).optional(),
  requirements: z.array(z.string()).optional(),
  studies: z.array(z.string()).optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  contactPerson: z.string().optional(),
  contactEmail: z.string().email("Please enter a valid email").optional().or(z.literal("")),
  contactPhone: z.string().optional().or(z.literal("")),
})

interface MinimalisticJobModalProps {
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
  salary: "",
  salaryCurrency: "USD",
  status: "wishlist",
  priority: 5,
  skills: [],
  softSkills: [],
  requirements: [],
  studies: [],
  description: "",
  notes: "",
  url: "",
  date: new Date().toISOString().split("T")[0],
  applyDate: new Date().toISOString().split("T")[0],
  workMode: "onsite",
  contactPerson: "",
  contactEmail: "",
  contactPhone: "",
}

// Form field component for minimalistic design
interface FormFieldProps {
  name: string
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
  icon?: React.ReactNode
}

function FormField({ name, label, required, error, children, icon }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <Label
          htmlFor={name}
          className="text-sm font-medium"
        >
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
      </div>
      {children}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  )
}

export function MinimalisticJobModal({
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
}: MinimalisticJobModalProps) {
  const [open, setOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [formData, setFormData] = useState<Partial<JobData>>(initialFormData)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({})
  const [showLocationSearch, setShowLocationSearch] = useState(false)
  const [jobStates, setJobStates] = useState<JobState[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const firstInputRef = useRef<HTMLInputElement>(null)
  const isMobile = useMediaQuery("(max-width: 768px)")
  const { toast } = useToast()

  // Load job states
  useEffect(() => {
    if (propJobStates) {
      setJobStates(propJobStates)
    } else {
      setJobStates(getJobStates())
    }
  }, [propJobStates])

  // Handle controlled/uncontrolled mode
  useEffect(() => {
    if (controlledOpen !== undefined) {
      setOpen(controlledOpen)
    }
  }, [controlledOpen])

  // Initialize form data when editing
  useEffect(() => {
    if (jobToEdit) {
      setIsEditMode(true)
      const jobData = { ...jobToEdit }

      jobData.studies = jobToEdit.studies ?? []
      jobData.contactPerson = jobToEdit.contactPerson ?? ""
      jobData.contactEmail = jobToEdit.contactEmail ?? ""
      jobData.contactPhone = jobToEdit.contactPhone ?? ""

      // --- Robust Date Handling (Using Local Noon) ---
      let dateStringToUse = jobData.applyDate || jobData.date
      if (dateStringToUse && dateStringToUse.includes('-')) { // Ensure it's a YYYY-MM-DD string
        const [year, month, day] = dateStringToUse.split('-').map(Number)
        // Create Date object using local year, month (0-indexed), day, at 12:00:00 local time
        const localDateAtNoon = new Date(year, month - 1, day, 12, 0, 0)
        const formattedDate = format(localDateAtNoon, "yyyy-MM-dd")
        jobData.applyDate = formattedDate
        if (!jobToEdit.applyDate && jobToEdit.date) { 
            jobData.date = formattedDate
        }
      } else {
        // Fallback if no valid date string or invalid format
        const today = format(new Date(), "yyyy-MM-dd")
        jobData.applyDate = today
        jobData.date = today
      }

      // --- Skills Merging for Editing --- 
      const finalTags: string[] = []
      const finalSoftSkills: string[] = []
      const finalRequirements: string[] = []

      const addUnique = (arr: string[], skill: string) => {
        if (!arr.includes(skill)) arr.push(skill)
      }

      if (Array.isArray(jobToEdit.tags)) jobToEdit.tags.forEach(skill => addUnique(finalTags, skill))
      if (Array.isArray(jobToEdit.softSkills)) jobToEdit.softSkills.forEach(skill => addUnique(finalSoftSkills, skill))
      if (Array.isArray(jobToEdit.requirements)) jobToEdit.requirements.forEach(skill => addUnique(finalRequirements, skill))

      if (Array.isArray(jobToEdit.skills)) {
        jobToEdit.skills.forEach(skill => {
          const category = skillsData.categorizeSkill(skill)
          switch (category) {
            case "technical": { addUnique(finalTags, skill); break; }
            case "soft": { addUnique(finalSoftSkills, skill); break; }
            case "requirement": { addUnique(finalRequirements, skill); break; }
            default: { addUnique(finalTags, skill); break; } // Default unknown to technical
          }
        })
      }

      jobData.tags = finalTags
      jobData.softSkills = finalSoftSkills
      jobData.requirements = finalRequirements
      jobData.skills = undefined // Clear legacy field from formData after processing

      // Handle legacy job format (location used as work mode)
      if (jobData.location && !jobData.workMode) {
        const locationLower = jobData.location.toLowerCase()
        const isRemote = locationLower.includes('remote')
        const isHybrid = locationLower.includes('hybrid')
        const isFlexible = locationLower.includes('flexible')

        // Set work mode based on location text
        if (isRemote) {
          jobData.workMode = 'remote'
          // Clean location if it only contains work mode info
          if (locationLower.trim() === 'remote') {
            jobData.location = ''
          }
        } else if (isHybrid) {
          jobData.workMode = 'hybrid'
          // Clean location if it only contains work mode info
          if (locationLower.trim() === 'hybrid') {
            jobData.location = ''
          }
        } else if (isFlexible) {
          jobData.workMode = 'flexible'
          // Clean location if it only contains work mode info
          if (locationLower.trim() === 'flexible') {
            jobData.location = ''
          }
        } else {
          // Default to onsite if location doesn't contain work mode info
          jobData.workMode = 'onsite'
        }
      }

      // If we have a legacy salary format or min/max values, convert to the new single field
      if (!jobData.salary && (jobData.salaryMin || jobData.salaryMax)) {
        if (jobData.salaryMin && jobData.salaryMax) {
          jobData.salary = `${jobData.salaryMin} - ${jobData.salaryMax}`
        } else if (jobData.salaryMin) {
          jobData.salary = jobData.salaryMin.toString()
        } else if (jobData.salaryMax) {
          jobData.salary = jobData.salaryMax.toString()
        }
      }

      // Ensure proper formatting of salary with currency
      if (jobData.salary) {
        // Remove any extra spaces between numbers and dashes
        jobData.salary = jobData.salary.replace(/\s*-\s*/g, '-')

        // Ensure there are no spaces between currency and amount
        if (jobData.salaryCurrency && jobData.salary.includes(jobData.salaryCurrency)) {
          jobData.salary = jobData.salary.replace(new RegExp(`${jobData.salaryCurrency}\\s+`), jobData.salaryCurrency)
        }
      }

      setFormData(jobData)
    } else {
      setIsEditMode(false)
      setFormData({
        ...initialFormData,
        status: initialStatus || initialFormData.status || "wishlist",
        date: new Date().toISOString().split("T")[0],
        applyDate: new Date().toISOString().split("T")[0],
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

  // Handle form changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setTouchedFields((prev) => ({ ...prev, [name]: true }))

    // Clear error when field is edited
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    setTouchedFields((prev) => ({ ...prev, [name]: true }))

    // Clear error when field is edited
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  // Handle date changes
  const handleDateChange = (name: string, date: Date | undefined) => {
    if (date) {
      // The 'date' object from CalendarComponent is usually a local date.
      // Formatting it directly should be correct.
      setFormData((prev) => ({
        ...prev,
        [name]: format(date, "yyyy-MM-dd") 
      }))
      setTouchedFields((prev) => ({ ...prev, [name]: true }))
    }
  }

  // Handle number changes
  const handleNumberChange = (name: string, value: string) => {
    const numValue = value === "" ? undefined : Number(value)
    setFormData((prev) => ({ ...prev, [name]: numValue }))
    setTouchedFields((prev) => ({ ...prev, [name]: true }))
  }

  // NEW: Handle priority/rating changes
  const handlePriorityChange = (newPriority: number) => {
    setFormData(prev => ({
      ...prev,
      priority: prev.priority === newPriority ? 0 : newPriority // Click again to clear to 0, or set new priority
    }))
    setTouchedFields(prev => ({ ...prev, priority: true }))
  }

  // NEW: Handle combined skills changes
  const handleCombinedSkillsChange = (newCombinedSkills: string[]) => {
    const newTechnicalSkills: string[] = []
    const newSoftSkills: string[] = []
    const newRequirements: string[] = []

    newCombinedSkills.forEach(skill => {
      const category = skillsData.categorizeSkill(skill)
      switch (category) {
        case "technical":
          newTechnicalSkills.push(skill)
          break
        case "soft":
          newSoftSkills.push(skill)
          break
        case "requirement":
          newRequirements.push(skill)
          break
        default: // "unknown"
          newTechnicalSkills.push(skill) // Default to technical or a general pool
          break
      }
    })

    setFormData(prev => ({
      ...prev,
      tags: newTechnicalSkills,
      softSkills: newSoftSkills,
      requirements: newRequirements,
    }))
    setTouchedFields(prev => ({
      ...prev,
      tags: true, // Mark all as potentially touched
      softSkills: true,
      requirements: true,
    }))
  }

  const handleStudiesChange = (studies: string[]) => {
    setFormData(prev => ({
      ...prev,
      studies,
    }))
    setTouchedFields(prev => ({ ...prev, studies: true }))
  }

  // Handle job description analysis
  const handleAnalyzeDescription = () => {
    if (!formData.description || formData.description.length < 50) {
      toast({
        title: "Description too short",
        description: "Please paste a complete job description to analyze",
        variant: "destructive",
      })
      return
    }

    try {
      // Analyze the job description
      const results = analyzeJobDescription(formData.description)

      // Update form data with extracted skills
      setFormData(prev => ({
        ...prev,
        tags: Array.from(new Set([...(prev.tags || []), ...results.technicalSkills])),
        softSkills: Array.from(new Set([...(prev.softSkills || []), ...results.softSkills])),
        requirements: Array.from(new Set([...(prev.requirements || []), ...results.requirements])),
      }))

      // Mark fields as touched
      setTouchedFields(prev => ({
        ...prev,
        tags: true,
        softSkills: true,
        requirements: true,
      }))

      // Count how many new items were added
      const newTechnicalSkills = results.technicalSkills.filter(skill => !(formData.tags || []).includes(skill)).length
      const newSoftSkills = results.softSkills.filter(skill => !(formData.softSkills || []).includes(skill)).length
      const newRequirements = results.requirements.filter(req => !(formData.requirements || []).includes(req)).length
      const totalNewItems = newTechnicalSkills + newSoftSkills + newRequirements

      // Show success message
      toast({
        title: "Analysis Complete",
        description: totalNewItems > 0
          ? `Added ${totalNewItems} new items: ${newTechnicalSkills} technical skills, ${newSoftSkills} soft skills, and ${newRequirements} requirements.`
          : `Found ${results.technicalSkills.length} technical skills, ${results.softSkills.length} soft skills, and ${results.requirements.length} requirements.`,
      })
    } catch (error) {
      console.error("Error analyzing job description:", error)
      toast({
        title: "Analysis Error",
        description: "An error occurred while analyzing the job description",
        variant: "destructive",
      })
    }
  }

  // Handle location selection
  const handleLocationSelect = (location: string) => {
    setFormData((prev) => ({ ...prev, location }))
    setTouchedFields((prev) => ({ ...prev, location: true }))
    setShowLocationSearch(false)
  }

  // Handle dialog open/close
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)

    if (!newOpen && onClose) {
      onClose()
    }

    if (!newOpen) {
      // Reset form when closing
      setFormData({
        // Explicitly list out fields for reset, pulling defaults from initialFormData where appropriate
        company: initialFormData.company || "",
        position: initialFormData.position || "",
        location: initialFormData.location || "",
        url: initialFormData.url || "",
        salary: initialFormData.salary || "",
        salaryCurrency: initialFormData.salaryCurrency || "USD",
        priority: initialFormData.priority || 5, // Use configured default
        skills: [], // Always reset arrays
        softSkills: [],
        requirements: [],
        description: initialFormData.description || "",
        notes: initialFormData.notes || "",
        // Dynamic fields & status reset
        date: new Date().toISOString().split("T")[0],
        applyDate: new Date().toISOString().split("T")[0],
        status: initialStatus || initialFormData.status || "wishlist",
        workMode: initialFormData.workMode || "onsite", // Use configured default
        // Explicitly reset any other fields that might have been part of JobData but not in initialFormData
        id: undefined,
        salaryMin: undefined,
        salaryMax: undefined,
        followUpDate: undefined,
        // Ensure all fields from JobData not meant to persist are reset
        tags: [], // formData.tags is the specific field for the combined skills input
        studies: [],
        contactPerson: "",
        contactEmail: "",
        contactPhone: "",
      })
      setFormErrors({})
      setTouchedFields({})
    }
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      // Validate form data
      const validationResult = jobSchema.safeParse(formData)

      if (!validationResult.success) {
        const errors: Record<string, string> = {}
        validationResult.error.errors.forEach((error) => {
          const field = error.path[0].toString()
          errors[field] = error.message
        })
        setFormErrors(errors)
        setIsSaving(false)
        return
      }

      // Format salary to ensure proper spacing
      let formattedSalary = formData.salary
      if (formattedSalary) {
        // Remove any currency symbols that might be in the input
        const currencySymbols = ['$', '€', '£', '¥', '₹', '₽', '₩', '₿']
        currencySymbols.forEach(symbol => {
          formattedSalary = formattedSalary?.replace(symbol, '')
        })

        // Clean up any extra spaces
        formattedSalary = formattedSalary?.trim()

        // Format ranges with a single dash and no spaces
        formattedSalary = formattedSalary?.replace(/\s*-\s*/g, '-')
      }

      // Generate ID if not editing
      const jobData: JobData = {
        id: formData.id || Date.now().toString(),
        company: formData.company || "",
        position: formData.position || "",
        status: formData.status || "wishlist",
        // Ensure work mode is set
        workMode: formData.workMode || "remote",
        ...formData,
        // Update with formatted salary
        salary: formattedSalary,
        // Make sure we're not sending both salary formats
        salaryMin: undefined,
        salaryMax: undefined
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

  return (
    <>
      {controlledOpen === undefined && triggerButton}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md md:max-w-2xl lg:max-w-3xl p-0 gap-0 overflow-hidden">
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

          <ScrollArea className="max-h-[70vh] px-6 pb-6">
            <form id="job-form" onSubmit={handleSubmit} className="space-y-6 py-4">
              {/* Basic Information Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          "h-10 transition-all",
                          formErrors.company ? "border-destructive" :
                          touchedFields.company && !formErrors.company ? "border-green-500" : ""
                        )}
                      />
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
                          "h-10 transition-all",
                          formErrors.position ? "border-destructive" :
                          touchedFields.position && !formErrors.position ? "border-green-500" : ""
                        )}
                      />
                      {touchedFields.position && !formErrors.position && (
                        <CheckCircle2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                      )}
                    </div>
                  </FormField>
                </div>
              </div>

              {/* Job Details Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Job Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Status */}
                  <FormField
                    name="status"
                    label="Status"
                    error={formErrors.status}
                    icon={<Star className="h-4 w-4" />}
                  >
                    <Select
                      value={formData.status || "wishlist"}
                      onValueChange={(value) => handleSelectChange("status", value)}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {jobStates.map((state) => (
                          <SelectItem key={state.id} value={state.id}>
                            <div className="flex items-center gap-2">
                              <span
                                className="w-3 h-3 rounded-full inline-block"
                                dangerouslySetInnerHTML={{
                                  __html: `<span style="display:block; width:100%; height:100%; border-radius:9999px; background-color:${state.color}"></span>`
                                }}
                              />
                              {state.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>

                  {/* Date */}
                  <FormField
                    name="applyDate"
                    label="Application Date"
                    error={formErrors.applyDate}
                    icon={<Calendar className="h-4 w-4" />}
                  >
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal h-10",
                            !formData.applyDate && "text-muted-foreground"
                          )}
                        >
                          {formData.applyDate ? (
                            // Display: Parse YYYY-MM-DD to local Date at noon, then format
                            format(new Date(parseInt(formData.applyDate.split('-')[0]), parseInt(formData.applyDate.split('-')[1]) - 1, parseInt(formData.applyDate.split('-')[2]), 12, 0, 0), "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          // Selected: Parse YYYY-MM-DD to local Date at noon
                          selected={formData.applyDate ? new Date(parseInt(formData.applyDate.split('-')[0]), parseInt(formData.applyDate.split('-')[1]) - 1, parseInt(formData.applyDate.split('-')[2]), 12, 0, 0) : undefined}
                          onSelect={(date) => handleDateChange("applyDate", date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </FormField>

                  {/* NEW: Rating/Priority Field */}
                  <FormField
                    name="priority"
                    label="Rating"
                    error={formErrors.priority}
                    icon={<Star className="h-4 w-4" />}
                  >
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((starValue) => (
                        <Button
                          key={starValue}
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePriorityChange(starValue)}
                          className={cn(
                            "h-8 w-8 p-0",
                            formData.priority && starValue <= formData.priority
                              ? "text-yellow-400 hover:text-yellow-500"
                              : "text-gray-300 hover:text-yellow-400"
                          )}
                          aria-label={`Rate ${starValue} star${starValue > 1 ? 's' : ''}`}
                        >
                          <Star
                            className={cn(
                              "h-5 w-5",
                              formData.priority && starValue <= formData.priority
                                ? "fill-current"
                                : ""
                            )}
                          />
                        </Button>
                      ))}
                    </div>
                    {formErrors.priority && <p className="text-xs text-destructive mt-1">{formErrors.priority}</p>}
                  </FormField>

                  {/* Location */}
                  <FormField
                    name="location"
                    label="Location"
                    error={formErrors.location}
                    icon={<MapPin className="h-4 w-4" />}
                  >
                    <div className="relative">
                      <Input
                        id="location"
                        name="location"
                        value={formData.location || ""}
                        onChange={handleChange}
                        placeholder="City, country or Remote"
                        className="h-10 pr-10"
                        onFocus={() => setShowLocationSearch(true)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-10 w-10"
                        onClick={() => setShowLocationSearch(!showLocationSearch)}
                      >
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>

                    {showLocationSearch && (
                      <div className="absolute z-50 left-0 right-0 mt-1">
                        <LocationSearch
                          onLocationSelect={handleLocationSelect}
                          onClose={() => setShowLocationSearch(false)}
                          initialValue={formData.location || ""}
                          className="rounded-lg border shadow-md"
                        />
                      </div>
                    )}
                  </FormField>

                  {/* Work Mode */}
                  <FormField
                    name="workMode"
                    label="Work Mode"
                    error={formErrors.workMode}
                    icon={<Briefcase className="h-4 w-4" />}
                  >
                    <Select
                      value={formData.workMode}
                      onValueChange={(value) => handleSelectChange("workMode", value as WorkMode)}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select work mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="remote">Remote</SelectItem>
                        <SelectItem value="onsite">On-site</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                        <SelectItem value="flexible">Flexible</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>

                  {/* URL */}
                  <FormField
                    name="url"
                    label="Job URL"
                    error={formErrors.url}
                    icon={<ExternalLink className="h-4 w-4" />}
                  >
                    <div className="relative">
                      <Input
                        id="url"
                        name="url"
                        type="url"
                        value={formData.url || ""}
                        onChange={handleChange}
                        placeholder="https://example.com/job"
                        className={cn(
                          "h-10",
                          formErrors.url && "border-destructive"
                        )}
                      />
                    </div>
                  </FormField>

                  {/* Salary */}
                  <FormField
                    name="salary"
                    label="Salary"
                    error={formErrors.salary}
                    icon={<DollarSign className="h-4 w-4" />}
                  >
                    <div className="flex gap-2">
                      <div className="w-24">
                        <Select
                          value={formData.salaryCurrency || "USD"}
                          onValueChange={(value) => handleSelectChange("salaryCurrency", value)}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Currency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                            <SelectItem value="CAD">CAD</SelectItem>
                            <SelectItem value="AUD">AUD</SelectItem>
                            <SelectItem value="JPY">JPY</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1">
                        <Input
                          id="salary"
                          name="salary"
                          placeholder="Enter salary amount"
                          value={formData.salary || ""}
                          onChange={handleChange}
                          className="h-10"
                        />
                      </div>
                    </div>
                  </FormField>
                </div>
              </div>

              {/* NEW: Consolidated Skills & Requirements Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                  <Tags className="h-4 w-4 text-sky-500" /> {/* Using generic Tags icon */}
                  Skills, Soft Skills, & Requirements
                </h3>
                <div className="space-y-4">
                  <FormField
                    name="combinedSkills" // This name is for the FormField, not directly for formData state key
                    label=""
                    error={formErrors.tags || formErrors.softSkills || formErrors.requirements} // Show error from any related field
                  >
                    <EnhancedTagInput
                      tags={[
                        ...(formData.tags || []),
                        ...(formData.softSkills || []),
                        ...(formData.requirements || [])
                      ]}
                      onTagsChange={handleCombinedSkillsChange}
                      placeholder="Add technical skills, soft skills, or requirements..."
                      // Remove specific suggestions, rely on allSuggestions for dynamic search
                      // suggestions={[]} 
                      allSuggestions={[
                        ...skillsData.technicalSkills,
                        ...skillsData.softSkills,
                        ...skillsData.requirements
                      ]}
                    />
                  </FormField>
                </div>
              </div>

              {/* Studies / Education Requirements */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  Studies &amp; Education
                </h3>
                <FormField
                  name="studies"
                  label="Required studies"
                  error={formErrors.studies}
                  icon={<GraduationCap className="h-4 w-4" />}
                >
                  <div className={cn(
                    "p-3 border rounded-md bg-background",
                    formErrors.studies && "border-destructive"
                  )}>
                    <EnhancedTagInput
                      tags={formData.studies || []}
                      onTagsChange={handleStudiesChange}
                      placeholder="Type and press Enter to add studies, degrees or certifications"
                    />
                  </div>
                </FormField>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    name="contactPerson"
                    label="Contact Person"
                    error={formErrors.contactPerson}
                    icon={<UserRound className="h-4 w-4" />}
                  >
                    <Input
                      id="contactPerson"
                      name="contactPerson"
                      value={formData.contactPerson || ""}
                      onChange={handleChange}
                      placeholder="e.g. Jane Doe"
                      className={cn(formErrors.contactPerson && "border-destructive")}
                    />
                  </FormField>

                  <FormField
                    name="contactEmail"
                    label="Contact Email"
                    error={formErrors.contactEmail}
                    icon={<Mail className="h-4 w-4" />}
                  >
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="contactEmail"
                        name="contactEmail"
                        type="email"
                        value={formData.contactEmail || ""}
                        onChange={handleChange}
                        placeholder="name@company.com"
                        autoComplete="email"
                        className={cn("pl-9", formErrors.contactEmail && "border-destructive")}
                      />
                    </div>
                  </FormField>

                  <FormField
                    name="contactPhone"
                    label="Contact Phone"
                    error={formErrors.contactPhone}
                    icon={<Phone className="h-4 w-4" />}
                  >
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="contactPhone"
                        name="contactPhone"
                        type="tel"
                        value={formData.contactPhone || ""}
                        onChange={handleChange}
                        placeholder="e.g. +1 555 123 4567"
                        autoComplete="tel"
                        className={cn("pl-9", formErrors.contactPhone && "border-destructive")}
                      />
                    </div>
                  </FormField>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Description & Notes
                </h3>
                <div className="space-y-4">
                  <FormField
                    name="description"
                    label="Job Description"
                    error={formErrors.description}
                    icon={<FileText className="h-4 w-4" />}
                  >
                    <div className="space-y-2">
                      <Textarea
                        id="description"
                        name="description"
                        value={formData.description || ""}
                        onChange={handleChange}
                        placeholder="Paste the job description here"
                        className="min-h-[150px]"
                      />
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAnalyzeDescription}
                          disabled={!formData.description || formData.description.length < 50}
                          className="text-xs bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                        >
                          <Search className="mr-1.5 h-3.5 w-3.5" />
                          Extract Skills from Description
                        </Button>
                      </div>
                      {formData.description && formData.description.length < 50 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Add at least 50 characters to enable analysis
                        </div>
                      )}
                    </div>
                  </FormField>

                  <FormField
                    name="notes"
                    label="Notes"
                    error={formErrors.notes}
                    icon={<Plus className="h-4 w-4" />}
                  >
                    <Textarea
                      id="notes"
                      name="notes"
                      value={formData.notes || ""}
                      onChange={handleChange}
                      placeholder="Add any notes about this job"
                      className="min-h-[100px]"
                    />
                  </FormField>
                </div>
              </div>
            </form>
          </ScrollArea>

          <DialogFooter className="px-6 py-4 border-t">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="job-form"
              disabled={isSaving}
            >
              {isSaving ? (
                <>Saving...</>
              ) : isEditMode ? (
                <>Save Changes</>
              ) : (
                <>Add Job</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
