"use client"

import React, { useState, useEffect, useRef } from "react"
import type { ResumeData } from "@/lib/types"
import { getResumes, addResume, updateResume, deleteResume } from "@/lib/storage"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
// ScrollArea removed as it's no longer used
import {
  FileText,
  File,
  Upload,
  Download,
  Edit2,
  Trash2,
  Search,
  Grid,
  List,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/lib/i18n"

// Types
type ViewMode = "grid" | "list"
type SortOption = "date" | "name" | "size"
type SortDirection = "asc" | "desc"
type FileFormat = "all" | "pdf" | "doc-docx"

interface ViewState {
  mode: ViewMode
  sort: SortOption
  direction: SortDirection
  search: string
  filter: FileFormat
}

// Helper function to format file size
const formatFileSize = (bytes: number, decimals = 2) => {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
}

// Helper function to get file icon based on format
const getFileIcon = (format: string) => {
  if (format === "application/pdf") {
    return <FileText className="h-16 w-16 text-red-500" />
  } else if (format === "application/msword" ||
      format === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return <FileText className="h-16 w-16 text-blue-500" />
  }
  return <FileText className="h-16 w-16 text-gray-400" />
}

// Helper function to generate a thumbnail preview for PDF
const getThumbnailPreview = (resume: ResumeData) => {
  if (resume.format === "application/pdf" && resume.content) {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <iframe
          src={resume.content}
          className="absolute inset-0 w-full h-full opacity-90 pointer-events-none"
          title={`${resume.title} thumbnail`}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0f1219] opacity-60" />
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center py-12">
      {getFileIcon(resume.format)}
    </div>
  )
}

