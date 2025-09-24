"use client"

import { useState, useEffect, useRef } from "react"
import { z } from "zod"
import {
  Plus,
  Star,
  X,
  Calendar,
  MapPin,
  Link2,
  Loader2,
  Briefcase,
  Info,
  Edit3,
  Trash2,
  Tags,
  Mail,
  Phone,
  GraduationCap,
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
import type { ColumnType, JobData, JobState, WorkMode } from "@/lib/types"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format, parseISO } from "date-fns"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { getJobStates } from "@/lib/storage"
import { useLanguage } from "@/lib/i18n"
import { EnhancedTagInput } from "./enhanced-tag-input"
import { useMediaQuery } from "@/hooks/use-media-query"
import { ScrollArea } from "@/components/ui/scroll-area"

// Zod Schema for Job Validation
const jobSchema = z.object({
  company: z.string().min(1, "Company name is required"),
  position: z.string().min(1, "Position is required"),
  location: z.string().optional(),
  url: z.string().url("Invalid URL format").optional().or(z.literal("")),
  status: z.string().min(1, "Status is required"),
  date: z.string().optional(), // Date of application or last update
  applyDate: z.string().optional(),

  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  salaryCurrency: z.string().max(3, "Currency code should be 3 characters").optional(),

  workMode: z.enum(["remote", "onsite", "hybrid", "flexible"]).optional(),
  priority: z.number().min(0).max(5).optional(),
  tags: z.array(z.string()).optional(),
  studies: z.array(z.string()).optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  contactPerson: z.string().optional(),
  contactEmail: z.string().email("Please enter a valid email").optional().or(z.literal("")),
  contactPhone: z.string().optional().or(z.literal("")),
})

interface JobCreateEditModalProps {
  onAddJob: (job: JobData) => void
  onEditJob?: (job: JobData) => void // For editing
  jobToEdit?: JobData | null         // Job data for editing
  initialStatus?: string
  buttonVariant?: "default" | "outline" | "secondary" | "ghost" | "link"
  buttonSize?: "default" | "sm" | "lg" | "icon"
  buttonClassName?: string
  buttonIcon?: React.ReactNode
  buttonLabel?: string // Will be dynamic: "Add Job" or "Edit Job"
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
  status: undefined,
  priority: 3,
  tags: [],
  studies: [],
  description: "",
  notes: "",
  url: "",
  date: new Date().toISOString().split("T")[0],
  applyDate: new Date().toISOString().split("T")[0],
  workMode: "remote",
  contactEmail: "",
  contactPhone: "",
  contactPerson: "",
}

