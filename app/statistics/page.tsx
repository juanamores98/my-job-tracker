"use client"

import React, { useState, useEffect, useMemo } from "react"
import { getJobs } from "@/lib/storage"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import {
  Search,
  Download,
  FileText,
  Code,
  Heart,
  Award
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/lib/i18n"
import type { JobData } from "@/lib/types"

// Types
type ViewMode = "grid" | "list"
type SortOption = "count" | "name" | "percentage"
type SortDirection = "asc" | "desc"
type ChartType = "bar" | "pie"
type SkillCategory = "technical" | "soft" | "requirements"

interface ViewState {
  mode: ViewMode
  sort: SortOption
  direction: SortDirection
  search: string
  chartType: ChartType
  limit: number
  activeCategory: SkillCategory
}

interface SkillStat {
  name: string
  count: number
  percentage: number
  category?: string
}

export default function StatisticsPage() {
  // State management
  const [jobs, setJobs] = useState<JobData[]>([])
  const [viewState, setViewState] = useState<ViewState>({
    mode: "grid",
    sort: "count",
    direction: "desc",
    search: "",
    chartType: "bar",
    limit: 20,
    activeCategory: "technical"
  })
  const { toast } = useToast()
  // We use the language hook but don't need the t function for now
  useLanguage()

  // Load jobs on component mount
  useEffect(() => {
    setJobs(getJobs())
  }, [])

  // Extract and count skills from all jobs
  const skillStats = useMemo(() => {
    // Maps for each category
    const technicalSkillMap = new Map<string, number>()
    const softSkillMap = new Map<string, number>()
    const requirementsMap = new Map<string, number>()

    let totalTechnicalCount = 0
    let totalSoftSkillCount = 0
    let totalRequirementsCount = 0

    // Count occurrences of each skill type
    jobs.forEach(job => {
      // Technical skills
      if (job.skills && job.skills.length > 0) {
        job.skills.forEach(tag => {
          const normalizedTag = tag.trim().toLowerCase()
          if (normalizedTag) {
            const currentCount = technicalSkillMap.get(normalizedTag) || 0
            technicalSkillMap.set(normalizedTag, currentCount + 1)
            totalTechnicalCount++
          }
        })
      }

      // Soft skills
      if (job.softSkills && job.softSkills.length > 0) {
        job.softSkills.forEach(tag => {
          const normalizedTag = tag.trim().toLowerCase()
          if (normalizedTag) {
            const currentCount = softSkillMap.get(normalizedTag) || 0
            softSkillMap.set(normalizedTag, currentCount + 1)
            totalSoftSkillCount++
          }
        })
      }

      // Requirements
      if (job.requirements && job.requirements.length > 0) {
        job.requirements.forEach(tag => {
          const normalizedTag = tag.trim().toLowerCase()
          if (normalizedTag) {
            const currentCount = requirementsMap.get(normalizedTag) || 0
            requirementsMap.set(normalizedTag, currentCount + 1)
            totalRequirementsCount++
          }
        })
      }
    })

    // Convert to arrays of skill stats
    const technicalStats: SkillStat[] = Array.from(technicalSkillMap.entries()).map(([name, count]) => ({
      name,
      count,
      percentage: (count / jobs.length) * 100,
      category: "technical"
    }))

    const softSkillStats: SkillStat[] = Array.from(softSkillMap.entries()).map(([name, count]) => ({
      name,
      count,
      percentage: (count / jobs.length) * 100,
      category: "soft"
    }))

    const requirementStats: SkillStat[] = Array.from(requirementsMap.entries()).map(([name, count]) => ({
      name,
      count,
      percentage: (count / jobs.length) * 100,
      category: "requirements"
    }))

    return {
      technical: technicalStats,
      soft: softSkillStats,
      requirements: requirementStats,
      totalJobs: jobs.length,
      totalTechnicalSkills: technicalSkillMap.size,
      totalSoftSkills: softSkillMap.size,
      totalRequirements: requirementsMap.size,
      totalTechnicalCount,
      totalSoftSkillCount,
      totalRequirementsCount
    }
  }, [jobs])

  // Get active skills based on category
  const getActiveSkills = (category: SkillCategory) => {
    switch (category) {
      case "technical":
        return skillStats.technical || []
      case "soft":
        return skillStats.soft || []
      case "requirements":
        return skillStats.requirements || []
      default:
        return skillStats.technical || []
    }
  }

  // Filter and sort skills
  const filteredSkills = useMemo(() => {
    let result = [...getActiveSkills(viewState.activeCategory)]

    // Apply search filter
    if (viewState.search) {
      const searchLower = viewState.search.toLowerCase()
      result = result.filter(skill => skill.name.toLowerCase().includes(searchLower))
    }

    // Apply sorting
    result.sort((a, b) => {
      const direction = viewState.direction === "asc" ? 1 : -1

      switch (viewState.sort) {
        case "name":
          return direction * a.name.localeCompare(b.name)
        case "percentage":
          return direction * (a.percentage - b.percentage)
        case "count":
        default:
          return direction * (a.count - b.count)
      }
    })

    // Apply limit
    return result.slice(0, viewState.limit)
  }, [skillStats, viewState])

  // Export skills data as CSV
  const exportSkillsCSV = () => {
    try {
      // Create CSV content
      const headers = ["Category", "Skill", "Count", "Percentage"]

      // Combine all skills with their categories
      const allSkills = [
        ...skillStats.technical.map(skill => ({...skill, categoryName: "Technical Skill"})),
        ...skillStats.soft.map(skill => ({...skill, categoryName: "Soft Skill"})),
        ...skillStats.requirements.map(skill => ({...skill, categoryName: "Requirement"}))
      ]

      const rows = allSkills.map(skill =>
        `"${skill.categoryName}","${skill.name}",${skill.count},${skill.percentage.toFixed(2)}%`
      )

      const csvContent = [headers.join(','), ...rows].join('\n')

      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `skill-statistics-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Export Successful",
        description: "Skills statistics exported to CSV"
      })
    } catch (error) {
      console.error("Error exporting skills:", error)
      toast({
        title: "Export Failed",
        description: "Failed to export skills statistics",
        variant: "destructive"
      })
    }
  }

  // No chart color generation needed as we're using Tailwind classes

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold mb-1">
              Skills <span className="text-blue-500">Statistics</span>
            </h1>
            <p className="text-gray-400 text-sm">
              Analyze the most demanded skills from your job applications
            </p>
          </div>

          <Button
            onClick={exportSkillsCSV}
            className="bg-blue-600 hover:bg-blue-700 text-white mt-4 md:mt-0"
            size="lg"
          >
            <Download className="mr-2 h-5 w-5" />
            Export Statistics
          </Button>
        </div>

        {/* Skill Category Tabs */}
        <Tabs
          defaultValue="technical"
          value={viewState.activeCategory}
          onValueChange={(value) => setViewState(prev => ({
            ...prev,
            activeCategory: value as SkillCategory
          }))}
          className="mb-6"
        >
          <TabsList className="grid grid-cols-3 w-full md:w-auto">
            <TabsTrigger value="technical" className="flex items-center gap-2">
              <Code className="h-4 w-4 text-blue-500" />
              Technical Skills
            </TabsTrigger>
            <TabsTrigger value="soft" className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-rose-500" />
              Soft Skills
            </TabsTrigger>
            <TabsTrigger value="requirements" className="flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-500" />
              Requirements
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Controls */}
        <div className="bg-card rounded-lg p-4 mb-8 border">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1 md:flex-none">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={`Search ${viewState.activeCategory === "technical" ? "Technical Skills" : viewState.activeCategory === "soft" ? "Soft Skills" : "Requirements"}...`}
                    className="pl-9 w-full md:w-[250px]"
                    value={viewState.search}
                    onChange={(e) => setViewState(prev => ({
                      ...prev,
                      search: e.target.value
                    }))}
                  />
                </div>
              </div>

              <Tabs
                defaultValue="20"
                value={viewState.limit.toString()}
                onValueChange={(value) => setViewState(prev => ({
                  ...prev,
                  limit: parseInt(value)
                }))}
              >
                <TabsList>
                  <TabsTrigger value="10">Top 10</TabsTrigger>
                  <TabsTrigger value="20">Top 20</TabsTrigger>
                  <TabsTrigger value="50">Top 50</TabsTrigger>
                  <TabsTrigger value="100">Top 100</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                  >
                    Sort: {viewState.sort === "count" ? "Count" : viewState.sort === "name" ? "Name" : "Percentage"}
                    {viewState.direction === "asc" ? " (A-Z)" : " (Z-A)"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => setViewState(prev => ({ ...prev, sort: "count", direction: "desc" }))}
                  >
                    Count (Highest first)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => setViewState(prev => ({ ...prev, sort: "count", direction: "asc" }))}
                  >
                    Count (Lowest first)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => setViewState(prev => ({ ...prev, sort: "name", direction: "asc" }))}
                  >
                    Name (A-Z)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => setViewState(prev => ({ ...prev, sort: "name", direction: "desc" }))}
                  >
                    Name (Z-A)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => setViewState(prev => ({ ...prev, sort: "percentage", direction: "desc" }))}
                  >
                    Percentage (Highest first)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => setViewState(prev => ({ ...prev, sort: "percentage", direction: "asc" }))}
                  >
                    Percentage (Lowest first)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card rounded-lg p-6 border">
            <h3 className="text-lg font-medium mb-2">Total Jobs</h3>
            <p className="text-3xl font-bold">{skillStats.totalJobs}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Job applications analyzed
            </p>
          </div>

          <div className="bg-card rounded-lg p-6 border">
            <h3 className="text-lg font-medium mb-2">Unique Skills</h3>
            <p className="text-3xl font-bold">
              {skillStats.totalTechnicalSkills + skillStats.totalSoftSkills + skillStats.totalRequirements}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Different skills identified
            </p>
          </div>

          <div className="bg-card rounded-lg p-6 border">
            <h3 className="text-lg font-medium mb-2">Skills per Job</h3>
            <p className="text-3xl font-bold">
              {skillStats.totalJobs > 0
                ? ((skillStats.totalTechnicalCount + skillStats.totalSoftSkillCount + skillStats.totalRequirementsCount) / skillStats.totalJobs).toFixed(1)
                : "0"}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Average skills required per job
            </p>
          </div>
        </div>

        {/* Empty state */}
        {jobs.length === 0 ? (
          <div className="text-center py-20 border rounded-lg bg-card">
            <div className="bg-muted h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-2xl font-medium">No job data available</h3>
            <p className="mt-3 text-muted-foreground max-w-md mx-auto">
              Add job applications with skills tags to see statistics about the most demanded skills.
            </p>
            <Button
              className="mt-8 px-6 py-6 h-auto text-base"
              onClick={() => window.location.href = '/'}
              size="lg"
            >
              Go to Job Board
            </Button>
          </div>
        ) : (
          <>
            {/* Filtered state - no results */}
            {filteredSkills.length === 0 && (
              <div className="text-center py-16 border rounded-lg bg-card">
                <div className="bg-muted h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-medium">No matching skills found</h3>
                <p className="mt-2 text-muted-foreground max-w-md mx-auto">
                  We couldn't find any skills that match your current search. Try adjusting your search criteria.
                </p>
                <Button
                  variant="outline"
                  className="mt-6"
                  onClick={() => setViewState(prev => ({ ...prev, search: "" }))}
                  size="lg"
                >
                  Clear Search
                </Button>
              </div>
            )}

            {/* Skills visualization */}
            {filteredSkills.length > 0 && (
              <div className="space-y-8">
                {/* Skills table */}
                <div className="bg-card rounded-lg border overflow-hidden">
                  <div className="p-4 border-b">
                    <h3 className="text-xl font-medium flex items-center gap-2">
                      {viewState.activeCategory === "technical" ? (
                        <>
                          <Code className="h-5 w-5 text-blue-500" />
                          Top Technical Skills
                        </>
                      ) : viewState.activeCategory === "soft" ? (
                        <>
                          <Heart className="h-5 w-5 text-rose-500" />
                          Top Soft Skills
                        </>
                      ) : (
                        <>
                          <Award className="h-5 w-5 text-amber-500" />
                          Top Requirements
                        </>
                      )}
                    </h3>
                  </div>
                  <div className="grid grid-cols-12 gap-4 p-3 bg-muted text-xs font-medium text-muted-foreground border-b">
                    <div className="col-span-1 text-center">#</div>
                    <div className="col-span-5">
                      {viewState.activeCategory === "technical" ? "Skill" :
                       viewState.activeCategory === "soft" ? "Soft Skill" : "Requirement"}
                    </div>
                    <div className="col-span-3 text-center">Count</div>
                    <div className="col-span-3 text-right">% of Jobs</div>
                  </div>
                  <div className="max-h-[600px] overflow-y-auto">
                    {filteredSkills.map((skill, index) => (
                      <div
                        key={skill.name}
                        className="grid grid-cols-12 gap-4 p-3 items-center border-b hover:bg-accent/50 transition-colors"
                      >
                        <div className="col-span-1 text-center font-medium text-muted-foreground">
                          {index + 1}
                        </div>
                        <div className="col-span-5 font-medium capitalize">
                          {skill.name}
                        </div>
                        <div className="col-span-3 text-center">
                          {skill.count}
                        </div>
                        <div className="col-span-3 text-right">
                          {skill.percentage.toFixed(1)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skills visualization bars */}
                <div className="bg-card rounded-lg p-6 border">
                  <h3 className="text-xl font-medium mb-6 flex items-center gap-2">
                    {viewState.activeCategory === "technical" ? (
                      <>
                        <Code className="h-5 w-5 text-blue-500" />
                        Technical Skills Visualization
                      </>
                    ) : viewState.activeCategory === "soft" ? (
                      <>
                        <Heart className="h-5 w-5 text-rose-500" />
                        Soft Skills Visualization
                      </>
                    ) : (
                      <>
                        <Award className="h-5 w-5 text-amber-500" />
                        Requirements Visualization
                      </>
                    )}
                  </h3>
                  <div className="space-y-4">
                    {filteredSkills.slice(0, 10).map((skill) => (
                      <div key={skill.name} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="font-medium capitalize">{skill.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {skill.count} jobs ({skill.percentage.toFixed(1)}%)
                          </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              viewState.activeCategory === "technical" ? "bg-blue-500" :
                              viewState.activeCategory === "soft" ? "bg-rose-500" : "bg-amber-500"
                            }`}
                            // Using inline width style is necessary for dynamic percentage bars
                            style={{
                              width: `${Math.max(skill.percentage, 3)}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