export default function ResumePage() {
  // State management
  const [resumes, setResumes] = useState<ResumeData[]>([])
  const [viewState, setViewState] = useState<ViewState>({
    mode: "grid",
    sort: "date",
    direction: "desc",
    search: "",
    filter: "all"
  })
  const [isUploading, setIsUploading] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [selectedResume, setSelectedResume] = useState<ResumeData | null>(null)
  const [editedResumeName, setEditedResumeName] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { t } = useLanguage()

  // Load resumes on component mount
  useEffect(() => {
    setResumes(getResumes())
  }, [])

  // Filter and sort resumes
  const filteredResumes = React.useMemo(() => {
    let result = [...resumes]

    // Apply search filter
    if (viewState.search) {
      const searchLower = viewState.search.toLowerCase()
      result = result.filter(resume =>
        resume.title.toLowerCase().includes(searchLower) ||
        resume.originalName.toLowerCase().includes(searchLower)
      )
    }

    // Apply type filter
    if (viewState.filter !== "all") {
      result = result.filter(resume => {
        if (viewState.filter === "pdf") {
          return resume.format === "application/pdf"
        } else if (viewState.filter === "doc-docx") {
          return resume.format === "application/msword" ||
                 resume.format === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        }
        return true
      })
    }

    // Apply sorting
    result.sort((a, b) => {
      const direction = viewState.direction === "asc" ? 1 : -1

      switch (viewState.sort) {
        case "name":
          return direction * a.title.localeCompare(b.title)
        case "size":
          return direction * (parseFloat(a.size) - parseFloat(b.size))
        case "date":
        default:
          return direction * (
            new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
          )
      }
    })

    return result
  }, [resumes, viewState])

  // Resume stats calculation
  const resumeStats = React.useMemo(() => {
    return {
      total: resumes.length,
      pdf: resumes.filter(r => r.format === "application/pdf").length,
      doc: resumes.filter(r =>
        r.format === "application/msword" ||
        r.format === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ).length
    }
  }, [resumes])

  // Handle file upload
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: t("fileTooLarge"),
        description: t("fileTooLargeDescription", { maxSize: "5MB" }),
        variant: "destructive",
      })
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }

    setIsUploading(true)
    try {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64Content = reader.result as string
        const newResume: ResumeData = {
          id: crypto.randomUUID(),
          originalName: file.name,
          title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension for title
          lastUpdated: new Date().toISOString(),
          format: file.type,
          size: formatFileSize(file.size),
          content: base64Content,
        }
        const updatedResumes = addResume(newResume)
        setResumes(updatedResumes)
        toast({
          title: t("resumeUploaded"),
          description: t("resumeUploadedSuccess", { name: newResume.title })
        })
        if (fileInputRef.current) fileInputRef.current.value = ""
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error("Error uploading resume:", error)
      toast({
        title: t("uploadError"),
        description: t("uploadErrorDescription"),
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
  }

  // Open edit modal
  const openEditModal = (resume: ResumeData) => {
    setSelectedResume(resume)
    setEditedResumeName(resume.title)
    setIsEditModalOpen(true)
  }

  // Handle resume edit
  const handleEditResume = () => {
    if (selectedResume && editedResumeName.trim()) {
      const updated: ResumeData = {
        ...selectedResume,
        title: editedResumeName.trim(),
        lastUpdated: new Date().toISOString()
      }
      const updatedResumes = updateResume(updated)
      setResumes(updatedResumes)
      toast({
        title: t("resumeRenamed"),
        description: t("resumeRenamedSuccess", {
          oldName: selectedResume.title,
          newName: updated.title
        })
      })
      setIsEditModalOpen(false)
      setSelectedResume(null)
    }
  }

  // Open delete modal
  const openDeleteModal = (resume: ResumeData) => {
    setSelectedResume(resume)
    setIsDeleteModalOpen(true)
  }

  // Handle resume deletion
  const handleDeleteResume = () => {
    if (selectedResume) {
      const updatedResumes = deleteResume(selectedResume.id)
      setResumes(updatedResumes)
      toast({
        title: t("resumeDeleted"),
        description: t("resumeDeletedSuccess", { name: selectedResume.title }),
        variant: "destructive"
      })
      setIsDeleteModalOpen(false)
      setSelectedResume(null)
    }
  }

  // Handle resume download
  const handleDownload = (resume: ResumeData) => {
    if (!resume.content) {
      toast({
        title: t("downloadError"),
        description: t("noContentToDownload"),
        variant: "destructive"
      })
      return
    }
    try {
      const byteString = atob(resume.content.split(',')[1])
      const mimeString = resume.content.split(',')[0].split(':')[1].split(';')[0]
      const ab = new ArrayBuffer(byteString.length)
      const ia = new Uint8Array(ab)
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i)
      }
      const blob = new Blob([ab], { type: mimeString })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = resume.originalName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)
      toast({
        title: t("downloadStarted"),
        description: t("downloadStartedSuccess", { name: resume.originalName })
      })
    } catch (error) {
      console.error("Error downloading resume:", error)
      toast({
        title: t("downloadError"),
        description: t("errorPreparingDownload"),
        variant: "destructive"
      })
    }
  }

  // Open preview modal
  const openPreviewModal = (resume: ResumeData) => {
    setSelectedResume(resume)
    setIsPreviewModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold mb-1">
              Resume <span className="text-blue-500">Library</span>
            </h1>
            <p className="text-gray-400 text-sm">
              Manage and organize your resume collection
            </p>
          </div>

          <Button
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-600 hover:bg-blue-700 text-white mt-4 md:mt-0"
            size="lg"
          >
            <Upload className="mr-2 h-5 w-5" />
            Upload Resume
          </Button>
          <Input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            disabled={isUploading}
          />
        </div>

        {/* Controls */}
        <div className="bg-card rounded-lg p-4 mb-8 border">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1 md:flex-none">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search resumes..."
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
                defaultValue="all"
                value={viewState.filter}
                onValueChange={(value) => setViewState(prev => ({
                  ...prev,
                  filter: value as FileFormat
                }))}
              >
                <TabsList>
                  <TabsTrigger value="all">
                    All ({resumeStats.total})
                  </TabsTrigger>
                  <TabsTrigger value="pdf">
                    PDF ({resumeStats.pdf})
                  </TabsTrigger>
                  <TabsTrigger value="doc-docx">
                    DOC/DOCX ({resumeStats.doc})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <Button
                  variant={viewState.mode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8 rounded-md"
                  onClick={() => setViewState(prev => ({
                    ...prev,
                    mode: "list"
                  }))}
                  title="List view"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewState.mode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8 rounded-md"
                  onClick={() => setViewState(prev => ({
                    ...prev,
                    mode: "grid"
                  }))}
                  title="Grid view"
                >
                  <Grid className="h-4 w-4" />
                </Button>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                  >
                    Sort: {viewState.sort === "date" ? "Date" : viewState.sort === "name" ? "Name" : "Size"}
                    {viewState.direction === "asc" ? " (A-Z)" : " (Z-A)"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => setViewState(prev => ({ ...prev, sort: "date", direction: "desc" }))}
                  >
                    Date (Newest first)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => setViewState(prev => ({ ...prev, sort: "date", direction: "asc" }))}
                  >
                    Date (Oldest first)
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
                    onClick={() => setViewState(prev => ({ ...prev, sort: "size", direction: "desc" }))}
                  >
                    Size (Largest first)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => setViewState(prev => ({ ...prev, sort: "size", direction: "asc" }))}
                  >
                    Size (Smallest first)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Loading state */}
        {isUploading && (
          <div className="p-6 bg-primary/10 rounded-lg mb-6 border border-primary/20">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mr-3"></div>
              <div>
                <p className="text-primary font-medium">Uploading resume...</p>
                <p className="text-primary/70 text-sm">Please wait while we process your file</p>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {resumes.length === 0 && !isUploading ? (
          <div className="text-center py-20 border rounded-lg bg-card">
            <div className="bg-muted h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-2xl font-medium">No resumes in your library</h3>
            <p className="mt-3 text-muted-foreground max-w-md mx-auto">
              Upload your resumes to keep them organized and easily accessible when applying for jobs.
            </p>
            <Button
              className="mt-8 px-6 py-6 h-auto text-base"
              onClick={() => fileInputRef.current?.click()}
              size="lg"
            >
              <Upload className="mr-2 h-5 w-5" />
              Upload Your First Resume
            </Button>
          </div>
        ) : (
          <>
            {/* Filtered state - no results */}
            {filteredResumes.length === 0 && (
              <div className="text-center py-16 border rounded-lg bg-card">
                <div className="bg-muted h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-medium">No matching resumes found</h3>
                <p className="mt-2 text-muted-foreground max-w-md mx-auto">
                  We couldn't find any resumes that match your current filters. Try adjusting your search criteria.
                </p>
                <Button
                  variant="outline"
                  className="mt-6"
                  onClick={() => setViewState(prev => ({ ...prev, search: "", filter: "all" }))}
                  size="lg"
                >
                  Clear All Filters
                </Button>
              </div>
            )}

            {/* Resume list */}
            {filteredResumes.length > 0 && (
              <>
                {viewState.mode === "grid" ? (
                  <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredResumes.map((resume) => (
                      <div
                        key={resume.id}
                        className="bg-card rounded-lg overflow-hidden cursor-pointer group hover:border-primary/50 border border-transparent transition-colors"
                        onClick={() => openPreviewModal(resume)}
                      >
                        {/* Card thumbnail */}
                        <div className="relative bg-muted h-48 overflow-hidden">
                          {getThumbnailPreview(resume)}
                        </div>

                        {/* Card content */}
                        <div className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium truncate">
                                {resume.title}
                              </h3>
                              <p className="text-sm text-muted-foreground truncate mt-1">
                                {resume.originalName}
                              </p>
                              <div className="flex items-center mt-2 text-xs text-muted-foreground">
                                <span className="inline-block px-2 py-1 rounded-md bg-accent mr-2">
                                  {resume.format === "application/pdf" ? "PDF" :
                                   resume.format.includes("word") ? "DOC" : "File"}
                                </span>
                                <span>{new Date(resume.lastUpdated).toLocaleDateString()}</span>
                                <span className="mx-1">•</span>
                                <span>{resume.size}</span>
                              </div>
                            </div>
                          </div>

                          {/* Action buttons - now in a more visible footer */}
                          <div className="flex justify-between items-center mt-4 pt-3 border-t">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                openPreviewModal(resume);
                              }}
                            >
                              Preview
                            </Button>

                            <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownload(resume);
                                }}
                                title="Download"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditModal(resume);
                                }}
                                title="Rename"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive/90"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDeleteModal(resume);
                                }}
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-card rounded-lg overflow-hidden border">
                    <div className="grid grid-cols-12 gap-4 p-3 bg-muted text-xs font-medium text-muted-foreground border-b">
                      <div className="col-span-5 md:col-span-6">Name</div>
                      <div className="col-span-2 md:col-span-2 text-center">Type</div>
                      <div className="col-span-3 md:col-span-2 text-center">Date</div>
                      <div className="col-span-2 md:col-span-2 text-right">Actions</div>
                    </div>

                    {filteredResumes.map((resume) => (
                      <div
                        key={resume.id}
                        className="grid grid-cols-12 gap-4 p-3 items-center border-b hover:bg-accent/50 cursor-pointer transition-colors"
                        onClick={() => openPreviewModal(resume)}
                      >
                        <div className="col-span-5 md:col-span-6 flex items-center min-w-0">
                          {resume.format === "application/pdf" ? (
                            <FileText className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
                          ) : resume.format.includes("word") ? (
                            <FileText className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0" />
                          ) : (
                            <FileText className="h-5 w-5 text-muted-foreground mr-3 flex-shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="truncate font-medium">{resume.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{resume.originalName}</p>
                          </div>
                        </div>

                        <div className="col-span-2 md:col-span-2 text-center">
                          <span className="inline-block px-2 py-1 rounded-md bg-muted text-xs">
                            {resume.format === "application/pdf" ? "PDF" :
                             resume.format.includes("word") ? "DOC" : "File"}
                          </span>
                        </div>

                        <div className="col-span-3 md:col-span-2 text-center text-xs text-muted-foreground">
                          {new Date(resume.lastUpdated).toLocaleDateString()}
                          <div className="text-muted-foreground/70">{resume.size}</div>
                        </div>

                        <div className="col-span-2 md:col-span-2 flex justify-end space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(resume);
                            }}
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(resume);
                            }}
                            title="Rename"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive/90"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeleteModal(resume);
                            }}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl">Rename Resume</DialogTitle>
          </DialogHeader>

          {selectedResume && (
            <div className="py-4">
              <div className="flex items-center mb-4">
                {selectedResume.format === "application/pdf" ? (
                  <FileText className="h-8 w-8 text-red-500 mr-3" />
                ) : selectedResume.format.includes("word") ? (
                  <FileText className="h-8 w-8 text-blue-500 mr-3" />
                ) : (
                  <FileText className="h-8 w-8 text-muted-foreground mr-3" />
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Original filename:</p>
                  <p>{selectedResume.originalName}</p>
                </div>
              </div>

              <Label htmlFor="resumeName" className="block mb-2">New display name</Label>
              <Input
                id="resumeName"
                value={editedResumeName}
                onChange={(e) => setEditedResumeName(e.target.value)}
                placeholder="Enter a new name for this resume"
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-2">
                This will change how the resume is displayed in your library. The original filename will be preserved when downloading.
              </p>
            </div>
          )}

          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={handleEditResume}
              disabled={!editedResumeName.trim()}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl text-destructive">Delete Resume</DialogTitle>
          </DialogHeader>

          {selectedResume && (
            <div className="py-4">
              <div className="flex items-start mb-4">
                <div className="bg-destructive/10 p-2 rounded-full mr-3">
                  <Trash2 className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="font-medium">Are you sure you want to delete this resume?</p>
                  <p className="text-muted-foreground mt-1">
                    This action cannot be undone. This will permanently delete the resume
                    "<span className="font-medium">{selectedResume.title}</span>" from your library.
                  </p>
                </div>
              </div>

              <div className="bg-muted rounded-md p-3 flex items-center mt-4">
                {selectedResume.format === "application/pdf" ? (
                  <FileText className="h-6 w-6 text-red-500 mr-3 flex-shrink-0" />
                ) : selectedResume.format.includes("word") ? (
                  <FileText className="h-6 w-6 text-blue-500 mr-3 flex-shrink-0" />
                ) : (
                  <FileText className="h-6 w-6 text-muted-foreground mr-3 flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="truncate">{selectedResume.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{selectedResume.originalName} • {selectedResume.size}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDeleteResume}
            >
              Delete Resume
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] h-[90vh] p-0">
          <div className="flex flex-col h-full">
            {/* Header with file info and actions */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center">
                {selectedResume?.format === "application/pdf" ? (
                  <FileText className="h-6 w-6 text-red-500 mr-3" />
                ) : selectedResume?.format?.includes("word") ? (
                  <FileText className="h-6 w-6 text-blue-500 mr-3" />
                ) : (
                  <FileText className="h-6 w-6 text-muted-foreground mr-3" />
                )}
                <div>
                  <h3 className="font-medium">{selectedResume?.title}</h3>
                  <p className="text-xs text-muted-foreground">{selectedResume?.originalName} • {selectedResume?.size}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectedResume && openEditModal(selectedResume)}
                >
                  <Edit2 className="h-4 w-4 mr-2" /> Rename
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectedResume && handleDownload(selectedResume)}
                >
                  <Download className="h-4 w-4 mr-2" /> Download
                </Button>
              </div>
            </div>

            {/* Preview content */}
            <div className="flex-1 overflow-hidden">
              {selectedResume?.format === "application/pdf" && selectedResume?.content ? (
                <iframe
                  src={selectedResume.content}
                  className="w-full h-full border-0"
                  title={selectedResume.title}
                />
              ) : selectedResume?.content ? (
                <div className="p-6 text-center h-full flex flex-col items-center justify-center">
                  <FileText className="h-20 w-20 text-muted-foreground" />
                  <p className="mt-4 text-lg">Preview not available for this file type</p>
                  <p className="mt-2 text-muted-foreground max-w-md">
                    This file format cannot be previewed directly in the browser.
                    Please download the file to view its contents.
                  </p>
                  <Button
                    className="mt-6"
                    onClick={() => selectedResume && handleDownload(selectedResume)}
                  >
                    <Download className="h-4 w-4 mr-2" /> Download File
                  </Button>
                </div>
              ) : (
                <div className="p-6 text-center h-full flex flex-col items-center justify-center">
                  <p className="text-muted-foreground">No content available to preview</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
