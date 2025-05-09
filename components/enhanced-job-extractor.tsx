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
  DialogTrigger,
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
import { Loader2, Link, CheckCircle, AlertCircle, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { JobData, ExtractionProgress, ExtractionResult } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import { analyzeJobDescription } from "@/lib/utils"

interface EnhancedJobExtractorProps {
  onExtracted: (jobData: Partial<JobData>) => void
  initialUrl?: string
  buttonLabel?: string
  buttonVariant?: "default" | "outline" | "secondary" | "ghost" | "link"
  buttonSize?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function EnhancedJobExtractor({
  onExtracted,
  initialUrl = "",
  buttonLabel = "Extract Job Details",
  buttonVariant = "default",
  buttonSize = "default",
  className,
}: EnhancedJobExtractorProps) {
  const [url, setUrl] = useState(initialUrl)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [extraction, setExtraction] = useState<ExtractionProgress>({
    status: "idle",
    progress: 0,
  })
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const { toast } = useToast()
  const [isScrapingUrl, setIsScrapingUrl] = useState(false)
  const [jobData, setJobData] = useState<Partial<JobData>>({})
  const [activeTab, setActiveTab] = useState("url")

  // Reset extraction state when dialog opens/closes
  useEffect(() => {
    if (!isDialogOpen) {
      // Small delay to allow animations to complete before resetting
      const timer = setTimeout(() => {
        setExtraction({
          status: "idle",
          progress: 0,
        })
        setExtractionResult(null)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isDialogOpen])

  // Update URL when initialUrl changes
  useEffect(() => {
    setUrl(initialUrl)
  }, [initialUrl])

  // Function to extract job details from URL and description
  const extractJobDetails = async (url: string, description: string) => {
    const extractedData: Partial<JobData> = {
      url: url,
      description: description || "",
      company: "",
      position: "",
      location: "",
      salary: "",
      workMode: "remote",
      tags: [],
    }

    // Extract company name from URL
    if (url) {
      try {
        const urlObj = new URL(url)
        const hostname = urlObj.hostname.replace(/^www\./, "")

        // Extract domain name without TLD
        const domainParts = hostname.split(".")
        if (domainParts.length >= 2) {
          extractedData.company = domainParts[domainParts.length - 2]
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")
        }
      } catch (error) {
        console.error("Error extracting company from URL:", error)
      }
    }

    // Extract job details from description
    if (description) {
      // Extract position
      const titlePatterns = [/job title:\s*([^\n\r.]+)/i, /position:\s*([^\n\r.]+)/i, /role:\s*([^\n\r.]+)/i]

      for (const pattern of titlePatterns) {
        const match = description.match(pattern)
        if (match && match[1]) {
          extractedData.position = match[1].trim()
          break
        }
      }

      // If no position found, try common job title patterns
      if (!extractedData.position) {
        const titleRegex =
          /\b(senior|junior|lead|principal|staff)?\s*(software|frontend|backend|fullstack|full stack|web|mobile|cloud|devops|ui\/ux|data|machine learning|ml|ai|product|project|program|technical|solutions|systems|network|security|qa|test|database|infrastructure)\s*(engineer|developer|architect|designer|manager|analyst|specialist|administrator|consultant|lead)\b/i
        const match = description.match(titleRegex)
        if (match) {
          extractedData.position = match[0].trim()
        }
      }

      // Extract location
      const locationPatterns = [
        /location:\s*([^,\r\n.]+(?:,\s*[A-Z][a-z]+)?)/i,
        /position location:\s*([^,\r\n.]+(?:,\s*[A-Z][a-z]+)?)/i,
        /job location:\s*([^,\r\n.]+(?:,\s*[A-Z][a-z]+)?)/i,
      ]

      for (const pattern of locationPatterns) {
        const match = description.match(pattern)
        if (match && match[1]) {
          extractedData.location = match[1].trim()
          break
        }
      }

      // If no location found, try city/state patterns
      if (!extractedData.location) {
        const cityStateRegex = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),\s*([A-Z]{2})/g
        const cityStateMatches = [...description.matchAll(cityStateRegex)]

        if (cityStateMatches.length > 0) {
          extractedData.location = `${cityStateMatches[0][1]}, ${cityStateMatches[0][2]}`.trim()
        }
      }

      // Extract salary
      const salaryPatterns = [
        /salary(?:\s+range)?:\s*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(?:-|to|–)\s*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/i,
        /compensation(?:\s+range)?:\s*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(?:-|to|–)\s*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/i,
        /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(?:-|to|–)\s*\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/i,
      ]

      for (const pattern of salaryPatterns) {
        const match = description.match(pattern)
        if (match && match[1] && match[2]) {
          extractedData.salary = `$${match[1]} - $${match[2]}`
          break
        }
      }

      // Extract work mode
      const lowerDesc = description.toLowerCase()

      if (
        lowerDesc.includes("fully remote") ||
        lowerDesc.includes("100% remote") ||
        lowerDesc.includes("work from home") ||
        lowerDesc.includes("work from anywhere")
      ) {
        extractedData.workMode = "remote"
      } else if (
        lowerDesc.includes("hybrid") ||
        lowerDesc.includes("partly remote") ||
        lowerDesc.includes("partially remote")
      ) {
        extractedData.workMode = "hybrid"
      } else if (
        lowerDesc.includes("onsite only") ||
        lowerDesc.includes("in office") ||
        lowerDesc.includes("in-person") ||
        lowerDesc.includes("on-site required")
      ) {
        extractedData.workMode = "onsite"
      } else {
        extractedData.workMode = "flexible"
      }

      // Extract skills and requirements
      const analyzed = analyzeJobDescription(description)
      extractedData.tags = [...analyzed.technicalSkills, ...analyzed.softSkills, ...analyzed.requirements]
    }

    return extractedData
  }

  const handleExtract = async () => {
    if (!url) {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive",
      })
      return
    }

    // Start extraction process
    setExtraction({
      status: "extracting",
      progress: 10,
      message: "Initializing extraction...",
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
          let message = "Extracting job details..."

          if (newProgress > 75) {
            message = "Analyzing extracted content..."
          } else if (newProgress > 50) {
            message = "Extracting skills and requirements..."
          } else if (newProgress > 25) {
            message = "Parsing job description..."
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
          message: "Extraction failed",
          error: data.error,
        })
        return
      }

      // Process the extracted data
      const extractedData: Partial<JobData> = {
        description: data.description || "",
        url: url,
      }

      // Try to extract company name from URL
      try {
        const urlObj = new URL(url)
        const hostname = urlObj.hostname.replace("www.", "")
        const domainParts = hostname.split(".")
        if (domainParts.length >= 2) {
          extractedData.company = domainParts[0].charAt(0).toUpperCase() + domainParts[0].slice(1)
        }
      } catch (e) {
        // Ignore URL parsing errors
      }

      // Try to extract job title from description
      if (data.description) {
        // Look for common job title patterns
        const titleRegex =
          /\b(senior|junior|lead|principal|staff)?\s*(software|frontend|backend|fullstack|full stack|web|mobile|cloud|devops|ui\/ux|data|machine learning|ml|ai|product|project|program|technical|solutions|systems|network|security|qa|test|database|infrastructure)\s*(engineer|developer|architect|designer|manager|analyst|specialist|administrator|consultant|lead)\b/i
        const match = data.description.match(titleRegex)
        if (match) {
          extractedData.position = match[0].trim()
        }
      }

      // Extract skills and requirements
      const extractedFields = ["description"]
      const missingFields = ["position", "company", "location", "salary"]

      if (extractedData.company) {
        extractedFields.push("company")
        missingFields.splice(missingFields.indexOf("company"), 1)
      }

      if (extractedData.position) {
        extractedFields.push("position")
        missingFields.splice(missingFields.indexOf("position"), 1)
      }

      // Set successful extraction
      setExtraction({
        status: "success",
        progress: 100,
        message: "Extraction completed successfully",
        extractedData,
      })

      // Set extraction result
      setExtractionResult({
        success: true,
        data: extractedData,
        extractedFields,
        missingFields,
      })
    } catch (error) {
      console.error("Error extracting job details:", error)
      setExtraction({
        status: "error",
        progress: 100,
        message: "Extraction failed",
        error: "An unexpected error occurred during extraction",
      })
    }
  }

  const handleConfirmUse = () => {
    if (extraction.extractedData) {
      onExtracted(extraction.extractedData)
      setIsDialogOpen(false)

      toast({
        title: "Job Details Extracted",
        description: "The job details have been successfully extracted and added to the form",
      })
    }
  }

  const handleOpenUrl = () => {
    if (url) {
      window.open(url, "_blank")
    }
  }

  const handleScrapeUrl = async () => {
    if (!url) return

    try {
      setIsScrapingUrl(true)
      setExtraction({
        status: "extracting",
        progress: 10,
        message: "Connecting to the website...",
      })

      // Simulate API call to backend scraper
      // In a real implementation, this would be a fetch to your backend
      // const response = await fetch('/api/job-scraper', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ url })
      // });
      
      // Simulate network latency and progressive updates
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setExtraction({
        status: "extracting",
        progress: 30,
        message: "Analyzing page content...",
      })
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setExtraction({
        status: "extracting",
        progress: 60,
        message: "Extracting job details...",
      })
      
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Detect job board from URL
      const jobBoardInfo = detectJobBoard(url);
      let extractedData: Partial<JobData> = {};
      
      if (jobBoardInfo.isKnown) {
        // Simulated extraction based on known job board patterns
        extractedData = extractFromKnownJobBoard(url, jobBoardInfo.name);
      } else {
        // Generic extraction simulation
        extractedData = {
          url: url,
          company: getCompanyFromUrl(url),
          position: simulatePositionExtraction(url),
          location: "San Francisco, CA", // Simulated
          salary: "$120,000 - $150,000",
          description: generateMockJobDescription(url),
          workMode: ["remote", "hybrid", "onsite"][Math.floor(Math.random() * 3)] as any,
        };
      }
      
      // Extract skills from description
      if (extractedData.description) {
        const analyzedData = analyzeJobDescription(extractedData.description);
        extractedData.tags = [
          ...analyzedData.technicalSkills?.slice(0, 5) || [],
          ...analyzedData.softSkills?.slice(0, 2) || [],
          ...analyzedData.requirements?.slice(0, 3) || []
        ];
      }
      
      setExtraction({
        status: "success",
        progress: 100,
        message: "Job details extracted successfully!",
        extractedData,
      })
      
      setJobData(extractedData)
      
      // Update extraction result
      const extractedFields = Object.keys(extractedData).filter(key => 
        extractedData[key as keyof typeof extractedData] !== undefined &&
        extractedData[key as keyof typeof extractedData] !== ""
      );
      
      const missingFields = [
        "company", 
        "position", 
        "location", 
        "salary", 
        "description", 
        "workMode", 
        "tags"
      ].filter(field => !extractedFields.includes(field));
      
      setExtractionResult({
        success: true,
        data: extractedData,
        extractedFields,
        missingFields,
      })
      
    } catch (error) {
      console.error("Error scraping URL:", error);
      
      setExtraction({
        status: "error",
        progress: 100,
        message: "Failed to extract job details",
        error: error instanceof Error ? error.message : "Unknown error occurred",
      })
      
      setExtractionResult({
        success: false,
        error: "Failed to extract job details from the provided URL",
        extractedFields: [],
        missingFields: ["company", "position", "location", "salary", "description", "workMode", "tags"],
      })
      
      toast({
        title: "Extraction Failed",
        description: "Could not extract job details from the URL. Please try again or enter details manually.",
        variant: "destructive",
      })
    } finally {
      setIsScrapingUrl(false)
    }
  }

  // Helper functions for job extraction simulation
  const detectJobBoard = (url: string) => {
    const lowerUrl = url.toLowerCase();
    
    if (lowerUrl.includes('linkedin.com/jobs')) {
      return { isKnown: true, name: 'linkedin' };
    } else if (lowerUrl.includes('indeed.com')) {
      return { isKnown: true, name: 'indeed' };
    } else if (lowerUrl.includes('glassdoor.com')) {
      return { isKnown: true, name: 'glassdoor' };
    } else if (lowerUrl.includes('monster.com')) {
      return { isKnown: true, name: 'monster' };
    } else if (lowerUrl.includes('simplyhired.com')) {
      return { isKnown: true, name: 'simplyhired' };
    } else if (lowerUrl.includes('ziprecruiter.com')) {
      return { isKnown: true, name: 'ziprecruiter' };
    } else if (lowerUrl.includes('dice.com')) {
      return { isKnown: true, name: 'dice' };
    } else {
      return { isKnown: false, name: 'unknown' };
    }
  };

  const getCompanyFromUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.replace(/^www\./, "");
      
      // Extract domain name without TLD
      const domainParts = hostname.split(".");
      if (domainParts.length >= 2) {
        return domainParts[domainParts.length - 2]
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
      }
      return "Company Name";
    } catch (error) {
      return "Company Name";
    }
  };

  const simulatePositionExtraction = (url: string): string => {
    const techPositions = [
      "Senior Software Engineer",
      "Front-end Developer",
      "Full Stack Engineer",
      "DevOps Engineer",
      "Product Manager",
      "UI/UX Designer",
      "Data Scientist",
      "Machine Learning Engineer",
      "React Developer",
      "Node.js Developer"
    ];
    
    // Extract position from URL if possible
    const urlLower = url.toLowerCase();
    for (const position of techPositions) {
      if (urlLower.includes(position.toLowerCase().replace(/\s+/g, "-")) || 
          urlLower.includes(position.toLowerCase().replace(/\s+/g, "+"))) {
        return position;
      }
    }
    
    // Otherwise return a random position
    return techPositions[Math.floor(Math.random() * techPositions.length)];
  };

  const generateMockJobDescription = (url: string): string => {
    const position = simulatePositionExtraction(url);
    const company = getCompanyFromUrl(url);
    
    return `
Job Title: ${position}
Company: ${company}
Location: San Francisco, CA
Salary Range: $120,000 - $150,000

About the Role:
We are seeking a talented ${position} to join our team at ${company}. This is a full-time position with competitive benefits and the opportunity to work on cutting-edge projects.

Requirements:
- 3+ years of experience in software development
- Proficiency in JavaScript, TypeScript, and React
- Experience with Node.js and Express
- Knowledge of database systems like MongoDB or PostgreSQL
- Strong problem-solving skills and attention to detail
- Excellent communication and teamwork abilities

Benefits:
- Competitive salary and equity options
- Comprehensive health, dental, and vision insurance
- Flexible work arrangements with remote options
- Professional development budget
- Generous PTO policy

We are an equal opportunity employer and value diversity at our company.
    `.trim();
  };

  const extractFromKnownJobBoard = (url: string, jobBoard: string): Partial<JobData> => {
    // In a real implementation, this would use specific selectors for each job board
    // Here we're just simulating different data based on the job board
    
    const commonData = {
      url: url,
      company: getCompanyFromUrl(url),
      position: simulatePositionExtraction(url),
      description: generateMockJobDescription(url),
    };
    
    switch (jobBoard) {
      case 'linkedin':
        return {
          ...commonData,
          location: "New York, NY",
          salary: "$130,000 - $160,000",
          workMode: "hybrid",
        };
      case 'indeed':
        return {
          ...commonData,
          location: "Remote",
          salary: "$110,000 - $140,000",
          workMode: "remote",
        };
      case 'glassdoor':
        return {
          ...commonData,
          location: "Seattle, WA",
          salary: "$125,000 - $155,000",
          workMode: "onsite",
        };
      default:
        return {
          ...commonData,
          location: "San Francisco, CA",
          salary: "$120,000 - $150,000",
          workMode: "remote",
        };
    }
  };

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant={buttonVariant} size={buttonSize} className={className}>
            <Link className="mr-2 h-4 w-4" />
            {buttonLabel}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Extract Job Details</DialogTitle>
            <DialogDescription>Enter the URL of a job posting to automatically extract details.</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="url">Job Posting URL</Label>
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
              <p className="text-xs text-muted-foreground">
                Works best with LinkedIn, Indeed, Glassdoor, and company career pages.
              </p>
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
                      <Label>Extraction Progress</Label>
                      <span className="text-sm text-muted-foreground">{Math.round(extraction.progress)}%</span>
                    </div>
                    <Progress value={extraction.progress} className="h-2" />
                    <p className="text-sm text-muted-foreground">{extraction.message}</p>
                  </div>

                  {extraction.status === "error" && (
                    <div className="p-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-medium">Extraction Failed</p>
                        <p className="text-sm">{extraction.error || "An unknown error occurred during extraction."}</p>
                        <p className="text-sm mt-2">Try a different URL or manually enter the job details.</p>
                      </div>
                    </div>
                  )}

                  {extraction.status === "success" && extractionResult && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-md bg-green-50 border border-green-200 text-green-800 dark:bg-green-950/30 dark:border-green-900 dark:text-green-300 flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="font-medium">Extraction Successful</p>
                          <p className="text-sm">
                            Successfully extracted {extractionResult.extractedFields.length} fields from the job
                            posting.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Extracted Fields</Label>
                        <div className="flex flex-wrap gap-2">
                          {extractionResult.extractedFields.map((field) => (
                            <Badge key={field} variant="secondary" className="capitalize">
                              {field}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {extractionResult.missingFields.length > 0 && (
                        <div className="space-y-2">
                          <Label>Missing Fields</Label>
                          <div className="flex flex-wrap gap-2">
                            {extractionResult.missingFields.map((field) => (
                              <Badge key={field} variant="outline" className="capitalize text-muted-foreground">
                                {field}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            You'll need to manually fill in these fields after extraction.
                          </p>
                        </div>
                      )}

                      {extraction.extractedData?.description && (
                        <div className="space-y-2">
                          <Label>Preview</Label>
                          <div className="max-h-[200px] overflow-y-auto p-3 text-sm border rounded-md bg-muted/50">
                            {extraction.extractedData.description.substring(0, 300)}
                            {extraction.extractedData.description.length > 300 && "..."}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>

            {extraction.status === "idle" || extraction.status === "error" ? (
              <Button onClick={handleExtract} disabled={!url || extraction.status === "extracting"}>
                {extraction.status === "extracting" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  "Extract Details"
                )}
              </Button>
            ) : extraction.status === "success" ? (
              <Button onClick={() => setShowConfirmDialog(true)}>Use Extracted Data</Button>
            ) : (
              <Button disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Extracting...
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Use Extracted Data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will populate the job form with the extracted data. You can still edit any fields afterward.
              {extractionResult?.missingFields.length ? (
                <span className="block mt-2">
                  Note: You'll need to manually fill in {extractionResult.missingFields.join(", ")}.
                </span>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmUse}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
