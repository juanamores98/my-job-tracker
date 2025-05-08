"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { getJobs } from "@/lib/storage"
import { analyzeJobDescription } from "@/lib/job-analyzer"
import { technicalSkillsMap, softSkillsMap, requirementsMap } from "@/lib/skill-categories"

interface SkillCount {
  skill: string
  count: number
  percentage: number
  category?: string
}

export function SkillsDashboard() {
  const [technicalSkills, setTechnicalSkills] = useState<SkillCount[]>([])
  const [softSkills, setSoftSkills] = useState<SkillCount[]>([])
  const [requirements, setRequirements] = useState<SkillCount[]>([])
  const [activeTab, setActiveTab] = useState<"technical" | "soft" | "requirements">("technical")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Extract skills from job descriptions and tags
    const jobs = getJobs()
    const totalJobs = jobs.length

    if (totalJobs === 0) {
      setIsLoading(false)
      return
    }

    // Initialize counters for each skill type
    const technicalSkillsCount: Record<string, { count: number; category?: string }> = {}
    const softSkillsCount: Record<string, { count: number; category?: string }> = {}
    const requirementsCount: Record<string, { count: number; category?: string }> = {}

    // Process all jobs
    jobs.forEach((job) => {
      // Process tags
      if (job.tags && job.tags.length > 0) {
        job.tags.forEach((tag) => {
          // Check if tag is a technical skill
          for (const [category, skills] of Object.entries(technicalSkillsMap)) {
            if (skills.some((s) => s.toLowerCase() === tag.toLowerCase())) {
              technicalSkillsCount[tag] = technicalSkillsCount[tag] || { count: 0, category }
              technicalSkillsCount[tag].count++
              return
            }
          }

          // Check if tag is a soft skill
          for (const [category, skills] of Object.entries(softSkillsMap)) {
            if (skills.some((s) => s.toLowerCase() === tag.toLowerCase())) {
              softSkillsCount[tag] = softSkillsCount[tag] || { count: 0, category }
              softSkillsCount[tag].count++
              return
            }
          }

          // Check if tag is a requirement
          for (const [category, reqs] of Object.entries(requirementsMap)) {
            if (reqs.some((r) => r.toLowerCase() === tag.toLowerCase())) {
              requirementsCount[tag] = requirementsCount[tag] || { count: 0, category }
              requirementsCount[tag].count++
              return
            }
          }
        })
      }

      // Process description
      if (job.description) {
        const { technicalSkills, softSkills, requirements } = analyzeJobDescription(job.description)

        // Add technical skills
        technicalSkills.forEach((skill) => {
          // Find the category
          let category: string | undefined
          for (const [cat, skills] of Object.entries(technicalSkillsMap)) {
            if (skills.some((s) => s.toLowerCase() === skill.toLowerCase())) {
              category = cat
              break
            }
          }

          technicalSkillsCount[skill] = technicalSkillsCount[skill] || { count: 0, category }
          technicalSkillsCount[skill].count++
        })

        // Add soft skills
        softSkills.forEach((skill) => {
          // Find the category
          let category: string | undefined
          for (const [cat, skills] of Object.entries(softSkillsMap)) {
            if (skills.some((s) => s.toLowerCase() === skill.toLowerCase())) {
              category = cat
              break
            }
          }

          softSkillsCount[skill] = softSkillsCount[skill] || { count: 0, category }
          softSkillsCount[skill].count++
        })

        // Add requirements
        requirements.forEach((req) => {
          // Find the category
          let category: string | undefined
          for (const [cat, reqs] of Object.entries(requirementsMap)) {
            if (reqs.some((r) => r.toLowerCase() === req.toLowerCase())) {
              category = cat
              break
            }
          }

          requirementsCount[req] = requirementsCount[req] || { count: 0, category }
          requirementsCount[req].count++
        })
      }
    })

    // Convert to arrays and calculate percentages
    const techSkillsArray = Object.entries(technicalSkillsCount).map(([skill, data]) => ({
      skill,
      count: data.count,
      percentage: Math.round((data.count / totalJobs) * 100),
      category: data.category,
    }))

    const softSkillsArray = Object.entries(softSkillsCount).map(([skill, data]) => ({
      skill,
      count: data.count,
      percentage: Math.round((data.count / totalJobs) * 100),
      category: data.category,
    }))

    const requirementsArray = Object.entries(requirementsCount).map(([skill, data]) => ({
      skill,
      count: data.count,
      percentage: Math.round((data.count / totalJobs) * 100),
      category: data.category,
    }))

    // Sort by count (descending)
    techSkillsArray.sort((a, b) => b.count - a.count)
    softSkillsArray.sort((a, b) => b.count - a.count)
    requirementsArray.sort((a, b) => b.count - a.count)

    setTechnicalSkills(techSkillsArray)
    setSoftSkills(softSkillsArray)
    setRequirements(requirementsArray)
    setIsLoading(false)
  }, [])

  // Get the active skills list based on the current tab
  const getActiveSkills = (): SkillCount[] => {
    switch (activeTab) {
      case "technical":
        return technicalSkills
      case "soft":
        return softSkills
      case "requirements":
        return requirements
      default:
        return []
    }
  }

  // Group skills by category
  const groupedSkills = getActiveSkills().reduce<Record<string, SkillCount[]>>((acc, skill) => {
    const category = skill.category || "Other"
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(skill)
    return acc
  }, {})

  return (
    <Card>
      <CardHeader>
        <CardTitle>Skills & Requirements Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-4">
          <TabsList>
            <TabsTrigger value="technical">Technical Skills</TabsTrigger>
            <TabsTrigger value="soft">Soft Skills</TabsTrigger>
            <TabsTrigger value="requirements">Requirements</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : getActiveSkills().length > 0 ? (
              <div className="space-y-6">
                {Object.entries(groupedSkills).map(([category, skills]) => (
                  <div key={category} className="space-y-3">
                    <h3 className="text-sm font-medium">{category}</h3>
                    <div className="space-y-4">
                      {skills.map((skill, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <span className="text-sm font-medium">{skill.skill}</span>
                              <Badge variant="outline" className="ml-2">
                                {skill.count} jobs
                              </Badge>
                            </div>
                            <span className="text-sm text-muted-foreground">{skill.percentage}%</span>
                          </div>
                          <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${skill.percentage}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No {activeTab} data available. Add more job applications with detailed descriptions to see analysis.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
