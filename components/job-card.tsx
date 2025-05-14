"use client"

import { useState } from "react"
import { useDrag } from "react-dnd"
import { Building, Calendar, MapPin, DollarSign, ExternalLink, Edit, Trash2, Star, Briefcase, GripVertical, Copy, Code, Heart, Award } from "lucide-react"
import type { JobData } from "@/lib/types"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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
  onJobDelete: (jobId: string) => void
  onJobEdit?: (job: JobData) => void
  onJobDuplicate?: (job: JobData) => void
}

export function JobCard({ job, onJobDelete, onJobEdit, onJobDuplicate }: JobCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const { t } = useLanguage()

  const [{ isDragging }, drag] = useDrag({
    type: "job",
    item: { id: job.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  })

  // Get work mode icon color
  const getWorkModeColor = () => {
    // Check if location contains work mode info when workMode is not set
    if (!job.workMode && job.location) {
      const locationLower = job.location.toLowerCase();
      if (locationLower.includes('remote')) {
        return "text-green-600 dark:text-green-400";
      } else if (locationLower.includes('hybrid')) {
        return "text-purple-600 dark:text-purple-400";
      } else if (locationLower.includes('flexible')) {
        return "text-amber-600 dark:text-amber-400";
      }
    }

    // Normal work mode check
    switch (job.workMode) {
      case "remote":
        return "text-green-600 dark:text-green-400"
      case "onsite":
        return "text-blue-600 dark:text-blue-400"
      case "hybrid":
        return "text-purple-600 dark:text-purple-400"
      case "flexible":
        return "text-amber-600 dark:text-amber-400"
      default:
        return "text-gray-600 dark:text-gray-400"
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

  // Check if follow-up date is today or in the past to add visual indicator
  const isFollowUpDue = () => {
    if (!job.followUpDate) return false
    const followUpDate = new Date(job.followUpDate)
    followUpDate.setHours(23, 59, 59, 999) // End of the day
    const today = new Date()
    return followUpDate <= today
  }

  // Check if follow-up date is approaching (within next 3 days)
  const isFollowUpApproaching = () => {
    if (!job.followUpDate) return false
    const followUpDate = new Date(job.followUpDate)
    followUpDate.setHours(23, 59, 59, 999) // End of the day

    const today = new Date()
    const threeDaysFromNow = new Date(today)
    threeDaysFromNow.setDate(today.getDate() + 3)

    return followUpDate > today && followUpDate <= threeDaysFromNow
  }

  return (
    <>
      <div
        ref={drag as any}
          className={cn(
            "rounded-md border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all cursor-move relative group active:scale-95 select-none",
            isDragging && "opacity-50 rotate-2 scale-105",
            "animate-in fade-in-0 duration-200",
            isFollowUpDue() && "ring-2 ring-destructive/30", // Visual indicator for due follow-ups
            isFollowUpApproaching() && "ring-2 ring-warning/30", // Visual indicator for approaching follow-ups
          )}
          aria-label={`${job.position} at ${job.company}`} // Improved accessibility
      >
        {/* Follow-up indicator */}
        {(isFollowUpDue() || isFollowUpApproaching()) && (
          <div className={cn(
            "absolute -top-2 right-2 px-2 py-0.5 rounded-sm text-[10px] font-medium z-10",
            isFollowUpDue() ? "bg-destructive text-destructive-foreground" : "bg-amber-500 text-white"
          )}>
            {isFollowUpDue() ? t("followUpOverdue") : t("followUpSoon")}
          </div>
        )}

        {/* Card Content */}
        <div className="p-3 relative">
          <div className="absolute -left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-70 transition-opacity cursor-grab active:cursor-grabbing">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
          {/* Position & Company */}
          <div className="mb-2">
            <h3 className="font-bold text-base line-clamp-1 group-hover:text-primary transition-colors duration-200">{job.position}</h3>
            <div className="flex items-center text-sm font-medium text-blue-600 dark:text-blue-400">
              <Building className="h-3.5 w-3.5 mr-1 flex-shrink-0 text-blue-600 dark:text-blue-400" />
              <span className="line-clamp-1">{job.company}</span>
            </div>
          </div>

          {/* Icons with information for Work Mode, Location, Salary, and Date Applied */}
          <div className="flex flex-col gap-1.5 mb-3 text-xs">
            {/* Work Mode with icon and tooltip */}
            {(job.workMode || (!job.workMode && job.location &&
              (job.location.toLowerCase().includes('remote') ||
               job.location.toLowerCase().includes('hybrid') ||
               job.location.toLowerCase().includes('flexible')))) && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5">
                      <Briefcase className={cn("h-3.5 w-3.5", getWorkModeColor())} />
                      <span className={cn(getWorkModeColor())}>
                        {job.workMode ?
                          (job.workMode.charAt(0).toUpperCase() + job.workMode.slice(1)) :
                          (job.location?.toLowerCase().includes('remote') ? 'Remote' :
                           job.location?.toLowerCase().includes('hybrid') ? 'Hybrid' :
                           job.location?.toLowerCase().includes('flexible') ? 'Flexible' : 'On-site')}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <p>Work Mode</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Location with icon and tooltip - only show if it's not just a work mode */}
            {job.location &&
             !(job.location.toLowerCase().trim() === 'remote' ||
               job.location.toLowerCase().trim() === 'hybrid' ||
               job.location.toLowerCase().trim() === 'flexible') && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">{job.location}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <p>Location</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Salary with icon and tooltip */}
            {(job.salary || job.salaryMin || job.salaryMax) && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {job.salary || (job.salaryMin && job.salaryMax
                          ? `${job.salaryMin.toLocaleString()}-${job.salaryMax.toLocaleString()} ${job.salaryCurrency || ''}`
                          : job.salaryMin
                            ? `${job.salaryMin.toLocaleString()}+ ${job.salaryCurrency || ''}`
                            : job.salaryMax
                              ? `Up to ${job.salaryMax.toLocaleString()} ${job.salaryCurrency || ''}`
                              : ''
                        )}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <p>Salary</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Date with icon and tooltip */}
            {job.date && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">{formatDate(job.date)}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <p>Date</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Follow-up Date with icon and tooltip */}
            {job.followUpDate && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5">
                      <Calendar className={cn(
                        "h-3.5 w-3.5",
                        isFollowUpDue() ? "text-destructive" :
                        isFollowUpApproaching() ? "text-amber-500" : "text-muted-foreground"
                      )} />
                      <span className={cn(
                        isFollowUpDue() ? "text-destructive" :
                        isFollowUpApproaching() ? "text-amber-500" : "text-muted-foreground"
                      )}>
                        {formatDate(job.followUpDate)}
                        {isFollowUpDue() && " (Overdue)"}
                        {isFollowUpApproaching() && !isFollowUpDue() && " (Soon)"}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <p>Follow-up Date</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* Priority Rating */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex mb-2 cursor-default" aria-label={`Priority level: ${job.priority || 0} out of 5`}>
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

          {/* Tags - Display in order: Skills, Soft Skills, Requirements */}
          {(() => {
            const techSkills = job.tags || job.skills || [];
            const softSkills = job.softSkills || [];
            const requirements = job.requirements || [];
            const allSkillsCount = techSkills.length + softSkills.length + requirements.length;

            if (allSkillsCount === 0) {
              return null;
            }

            const MAX_TOTAL_VISIBLE_TAGS = 5;
            const PREFERRED_TECH_COUNT = 3;
            const PREFERRED_SOFT_COUNT = 1;
            const PREFERRED_REQ_COUNT = 1;

            let remainingSlots = MAX_TOTAL_VISIBLE_TAGS;

            const actualTechToShow = Math.min(techSkills.length, PREFERRED_TECH_COUNT, remainingSlots);
            const visibleTechSkills = techSkills.slice(0, actualTechToShow);
            remainingSlots -= actualTechToShow;

            const actualSoftToShow = remainingSlots > 0 ? Math.min(softSkills.length, PREFERRED_SOFT_COUNT, remainingSlots) : 0;
            const visibleSoftSkills = softSkills.slice(0, actualSoftToShow);
            remainingSlots -= actualSoftToShow;

            const actualReqToShow = remainingSlots > 0 ? Math.min(requirements.length, PREFERRED_REQ_COUNT, remainingSlots) : 0;
            const visibleRequirements = requirements.slice(0, actualReqToShow);

            const totalVisibleCount = visibleTechSkills.length + visibleSoftSkills.length + visibleRequirements.length;
            const moreCount = allSkillsCount - totalVisibleCount;

            return (
              <div className="mb-3">
                <div className="flex flex-wrap gap-1.5">
                  {/* Technical Skills */}
                  {visibleTechSkills.map((tag, index) => (
                    <TagBadge
                      key={`tech-${index}`}
                      tag={tag}
                      gradient="blue"
                      icon={<Code className="h-3 w-3" />}
                      className="h-5 text-xs"
                    />
                  ))}

                  {/* Soft Skills */}
                  {visibleSoftSkills.map((tag, index) => (
                    <TagBadge
                      key={`soft-${index}`}
                      tag={tag}
                      gradient="rose"
                      icon={<Heart className="h-3 w-3" />}
                      className="h-5 text-xs"
                    />
                  ))}

                  {/* Requirements */}
                  {visibleRequirements.map((tag, index) => (
                    <TagBadge
                      key={`req-${index}`}
                      tag={tag}
                      gradient="amber"
                      icon={<Award className="h-3 w-3" />}
                      className="h-5 text-xs"
                    />
                  ))}

                  {/* More tags indicator */}
                  {moreCount > 0 && (
                    <TagBadge
                      tag={`+${moreCount} ${t("moreTags")}`}
                      gradient="default"
                      className="h-5 text-xs border-dashed"
                    />
                  )}
                </div>
              </div>
            );
          })()}

          {/* Action Buttons */}
          <div className="flex justify-between items-center mt-3 pt-2 border-t border-border opacity-60 group-hover:opacity-100 transition-opacity duration-200">
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
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
                      type="button"
                      onClick={() => onJobDuplicate?.(job)}
                      className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label={t("duplicateJob")}
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>{t("duplicateJob")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
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
            <AlertDialogTitle>{t("deleteJobConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteJobConfirmDesc", { position: job.position, company: job.company })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onJobDelete(job.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
