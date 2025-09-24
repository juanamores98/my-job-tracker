"use client"

import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Edit,
  Trash2,
  ExternalLink,
  Star,
  ChevronDown,
  MapPin,
  Calendar,
  DollarSign,
  Copy,
  Filter,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Mail,
  Phone,
  GraduationCap,
} from "lucide-react"
import type { JobData, ColumnType, JobState, JobFilter } from "@/lib/types"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { TagBadge } from "./tag-badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type SortField = "date" | "applyDate" | "company" | "position" | "priority" | "salary" | "status" | "location" | "workMode";
type SortOrder = "asc" | "desc";

interface TableFilters {
  workMode: string[];
  priority: number[];
  dateRange: string;
  location: string[];
}

interface JobTableProps {
  jobs: JobData[]
  jobStates: JobState[]
  onJobUpdate: (updatedJob: JobData) => void
  onJobDelete: (jobId: string) => void
  onStatusChange: (jobId: string, status: ColumnType) => void
  onJobEdit?: (job: JobData) => void
  onJobDuplicate?: (job: JobData) => void
  currentStatusFilter?: string[]
  onStatusFilterChange: (statusId?: string) => void
}

export function JobTable({ jobs, jobStates, onJobUpdate, onJobDelete, onStatusChange, onJobEdit, onJobDuplicate, currentStatusFilter, onStatusFilterChange }: JobTableProps) {
  // Sorting and filtering state
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [filters, setFilters] = useState<TableFilters>({
    workMode: [],
    priority: [],
    dateRange: "all",
    location: [],
  });

  const getStateColor = (stateId: string): string => {
    const state = jobStates.find((s) => s.id === stateId)
    return state?.color || "#3b82f6"
  }

  const getStateName = (stateId: string): string => {
    const state = jobStates.find((s) => s.id === stateId)
    return state?.name || stateId
  }

  const workModeColors: Record<string, string> = {
    remote:
      "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
    onsite: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
    hybrid:
      "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
    flexible:
      "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
  }

  const handleDeleteClick = (jobId: string) => {
    if (confirm("Are you sure you want to delete this job?")) {
      onJobDelete(jobId)
    }
  }

  // Format date to be more readable
  const formatDate = (dateString?: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }

  // Get unique filter options
  const filterOptions = useMemo(() => {
    const workModes = Array.from(new Set(jobs.map(job => job.workMode).filter(Boolean))).sort();
    const priorities = Array.from(new Set(jobs.map(job => job.priority).filter(p => p !== undefined))).sort((a, b) => (b || 0) - (a || 0));
    const locations = Array.from(new Set(jobs.map(job => job.location).filter(Boolean))).sort();
    return { workModes, priorities, locations };
  }, [jobs]);

  // Apply sorting and filtering to jobs
  const sortedAndFilteredJobs = useMemo(() => {
    let filteredJobs = [...jobs];

    // Apply work mode filter
    if (filters.workMode.length > 0) {
      filteredJobs = filteredJobs.filter(job => job.workMode && filters.workMode.includes(job.workMode));
    }

    // Apply priority filter
    if (filters.priority.length > 0) {
      filteredJobs = filteredJobs.filter(job => job.priority !== undefined && filters.priority.includes(job.priority));
    }

    // Apply location filter
    if (filters.location.length > 0) {
      filteredJobs = filteredJobs.filter(job => job.location && filters.location.includes(job.location));
    }

    // Apply date range filter
    if (filters.dateRange !== "all") {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (filters.dateRange) {
        case "last7days":
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case "last30days":
          cutoffDate.setDate(now.getDate() - 30);
          break;
        case "last90days":
          cutoffDate.setDate(now.getDate() - 90);
          break;
        case "lastYear":
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      if (filters.dateRange !== "all") {
        filteredJobs = filteredJobs.filter(job => {
          if (!job.date) return false;
          const jobDate = new Date(job.date);
          return jobDate >= cutoffDate;
        });
      }
    }

    // Apply sorting
    filteredJobs.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case "date":
          aValue = new Date(a.date || "1970-01-01").getTime();
          bValue = new Date(b.date || "1970-01-01").getTime();
          break;
        case "applyDate":
          aValue = new Date(a.applyDate || "1970-01-01").getTime();
          bValue = new Date(b.applyDate || "1970-01-01").getTime();
          break;
        case "company":
          aValue = a.company.toLowerCase();
          bValue = b.company.toLowerCase();
          break;
        case "position":
          aValue = a.position.toLowerCase();
          bValue = b.position.toLowerCase();
          break;
        case "priority":
          aValue = a.priority || 0;
          bValue = b.priority || 0;
          break;
        case "salary":
          aValue = a.salaryMax || a.salaryMin || 0;
          bValue = b.salaryMax || b.salaryMin || 0;
          break;
        case "status":
          aValue = getStateName(a.status).toLowerCase();
          bValue = getStateName(b.status).toLowerCase();
          break;
        case "location":
          aValue = (a.location || "").toLowerCase();
          bValue = (b.location || "").toLowerCase();
          break;
        case "workMode":
          aValue = (a.workMode || "").toLowerCase();
          bValue = (b.workMode || "").toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filteredJobs;
  }, [jobs, filters, sortField, sortOrder, jobStates]);

  const handleSortChange = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3" />;
    return sortOrder === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  };

  const toggleFilter = (filterType: keyof Omit<TableFilters, 'dateRange'>, value: string | number) => {
    setFilters(prev => {
      const currentArray = prev[filterType] as (string | number)[];
      return {
        ...prev,
        [filterType]: currentArray.includes(value)
          ? currentArray.filter(v => v !== value)
          : [...currentArray, value]
      };
    });
  };

  const clearFilters = () => {
    setFilters({
      workMode: [],
      priority: [],
      dateRange: "all",
      location: [],
    });
    onStatusFilterChange(undefined);
  };

  const hasActiveFilters = filters.workMode.length > 0 || filters.priority.length > 0 || filters.location.length > 0 || filters.dateRange !== "all" || (currentStatusFilter && currentStatusFilter.length > 0);

  const SortableHeader = ({ field, children, className }: { field: SortField; children: React.ReactNode; className?: string }) => (
    <TableHead className={className}>
      <Button
        variant="ghost"
        className="h-auto p-0 font-semibold justify-start hover:bg-transparent"
        onClick={() => handleSortChange(field)}
      >
        <div className="flex items-center gap-1">
          {children}
          {getSortIcon(field)}
        </div>
      </Button>
    </TableHead>
  );

  return (
    <>
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Job Applications</h2>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap gap-3">
          {/* Status Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className={cn((currentStatusFilter && currentStatusFilter.length > 0) && "bg-primary/10 text-primary")}>
                Status
                {currentStatusFilter && currentStatusFilter.length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs">
                    1
                  </Badge>
                )}
                <ChevronDown className="ml-2 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Job Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onStatusFilterChange(undefined)}
                className={(!currentStatusFilter || currentStatusFilter.length === 0) ? "bg-accent" : ""}
              >
                <div className="flex items-center justify-between w-full">
                  <span>All Statuses</span>
                  {(!currentStatusFilter || currentStatusFilter.length === 0) && <X className="h-3 w-3" />}
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {jobStates.map(state => (
                <DropdownMenuItem
                  key={state.id}
                  onClick={() => onStatusFilterChange(state.id)}
                  className={(currentStatusFilter && currentStatusFilter.includes(state.id)) ? "bg-accent" : ""}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: state.color }} />
                      <span>{state.name}</span>
                    </div>
                    {(currentStatusFilter && currentStatusFilter.includes(state.id)) && <X className="h-3 w-3" />}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Work Mode Filter */}
          {filterOptions.workModes.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className={cn(filters.workMode.length > 0 && "bg-primary/10 text-primary")}>
                  Work Mode
                  {filters.workMode.length > 0 && (
                    <Badge variant="secondary" className="ml-2 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs">
                      {filters.workMode.length}
                    </Badge>
                  )}
                  <ChevronDown className="ml-2 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Work Mode</DropdownMenuLabel>
                <DropdownMenuSeparator />
                                 {filterOptions.workModes.map(workMode => (
                   <DropdownMenuItem
                     key={workMode}
                     onClick={() => workMode && toggleFilter('workMode', workMode)}
                     className={filters.workMode.includes(workMode) ? "bg-accent" : ""}
                   >
                     <div className="flex items-center justify-between w-full">
                       <span className="capitalize">{workMode}</span>
                       {workMode && filters.workMode.includes(workMode) && <X className="h-3 w-3" />}
                     </div>
                   </DropdownMenuItem>
                 ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Priority Filter */}
          {filterOptions.priorities.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className={cn(filters.priority.length > 0 && "bg-primary/10 text-primary")}>
                  Priority
                  {filters.priority.length > 0 && (
                    <Badge variant="secondary" className="ml-2 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs">
                      {filters.priority.length}
                    </Badge>
                  )}
                  <ChevronDown className="ml-2 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Excitement Level</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {filterOptions.priorities.map(priority => (
                  <DropdownMenuItem
                    key={priority}
                    onClick={() => toggleFilter('priority', priority!)}
                    className={filters.priority.includes(priority!) ? "bg-accent" : ""}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                "h-3 w-3",
                                i < (priority || 0) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                              )}
                            />
                          ))}
                        </div>
                        <span>{priority} star{priority !== 1 ? 's' : ''}</span>
                      </div>
                      {filters.priority.includes(priority!) && <X className="h-3 w-3" />}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Location Filter */}
          {filterOptions.locations.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className={cn(filters.location.length > 0 && "bg-primary/10 text-primary")}>
                  Location
                  {filters.location.length > 0 && (
                    <Badge variant="secondary" className="ml-2 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs">
                      {filters.location.length}
                    </Badge>
                  )}
                  <ChevronDown className="ml-2 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="max-h-64 overflow-y-auto">
                <DropdownMenuLabel>Location</DropdownMenuLabel>
                <DropdownMenuSeparator />
                                 {filterOptions.locations.map(location => (
                   <DropdownMenuItem
                     key={location}
                     onClick={() => location && toggleFilter('location', location)}
                     className={location && filters.location.includes(location) ? "bg-accent" : ""}
                   >
                     <div className="flex items-center justify-between w-full">
                       <span>{location}</span>
                       {location && filters.location.includes(location) && <X className="h-3 w-3" />}
                     </div>
                   </DropdownMenuItem>
                 ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Date Range Filter */}
          <Select value={filters.dateRange} onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}>
            <SelectTrigger className={cn("w-[140px]", filters.dateRange !== "all" && "bg-primary/10 text-primary")}>
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="last7days">Last 7 days</SelectItem>
              <SelectItem value="last30days">Last 30 days</SelectItem>
              <SelectItem value="last90days">Last 90 days</SelectItem>
              <SelectItem value="lastYear">Last Year</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear Filters
              <X className="ml-2 h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Results Info */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            Showing {sortedAndFilteredJobs.length} of {jobs.length} applications
          </span>
          {hasActiveFilters && (
            <Badge variant="secondary" className="text-xs">
              Filtered
            </Badge>
          )}
          {sortField && (
            <Badge variant="outline" className="text-xs">
              Sorted by {sortField} ({sortOrder === "asc" ? "ascending" : "descending"})
            </Badge>
          )}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader field="company" className="w-[180px]">Company</SortableHeader>
              <SortableHeader field="position">Position</SortableHeader>
              <SortableHeader field="status" className="w-[120px]">Status</SortableHeader>
              <SortableHeader field="location" className="w-[120px]">Location</SortableHeader>
              <SortableHeader field="date" className="w-[120px]">Last Update</SortableHeader>
              <SortableHeader field="applyDate" className="w-[120px]">Applied</SortableHeader>
              <SortableHeader field="priority" className="w-[100px]">Excitement</SortableHeader>
              <SortableHeader field="workMode" className="w-[100px]">Work Mode</SortableHeader>
              <TableHead className="w-[160px]">Contact</TableHead>
              <TableHead className="w-[160px]">Studies</TableHead>
              <TableHead className="w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAndFilteredJobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="h-24 text-center">
                  {hasActiveFilters ? (
                    <div className="flex flex-col items-center gap-2">
                      <Filter className="h-8 w-8 text-muted-foreground/40" />
                      <div>
                        <p className="font-medium">No jobs match your filters</p>
                        <p className="text-sm text-muted-foreground">Try adjusting your filter criteria</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={clearFilters}>
                        Clear Filters
                      </Button>
                    </div>
                  ) : (
                    "No jobs found. Add your first job application!"
                  )}
                </TableCell>
              </TableRow>
            ) : (
              sortedAndFilteredJobs.map((job) => (
                <TableRow key={job.id} className="group hover:bg-card hover:shadow-sm border-b">
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span className="font-bold text-base line-clamp-1 group-hover:text-primary transition-colors duration-200">{job.company}</span>
                      {job.salary && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <DollarSign className="h-3 w-3" /> {job.salary}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{job.position}</span>
                      {job.tags && job.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {job.tags.slice(0, 2).map((tag, index) => {
                            const gradients: Array<"blue" | "green" | "orange"> = ["blue", "green", "orange"]
                            const gradient = gradients[index % gradients.length]
                            return (
                              <TagBadge
                                key={index}
                                tag={tag}
                                gradient={gradient}
                                className="h-5 text-xs"
                              />
                            )
                          })}
                          {job.tags.length > 2 && (
                            <TagBadge
                              tag={`+${job.tags.length - 2}`}
                              gradient="default"
                              className="h-5 text-xs border-dashed"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 p-0 flex items-center gap-1">
                          <Badge
                            className="px-2 py-0.5 text-xs font-medium flex items-center gap-1.5"
                            style={{
                              backgroundColor: `${getStateColor(job.status)}20`,
                              color: getStateColor(job.status),
                              borderColor: `${getStateColor(job.status)}40`,
                            }}
                          >
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: getStateColor(job.status) }}
                            />
                            {getStateName(job.status)}
                          </Badge>
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        {jobStates.map((state) => (
                          <DropdownMenuItem
                            key={state.id}
                            onClick={() => onStatusChange(job.id, state.id)}
                            className={job.status === state.id ? "bg-accent" : ""}
                          >
                            <Badge
                              className="px-2 py-0.5 text-xs font-medium mr-2 flex items-center gap-1.5"
                              style={{
                                backgroundColor: `${state.color}20`,
                                color: state.color,
                                borderColor: `${state.color}40`,
                              }}
                            >
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: state.color }} />
                              {state.name}
                            </Badge>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell>
                    {job.location ? (
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span>{job.location}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {job.date ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span>Updated {formatDate(job.date)}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {job.applyDate ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3 text-emerald-500" />
                        <span>Applied {formatDate(job.applyDate)}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-4 w-4",
                            i < (job.priority || 0) ? "text-yellow-400 fill-yellow-400" : "text-gray-300 dark:text-gray-600",
                          )}
                        />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {job.workMode ? (
                      <Badge className={cn("px-2 py-0.5 text-xs font-medium", workModeColors[job.workMode])}>
                        {job.workMode.charAt(0).toUpperCase() + job.workMode.slice(1)}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {(job.contactEmail || job.contactPhone) ? (
                      <div className="flex flex-col gap-1 text-xs">
                        {job.contactEmail && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <a
                              href={`mailto:${job.contactEmail}`}
                              className="truncate hover:text-primary"
                            >
                              {job.contactEmail}
                            </a>
                          </div>
                        )}
                        {job.contactPhone && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{job.contactPhone}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {job.studies && job.studies.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {job.studies.slice(0, 2).map((study, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1 px-2 py-0.5 text-[11px]">
                            <GraduationCap className="h-3 w-3" />
                            <span>{study}</span>
                          </Badge>
                        ))}
                        {job.studies.length > 2 && (
                          <Badge variant="outline" className="px-2 py-0.5 text-[11px]">
                            +{job.studies.length - 2}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => onJobEdit?.(job)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p>Edit job</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => onJobDuplicate?.(job)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p>Duplicate job</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDeleteClick(job.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p>Delete job</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      {job.url && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <a
                                href={job.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded p-1 text-primary hover:bg-primary/10 inline-flex items-center"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <p>View job posting</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
