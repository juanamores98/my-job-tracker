"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, ExternalLink, Star, ChevronDown, MapPin, Calendar, DollarSign } from "lucide-react"
import type { JobData, ColumnType, JobState } from "@/lib/types"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface JobTableProps {
  jobs: JobData[]
  jobStates: JobState[]
  onJobUpdate: (updatedJob: JobData) => void
  onJobDelete: (jobId: string) => void
  onStatusChange: (jobId: string, status: ColumnType) => void
  onJobEdit?: (job: JobData) => void
}

export function JobTable({ jobs, jobStates, onJobUpdate, onJobDelete, onStatusChange, onJobEdit }: JobTableProps) {
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

  return (
    <>
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
                <TableRow key={job.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{job.company}</span>
                      {job.salary && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <DollarSign className="h-3 w-3" /> {job.salary}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{job.position}</span>
                      {job.tags && job.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {job.tags.slice(0, 2).map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs px-1 py-0 h-5">
                              {tag}
                            </Badge>
                          ))}
                          {job.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs px-1 py-0 h-5">
                              +{job.tags.length - 2}
                            </Badge>
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
                        <span>{job.date}</span>
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
                            i < (job.priority || 0) ? "text-yellow-400 fill-yellow-400" : "text-gray-300",
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
                    <div className="flex items-center gap-1">
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
                          <TooltipContent>
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
                              className="h-8 w-8 text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteClick(job.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Delete job</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      {job.url && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-primary"
                                onClick={() => window.open(job.url, "_blank")}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Open job URL</p>
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
