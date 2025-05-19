"use client"

import { useState, FormEvent } from "react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Upload } from "lucide-react"

interface CoverLetterUploadFormProps {
  onUploadSuccess: () => void;
}

export default function CoverLetterUploadForm({ onUploadSuccess }: CoverLetterUploadFormProps) {
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
      setError("Please enter a title for the cover letter.")
      toast({ title: "Validation Error", description: "Please enter a title.", variant: "destructive" })
      return
    }

    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("title", title)

    try {
      const response = await fetch("/api/cover-letters", {
        method: "POST",
        body: formData,
      })

      const responseData = await response.json()

      if (response.ok) {
        toast({ title: "Success", description: "Cover letter uploaded successfully." })
        setTitle("")
        setFile(null)
        const fileInput = document.getElementById('cover-letter-file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        
        onUploadSuccess()
      } else {
        setError(responseData.message || "Failed to upload cover letter.")
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
        <Label htmlFor="cover-letter-title">Cover Letter Title <span className="text-destructive">*</span></Label>
        <Input
          id="cover-letter-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Cover Letter for Acme Corp (Software Engineer)"
          required
          disabled={isUploading}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cover-letter-file-input">Cover Letter File <span className="text-destructive">*</span></Label>
        <Input
          id="cover-letter-file-input"
          type="file"
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx,.txt"
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
            Upload Cover Letter
          </>
        )}
      </Button>
    </form>
  )
}
