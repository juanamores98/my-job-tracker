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
