"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { analyzeJobDescription } from "@/lib/job-analyzer"
import { TagBadge } from "@/components/tag-badge"
import { Code, Heart, Award, Copy, CheckCircle2, Clipboard, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/lib/i18n"
import { Input } from "@/components/ui/input"
import type { JobData } from "@/lib/types"

interface JobDescriptionAnalyzerProps {
  onSkillsSelected?: (skills: string[], softSkills: string[], requirements: string[]) => void
  showAddToJobButton?: boolean
}

export function JobDescriptionAnalyzer({ 
  onSkillsSelected, 
  showAddToJobButton = false 
}: JobDescriptionAnalyzerProps) {
  const [jobDescription, setJobDescription] = useState("")
  const [analyzedResults, setAnalyzedResults] = useState<{
    technicalSkills: string[]
    softSkills: string[]
    requirements: string[]
  }>({
    technicalSkills: [],
    softSkills: [],
    requirements: [],
  })
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [copied, setCopied] = useState<Record<string, boolean>>({})
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSkills, setSelectedSkills] = useState<{
    technicalSkills: string[]
    softSkills: string[]
    requirements: string[]
  }>({
    technicalSkills: [],
    softSkills: [],
    requirements: [],
  })
  const { toast } = useToast()
  const { t } = useLanguage()

  // Analyze job description when text changes (with debounce)
  useEffect(() => {
    if (!jobDescription || jobDescription.length < 50) return

    const timer = setTimeout(() => {
      analyzeDescription()
    }, 1000)

    return () => clearTimeout(timer)
  }, [jobDescription])

  const analyzeDescription = () => {
    if (!jobDescription) {
      toast({
        title: "Empty Description",
        description: "Please paste a job description to analyze",
        variant: "destructive",
      })
      return
    }

    setIsAnalyzing(true)
    try {
      // Use the existing job analyzer function
      const results = analyzeJobDescription(jobDescription)
      setAnalyzedResults(results)
    } catch (error) {
      console.error("Error analyzing job description:", error)
      toast({
        title: "Analysis Error",
        description: "An error occurred while analyzing the job description",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleCopySkills = (category: "technicalSkills" | "softSkills" | "requirements") => {
    const skills = analyzedResults[category]
    if (skills.length === 0) return

    navigator.clipboard.writeText(skills.join(", "))
    
    setCopied({ ...copied, [category]: true })
    toast({
      title: "Copied to Clipboard",
      description: `${skills.length} ${category === "technicalSkills" ? "technical skills" : category === "softSkills" ? "soft skills" : "requirements"} copied to clipboard`,
    })
    
    setTimeout(() => {
      setCopied({ ...copied, [category]: false })
    }, 2000)
  }

  const clearAnalysis = () => {
    setJobDescription("")
    setAnalyzedResults({
      technicalSkills: [],
      softSkills: [],
      requirements: [],
    })
    setSelectedSkills({
      technicalSkills: [],
      softSkills: [],
      requirements: [],
    })
  }

  // Filter skills based on search query
  const filterSkills = (skills: string[]) => {
    if (!searchQuery) return skills
    return skills.filter(skill => 
      skill.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  const toggleSkillSelection = (skill: string, category: "technicalSkills" | "softSkills" | "requirements") => {
    setSelectedSkills(prev => {
      const isSelected = prev[category].includes(skill)
      const updatedSkills = isSelected
        ? prev[category].filter(s => s !== skill)
        : [...prev[category], skill]
      
      return {
        ...prev,
        [category]: updatedSkills
      }
    })
  }

  const handleAddToJob = () => {
    if (onSkillsSelected) {
      onSkillsSelected(
        selectedSkills.technicalSkills,
        selectedSkills.softSkills,
        selectedSkills.requirements
      )
      
      toast({
        title: "Skills Added",
        description: "Selected skills have been added to the job",
      })
    }
  }

  const totalSkillsFound = 
    analyzedResults.technicalSkills.length + 
    analyzedResults.softSkills.length + 
    analyzedResults.requirements.length

  const totalSelectedSkills =
    selectedSkills.technicalSkills.length +
    selectedSkills.softSkills.length +
    selectedSkills.requirements.length

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle>Job Description</CardTitle>
          <CardDescription>
            Paste the complete job description text below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Paste job description here..."
            className="min-h-[300px] font-mono text-sm"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={clearAnalysis}>
            Clear
          </Button>
          <Button 
            onClick={analyzeDescription} 
            disabled={isAnalyzing || !jobDescription}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isAnalyzing ? "Analyzing..." : "Analyze Description"}
          </Button>
        </CardFooter>
      </Card>

      {/* Results Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Analysis Results</CardTitle>
            {totalSkillsFound > 0 && (
              <Badge variant="outline" className="ml-2">
                {totalSkillsFound} items found
              </Badge>
            )}
          </div>
          <CardDescription>
            Skills, soft skills, and requirements extracted from the job description
          </CardDescription>
          {totalSkillsFound > 0 && (
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search extracted skills..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}
        </CardHeader>
        <CardContent>
          {totalSkillsFound === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No skills detected yet</p>
              <p className="text-sm mt-1">
                Paste a job description and click "Analyze Description" to extract skills
              </p>
            </div>
          ) : (
            <Tabs defaultValue="technical" className="w-full">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="technical" className="flex items-center gap-1.5">
                  <Code className="h-3.5 w-3.5" />
                  <span>Technical ({analyzedResults.technicalSkills.length})</span>
                </TabsTrigger>
                <TabsTrigger value="soft" className="flex items-center gap-1.5">
                  <Heart className="h-3.5 w-3.5" />
                  <span>Soft Skills ({analyzedResults.softSkills.length})</span>
                </TabsTrigger>
                <TabsTrigger value="requirements" className="flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5" />
                  <span>Requirements ({analyzedResults.requirements.length})</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="technical" className="min-h-[200px]">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-medium flex items-center gap-1.5">
                    <Code className="h-4 w-4 text-blue-500" />
                    <span className="text-blue-500">Technical Skills</span>
                  </h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-xs"
                    onClick={() => handleCopySkills("technicalSkills")}
                    disabled={analyzedResults.technicalSkills.length === 0}
                  >
                    {copied.technicalSkills ? (
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                    ) : (
                      <Clipboard className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    {copied.technicalSkills ? "Copied" : "Copy All"}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {filterSkills(analyzedResults.technicalSkills).length > 0 ? (
                    filterSkills(analyzedResults.technicalSkills).map((skill, index) => (
                      <TagBadge
                        key={index}
                        tag={skill}
                        gradient="blue"
                        className={`cursor-pointer transition-all hover:scale-105 ${
                          selectedSkills.technicalSkills.includes(skill) ? "ring-1 ring-primary" : ""
                        }`}
                        onClick={() => toggleSkillSelection(skill, "technicalSkills")}
                        selected={selectedSkills.technicalSkills.includes(skill)}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground py-2">
                      {searchQuery ? "No matching technical skills found" : "No technical skills detected"}
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="soft" className="min-h-[200px]">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-medium flex items-center gap-1.5">
                    <Heart className="h-4 w-4 text-rose-500" />
                    <span className="text-rose-500">Soft Skills</span>
                  </h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-xs"
                    onClick={() => handleCopySkills("softSkills")}
                    disabled={analyzedResults.softSkills.length === 0}
                  >
                    {copied.softSkills ? (
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                    ) : (
                      <Clipboard className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    {copied.softSkills ? "Copied" : "Copy All"}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {filterSkills(analyzedResults.softSkills).length > 0 ? (
                    filterSkills(analyzedResults.softSkills).map((skill, index) => (
                      <TagBadge
                        key={index}
                        tag={skill}
                        gradient="rose"
                        className={`cursor-pointer transition-all hover:scale-105 ${
                          selectedSkills.softSkills.includes(skill) ? "ring-1 ring-primary" : ""
                        }`}
                        onClick={() => toggleSkillSelection(skill, "softSkills")}
                        selected={selectedSkills.softSkills.includes(skill)}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground py-2">
                      {searchQuery ? "No matching soft skills found" : "No soft skills detected"}
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="requirements" className="min-h-[200px]">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-medium flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-amber-500" />
                    <span className="text-amber-500">Requirements</span>
                  </h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-xs"
                    onClick={() => handleCopySkills("requirements")}
                    disabled={analyzedResults.requirements.length === 0}
                  >
                    {copied.requirements ? (
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                    ) : (
                      <Clipboard className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    {copied.requirements ? "Copied" : "Copy All"}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {filterSkills(analyzedResults.requirements).length > 0 ? (
                    filterSkills(analyzedResults.requirements).map((req, index) => (
                      <TagBadge
                        key={index}
                        tag={req}
                        gradient="amber"
                        className={`cursor-pointer transition-all hover:scale-105 ${
                          selectedSkills.requirements.includes(req) ? "ring-1 ring-primary" : ""
                        }`}
                        onClick={() => toggleSkillSelection(req, "requirements")}
                        selected={selectedSkills.requirements.includes(req)}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground py-2">
                      {searchQuery ? "No matching requirements found" : "No requirements detected"}
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
        {showAddToJobButton && totalSelectedSkills > 0 && (
          <CardFooter>
            <Button 
              onClick={handleAddToJob}
              className="w-full"
            >
              Add {totalSelectedSkills} Selected Items to Job
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
