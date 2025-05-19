"use client"

import { useState, FormEvent } from "react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Upload } from "lucide-react"

interface ResumeUploadFormProps {
  onUploadSuccess: () => void;
}

export default function ResumeUploadForm({ onUploadSuccess }: ResumeUploadFormProps) {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0])
      setError(null) // Clear previous file error
    } else {
      setFile(null)
    }
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!file) {
      setError("Please select a file to upload.")
      toast({ title: "Validation Error", description: "Please select a file.", variant: "destructive" })
      return
    }
    if (!title.trim()) {
      setError("Please enter a title for the resume.")
      toast({ title: "Validation Error", description: "Please enter a title.", variant: "destructive" })
      return
    }

    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("title", title)

    try {
      const response = await fetch("/api/resumes", {
        method: "POST",
        body: formData,
        // Headers are not explicitly set for FormData, browser handles it
      })

      const responseData = await response.json()

      if (response.ok) {
        toast({ title: "Success", description: "Resume uploaded successfully." })
        setTitle("")
        setFile(null)
        // Clear file input visually (though its internal state is harder to reset)
        const fileInput = document.getElementById('resume-file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        
        onUploadSuccess() // Callback to refresh list in parent
      } else {
        setError(responseData.message || "Failed to upload resume.")
        toast({ title: "Upload Failed", description: responseData.message || "An error occurred.", variant: "destructive" })
      }
    } catch (err: any) {
      console.error("Upload error:", err)
      setError("An unexpected error occurred during upload. Check console for details.")
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="resume-title">Resume Title <span className="text-destructive">*</span></Label>
        <Input
          id="resume-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Software Engineer Resume (Spring 2024)"
          required
          disabled={isUploading}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="resume-file-input">Resume File <span className="text-destructive">*</span></Label>
        <Input
          id="resume-file-input"
          type="file"
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx,.txt" // Example accepted types
          required
          disabled={isUploading}
        />
        {file && <p className="text-xs text-muted-foreground mt-1">Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)</p>}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" disabled={isUploading} className="w-full sm:w-auto">
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Upload Resume
          </>
        )}
      </Button>
    </form>
  )
}
