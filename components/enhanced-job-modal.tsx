"use client"

import { useState, useEffect, useRef } from "react"
import { Plus, Star, X, Calendar, MapPin, Link2, Loader2, ArrowLeft, Briefcase, Info, Edit3, Trash2, GripVertical, Tags } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet"
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
import { analyzeJobDescription } from "@/lib/job-analyzer"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { getJobStates } from "@/lib/storage"
import { MapSearch } from "./map-search"
import { useLanguage } from "@/lib/i18n"
import { EnhancedTagInput } from "./enhanced-tag-input"
import { useMediaQuery } from "@/hooks/use-media-query"
import { z } from "zod"
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
  followUpDate: z.string().optional(),

  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  salaryCurrency: z.string().max(3, "Currency code should be 3 characters").optional(),

  workMode: z.enum(["remote", "onsite", "hybrid", "flexible"]).optional(),
  excitement: z.number().min(0).max(5).optional(),

  description: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),

  // Fields not directly on form but part of JobData that need to be preserved
  id: z.string().optional(),
  // salary: z.string().optional(), // Old field, will be constructed or ignored
});

// To handle numeric inputs that might come as strings and convert to numbers or undefined
const toNumberOrUndefined = (val: unknown): number | undefined => {
  if (val === undefined || val === null || val === "") return undefined;
  const num = Number(val);
  return isNaN(num) ? undefined : num;
};

const preprocessJobSchema = jobSchema.extend({
    salaryMin: z.preprocess(toNumberOrUndefined, z.number().optional()),
    salaryMax: z.preprocess(toNumberOrUndefined, z.number().optional()),
    excitement: z.preprocess(toNumberOrUndefined, z.number().min(0).max(5).optional()),
});


interface EnhancedJobModalProps {
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
  excitement: 3,
  tags: [],
  description: "",
  notes: "",
  url: "",
  date: new Date().toISOString().split("T")[0],
  applyDate: new Date().toISOString().split("T")[0],
  workMode: "remote",
}

