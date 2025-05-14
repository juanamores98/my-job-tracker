"use client"

import { useState, useEffect, useRef } from "react"
import { z } from "zod"
import {
  Plus, Star, X, Calendar, MapPin, Link2, Loader2,
  Briefcase, Info, Edit3, Trash2, FileText,
  DollarSign, Paperclip, CheckSquare, Tags
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

// Zod Schema for Job Validation
const jobSchema = z.object({
  company: z.string().min(1, "Company name is required"),
  position: z.string().min(1, "Position is required"),
  location: z.string().optional(),
  url: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  status: z.string().min(1, "Status is required"),
  date: z.string().optional(), // Date of application or last update
  applyDate: z.string().optional(),

  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  salaryCurrency: z.string().max(3, "Currency code should be 3 characters").optional(),

  workMode: z.enum(["remote", "onsite", "hybrid", "flexible"]).optional(),
  priority: z.number().min(0).max(5).optional(),
  tags: z.array(z.string()).optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
})

interface MinimalJobModalProps {
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
  description: "",
  notes: "",
  url: "",
  date: new Date().toISOString().split("T")[0],
  applyDate: new Date().toISOString().split("T")[0],
  workMode: "remote",
}

export function MinimalJobModal({
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
}: MinimalJobModalProps) {
  const [open, setOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [formData, setFormData] = useState<Partial<JobData>>(initialFormData)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState("basic")

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
        setActiveTab("basic")
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
        title: "Please fix the errors",
        description: "There are some issues with your form entries.",
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

  // Priority rating component
  const PriorityRating = ({ value, onChange }: { value: number, onChange: (value: number) => void }) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
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

  // Minimalist form field
  const MinimalField = ({
    name,
    label,
    icon,
    children,
    error
  }: {
    name: string,
    label: string,
    icon?: React.ReactNode,
    children: React.ReactNode,
    error?: string
  }) => (
    <div className="space-y-2 w-full">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <Label
          htmlFor={name}
          className={cn(
            "text-base font-normal",
            error && "text-destructive"
          )}
        >
          {label}
        </Label>
      </div>

      {children}

      {error && (
        <p className="text-sm text-destructive mt-1">
          {error}
        </p>
      )}
    </div>
  )

  return (
    <>
      {controlledOpen === undefined && triggerButton}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md md:max-w-xl">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit Job" : "Add Job"}</DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Update job details"
                : "Enter job details"}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="description">Description</TabsTrigger>
            </TabsList>

            <form id="job-form" onSubmit={handleSubmit}>
              <TabsContent value="basic" className="space-y-4 mt-0">
                <div className="grid grid-cols-1 gap-6">
                  {/* Company & Position */}
                  <MinimalField name="company" label="Company" error={formErrors.company}>
                    <Input
                      id="company"
                      name="company"
                      ref={firstInputRef}
                      value={formData.company || ""}
                      onChange={handleChange}
                      placeholder="Company name"
                      className={cn(
                        "border-0 border-b rounded-none px-0 h-9 text-lg focus-visible:ring-0 focus-visible:border-primary",
                        formErrors.company && "border-destructive"
                      )}
                    />
                  </MinimalField>

                  <MinimalField name="position" label="Job title" error={formErrors.position}>
                    <Input
                      id="position"
                      name="position"
                      value={formData.position || ""}
                      onChange={handleChange}
                      placeholder="Position or role"
                      className={cn(
                        "border-0 border-b rounded-none px-0 h-9 text-lg focus-visible:ring-0 focus-visible:border-primary",
                        formErrors.position && "border-destructive"
                      )}
                    />
                  </MinimalField>

                  {/* Status and Date */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="flex justify-between items-center">
                      <Select
                        value={formData.status}
                        onValueChange={(value) => handleSelectChange("status", value)}
                      >
                        <SelectTrigger
                          id="status"
                          className={cn(
                            "w-[180px] border rounded-md",
                            formErrors.status && "border-destructive"
                          )}
                        >
                          <SelectValue placeholder="Select status" />
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
                    </div>

                    <MinimalField
                      name="applyDate"
                      label="Date"
                      icon={<Calendar className="h-4 w-4" />}
                      error={formErrors.applyDate}
                    >
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal border-0 border-b rounded-none px-0 h-9 focus-visible:ring-0 focus-visible:border-primary",
                              !formData.applyDate && "text-muted-foreground"
                            )}
                          >
                            {formData.applyDate ? (
                              format(new Date(formData.applyDate), "MMM d, yyyy")
                            ) : (
                              <span>Select date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={formData.applyDate ? new Date(formData.applyDate) : undefined}
                            onSelect={(date) => handleDateChange("applyDate", date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </MinimalField>
                  </div>

                  {/* Two column layout */}
                  <div className="grid grid-cols-2 gap-6">
                    <MinimalField
                      name="salary"
                      label="Salary"
                      icon={<DollarSign className="h-4 w-4" />}
                      error={formErrors.salaryMin}
                    >
                      <div className="flex items-center gap-2">
                        <Input
                          id="salaryMin"
                          name="salaryMin"
                          type="number"
                          value={formData.salaryMin === undefined ? "" : formData.salaryMin}
                          onChange={handleNumericChange}
                          placeholder="Min"
                          className={cn(
                            "border-0 border-b rounded-none px-0 h-9 focus-visible:ring-0 focus-visible:border-primary",
                            formErrors.salaryMin && "border-destructive"
                          )}
                        />
                        <span className="text-muted-foreground">-</span>
                        <Input
                          id="salaryMax"
                          name="salaryMax"
                          type="number"
                          value={formData.salaryMax === undefined ? "" : formData.salaryMax}
                          onChange={handleNumericChange}
                          placeholder="Max"
                          className="border-0 border-b rounded-none px-0 h-9 focus-visible:ring-0 focus-visible:border-primary"
                        />
                        <Select
                          value={formData.salaryCurrency || "USD"}
                          onValueChange={(value) => handleSelectChange("salaryCurrency", value)}
                        >
                          <SelectTrigger className="w-[70px] h-8">
                            <SelectValue placeholder="$" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </MinimalField>

                    <MinimalField
                      name="location"
                      label="Location"
                      icon={<MapPin className="h-4 w-4" />}
                      error={formErrors.location}
                    >
                      <Popover>
                        <PopoverTrigger asChild>
                          <div className="relative">
                            <Input
                              id="location"
                              name="location"
                              value={formData.location || ""}
                              onChange={handleChange}
                              placeholder="City, country"
                              className="border-0 border-b rounded-none px-0 h-9 focus-visible:ring-0 focus-visible:border-primary w-full pr-8"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-9 w-8 p-0"
                            >
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0" align="end">
                          <Command>
                            <CommandInput placeholder="Search city..." />
                            <CommandList>
                              <CommandEmpty>No city found.</CommandEmpty>
                              <CommandGroup heading="Popular Cities">
                                <CommandItem onSelect={() => handleSelectChange("location", "New York, USA")}>
                                  New York, USA
                                </CommandItem>
                                <CommandItem onSelect={() => handleSelectChange("location", "London, UK")}>
                                  London, UK
                                </CommandItem>
                                <CommandItem onSelect={() => handleSelectChange("location", "San Francisco, USA")}>
                                  San Francisco, USA
                                </CommandItem>
                                <CommandItem onSelect={() => handleSelectChange("location", "Berlin, Germany")}>
                                  Berlin, Germany
                                </CommandItem>
                                <CommandItem onSelect={() => handleSelectChange("location", "Tokyo, Japan")}>
                                  Tokyo, Japan
                                </CommandItem>
                                <CommandItem onSelect={() => handleSelectChange("location", "Singapore")}>
                                  Singapore
                                </CommandItem>
                                <CommandItem onSelect={() => handleSelectChange("location", "Sydney, Australia")}>
                                  Sydney, Australia
                                </CommandItem>
                                <CommandItem onSelect={() => handleSelectChange("location", "Toronto, Canada")}>
                                  Toronto, Canada
                                </CommandItem>
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </MinimalField>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <MinimalField
                      name="url"
                      label="Link"
                      icon={<Link2 className="h-4 w-4" />}
                      error={formErrors.url}
                    >
                      <Input
                        id="url"
                        name="url"
                        value={formData.url || ""}
                        onChange={handleChange}
                        placeholder="https://example.com/jobs/123"
                        className="border-0 border-b rounded-none px-0 h-9 focus-visible:ring-0 focus-visible:border-primary"
                      />
                    </MinimalField>

                    <MinimalField
                      name="workMode"
                      label="Work Modality"
                      icon={<Briefcase className="h-4 w-4" />}
                      error={formErrors.workMode}
                    >
                      <Select
                        value={formData.workMode}
                        onValueChange={(value) => handleSelectChange("workMode", value as WorkMode)}
                      >
                        <SelectTrigger
                          id="workMode"
                          className="border-0 border-b rounded-none px-0 h-9 focus-visible:ring-0 focus-visible:border-primary"
                        >
                          <SelectValue placeholder="Select work mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="remote">Remote</SelectItem>
                          <SelectItem value="onsite">On-site</SelectItem>
                          <SelectItem value="hybrid">Hybrid</SelectItem>
                          <SelectItem value="flexible">Flexible</SelectItem>
                        </SelectContent>
                      </Select>
                    </MinimalField>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="details" className="space-y-6 mt-0">
                <div className="grid grid-cols-1 gap-6">
                  <MinimalField
                    name="priority"
                    label="Priority / Rating"
                    error={formErrors.priority}
                    icon={<Star className="h-4 w-4" />}
                  >
                    <div className="py-2">
                      <PriorityRating
                        value={formData.priority || 3}
                        onChange={handlePriorityChange}
                      />
                    </div>
                  </MinimalField>

                  <MinimalField
                    name="notes"
                    label="Notes"
                    error={formErrors.notes}
                  >
                    <Textarea
                      id="notes"
                      name="notes"
                      value={formData.notes || ""}
                      onChange={handleChange}
                      placeholder="Add note"
                      className="min-h-[100px] border rounded-md"
                    />
                  </MinimalField>

                  <div className="space-y-2">
                    <h3 className="text-base font-medium">To-Dos</h3>
                    <div className="flex items-center gap-2">
                      <CheckSquare className="h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Type to add todo"
                        className="border-0 border-b rounded-none px-0 h-9 focus-visible:ring-0 focus-visible:border-primary"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-base font-medium">Files</h3>
                    <div className="border border-dashed rounded-md p-6 text-center">
                      <Paperclip className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Drag & drop files here, or click to select files
                      </p>
                    </div>
                  </div>

                  <MinimalField
                    name="tags"
                    label=""
                    error={formErrors.tags}
                    icon={<Tags className="h-4 w-4 text-muted-foreground" />}
                  >
                    <div className={cn(
                      "p-3 border rounded-md bg-background",
                      formErrors.tags && "border-destructive"
                    )}>
                      <EnhancedTagInput
                        tags={formData.tags || []}
                        onTagsChange={handleTagsChange}
                        placeholder="Type and press Enter to add tags"
                      />
                    </div>
                  </MinimalField>
                </div>
              </TabsContent>

              <TabsContent value="description" className="space-y-4 mt-0">
                <MinimalField
                  name="description"
                  label="Job Description"
                  error={formErrors.description}
                >
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description || ""}
                    onChange={handleChange}
                    placeholder="Paste the job description here..."
                    rows={12}
                    className="min-h-[300px] border rounded-md"
                  />
                </MinimalField>
              </TabsContent>
            </form>
          </Tabs>

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
              {isEditMode ? "Save" : "Add Job"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}