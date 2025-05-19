"use client"

import { useEffect, useState } from "react"
import { JobBoard } from "@/components/job-board"
import type { JobData } from "@/lib/types" // Assuming JobData is correctly typed
import { useToast } from "@/hooks/use-toast" // For user feedback
// import { useRouter } from "next/navigation" // For potential redirect on auth error

export default function Home() {
  const [jobs, setJobs] = useState<JobData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  // const router = useRouter() // Initialize router if needed for auth redirects

  useEffect(() => {
    const fetchJobs = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch("/api/jobs")
        if (!response.ok) {
          if (response.status === 401) {
            // Handle unauthorized access, e.g., redirect to login
            // router.push("/login"); // Example redirect
            toast({ title: "Error", description: "Unauthorized. Please login.", variant: "destructive" })
            // Or set an error state to render a message
            setError("Unauthorized. Please login to view jobs.")
            setJobs([]) // Clear any existing jobs
            return
          }
          throw new Error(`Failed to fetch jobs: ${response.statusText}`)
        }
        const data: JobData[] = await response.json()
        setJobs(data)
      } catch (err: any) {
        console.error("Error fetching jobs:", err)
        setError(err.message || "An unexpected error occurred while fetching jobs.")
        toast({ title: "Error", description: err.message || "Could not fetch jobs.", variant: "destructive" })
        setJobs([]) // Clear jobs on error
      } finally {
        setIsLoading(false)
      }
    }

    fetchJobs()
  }, [toast]) // Add router to dependency array if used

  const handleAddJob = (newJob: JobData) => {
    setJobs((prevJobs) => [newJob, ...prevJobs]) // Add to the beginning for better UX
  }

  const handleEditJob = (updatedJob: JobData) => {
    setJobs((prevJobs) =>
      prevJobs.map((job) => (job.id === updatedJob.id ? updatedJob : job))
    )
  }

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job?")) {
      return
    }

    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) // Catch if no JSON body
        throw new Error(errorData.message || `Failed to delete job: ${response.statusText}`)
      }

      setJobs((prevJobs) => prevJobs.filter((job) => job.id !== jobId))
      toast({ title: "Success", description: "Job deleted successfully." })
    } catch (err: any) {
      console.error("Error deleting job:", err)
      toast({ title: "Error", description: err.message || "Could not delete job.", variant: "destructive" })
    }
  }
  
  if (isLoading) {
    // You can render a more sophisticated loading skeleton here
    return <main className="min-h-screen p-4">Loading jobs...</main>;
  }

  if (error) {
    return <main className="min-h-screen p-4 text-red-500">Error: {error}</main>;
  }

  return (
    <main className="min-h-screen">
      <JobBoard
        initialJobs={jobs} // Pass fetched jobs
        onAddJob={handleAddJob}
        onEditJob={handleEditJob}
        onDeleteJob={handleDeleteJob} // Pass delete handler
      />
    </main>
  )
}
