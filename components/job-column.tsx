"use client";

import React, { useState, useMemo } from "react";
import { useDrop } from "react-dnd";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings, GripVertical, Inbox, ArrowUpDown, ArrowUp, ArrowDown, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/lib/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type { JobData } from "@/lib/types";
import { JobCard } from "./job-card";

type SortField = "date" | "company" | "position" | "priority" | "salary";
type SortOrder = "asc" | "desc";

interface JobColumnProps {
  id?: string;
  title: string;
  type: string;
  color: string;
  count?: number;
  jobs: JobData[];
  onDrop: (jobId: string) => void;
  onSettingsClick: () => void;
  onAddJobClick: (statusId: string) => void;
  onJobEdit?: (job: JobData) => void;
  onJobDelete?: (jobId: string) => void;
  onJobDuplicate?: (job: JobData) => void;
  isDragging?: boolean;
}

interface EmptyColumnStateProps {
  title: string;
  onAddClick: () => void;
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
  );
}

export function JobColumn({
  id,
  title,
  type,
  color,
  count = 0,
  jobs,
  onDrop,
  onSettingsClick,
  onAddJobClick,
  onJobEdit,
  onJobDelete,
  onJobDuplicate,
  isDragging = false,
}: JobColumnProps) {
  const { t } = useLanguage();
  const columnRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  // Column-specific sorting and filtering state
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [searchTerm, setSearchTerm] = useState("");

  const [{ isOver }, drop] = useDrop({
    accept: "job",
    drop: (item: { id: string }) => {
      onDrop(item.id);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  // Apply sorting and filtering to jobs
  const sortedAndFilteredJobs = useMemo(() => {
    let filteredJobs = [...jobs];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredJobs = filteredJobs.filter(job =>
        job.company.toLowerCase().includes(term) ||
        job.position.toLowerCase().includes(term) ||
        job.location?.toLowerCase().includes(term) ||
        job.notes?.toLowerCase().includes(term) ||
        job.description?.toLowerCase().includes(term) ||
        job.tags?.some(tag => tag.toLowerCase().includes(term))
      );
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
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filteredJobs;
  }, [jobs, searchTerm, sortField, sortOrder]);

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

  const getCurrentSortIcon = () => {
    return sortOrder === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  return (
    <div
      id={id}
      ref={(node) => {
        columnRef.current = node;
        drop(node);
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
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-move mr-1" />
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              ></div>
            </div>
            <h3 className="font-semibold text-sm">{title}</h3>
            <Badge variant="outline" className="ml-1 text-xs">
              {sortedAndFilteredJobs.length}
            </Badge>
            {searchTerm && (
              <Badge variant="secondary" className="ml-1 text-xs">
                Filtered
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-1">
            {/* Sort Dropdown - Minimalistic */}
            <TooltipProvider>
              <Tooltip>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                      >
                        {getCurrentSortIcon()}
                      </Button>
                    </TooltipTrigger>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleSortChange("date")}>
                      <div className="flex items-center justify-between w-full">
                        <span>Date</span>
                        {getSortIcon("date")}
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSortChange("company")}>
                      <div className="flex items-center justify-between w-full">
                        <span>Company</span>
                        {getSortIcon("company")}
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSortChange("position")}>
                      <div className="flex items-center justify-between w-full">
                        <span>Position</span>
                        {getSortIcon("position")}
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSortChange("priority")}>
                      <div className="flex items-center justify-between w-full">
                        <span>Priority</span>
                        {getSortIcon("priority")}
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSortChange("salary")}>
                      <div className="flex items-center justify-between w-full">
                        <span>Salary</span>
                        {getSortIcon("salary")}
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <TooltipContent>
                  <p>Sort by {sortField} ({sortOrder === "asc" ? "ascending" : "descending"})</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={onSettingsClick}
                  >
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onAddJobClick(type)}
                  >
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

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            placeholder="Search jobs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 pl-7 pr-8 text-xs"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
              onClick={clearSearch}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-hidden relative">
        <ScrollArea
          className={cn(
            "h-full",
            sortedAndFilteredJobs.length > 4 &&
              "max-h-[calc(min(70vh,4*8rem+3*1rem))]", // 4 cards (approx 8rem each) + 3 gaps (1rem each), max 70vh
          )}
        >
          <div className="p-4 space-y-4">
            {sortedAndFilteredJobs.length > 0 ? (
              sortedAndFilteredJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onJobDelete={onJobDelete || (() => {})}
                  onJobEdit={onJobEdit || (() => {})}
                  onJobDuplicate={onJobDuplicate || (() => {})}
                />
              ))
            ) : jobs.length === 0 ? (
              <EmptyColumnState
                title={title}
                onAddClick={() => onAddJobClick(type)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-6 px-4 text-center space-y-4">
                <Search className="h-8 w-8 text-muted-foreground/40" />
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">
                    No jobs match search
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Try a different search term
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={clearSearch}
                >
                  Clear Search
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
        {sortedAndFilteredJobs.length > 4 && (
          <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        )}
      </div>
    </div>
  );
}
