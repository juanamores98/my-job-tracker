"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { JobColumn } from "./job-column"
import { JobCard } from "./job-card"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import type { JobData, ColumnType, JobFilter, SortOption, GroupOption, JobState } from "@/lib/types"
import { AddJobModal } from "./add-job-modal"
import { Button } from "@/components/ui/button"
import {
  Download,
  FileUp,
  Filter,
  SortAsc,
  SortDesc,
  Table,
  Columns,
  Search,
  X,
  Settings,
  Plus,
  MoreHorizontal,
  ListOrderedIcon as ListReorder,
} from "lucide-react"
import { getJobs, saveJobs, getJobStates, saveJobStates } from "@/lib/storage"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/lib/i18n"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
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
import { StatusManagerModal } from "./status-manager-modal"

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
  const { toast } = useToast()
  const { t } = useLanguage()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isMobile = useMediaQuery("(max-width: 768px)")
  const isSmallScreen = useMediaQuery("(max-width: 1024px)")

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
        result = result.filter((job) => job.date && job.date >= filter.dateRange.start!)
      }
      if (filter.dateRange.end) {
        result = result.filter((job) => job.date && job.date <= filter.dateRange.end!)
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

  const moveJob = (jobId: string, targetColumn: ColumnType) => {
    const updatedJobs = jobs.map((job) => (job.id === jobId ? { ...job, status: targetColumn } : job))
    setJobs(updatedJobs)
    saveJobs(updatedJobs)

    toast({
      title: t("jobUpdated"),
      description: `${t("jobMovedTo")} ${targetColumn}`,
    })
  }

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
    let dataStr, fileName

    if (format === "json") {
      dataStr = JSON.stringify(jobs, null, 2)
      fileName = `job-applications-${new Date().toISOString().split("T")[0]}.json`
    } else {
      // Create CSV header with all possible fields
      let csv =
        "ID,Company,Position,Location,Salary,Date,Status,Notes,URL,Priority,Tags,Description,WorkMode,SalaryMin,SalaryMax,SalaryCurrency,ApplyDate,FollowUpDate,Excitement,ContactPerson,ContactEmail\n"

      // Add each job as a row
      jobs.forEach((job) => {
        const row = [
          job.id,
          `"${job.company?.replace(/"/g, '""') || ""}"`,
          `"${job.position?.replace(/"/g, '""') || ""}"`,
          job.location ? `"${job.location.replace(/"/g, '""')}"` : "",
          job.salary ? `"${job.salary.replace(/"/g, '""')}"` : "",
          job.date || "",
          job.status,
          job.notes ? `"${job.notes.replace(/"/g, '""')}"` : "",
          job.url ? `"${job.url.replace(/"/g, '""')}"` : "",
          job.priority || "",
          job.tags ? `"${job.tags.join(",").replace(/"/g, '""')}"` : "",
          job.description ? `"${job.description.replace(/"/g, '""')}"` : "",
          job.workMode || "",
          job.salaryMin || "",
          job.salaryMax || "",
          job.salaryCurrency || "",
          job.applyDate || "",
          job.followUpDate || "",
          job.excitement || "",
          job.contactPerson ? `"${job.contactPerson.replace(/"/g, '""')}"` : "",
          job.contactEmail ? `"${job.contactEmail.replace(/"/g, '""')}"` : "",
        ]

        csv += row.join(",") + "\n"
      })

      dataStr = csv
      fileName = `job-applications-${new Date().toISOString().split("T")[0]}.csv`
    }

    const dataUri = `data:${format === "json" ? "application/json" : "text/csv"};charset=utf-8,${encodeURIComponent(dataStr)}`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", fileName)
    linkElement.click()

    toast({
      title: t("exportSuccessful"),
      description: `${t("dataExportedAs")} ${format.toUpperCase()}`,
    })
  }

  const importJobs = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json,.csv"

    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const fileData = event.target?.result as string
          const fileExt = file.name.split(".").pop()?.toLowerCase()

          let importedJobs: JobData[] = []

          if (fileExt === "json") {
            importedJobs = JSON.parse(fileData)

            // Add empty descriptions if missing
            importedJobs = importedJobs.map((job) => ({
              ...job,
              description: job.description || "",
            }))

            // Save imported jobs
            saveJobs([...jobs, ...importedJobs])
          } else if (fileExt === "csv") {
            // Parse CSV and add to existing jobs
            const parsedJobs = parseCSV(fileData)
            saveJobs([...jobs, ...parsedJobs])
          }

          // Reload jobs
          const loadedJobs = getJobs()
          setJobs(loadedJobs)

          toast({
            title: t("importSuccessful"),
            description: t("jobDataImportedSuccessfully"),
          })
        } catch (error) {
          toast({
            title: t("importFailed"),
            description: t("errorImportingData"),
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col gap-2 mb-2 p-2 md:p-4 sticky top-0 z-10 bg-background">
        {/* Top controls */}
        <div className="flex flex-wrap justify-between items-center gap-2">
          <div className="relative w-full md:w-auto max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t("searchJobs")}
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {view === "table" && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-1">
                    <Filter className="h-4 w-4" />
                    {!isSmallScreen && t("filter")}
                    {activeFilters.length > 0 && (
                      <Badge variant="secondary" className="ml-1 px-1 py-0 h-5">
                        {activeFilters.length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-80">
                  <div className="space-y-4">
                    <h4 className="font-medium">{t("filterJobs")}</h4>

                    {/* Status filter */}
                    <div className="space-y-2">
                      <Label>{t("status")}</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {jobStates.map((state) => (
                          <div key={state.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`status-${state.id}`}
                              checked={filter.status?.includes(state.id)}
                              onCheckedChange={(checked) => {
                                setFilter((prev) => {
                                  const newStatuses = prev.status || []
                                  if (checked) {
                                    return { ...prev, status: [...newStatuses, state.id] }
                                  } else {
                                    return { ...prev, status: newStatuses.filter((s) => s !== state.id) }
                                  }
                                })
                              }}
                            />
                            <Label htmlFor={`status-${state.id}`} className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: state.color }} />
                              {state.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Excitement filter */}
                    <div className="space-y-2">
                      <Label>{t("excitementLevel")}</Label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <div key={rating} className="flex flex-col items-center">
                            <Checkbox
                              id={`rating-${rating}`}
                              checked={filter.excitement?.includes(rating)}
                              onCheckedChange={(checked) => {
                                setFilter((prev) => {
                                  const newRatings = prev.excitement || []
                                  if (checked) {
                                    return { ...prev, excitement: [...newRatings, rating] }
                                  } else {
                                    return { ...prev, excitement: newRatings.filter((r) => r !== rating) }
                                  }
                                })
                              }}
                            />
                            <Label htmlFor={`rating-${rating}`} className="text-xs mt-1">
                              {rating}★
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Work Mode filter */}
                    <div className="space-y-2">
                      <Label>{t("workMode")}</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {["remote", "onsite", "hybrid", "flexible"].map((mode) => (
                          <div key={mode} className="flex items-center space-x-2">
                            <Checkbox
                              id={`mode-${mode}`}
                              checked={filter.workMode?.includes(mode as any)}
                              onCheckedChange={(checked) => {
                                setFilter((prev) => {
                                  const newModes = prev.workMode || []
                                  if (checked) {
                                    return { ...prev, workMode: [...newModes, mode as any] }
                                  } else {
                                    return { ...prev, workMode: newModes.filter((m) => m !== mode) }
                                  }
                                })
                              }}
                            />
                            <Label htmlFor={`mode-${mode}`} className="capitalize">
                              {t(mode)}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Company filter */}
                    <div className="space-y-2">
                      <Label>{t("company")}</Label>
                      <Select
                        value={filter.company?.[0] || ""}
                        onValueChange={(value) => {
                          if (value && value !== "all") {
                            setFilter((prev) => ({ ...prev, company: [value] }))
                          } else {
                            setFilter((prev) => {
                              const { company, ...rest } = prev
                              return rest
                            })
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectCompany")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t("allCompanies")}</SelectItem>
                          {uniqueCompanies.map((company) => (
                            <SelectItem key={company} value={company}>
                              {company}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Location filter */}
                    <div className="space-y-2">
                      <Label>{t("location")}</Label>
                      <Select
                        value={filter.location?.[0] || ""}
                        onValueChange={(value) => {
                          if (value && value !== "all") {
                            setFilter((prev) => ({ ...prev, location: [value] }))
                          } else {
                            setFilter((prev) => {
                              const { location, ...rest } = prev
                              return rest
                            })
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectLocation")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t("allLocations")}</SelectItem>
                          {uniqueLocations.map((location) => (
                            <SelectItem key={location} value={location}>
                              {location}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Tags filter */}
                    <div className="space-y-2">
                      <Label>{t("tags")}</Label>
                      <Select
                        value={filter.tags?.[0] || ""}
                        onValueChange={(value) => {
                          if (value && value !== "all") {
                            setFilter((prev) => ({ ...prev, tags: [value] }))
                          } else {
                            setFilter((prev) => {
                              const { tags, ...rest } = prev
                              return rest
                            })
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectTag")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t("allTags")}</SelectItem>
                          {uniqueTags.map((tag) => (
                            <SelectItem key={tag} value={tag}>
                              {tag}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex justify-between pt-2">
                      <Button variant="outline" size="sm" onClick={clearFilters}>
                        {t("clearAll")}
                      </Button>
                      <Button size="sm" onClick={() => document.body.click()}>
                        {t("applyFilters")}
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1">
                  {sort.order === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                  {!isSmallScreen && t("sort")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-60">
                <div className="space-y-4">
                  <h4 className="font-medium">{t("sortJobs")}</h4>

                  <div className="space-y-2">
                    <Label>{t("sortBy")}</Label>
                    <Select
                      value={sort.field}
                      onValueChange={(value) => setSort((prev) => ({ ...prev, field: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date">{t("date")}</SelectItem>
                        <SelectItem value="company">{t("company")}</SelectItem>
                        <SelectItem value="position">{t("position")}</SelectItem>
                        <SelectItem value="priority">{t("excitement")}</SelectItem>
                        <SelectItem value="status">{t("status")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{t("order")}</Label>
                    <div className="flex gap-2">
                      <Button
                        variant={sort.order === "asc" ? "default" : "outline"}
                        size="sm"
                        className="flex-1"
                        onClick={() => setSort((prev) => ({ ...prev, order: "asc" }))}
                      >
                        <SortAsc className="h-4 w-4 mr-2" /> {t("ascending")}
                      </Button>
                      <Button
                        variant={sort.order === "desc" ? "default" : "outline"}
                        size="sm"
                        className="flex-1"
                        onClick={() => setSort((prev) => ({ ...prev, order: "desc" }))}
                      >
                        <SortDesc className="h-4 w-4 mr-2" /> {t("descending")}
                      </Button>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <div className="flex border rounded-md">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={view === "kanban" ? "default" : "ghost"}
                      size="sm"
                      className="rounded-r-none h-9"
                      onClick={() => setView("kanban")}
                    >
                      <Columns className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t("kanbanView")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={view === "table" ? "default" : "ghost"}
                      size="sm"
                      className="rounded-l-none h-9"
                      onClick={() => setView("table")}
                    >
                      <Table className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t("tableView")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <MoreHorizontal className="mr-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => exportJobs("json")}>
                  <Download className="mr-2 h-4 w-4" /> Export JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportJobs("csv")}>
                  <Download className="mr-2 h-4 w-4" /> Export CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={importJobs}>
                  <FileUp className="mr-2 h-4 w-4" /> Import
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings/job-states">
                    <Settings className="mr-2 h-4 w-4" /> Manage States
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AddJobModal
                    onAddJob={addJob}
                    buttonVariant="default"
                    buttonSize="sm"
                    buttonClassName="h-9"
                    buttonIcon={<Plus className="h-4 w-4 mr-2" />}
                    buttonLabel={!isSmallScreen ? t("addJob") : ""}
                    jobStates={jobStates}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("addNewJob")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Active filters - only show in table view */}
        {view === "table" && activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
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

        <div className="text-sm text-muted-foreground">
          {filteredJobs.length} {t("jobApplications")}
        </div>
      </div>

      {view === "kanban" ? (
        <DndProvider backend={HTML5Backend}>
          <div className="flex items-center mb-2 px-4">
            {/* Status management controls */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => setIsAddStatusModalOpen(true)} className="mr-2">
                    <Plus className="h-4 w-4 mr-2" /> {t("addColumn")}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("addNewStatus")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => setIsStatusManagerOpen(true)} className="mr-2">
                    <ListReorder className="h-4 w-4 mr-2" /> {t("manageColumns")}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("reorderAndManageColumns")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <ScrollArea className="w-full flex-1 pb-4">
            <div ref={scrollContainerRef} className="flex gap-4 pb-8 px-4 min-h-[calc(100vh-12rem)]">
              {jobStates.map((state, index) => (
                <JobColumn
                  key={state.id}
                  id={`column-${state.id}`}
                  title={state.name}
                  type={state.id}
                  color={state.color}
                  onDrop={(jobId) => moveJob(jobId, state.id)}
                  count={filteredJobs.filter((job) => job.status === state.id).length}
                  onSettingsClick={() => {
                    setIsStatusManagerOpen(true)
                  }}
                >
                  {filteredJobs
                    .filter((job) => job.status === state.id)
                    .map((job) => (
                      <JobCard key={job.id} job={job} onJobUpdate={updateJob} onJobDelete={deleteJob} />
                    ))}
                </JobColumn>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </DndProvider>
      ) : (
        <div className="flex-1 overflow-auto px-4">
          <JobTable
            jobs={filteredJobs}
            jobStates={jobStates}
            onJobUpdate={updateJob}
            onJobDelete={deleteJob}
            onStatusChange={moveJob}
          />
        </div>
      )}

      {/* Mobile Add Button (Fixed) */}
      {isMobile && (
        <div className="fixed bottom-6 right-6 z-50">
          <AddJobModal
            onAddJob={addJob}
            buttonVariant="default"
            buttonSize="lg"
            buttonClassName="rounded-full shadow-lg h-14 w-14 p-0"
            buttonIcon={<Plus className="h-6 w-6" />}
            buttonLabel=""
            jobStates={jobStates}
          />
        </div>
      )}

      {/* Add Status Modal */}
      <AddStatusModal
        open={isAddStatusModalOpen}
        onOpenChange={setIsAddStatusModalOpen}
        onAddStatus={handleAddStatus}
        existingStates={jobStates}
      />

      {/* Status Manager Modal */}
      <StatusManagerModal
        open={isStatusManagerOpen}
        onOpenChange={setIsStatusManagerOpen}
        jobStates={jobStates}
        onAddStatus={handleAddStatus}
        onUpdateStatus={handleUpdateStatus}
        onDeleteStatus={handleDeleteStatus}
        onReorderStatuses={handleReorderStatuses}
      />
    </div>
  )
}
