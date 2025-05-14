"use client"

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { DraggableColumn } from "./draggable-column"
import { JobCard } from "./job-card"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import type { JobData, ColumnType, JobFilter, SortOption, GroupOption, JobState, WorkMode } from "@/lib/types"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"; // Added Input import
import {
  FileUp,
  Table,
  Columns,
  X,
  Settings,
  Plus,
  MoreHorizontal,
  ListOrderedIcon as ListReorder,
  Loader2,
  ArrowLeft,
  ArrowRight,
  FileJson,
  FileSpreadsheet,
  Upload,
  Download,
  FileText,
  Filter,
  Calendar,
  Search, // Added Search import
} from "lucide-react"
import { getJobs, saveJobs, getUserSettings, saveUserSettings, getJobStates, saveJobStates } from "@/lib/storage"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/lib/i18n"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
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
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu"
// Removed DashboardHeader import, it's no longer used here
import { MinimalisticJobModal } from "./minimalistic-job-modal"
import { useStatusManager } from "@/lib/contexts/status-manager-context"
import { ThemeToggle } from "./theme-toggle"
import { Skeleton } from "@/components/ui/skeleton"
import { EnhancedStatusModal } from "./enhanced-status-modal"
import { defaultJobStates } from "@/lib/data"

export function JobBoard() {
  const [jobs, setJobs] = useState<JobData[]>([])
  const [view, setView] = useState<"kanban" | "table">("kanban")
  const [filter, setFilter] = useState<JobFilter>({})
  const [sort, setSort] = useState<SortOption>({ field: "date", order: "desc" })
  const [group, setGroup] = useState<GroupOption>({ field: "status" })
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isJobModalOpen, setIsJobModalOpen] = useState(false)
  const [isStatusManagerOpen, setIsStatusManagerOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<JobData | null>(null)
  const [initialStatusForModal, setInitialStatusForModal] = useState<string | undefined>(undefined)
  const { toast } = useToast()
  const { t } = useLanguage()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isMobile = useMediaQuery("(max-width: 768px)")
  const isSmallScreen = useMediaQuery("(max-width: 1024px)")
  const isExtraSmallScreen = useMediaQuery("(max-width: 640px)")
  const { openStatusManager, jobStates, setJobStates } = useStatusManager()

  // Function to migrate old job format to new format
  const migrateJobFormat = (job: JobData): JobData => {
    // Create a copy of the job
    const updatedJob = { ...job };

    // Check if this is an old format job (has location but no workMode)
    if (job.location && !job.workMode) {
      // Check if location contains work mode information
      const locationLower = job.location.toLowerCase();
      const isRemote = locationLower.includes('remote');
      const isHybrid = locationLower.includes('hybrid');
      const isFlexible = locationLower.includes('flexible');

      // Set work mode based on location text
      if (isRemote) {
        updatedJob.workMode = 'remote';
        // Clean location if it only contains work mode info
        if (locationLower.trim() === 'remote') {
          updatedJob.location = '';
        }
      } else if (isHybrid) {
        updatedJob.workMode = 'hybrid';
        // Clean location if it only contains work mode info
        if (locationLower.trim() === 'hybrid') {
          updatedJob.location = '';
        }
      } else if (isFlexible) {
        updatedJob.workMode = 'flexible';
        // Clean location if it only contains work mode info
        if (locationLower.trim() === 'flexible') {
          updatedJob.location = '';
        }
      } else {
        // Default to onsite if location doesn't contain work mode info
        updatedJob.workMode = 'onsite';
      }
    }

    return updatedJob;
  };

  useEffect(() => {
    // Load jobs from localStorage
    const loadedJobs = getJobs()

    // Migrate jobs to new format if needed
    const migratedJobs = loadedJobs.map(migrateJobFormat);

    // Save migrated jobs if any changes were made
    if (JSON.stringify(loadedJobs) !== JSON.stringify(migratedJobs)) {
      saveJobs(migratedJobs);
    }

    setJobs(migratedJobs)
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
        result = result.filter((job) => job.date && job.date >= filter.dateRange?.start!)
      }
      if (filter.dateRange.end) {
        result = result.filter((job) => job.date && job.date <= filter.dateRange?.end!)
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
  }, [filter, searchTerm])

  // Callback for JobTable to update status filter
  const handleStatusFilterChange = useCallback((statusId?: string) => {
    setFilter(prevFilter => ({
      ...prevFilter,
      status: statusId ? [statusId] : undefined
    }));
  }, [setFilter]);

  const moveJob = useCallback((jobId: string, targetColumn: ColumnType) => {
    const updatedJobs = jobs.map((job) => (job.id === jobId ? { ...job, status: targetColumn } : job))
    setJobs(updatedJobs)
    saveJobs(updatedJobs)

    toast({
      title: t("jobUpdated"),
      description: `${t("jobMovedTo")} ${targetColumn}`,
    })
  }, [jobs, toast, t])

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

  const exportJobs = (format: "json" | "csv" | "excel") => {
    try {
      if (format === "json") {
        // JSON export
        const content = JSON.stringify(jobs, null, 2);
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const filename = `job-tracker-export-${new Date().toISOString().split("T")[0]}.json`;

        downloadFile(url, filename);

        toast({
          title: t("exportSuccessful"),
          description: `${t("exportedJobsTo")} JSON`,
        });
      } else if (format === "csv") {
        // CSV export
        const csvContent = generateCSV(jobs);
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const filename = `job-tracker-export-${new Date().toISOString().split("T")[0]}.csv`;

        downloadFile(url, filename);

        toast({
          title: t("exportSuccessful"),
          description: `${t("exportedJobsTo")} CSV`,
        });
      } else if (format === "excel") {
        // Excel export - using SpreadsheetML format
        exportToExcel(jobs);

        toast({
          title: t("exportSuccessful"),
          description: `${t("exportedJobsTo")} Excel`,
        });
      }
    } catch (error) {
      console.error(`Error exporting to ${format}:`, error);
      toast({
        title: t("exportFailed"),
        description: t("errorExportingJobs"),
        variant: "destructive",
      });
    }
  };

  // Helper function to download a file
  const downloadFile = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Generate CSV content
  const generateCSV = (jobsData: JobData[]): string => {
    // CSV header with all fields including the new ones
    const headers = [
      "id", "company", "position", "location", "salary", "date", "status",
      "notes", "url", "priority", "tags", "description", "workMode",
      "salaryMin", "salaryMax", "salaryCurrency", "applyDate",
      "followUpDate", "contactPerson", "contactEmail"
    ];

    // Convert each job to a row
    const rows = jobsData.map(job => {
      const rowValues = [
        job.id || '',
        job.company || '',
        job.position || '',
        job.location || '',
        job.salary || '',
        job.date || '',
        job.status || '',
        job.notes || '',
        job.url || '',
        job.priority !== undefined ? job.priority.toString() : '',
        job.tags ? job.tags.join(";") : '',
        job.description || '',
        job.workMode || '',
        job.salaryMin !== undefined ? job.salaryMin.toString() : '',
        job.salaryMax !== undefined ? job.salaryMax.toString() : '',
        job.salaryCurrency || '',
        job.applyDate || '',
        job.followUpDate || '',
        // Remove excitement
        job.contactPerson || '',
        job.contactEmail || '',
      ];

      // Escape values that contain commas or quotes
      return rowValues.map(value => {
        if (value && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  };

  // Export to Excel
  const exportToExcel = (jobsData: JobData[]) => {
    // Create Excel XML content
    const filename = `job-tracker-export-${new Date().toISOString().split("T")[0]}.xls`;

    // XML header
    let excelContent = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>';
    excelContent += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';
    excelContent += 'xmlns:o="urn:schemas-microsoft-com:office:office" ';
    excelContent += 'xmlns:x="urn:schemas-microsoft-com:office:excel" ';
    excelContent += 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" ';
    excelContent += 'xmlns:html="http://www.w3.org/TR/REC-html40">';

    // Add styles
    excelContent += '<Styles>';
    excelContent += '<Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Bottom"/>';
    excelContent += '<Borders/><Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>';
    excelContent += '<Interior/><NumberFormat/><Protection/></Style>';
    excelContent += '<Style ss:ID="HeaderStyle"><Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000" ss:Bold="1"/>';
    excelContent += '<Interior ss:Color="#D9D9D9" ss:Pattern="Solid"/></Style>';
    excelContent += '</Styles>';

    // Create worksheet
    excelContent += '<Worksheet ss:Name="Jobs">';
    excelContent += '<Table>';

    // Table columns
    const columns = [
      "id", "company", "position", "location", "salary", "date", "status",
      "notes", "url", "priority", "tags", "description", "workMode",
      "salaryMin", "salaryMax", "salaryCurrency", "applyDate",
      "followUpDate", "contactPerson", "contactEmail"
    ];

    // Column headers
    excelContent += '<Row ss:StyleID="HeaderStyle">';
    columns.forEach(col => {
      excelContent += `<Cell><Data ss:Type="String">${escapeXml(col)}</Data></Cell>`;
    });
    excelContent += '</Row>';

    // Data rows
    jobsData.forEach(job => {
      excelContent += '<Row>';

      excelContent += `<Cell><Data ss:Type="String">${escapeXml(job.id || '')}</Data></Cell>`;
      excelContent += `<Cell><Data ss:Type="String">${escapeXml(job.company || '')}</Data></Cell>`;
      excelContent += `<Cell><Data ss:Type="String">${escapeXml(job.position || '')}</Data></Cell>`;
      excelContent += `<Cell><Data ss:Type="String">${escapeXml(job.location || '')}</Data></Cell>`;
      excelContent += `<Cell><Data ss:Type="String">${escapeXml(job.salary || '')}</Data></Cell>`;
      excelContent += `<Cell><Data ss:Type="String">${escapeXml(job.date || '')}</Data></Cell>`;
      excelContent += `<Cell><Data ss:Type="String">${escapeXml(job.status || '')}</Data></Cell>`;
      excelContent += `<Cell><Data ss:Type="String">${escapeXml(job.notes || '')}</Data></Cell>`;
      excelContent += `<Cell><Data ss:Type="String">${escapeXml(job.url || '')}</Data></Cell>`;
      excelContent += `<Cell><Data ss:Type="String">${escapeXml(job.priority !== undefined ? job.priority.toString() : '')}</Data></Cell>`;
      excelContent += `<Cell><Data ss:Type="String">${escapeXml(job.tags ? job.tags.join(";") : '')}</Data></Cell>`;
      excelContent += `<Cell><Data ss:Type="String">${escapeXml(job.description || '')}</Data></Cell>`;
      excelContent += `<Cell><Data ss:Type="String">${escapeXml(job.workMode || '')}</Data></Cell>`;
      excelContent += `<Cell><Data ss:Type="String">${escapeXml(job.salaryMin !== undefined ? job.salaryMin.toString() : '')}</Data></Cell>`;
      excelContent += `<Cell><Data ss:Type="String">${escapeXml(job.salaryMax !== undefined ? job.salaryMax.toString() : '')}</Data></Cell>`;
      excelContent += `<Cell><Data ss:Type="String">${escapeXml(job.salaryCurrency || '')}</Data></Cell>`;
      excelContent += `<Cell><Data ss:Type="String">${escapeXml(job.applyDate || '')}</Data></Cell>`;
      excelContent += `<Cell><Data ss:Type="String">${escapeXml(job.followUpDate || '')}</Data></Cell>`;
      excelContent += `<Cell><Data ss:Type="String">${escapeXml(job.contactPerson || '')}</Data></Cell>`;
      excelContent += `<Cell><Data ss:Type="String">${escapeXml(job.contactEmail || '')}</Data></Cell>`;

      excelContent += '</Row>';
    });

    // Close table, worksheet, and workbook
    excelContent += '</Table></Worksheet></Workbook>';

    // Create blob and download
    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);

    downloadFile(url, filename);
  };

  // Helper function to escape XML special characters
  const escapeXml = (unsafe: string): string => {
    if (!unsafe) return '';
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const importJobs = (format?: string) => {
    const input = document.createElement("input");
    input.type = "file";

    // Set accepted file types based on format or accept all supported formats
    if (format === "json") {
      input.accept = ".json";
    } else if (format === "csv") {
      input.accept = ".csv";
    } else {
      input.accept = ".json,.csv";
    }

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();

      reader.onload = async (event) => {
        try {
          const fileContent = event.target?.result as string;
          if (!fileContent) throw new Error("Failed to read file");

          let importedJobs: JobData[] = [];

          // Process based on file extension
          if (file.name.endsWith(".json")) {
            // Parse JSON
            const parsedJobs = JSON.parse(fileContent);

            // Basic validation
            if (!Array.isArray(parsedJobs) || !parsedJobs.every(job =>
              typeof job === 'object' && job.id && job.company && job.position && job.status)) {
              throw new Error("Invalid JSON format");
            }

            // Process jobs to ensure they use the new format
            importedJobs = parsedJobs.map(job => {
              // Check if this is an old format job (has location but no workMode)
              if (job.location && !job.workMode) {
                // Extract work mode from location if possible
                const isRemote = job.location.toLowerCase().includes('remote');
                const isHybrid = job.location.toLowerCase().includes('hybrid');

                // Create a new job object with the updated fields
                return {
                  ...job,
                  // Set work mode based on location text
                  workMode: isRemote ? 'remote' : isHybrid ? 'hybrid' : 'onsite',
                  // Keep original location, but clean it if it contains work mode info
                  location: isRemote || isHybrid
                    ? job.location.replace(/remote|hybrid/gi, '').trim()
                    : job.location,
                  // Convert salary string to structured format if possible
                  ...(job.salary ? parseSalaryString(job.salary) : {})
                };
              }
              return job;
            });
          } else if (file.name.endsWith(".csv")) {
            // Parse CSV
            importedJobs = parseCSV(fileContent);
          } else {
            throw new Error("Unsupported file format");
          }

          // Merge with existing jobs (avoid duplicates by ID)
          const existingIds = new Set(jobs.map(job => job.id));
          const newJobs = importedJobs.filter(job => !existingIds.has(job.id));
          const updatedJobs = [...jobs, ...newJobs];

          setJobs(updatedJobs);
          saveJobs(updatedJobs);

          toast({
            title: t("importSuccessful"),
            description: `${t("importedJobsCount")} ${newJobs.length}`,
          });
        } catch (error) {
          console.error("Error importing jobs:", error);
          toast({
            title: t("importFailed"),
            description: error instanceof Error ? error.message : t("errorImportingJobs"),
            variant: "destructive",
          });
        }
      };

      reader.readAsText(file);
    };

    input.click();
  };

  // Helper function to parse salary string into structured format
  const parseSalaryString = (salaryStr: string): Partial<JobData> => {
    try {
      // Remove currency symbols and other non-numeric characters
      const cleanStr = salaryStr.replace(/[^0-9\-\s\.k]/gi, '');

      // Check for salary range format (e.g., "120k - 150k" or "120,000 - 150,000")
      const rangeMatch = cleanStr.match(/(\d+\.?\d*k?)\s*-\s*(\d+\.?\d*k?)/i);

      if (rangeMatch) {
        const min = parseKValue(rangeMatch[1]);
        const max = parseKValue(rangeMatch[2]);

        // Determine currency from original string
        const currency = determineCurrency(salaryStr);

        return {
          salaryMin: min,
          salaryMax: max,
          salaryCurrency: currency
        };
      }

      // Check for single value with plus (e.g., "120k+")
      const plusMatch = cleanStr.match(/(\d+\.?\d*k?)\+/i);
      if (plusMatch) {
        const min = parseKValue(plusMatch[1]);
        const currency = determineCurrency(salaryStr);

        return {
          salaryMin: min,
          salaryCurrency: currency
        };
      }

      // Check for single value (e.g., "120k")
      const singleMatch = cleanStr.match(/(\d+\.?\d*k?)/i);
      if (singleMatch) {
        const value = parseKValue(singleMatch[1]);
        const currency = determineCurrency(salaryStr);

        return {
          salaryMin: value,
          salaryMax: value,
          salaryCurrency: currency
        };
      }

      // Default return if no pattern matches
      return {};
    } catch (e) {
      console.error("Error parsing salary string:", e);
      return {};
    }
  }

  // Helper to parse values with 'k' notation (e.g., 120k -> 120000)
  const parseKValue = (value: string): number => {
    if (value.toLowerCase().includes('k')) {
      return parseFloat(value.toLowerCase().replace('k', '')) * 1000;
    }
    return parseFloat(value);
  }

  // Helper to determine currency from salary string
  const determineCurrency = (salaryStr: string): string => {
    if (salaryStr.includes('$') || salaryStr.includes('USD')) return 'USD';
    if (salaryStr.includes('€') || salaryStr.includes('EUR')) return 'EUR';
    if (salaryStr.includes('£') || salaryStr.includes('GBP')) return 'GBP';
    if (salaryStr.includes('¥') || salaryStr.includes('JPY')) return 'JPY';
    if (salaryStr.includes('₹') || salaryStr.includes('INR')) return 'INR';
    if (salaryStr.includes('C$') || salaryStr.includes('CAD')) return 'CAD';
    if (salaryStr.includes('A$') || salaryStr.includes('AUD')) return 'AUD';
    return 'USD'; // Default to USD
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
        // Priority already set above
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

  // Update the moveColumn function to actually reorder columns
  const moveColumn = useCallback((dragIndex: number, hoverIndex: number) => {
    const draggedState = jobStates[dragIndex]
    const newJobStates = [...jobStates]

    // Remove the state at dragIndex
    newJobStates.splice(dragIndex, 1)

    // Insert it at the hoverIndex position
    newJobStates.splice(hoverIndex, 0, draggedState)

    // Update the order property for each state
    const reorderedStates = newJobStates.map((state, index) => ({
      ...state,
      order: index,
    }))

    // Update both local state and save to storage
    setJobStates(reorderedStates)
    saveJobStates(reorderedStates)
  }, [jobStates, setJobStates])

  // Scroll the columns container left or right
  const scrollColumns = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const scrollAmount = 300 // Adjust as needed

      if (direction === "left") {
        container.scrollBy({ left: -scrollAmount, behavior: "smooth" })
      } else {
        container.scrollBy({ left: scrollAmount, behavior: "smooth" })
      }
    }
  }

  const handleOpenEditModal = (job: JobData) => {
    setEditingJob(job)
    setInitialStatusForModal(job.status);
    setIsJobModalOpen(true)
  }

  const handleOpenAddModal = (statusId?: string) => {
    setEditingJob(null);
    setInitialStatusForModal(statusId || jobStates.find(s => s.isDefault)?.id || jobStates[0]?.id );
    setIsJobModalOpen(true);
  }

  const renderFloatingActionButton = () => {
    if (!isMobile) return null

    return (
      <Button
        className="fixed bottom-4 right-4 rounded-full w-14 h-14 shadow-lg z-50"
        onClick={() => handleOpenAddModal()}
      >
        <Plus className="h-6 w-6" />
      </Button>
    )
  }

  const renderExportImportControls = () => (
    <div className="flex items-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2 lg:px-3 flex items-center gap-1"
          >
            <Download className="h-4 w-4" />
            {!isSmallScreen && <span className="ml-1">Export</span>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Export Jobs</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => exportJobs("json")}>
            <FileJson className="mr-2 h-4 w-4" /> Export JSON
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => exportJobs("csv")}>
            <FileText className="mr-2 h-4 w-4" /> Export CSV
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => exportJobs("excel")}>
            <FileSpreadsheet className="mr-2 h-4 w-4" /> Export Excel
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2 lg:px-3 ml-2 flex items-center gap-1"
          >
            <Upload className="h-4 w-4" />
            {!isSmallScreen && <span className="ml-1">Import</span>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Import Jobs</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => importJobs("json")}>
            <FileJson className="mr-2 h-4 w-4" /> Import JSON
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => importJobs("csv")}>
            <FileText className="mr-2 h-4 w-4" /> Import CSV
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => importJobs()}>
            <FileUp className="mr-2 h-4 w-4" /> Import All
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )

  const duplicateJob = (jobToDuplicate: JobData) => {
    // Create a new job with the same properties but a new ID and timestamp
    const newJob: JobData = {
      ...jobToDuplicate,
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      date: new Date().toISOString().split("T")[0], // Today's date
      applyDate: new Date().toISOString().split("T")[0],
      notes: jobToDuplicate.notes ? `${jobToDuplicate.notes}\n\n(Duplicated from original job)` : '(Duplicated from original job)',
    }

    // Add the new job
    const updatedJobs = [...jobs, newJob]
    setJobs(updatedJobs)
    saveJobs(updatedJobs)

    toast({
      title: t("jobDuplicated"),
      description: t("jobDuplicatedSuccess", { position: newJob.position, company: newJob.company }),
    })
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="border-b p-4">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b">
          <div className="flex justify-between items-center p-2 md:p-4">
            <Skeleton className="h-9 w-24" />
            <div className="flex space-x-2">
              <Skeleton className="h-9 w-32" />
            </div>
            <div className="flex space-x-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-hidden pt-6">
          <div className="flex gap-6 px-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="min-w-[300px] max-w-[300px] h-[calc(100vh-16rem)] rounded-md border animate-pulse">
                <div className="p-4 border-b">
                  <div className="flex justify-between">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </div>
                <div className="p-4 space-y-4">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <Skeleton key={j} className="h-32 w-full rounded-md" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Dashboard Header (search bar) removed from here, integrated below */}

      {/* Fixed Header with Controls */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex justify-between items-center p-2 md:p-4">
          {/* Left Controls: Search Input and Manage Statuses */}
          <div className="flex items-center space-x-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search Jobs..."
                className="h-9 pl-10 pr-3 py-2 text-sm md:w-64 lg:w-80" // Adjusted width
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              />
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size={isSmallScreen ? "icon" : "sm"}
                    className="h-9" // Match height of search input
                    onClick={openStatusManager}
                  >
                    <ListReorder className="h-4 w-4" />
                    {!isSmallScreen && <span className="ml-2">Manage Statuses</span>}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{t("manageJobStatuses")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Center/Main Controls */}
          <div className="flex items-center space-x-2">
            <div className="flex border rounded-md">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="default"
                      size="default"
                      className="rounded-r-none h-9"
                      onClick={() => setView("kanban")}
                    >
                      <Columns className="h-4 w-4" />
                      {!isSmallScreen && <span className="ml-2">Kanban</span>}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>{t("switchToKanbanBoardView")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="default"
                      size="default"
                      className="rounded-l-none h-9"
                      onClick={() => setView("table")}
                    >
                      <Table className="h-4 w-4" />
                      {!isSmallScreen && <span className="ml-2">Table</span>}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>{t("switchToTableView")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-2">
            <Button
              variant="default"
              size="sm"
              className="h-8 px-2 lg:px-3"
              onClick={() => handleOpenAddModal()}
            >
              <Plus className="h-4 w-4" />
              {!isSmallScreen && <span className="ml-2">Add Job</span>}
            </Button>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="h-9 w-9">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Options</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <Download className="mr-2 h-4 w-4" /> Export
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          <DropdownMenuItem onSelect={() => exportJobs("json")}>
                            <FileJson className="mr-2 h-4 w-4" /> Export JSON
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => exportJobs("csv")}>
                            <FileText className="mr-2 h-4 w-4" /> Export CSV
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => exportJobs("excel")}>
                            <FileSpreadsheet className="mr-2 h-4 w-4" /> Export Excel
                          </DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <Upload className="mr-2 h-4 w-4" /> Import
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          <DropdownMenuItem onSelect={() => importJobs("json")}>
                            <FileJson className="mr-2 h-4 w-4" /> Import JSON
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => importJobs("csv")}>
                            <FileText className="mr-2 h-4 w-4" /> Import CSV
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => importJobs()}>
                            <FileUp className="mr-2 h-4 w-4" /> Import All
                          </DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{t("moreOptions")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Active filters - only show in table view */}
        {view === "table" && activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center p-2 px-4">
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

        <div className="text-sm text-muted-foreground px-4 py-1">
          {filteredJobs.length} Job Applications
        </div>
      </div>

      {view === "kanban" ? (
        <DndProvider backend={HTML5Backend}>
          <div className="relative flex-1 overflow-hidden h-[calc(100vh-12rem)]">
            {/* Scroll Left Button */}
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 z-20">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => scrollColumns("left")}
                      className="rounded-l-none opacity-75 hover:opacity-100"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{t("scrollColumnsLeft")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <ScrollArea className="w-full h-full">
              <div
                ref={scrollContainerRef}
                className="flex gap-6 pb-8 px-6 pt-6"
                style={{ minHeight: "100%" }}
              >
                {jobStates.map((state, index) => {
                  return (
                    <DraggableColumn
                      key={state.id}
                      id={`column-${state.id}`}
                      index={index}
                      moveColumn={moveColumn}
                      title={state.name}
                      type={state.id}
                      color={state.color}
                      onDrop={(jobId) => moveJob(jobId, state.id)}
                      count={filteredJobs.filter((job) => job.status === state.id).length}
                      onSettingsClick={openStatusManager}
                      onAddJobClick={() => handleOpenAddModal(state.id)}
                    >
                      {filteredJobs
                        .filter((job) => job.status === state.id)
                        .map((job) => (
                          <JobCard
                            key={job.id}
                            job={job}
                            onJobDelete={deleteJob}
                            onJobEdit={handleOpenEditModal}
                            onJobDuplicate={duplicateJob}
                          />
                        ))}
                    </DraggableColumn>
                  );
                })}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>

            {/* Scroll Right Button */}
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 z-20">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => scrollColumns("right")}
                      className="rounded-r-none opacity-75 hover:opacity-100"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p>{t("scrollColumnsRight")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </DndProvider>
      ) : (
        <div className="flex-1 overflow-auto px-4">
          <JobTable
            jobs={filteredJobs}
            jobStates={jobStates}
            onJobUpdate={updateJob}
            onJobDelete={deleteJob}
            onStatusChange={moveJob}
            onJobEdit={handleOpenEditModal}
            onJobDuplicate={duplicateJob}
            currentStatusFilter={filter.status}
            onStatusFilterChange={handleStatusFilterChange}
          />
        </div>
      )}

      {/* Fixed Add Job Button */}
      {renderFloatingActionButton()}

      {/* Modals */}
      <MinimalisticJobModal
        jobToEdit={editingJob}
        initialStatus={initialStatusForModal}
        onAddJob={addJob}
        onEditJob={updateJob}
        open={isJobModalOpen}
        onClose={() => {
          setIsJobModalOpen(false);
          setEditingJob(null);
          setInitialStatusForModal(undefined);
        }}
        jobStates={jobStates}
      />

      <EnhancedStatusModal
        open={isStatusManagerOpen}
        onOpenChange={setIsStatusManagerOpen}
        jobStates={jobStates}
        onAddStatus={(status) => {
          const updatedStates = [...jobStates, status].sort((a, b) => a.order - b.order);
          setJobStates(updatedStates);
        }}
        onUpdateStatus={(status) => {
          const updatedStates = jobStates.map(s => s.id === status.id ? status : s);
          setJobStates(updatedStates);
        }}
        onDeleteStatus={(statusId) => {
          const updatedStates = jobStates.filter(s => s.id !== statusId);
          setJobStates(updatedStates);
        }}
        onReorderStatuses={setJobStates}
        onRestoreDefaults={() => {
          // Default implementation
          const defaultState = jobStates.find(s => s.isDefault)?.id || jobStates[0].id;
          setJobStates([...defaultJobStates]);
          return defaultState;
        }}
      />
    </div>
  )
}
