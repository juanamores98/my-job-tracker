"use client"

import React from "react"
import { useDrop } from "react-dnd"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Plus, Settings, GripVertical, Inbox } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRef } from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useLanguage } from "@/lib/i18n"

interface JobColumnProps {
  id?: string
  title: string
  type: string
  color: string
  count?: number
  children: React.ReactNode
  onDrop: (jobId: string) => void
  onSettingsClick: () => void
  onAddJobClick: (statusId: string) => void
  isDragging?: boolean
}

interface EmptyColumnStateProps {
  title: string
  onAddClick: () => void
}

function EmptyColumnState({ title, onAddClick }: EmptyColumnStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-6 px-4 text-center space-y-4 border-2 border-dashed rounded-md border-muted-foreground/20 bg-muted/30">
      <Inbox className="h-10 w-10 text-muted-foreground/40" />
      <div className="space-y-2">
        <h4 className="text-base font-medium text-foreground">
          Empty {title} Column
        </h4>
        <p className="text-xs text-muted-foreground">
          No job applications in this column yet
        </p>
      </div>
      <Button
        size="sm"
        variant="default"
        className="mt-2 transition-all hover:scale-105"
        onClick={onAddClick}
      >
        <Plus className="h-4 w-4 mr-1" />
        Add Job
      </Button>
    </div>
  )
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
  onAddJobClick,
  isDragging = false,
}: JobColumnProps) {
  const { t } = useLanguage()
  const columnRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)

  const [{ isOver }, drop] = useDrop({
    accept: "job",
    drop: (item: { id: string }) => {
      onDrop(item.id)
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  })

  return (
    <div
      id={id}
      ref={(node) => {
        columnRef.current = node
        drop(node)
      }}
      className={cn(
        "flex flex-col min-w-[300px] max-w-[300px] h-full rounded-md border shadow-sm mx-1",
        isOver && "ring-2 ring-primary ring-opacity-50",
        isDragging && "opacity-50 border-dashed",
      )}
      style={{ backgroundColor: `${color}10` }}
    >
      <div
        ref={headerRef}
        className="p-4 border-b sticky top-0 z-10"
        style={{ backgroundColor: `${color}20` }}
      >
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
          <div className="flex items-center space-x-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onSettingsClick}>
                    <Settings className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Column Settings</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onAddJobClick(type)}>
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
      <div className="flex-1 overflow-hidden relative">
        <ScrollArea className={cn(
          "h-full",
          React.Children.count(children) > 4 && "max-h-[calc(min(70vh,4*8rem+3*1rem))]" // 4 cards (approx 8rem each) + 3 gaps (1rem each), max 70vh
        )}>
          <div className="p-4 space-y-4">
            {React.Children.count(children) > 0 ? (
              children
            ) : (
              <EmptyColumnState title={title} onAddClick={() => onAddJobClick(type)} />
            )}
          </div>
        </ScrollArea>
        {React.Children.count(children) > 4 && (
          <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        )}
      </div>
    </div>
  )
}
