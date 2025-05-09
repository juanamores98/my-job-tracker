"use client"

import type React from "react"
import { useDrop } from "react-dnd"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Plus, Filter, Settings, Calendar, DollarSign, Star, MapPin, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AddJobModal } from "./add-job-modal"
import { useState } from "react"
import type { JobData } from "@/lib/types"
import { useLanguage } from "@/lib/i18n"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface JobColumnProps {
  id?: string
  title: string
  type: string
  color: string
  count?: number
  children: React.ReactNode
  onDrop: (jobId: string) => void
  onSettingsClick: () => void
  isDragging?: boolean
}

export function JobColumn({
  id,
  title,
  type,
  color,
  count = 0,
  children,
  onDrop,
  onSettingsClick,
  isDragging = false,
}: JobColumnProps) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [sortBy, setSortBy] = useState<string>("date")
  const { t } = useLanguage()

  const [{ isOver }, drop] = useDrop({
    accept: "job",
    drop: (item: { id: string }) => {
      onDrop(item.id)
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  })

  const handleAddJob = (job: JobData) => {
    // Create a modified job with the correct status
    const newJob = {
      ...job,
      status: type,
    }

    // Call the parent's onDrop with the new job ID
    onDrop(newJob.id)
  }

  // Filter jobs in this column
  const filterJobs = (filterType: string) => {
    setSortBy(filterType)
    // The actual filtering logic is handled in the parent component
  }

  return (
    <div
      id={id}
      ref={drop as any} // Cast to any to resolve react-dnd typing issue
      className={cn(
        "flex flex-col min-w-[280px] max-w-[280px] h-full rounded-md border shadow-sm",
        isOver && "ring-2 ring-primary ring-opacity-50",
        isDragging && "opacity-50 border-dashed",
      )}
      style={{ backgroundColor: `${color}10` }}
    >
      <div className="p-3 border-b sticky top-0 z-10" style={{ backgroundColor: `${color}20` }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-move mr-1" />
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
            </div>
            <h3 className="font-semibold text-sm">{title}</h3>
            <Badge variant="outline" className="ml-1 text-xs">
              {count}
            </Badge>
          </div>
          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Filter className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t("filterColumn")}</p> 
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => filterJobs("date")}>
                  <Calendar className="mr-2 h-4 w-4" /> {t("sortByDate")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => filterJobs("salary")}>
                  <DollarSign className="mr-2 h-4 w-4" /> {t("sortBySalary")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => filterJobs("priority")}>
                  <Star className="mr-2 h-4 w-4" /> {t("sortByExcitement")} 
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => filterJobs("location")}>
                  <MapPin className="mr-2 h-4 w-4" /> {t("sortByLocation")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => filterJobs("remote")}>{t("filterRemoteOnly")}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => filterJobs("onsite")}>{t("filterOnsiteOnly")}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onSettingsClick}>
                    <Settings className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("columnSettings")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowAddModal(true)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("addJobToColumn", { columnName: title })}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
      <ScrollArea className="flex-1">
        {/* The content div directly inside ScrollArea. */}
        {/* Set max-height here to ensure roughly 4-5 items are visible before scrolling. */}
        {/* Average card height ~180px. 4.5 cards * 180px = 810px. */}
        {/* Spacing (space-y-3 is 0.75rem = 12px). For 4 cards, 3 spaces = 36px. Total ~846px. */}
        {/* Let's use a Tailwind class if available, or an inline style. max-h-[800px] is not standard. */}
        {/* Using a style attribute for a specific pixel value. */}
        <div className="p-3 space-y-3" style={{ maxHeight: "800px" }}>
          {children}
        </div>
      </ScrollArea>

      {showAddModal && (
        <AddJobModal
          onAddJob={handleAddJob}
          initialStatus={type}
          onClose={() => setShowAddModal(false)}
          open={showAddModal}
        />
      )}
    </div>
  )
}
