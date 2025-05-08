"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, FileText, Plus, Trash2, Edit, FileUp, Eye, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ResumeData } from "@/lib/types"
import { getResumes, addResume, updateResume, deleteResume } from "@/lib/storage"
import { useToast } from "@/hooks/use-toast"
import { readFileAsText } from "@/lib/file-utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useLanguage } from "@/lib/i18n"

export default function ResumePage() {
  const { t } = useLanguage()
  const [resumes, setResumes] = useState<ResumeData[]>([])
  const [newResumeTitle, setNewResumeTitle] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [textContent, setTextContent] = useState<string | null>(null)
  const [previewType, setPreviewType] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropAreaRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Load resumes from localStorage
    const loadedResumes = getResumes()
    setResumes(loadedResumes.length > 0 ? loadedResumes : [])
  }, [])

  const handleAddResume = async () => {
    if (!newResumeTitle.trim() || !selectedFile) {
      toast({
        title: "Error",
        description: "Please enter a title and select a file",
        variant: "destructive",
      })
      return
    }

    const fileUrl = URL.createObjectURL(selectedFile)
    const fileExt = selectedFile.name.split(".").pop()?.toLowerCase() || ""

    // For text files, extract and store the content
    let content = ""
    if (fileExt === "txt") {
      try {
        content = await readFileAsText(selectedFile)
      } catch (error) {
        console.error("Error reading text file:", error)
      }
    }

    const newResume: ResumeData = {
      id: Date.now().toString(),
      title: newResumeTitle,
      lastUpdated: new Date().toISOString().split("T")[0],
      format: selectedFile.name.split(".").pop()?.toUpperCase() || "PDF",
      size: `${Math.round(selectedFile.size / 1024)} KB`,
      url: fileUrl,
      file: selectedFile,
      content: content || undefined,
    }

    const updatedResumes = addResume(newResume)
    setResumes(updatedResumes)
    setNewResumeTitle("")
    setSelectedFile(null)
    setAddDialogOpen(false)

    toast({
      title: "Resume Added",
      description: "Your resume has been added successfully",
    })
  }

  const handleRenameResume = () => {
    if (!selectedResumeId || !newResumeTitle.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title for your resume",
        variant: "destructive",
      })
      return
    }

    const existingResume = resumes.find((r) => r.id === selectedResumeId)
    if (!existingResume) return

    const updatedResume: ResumeData = {
      ...existingResume,
      title: newResumeTitle,
      lastUpdated: new Date().toISOString().split("T")[0],
    }

    const updatedResumes = updateResume(updatedResume)
    setResumes(updatedResumes)
    setSelectedResumeId(null)
    setNewResumeTitle("")
    setRenameDialogOpen(false)

    toast({
      title: "Resume Renamed",
      description: "Your resume has been renamed successfully",
    })
  }

  const handleDeleteResume = (id: string) => {
    if (confirm("Are you sure you want to delete this resume?")) {
      const updatedResumes = deleteResume(id)
      setResumes(updatedResumes)

      toast({
        title: "Resume Deleted",
        description: "Your resume has been deleted",
      })
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check if file is a supported type
    const fileExt = file.name.split(".").pop()?.toLowerCase()
    if (fileExt !== "pdf" && fileExt !== "docx" && fileExt !== "doc" && fileExt !== "txt") {
      toast({
        title: "Invalid File",
        description: "Please upload a PDF, Word document (DOC/DOCX), or text file (TXT)",
        variant: "destructive",
      })
      return
    }

    setSelectedFile(file)

    // Set the file name as the title if empty
    if (!newResumeTitle) {
      setNewResumeTitle(file.name.replace(/\.[^/.]+$/, ""))
    }

    // Automatically open the add dialog
    setAddDialogOpen(true)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (!file) return

    // Check if file is a supported type
    const fileExt = file.name.split(".").pop()?.toLowerCase()
    if (fileExt !== "pdf" && fileExt !== "docx" && fileExt !== "doc" && fileExt !== "txt") {
      toast({
        title: "Invalid File",
        description: "Please upload a PDF, Word document (DOC/DOCX), or text file (TXT)",
        variant: "destructive",
      })
      return
    }

    setSelectedFile(file)
    setNewResumeTitle(file.name.replace(/\.[^/.]+$/, ""))
    setAddDialogOpen(true)
  }

  const handleDownload = (resume: ResumeData) => {
    if (resume.url) {
      const a = document.createElement("a")
      a.href = resume.url
      a.download = `${resume.title}.${resume.format.toLowerCase()}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      toast({
        title: "Resume Downloaded",
        description: "Your resume has been downloaded",
      })
    } else {
      toast({
        title: "Error",
        description: "No file available to download",
        variant: "destructive",
      })
    }
  }

  const handlePreview = async (resume: ResumeData) => {
    if (!resume.url) {
      toast({
        title: "Error",
        description: "No preview available",
        variant: "destructive",
      })
      return
    }

    setPreviewUrl(resume.url)

    // Determine file type for appropriate preview handling
    const fileFormat = resume.format.toLowerCase()
    setPreviewType(fileFormat)

    // If it's a text file, try to use stored content or fetch it
    if (fileFormat === "txt") {
      if (resume.content) {
        // Use stored content if available
        setTextContent(resume.content)
      } else {
        try {
          const response = await fetch(resume.url)
          const text = await response.text()
          setTextContent(text)
        } catch (error) {
          console.error("Error fetching text content:", error)
          setTextContent("Error loading text content")
        }
      }
    } else {
      setTextContent(null)
    }

    setPreviewOpen(true)
  }

  const handleRenameClick = (resume: ResumeData) => {
    setSelectedResumeId(resume.id)
    setNewResumeTitle(resume.title)
    setRenameDialogOpen(true)
  }

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <main className="flex min-h-screen flex-col">
      <DashboardHeader />
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Resume Manager</h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={handleUploadClick}>
                  <Plus className="mr-2 h-4 w-4" /> Add Resume
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("uploadNewResume")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div
          ref={dropAreaRef}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging ? "border-primary bg-primary/5" : "border-gray-200 dark:border-gray-800"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <FileUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Drag & Drop Resume</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Drop your PDF, Word document (DOC/DOCX), or text file (TXT) here, or click to browse
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button onClick={handleUploadClick}>Browse Files</Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {resumes.map((resume) => (
            <Card key={resume.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="line-clamp-1">{resume.title}</CardTitle>
                <CardDescription>Last updated: {resume.lastUpdated}</CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="aspect-[3/4] bg-slate-100 dark:bg-slate-800 rounded-md flex items-center justify-center mb-2 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  onClick={() => handlePreview(resume)}
                >
                  {resume.format === "PDF" ? (
                    <FileText className="h-16 w-16 text-red-400" />
                  ) : resume.format === "TXT" ? (
                    <FileText className="h-16 w-16 text-green-400" />
                  ) : (
                    <FileText className="h-16 w-16 text-blue-400" />
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Format: {resume.format}</p>
                  <p>Size: {resume.size}</p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => handleDownload(resume)}>
                        <Download className="mr-2 h-4 w-4" /> Download
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t("downloadResume")}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <div className="flex gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => handlePreview(resume)}>
                          <Eye className="mr-2 h-4 w-4" /> View
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t("previewResume")}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => handleRenameClick(resume)}>
                          <Edit className="mr-2 h-4 w-4" /> Rename
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t("renameResume")}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteResume(resume.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t("deleteResume")}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Add Resume Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Resume</DialogTitle>
              <DialogDescription>Upload a PDF, Word document (DOC/DOCX), or text file (TXT)</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Resume Title</Label>
                <Input
                  id="title"
                  value={newResumeTitle}
                  onChange={(e) => setNewResumeTitle(e.target.value)}
                  placeholder="e.g. Software Developer Resume"
                />
              </div>

              <div className="space-y-2">
                <Label>Selected File</Label>
                {selectedFile ? (
                  <div className="flex items-center p-3 border rounded-md">
                    <FileText className="h-5 w-5 mr-2 text-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">{Math.round(selectedFile.size / 1024)} KB</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-2"
                      onClick={() => {
                        setSelectedFile(null)
                        if (fileInputRef.current) fileInputRef.current.value = ""
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground p-3 border rounded-md">No file selected</div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddResume} disabled={!selectedFile}>
                Save Resume
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Rename Resume Dialog */}
        <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Rename Resume</DialogTitle>
              <DialogDescription>Enter a new name for your resume</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="rename-title">Resume Title</Label>
                <Input id="rename-title" value={newResumeTitle} onChange={(e) => setNewResumeTitle(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleRenameResume}>Rename Resume</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Resume Preview</DialogTitle>
            </DialogHeader>
            <div className="h-[70vh] w-full">
              {previewUrl && (
                <>
                  {textContent !== null ? (
                    // Text file preview
                    <div className="w-full h-full border rounded-md overflow-auto bg-white dark:bg-gray-900 p-4">
                      <pre className="whitespace-pre-wrap font-mono text-sm">{textContent}</pre>
                    </div>
                  ) : previewType === "pdf" ? (
                    // PDF preview with iframe for better compatibility
                    <iframe
                      src={previewUrl}
                      className="w-full h-full border rounded-md"
                      title="PDF Preview"
                      sandbox="allow-same-origin allow-scripts"
                    />
                  ) : (
                    // Word document or other file types
                    <div className="flex flex-col items-center justify-center h-full bg-slate-100 dark:bg-slate-800 rounded-md p-4">
                      <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                      <p className="text-center mb-4">This file type cannot be previewed directly in the browser.</p>
                      <div className="flex gap-2">
                        <Button onClick={() => window.open(previewUrl, "_blank")}>Open in New Tab</Button>
                        <Button
                          variant="outline"
                          onClick={() =>
                            handleDownload({
                              id: "",
                              title: "",
                              lastUpdated: "",
                              format: "",
                              size: "",
                              url: previewUrl,
                            })
                          }
                        >
                          Download File
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => setPreviewOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  )
}
