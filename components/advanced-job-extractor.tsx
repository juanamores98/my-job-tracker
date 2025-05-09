"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Progress } from "@/components/ui/progress"
import { Loader2, CheckCircle, AlertCircle, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { JobData, ExtractionProgress, ExtractionResult } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import { analyzeJobDescription } from "@/lib/job-analyzer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { EnhancedTagInput } from "./enhanced-tag-input"
import { useLanguage } from "@/lib/i18n"

interface AdvancedJobExtractorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onExtracted: (jobData: Partial<JobData>) => void
  initialUrl?: string
}

export function AdvancedJobExtractor({ open, onOpenChange, onExtracted, initialUrl = "" }: AdvancedJobExtractorProps) {
  const [url, setUrl] = useState(initialUrl)
  const [activeTab, setActiveTab] = useState("extract")
  const [extraction, setExtraction] = useState<ExtractionProgress>({
    status: "idle",
    progress: 0,
  })
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [extractedKeywords, setExtractedKeywords] = useState<{
    technicalSkills: string[]
    softSkills: string[]
    requirements: string[]
  }>({
    technicalSkills: [],
    softSkills: [],
    requirements: [],
  })
  const [jobData, setJobData] = useState<Partial<JobData>>({
    url: "",
    company: "",
    position: "",
    location: "",
    description: "",
    tags: [],
    workMode: "remote",
  })
  const { toast } = useToast()
  const { t } = useLanguage()

  // Reset extraction state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setUrl(initialUrl)
      setJobData({
        url: initialUrl,
        company: "",
        position: "",
        location: "",
        description: "",
        tags: [],
        workMode: "remote",
      })
    } else {
      // Small delay to allow animations to complete before resetting
      const timer = setTimeout(() => {
        setExtraction({
          status: "idle",
          progress: 0,
        })
        setExtractionResult(null)
        setActiveTab("extract")
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [open, initialUrl])

  // Update URL when initialUrl changes
  useEffect(() => {
    setUrl(initialUrl)
  }, [initialUrl])

  // Function to detect job portal from URL
  const detectJobPortal = (url: string): string => {
    if (!url) return "unknown"

    const lowerUrl = url.toLowerCase()

    if (lowerUrl.includes("linkedin.com")) return "LinkedIn"
    if (lowerUrl.includes("indeed.com")) return "Indeed"
    if (lowerUrl.includes("glassdoor.com")) return "Glassdoor"
    if (lowerUrl.includes("monster.com")) return "Monster"
    if (lowerUrl.includes("ziprecruiter.com")) return "ZipRecruiter"
    if (lowerUrl.includes("dice.com")) return "Dice"
    if (lowerUrl.includes("careerbuilder.com")) return "CareerBuilder"
    if (lowerUrl.includes("simplyhired.com")) return "SimplyHired"
    if (lowerUrl.includes("remote.co")) return "Remote.co"
    if (lowerUrl.includes("weworkremotely.com")) return "WeWorkRemotely"
    if (lowerUrl.includes("remoteok.com")) return "RemoteOK"
    if (lowerUrl.includes("stackoverflow.com")) return "StackOverflow Jobs"
    if (lowerUrl.includes("github.com/jobs")) return "GitHub Jobs"
    if (lowerUrl.includes("angel.co")) return "AngelList"
    if (lowerUrl.includes("wellfound.com")) return "Wellfound"
    if (lowerUrl.includes("lever.co")) return "Lever"
    if (lowerUrl.includes("greenhouse.io")) return "Greenhouse"
    if (lowerUrl.includes("workday.com")) return "Workday"
    if (lowerUrl.includes("smartrecruiters.com")) return "SmartRecruiters"

    return "Company Website"
  }

  // Function to extract potential company name from URL
  const extractCompanyFromUrl = (url: string): string => {
    if (!url) return ""

    try {
      const urlObj = new URL(url)
      const hostname = urlObj.hostname.replace(/^www\./, "")

      // Special cases for job portals
      const portal = detectJobPortal(url)
      if (portal !== "Company Website") {
        // Try to extract from URL path for job boards
        const pathParts = urlObj.pathname.split("/").filter(Boolean)
        if (pathParts.length >= 2) {
          // Many job boards use /company/position pattern
          const possibleCompany = pathParts[pathParts.length - 2]
          if (possibleCompany && possibleCompany.length > 2 && !possibleCompany.includes("jobs")) {
            return possibleCompany
              .split("-")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ")
          }
        }
        return ""
      }

      // Extract domain name without TLD
      const domainParts = hostname.split(".")
      if (domainParts.length >= 2) {
        return domainParts[domainParts.length - 2]
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")
      }

      return ""
    } catch (error) {
      console.error("Error extracting company from URL:", error)
      return ""
    }
  }

  // Function to extract work mode from job description
  const extractWorkMode = (description: string): "remote" | "onsite" | "hybrid" | "flexible" => {
    const lowerDesc = description.toLowerCase()

    const remoteKeywords = ["fully remote", "100% remote", "work from home", "work from anywhere"]
    const onsiteKeywords = ["onsite only", "in office", "in-person", "on-site required"]
    const hybridKeywords = ["hybrid", "partly remote", "partially remote", "flexible location"]

    if (remoteKeywords.some((keyword) => lowerDesc.includes(keyword))) {
      return "remote"
    } else if (hybridKeywords.some((keyword) => lowerDesc.includes(keyword))) {
      return "hybrid"
    } else if (onsiteKeywords.some((keyword) => lowerDesc.includes(keyword))) {
      return "onsite"
    }

    // Default to flexible if no clear indication
    return "flexible"
  }

  // Function to extract location from job description
  const extractLocation = (description: string): string => {
    if (!description) return ""

    // Look for common location patterns
    const locationPatterns = [
      /location:\s*([^,\r\n.]+(?:,\s*[A-Z][a-z]+)?)/i,
      /position location:\s*([^,\r\n.]+(?:,\s*[A-Z][a-z]+)?)/i,
      /job location:\s*([^,\r\n.]+(?:,\s*[A-Z][a-z]+)?)/i,
      /based in:\s*([^,\r\n.]+(?:,\s*[A-Z][a-z]+)?)/i,
      /located in:\s*([^,\r\n.]+(?:,\s*[A-Z][a-z]+)?)/i,
    ]

    for (const pattern of locationPatterns) {
      const match = description.match(pattern)
      if (match && match[1]) {
        return match[1].trim()
      }
    }

    // Try to find cities/locations mentioned with some context
    const cityContextRegex = /(?:in|at|near|from)\s+([A-Z][a-z]+(?:(?:,|\s+)\s*[A-Z][a-z]+){0,2})/g
    const cityMatches = [...description.matchAll(cityContextRegex)]

    if (cityMatches.length > 0) {
      return cityMatches[0][1].trim()
    }

    // Look for common city/state patterns
    const cityStateRegex = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),\s*([A-Z]{2})/g
    const cityStateMatches = [...description.matchAll(cityStateRegex)]

    if (cityStateMatches.length > 0) {
      return `${cityStateMatches[0][1]}, ${cityStateMatches[0][2]}`.trim()
    }

    return ""
  }

  // Add a new function to extract job position from description
  const extractPosition = (description: string): string => {
    if (!description) return ""

    // Look for job title patterns
    const titlePatterns = [
      /job title:\s*([^\n\r.]+)/i,
      /position:\s*([^\n\r.]+)/i,
      /role:\s*([^\n\r.]+)/i,
      /job role:\s*([^\n\r.]+)/i,
      /job position:\s*([^\n\r.]+)/i,
    ]

    for (const pattern of titlePatterns) {
      const match = description.match(pattern)
      if (match && match[1]) {
        return match[1].trim()
      }
    }

    // Look for common job title patterns at the beginning of the description
    const firstLineRegex = /^([A-Z][a-z]*(?:\s+[A-Za-z]+){1,5})/m
    const firstLineMatch = description.match(firstLineRegex)
    if (firstLineMatch && firstLineMatch[1] && firstLineMatch[1].length < 50) {
      return firstLineMatch[1].trim()
    }

    // Look for common job title patterns
    const titleRegex =
      /\b(senior|junior|lead|principal|staff)?\s*(software|frontend|backend|fullstack|full stack|web|mobile|cloud|devops|ui\/ux|data|machine learning|ml|ai|product|project|program|technical|solutions|systems|network|security|qa|test|database|infrastructure)\s*(engineer|developer|architect|designer|manager|analyst|specialist|administrator|consultant|lead)\b/i
    const match = description.match(titleRegex)
    if (match) {
      return match[0].trim()
    }

    return ""
  }

  // Function to extract salary range from description
  const extractSalary = (description: string): string => {
    if (!description) return ""

    // Look for salary range patterns
    const salaryPatterns = [
      /salary(?:\s+range)?:\s*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(?:-|to|–)\s*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/i,
      /compensation(?:\s+range)?:\s*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(?:-|to|–)\s*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/i,
      /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(?:-|to|–)\s*\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/i,
      /(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(?:-|to|–)\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(?:USD|EUR|GBP|\$|€|£)/i,
    ]

    for (const pattern of salaryPatterns) {
      const match = description.match(pattern)
      if (match && match[1] && match[2]) {
        return `$${match[1]} - $${match[2]}`
      }
    }

    // Try to find just a single salary figure
    const singleSalaryPatterns = [
      /salary:\s*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(?:per year|yearly|annual|annually)/i,
      /compensation:\s*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(?:per year|yearly|annual|annually)/i,
      /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(?:per year|yearly|annual|annually)/i,
    ]

    for (const pattern of singleSalaryPatterns) {
      const match = description.match(pattern)
      if (match && match[1]) {
        return `$${match[1]}`
      }
    }

    return ""
  }

  const handleExtract = async () => {
    if (!url) {
      toast({
        title: t("error"),
        description: t("pleaseEnterValidUrl"),
        variant: "destructive",
      })
      return
    }

    // Start extraction process
    setExtraction({
      status: "extracting",
      progress: 10,
      message: t("initializingExtraction"),
    })

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setExtraction((prev) => {
          if (prev.status !== "extracting") {
            clearInterval(progressInterval)
            return prev
          }

          const newProgress = Math.min(prev.progress + Math.random() * 15, 90)
          let message = t("extractingJobDetails")

          if (newProgress > 75) {
            message = t("analyzingExtractedContent")
          } else if (newProgress > 50) {
            message = t("extractingSkillsAndRequirements")
          } else if (newProgress > 25) {
            message = t("parsingJobDescription")
          }

          return {
            ...prev,
            progress: newProgress,
            message,
          }
        })
      }, 800)

      // Make the actual API call
      const response = await fetch("/api/job-scraper", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      })

      const data = await response.json()

      // Clear the progress interval
      clearInterval(progressInterval)

      if (data.error) {
        setExtraction({
          status: "error",
          progress: 100,
          message: t("extractionFailed"),
          error: data.error,
        })
        return
      }

      // Process the extracted data
      const extractedData: Partial<JobData> = {
        description: data.description || "",
        url: url,
        company: "",
        position: "",
        location: "",
        salary: "",
        workMode: "remote",
      }

      // Extract company name from URL
      extractedData.company = extractCompanyFromUrl(url)

      // Extract job details from description
      if (data.description) {
        // Extract position
        extractedData.position = extractPosition(data.description)

        // Extract location
        extractedData.location = extractLocation(data.description)

        // Extract salary
        extractedData.salary = extractSalary(data.description)

        // Extract work mode
        extractedData.workMode = extractWorkMode(data.description)

        // Extract skills and requirements
        const analyzed = analyzeJobDescription(data.description)
        setExtractedKeywords(analyzed)

        // Add extracted tags to the job data
        extractedData.tags = [...analyzed.technicalSkills, ...analyzed.softSkills, ...analyzed.requirements]
      }

      // Update the job data state
      setJobData({
        ...extractedData,
        tags: extractedData.tags || [],
      })

      // Build lists of extracted and missing fields
      const extractedFields: string[] = []
      const missingFields: string[] = []

      if (extractedData.description) extractedFields.push("description")
      else missingFields.push("description")

      if (extractedData.company) extractedFields.push("company")
      else missingFields.push("company")

      if (extractedData.position) extractedFields.push("position")
      else missingFields.push("position")

      if (extractedData.location) extractedFields.push("location")
      else missingFields.push("location")

      if (extractedData.salary) extractedFields.push("salary")
      else missingFields.push("salary")

      if (extractedData.workMode) extractedFields.push("workMode")
      else missingFields.push("workMode")

      if (extractedData.tags && extractedData.tags.length > 0) extractedFields.push("tags")
      else missingFields.push("tags")

      // Set successful extraction
      setExtraction({
        status: "success",
        progress: 100,
        message: t("extractionCompletedSuccessfully"),
        extractedData,
      })

      // Set extraction result
      setExtractionResult({
        success: true,
        data: extractedData,
        extractedFields,
        missingFields,
      })

      // Switch to the results tab
      setActiveTab("results")
    } catch (error) {
      console.error("Error extracting job details:", error)
      setExtraction({
        status: "error",
        progress: 100,
        message: t("extractionFailed"),
        error: t("unexpectedErrorDuringExtraction"),
      })
    }
  }

  const handleJobDataChange = (field: keyof JobData, value: any) => {
    setJobData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleConfirmUse = () => {
    onExtracted(jobData)
    onOpenChange(false)

    toast({
      title: t("jobDetailsExtracted"),
      description: t("jobDetailsSuccessfullyExtractedAndAdded"),
    })
  }

  const handleOpenUrl = () => {
    if (url) {
      window.open(url, "_blank")
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{t("extractJobDetails")}</DialogTitle>
            <DialogDescription>{t("enterJobPostingUrl")}</DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="extract">{t("extractJob")}</TabsTrigger>
              <TabsTrigger value="results" disabled={extraction.status !== "success"}>
                {t("results")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="extract" className="flex-1 overflow-auto">
              <div className="space-y-6 py-4">
                <div className="space-y-2">
                  <Label htmlFor="url">{t("jobPostingUrl")}</Label>
                  <div className="flex gap-2">
                    <Input
                      id="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://example.com/jobs/frontend-developer"
                      className="flex-1"
                    />
                    <Button variant="outline" size="icon" onClick={handleOpenUrl} disabled={!url}>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">{t("worksWithMajorJobSites")}</p>
                </div>

                {/* Extraction Progress */}
                <AnimatePresence mode="wait">
                  {extraction.status !== "idle" && (
                    <motion.div
                      className="space-y-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label>{t("extractionProgress")}</Label>
                          <span className="text-sm text-muted-foreground">{Math.round(extraction.progress)}%</span>
                        </div>
                        <Progress value={extraction.progress} className="h-2" />
                        <p className="text-sm text-muted-foreground">{extraction.message}</p>
                      </div>

                      {extraction.status === "error" && (
                        <div className="p-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <p className="font-medium">{t("extractionFailed")}</p>
                            <p className="text-sm">{extraction.error || t("unknownErrorDuringExtraction")}</p>
                            <p className="text-sm mt-2">{t("tryDifferentUrlOrManualEntry")}</p>
                          </div>
                        </div>
                      )}

                      {extraction.status === "success" && extractionResult && (
                        <div className="space-y-4">
                          <div className="p-4 rounded-md bg-green-50 border border-green-200 text-green-800 dark:bg-green-950/30 dark:border-green-900 dark:text-green-300 flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <p className="font-medium">{t("extractionSuccessful")}</p>
                              <p className="text-sm">
                                {t("successfullyExtractedFields", { count: extractionResult.extractedFields.length })}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </TabsContent>

            <TabsContent value="results" className="flex-1 overflow-hidden flex flex-col">
              <ScrollArea className="flex-1">
                <div className="space-y-6 py-4">
                  <div className="space-y-2">
                    <Label>{t("extractedFields")}</Label>
                    <div className="flex flex-wrap gap-2">
                      {extractionResult?.extractedFields.map((field) => (
                        <Badge key={field} variant="secondary" className="capitalize">
                          {field}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {extractionResult?.missingFields.length ? (
                    <div className="space-y-2">
                      <Label>{t("missingFields")}</Label>
                      <div className="flex flex-wrap gap-2">
                        {extractionResult.missingFields.map((field) => (
                          <Badge key={field} variant="outline" className="capitalize text-muted-foreground">
                            {field}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">{t("manuallyFillMissingFields")}</p>
                    </div>
                  ) : null}

                  <div className="space-y-4 border p-4 rounded-md">
                    <div className="space-y-2">
                      <Label htmlFor="company">{t("company")}</Label>
                      <Input
                        id="company"
                        value={jobData.company || ""}
                        onChange={(e) => handleJobDataChange("company", e.target.value)}
                        placeholder={t("companyName")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="position">{t("position")}</Label>
                      <Input
                        id="position"
                        value={jobData.position || ""}
                        onChange={(e) => handleJobDataChange("position", e.target.value)}
                        placeholder={t("jobTitle")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">{t("location")}</Label>
                      <Input
                        id="location"
                        value={jobData.location || ""}
                        onChange={(e) => handleJobDataChange("location", e.target.value)}
                        placeholder={t("jobLocation")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="salary">{t("salary")}</Label>
                      <Input
                        id="salary"
                        value={jobData.salary || ""}
                        onChange={(e) => handleJobDataChange("salary", e.target.value)}
                        placeholder={t("salaryRange")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="workMode">{t("workMode")}</Label>
                      <select
                        id="workMode"
                        value={jobData.workMode || "remote"}
                        onChange={(e) => handleJobDataChange("workMode", e.target.value)}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="remote">{t("remote")}</option>
                        <option value="onsite">{t("onsite")}</option>
                        <option value="hybrid">{t("hybrid")}</option>
                        <option value="flexible">{t("flexible")}</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t("tags")}</Label>
                    <EnhancedTagInput
                      tags={jobData.tags || []}
                      onTagsChange={(tags) => handleJobDataChange("tags", tags)}
                      placeholder={t("addTag")}
                    />
                  </div>

                  {jobData.description && (
                    <div className="space-y-2">
                      <Label>{t("descriptionPreview")}</Label>
                      <div className="max-h-[200px] overflow-y-auto p-3 text-sm border rounded-md bg-muted/50">
                        {jobData.description.substring(0, 300)}
                        {jobData.description.length > 300 && "..."}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>

          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>

            {activeTab === "extract" ? (
              <Button onClick={handleExtract} disabled={!url || extraction.status === "extracting"}>
                {extraction.status === "extracting" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("extracting")}
                  </>
                ) : (
                  t("extractDetails")
                )}
              </Button>
            ) : (
              <Button onClick={() => setShowConfirmDialog(true)}>{t("useExtractedData")}</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("useExtractedData")}?</AlertDialogTitle>
            <AlertDialogDescription>
              {t("populateJobFormWithExtractedData")}
              {extractionResult?.missingFields.length ? (
                <span className="block mt-2">
                  {t("noteManualFillRequired", { fields: extractionResult.missingFields.join(", ") })}
                </span>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmUse}>{t("continue")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