export function JobCreateEditModal({
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
}: JobCreateEditModalProps) {
  const [open, setOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [formData, setFormData] = useState<Partial<JobData>>(initialFormData)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const [jobStates, setJobStatesInternal] = useState<JobState[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const firstInputRef = useRef<HTMLInputElement>(null)
  const isMobile = useMediaQuery("(max-width: 768px)")

  const { toast } = useToast()
  const { t } = useLanguage()

  // Initialize form data when editing
  useEffect(() => {
    if (jobToEdit) {
      setIsEditMode(true)
      setFormData({
        ...jobToEdit,
      })
    } else {
      setIsEditMode(false)
      setFormData({
        ...initialFormData,
        status: initialStatus,
      })
    }
  }, [jobToEdit, initialStatus])

  // Load job states
  useEffect(() => {
    if (propJobStates) {
      setJobStatesInternal(propJobStates)
    } else {
      const loadJobStates = async () => {
        const states = getJobStates()
        setJobStatesInternal(states)

        // Set default status if not already set
        if (!formData.status && states.length > 0) {
          const defaultState = states.find(state => state.isDefault) || states[0]
          setFormData(prev => ({ ...prev, status: defaultState.id }))
        }
      }

      loadJobStates()
    }
  }, [propJobStates, formData.status])

  // Handle controlled open state
  useEffect(() => {
    if (controlledOpen !== undefined) {
      setOpen(controlledOpen)
    }
  }, [controlledOpen])

  // Focus first input when modal opens
  useEffect(() => {
    if (open && firstInputRef.current) {
      setTimeout(() => {
        firstInputRef.current?.focus()
      }, 100)
    }
  }, [open])

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)

    if (!newOpen && onClose) {
      onClose()
    }

    // Reset form when closing
    if (!newOpen && !controlledOpen) {
      setTimeout(() => {
        setFormData(initialFormData)
        setFormErrors({})
      }, 300)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })

    // Clear error when field is edited
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: "" })
    }
  }

  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const numValue = value === "" ? undefined : Number(value)
    setFormData({ ...formData, [name]: numValue })

    // Clear error when field is edited
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: "" })
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value })

    // Clear error when field is edited
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: "" })
    }
  }

  const handleDateChange = (name: string, date: Date | undefined) => {
    if (date) {
      const dateStr = date.toISOString().split("T")[0]
      setFormData({ ...formData, [name]: dateStr })
    } else {
      setFormData({ ...formData, [name]: undefined })
    }

    // Clear error when field is edited
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: "" })
    }
  }

  const handleTagsChange = (tags: string[]) => {
    setFormData({ ...formData, tags })
  }

  const handleStudiesChange = (studies: string[]) => {
    setFormData({ ...formData, studies })
  }

  const handlePriorityChange = (value: number) => {
    setFormData({ ...formData, priority: value })
  }

  const validateForm = (): boolean => {
    try {
      // Validate with Zod
      jobSchema.parse(formData)
      setFormErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {}
        error.errors.forEach((err) => {
          const field = err.path[0].toString()
          errors[field] = err.message
        })
        setFormErrors(errors)
      }
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSaving) return

    if (!validateForm()) {
      toast({
        title: t("validationError"),
        description: t("pleaseFixErrors"),
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
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
          title: t("jobUpdated"),
          description: t("jobUpdatedSuccess", { company: jobData.company, position: jobData.position }),
        })
      } else {
        onAddJob(jobData)
        toast({
          title: t("jobAdded"),
          description: t("jobAddedSuccess", { company: jobData.company, position: jobData.position }),
        })
      }

      handleOpenChange(false)
    } catch (error) {
      console.error("Error saving job:", error)
      toast({
        title: t("errorOccurred"),
        description: t("errorSavingJob"),
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Trigger button (only shown when not controlled)
  const triggerButton = (
    <Button
      variant={buttonVariant}
      size={buttonSize}
      className={buttonClassName}
      onClick={() => handleOpenChange(true)}
    >
      {buttonIcon || <Plus className="h-4 w-4 mr-2" />}
      {buttonLabel}
    </Button>
  )

  // Custom form field component
  const FormField = ({
    name,
    label,
    children,
    error,
    required = false,
    tip
  }: {
    name: string,
    label: string,
    children: React.ReactNode,
    error?: string,
    required?: boolean,
    tip?: string
  }) => (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={name} className={cn(error && "text-destructive")}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {tip && (
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger type="button" asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-sm">
                <p>{tip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )

  // Priority rating component
  const PriorityRating = ({ value, onChange }: { value: number, onChange: (value: number) => void }) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            className="focus:outline-none"
            onClick={() => onChange(rating)}
            aria-label={`Priority ${rating}`}
          >
            <Star
              className={cn(
                "h-5 w-5 transition-all",
                rating <= value
                  ? "fill-primary text-primary"
                  : "fill-none text-muted-foreground hover:fill-primary/20"
              )}
            />
          </button>
        ))}
      </div>
    )
  }

  // Date picker component
  const DatePickerField = ({
    name,
    value,
    onChange
  }: {
    name: string,
    value?: string,
    onChange: (name: string, date: Date | undefined) => void
  }) => {
    const [date, setDate] = useState<Date | undefined>(value ? new Date(value) : undefined)

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <Calendar className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarComponent
            mode="single"
            selected={date}
            onSelect={(newDate) => {
              setDate(newDate)
              onChange(name, newDate)
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <>
      {controlledOpen === undefined && triggerButton}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md md:max-w-xl">
          <DialogHeader>
            <DialogTitle>{isEditMode ? t("editJob") : t("addNewJob")}</DialogTitle>
            <DialogDescription>
              {isEditMode ? t("editJobDescription") : t("addNewJobDescription")}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea
            className="max-h-[70vh]"
            onKeyDown={(e) => {
              // Close on escape
              if (e.key === "Escape") {
                handleOpenChange(false);
              }
              // Submit on Ctrl+Enter or Cmd+Enter
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                handleSubmit(e);
              }
            }}
          >
            <form
              id="job-form"
              onSubmit={handleSubmit}
              className="space-y-8 px-1 py-4"
              role="form"
              aria-label={isEditMode ? "Edit job form" : "Add new job form"}
            >
              {/* Core Details Section */}
              <div className="space-y-6 rounded-md p-5 bg-muted/10 border">
                <h3 className="text-sm font-semibold -mt-9 bg-background px-2 w-fit">Core Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                  <FormField name="company" label="Company" required error={formErrors.company}>
                    <Input
                      id="company"
                      name="company"
                      ref={firstInputRef}
                      value={formData.company || ""}
                      onChange={handleChange}
                      placeholder="e.g. Acme Corporation"
                      className={cn(formErrors.company && "border-destructive")}
                    />
                  </FormField>

                  <FormField name="position" label="Position" required error={formErrors.position}>
                    <Input
                      id="position"
                      name="position"
                      value={formData.position || ""}
                      onChange={handleChange}
                      placeholder="e.g. Software Engineer"
                      className={cn(formErrors.position && "border-destructive")}
                    />
                  </FormField>

                  <FormField name="location" label="Location" error={formErrors.location}>
                    <Input
                      id="location"
                      name="location"
                      value={formData.location || ""}
                      onChange={handleChange}
                      placeholder="e.g. New York, NY"
                      className={cn(formErrors.location && "border-destructive")}
                    />
                  </FormField>

                  <FormField name="url" label="URL / Link" error={formErrors.url} tip="Link to job posting or company website">
                    <Input
                      id="url"
                      name="url"
                      value={formData.url || ""}
                      onChange={handleChange}
                      placeholder="https://example.com/jobs/123"
                      className={cn(formErrors.url && "border-destructive")}
                    />
                  </FormField>
                </div>
              </div>

              {/* Status and Dates Section */}
              <div className="space-y-6 rounded-md p-5 bg-muted/10 border">
                <h3 className="text-sm font-semibold -mt-9 bg-background px-2 w-fit">Status &amp; Dates</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                  <FormField name="status" label="Status" required error={formErrors.status}>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleSelectChange("status", value)}
                    >
                      <SelectTrigger className={cn(formErrors.status && "border-destructive")}>
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                      <SelectContent>
                        {jobStates.map((state) => (
                          <SelectItem key={state.id} value={state.id}>
                            <div className="flex items-center">
                              <div
                                className="w-2 h-2 rounded-full mr-2"
                                style={{ backgroundColor: state.color }}
                              />
                              {state.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField name="applyDate" label="Application Date" error={formErrors.applyDate}>
                    <DatePickerField
                      name="applyDate"
                      value={formData.applyDate}
                      onChange={handleDateChange}
                    />
                  </FormField>
                </div>
              </div>

              {/* Salary Information */}
              <div className="space-y-6 rounded-md p-5 bg-muted/10 border">
                <h3 className="text-sm font-semibold -mt-9 bg-background px-2 w-fit">Salary Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
                  <FormField
                    name="salaryMin"
                    label="Minimum Salary"
                    error={formErrors.salaryMin}
                    tip="Annual salary - numeric value only"
                  >
                    <Input
                      id="salaryMin"
                      name="salaryMin"
                      type="number"
                      value={formData.salaryMin === undefined ? "" : formData.salaryMin}
                      onChange={handleNumericChange}
                      placeholder="e.g. 60000"
                      className={cn(formErrors.salaryMin && "border-destructive")}
                    />
                  </FormField>

                  <FormField
                    name="salaryMax"
                    label="Maximum Salary"
                    error={formErrors.salaryMax}
                    tip="Annual salary - numeric value only"
                  >
                    <Input
                      id="salaryMax"
                      name="salaryMax"
                      type="number"
                      value={formData.salaryMax === undefined ? "" : formData.salaryMax}
                      onChange={handleNumericChange}
                      placeholder="e.g. 80000"
                      className={cn(formErrors.salaryMax && "border-destructive")}
                    />
                  </FormField>

                  <FormField
                    name="salaryCurrency"
                    label="Currency"
                    error={formErrors.salaryCurrency}
                    tip="3-letter currency code"
                  >
                    <Select
                      value={formData.salaryCurrency || "USD"}
                      onValueChange={(value) => handleSelectChange("salaryCurrency", value)}
                    >
                      <SelectTrigger className={cn(formErrors.salaryCurrency && "border-destructive")}>
                        <SelectValue placeholder="Select currency" />
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
                  </FormField>
                </div>
              </div>

              {/* Work Mode and Priority */}
              <div className="space-y-6 rounded-md p-5 bg-muted/10 border">
                <h3 className="text-sm font-semibold -mt-9 bg-background px-2 w-fit">Work Mode & Priority</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                  <FormField name="workMode" label="Work Mode" error={formErrors.workMode}>
                    <Select
                      value={formData.workMode}
                      onValueChange={(value) => handleSelectChange("workMode", value as WorkMode)}
                    >
                      <SelectTrigger className={cn(formErrors.workMode && "border-destructive")}>
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

                  <FormField
                    name="priority"
                    label="Priority / Rating"
                    error={formErrors.priority}
                    tip="How interested are you in this job?"
                  >
                    <PriorityRating
                      value={formData.priority || 3}
                      onChange={handlePriorityChange}
                    />
                  </FormField>
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-6 rounded-md p-5 bg-muted/10 border">
                <h3 className="text-sm font-semibold -mt-9 bg-background px-2 w-fit flex items-center gap-1.5">
                  <Tags className="h-4 w-4 text-muted-foreground" />
                  Skills
                </h3>
                <FormField
                  name="tags"
                  label=""
                  error={formErrors.tags}
                  tip="Add relevant skills, technologies, or categories"
                >
                  <div className={cn("p-3 border rounded-md bg-background", formErrors.tags && "border-destructive")}>
                    <EnhancedTagInput
                      tags={formData.tags || []}
                      onTagsChange={handleTagsChange}
                      placeholder="Type and press Enter to add tags"
                    />
                  </div>
                </FormField>
              </div>

              {/* Studies */}
              <div className="space-y-6 rounded-md p-5 bg-muted/10 border">
                <h3 className="text-sm font-semibold -mt-9 bg-background px-2 w-fit flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  Studies &amp; Education Requirements
                </h3>
                <FormField
                  name="studies"
                  label=""
                  error={formErrors.studies}
                  tip="Add degrees, certifications, or study programs required for this role"
                >
                  <div className={cn("p-3 border rounded-md bg-background", formErrors.studies && "border-destructive")}>
                    <EnhancedTagInput
                      tags={formData.studies || []}
                      onTagsChange={handleStudiesChange}
                      placeholder="Type and press Enter to add studies"
                    />
                  </div>
                </FormField>
              </div>

              {/* Contact Information */}
              <div className="space-y-6 rounded-md p-5 bg-muted/10 border">
                <h3 className="text-sm font-semibold -mt-9 bg-background px-2 w-fit">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
                  <FormField
                    name="contactPerson"
                    label="Contact Person"
                    error={formErrors.contactPerson}
                    tip="Name of the recruiter or hiring manager"
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
                    tip="Email address to follow up with"
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
                    tip="Direct phone number for the role"
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

              {/* Description and Notes */}
              <div className="space-y-6 rounded-md p-5 bg-muted/10 border">
                <h3 className="text-sm font-semibold -mt-9 bg-background px-2 w-fit">Description & Notes</h3>
                <div className="space-y-5">
                  <FormField
                    name="description"
                    label="Job Description"
                    error={formErrors.description}
                    tip="Copy and paste the job description here"
                  >
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description || ""}
                      onChange={handleChange}
                      placeholder="Paste the job description here..."
                      rows={6}
                      className={cn("min-h-[100px] bg-background", formErrors.description && "border-destructive")}
                    />
                  </FormField>

                  <FormField
                    name="notes"
                    label="Notes"
                    error={formErrors.notes}
                    tip="Add your thoughts, interview prep, or anything else you want to remember"
                  >
                    <Textarea
                      id="notes"
                      name="notes"
                      value={formData.notes || ""}
                      onChange={handleChange}
                      placeholder="Add personal notes..."
                      rows={4}
                      className={cn("min-h-[100px] bg-background", formErrors.notes && "border-destructive")}
                    />
                  </FormField>
                </div>
              </div>
            </form>
          </ScrollArea>

          <DialogFooter className="flex items-center gap-2 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              form="job-form"
              disabled={isSaving}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? "Save Changes" : "Add Job"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}