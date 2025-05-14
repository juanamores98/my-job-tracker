"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, ExternalLink, Star, ChevronDown, MapPin, Calendar, DollarSign, Copy, Filter } from "lucide-react"
import type { JobData, ColumnType, JobState, JobFilter } from "@/lib/types"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { TagBadge } from "./tag-badge"

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

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Job Applications</h2>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="ml-auto">
              <Filter className="mr-2 h-4 w-4" />
              {currentStatusFilter && currentStatusFilter.length > 0
                ? `Status: ${getStateName(currentStatusFilter[0])}`
                : "Filter by Status"}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => onStatusFilterChange(undefined)}
              className={(!currentStatusFilter || currentStatusFilter.length === 0) ? "bg-accent" : ""}
            >
              All Statuses
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {jobStates.map(state => (
              <DropdownMenuItem
                key={state.id}
                onClick={() => onStatusFilterChange(state.id)}
                className={(currentStatusFilter && currentStatusFilter.includes(state.id)) ? "bg-accent" : ""}
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
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Company</TableHead>
              <TableHead>Position</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="w-[120px]">Location</TableHead>
              <TableHead className="w-[100px]">Date</TableHead>
              <TableHead className="w-[100px]">Excitement</TableHead>
              <TableHead className="w-[100px]">Work Mode</TableHead>
              <TableHead className="w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No jobs found. Add your first job application!
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job) => (
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
                        <span>{formatDate(job.date)}</span>
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
