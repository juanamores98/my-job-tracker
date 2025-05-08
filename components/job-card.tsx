"use client"

import type React from "react"

import { useState } from "react"
import { useDrag } from "react-dnd"
import type { JobData } from "@/lib/types"
import { Calendar, MapPin, DollarSign, Star, ExternalLink, Edit, Trash2, BarChart } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { EditJobModal } from "./edit-job-modal"
import { analyzeJobDescription } from "@/lib/job-analyzer"
import { useToast } from "@/hooks/use-toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useLanguage } from "@/lib/i18n"

interface JobCardProps {
  job: JobData
  onJobUpdate: (updatedJob: JobData) => void
  onJobDelete: (jobId: string) => void
}

export function JobCard({ job, onJobUpdate, onJobDelete }: JobCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const { toast } = useToast()
  const { t } = useLanguage()

  const [{ isDragging }, drag] = useDrag({
    type: "job",
    item: { id: job.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  })

  const handleAnalyzeDescription = () => {
    if (!job.description) {
      toast({
        title: t("noDescription"),
        description: t("pleaseAddJobDescription"),
        variant: "destructive",
      })
      return
    }

    const { technicalSkills, softSkills, requirements } = analyzeJobDescription(job.description)

    // Combine all extracted tags
    const extractedTags = [...technicalSkills, ...softSkills, ...requirements]

    // Update job with extracted tags
    const updatedJob = {
      ...job,
      tags: Array.from(new Set([...(job.tags || []), ...extractedTags])),
    }

    onJobUpdate(updatedJob)

    toast({
      title: t("jobAnalyzed"),
      description: `${t("foundSkillsAndRequirements", { count: extractedTags.length })}`,
    })
  }

  const handleDeleteJob = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm(t("confirmDeleteJob"))) {
      onJobDelete(job.id)
    }
  }

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditModalOpen(true)
  }

  const handleAnalyzeClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    handleAnalyzeDescription()
  }

  // Get color based on work mode
  const getWorkModeColor = () => {
    switch (job.workMode) {
      case "remote":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      case "onsite":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
      case "hybrid":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
      case "flexible":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
    }
  }

  return (
    <>
      <div
        ref={drag}
        className={cn(
          "rounded-md border bg-card shadow-sm hover:shadow-md transition-shadow relative cursor-move",
          isDragging && "opacity-50",
          "dark:bg-gray-900 dark:border-gray-800",
        )}
        onClick={handleEditClick}
      >
        {/* Card Content */}
        <div className="p-3">
          {/* Position & Company */}
          <div className="mb-2">
            <h3 className="font-bold text-base line-clamp-1">{job.position}</h3>
            <div className="text-sm font-medium text-primary">{job.company}</div>
          </div>

          {/* Job Details */}
          <div className="space-y-1 mb-2 text-xs">
            {job.location && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{job.location}</span>
              </div>
            )}

            {job.salary && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <DollarSign className="h-3 w-3" />
                <span>{job.salary}</span>
              </div>
            )}

            {job.date && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{job.date}</span>
              </div>
            )}

            {job.workMode && (
              <div className="mt-1">
                <Badge variant="outline" className={cn("text-xs px-1.5 py-0 h-5", getWorkModeColor())}>
                  {job.workMode.charAt(0).toUpperCase() + job.workMode.slice(1)}
                </Badge>
              </div>
            )}
          </div>

          {/* Priority Rating */}
          <div className="flex mb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn("h-4 w-4", i < (job.priority || 0) ? "text-yellow-400 fill-yellow-400" : "text-gray-300")}
              />
            ))}
          </div>

          {/* Tags */}
          {job.tags && job.tags.length > 0 && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-1">
                {job.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs px-1.5 py-0 h-5">
                    {tag}
                  </Badge>
                ))}
                {job.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">
                    +{job.tags.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-200 dark:border-gray-800">
            <div className="flex gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant="ghost" className="h-7 px-2" onClick={handleEditClick}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t("editJob")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-red-600 hover:text-red-700"
                      onClick={handleDeleteJob}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t("deleteJob")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="flex gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant="ghost" className="h-7 px-2" onClick={handleAnalyzeClick}>
                      <BarChart className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t("analyzeDescription")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {job.url && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-primary"
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(job.url, "_blank")
                        }}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t("openJobLink")}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </div>
      </div>

      <EditJobModal job={job} open={isEditModalOpen} onOpenChange={setIsEditModalOpen} onJobUpdate={onJobUpdate} />
    </>
  )
}