export function EnhancedJobModal({
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
}: EnhancedJobModalProps) {
  const [open, setOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [formData, setFormData] = useState<Partial<JobData>>(initialFormData)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const [jobStates, setJobStatesInternal] = useState<JobState[]>([]) // Renamed to avoid conflict
  const [showLocationSearch, setShowLocationSearch] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const { toast } = useToast()
  const { t } = useLanguage()
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isMobile = useMediaQuery("(max-width: 768px)")
  const firstInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (controlledOpen !== undefined) {
      setOpen(controlledOpen)
      if (controlledOpen && firstInputRef.current) {
        setTimeout(() => firstInputRef.current?.focus(), 100)
      }
    }
  }, [controlledOpen])

  useEffect(() => {
    setIsEditMode(!!jobToEdit)
    if (jobToEdit) {
      // Convert date strings to Date objects if necessary for calendar, then back to string for form
      const applyDate = jobToEdit.applyDate ? parseISO(jobToEdit.applyDate) : undefined;
      const followUpDate = jobToEdit.followUpDate ? parseISO(jobToEdit.followUpDate) : undefined;

      setFormData({
        ...initialFormData, // ensure all fields are present
        ...jobToEdit,
        // Ensure dates are in 'yyyy-MM-dd' for consistency if they exist
        date: jobToEdit.date ? format(parseISO(jobToEdit.date), "yyyy-MM-dd") : initialFormData.date,
        applyDate: applyDate ? format(applyDate, "yyyy-MM-dd") : undefined,
        followUpDate: followUpDate ? format(followUpDate, "yyyy-MM-dd") : undefined,
      })
    } else {
      const defaultStatusState = initialStatus
        ? jobStates.find((s) => s.id === initialStatus)
        : jobStates.find((s) => s.isDefault) || jobStates[0]
      setFormData({
        ...initialFormData,
        status: defaultStatusState?.id || jobStates[0]?.id,
        applyDate: new Date().toISOString().split("T")[0],
        date: new Date().toISOString().split("T")[0],
      })
    }
  }, [jobToEdit, isEditMode, jobStates, initialStatus])


  const handleOpenChange = (isOpen: boolean) => {
    if (controlledOpen === undefined) {
      setOpen(isOpen)
    }

    if (onClose && !isOpen) {
      onClose()
    }

    if (isOpen) {
      const states = propJobStates || getJobStates()
      setJobStatesInternal(states.sort((a, b) => a.order - b.order))
      setFormErrors({}) // Clear errors when modal opens

      if (jobToEdit) { // If editing, populate form
        setIsEditMode(true)
        const applyDate = jobToEdit.applyDate ? parseISO(jobToEdit.applyDate) : new Date();
        const followUpDate = jobToEdit.followUpDate ? parseISO(jobToEdit.followUpDate) : undefined;

        setFormData({
            ...initialFormData, // Reset to ensure clean state
            ...jobToEdit,
            date: jobToEdit.date ? format(parseISO(jobToEdit.date), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
            applyDate: format(applyDate, "yyyy-MM-dd"),
            followUpDate: followUpDate ? format(followUpDate, "yyyy-MM-dd") : undefined,
         })
      } else { // If creating, set defaults
        setIsEditMode(false)
        const defaultStatusState = initialStatus
          ? states.find((s) => s.id === initialStatus)
          : states.find((s) => s.isDefault) || states[0]
        setFormData({
          ...initialFormData,
          status: defaultStatusState?.id || states[0]?.id,
          applyDate: new Date().toISOString().split("T")[0],
          date: new Date().toISOString().split("T")[0], // last updated / activity date
        })
      }
      if (firstInputRef.current) {
        setTimeout(() => firstInputRef.current?.focus(), 100)
      }
    } else {
      // Reset form when closing only if not controlled
      if (controlledOpen === undefined) {
        setFormData(initialFormData)
        setShowLocationSearch(false)
        setIsSaving(false)
      }
    }
  }

  // Auto-tag generation from description (simplified)
  useEffect(() => {
    if (formData.description && formData.description.length > 50 && !isEditMode) { // Only for new jobs initially
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
      debounceTimeoutRef.current = setTimeout(() => {
        const extracted = analyzeJobDescription(formData.description!)
        const existingTags = formData.tags || []
        const newAutoTags = Array.from(
          new Set([...extracted.technicalSkills, ...extracted.softSkills, ...extracted.requirements])
        ).filter(tag => !existingTags.includes(tag)); // Add only new tags

        if (newAutoTags.length > 0) {
          setFormData((prev) => ({
            ...prev,
            tags: [...existingTags, ...newAutoTags],
          }))
        }
      }, 1500)
    }
    return () => {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current)
    }
  }, [formData.description, isEditMode])


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (formErrors[name]) {
      setFormErrors(prev => ({...prev, [name]: ""})) // Clear error on change
    }
  }

  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = value === "" ? undefined : Number(value);
    setFormData((prev) => ({ ...prev, [name]: numValue }));
    if (formErrors[name]) {
      setFormErrors(prev => ({...prev, [name]: ""}));
    }
  };

  const handleSelectChange = (name: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
     if (formErrors[name]) {
      setFormErrors(prev => ({...prev, [name]: ""}))
    }
  }

  const handleDateSelect = (field: "date" | "applyDate" | "followUpDate", selectedDate: Date | undefined) => {
    setFormData((prev) => ({
      ...prev,
      [field]: selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined,
    }))
    if (formErrors[field]) {
      setFormErrors(prev => ({...prev, [field]: ""}))
    }
  }

  const handleLocationSelect = (location: string) => {
    setFormData((prev) => ({ ...prev, location }))
    setShowLocationSearch(false)
    if (formErrors.location) {
      setFormErrors(prev => ({...prev, location: ""}))
    }
  }

  const handleTagsChange = (newTags: string[]) => {
    setFormData((prev) => ({ ...prev, tags: newTags }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setFormErrors({})

    const validationResult = preprocessJobSchema.safeParse(formData)

    if (!validationResult.success) {
      const errors: Record<string, string> = {}
      validationResult.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message
        }
      })
      setFormErrors(errors)
      setIsSaving(false)
      toast({ title: t("validationError"), description: t("pleaseCheckForm"), variant: "destructive" })
      return
    }

    const processedData = validationResult.data;

    const jobDataToSave: JobData = {
      ...initialFormData, // Start with defaults to ensure all fields
      id: isEditMode && jobToEdit ? jobToEdit.id : Date.now().toString(), // Persist ID if editing
      ...processedData, // Add validated and processed form data
      status: processedData.status as ColumnType, // Ensure status is ColumnType
      workMode: processedData.workMode as WorkMode,
      // Ensure date is set, default to today if somehow undefined after processing
      date: processedData.date || format(new Date(), "yyyy-MM-dd"),
      applyDate: processedData.applyDate || (isEditMode ? undefined : format(new Date(), "yyyy-MM-dd")),
    }

    try {
      if (isEditMode && onEditJob && jobToEdit) {
        onEditJob(jobDataToSave)
      } else {
        onAddJob(jobDataToSave)
      }
      toast({
        title: isEditMode ? t("jobUpdated") : t("jobAdded"),
        description: isEditMode ? t("jobSuccessfullyUpdated") : t("newJobSuccessfullyAdded"),
      })
      handleOpenChange(false) // Close modal on success
    } catch (error) {
      console.error("Error saving job:", error)
      toast({ title: t("error"), description: t("failedToSaveJob"), variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const renderHeader = () => (
    <SheetHeader className="px-6 pt-6">
      <SheetTitle className="text-xl font-semibold">
        {isEditMode ? t("editJob") : t("addNewJob")}
      </SheetTitle>
      <SheetDescription>
        {isEditMode ? t("editJobDescription") : t("addNewJobDescription")}
      </SheetDescription>
    </SheetHeader>
  )

  const renderFooter = () => (
    <SheetFooter className="px-6 py-4 border-t gap-2 flex-col sm:flex-row">
      <SheetClose asChild>
        <Button variant="outline" type="button" disabled={isSaving}>
          {t("cancel")}
        </Button>
      </SheetClose>
      <Button type="submit" disabled={isSaving} form="job-form">
        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isEditMode ? t("saveChanges") : t("addJob")}
      </Button>
    </SheetFooter>
  )

  const FormField = ({ name, label, children, error, required = false, tip }: { name: string, label: string, children: React.ReactNode, error?: string, required?: boolean, tip?: string }) => (
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
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  )

  // Helper to get Date object for Calendar, handling undefined and invalid dates
  const getDateForCalendar = (dateString?: string): Date | undefined => {
    if (!dateString) return undefined;
    try {
      const parsed = parseISO(dateString);
      if (isNaN(parsed.getTime())) return undefined; // Invalid date
      return parsed;
    } catch (e) {
      return undefined; // Error parsing
    }
  };


  // Trigger button for uncontrolled mode
  const triggerButton = (
    <Button
      variant={buttonVariant}
      size={buttonSize}
      className={cn(buttonClassName, !buttonIcon && !buttonLabel && "p-2")} // Ensure icon-only looks right
      onClick={() => handleOpenChange(true)}
    >
      {buttonIcon || <Plus className="h-4 w-4" />}
      {buttonLabel && <span className={buttonIcon ? "ml-2" : ""}>{isEditMode && jobToEdit ? t("edit") : (buttonLabel || t("addJob"))}</span>}
    </Button>
  )

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
                <h3 className="text-sm font-semibold -mt-9 bg-background px-2 w-fit">{t("coreDetails")}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                  <FormField name="company" label={t("company")} required error={formErrors.company}>
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

                  <FormField name="position" label={t("position")} required error={formErrors.position}>
                    <Input
                      id="position"
                      name="position"
                      value={formData.position || ""}
                      onChange={handleChange}
                      placeholder="e.g. Software Engineer"
                      className={cn(formErrors.position && "border-destructive")}
                    />
                  </FormField>

                  <FormField
                    name="location"
                    label={t("location")}
                    error={formErrors.location}
                    tip="Where is this job located? Enter a city, state, country or 'Remote'"
                  >
                     <div className="flex gap-2">
                          <Input
                            id="location"
                            name="location"
                            value={formData.location || ""}
                            onChange={handleChange}
                            placeholder="e.g. San Francisco, CA or Remote"
                            className={cn(formErrors.location && "border-destructive", "flex-grow")}
                          />
                          <TooltipProvider>
                              <Tooltip>
                                  <TooltipTrigger asChild>
                                      <Button type="button" variant="outline" size="icon" onClick={() => setShowLocationSearch(!showLocationSearch)} className="h-10 w-10 shrink-0">
                                          <MapPin className="h-4 w-4" />
                                      </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top"><p>{showLocationSearch ? "Enter Manually" : "Search on Map"}</p></TooltipContent>
                              </Tooltip>
                          </TooltipProvider>
                      </div>
                      {showLocationSearch && (
                          <div className="absolute z-50 left-0 right-0 mt-1">
                              <MapSearch
                                  onLocationSelect={handleLocationSelect}
                                  onClose={() => setShowLocationSearch(false)}
                              />
                          </div>
                      )}
                  </FormField>

                  <FormField
                    name="url"
                    label={t("jobUrl")}
                    error={formErrors.url}
                    tip="Link to the original job posting (optional)"
                  >
                    <Input
                      id="url"
                      name="url"
                      type="url"
                      value={formData.url || ""}
                      onChange={handleChange}
                      placeholder="https://example.com/job/123"
                      className={cn(formErrors.url && "border-destructive")}
                    />
                  </FormField>
                </div>
              </div>

              {/* Status and Dates Section */}
              <div className="space-y-6 rounded-md p-5 bg-muted/10 border">
                <h3 className="text-sm font-semibold -mt-9 bg-background px-2 w-fit">{t("statusAndDates")}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5 items-end">
                  <FormField name="status" label={t("status")} required error={formErrors.status}>
                    <Select
                      value={formData.status || ""}
                      onValueChange={(value) => handleSelectChange("status", value)}
                    >
                      <SelectTrigger className={cn(formErrors.status && "border-destructive")}>
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {jobStates.map((state) => (
                          <SelectItem key={state.id} value={state.id}>
                            <div className="flex items-center">
                              <span className="h-2.5 w-2.5 rounded-full mr-2" style={{ backgroundColor: state.color }} />
                              {state.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField name="applyDate" label={t("dateApplied")} error={formErrors.applyDate}>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.applyDate && "text-muted-foreground",
                            formErrors.applyDate && "border-destructive"
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {formData.applyDate ? format(parseISO(formData.applyDate), "PPP") : <span>{t("selectDate")}</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={formData.applyDate ? getDateForCalendar(formData.applyDate) : undefined}
                          onSelect={(date) => handleDateSelect("applyDate", date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </FormField>

                  <FormField
                    name="followUpDate"
                    label={t("followUp")}
                    error={formErrors.followUpDate}
                    tip="When to follow up on this application"
                  >
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.followUpDate && "text-muted-foreground",
                            formErrors.followUpDate && "border-destructive"
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {formData.followUpDate ? format(parseISO(formData.followUpDate), "PPP") : <span>{t("selectDate")}</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={formData.followUpDate ? getDateForCalendar(formData.followUpDate) : undefined}
                          onSelect={(date) => handleDateSelect("followUpDate", date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </FormField>
                </div>
              </div>

              {/* Salary Information - Keep existing border but improve internal spacing */}
              <div className="space-y-6 rounded-md p-5 border bg-muted/5">
                <h3 className="text-sm font-semibold -mt-9 bg-background px-2 w-fit">{t("salaryInformation")}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5 items-start">
                  <FormField
                    name="salaryMin"
                    label={t("minimumSalary")}
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
                    label={t("maximumSalary")}
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

                  <FormField name="salaryCurrency" label={t("currency")} error={formErrors.salaryCurrency}>
                    <Input
                      id="salaryCurrency"
                      name="salaryCurrency"
                      value={formData.salaryCurrency || ""}
                      onChange={handleChange}
                      placeholder="USD"
                      maxLength={3}
                      className={cn(formErrors.salaryCurrency && "border-destructive")}
                    />
                  </FormField>
                </div>
              </div>

              {/* Work Details Section */}
              <div className="space-y-6 rounded-md p-5 bg-muted/10 border">
                <h3 className="text-sm font-semibold -mt-9 bg-background px-2 w-fit">{t("workDetails")}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 items-start">
                  <FormField name="workMode" label={t("workMode")} error={formErrors.workMode}>
                    <Select
                      value={formData.workMode || ""}
                      onValueChange={(value) => handleSelectChange("workMode", value as WorkMode)}
                    >
                      <SelectTrigger className={cn(formErrors.workMode && "border-destructive")}>
                        <SelectValue placeholder={t("selectWorkMode")} />
                      </SelectTrigger>
                      <SelectContent>
                        {(["remote", "onsite", "hybrid", "flexible"] as WorkMode[]).map((mode) => (
                          <SelectItem key={mode} value={mode}>
                            <div className="flex items-center">
                              <Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />
                              {t(`workModes.${mode}`)}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField
                    name="excitement"
                    label={t("excitementLevel")}
                    error={formErrors.excitement}
                    tip="How excited are you about this job opportunity?"
                  >
                    <div className="flex items-center space-x-1 pt-1.5 bg-muted/30 rounded-md p-2 h-10">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <TooltipProvider key={star} delayDuration={100}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleSelectChange("excitement", star)}
                                className={cn(
                                  "h-7 w-7 p-0",
                                  (formData.excitement || 0) >= star
                                    ? "text-yellow-400 hover:text-yellow-500"
                                    : "text-muted-foreground hover:text-yellow-400"
                                )}
                              >
                                <Star className={cn("h-5 w-5", (formData.excitement || 0) >= star && "fill-current")} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top"><p>{star}</p></TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                       {(formData.excitement || 0) > 0 && (
                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => handleSelectChange("excitement", 0)}>
                              <X className="h-4 w-4"/>
                          </Button>
                       )}
                    </div>
                  </FormField>
                </div>
              </div>

              {/* Skills Section */}
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
                  <div className={cn("p-3 border rounded-md bg-background", formErrors.tags && "border-destructive ring-1 ring-destructive")}>
                    <EnhancedTagInput
                      tags={formData.tags || []}
                      onTagsChange={handleTagsChange}
                      placeholder={t("typeAndPressEnterToAddTags")}
                    />
                  </div>
                </FormField>
              </div>

              {/* Description and Notes Section */}
              <div className="space-y-6 rounded-md p-5 bg-muted/10 border">
                <h3 className="text-sm font-semibold -mt-9 bg-background px-2 w-fit">{t("jobDetails")}</h3>
                <FormField
                  name="description"
                  label={t("jobDescription")}
                  error={formErrors.description}
                  tip="Paste the job description or write a summary"
                >
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description || ""}
                    onChange={handleChange}
                    placeholder={t("pasteOrWriteJobDescription")}
                    rows={6}
                    className={cn("min-h-[150px] font-mono text-sm bg-background", formErrors.description && "border-destructive")}
                  />
                </FormField>

                <FormField
                  name="notes"
                  label={t("notes")}
                  error={formErrors.notes}
                  tip="Add your thoughts, interview prep, or anything else you want to remember"
                >
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes || ""}
                    onChange={handleChange}
                    placeholder={t("addPersonalNotes")}
                    rows={4}
                    className={cn("min-h-[100px] bg-background", formErrors.notes && "border-destructive")}
                  />
                </FormField>
              </div>

              {/* Hidden field for last updated date for sorting/filtering logic if needed */}
              {isEditMode && formData.date && (
                 <input type="hidden" name="date" value={formData.date} />
              )}

            </form>
          </ScrollArea>

          <DialogFooter className="flex justify-between pt-4 border-t">
            <DialogClose asChild>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                {t("cancel")}
              </Button>
            </DialogClose>
            <Button onClick={handleSubmit} disabled={isSaving} type="submit" form="job-form">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("saving")}
                </>
              ) : isEditMode ? (
                <>
                  <Edit3 className="mr-2 h-4 w-4" />
                  {t("saveChanges")}
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  {t("addJob")}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}