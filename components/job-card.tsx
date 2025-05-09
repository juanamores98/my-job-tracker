"use client"

import { useState } from "react"
import { useDrag } from "react-dnd"
import { Building, Calendar, MapPin, DollarSign, ExternalLink, Edit, Trash2, Star, Briefcase, GripVertical } from "lucide-react"
import type { JobData } from "@/lib/types"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge" // Keep for work mode badge
import { TagBadge } from "./tag-badge" // Import new TagBadge
import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useLanguage } from "@/lib/i18n"

interface JobCardProps {
  job: JobData
  onJobUpdate: (updatedJob: JobData) => void
  onJobDelete: (jobId: string) => void
  onJobEdit?: (job: JobData) => void
}

export function JobCard({ job, onJobUpdate, onJobDelete, onJobEdit }: JobCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const { t } = useLanguage()

  const [{ isDragging }, drag] = useDrag({
    type: "job",
    item: { id: job.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  })

  // Get work mode badge color
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
      <div
        ref={drag as any}
          className={cn(
            "rounded-md border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all cursor-move relative group active:scale-95 select-none",
            isDragging && "opacity-50 rotate-2 scale-105",
            "animate-in fade-in-0 duration-200",
          )}
      >
        {/* Card Content */}
        <div className="p-3 relative">
          <div className="absolute -left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-70 transition-opacity cursor-grab active:cursor-grabbing">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
          {/* Position & Company */}
          <div className="mb-2">
            <h3 className="font-bold text-base line-clamp-1 group-hover:text-primary transition-colors duration-200">{job.position}</h3>
            <div className="flex items-center text-sm font-medium text-primary">
              <Building className="h-3.5 w-3.5 mr-1 flex-shrink-0 text-primary" />
              <span className="line-clamp-1">{job.company}</span>
            </div>
          </div>

          {/* Work Mode Badge */}
          {job.workMode && (
            <div className="mb-2">
              <Badge className={cn("text-xs px-1.5 py-0 h-5", getWorkModeColor())}>
                <Briefcase className="h-3 w-3 mr-1 shrink-0" />
                {job.workMode.charAt(0).toUpperCase() + job.workMode.slice(1)}
              </Badge>
            </div>
          )}

          {/* Job Details */}
          <div className="space-y-1 mb-2 text-xs">
            {job.location && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-3 w-3 flex-shrink-0 text-muted-foreground/70" />
                <span className="line-clamp-1">{job.location}</span>
              </div>
            )}

            {job.salary && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <DollarSign className="h-3 w-3 flex-shrink-0 text-muted-foreground/70" />
                <span>{job.salary}</span>
              </div>
            )}

            {job.date && ( // Use job.date as it's the primary date from modals
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-3 w-3 flex-shrink-0 text-muted-foreground/70" />
                <span>{t("appliedOn")}: {formatDate(job.date)}</span>
              </div>
            )}
          </div>

          {/* Priority Rating */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex mb-2 cursor-default"> {/* Added cursor-default to indicate it's not interactive beyond tooltip */}
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
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>{t("priorityTooltip")} {job.priority || 0}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Tags */}
          {job.tags && job.tags.length > 0 && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-1.5">
                {job.tags.slice(0, 4).map((tag, index) => {
                  const gradients: Array<"blue" | "green" | "orange"> = ["blue", "green", "orange"]
                  const gradient = gradients[index % gradients.length]
                  return (
                    <TagBadge
                      key={index}
                      tag={tag}
                      gradient={gradient}
                      className="h-5 text-xs" // Ensure consistent height and text size
                    />
                  )
                })}
                {job.tags.length > 4 && (
                  <TagBadge
                    tag={`+${job.tags.length - 4} ${t("moreTags")}`}
                    gradient="default"
                    className="h-5 text-xs border-dashed"
                  />
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center mt-3 pt-2 border-t border-border opacity-60 group-hover:opacity-100 transition-opacity duration-200">
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onJobEdit?.(job)}
                      className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label={t("editJobDetails")}
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>{t("editJobDetails")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setIsDeleteDialogOpen(true)}
                      className="rounded p-1 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
                      aria-label={t("removeJobApplication")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>{t("removeJobApplication")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {job.url && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded p-1 text-primary hover:bg-primary/10"
                      aria-label={t("viewJobPosting")}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>{t("viewJobPosting")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteJobApplication")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("areYouSureDelete")} {job.position} {t("at")} {job.company}? {t("thisActionCannotBeUndone")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onJobDelete(job.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
            >
              {t("yesDelete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
