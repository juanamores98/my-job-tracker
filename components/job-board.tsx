"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { DraggableColumn } from "./draggable-column"
import { JobCard } from "./job-card"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import type { JobData, ColumnType, JobFilter, SortOption, GroupOption, JobState } from "@/lib/types"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  FileUp,
  Table,
  Columns,
  X,
  Settings,
  Plus,
  MoreHorizontal,
  ListOrderedIcon as ListReorder,
  Loader2,
  ArrowLeft,
  ArrowRight,
  FileJson,
} from "lucide-react"
import { getJobs, saveJobs, getJobStates, saveJobStates } from "@/lib/storage"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/lib/i18n"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { JobTable } from "./job-table"
import Link from "next/link"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { useMediaQuery } from "@/hooks/use-media-query"
import { AddStatusModal } from "./add-status-modal"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EnhancedStatusModal } from "./enhanced-status-modal"
import { AdvancedJobExtractor } from "./advanced-job-extractor"
import { DashboardHeader } from "./dashboard-header"
import { EnhancedJobModal } from "./enhanced-job-modal"

export function JobBoard() {
  const [jobs, setJobs] = useState<JobData[]>([])
  const [jobStates, setJobStates] = useState<JobState[]>([])
  const [view, setView] = useState<"kanban" | "table">("kanban")
  const [filter, setFilter] = useState<JobFilter>({})
  const [sort, setSort] = useState<SortOption>({ field: "date", order: "desc" })
  const [group, setGroup] = useState<GroupOption>({ field: "status" })
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddStatusModalOpen, setIsAddStatusModalOpen] = useState(false)
  const [isStatusManagerOpen, setIsStatusManagerOpen] = useState(false)
  const [isAddJobModalOpen, setIsAddJobModalOpen] = useState(false)
  const [isExtractionModalOpen, setIsExtractionModalOpen] = useState(false)
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const [editingJob, setEditingJob] = useState<JobData | null>(null)
  const [isEditJobModalOpen, setIsEditJobModalOpen] = useState(false)
  const { toast } = useToast()
  const { t } = useLanguage()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isMobile = useMediaQuery("(max-width: 768px)")
  const isSmallScreen = useMediaQuery("(max-width: 1024px)")
  const isExtraSmallScreen = useMediaQuery("(max-width: 640px)")

  useEffect(() => {
    // Load jobs from localStorage
    const loadedJobs = getJobs()
    setJobs(loadedJobs)

    // Load job states
    const states = getJobStates()
    setJobStates(states.sort((a, b) => a.order - b.order))

    setIsLoading(false)
  }, [])

  // Apply filters, sorting, and grouping
  const filteredJobs = useMemo(() => {
    let result = [...jobs]

    // In kanban view, we only apply search term filter
    if (view === "kanban") {
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        result = result.filter(
          (job) =>
            job.company.toLowerCase().includes(term) ||
            job.position.toLowerCase().includes(term) ||
            job.location?.toLowerCase().includes(term) ||
            job.tags?.some((tag) => tag.toLowerCase().includes(term)) ||
            job.notes?.toLowerCase().includes(term) ||
            job.description?.toLowerCase().includes(term),
        )
      }
      return result
    }

    // For table view, apply all filters
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (job) =>
          job.company.toLowerCase().includes(term) ||
          job.position.toLowerCase().includes(term) ||
          job.location?.toLowerCase().includes(term) ||
          job.tags?.some((tag) => tag.toLowerCase().includes(term)) ||
          job.notes?.toLowerCase().includes(term) ||
          job.description?.toLowerCase().includes(term),
      )
    }

    // Apply status filter
    if (filter.status && filter.status.length > 0) {
      result = result.filter((job) => filter.status?.includes(job.status))
    }

    // Apply date range filter
    if (filter.dateRange) {
      if (filter.dateRange.start) {
        result = result.filter((job) => job.date && job.date >= filter.dateRange?.start!)
      }
      if (filter.dateRange.end) {
        result = result.filter((job) => job.date && job.date <= filter.dateRange?.end!)
      }
    }

    // Apply excitement filter
    if (filter.excitement && filter.excitement.length > 0) {
      result = result.filter((job) => job.priority && filter.excitement?.includes(job.priority))
    }

    // Apply work mode filter
    if (filter.workMode && filter.workMode.length > 0) {
      result = result.filter((job) => job.workMode && filter.workMode?.includes(job.workMode))
    }

    // Apply company filter
    if (filter.company && filter.company.length > 0) {
      result = result.filter((job) => filter.company?.includes(job.company))
    }

    // Apply location filter
    if (filter.location && filter.location.length > 0) {
      result = result.filter((job) => job.location && filter.location?.some((loc) => job.location?.includes(loc)))
    }

    // Apply tags filter
    if (filter.tags && filter.tags.length > 0) {
      result = result.filter((job) => job.tags && filter.tags?.some((tag) => job.tags?.includes(tag)))
    }

    // Apply sorting
    result.sort((a, b) => {
      const valueA: any = a[sort.field as keyof JobData]
      const valueB: any = b[sort.field as keyof JobData]

      // Handle undefined values
      if (valueA === undefined) return sort.order === "asc" ? -1 : 1
      if (valueB === undefined) return sort.order === "asc" ? 1 : -1

      // Handle string comparison
      if (typeof valueA === "string" && typeof valueB === "string") {
        return sort.order === "asc" ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA)
      }

      // Handle number comparison
      return sort.order === "asc" ? valueA - valueB : valueB - valueA
    })

    return result
  }, [jobs, filter, sort, searchTerm, view])

  // Update active filters display
  useEffect(() => {
    const filters: string[] = []

    if (filter.status && filter.status.length > 0) {
      filters.push(`Status: ${filter.status.join(", ")}`)
    }

    if (filter.dateRange?.start || filter.dateRange?.end) {
      const dateFilter = `Date: ${filter.dateRange.start || "Any"} to ${filter.dateRange.end || "Any"}`
      filters.push(dateFilter)
    }

    if (filter.excitement && filter.excitement.length > 0) {
      filters.push(`Excitement: ${filter.excitement.join(", ")}`)
    }

    if (filter.workMode && filter.workMode.length > 0) {
      filters.push(`Work Mode: ${filter.workMode.join(", ")}`)
    }

    if (filter.company && filter.company.length > 0) {
      filters.push(`Company: ${filter.company.join(", ")}`)
    }

    if (filter.location && filter.location.length > 0) {
      filters.push(`Location: ${filter.location.join(", ")}`)
    }

    if (filter.tags && filter.tags.length > 0) {
      filters.push(`Tags: ${filter.tags.join(", ")}`)
    }

    setActiveFilters(filters)
  }, [filter])

  const moveJob = useCallback((jobId: string, targetColumn: ColumnType) => {
    const updatedJobs = jobs.map((job) => (job.id === jobId ? { ...job, status: targetColumn } : job))
    setJobs(updatedJobs)
    saveJobs(updatedJobs)

    toast({
      title: t("jobUpdated"),
      description: `${t("jobMovedTo")} ${targetColumn}`,
    })
  }, [jobs, toast, t])

  const addJob = (job: JobData) => {
    const updatedJobs = [...jobs, job]
    setJobs(updatedJobs)
    saveJobs(updatedJobs)

    toast({
      title: t("jobAdded"),
      description: t("newJobApplicationAdded"),
    })
  }

  const updateJob = (updatedJob: JobData) => {
    const updatedJobs = jobs.map((job) => (job.id === updatedJob.id ? updatedJob : job))
    setJobs(updatedJobs)
    saveJobs(updatedJobs)

    toast({
      title: t("jobUpdated"),
      description: t("jobApplicationUpdated"),
    })
  }

  const deleteJob = (jobId: string) => {
    const updatedJobs = jobs.filter((job) => job.id !== jobId)
    setJobs(updatedJobs)
    saveJobs(updatedJobs)

    toast({
      title: t("jobDeleted"),
      description: t("jobApplicationDeleted"),
    })
  }

  const exportJobs = (format: "json" | "csv") => {
    try {
      let content: string
      let filename: string
      let mimeType: string

      if (format === "json") {
        content = JSON.stringify(jobs, null, 2)
        filename = `job-tracker-export-${new Date().toISOString().split("T")[0]}.json`
        mimeType = "application/json"
      } else {
        // Create CSV content with headers
        const headers = [
          "id",
          "company",
          "position",
          "location",
          "salary",
          "date",
          "status",
          "notes",
          "url",
          "priority",
          "tags",
          "description",
          "workMode",
        ].join(",")

        const rows = jobs.map((job) => {
          return [
            job.id,
            `"${job.company.replace(/"/g, '""')}"`,
            `"${job.position.replace(/"/g, '""')}"`,
            job.location ? `"${job.location.replace(/"/g, '""')}"` : "",
            job.salary || "",
            job.date || "",
            job.status,
            job.notes ? `"${job.notes.replace(/"/g, '""')}"` : "",
            job.url || "",
            job.priority || "",
            job.tags ? `"${job.tags.join(";").replace(/"/g, '""')}"` : "",
            job.description ? `"${job.description.replace(/"/g, '""')}"` : "",
            job.workMode || "",
          ].join(",")
        })

        content = [headers, ...rows].join("\n")
        filename = `job-tracker-export-${new Date().toISOString().split("T")[0]}.csv`
        mimeType = "text/csv"
      }

      // Create download link
      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: t("exportSuccessful"),
        description: `${t("exportedJobsTo")} ${format.toUpperCase()}`,
      })
    } catch (error) {
      console.error(`Error exporting to ${format}:`, error)
      toast({
        title: t("exportFailed"),
        description: t("errorExportingJobs"),
        variant: "destructive",
      })
    }
  }

  const importJobs = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json,.csv"
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const reader = new FileReader()
      
      reader.onload = (event) => {
        try {
          const fileContent = event.target?.result as string
          
          // Determine file type based on extension
          if (file.name.endsWith(".json")) {
            // Parse JSON
            const importedJobs = JSON.parse(fileContent) as JobData[]
            
            // Basic validation
            if (!Array.isArray(importedJobs) || !importedJobs.every(job => 
              typeof job === 'object' && job.id && job.company && job.position && job.status)) {
              throw new Error("Invalid JSON format")
            }
            
            // Merge with existing jobs (avoid duplicates by ID)
            const existingIds = new Set(jobs.map(job => job.id))
            const newJobs = importedJobs.filter(job => !existingIds.has(job.id))
            const updatedJobs = [...jobs, ...newJobs]
            
            setJobs(updatedJobs)
            saveJobs(updatedJobs)
            
            toast({
              title: t("importSuccessful"),
              description: `${t("importedJobsCount")} ${newJobs.length}`,
            })
          } else if (file.name.endsWith(".csv")) {
            // Parse CSV
            const importedJobs = parseCSV(fileContent)
            
            // Merge with existing jobs (avoid duplicates by ID)
            const existingIds = new Set(jobs.map(job => job.id))
            const newJobs = importedJobs.filter(job => !existingIds.has(job.id))
            const updatedJobs = [...jobs, ...newJobs]
            
            setJobs(updatedJobs)
            saveJobs(updatedJobs)
            
            toast({
              title: t("importSuccessful"),
              description: `${t("importedJobsCount")} ${newJobs.length}`,
            })
          } else {
            throw new Error("Unsupported file format")
          }
        } catch (error) {
          console.error("Error importing jobs:", error)
          toast({
            title: t("importFailed"),
            description: t("errorImportingJobs"),
            variant: "destructive",
          })
        }
      }
      
      reader.readAsText(file)
    }
    
    input.click()
  }

  // Helper function to parse CSV
  const parseCSV = (csvData: string): JobData[] => {
    const rows = csvData.split("\n")
    const headers = rows[0].split(",")
    const jobs: JobData[] = []

    for (let i = 1; i < rows.length; i++) {
      if (!rows[i].trim()) continue

      // Parse CSV row, handling quoted fields with commas
      const values: string[] = []
      let currentValue = ""
      let insideQuotes = false

      for (const char of rows[i]) {
        if (char === '"') {
          insideQuotes = !insideQuotes
        } else if (char === "," && !insideQuotes) {
          values.push(currentValue)
          currentValue = ""
        } else {
          currentValue += char
        }
      }
      values.push(currentValue) // Add the last value

      // Create job object with extended fields
      const job: JobData = {
        id: values[0] || Date.now().toString(),
        company: values[1]?.replace(/^"|"$/g, "") || "",
        position: values[2]?.replace(/^"|"$/g, "") || "",
        location: values[3]?.replace(/^"|"$/g, "") || undefined,
        salary: values[4]?.replace(/^"|"$/g, "") || undefined,
        date: values[5] || undefined,
        status: (values[6] as ColumnType) || "wishlist",
        notes: values[7]?.replace(/^"|"$/g, "") || undefined,
        url: values[8]?.replace(/^"|"$/g, "") || undefined,
        priority: values[9] ? Number.parseInt(values[9]) : undefined,
        tags:
          values[10]
            ?.replace(/^"|"$/g, "")
            .split(",")
            .map((tag) => tag.trim()) || [],
        description: values[11]?.replace(/^"|"$/g, "") || "",
        workMode: (values[12] as any) || undefined,
        salaryMin: values[13] ? Number.parseInt(values[13]) : undefined,
        salaryMax: values[14] ? Number.parseInt(values[14]) : undefined,
        salaryCurrency: values[15] || undefined,
        applyDate: values[16] || undefined,
        followUpDate: values[17] || undefined,
        excitement: values[18] ? Number.parseInt(values[18]) : undefined,
        contactPerson: values[19]?.replace(/^"|"$/g, "") || undefined,
        contactEmail: values[20]?.replace(/^"|"$/g, "") || undefined,
      }

      jobs.push(job)
    }

    return jobs
  }

  // Get unique values for filters
  const getUniqueValues = (field: keyof JobData): string[] => {
    const values = new Set<string>()

    jobs.forEach((job) => {
      const value = job[field]
      if (value && typeof value === "string") {
        values.add(value)
      }
    })

    return Array.from(values).sort()
  }

  const uniqueCompanies = useMemo(() => getUniqueValues("company"), [jobs])
  const uniqueLocations = useMemo(() => getUniqueValues("location"), [jobs])

  // Get unique tags
  const uniqueTags = useMemo(() => {
    const tags = new Set<string>()

    jobs.forEach((job) => {
      if (job.tags) {
        job.tags.forEach((tag) => tags.add(tag))
      }
    })

    return Array.from(tags).sort()
  }, [jobs])

  // Clear all filters
  const clearFilters = () => {
    setFilter({})
    setSearchTerm("")
  }

  // Remove a specific filter
  const removeFilter = (filterName: string) => {
    const filterType = filterName.split(":")[0].trim().toLowerCase()

    setFilter((prev) => {
      const newFilter = { ...prev }

      switch (filterType) {
        case "status":
          delete newFilter.status
          break
        case "date":
          delete newFilter.dateRange
          break
        case "excitement":
          delete newFilter.excitement
          break
        case "work mode":
          delete newFilter.workMode
          break
        case "company":
          delete newFilter.company
          break
        case "location":
          delete newFilter.location
          break
        case "tags":
          delete newFilter.tags
          break
      }

      return newFilter
    })
  }

  // Scroll to column when status filter changes
  useEffect(() => {
    if (filter.status?.length === 1 && scrollContainerRef.current) {
      const columnId = filter.status[0]
      const columnElement = document.getElementById(`column-${columnId}`)

      if (columnElement) {
        const container = scrollContainerRef.current
        const scrollLeft = columnElement.offsetLeft - container.offsetLeft

        container.scrollTo({
          left: scrollLeft - 16, // Add some padding
          behavior: "smooth",
        })
      }
    }
  }, [filter.status])

  // Handle adding a new status
  const handleAddStatus = (newStatus: JobState) => {
    const updatedStates = [...jobStates, newStatus].sort((a, b) => a.order - b.order)
    setJobStates(updatedStates)
    saveJobStates(updatedStates)

    toast({
      title: t("statusAdded"),
      description: `${t("newStatusAdded")}: ${newStatus.name}`,
    })
  }

  // Handle updating a status
  const handleUpdateStatus = (updatedStatus: JobState) => {
    const updatedStates = jobStates.map((state) => (state.id === updatedStatus.id ? updatedStatus : state))
    setJobStates(updatedStates)
    saveJobStates(updatedStates)

    toast({
      title: t("statusUpdated"),
      description: `${t("statusUpdated")}: ${updatedStatus.name}`,
    })
  }

  // Handle deleting a status
  const handleDeleteStatus = (statusId: string) => {
    // Find default status to move jobs to
    const defaultStatus = jobStates.find((state) => state.isDefault)?.id || jobStates[0]?.id

    if (!defaultStatus || statusId === defaultStatus) {
      toast({
        title: t("cannotDeleteStatus"),
        description: t("cannotDeleteDefaultStatus"),
        variant: "destructive",
      })
      return
    }

    // Move all jobs from this status to default status
    const updatedJobs = jobs.map((job) => (job.status === statusId ? { ...job, status: defaultStatus } : job))

    // Remove the status
    const updatedStates = jobStates.filter((state) => state.id !== statusId)

    // Save changes
    setJobs(updatedJobs)
    setJobStates(updatedStates)
    saveJobs(updatedJobs)
    saveJobStates(updatedStates)

    toast({
      title: t("statusDeleted"),
      description: t("statusDeletedAndJobsMoved"),
    })
  }

  // Handle reordering statuses
  const handleReorderStatuses = (reorderedStates: JobState[]) => {
    setJobStates(reorderedStates)
    saveJobStates(reorderedStates)
  }

  // Function to move columns via drag and drop
  const moveColumn = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      const dragColumn = jobStates[dragIndex]
      const newJobStates = [...jobStates]

      // Remove the dragged column
      newJobStates.splice(dragIndex, 1)

      // Insert the dragged column at the new position
      newJobStates.splice(hoverIndex, 0, dragColumn)

      // Update the order property for each column
      const updatedJobStates = newJobStates.map((state, index) => ({
        ...state,
        order: index,
      }))

      setJobStates(updatedJobStates)
      saveJobStates(updatedJobStates)
    },
    [jobStates],
  )

  // Scroll the columns container left or right
  const scrollColumns = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const scrollAmount = 300 // Adjust as needed

      if (direction === "left") {
        container.scrollBy({ left: -scrollAmount, behavior: "smooth" })
      } else {
        container.scrollBy({ left: scrollAmount, behavior: "smooth" })
      }
    }
  }

  const handleOpenEditModal = (job: JobData) => {
    setEditingJob(job)
    setIsEditJobModalOpen(true)
  }

  const renderFloatingActionButton = () => {
    if (!isMobile) return null
    
    return (
      <Button
        className="fixed bottom-4 right-4 rounded-full w-14 h-14 shadow-lg z-50"
        onClick={() => setIsAddJobModalOpen(true)}
      >
        <Plus className="h-6 w-6" />
      </Button>
    )
  }

  const renderExportImportControls = () => (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 lg:px-3"
              onClick={() => exportJobs("json")}
            >
              <FileJson className="h-4 w-4" />
              {!isSmallScreen && <span className="ml-2">{t("export")}</span>}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>{t("exportJobsToJSON")}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 lg:px-3"
              onClick={importJobs}
            >
              <FileUp className="h-4 w-4" />
              {!isSmallScreen && <span className="ml-2">{t("import")}</span>}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>{t("importJobsFromJSON")}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Dashboard Header */}
      <DashboardHeader searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      {/* Fixed Header with Controls */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex justify-between items-center p-2 md:p-4">
          {/* Left Controls */}
          <div className="flex items-center space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size={isSmallScreen ? "icon" : "sm"}
                    onClick={() => setIsAddStatusModalOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    {!isSmallScreen && <span className="ml-2">Add Status</span>}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{t("createNewStatusColumn")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size={isSmallScreen ? "icon" : "sm"}
                    onClick={() => setIsStatusManagerOpen(true)}
                  >
                    <ListReorder className="h-4 w-4" />
                    {!isSmallScreen && <span className="ml-2">Manage Status</span>}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{t("reorderRenameAndManageStatusColumns")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Center/Main Controls */}
          <div className="flex items-center space-x-2">
            <div className="flex border rounded-md">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="default"
                      size="default"
                      className="rounded-r-none h-9"
                      onClick={() => setView("kanban")}
                    >
                      <Columns className="h-4 w-4" />
                      {!isSmallScreen && <span className="ml-2">Kanban</span>}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>{t("switchToKanbanBoardView")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="default"
                      size="default"
                      className="rounded-l-none h-9"
                      onClick={() => setView("table")}
                    >
                      <Table className="h-4 w-4" />
                      {!isSmallScreen && <span className="ml-2">Table</span>}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>{t("switchToTableView")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="default"
                    onClick={() => setIsExtractionModalOpen(true)}
                    className={isSmallScreen ? "px-2" : ""}
                  >
                    <Loader2 className="h-4 w-4" />
                    {!isSmallScreen && <span className="ml-2">Extract</span>}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{t("extractJobDetailsFromUrl")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="default"
                    size="default"
                    onClick={() => setIsAddJobModalOpen(true)}
                    className={isSmallScreen ? "px-2" : ""}
                  >
                    <Plus className="h-4 w-4" />
                    {!isSmallScreen && <span className="ml-2">New Job</span>}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{t("createNewJobApplication")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="h-9 w-9">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => exportJobs("json")}>
                        <FileJson className="mr-2 h-4 w-4" /> {t("exportJson")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={importJobs}>
                        <FileUp className="mr-2 h-4 w-4" /> {t("import")}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/settings/job-states">
                          <Settings className="mr-2 h-4 w-4" /> {t("manageStates")}
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{t("moreOptions")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Active filters - only show in table view */}
        {view === "table" && activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center p-2 px-4">
            <span className="text-sm text-muted-foreground">{t("activeFilters")}:</span>
            {activeFilters.map((filter, index) => (
              <Badge key={index} variant="secondary" className="gap-1 px-2 py-1">
                {filter}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                  onClick={() => removeFilter(filter)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
            <Button variant="ghost" size="sm" className="h-7 px-2" onClick={clearFilters}>
              {t("clearAll")}
            </Button>
          </div>
        )}

        <div className="text-sm text-muted-foreground px-4 py-1">
          {filteredJobs.length} {t("jobApplications")}
        </div>
      </div>

      {view === "kanban" ? (
        <DndProvider backend={HTML5Backend}>
          <div className="relative flex-1 overflow-hidden">
            {/* Scroll Left Button */}
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 z-20">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => scrollColumns("left")}
                      className="rounded-l-none opacity-75 hover:opacity-100"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{t("scrollColumnsLeft")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <ScrollArea className="w-full h-full">
              <div ref={scrollContainerRef} className="flex gap-4 pb-8 px-4 min-h-[calc(100vh-12rem)]">
                {jobStates.map((state, index) => (
                  <DraggableColumn
                    key={state.id}
                    id={`column-${state.id}`}
                    index={index}
                    moveColumn={moveColumn}
                    title={state.name}
                    type={state.id}
                    color={state.color}
                    onDrop={(jobId) => moveJob(jobId, state.id)}
                    count={filteredJobs.filter((job) => job.status === state.id).length}
                    onSettingsClick={() => setIsStatusManagerOpen(true)}
                  >
                    {filteredJobs
                      .filter((job) => job.status === state.id)
                      .map((job) => (
                        <JobCard
                          key={job.id}
                          job={job}
                          onJobUpdate={updateJob}
                          onJobDelete={deleteJob}
                          onJobEdit={handleOpenEditModal}
                        />
                      ))}
                  </DraggableColumn>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>

            {/* Scroll Right Button */}
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 z-20">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => scrollColumns("right")}
                      className="rounded-r-none opacity-75 hover:opacity-100"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p>{t("scrollColumnsRight")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </DndProvider>
      ) : (
        <div className="flex-1 overflow-auto px-4">
          <JobTable
            jobs={filteredJobs}
            jobStates={jobStates}
            onJobUpdate={updateJob}
            onJobDelete={deleteJob}
            onStatusChange={moveJob}
            onJobEdit={handleOpenEditModal}
          />
        </div>
      )}

      {/* Fixed Add Job Button */}
      {renderFloatingActionButton()}

      {/* Modals */}
      <EnhancedJobModal
        onAddJob={addJob}
        open={isAddJobModalOpen}
        onClose={() => setIsAddJobModalOpen(false)}
        jobStates={jobStates}
      />

      <AddStatusModal
        open={isAddStatusModalOpen}
        onOpenChange={setIsAddStatusModalOpen}
        onAddStatus={handleAddStatus}
        existingStates={jobStates}
      />

      <EnhancedStatusModal
        open={isStatusManagerOpen}
        onOpenChange={setIsStatusManagerOpen}
        jobStates={jobStates}
        onAddStatus={handleAddStatus}
        onUpdateStatus={handleUpdateStatus}
        onDeleteStatus={handleDeleteStatus}
        onReorderStatuses={handleReorderStatuses}
      />

      <AdvancedJobExtractor
        open={isExtractionModalOpen}
        onOpenChange={setIsExtractionModalOpen}
        onExtracted={(jobData) => {
          // Create a new job with the extracted data
          const newJob: JobData = {
            id: Date.now().toString(),
            company: jobData.company || "",
            position: jobData.position || "",
            location: jobData.location,
            salary: jobData.salary,
            date: new Date().toISOString().split("T")[0],
            applyDate: new Date().toISOString().split("T")[0],
            status: jobStates.find((s) => s.isDefault)?.id || jobStates[0].id,
            description: jobData.description || "",
            url: jobData.url,
            tags: jobData.tags || [],
            workMode: jobData.workMode,
            priority: 3,
          }

          addJob(newJob)
          setIsExtractionModalOpen(false)
        }}
      />

      {editingJob && (
        <EnhancedJobModal
          jobToEdit={editingJob}
          onEditJob={updateJob}
          open={isEditJobModalOpen}
          onClose={() => {
            setIsEditJobModalOpen(false)
            setEditingJob(null)
          }}
          jobStates={jobStates}
        />
      )}
    </div>
  )
}
